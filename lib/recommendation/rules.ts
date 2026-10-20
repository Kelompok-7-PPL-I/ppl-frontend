import prisma from "@/lib/prisma";
import { CATEGORY_LABELS, NUTRITION_LABELS, kelompokLabel, labelOf } from "@/lib/food-labels";
import type { ReasonKind, RecoPage, RecoProduct, RecoRecipe, RecoResponse, RecoSection } from "./types";

/**
 * Engine rekomendasi SEMENTARA berbasis aturan (rule-based), memakai data asli:
 * preferensi onboarding, log interaksi (view/cart/favorite), riwayat belanja, favorit, dan relasi resep–produk.
 *
 * Dipisah jadi `loadSignals` (ambil data) dan `rankRecommendations` (hitung, tanpa I/O) supaya:
 * - bisa dites dengan data simulasi, dan
 * - gampang diganti engine vektor (item_vector/user_profile_vector). Bentuk response (RecoResponse)
 *   jangan diubah supaya UI tetap jalan.
 */

const LIMIT = { products: 12, recipes: 10, dashboardRecipes: 8, related: 10 };

// Log interaksi: bobot dari event (sama dengan route interaksi), meluruh seiring waktu
const INTERACTION_WINDOW_DAYS = 90;
const HALF_LIFE_DAYS = 14;
// Acuan "Karena kamu melihat X" hanya dari aktivitas yang masih baru
const ANCHOR_MAX_AGE_DAYS = 21;
// Ambang skor minimal supaya resep masuk "Resep yang cocok buat kamu"
const RECIPE_MIN_SCORE = 1.5;
// Kelompok bahan dapur umum (label dari food-labels): tetap boleh muncul, tapi bobot kemiripannya kecil
const STAPLE_GROUPS = new Set(["Rempah & bumbu", "Minyak & lemak", "Gula & pemanis", "Olahan & penyedap"]);

// Kata kunci alergen untuk menyaring resep/produk dari teks bahan. Heuristik: lebih baik menyaring
// berlebih daripada kecolongan. Akan lebih akurat kalau nanti ada kolom alergen di database.
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  susu_sapi: ["susu", "keju", "butter", "mentega", "yogurt", "yoghurt", "whey", "krim"],
  telur: ["telur", "telor", "mayones", "mayonnaise"],
  kacang_tanah: ["kacang tanah", "selai kacang", "bumbu kacang", "peanut"],
  kacang_pohon: ["almond", "kenari", "mete", "mede", "pistachio", "hazelnut", "pecan", "macadamia"],
  gandum: ["gandum", "terigu", "roti", "pasta", "semolina", "bulgur", "mie ", "mi instan"],
  makanan_laut: ["udang", "ikan", "cumi", "kerang", "kepiting", "rajungan", "teri", "lobster", "tiram", "ebi", "terasi"],
};

const hasAllergen = (text: string, allergies: string[]) => {
  const t = ` ${text.toLowerCase()} `;
  return allergies.some((a) => (ALLERGEN_KEYWORDS[a] ?? []).some((k) => t.includes(k)));
};

interface Gizi {
  kalori?: number;
  protein?: number;
  lemak?: number;
  serat?: number;
  gula?: number;
}

function parseGizi(text: string | null): Gizi {
  if (!text) return {};
  const t = text.toLowerCase();
  const grab = (name: string) => {
    const m = t.match(new RegExp(`${name}\\s*[:=]?\\s*(\\d+(?:[.,]\\d+)?)`));
    return m ? parseFloat(m[1].replace(",", ".")) : undefined;
  };
  return { kalori: grab("kalori"), protein: grab("protein"), lemak: grab("lemak"), serat: grab("serat"), gula: grab("gula") };
}

