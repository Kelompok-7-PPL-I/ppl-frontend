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
