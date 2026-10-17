import prisma from '@/lib/prisma';

/**
 * FEATURE VOCABULARY CONFIG (Total 32 Dimensi)
 * - 5 Nutrisi (index 0-4)
 * - 20 Bahan (index 5-24)
 * - 7 Kategori (index 25-31)
 */
export const FEATURE_CONFIG = {
  nutrition: ['protein', 'karbohidrat', 'lemak', 'serat', 'kalori'],
  ingredients: [
    'beras', 'ayam', 'jagung', 'telur', 'daging', 
    'ikan', 'minyak', 'bawang', 'cabai', 'gula', 
    'garam', 'tepung', 'tempe', 'tahu', 'udang', 
    'sayur', 'susu', 'santan', 'kentang', 'wortel'
  ],
  categories: [
    'makanan utama', 'snack', 'minuman', 
    'dessert', 'sarapan', 'olahan jagung', 'makanan sehat'
  ]
};

/**
 * Ekstraksi angka nutrisi dari string JSON / text
 */
function parseNutrition(informasiGiziText?: string | null): Record<string, number> {
  const result: Record<string, number> = {
    protein: 0,
    karbohidrat: 0,
    lemak: 0,
    serat: 0,
    kalori: 0
  };

  if (!informasiGiziText) return result;

  try {
    // Jika formatnya JSON string
    if (informasiGiziText.trim().startsWith('{')) {
      const parsed = JSON.parse(informasiGiziText);
      Object.keys(result).forEach(key => {
        if (parsed[key] !== undefined) result[key] = Number(parsed[key]) || 0;
      });
      return result;
    }
  } catch (e) {
    // ignore json error, fallback to regex text parsing
  }

  // Fallback regex parsing text (misal "Protein: 10g, Kalori: 200 kcal")
  const text = informasiGiziText.toLowerCase();
  
  const proteinMatch = text.match(/protein\s*[:=]?\s*(\d+(\.\d+)?)/);
  if (proteinMatch) result.protein = parseFloat(proteinMatch[1]);

  const karboMatch = text.match(/(karbo|karbohidrat)\s*[:=]?\s*(\d+(\.\d+)?)/);
  if (karboMatch) result.karbohidrat = parseFloat(karboMatch[2]);

  const lemakMatch = text.match(/lemak\s*[:=]?\s*(\d+(\.\d+)?)/);
  if (lemakMatch) result.lemak = parseFloat(lemakMatch[1]);

  const seratMatch = text.match(/serat\s*[:=]?\s*(\d+(\.\d+)?)/);
  if (seratMatch) result.serat = parseFloat(seratMatch[1]);

  const kaloriMatch = text.match(/(kalori|calories)\s*[:=]?\s*(\d+(\.\d+)?)/);
  if (kaloriMatch) result.kalori = parseFloat(kaloriMatch[2]);

  return result;
}

/**
 * Mengubah item Resep atau Produk menjadi Vector 32 Dimensi
 */
export function generateItemVectorFromData(data: {
  bahanText?: string | null;
  giziText?: string | null;
  kategoriText?: string | null;
}): number[] {
  const vector: number[] = new Array(32).fill(0);

  // 1. Normalisasi Nutrisi (Index 0 - 4)
  const gizi = parseNutrition(data.giziText);
  vector[0] = Math.min(1, gizi.protein / 50);       // Max 50g
  vector[1] = Math.min(1, gizi.karbohidrat / 100);  // Max 100g
  vector[2] = Math.min(1, gizi.lemak / 50);         // Max 50g
  vector[3] = Math.min(1, gizi.serat / 30);         // Max 30g
  vector[4] = Math.min(1, gizi.kalori / 1000);      // Max 1000 kcal

  // 2. Encoding Bahan (Index 5 - 24)
  const bahanStr = (data.bahanText || '').toLowerCase();
  FEATURE_CONFIG.ingredients.forEach((ing, idx) => {
    if (bahanStr.includes(ing)) {
      vector[5 + idx] = 1;
    }
  });

  // 3. Encoding Kategori (Index 25 - 31)
  const katStr = (data.kategoriText || '').toLowerCase();
  FEATURE_CONFIG.categories.forEach((cat, idx) => {
    if (katStr.includes(cat)) {
      vector[25 + idx] = 1;
    }
  });

  return vector;
}

/**
 * Hasilkan dan Simpan Item Vector untuk Resep tertentu
 */
