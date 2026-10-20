import prisma from '@/lib/prisma';
import {
    IGNORED_KELOMPOK,
    VECTOR_SIZE,
    containsAllergen,
    cosine,
    isZeroVector,
    normalizeProvince,
    toStringArray,
    toVector,
} from './features';
import { getUserProfileVector } from './vectorizer';

/** Bonus skor jika bahan/produk berasal dari provinsi user (regional weighting). */
export const WILAYAH_BONUS = 0.1;

export type RecommendationType = 'recipe' | 'product';

export interface Recommendation {
    id: number;
    name: string;
    /** cosine + bonus wilayah. 0 untuk rekomendasi default. */
    score: number;
    image: string | null;
    wilayah_match: boolean;
    source: 'personalized' | 'default';
    harga?: number;
    kategori?: string | null;
    waktu_masak?: number | null;
}

interface UserContext {
    profile: number[] | null; // null = belum ada data -> rekomendasi default
    allergies: string[];
    avoidedProducts: Set<number>;
    wilayahId: number | null;
}

const EMPTY_CONTEXT: UserContext = {
    profile: null,
    allergies: [],
    avoidedProducts: new Set(),
    wilayahId: null,
};

/* ------------------------------------------------------------------ */
/* Konteks user                                                        */
/* ------------------------------------------------------------------ */

async function resolveUserWilayah(userId: string): Promise<number | null> {
    const [alamat, wilayah] = await Promise.all([
        prisma.alamatPengguna.findMany({
            where: { id_user: userId, provinsi: { not: null } },
            orderBy: { is_utama: { sort: 'desc', nulls: 'last' } },
            select: { provinsi: true },
        }),
        prisma.wilayah.findMany({ select: { id_wilayah: true, nama_wilayah: true } }),
    ]);

    const byName = new Map<string, number>();
    for (const w of wilayah) {
        const key = normalizeProvince(w.nama_wilayah);
        if (key) byName.set(key, w.id_wilayah);
    }

    // Alamat utama dulu; kalau provinsinya tidak dikenali, coba alamat lain
    for (const a of alamat) {
        const key = normalizeProvince(a.provinsi);
        if (key && byName.has(key)) return byName.get(key) as number;
    }
    return null;
}

async function loadUserContext(userId: string): Promise<UserContext> {
    const [pref, profileRow, wilayahId] = await Promise.all([
        prisma.userPreference.findUnique({
            where: { id_user: userId },
            include: { avoided_produk: true },
        }),
        getUserProfileVector(userId),
        resolveUserWilayah(userId),
    ]);

    const vector = toVector(profileRow?.vector, VECTOR_SIZE);

    return {
        profile: vector && !isZeroVector(vector) ? vector : null,
        allergies: toStringArray(pref?.allergies),
        avoidedProducts: new Set((pref?.avoided_produk ?? []).map((a: { id_produk: number }) => a.id_produk)),
        wilayahId,
    };
}

/* ------------------------------------------------------------------ */
/* Resep                                                               */
/* ------------------------------------------------------------------ */

