export const NUTRITION_FOCUS = ["tinggi_protein", "rendah_lemak", "rendah_gula", "tinggi_serat", "rendah_kalori"] as const;
export const CARB_SOURCES = ["umbi_ubian", "beras", "jagung", "sagu", "kentang"] as const;
export const ALLERGENS = ["susu_sapi", "telur", "kacang_pohon", "kacang_tanah", "gandum", "makanan_laut"] as const;
export const FOOD_CATEGORIES = ["diet", "weight_gain", "snack", "high_protein"] as const;

export interface OnboardingData {
  nutrition_preferences: string[];
  ingredient_preferences: string[];
  avoided_ingredients: string[];
  allergies: string[];
  category_preferences: string[];
}

// min: 0 = boleh array kosong (misalnya tidak punya alergi), tapi field tetap wajib dikirim
const RULES: { key: keyof OnboardingData; allowed: readonly string[]; min: number }[] = [
  { key: "nutrition_preferences", allowed: NUTRITION_FOCUS, min: 1 },
  { key: "ingredient_preferences", allowed: CARB_SOURCES, min: 1 },
  { key: "avoided_ingredients", allowed: CARB_SOURCES, min: 0 },
  { key: "allergies", allowed: ALLERGENS, min: 0 },
  { key: "category_preferences", allowed: FOOD_CATEGORIES, min: 1 },
];

export function validateOnboarding(
  body: unknown
): { ok: true; data: OnboardingData } | { ok: false; errors: string[] } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: ["Body harus berupa objek JSON"] };
  }

  const errors: string[] = [];
  const data: Partial<OnboardingData> = {};

  for (const { key, allowed, min } of RULES) {
    const value = (body as Record<string, unknown>)[key];
    if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
      errors.push(`${key} harus berupa array string`);
      continue;
    }
    const unique = [...new Set(value as string[])];
    const invalid = unique.filter((v) => !allowed.includes(v));
    if (invalid.length) errors.push(`${key} berisi nilai tidak valid: ${invalid.join(", ")}`);
    else if (unique.length < min) errors.push(`${key} minimal ${min} pilihan`);
    else data[key] = unique;
  }

  if (!errors.length) {
    const overlap = data.ingredient_preferences!.filter((v) => data.avoided_ingredients!.includes(v));
    if (overlap.length) {
      errors.push(`Bahan tidak boleh sekaligus disukai dan dihindari: ${overlap.join(", ")}`);
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, data: data as OnboardingData };
}