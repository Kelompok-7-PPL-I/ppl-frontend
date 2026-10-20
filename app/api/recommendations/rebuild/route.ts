import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { vectorizeAllProducts, vectorizeAllRecipes } from '@/lib/recommendation/vectorizer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/recommendations/rebuild  (khusus admin)
 * Generate ulang item_vector semua resep & produk. Jalankan setiap kali data gizi,
 * bahan (resep_bahan_produk), kelompok produk, atau kategori resep berubah.
 */
export async function POST() {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; peran?: string } | undefined;

    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.peran !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const recipes = await vectorizeAllRecipes();
        const products = await vectorizeAllProducts();
        return NextResponse.json({ ok: true, recipes: recipes.length, products: products.length });
    } catch (error) {
        console.error('Gagal rebuild item vector:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
