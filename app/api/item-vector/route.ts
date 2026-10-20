import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { vectorizeRecipe, vectorizeProduct, vectorizeAllRecipes } from '@/lib/recommendation/vectorizer';

export const dynamic = 'force-dynamic';

// Generate item vector mengubah data rekomendasi → khusus admin (sama seperti /api/recommendations/rebuild)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; peran?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.peran !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { item_id, item_type, all } = body;

    if (all && item_type === 'recipe') {
      const results = await vectorizeAllRecipes();
      return NextResponse.json({
        message: `Berhasil generate item vector untuk ${results.length} resep.`,
        data: results
      });
    }

    if (!item_id || !item_type) {
      return NextResponse.json(
        { error: 'item_id dan item_type wajib diisi.' },
        { status: 400 }
      );
    }

    let result;
    if (item_type.toLowerCase() === 'recipe') {
      result = await vectorizeRecipe(Number(item_id));
    } else if (item_type.toLowerCase() === 'product') {
      result = await vectorizeProduct(Number(item_id));
    } else {
      return NextResponse.json(
        { error: 'item_type harus "recipe" atau "product"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Item vector berhasil dibuat',
      data: result
    });
  } catch (error: any) {
    console.error('Error generating item vector:', error);
    return NextResponse.json(
      { error: 'Gagal membuat item vector: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const item_id = searchParams.get('item_id');
    const item_type = searchParams.get('item_type');

    if (!item_id || !item_type) {
      const vectors = await prisma.itemVector.findMany({ take: 50 });
      return NextResponse.json(vectors);
    }

    const vector = await prisma.itemVector.findUnique({
      where: {
        item_id_item_type: {
          item_id: Number(item_id),
          item_type: item_type.toLowerCase()
        }
      }
    });

    if (!vector) {
      return NextResponse.json(
        { error: 'Item vector tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(vector);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal mengambil item vector: ' + error.message },
      { status: 500 }
    );
  }
}
