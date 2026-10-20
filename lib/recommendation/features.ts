/**
 * FEATURE CONFIG + fungsi murni (tanpa database) untuk recommendation engine.
 *
 * Layout vector (23 dimensi):
 *   [0-4]   nutrisi  : skor yang SEARAH dengan pilihan onboarding
 *                      (tinggi_protein, rendah_lemak, rendah_gula, tinggi_serat, rendah_kalori)
 *   [5-18]  bahan    : 14 kelompok_bahan_pangan (index = 5 + id_kelompok - 1)
 *   [19-22] kategori : diet, weight_gain, snack, high_protein
 *
 * Kelompok 8 (bumbu) dan 13 (bahan olahan/penyedap) tidak dihitung di vector
 * karena muncul di hampir semua resep dan tidak membedakan apa-apa.
 */

export const NUTRITION_DIMS = [
    'tinggi_protein',
    'rendah_lemak',
    'rendah_gula',
    'tinggi_serat',
    'rendah_kalori',
] as const;

export const KELOMPOK_COUNT = 14;
export const IGNORED_KELOMPOK: ReadonlySet<number> = new Set([8, 13]);
export const GULA_KELOMPOK = 12;

export const CATEGORY_DIMS = ['diet', 'weight_gain', 'snack', 'high_protein'] as const;

export const OFFSET = {
    nutrition: 0,
    kelompok: NUTRITION_DIMS.length,
    category: NUTRITION_DIMS.length + KELOMPOK_COUNT,
} as const;

export const VECTOR_SIZE = OFFSET.category + CATEGORY_DIMS.length; // 23

const round4 = (x: number) => Math.round(x * 10000) / 10000;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/* ------------------------------------------------------------------ */
/* Parsing gizi                                                        */
/* ------------------------------------------------------------------ */

export interface Nutrition {
    protein?: number;
    karbohidrat?: number;
    lemak?: number;
    serat?: number;
    kalori?: number;
}

const NUM = '(\\d+(?:[.,]\\d+)?)';
const NUTRITION_PATTERNS: [keyof Nutrition, RegExp][] = [
    ['kalori', new RegExp(`(?:kalori|energi)\\s*[:=]?\\s*${NUM}`, 'i')],
    ['protein', new RegExp(`protein\\s*[:=]?\\s*${NUM}`, 'i')],
    ['karbohidrat', new RegExp(`(?:karbohidrat|karbo)\\s*[:=]?\\s*${NUM}`, 'i')],
    ['lemak', new RegExp(`lemak(?:\\s+sehat)?\\s*[:=]?\\s*${NUM}`, 'i')],
    ['serat', new RegExp(`serat\\s*[:=]?\\s*${NUM}`, 'i')],
];

/** Hanya mengembalikan nilai yang benar-benar ada di teks (yang kosong = tidak diketahui). */
export function parseNutrition(text?: string | null): Nutrition {
    const out: Nutrition = {};
    if (!text) return out;

    const trimmed = text.trim();
    if (trimmed.startsWith('{')) {
        try {
            const obj = JSON.parse(trimmed) as Record<string, unknown>;
            for (const [key] of NUTRITION_PATTERNS) {
                const v = Number(obj[key]);
                if (obj[key] !== undefined && Number.isFinite(v)) out[key] = v;
            }
            return out;
        } catch {
            // bukan JSON valid, lanjut ke regex
        }
    }

    for (const [key, re] of NUTRITION_PATTERNS) {
        const m = text.match(re);
        if (m) {
            const v = parseFloat(m[1].replace(',', '.'));
            if (Number.isFinite(v)) out[key] = v;
        }
    }
    return out;
}

/** Nilai yang tidak diketahui diberi skor 0 (tidak ada bukti), bukan dianggap "rendah". */
export function nutritionScores(n: Nutrition, gulaShare: number | null): number[] {
    return [
        n.protein !== undefined ? clamp01(n.protein / 20) : 0, // tinggi_protein
        n.lemak !== undefined ? clamp01(1 - n.lemak / 30) : 0, // rendah_lemak
        gulaShare !== null ? clamp01(1 - gulaShare / 0.15) : 0, // rendah_gula (dari porsi bahan gula)
        n.serat !== undefined ? clamp01(n.serat / 10) : 0, // tinggi_serat
        n.kalori !== undefined ? clamp01(1 - n.kalori / 600) : 0, // rendah_kalori
    ];
}

/* ------------------------------------------------------------------ */
/* Bahan -> porsi per kelompok                                         */
/* ------------------------------------------------------------------ */

export interface IngredientInput {
    kelompok: number | null;
    grams: number;
}

export interface KelompokShares {
    shares: Record<number, number>;
    /** porsi gula (0-1) dari total bahan; null jika data bahan tidak ada */
    gulaShare: number | null;
}

export function computeKelompokShares(items: IngredientInput[]): KelompokShares {
    const valid = items.filter(
        (i) => i.kelompok !== null && !IGNORED_KELOMPOK.has(i.kelompok) && i.grams > 0
    );
    const total = valid.reduce((s, i) => s + i.grams, 0);
    if (total <= 0) return { shares: {}, gulaShare: null };

    const shares: Record<number, number> = {};
    for (const i of valid) {
        const k = i.kelompok as number;
        shares[k] = (shares[k] ?? 0) + i.grams / total;
    }
    return { shares, gulaShare: shares[GULA_KELOMPOK] ?? 0 };
}