export async function recommendRecipes(userId: string | null, limit = 5): Promise<Recommendation[]> {
    const ctx = userId ? await loadUserContext(userId) : EMPTY_CONTEXT;

    const [recipes, vectors] = await Promise.all([
        prisma.resep.findMany({
            select: {
                id_resep: true,
                judul_resep: true,
                bahan_bahan: true,
                gambar_url: true,
                kategori_jenis: true,
                waktu_masak: true,
                resep_bahan_produk: {
                    select: {
                        id_produk: true,
                        takaran_resep: true,
                        produk: { select: { nama_produk: true, id_wilayah: true, kelompok_bahan_pangan: true } },
                    },
                },
            },
        }),
        prisma.itemVector.findMany({ where: { item_type: 'recipe' } }),
    ]);

    const vecMap = new Map<number, number[] | null>(
        vectors.map((v: { item_id: number; vector: unknown }) => [v.item_id, toVector(v.vector, VECTOR_SIZE)])
    );

    const scored: Recommendation[] = [];

    for (const r of recipes) {
        const ingredients = r.resep_bahan_produk;

        // Hard filter: bahan yang dihindari
        if (ingredients.some((i: { id_produk: number }) => ctx.avoidedProducts.has(i.id_produk))) continue;

        // Hard filter: alergi (teks resep + nama produk bahan)
        const text = [r.judul_resep, r.bahan_bahan ?? '', ...ingredients.map((i: any) => i.produk.nama_produk)].join(' ');
        if (containsAllergen(text, ctx.allergies)) continue;

        // Bonus wilayah: porsi bahan (tanpa bumbu) yang berasal dari provinsi user
        let wilayahShare = 0;
        if (ctx.wilayahId !== null) {
            let total = 0;
            let local = 0;
            for (const i of ingredients as any[]) {
                const k = i.produk.kelompok_bahan_pangan as number | null;
                const grams = i.takaran_resep ?? 0;
                if (k === null || IGNORED_KELOMPOK.has(k) || grams <= 0) continue;
                total += grams;
                if (i.produk.id_wilayah === ctx.wilayahId) local += grams;
            }
            wilayahShare = total > 0 ? local / total : 0;
        }

        const vec = vecMap.get(r.id_resep) ?? null;
        const sim = ctx.profile && vec ? cosine(ctx.profile, vec) : 0;

        scored.push({
            id: r.id_resep,
            name: r.judul_resep,
            score: ctx.profile ? Math.round((sim + WILAYAH_BONUS * wilayahShare) * 10000) / 10000 : 0,
            image: r.gambar_url,
            wilayah_match: wilayahShare > 0,
            source: ctx.profile ? 'personalized' : 'default',
            kategori: r.kategori_jenis,
            waktu_masak: r.waktu_masak,
        });
    }

    return rank(scored, ctx.profile !== null).slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Produk                                                              */
/* ------------------------------------------------------------------ */

export async function recommendProducts(userId: string | null, limit = 5): Promise<Recommendation[]> {
    const ctx = userId ? await loadUserContext(userId) : EMPTY_CONTEXT;

    const [products, vectors] = await Promise.all([
        prisma.produk.findMany({
            select: {
                id_produk: true,
                nama_produk: true,
                gambar_url: true,
                harga: true,
                is_promo: true,
                id_wilayah: true,
                dibuat_pada: true,
            },
            orderBy: [{ is_promo: 'desc' }, { dibuat_pada: 'desc' }],
        }),
        prisma.itemVector.findMany({ where: { item_type: 'product' } }),
    ]);

    const vecMap = new Map<number, number[] | null>(
        vectors.map((v: { item_id: number; vector: unknown }) => [v.item_id, toVector(v.vector, VECTOR_SIZE)])
    );

    const scored: Recommendation[] = [];

    for (const p of products) {
        if (ctx.avoidedProducts.has(p.id_produk)) continue;
        if (containsAllergen(p.nama_produk, ctx.allergies)) continue;

        const wilayahMatch = ctx.wilayahId !== null && p.id_wilayah === ctx.wilayahId;
        const vec = vecMap.get(p.id_produk) ?? null;
        const sim = ctx.profile && vec ? cosine(ctx.profile, vec) : 0;

        scored.push({
            id: p.id_produk,
            name: p.nama_produk,
            score: ctx.profile ? Math.round((sim + (wilayahMatch ? WILAYAH_BONUS : 0)) * 10000) / 10000 : 0,
            image: p.gambar_url,
            wilayah_match: wilayahMatch,
            source: ctx.profile ? 'personalized' : 'default',
            harga: Number(p.harga),
        });
    }

    // Default: urutan dari query (promo dulu, lalu terbaru); personalized: urut skor
    return (ctx.profile ? rank(scored, true) : scored).slice(0, limit);
}

/* ------------------------------------------------------------------ */

function rank(items: Recommendation[], personalized: boolean): Recommendation[] {
    if (personalized) {
        return [...items].sort((a, b) => b.score - a.score || a.id - b.id);
    }
    // Default: yang cocok wilayah user duluan, sisanya urut id
    return [...items].sort((a, b) => Number(b.wilayah_match) - Number(a.wilayah_match) || a.id - b.id);
}