export async function vectorizeRecipe(id_resep: number) {
  const resep = await prisma.resep.findUnique({
    where: { id_resep },
    include: { kategori: true }
  });

  if (!resep) throw new Error(`Resep dengan ID ${id_resep} tidak ditemukan`);

  const vector = generateItemVectorFromData({
    bahanText: resep.bahan_bahan,
    giziText: resep.informasi_gizi,
    kategoriText: `${resep.kategori_jenis || ''} ${resep.kategori?.nama_kategori || ''}`
  });

  const itemVector = await prisma.itemVector.upsert({
    where: {
      item_id_item_type: {
        item_id: id_resep,
        item_type: 'recipe'
      }
    },
    update: {
      vector: vector,
      updated_at: new Date()
    },
    create: {
      item_id: id_resep,
      item_type: 'recipe',
      vector: vector
    }
  });

  return itemVector;
}

/**
 * Hasilkan dan Simpan Item Vector untuk Produk tertentu
 */
export async function vectorizeProduct(id_produk: number) {
  const produk = await prisma.produk.findUnique({
    where: { id_produk },
    include: { wilayah: true }
  });

  if (!produk) throw new Error(`Produk dengan ID ${id_produk} tidak ditemukan`);

  const vector = generateItemVectorFromData({
    bahanText: produk.nama_produk + ' ' + (produk.deskripsi || ''),
    giziText: produk.informasi_gizi,
    kategoriText: produk.nama_produk
  });

  const itemVector = await prisma.itemVector.upsert({
    where: {
      item_id_item_type: {
        item_id: id_produk,
        item_type: 'product'
      }
    },
    update: {
      vector: vector,
      updated_at: new Date()
    },
    create: {
      item_id: id_produk,
      item_type: 'product',
      vector: vector
    }
  });

  return itemVector;
}

/**
 * Mass vectorize semua resep
 */
export async function vectorizeAllRecipes() {
  const allRecipes = await prisma.resep.findMany({ select: { id_resep: true } });
  const results = [];
  for (const r of allRecipes) {
    results.push(await vectorizeRecipe(r.id_resep));
  }
  return results;
}

/**
 * Inisialisasi User Profile Vector dari preferensi onboarding (Cold Start)
 */
export async function initializeUserProfileVector(id_user: string): Promise<number[]> {
  const pref = await prisma.userPreference.findUnique({
    where: { id_user }
  });

  const vector: number[] = new Array(32).fill(0);

  // Jika user belum mengisi preferensi, kembalikan vektor nol
  if (!pref) {
    await prisma.userProfileVector.upsert({
      where: { id_user },
      update: { vector, updated_at: new Date() },
      create: { id_user, vector, interaction_count: 0 }
    });
    return vector;
  }

  const nutritionPrefs = Array.isArray(pref.nutrition_preferences)
    ? (pref.nutrition_preferences as string[])
    : [];
  const ingredientPrefs = Array.isArray(pref.ingredient_preferences)
    ? (pref.ingredient_preferences as string[])
    : [];
  const avoidedIngredients = Array.isArray(pref.avoided_ingredients)
    ? (pref.avoided_ingredients as string[])
    : [];
  const allergies = Array.isArray(pref.allergies)
    ? (pref.allergies as string[])
    : [];
  const categoryPrefs = Array.isArray(pref.category_preferences)
    ? (pref.category_preferences as string[])
    : [];

  // 1. Nutrisi (Index 0 - 4): protein, karbohidrat, lemak, serat, kalori
  vector[0] = nutritionPrefs.includes('tinggi_protein') || categoryPrefs.includes('high_protein') ? 0.8 : 0.5;
  vector[1] = categoryPrefs.includes('diet') ? 0.3 : categoryPrefs.includes('weight_gain') ? 0.8 : 0.5;
  vector[2] = nutritionPrefs.includes('rendah_lemak') ? 0.2 : 0.4;
  vector[3] = nutritionPrefs.includes('tinggi_serat') || categoryPrefs.includes('diet') ? 0.8 : 0.4;
  vector[4] = nutritionPrefs.includes('rendah_kalori') || categoryPrefs.includes('diet') ? 0.2 : categoryPrefs.includes('weight_gain') ? 0.8 : 0.5;

  // 2. Bahan-Bahan (Index 5 - 24)
  FEATURE_CONFIG.ingredients.forEach((ing, idx) => {
    const vIndex = 5 + idx;

    // Disukai
    if (ingredientPrefs.some(p => p.toLowerCase().includes(ing) || (ing === 'kentang' && p.includes('umbi_ubian')))) {
      vector[vIndex] = 1.0;
    }

    // Dihindari
    if (avoidedIngredients.some(a => a.toLowerCase().includes(ing) || (ing === 'kentang' && a.includes('umbi_ubian')))) {
      vector[vIndex] = -1.0;
    }

    // Alergi (Penalti Keras)
    if (
      (ing === 'telur' && allergies.includes('telur')) ||
      (ing === 'susu' && allergies.includes('susu_sapi')) ||
      ((ing === 'udang' || ing === 'ikan') && allergies.includes('makanan_laut')) ||
      (ing === 'tepung' && allergies.includes('gandum'))
    ) {
      vector[vIndex] = -1.0;
    }

    // Rendah gula
    if (ing === 'gula' && nutritionPrefs.includes('rendah_gula')) {
      vector[vIndex] = -0.8;
    }
  });

  // 3. Kategori (Index 25 - 31)
  // 'makanan utama', 'snack', 'minuman', 'dessert', 'sarapan', 'olahan jagung', 'makanan sehat'
  if (categoryPrefs.includes('snack')) vector[26] = 1.0;
  if (categoryPrefs.includes('diet')) vector[31] = 1.0; // makanan sehat
  if (categoryPrefs.includes('high_protein') || categoryPrefs.includes('weight_gain')) vector[25] = 1.0; // makanan utama
  if (ingredientPrefs.includes('jagung')) vector[30] = 0.8; // olahan jagung

  // Simpan / update ke database
  await prisma.userProfileVector.upsert({
    where: { id_user },
    update: {
      vector,
      updated_at: new Date()
    },
    create: {
      id_user,
      vector,
      interaction_count: 0
    }
  });

  return vector;
}

