import { NUTRITION_DIMS, CATEGORY_DIMS, OFFSET, KELOMPOK_COUNT, IGNORED_KELOMPOK } from "./features";
import { NUTRITION_LABELS, CATEGORY_LABELS, kelompokLabel, labelOf } from "@/lib/food-labels";

/**
 * Menerjemahkan dimensi vector engine (lihat layout di features.ts) jadi kalimat yang bisa dibaca user.
 * Fungsi murni: dipakai di server (alasan rekomendasi) dan di browser (kartu "yang Pangi pelajari").
 */

export type DimensionGroup = "nutrition" | "kelompok" | "category";

export interface Dimension {
  index: number;
  group: DimensionGroup;
  label: string;
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** kelompokNames: id kelompok_bahan_pangan → nama di database */
export function describeDimension(index: number, kelompokNames: Map<number, string>): Dimension | null {
  if (index >= OFFSET.nutrition && index < OFFSET.kelompok) {
    const dim = NUTRITION_DIMS[index - OFFSET.nutrition];
    return { index, group: "nutrition", label: labelOf(NUTRITION_LABELS, dim) };
  }
  if (index >= OFFSET.kelompok && index < OFFSET.category) {
    const id = index - OFFSET.kelompok + 1;
    if (id > KELOMPOK_COUNT || IGNORED_KELOMPOK.has(id)) return null;
    return { index, group: "kelompok", label: kelompokLabel(kelompokNames.get(id)) };
  }
  const dim = CATEGORY_DIMS[index - OFFSET.category];
  return dim ? { index, group: "category", label: labelOf(CATEGORY_LABELS, dim) } : null;
}

/** Kalimat alasan untuk satu dimensi, mis. "Kamu suka umbi-umbian" */
export function reasonForDimension(d: Dimension): string {
  if (d.group === "nutrition") return `Cocok: ${lowerFirst(d.label)}`;
  if (d.group === "kelompok") return `Kamu suka ${lowerFirst(d.label)}`;
  return `Cocok buat ${lowerFirst(d.label)}`;
}

/**
 * Dimensi yang paling menyumbang kecocokan profil user dengan sebuah item
 * (kontribusi = profile[i] × item[i], bagian terbesar dari cosine similarity).
 */
export function strongestMatch(profile: number[], item: number[], kelompokNames: Map<number, string>): Dimension | null {
  let best: Dimension | null = null;
  let bestValue = 0;
  for (let i = 0; i < Math.min(profile.length, item.length); i++) {
    const value = profile[i] * item[i];
    if (value <= bestValue) continue;
    const d = describeDimension(i, kelompokNames);
    if (d) {
      best = d;
      bestValue = value;
    }
  }
  return best;
}

/** Dimensi terkuat di profil user per kelompok (untuk ditampilkan sebagai "selera yang dipelajari") */
export function topProfileDimensions(
  profile: number[],
  kelompokNames: Map<number, string>,
  limit = 6
): (Dimension & { strength: number })[] {
  const max = Math.max(...profile, 0);
  if (max <= 0) return [];
  return profile
    .map((value, index) => ({ value, d: describeDimension(index, kelompokNames) }))
    .filter((x): x is { value: number; d: Dimension } => !!x.d && x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map(({ value, d }) => ({ ...d, strength: value / max }));
}
