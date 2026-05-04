import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Group favorit_resep by id_resep, count jumlah favorit
    const grouped = await prisma.favoritResep.groupBy({
      by: ['id_resep'],
      _count: { id_fav: true },
      orderBy: { _count: { id_fav: 'desc' } },
      take: 10,
    });

    if (grouped.length === 0) {
      return NextResponse.json([]);
    }

    // Ambil detail resep
    const resepIds = grouped.map((g) => g.id_resep);
    const resep    = await prisma.resep.findMany({
      where: { id_resep: { in: resepIds } },
      select: {
        id_resep:      true,
        judul_resep:   true,
        gambar_url:    true,
        kategori_jenis: true,
      },
    });
    const resepMap = Object.fromEntries(resep.map((r) => [r.id_resep, r]));

    const result = grouped.map((g) => ({
      id_resep:       g.id_resep,
      judul_resep:    resepMap[g.id_resep]?.judul_resep    ?? `Resep #${g.id_resep}`,
      gambar_url:     resepMap[g.id_resep]?.gambar_url     ?? null,
      kategori_jenis: resepMap[g.id_resep]?.kategori_jenis ?? null,
      total_favorit:  g._count.id_fav,
    }));

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Leaderboard Resep Error]', error.message);
    return NextResponse.json(
      { error: 'Gagal memuat leaderboard resep: ' + error.message },
      { status: 500 }
    );
  }
}