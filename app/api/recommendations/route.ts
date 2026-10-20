import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { recommendProducts, recommendRecipes } from '@/lib/recommendation/engine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/recommendations?type=recipe|product&limit=5
 * - User login  : rekomendasi personal (cosine + bonus wilayah), alergi & bahan dihindari difilter.
 * - Belum login / belum punya profil : rekomendasi default.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get('type') ?? 'recipe';
    if (type !== 'recipe' && type !== 'product') {
        return NextResponse.json({ error: "type harus 'recipe' atau 'product'" }, { status: 400 });
    }

    const parsed = parseInt(searchParams.get('limit') ?? '5', 10);
    const limit = Number.isFinite(parsed) ? Math.min(20, Math.max(1, parsed)) : 5;

    const session = await getServerSession(authOptions);
    const id = (session?.user as { id?: string } | undefined)?.id;
    const userId = typeof id === 'string' && id ? id : null;

    try {
        const recommendations =
            type === 'product' ? await recommendProducts(userId, limit) : await recommendRecipes(userId, limit);

        return NextResponse.json({
            type,
            personalized: recommendations.some((r) => r.source === 'personalized'),
            recommendations,
        });
    } catch (error) {
        console.error('Gagal membuat rekomendasi:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
