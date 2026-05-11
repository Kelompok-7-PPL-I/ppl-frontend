import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const STATUS_LUNAS = new Set(['dibayar', 'Dibayar']);

export async function GET() {
  try {
    // Group pesanan lunas by user, sum total_harga & count pesanan
    const grouped = await prisma.pesanan.groupBy({
      by: ['id_user'],
      where: {
        status_pembayaran: {
          // Prisma tidak support `in` case-insensitive langsung,
          // jadi kita ambil semua lalu filter di JS — atau gunakan raw jika banyak data
          in: [...STATUS_LUNAS],
        },
      },
      _sum:   { total_harga: true },
      _count: { id_pesanan: true },
      orderBy: { _sum: { total_harga: 'desc' } },
      take: 10,
    });

    if (grouped.length === 0) {
      return NextResponse.json([]);
    }

    // Ambil detail pengguna
    const userIds   = grouped.map((g) => g.id_user);
    const pengguna  = await prisma.pengguna.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nama: true, email: true },
    });
    const penggunaMap = Object.fromEntries(pengguna.map((u) => [u.id, u]));

    const result = grouped.map((g) => ({
      id:             g.id_user,
      nama:           penggunaMap[g.id_user]?.nama  ?? null,
      email:          penggunaMap[g.id_user]?.email ?? '—',
      total_belanja:  Number(g._sum.total_harga ?? 0),
      total_pesanan:  g._count.id_pesanan,
    }));

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Leaderboard Pengguna Error]', error.message);
    return NextResponse.json(
      { error: 'Gagal memuat leaderboard pengguna: ' + error.message },
      { status: 500 }
    );
  }
}