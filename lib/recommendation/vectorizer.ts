import prisma from '@/lib/prisma';
import {
  CATEGORY_DIMS,
  IGNORED_KELOMPOK,
  KELOMPOK_COUNT,
  NUTRITION_DIMS,
  VECTOR_SIZE,
  alphaFor,
  blendVectors,
  buildExplicitVector,
  buildItemVector,
  computeKelompokShares,
  parseNutrition,
  toStringArray,
  toVector,
} from './features';

/** Dipakai untuk dokumentasi / debugging. Sumber kebenaran ada di ./features.ts */
export const FEATURE_CONFIG = {
  size: VECTOR_SIZE,
  nutrition: NUTRITION_DIMS,
  kelompokCount: KELOMPOK_COUNT,
  ignoredKelompok: [...IGNORED_KELOMPOK],
  categories: CATEGORY_DIMS,
};

type ItemType = 'recipe' | 'product';

async function saveItemVector(item_id: number, item_type: ItemType, vector: number[]) {
  return prisma.itemVector.upsert({
    where: { item_id_item_type: { item_id, item_type } },
    update: { vector },
    create: { item_id, item_type, vector },
  });
}

/* ------------------------------------------------------------------ */
/* Item vector                                                         */
/* ------------------------------------------------------------------ */

/** Resep -> vector. Bahan diambil dari resep_bahan_produk (porsi gram per kelompok). */
export async function vectorizeRecipe(id_resep: number) {
  const resep = await prisma.resep.findUnique({
    where: { id_resep },
    include: {
      kategori: true,
      resep_bahan_produk: {
        include: { produk: { select: { kelompok_bahan_pangan: true } } },
      },
    },
  });
  if (!resep) throw new Error(`Resep dengan ID ${id_resep} tidak ditemukan`);

  const kelompok = computeKelompokShares(
    resep.resep_bahan_produk.map((r: any) => ({
      kelompok: r.produk.kelompok_bahan_pangan as number | null,
      grams: r.takaran_resep ?? 0,
    }))
  );

  const vector = buildItemVector({
    nutrition: parseNutrition(resep.informasi_gizi),
    kelompok,
    kategoriText: `${resep.kategori_jenis ?? ''} ${resep.kategori?.nama_kategori ?? ''}`,
  });

  return saveItemVector(id_resep, 'recipe', vector);
}

/** Produk -> vector. Satu produk = satu kelompok (porsi 100%). */
export async function vectorizeProduct(id_produk: number) {
  const produk = await prisma.produk.findUnique({
    where: { id_produk },
    select: { kelompok_bahan_pangan: true, informasi_gizi: true },
  });
  if (!produk) throw new Error(`Produk dengan ID ${id_produk} tidak ditemukan`);

  const kelompok = computeKelompokShares([
    { kelompok: produk.kelompok_bahan_pangan, grams: 1 },
  ]);

  const vector = buildItemVector({
    nutrition: parseNutrition(produk.informasi_gizi),
    kelompok,
  });

  return saveItemVector(id_produk, 'product', vector);
}

export async function vectorizeAllRecipes() {
  const all = await prisma.resep.findMany({ select: { id_resep: true } });
  const results = [];
  for (const r of all) results.push(await vectorizeRecipe(r.id_resep));
  return results;
}

export async function vectorizeAllProducts() {
  const all = await prisma.produk.findMany({ select: { id_produk: true } });
  const results = [];
  for (const p of all) results.push(await vectorizeProduct(p.id_produk));
  return results;
}

/* ------------------------------------------------------------------ */
/* User profile vector                                                 */
/* ------------------------------------------------------------------ */

/**
 * Bentuk explicit vector dari onboarding (cold start) lalu simpan.
 * Alergi dan bahan yang dihindari tidak masuk vector: keduanya jadi hard filter di engine.
 */
export async function initializeUserProfileVector(id_user: string): Promise<number[]> {
  const pref = await prisma.userPreference.findUnique({
    where: { id_user },
    include: { kelompok: true },
  });

  if (!pref) {
    const existing = await prisma.userProfileVector.findUnique({ where: { id_user } });
    const current = toVector(existing?.vector);
    if (current) return current;

    const zero: number[] = new Array(VECTOR_SIZE).fill(0);
    await prisma.userProfileVector.upsert({
      where: { id_user },
      update: { vector: zero },
      create: { id_user, vector: zero, interaction_count: 0 },
    });
    return zero;
  }

  const vector = buildExplicitVector({
    nutrition: toStringArray(pref.nutrition_preferences),
    kelompokIds: pref.kelompok.map((k: { id_kelompok: number }) => k.id_kelompok),
    categories: toStringArray(pref.category_preferences),
  });

  await prisma.userProfileVector.upsert({
    where: { id_user },
    update: { vector },
    create: { id_user, vector, interaction_count: 0 },
  });

  return vector;
}

/** Ambil profil user. Dibuat otomatis jika belum ada atau masih berformat lama (bukan 23 dimensi). */
export async function getUserProfileVector(id_user: string) {
  let profile = await prisma.userProfileVector.findUnique({ where: { id_user } });

  if (!profile || !toVector(profile.vector)) {
    await initializeUserProfileVector(id_user);
    profile = await prisma.userProfileVector.findUnique({ where: { id_user } });
  }
  return profile;
}

/**
 * Update profil dari satu interaksi: V_new = (1 - alpha) * V_user + alpha * V_item.
 * Signature sama dengan versi sebelumnya.
 */
export async function updateUserProfileVector(
  id_user: string,
  item_id: number,
  item_type: string,
  weight: number
) {
  const type: ItemType = item_type.toLowerCase() === 'product' ? 'product' : 'recipe';

  // 1. Item vector (dibuat jika belum ada atau masih berformat lama)
  let itemRecord = await prisma.itemVector.findUnique({
    where: { item_id_item_type: { item_id, item_type: type } },
  });
  let itemVector = toVector(itemRecord?.vector);
  if (!itemVector) {
    itemRecord = type === 'recipe' ? await vectorizeRecipe(item_id) : await vectorizeProduct(item_id);
    itemVector = toVector(itemRecord.vector);
  }
  if (!itemVector) throw new Error('Gagal membentuk item vector');

  // 2. Profil user saat ini
  const profile = await getUserProfileVector(id_user);
  const current = toVector(profile?.vector) ?? (await initializeUserProfileVector(id_user));

  // 3. Blend
  const next = blendVectors(current, itemVector, alphaFor(weight));

  return prisma.userProfileVector.upsert({
    where: { id_user },
    update: { vector: next, interaction_count: { increment: 1 } },
    create: { id_user, vector: next, interaction_count: 1 },
  });
}
