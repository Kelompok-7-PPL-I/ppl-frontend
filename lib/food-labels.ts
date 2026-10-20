import { NUTRITION_FOCUS, ALLERGENS, FOOD_CATEGORIES } from "@/lib/onboarding-options";

// Label tampilan untuk nilai preferensi. Dipakai onboarding, halaman profil, dan alasan rekomendasi.

export const NUTRITION_LABELS: Record<(typeof NUTRITION_FOCUS)[number], string> = {
  tinggi_protein: "Tinggi protein",
  rendah_lemak: "Rendah lemak",
  rendah_gula: "Rendah gula",
  tinggi_serat: "Tinggi serat",
  rendah_kalori: "Rendah kalori",
};

export const ALLERGEN_LABELS: Record<(typeof ALLERGENS)[number], string> = {
  susu_sapi: "Susu sapi",
  telur: "Telur",
  kacang_pohon: "Kacang pohon",
  kacang_tanah: "Kacang tanah",
  gandum: "Gandum",
  makanan_laut: "Makanan laut",
};

export const CATEGORY_LABELS: Record<(typeof FOOD_CATEGORIES)[number], string> = {
  diet: "Diet",
  weight_gain: "Naikin berat badan",
  snack: "Camilan",
  high_protein: "Menu tinggi protein",
};

// Nama di tabel kelompok_bahan_pangan cukup panjang untuk chip, jadi dipendekkan untuk tampilan
const KELOMPOK_SHORT: Record<string, string> = {
  "padi-padian dan serealia": "Padi & serealia",
  "umbi-umbian": "Umbi-umbian",
  "kacang-kacangan": "Kacang-kacangan",
  "biji-bijian": "Biji-bijian",
  "tepung dan pati": "Tepung & pati",
  sayuran: "Sayuran",
  "buah-buahan": "Buah-buahan",
  "rempah-rempah dan bumbu": "Rempah & bumbu",
  "bahan pangan hewani": "Pangan hewani",
  "susu, santan, dan produk turunannya": "Susu & santan",
  "minyak dan lemak": "Minyak & lemak",
  "gula dan pemanis": "Gula & pemanis",
  "bahan pangan olahan, penyedap, dan bahan tambahan pangan": "Olahan & penyedap",
  "hasil perairan": "Hasil perairan",
};

export function kelompokLabel(nama: string | null | undefined): string {
  if (!nama) return "Lainnya";
  const key = nama.trim().toLowerCase();
  return KELOMPOK_SHORT[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export const labelOf = <K extends string>(labels: Record<K, string>, value: string) =>
  (labels as Record<string, string>)[value] ?? value;