/**
 * Update User Profile Vector berdasarkan interaksi pengguna (Dynamic Behavioral Update)
 * Rumus: V_new = (1 - alpha) * V_user + alpha * V_item
 */
export async function updateUserProfileVector(
  id_user: string,
  item_id: number,
  item_type: string,
  weight: number
) {
  const normType = item_type.toLowerCase();

  // 1. Ambil atau generate Item Vector
  let itemVectorRecord = await prisma.itemVector.findUnique({
    where: {
      item_id_item_type: {
        item_id,
        item_type: normType
      }
    }
  });

  if (!itemVectorRecord) {
    if (normType === 'recipe') {
      itemVectorRecord = await vectorizeRecipe(item_id);
    } else if (normType === 'product') {
      itemVectorRecord = await vectorizeProduct(item_id);
    }
  }

  const itemVector: number[] = Array.isArray(itemVectorRecord?.vector)
    ? (itemVectorRecord.vector as unknown as number[])
    : new Array(32).fill(0);

  // 2. Ambil User Profile Vector saat ini
  let userProfile = await prisma.userProfileVector.findUnique({
    where: { id_user }
  });

  let currentVector: number[];
  if (!userProfile || !Array.isArray(userProfile.vector)) {
    // Inisialisasi awal jika belum ada
    currentVector = await initializeUserProfileVector(id_user);
  } else {
    currentVector = userProfile.vector as unknown as number[];
  }

  // 3. Hitung Alpha (Learning rate berdasarkan bobot interaksi)
  // Bobot: view=1, cart=2, favorite=3, purchase=5 -> alpha antara 0.1 s/d 0.4
  const alpha = Math.min(0.4, Math.max(0.1, weight / 10));

  // 4. Update vektor dimensi per dimensi
  const newVector: number[] = new Array(32).fill(0);
  for (let i = 0; i < 32; i++) {
    const userVal = currentVector[i] ?? 0;
    const itemVal = itemVector[i] ?? 0;

    // Jika user punya penalti alergi (< -0.5), jangan hilangkan alergi meski berinteraksi
    if (userVal < -0.5) {
      newVector[i] = userVal;
      continue;
    }

    const updatedVal = (1 - alpha) * userVal + alpha * itemVal;
    // Clamp pada rentang [-1.0, 1.0] dan bulatkan ke 4 desimal
    newVector[i] = Math.round(Math.max(-1, Math.min(1, updatedVal)) * 10000) / 10000;
  }

  // 5. Simpan pembaruan ke database
  const updated = await prisma.userProfileVector.upsert({
    where: { id_user },
    update: {
      vector: newVector,
      interaction_count: { increment: 1 },
      updated_at: new Date()
    },
    create: {
      id_user,
      vector: newVector,
      interaction_count: 1
    }
  });

  return updated;
}

/**
 * Mengambil User Profile Vector untuk user tertentu
 */
export async function getUserProfileVector(id_user: string) {
  let profile = await prisma.userProfileVector.findUnique({
    where: { id_user }
  });

  if (!profile) {
    // Auto-create jika belum ada
    await initializeUserProfileVector(id_user);
    profile = await prisma.userProfileVector.findUnique({
      where: { id_user }
    });
  }

  return profile;
}