/** Cocokkan preferensi nutrisi dengan info gizi resep → label singkat (mis. "Protein 15g") */
function nutritionMatches(prefs: string[], gizi: Gizi, rawText: string | null): { pref: string; tag: string }[] {
  const out: { pref: string; tag: string }[] = [];
  const text = (rawText ?? "").toLowerCase();
  for (const p of prefs) {
    if (p === "tinggi_protein" && (gizi.protein ?? 0) >= 15) out.push({ pref: p, tag: `Protein ${gizi.protein}g` });
    if (p === "rendah_lemak" && gizi.lemak !== undefined && gizi.lemak <= 5) out.push({ pref: p, tag: `Lemak ${gizi.lemak}g` });
    if (p === "tinggi_serat" && (gizi.serat ?? 0) >= 6) out.push({ pref: p, tag: `Serat ${gizi.serat}g` });
    if (p === "rendah_kalori" && gizi.kalori !== undefined && gizi.kalori <= 250) out.push({ pref: p, tag: `${gizi.kalori} kkal` });
    if (p === "rendah_gula" && ((gizi.gula !== undefined && gizi.gula <= 5) || /rendah gula|tanpa gula|sugar free/.test(text)))
      out.push({ pref: p, tag: "Rendah gula" });
  }
  return out;
}

// "Weight Gain" → "weight_gain", sesuai nilai category_preferences
const normCategory = (v: string | null) => (v ?? "").trim().toLowerCase().replace(/\s+/g, "_");
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const shortName = (s: string) => s.replace(/\s*panganesia\s*/i, " ").trim();

type Reason = { text: string; w: number; kind: ReasonKind };
const pickReason = (rs: Reason[], fallback: Reason): Reason => rs.sort((a, b) => b.w - a.w)[0] ?? fallback;

// ─── 1. Ambil data ────────────────────────────────────────────────────────────

export async function loadSignals(userId: string) {
  const paidOrder = {
    status_pembayaran: { equals: "dibayar", mode: "insensitive" as const },
    OR: [{ order_status: null }, { order_status: { not: "dibatalkan" } }],
  };
  const since = new Date(Date.now() - INTERACTION_WINDOW_DAYS * 86_400_000);

  const [pref, products, recipes, purchases, favRecipes, favProducts, sold, recipeFavCounts, interactions] = await Promise.all([
    prisma.userPreference.findUnique({ where: { id_user: userId }, include: { kelompok: true, avoided_produk: true } }),
    prisma.produk.findMany({
      select: {
        id_produk: true,
        nama_produk: true,
        deskripsi: true,
        harga: true,
        gambar_url: true,
        stok: true,
        is_promo: true,
        satuan_produk: true,
        unit_nama: true,
        kelompok_bahan_pangan: true,
        kelompok: { select: { kelompok_pangan: true } },
      },
    }),
    prisma.resep.findMany({
      select: {
        id_resep: true,
        judul_resep: true,
        gambar_url: true,
        waktu_masak: true,
        kategori_jenis: true,
        informasi_gizi: true,
        bahan_bahan: true,
        resep_bahan_produk: { select: { id_produk: true } },
      },
    }),
    prisma.itemPesanan.findMany({
      where: { pesanan: { id_user: userId, ...paidOrder } },
      select: { id_produk: true },
      orderBy: { pesanan: { tanggal_pesanan: "desc" } },
      take: 100,
    }),
    prisma.favoritResep.findMany({ where: { id_user: userId }, select: { id_resep: true } }),
    prisma.favoritProduk.findMany({ where: { id_user: userId }, select: { id_produk: true } }),
    prisma.itemPesanan.groupBy({ by: ["id_produk"], where: { pesanan: paidOrder }, _sum: { kuantitas: true } }),
    prisma.favoritResep.groupBy({ by: ["id_resep"], _count: { id_resep: true } }),
    prisma.userInteraction.findMany({
      where: { id_user: userId, created_at: { gte: since } },
      select: { item_type: true, item_id: true, event: true, weight: true, created_at: true },
      orderBy: { created_at: "desc" },
      take: 300,
    }),
  ]);

  return {
    pref,
    products,
    recipes,
    purchases,
    favRecipes,
    favProducts,
    sold,
    recipeFavCounts,
    interactions: interactions.map((i) => ({ ...i, weight: Number(i.weight) })),
    now: Date.now(),
  };
}

export type Signals = Awaited<ReturnType<typeof loadSignals>>;

// ─── 2. Hitung rekomendasi (tanpa I/O) ────────────────────────────────────────

