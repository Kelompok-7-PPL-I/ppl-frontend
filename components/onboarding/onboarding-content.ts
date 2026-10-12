import {
  NUTRITION_FOCUS,
  CARB_SOURCES,
  ALLERGENS,
  FOOD_CATEGORIES,
  type OnboardingData,
} from "@/lib/onboarding-options";

// Nama & persona avatar onboarding. Ganti di sini kalau tim mau nama lain.
export const ASSISTANT_NAME = "Pangi";

export type StepKey = keyof OnboardingData;

export interface Option {
  value: string;
  label: string;
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
  /** Label chip "tidak ada" untuk pertanyaan opsional (min = 0) */
  noneLabel?: string;
  /** Respons avatar setelah user menjawab */
  react: (selected: string[]) => string;
}

const NUTRITION_LABELS: Record<(typeof NUTRITION_FOCUS)[number], string> = {
  tinggi_protein: "Tinggi protein",
  rendah_lemak: "Rendah lemak",
  rendah_gula: "Rendah gula",
  tinggi_serat: "Tinggi serat",
  rendah_kalori: "Rendah kalori",
};

const CARB_LABELS: Record<(typeof CARB_SOURCES)[number], string> = {
  umbi_ubian: "Umbi-umbian",
  beras: "Beras",
  jagung: "Jagung",
  sagu: "Sagu",
  kentang: "Kentang",
};

const ALLERGEN_LABELS: Record<(typeof ALLERGENS)[number], string> = {
  susu_sapi: "Susu sapi",
  telur: "Telur",
  kacang_pohon: "Kacang pohon",
  kacang_tanah: "Kacang tanah",
  gandum: "Gandum",
  makanan_laut: "Makanan laut",
};

const CATEGORY_LABELS: Record<(typeof FOOD_CATEGORIES)[number], string> = {
  diet: "Diet",
  weight_gain: "Naikin berat badan",
  snack: "Camilan",
  high_protein: "Menu tinggi protein",
};

const toOptions = <K extends string>(values: readonly K[], labels: Record<K, string>): Option[] =>
  values.map((value) => ({ value, label: labels[value] }));

const LOCAL_CARBS = ["umbi_ubian", "jagung", "sagu"];

export const STEPS: Step[] = [
  {
    key: "nutrition_preferences",
    title: "Fokus nutrisi",
    prompt: ["Pertama, kamu lagi fokus ke nutrisi apa nih?"],
    hint: "Boleh pilih lebih dari satu",
    options: toOptions(NUTRITION_FOCUS, NUTRITION_LABELS),
    min: 1,
    react: (s) =>
      s.length >= 3 ? "Wah, kamu perhatian banget sama gizi. Mantap!" : "Siap, dicatat!",
  },
  {
    key: "ingredient_preferences",
    title: "Karbo favorit",
    prompt: ["Kalau sumber karbohidrat, mana yang paling kamu suka?"],
    hint: "Pilih minimal satu",
    options: toOptions(CARB_SOURCES, CARB_LABELS),
    min: 1,
    react: (s) =>
      s.some((v) => LOCAL_CARBS.includes(v))
        ? "Asik, pangan lokal! Banyak resep seru dari bahan ini."
        : "Oke, aku catat ya!",
  },
  {
    key: "avoided_ingredients",
    title: "Karbo yang dihindari",
    prompt: ["Terus, ada sumber karbo yang pengin kamu hindari?"],
    hint: "Lewati kalau nggak ada",
    options: toOptions(CARB_SOURCES, CARB_LABELS),
    min: 0,
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
    noneLabel: "Nggak punya alergi",
    react: (s) =>
      s.length
        ? "Makasih udah kasih tahu. Resep dengan bahan itu bakal aku saring."
        : "Syukurlah!",
  },
  {
    key: "category_preferences",
    title: "Tujuan makan",
    prompt: ["Terakhir! Kamu lagi cari makanan buat tujuan apa?"],
    hint: "Boleh pilih lebih dari satu",
    options: toOptions(FOOD_CATEGORIES, CATEGORY_LABELS),
    min: 1,
    react: () => "Oke, lengkap!",
  },
];

/** Opsi yang boleh dipilih di sebuah step, mengikuti aturan validasi backend */
export function availableOptions(step: Step, answers: Partial<OnboardingData>): Option[] {
  // Bahan tidak boleh sekaligus disukai dan dihindari
  if (step.key === "avoided_ingredients") {
    const liked = answers.ingredient_preferences ?? [];
    return step.options.filter((o) => !liked.includes(o.value));
  }
  return step.options;
}

export function labelsFor(step: Step, values: string[]): string[] {
  return values.map((v) => step.options.find((o) => o.value === v)?.label ?? v);
}

export function answerText(step: Step, values: string[]): string {
  if (!values.length) return step.noneLabel ?? "-";
  return step.options
    .filter((o) => values.includes(o.value))
    .map((o) => o.label)
    .join(", ");
}
