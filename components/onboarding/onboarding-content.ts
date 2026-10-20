import { NUTRITION_FOCUS, ALLERGENS, FOOD_CATEGORIES, type OnboardingData } from "@/lib/onboarding-options";
import { NUTRITION_LABELS, ALLERGEN_LABELS, CATEGORY_LABELS, kelompokLabel } from "@/lib/food-labels";

// Nama & persona avatar onboarding. Ganti di sini kalau tim mau nama lain.
export const ASSISTANT_NAME = "Pangi";

export type StepKey = keyof OnboardingData;
export type Value = string | number;

export interface Option {
  value: Value;
  label: string;
  /** Pengelompokan tampilan (dipakai pemilih produk) */
  group?: string;
}

export interface Step {
  key: StepKey;
  /** Label singkat untuk kartu rangkuman */
  title: string;
  /** Bubble pertanyaan dari avatar (boleh lebih dari satu bubble) */
  prompt: string[];
  hint: string;
  options: Option[];
  min: number;
  /** "search" = daftar panjang dengan kolom pencarian (produk) */
  picker: "chips" | "search";
  /** Label chip "tidak ada" untuk pertanyaan opsional (min = 0) */
  noneLabel?: string;
  /** Respons avatar setelah user menjawab */
  react: (selected: Value[]) => string;
}

/** Bentuk response GET /api/onboarding/options */
export interface OnboardingOptions {
  kelompok: { id: number; nama: string; jumlah_produk: number }[];
  produk: { id: number; nama: string; id_kelompok: number | null }[];
}

export const STEP_COUNT = 5;

const toOptions = <K extends string>(values: readonly K[], labels: Record<K, string>): Option[] =>
  values.map((value) => ({ value, label: labels[value] }));

/** Susun pertanyaan onboarding. Opsi kelompok & produk berasal dari database. */
export function buildSteps(opts?: OnboardingOptions): Step[] {
  const kelompokNama = new Map(opts?.kelompok.map((k) => [k.id, k.nama]));

  return [
    {
      key: "nutrition_preferences",
      title: "Fokus nutrisi",
      prompt: ["Pertama, kamu lagi fokus ke nutrisi apa nih?"],
      hint: "Boleh pilih lebih dari satu",
      options: toOptions(NUTRITION_FOCUS, NUTRITION_LABELS),
      min: 1,
      picker: "chips",
      react: (s) => (s.length >= 3 ? "Wah, kamu perhatian banget sama gizi. Mantap!" : "Siap, dicatat!"),
    },
    {
      key: "ingredient_preferences",
      title: "Bahan favorit",
      prompt: ["Kalau bahan pangan, kelompok mana yang paling kamu suka?"],
      hint: "Pilih minimal satu",
      options: (opts?.kelompok ?? []).map((k) => ({ value: k.id, label: kelompokLabel(k.nama) })),
      min: 1,
      picker: "chips",
      react: (s) => (s.length >= 4 ? "Wah, seleramu luas juga!" : "Oke, aku catat ya!"),
    },
    {
      key: "avoided_ingredients",
      title: "Bahan yang dihindari",
      prompt: ["Terus, ada bahan tertentu yang pengin kamu hindari?"],
      hint: "Cari nama bahannya, atau lewati kalau nggak ada",
      options: (opts?.produk ?? []).map((p) => ({
        value: p.id,
        label: p.nama,
        group: kelompokLabel(p.id_kelompok ? kelompokNama.get(p.id_kelompok) : null),
      })),
      min: 0,
      picker: "search",
      noneLabel: "Nggak ada",
      react: (s) => (s.length ? "Oke, nggak bakal aku sodorin." : "Sip, berarti semuanya aman."),
    },
    {
      key: "allergies",
      title: "Alergi",
      prompt: ["Penting nih: kamu punya alergi makanan?", "Biar aku nggak salah kasih rekomendasi."],
      hint: "Pilih semua yang sesuai",
      options: toOptions(ALLERGENS, ALLERGEN_LABELS),
      min: 0,
      picker: "chips",
      noneLabel: "Nggak punya alergi",
      react: (s) =>
        s.length ? "Makasih udah kasih tahu. Resep dengan bahan itu bakal aku saring." : "Syukurlah!",
    },
    {
      key: "category_preferences",
      title: "Tujuan makan",
      prompt: ["Terakhir! Kamu lagi cari makanan buat tujuan apa?"],
      hint: "Boleh pilih lebih dari satu",
      options: toOptions(FOOD_CATEGORIES, CATEGORY_LABELS),
      min: 1,
      picker: "chips",
      react: () => "Oke, lengkap!",
    },
  ];
}

export function labelsFor(step: Step, values: Value[]): string[] {
  return values.map((v) => step.options.find((o) => o.value === v)?.label ?? String(v));
}

export function answerText(step: Step, values: Value[]): string {
  if (!values.length) return step.noneLabel ?? "-";
  return labelsFor(step, values).join(", ");
}