/* ------------------------------------------------------------------ */
/* Kategori                                                            */
/* ------------------------------------------------------------------ */

export function categoryFlags(text?: string | null): number[] {
    const t = (text ?? '').toLowerCase().replace(/[\s_-]+/g, '_');
    return CATEGORY_DIMS.map((c) => (t.includes(c) ? 1 : 0));
}

/* ------------------------------------------------------------------ */
/* Vector item & user                                                  */
/* ------------------------------------------------------------------ */

export function buildItemVector(input: {
    nutrition: Nutrition;
    kelompok: KelompokShares;
    kategoriText?: string | null;
}): number[] {
    const v: number[] = new Array(VECTOR_SIZE).fill(0);

    nutritionScores(input.nutrition, input.kelompok.gulaShare).forEach((s, i) => {
        v[OFFSET.nutrition + i] = round4(s);
    });

    for (const [id, share] of Object.entries(input.kelompok.shares)) {
        const k = Number(id);
        if (k >= 1 && k <= KELOMPOK_COUNT && !IGNORED_KELOMPOK.has(k)) {
            v[OFFSET.kelompok + k - 1] = round4(share);
        }
    }

    categoryFlags(input.kategoriText).forEach((f, i) => {
        v[OFFSET.category + i] = f;
    });

    return v;
}

/** Vector eksplisit dari onboarding. Alergi & bahan yang dihindari TIDAK masuk (jadi hard filter). */
export function buildExplicitVector(pref: {
    nutrition: string[];
    kelompokIds: number[];
    categories: string[];
}): number[] {
    const v: number[] = new Array(VECTOR_SIZE).fill(0);

    NUTRITION_DIMS.forEach((dim, i) => {
        if (pref.nutrition.includes(dim)) v[OFFSET.nutrition + i] = 1;
    });

    for (const k of pref.kelompokIds) {
        if (k >= 1 && k <= KELOMPOK_COUNT && !IGNORED_KELOMPOK.has(k)) v[OFFSET.kelompok + k - 1] = 1;
    }

    CATEGORY_DIMS.forEach((dim, i) => {
        if (pref.categories.includes(dim)) v[OFFSET.category + i] = 1;
    });

    return v;
}

/** V_new = (1 - alpha) * V_user + alpha * V_item */
export function blendVectors(user: number[], item: number[], alpha: number): number[] {
    return user.map((u, i) => round4((1 - alpha) * u + alpha * (item[i] ?? 0)));
}

/** Bobot interaksi (view=1 ... purchase=5) -> learning rate 0.1 - 0.4 */
export function alphaFor(weight: number): number {
    return Math.min(0.4, Math.max(0.1, weight / 10));
}

export function cosine(a: number[], b: number[]): number {
    let dot = 0;
    let na = 0;
    let nb = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function isZeroVector(v: number[]): boolean {
    return v.every((x) => x === 0);
}

/** Json dari DB -> number[] dengan panjang yang diharapkan (null jika tidak cocok, mis. vector lama 32 dimensi). */
export function toVector(x: unknown, size: number = VECTOR_SIZE): number[] | null {
    if (!Array.isArray(x) || x.length !== size) return null;
    const arr = x.map(Number);
    return arr.every(Number.isFinite) ? arr : null;
}

export function toStringArray(x: unknown): string[] {
    return Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : [];
}

/* ------------------------------------------------------------------ */
/* Alergi (hard filter)                                                */
/* ------------------------------------------------------------------ */

export const ALLERGEN_PATTERNS: Record<string, RegExp> = {
    susu_sapi: /\bsusu\s+(?:sapi|cair|bubuk|kental|full)|\b(?:keju|yogh?urt|krim)\b/i,
    telur: /\btelur\b/i,
    kacang_pohon: /\b(?:almond|mete|kenari|hazelnut|pistachio|walnut)\b/i,
    kacang_tanah: /\bkacang\s+tanah\b/i,
    gandum: /\b(?:terigu|gandum)\b/i,
    makanan_laut: /\b(?:udang|ikan|cumi|kerang|kepiting|teri)\b/i,
};

export function containsAllergen(text: string, allergies: string[]): boolean {
    return allergies.some((a) => ALLERGEN_PATTERNS[a]?.test(text));
}

/* ------------------------------------------------------------------ */
/* Wilayah                                                             */
/* ------------------------------------------------------------------ */

const PROVINCE_ALIASES: Record<string, string> = {
    aceh: 'nanggroe aceh darussalam',
    'di aceh': 'nanggroe aceh darussalam',
    'di yogyakarta': 'daerah istimewa yogyakarta',
    yogyakarta: 'daerah istimewa yogyakarta',
    diy: 'daerah istimewa yogyakarta',
    'kep. riau': 'kepulauan riau',
    'kepulauan bangka belitung': 'bangka belitung',
    'kep. bangka belitung': 'bangka belitung',
};

/** "JAWA BARAT" / "Provinsi Jawa Barat" -> "jawa barat" */
export function normalizeProvince(s?: string | null): string | null {
    if (!s) return null;
    const t = s.toLowerCase().replace(/^provinsi\s+/, '').replace(/\s+/g, ' ').trim();
    if (!t) return null;
    return PROVINCE_ALIASES[t] ?? t;
}