export function rankRecommendations(s: Signals, page: RecoPage): RecoResponse {
  const { pref, products, recipes } = s;

  // ── Sinyal user ──
  const likedKelompok = new Set(pref?.kelompok.map((k) => k.id_kelompok) ?? []);
  const avoided = new Set(pref?.avoided_produk.map((a) => a.id_produk) ?? []);
  const allergies = (pref?.allergies as string[] | undefined) ?? [];
  const nutritionPrefs = (pref?.nutrition_preferences as string[] | undefined) ?? [];
  const categoryPrefs = new Set((pref?.category_preferences as string[] | undefined) ?? []);
  const purchasedOrder = [...new Set(s.purchases.map((p) => p.id_produk))]; // terbaru dulu
  const purchased = new Set(purchasedOrder);
  const favRecipeIds = new Set(s.favRecipes.map((f) => f.id_resep));
  const favProductIds = new Set(s.favProducts.map((f) => f.id_produk));
  const soldCount = new Map(s.sold.map((x) => [x.id_produk, x._sum.kuantitas ?? 0]));
  const favCount = new Map(s.recipeFavCounts.map((r) => [r.id_resep, r._count.id_resep]));

  // Log interaksi → afinitas per item (bobot event × peluruhan waktu).
  // Event "purchase" dilewati karena pembelian sudah dihitung dari tabel pesanan.
  const productAffinity = new Map<number, number>();
  const recipeAffinity = new Map<number, number>();
  const recentProducts: number[] = []; // terbaru dulu, unik
  const recentRecipes: number[] = [];
  for (const it of s.interactions) {
    if (it.event === "purchase") continue;
    const ageDays = (s.now - new Date(it.created_at).getTime()) / 86_400_000;
    const w = it.weight * Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    const fresh = ageDays <= ANCHOR_MAX_AGE_DAYS;
    if (it.item_type === "product") {
      productAffinity.set(it.item_id, (productAffinity.get(it.item_id) ?? 0) + w);
      if (fresh && !recentProducts.includes(it.item_id)) recentProducts.push(it.item_id);
    } else if (it.item_type === "recipe") {
      recipeAffinity.set(it.item_id, (recipeAffinity.get(it.item_id) ?? 0) + w);
      if (fresh && !recentRecipes.includes(it.item_id)) recentRecipes.push(it.item_id);
    }
  }
  const hasInteractions = productAffinity.size + recipeAffinity.size > 0;

  const basis = [
    pref && "preferensi makananmu",
    hasInteractions && "aktivitasmu",
    purchased.size > 0 && "riwayat belanjamu",
    (favRecipeIds.size > 0 || favProductIds.size > 0) && "favoritmu",
  ].filter(Boolean) as string[];
  const personalized = basis.length > 0;

  // ── Katalog yang boleh direkomendasikan ──
  const productById = new Map(products.map((p) => [p.id_produk, p]));
  const recipeById = new Map(recipes.map((r) => [r.id_resep, r]));
  const productOk = (p: (typeof products)[number]) =>
    p.stok > 0 && !avoided.has(p.id_produk) && !hasAllergen(`${p.nama_produk} ${p.deskripsi ?? ""}`, allergies);
  const allowedProducts = products.filter(productOk);
  const allowedProductIds = new Set(allowedProducts.map((p) => p.id_produk));

  const recipeIngredients = (r: (typeof recipes)[number]) => r.resep_bahan_produk.map((b) => b.id_produk);
  const recipeOk = (r: (typeof recipes)[number]) =>
    !recipeIngredients(r).some((id) => avoided.has(id)) &&
    !hasAllergen(`${r.judul_resep} ${r.bahan_bahan ?? ""}`, allergies);
  const allowedRecipes = recipes.filter(recipeOk);

  // IDF bahan: bahan dapur umum (garam, minyak, gula) dipakai banyak resep → bobotnya kecil,
  // bahan khas (ubi ungu, rebung) → bobotnya besar. Dipakai untuk "dimasak bareng" & resep serupa.
  const recipeCountByProduct = new Map<number, number>();
  for (const r of recipes) for (const id of new Set(recipeIngredients(r))) recipeCountByProduct.set(id, (recipeCountByProduct.get(id) ?? 0) + 1);
  const idf = (productId: number) => Math.log((recipes.length + 1) / ((recipeCountByProduct.get(productId) ?? 0) + 0.5));
  // Katalog masih kecil, jadi IDF saja belum cukup: kelompok bumbu/minyak/gula/penyedap dianggap bahan dapur umum
  const isStaple = (productId: number) => STAPLE_GROUPS.has(kelompokLabel(productById.get(productId)?.kelompok?.kelompok_pangan));
  const ingredientWeight = (productId: number) => idf(productId) * (isStaple(productId) ? 0.3 : 1);
  const stapleFactor = (productId: number) => (isStaple(productId) ? 0.3 : 1);

  // Afinitas turunan: kelompok bahan & kategori resep yang sering disentuh
  const kelompokAffinity = new Map<number, number>();
  for (const [id, a] of productAffinity) {
    const k = productById.get(id)?.kelompok_bahan_pangan;
    if (k) kelompokAffinity.set(k, (kelompokAffinity.get(k) ?? 0) + a);
  }
  const categoryAffinity = new Map<string, number>();
  const viewedRecipeIngredients = new Map<number, string>(); // id_produk → judul resep yang dilihat
  for (const [id, a] of recipeAffinity) {
    const r = recipeById.get(id);
    if (!r) continue;
    const c = normCategory(r.kategori_jenis);
    if (c) categoryAffinity.set(c, (categoryAffinity.get(c) ?? 0) + a);
    for (const pid of recipeIngredients(r)) if (!viewedRecipeIngredients.has(pid)) viewedRecipeIngredients.set(pid, r.judul_resep);
  }

  const toProduct = (p: (typeof products)[number], reason: Reason, score: number): RecoProduct => ({
    type: "product",
    id: p.id_produk,
    name: p.nama_produk,
    price: Number(p.harga),
    image: p.gambar_url,
    unit: p.satuan_produk && p.unit_nama ? `${p.satuan_produk} ${p.unit_nama}` : null,
    reason: reason.text,
    reasonKind: reason.kind,
    score: Math.round(score * 100) / 100,
  });

  const toRecipe = (r: (typeof recipes)[number], reason: Reason, score: number, tags: string[]): RecoRecipe => ({
    type: "recipe",
    id: r.id_resep,
    title: r.judul_resep,
    image: r.gambar_url,
    minutes: r.waktu_masak,
    category: r.kategori_jenis,
    tags: tags.slice(0, 2),
    reason: reason.text,
    reasonKind: reason.kind,
    score: Math.round(score * 100) / 100,
  });

  // ── Resep yang cocok (dipakai juga untuk memilih produk) ──
  const scoredRecipes = allowedRecipes
    .filter((r) => !favRecipeIds.has(r.id_resep))
    .map((r) => {
      const reasons: Reason[] = [];
      const tags: string[] = [];
      const cat = normCategory(r.kategori_jenis);
      let score = Math.min(favCount.get(r.id_resep) ?? 0, 10) * 0.1;

      if (categoryPrefs.has(cat)) {
        score += 3;
        reasons.push({ text: `Cocok buat ${lowerFirst(labelOf(CATEGORY_LABELS, cat))}`, w: 3, kind: "preference" });
        if (r.kategori_jenis) tags.push(r.kategori_jenis);
      }
      for (const m of nutritionMatches(nutritionPrefs, parseGizi(r.informasi_gizi), r.informasi_gizi)) {
        score += 2;
        reasons.push({ text: `${labelOf(NUTRITION_LABELS, m.pref)}: ${m.tag.toLowerCase()}`, w: 2.2, kind: "preference" });
        tags.push(m.tag);
      }
      const liked = recipeIngredients(r).filter((id) => likedKelompok.has(productById.get(id)?.kelompok_bahan_pangan ?? -1));
      if (liked.length) {
        score += Math.min(liked.length, 3);
        const k = productById.get(liked[0])?.kelompok?.kelompok_pangan;
        reasons.push({ text: `Pakai ${lowerFirst(kelompokLabel(k))} favoritmu`, w: 1 + liked.length * 0.5, kind: "preference" });
      }
      // Interaksi: kategori resep yang sering dilihat & bahan yang sering dilihat
      const catAff = categoryAffinity.get(cat) ?? 0;
      if (catAff > 0 && !recipeAffinity.has(r.id_resep)) {
        score += Math.min(2, catAff * 0.6);
        reasons.push({ text: "Mirip resep yang kamu lihat", w: 1.5 + Math.min(1, catAff * 0.2), kind: "viewed" });
      }
      const seen = recipeIngredients(r).filter((id) => productAffinity.has(id));
      if (seen.length) {
        score += Math.min(2, seen.reduce((sum, id) => sum + (productAffinity.get(id) ?? 0), 0) * 0.5);
        const name = shortName(productById.get(seen[0])?.nama_produk ?? "");
        reasons.push({ text: `Pakai ${name} yang kamu lihat`, w: 1.8, kind: "viewed" });
      }
      const bought = recipeIngredients(r).filter((id) => purchased.has(id));
      if (bought.length) {
        score += 2;
        const name = shortName(productById.get(bought[0])?.nama_produk ?? "");
        reasons.push({ text: `Pakai ${name} yang pernah kamu beli`, w: 2.5, kind: "purchase" });
      }
      const reason = pickReason(reasons, { text: "Banyak difavoritkan", w: 0, kind: "popular" });
      return { r, score, reason, tags };
    })
    .sort((a, b) => b.score - a.score);

  const recipesForYou = scoredRecipes.filter((x) => x.score >= RECIPE_MIN_SCORE);

  // ── Produk pilihan ──
  const topRecipeIngredients = new Map<number, string>();
  for (const { r } of recipesForYou.slice(0, 3)) {
    for (const id of recipeIngredients(r)) if (!topRecipeIngredients.has(id)) topRecipeIngredients.set(id, r.judul_resep);
  }
  const favRecipeIngredients = new Map<number, string>();
  for (const r of recipes.filter((x) => favRecipeIds.has(x.id_resep))) {
    for (const id of recipeIngredients(r)) if (!favRecipeIngredients.has(id)) favRecipeIngredients.set(id, r.judul_resep);
  }

  const productsForYou = allowedProducts
    .map((p) => {
      const reasons: Reason[] = [];
      let score = Math.log1p(soldCount.get(p.id_produk) ?? 0) * 0.2;
      if (likedKelompok.has(p.kelompok_bahan_pangan ?? -1)) {
        score += 3;
        reasons.push({ text: `Kamu suka ${lowerFirst(kelompokLabel(p.kelompok?.kelompok_pangan))}`, w: 3, kind: "preference" });
      }
      // Interaksi: produk yang sering dilihat/disimpan tapi belum dibeli, kelompok yang sering dilihat,
      // dan bahan dari resep yang dilihat
      const aff = productAffinity.get(p.id_produk) ?? 0;
      if (aff > 0 && !purchased.has(p.id_produk)) {
        score += Math.min(2.5, aff);
        reasons.push({ text: "Kamu sempat lihat ini", w: 1.2 + Math.min(1.5, aff * 0.3), kind: "viewed" });
      }
      const kAff = kelompokAffinity.get(p.kelompok_bahan_pangan ?? -1) ?? 0;
      if (kAff > 0 && aff === 0) {
        score += Math.min(1.5, kAff * 0.4);
        reasons.push({ text: `Sering kamu lihat: ${lowerFirst(kelompokLabel(p.kelompok?.kelompok_pangan))}`, w: 1.4, kind: "viewed" });
      }
      if (viewedRecipeIngredients.has(p.id_produk)) {
        score += 1.5 * stapleFactor(p.id_produk);
        reasons.push({ text: `Bahan ${shortName(viewedRecipeIngredients.get(p.id_produk)!)}`, w: 1.6, kind: "viewed" });
      }
      if (favRecipeIngredients.has(p.id_produk)) {
        score += 2.5 * stapleFactor(p.id_produk);
        reasons.push({ text: "Bahan resep favoritmu", w: 2.8, kind: "favorite" });
      }
      if (topRecipeIngredients.has(p.id_produk)) {
        score += 2 * stapleFactor(p.id_produk);
        reasons.push({ text: `Bahan ${shortName(topRecipeIngredients.get(p.id_produk)!)}`, w: 2, kind: "recipe" });
      }
      if (favProductIds.has(p.id_produk)) {
        score += 1;
        reasons.push({ text: "Ada di favoritmu", w: 1, kind: "favorite" });
      }
      if (p.is_promo) {
        score += 0.5;
        reasons.push({ text: "Lagi promo", w: 0.5, kind: "promo" });
      }
      return { p, score, reason: pickReason(reasons, { text: "Banyak dibeli", w: 0, kind: "popular" }) };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, LIMIT.products)
    .map((x) => toProduct(x.p, x.reason, x.score));

  // ── Produk terkait (dimasak bareng di resep yang sama, lalu sekelompok) ──
  const recipesUsing = (productId: number) => allowedRecipes.filter((r) => recipeIngredients(r).includes(productId));

  const relatedProducts = (anchor: (typeof products)[number], kind: ReasonKind) => {
    const related = new Map<number, { count: number; recipe: string }>();
    for (const r of recipesUsing(anchor.id_produk)) {
      for (const id of recipeIngredients(r)) {
        if (id === anchor.id_produk || !allowedProductIds.has(id)) continue;
        const cur = related.get(id);
        related.set(id, { count: (cur?.count ?? 0) + 1, recipe: cur?.recipe ?? r.judul_resep });
      }
    }
    const items = [...related.entries()]
      .map(([id, v]) => ({ id, v, score: v.count * ingredientWeight(id) }))
      .sort((a, b) => b.score - a.score)
      .map(({ id, v, score }) => toProduct(productById.get(id)!, { text: `Dimasak bareng di ${shortName(v.recipe)}`, w: 0, kind }, score));
    if (items.length < 4) {
      for (const p of allowedProducts) {
        if (items.length >= 6) break;
        if (p.id_produk === anchor.id_produk || related.has(p.id_produk)) continue;
        if (p.kelompok_bahan_pangan && p.kelompok_bahan_pangan === anchor.kelompok_bahan_pangan) {
          items.push(toProduct(p, { text: `Sejenis ${shortName(anchor.nama_produk)}`, w: 0, kind }, 0.5));
        }
      }
    }
    return items.slice(0, LIMIT.related);
  };

  // Resep serupa: kategori sama + bahan yang sama
  const similarRecipes = (anchor: (typeof recipes)[number]) => {
    const anchorIngredients = new Set(recipeIngredients(anchor));
    const anchorCat = normCategory(anchor.kategori_jenis);
    return allowedRecipes
      .filter((r) => r.id_resep !== anchor.id_resep)
      .map((r) => {
        const shared = recipeIngredients(r)
          .filter((id) => anchorIngredients.has(id))
          .sort((a, b) => ingredientWeight(b) - ingredientWeight(a));
        const sameCat = !!anchorCat && normCategory(r.kategori_jenis) === anchorCat;
        const score = shared.reduce((sum, id) => sum + ingredientWeight(id), 0) + (sameCat ? 1.5 : 0);
        // Alasan pakai bahan paling khas; kalau cuma berbagi bahan dapur umum, sebut kategorinya
        const distinctive = shared.length > 0 && !isStaple(shared[0]);
        const reason: Reason = distinctive
          ? { text: `Sama-sama pakai ${shortName(productById.get(shared[0])?.nama_produk ?? "")}`, w: 0, kind: "viewed" }
          : { text: `Sama-sama menu ${anchor.kategori_jenis?.toLowerCase() ?? "serupa"}`, w: 0, kind: "viewed" };
        return { r, score, reason };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, LIMIT.related)
      .map((x) => toRecipe(x.r, x.reason, x.score, x.r.kategori_jenis ? [x.r.kategori_jenis] : []));
  };

  // ── "Karena kamu melihat X" (log interaksi) ──
  const becauseViewedProducts = (): RecoSection | null => {
    // Produk yang dilihat tapi belum dibeli; kalau tidak ada, pakai resep terakhir yang dilihat
    const anchorProduct = recentProducts
      .map((id) => productById.get(id))
      .find((p) => p && !purchased.has(p.id_produk) && allowedProductIds.has(p.id_produk));
    if (anchorProduct) {
      const items = relatedProducts(anchorProduct, "viewed");
      if (!items.length) return null;
      return {
        id: "because-viewed-products",
        variant: "because-viewed",
        itemType: "product",
        title: `Karena kamu melihat ${shortName(anchorProduct.nama_produk)}`,
        subtitle: "Bahan yang sering dimasak bareng",
        anchor: { type: "product", id: anchorProduct.id_produk, name: anchorProduct.nama_produk },
        items,
      };
    }
    const anchorRecipe = recentRecipes.map((id) => recipeById.get(id)).find((r) => r && recipeOk(r));
    if (!anchorRecipe) return null;
    const items = recipeIngredients(anchorRecipe)
      .filter((id) => allowedProductIds.has(id))
      .map((id) => toProduct(productById.get(id)!, { text: "", w: 0, kind: "viewed" }, 1));
    if (items.length < 2) return null;
    return {
      id: "because-viewed-products",
      variant: "because-viewed",
      itemType: "product",
      title: `Karena kamu melihat ${anchorRecipe.judul_resep}`,
      subtitle: "Bahan-bahannya ada di Panganesia",
      anchor: { type: "recipe", id: anchorRecipe.id_resep, name: anchorRecipe.judul_resep },
      items,
    };
  };

  const becauseViewedRecipes = (): RecoSection | null => {
    const anchor = recentRecipes.map((id) => recipeById.get(id)).find((r) => !!r);
    if (!anchor) return null;
    const items = similarRecipes(anchor);
    if (!items.length) return null;
    return {
      id: "because-viewed-recipes",
      variant: "because-viewed",
      itemType: "recipe",
      title: `Karena kamu melihat ${anchor.judul_resep}`,
      subtitle: "Resep serupa yang mungkin kamu suka",
      anchor: { type: "recipe", id: anchor.id_resep, name: anchor.judul_resep },
      items,
    };
  };

  // ── "Karena kamu membeli X" ──
  const becauseBoughtProducts = (): RecoSection | null => {
    const anchorId = purchasedOrder.find((id) => recipesUsing(id).length > 0) ?? purchasedOrder[0];
    const anchor = anchorId ? productById.get(anchorId) : undefined;
    if (!anchor) return null;
    const items = relatedProducts(anchor, "purchase");
    if (!items.length) return null;
    return {
      id: "because-bought-products",
      variant: "because-bought",
      itemType: "product",
      title: `Karena kamu membeli ${shortName(anchor.nama_produk)}`,
      subtitle: "Bahan yang sering dimasak bareng",
      anchor: { type: "product", id: anchor.id_produk, name: anchor.nama_produk },
      items,
    };
  };

  const becauseBoughtRecipes = (): RecoSection | null => {
    const anchorId = purchasedOrder.find((id) => recipesUsing(id).length > 0);
    const anchor = anchorId ? productById.get(anchorId) : undefined;
    if (!anchor) return null;
    const name = shortName(anchor.nama_produk);
    const items = recipesUsing(anchor.id_produk)
      .map((r) => ({ r, n: recipeIngredients(r).filter((id) => purchased.has(id)).length }))
      .sort((a, b) => b.n - a.n)
      .map(({ r, n }) => toRecipe(r, { text: `Pakai ${name}`, w: 0, kind: "purchase" }, n, r.kategori_jenis ? [r.kategori_jenis] : []));
    return {
      id: "because-bought-recipes",
      variant: "because-bought",
      itemType: "recipe",
      title: `Karena kamu membeli ${name}`,
      subtitle: "Resep yang bisa langsung kamu masak",
      anchor: { type: "product", id: anchor.id_produk, name: anchor.nama_produk },
      items: items.slice(0, LIMIT.related),
    };
  };

  // ── "Lengkapi bahan resep" ──
  const completeRecipe = (skipRecipeId?: number): RecoSection | null => {
    const fav = recipes.find(
      (r) => favRecipeIds.has(r.id_resep) && r.id_resep !== skipRecipeId && recipeOk(r) && recipeIngredients(r).length >= 2
    );
    const target = fav ?? recipesForYou.find((x) => x.r.id_resep !== skipRecipeId)?.r;
    if (!target) return null;
    const items = recipeIngredients(target)
      .map((id) => productById.get(id))
      .filter((p): p is (typeof products)[number] => !!p && allowedProductIds.has(p.id_produk))
      .map((p) => toProduct(p, { text: "", w: 0, kind: "recipe" }, 1));
    if (items.length < 2) return null;
    return {
      id: "complete-recipe",
      variant: "complete-recipe",
      itemType: "product",
      title: `Lengkapi bahan ${target.judul_resep}`,
      subtitle: fav ? "Dari resep favoritmu, semua bahannya ada di Panganesia" : "Resep pilihan Pangi, semua bahannya ada di Panganesia",
      anchor: { type: "recipe", id: target.id_resep, name: target.judul_resep },
      items,
    };
  };

  // ── Cadangan non-personal ──
  const popularProducts: RecoSection = {
    id: "popular-products",
    variant: "popular",
    itemType: "product",
    title: "Lagi banyak dibeli",
    subtitle: "Bahan pangan favorit pembeli Panganesia",
    items: [...allowedProducts]
      .sort((a, b) => (soldCount.get(b.id_produk) ?? 0) - (soldCount.get(a.id_produk) ?? 0))
      .slice(0, LIMIT.products)
      .map((p) => toProduct(p, { text: "Banyak dibeli", w: 0, kind: "popular" }, soldCount.get(p.id_produk) ?? 0)),
  };
  const popularRecipes: RecoSection = {
    id: "popular-recipes",
    variant: "popular",
    itemType: "recipe",
    title: "Resep yang lagi disukai",
    subtitle: "Paling banyak difavoritkan pengguna lain",
    items: [...allowedRecipes]
      .sort((a, b) => (favCount.get(b.id_resep) ?? 0) - (favCount.get(a.id_resep) ?? 0))
      .slice(0, LIMIT.recipes)
      .map((r) =>
        toRecipe(r, { text: "Banyak difavoritkan", w: 0, kind: "popular" }, favCount.get(r.id_resep) ?? 0, r.kategori_jenis ? [r.kategori_jenis] : [])
      ),
  };

  const recipeSection = (limit: number): RecoSection => ({
    id: "for-you-recipes",
    variant: "for-you",
    itemType: "recipe",
    title: "Resep yang cocok buat kamu",
    subtitle: !pref
      ? "Dari aktivitas, belanja, dan favoritmu"
      : avoided.size
        ? "Sesuai seleramu, tanpa bahan yang kamu hindari"
        : "Sesuai tujuan makan dan nutrisi pilihanmu",
    items: recipesForYou.slice(0, limit).map((x) => toRecipe(x.r, x.reason, x.score, x.tags)),
  });

  let sections: (RecoSection | null)[];
  if (!personalized) {
    sections = page === "dashboard" ? [popularProducts, popularRecipes] : [popularRecipes];
  } else if (page === "dashboard") {
    const viewed = becauseViewedProducts();
    sections = [
      {
        id: "for-you-products",
        variant: "for-you",
        itemType: "product",
        title: "Pilihan Pangi buat kamu",
        subtitle: "Disusun dari selera dan kebiasaan belanjamu",
        items: productsForYou,
      },
      recipeSection(LIMIT.dashboardRecipes),
      viewed,
      becauseBoughtProducts(),
      // Hindari dua baris berisi bahan resep yang sama
      completeRecipe(viewed?.anchor?.type === "recipe" ? viewed.anchor.id : undefined),
    ];
  } else {
    sections = [recipeSection(LIMIT.recipes), becauseViewedRecipes(), becauseBoughtRecipes()];
  }

  return {
    personalized,
    hasPreferences: !!pref,
    basis,
    engine: "rules",
    sections: sections.filter((x): x is RecoSection => !!x && x.items.length > 0),
  };
}

export async function buildRecommendations(userId: string, page: RecoPage): Promise<RecoResponse> {
  return rankRecommendations(await loadSignals(userId), page);
}
