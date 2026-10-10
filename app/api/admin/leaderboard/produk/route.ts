import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const STATUS_LUNAS = ['dibayar', 'Dibayar'];

export async function GET() {
  try {
    // Group item_pesanan by id_produk, hanya dari pesanan lunas
    const grouped = await prisma.itemPesanan.groupBy({
      by: ['id_produk'],
      where: {
        pesanan: {
          status_pembayaran: {
            in: STATUS_LUNAS,
          },
        },
      },
      _sum: {
        kuantitas: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          kuantitas: 'desc',
        },
      },
      take: 10,
    });

    if (grouped.length === 0) {
      return NextResponse.json([]);
    }

    // Ambil detail produk
    const produkIds = grouped.map((g) => g.id_produk);
    const produkList = await prisma.produk.findMany({
      where: { id_produk: { in: produkIds } },
      select: { id_produk: true, nama_produk: true, gambar_url: true },
    });
    const produkMap = Object.fromEntries(produkList.map((p) => [p.id_produk, p]));

    const result = grouped.map((g) => ({
      id_produk:        g.id_produk,
      nama_produk:      produkMap[g.id_produk]?.nama_produk ?? '—',
      gambar_url:       produkMap[g.id_produk]?.gambar_url  ?? null,
      total_terjual:    Number(g._sum.kuantitas ?? 0),
      total_pendapatan: Number(g._sum.subtotal  ?? 0),
    }));

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Leaderboard Produk Error]', error.message);
    return NextResponse.json(
      { error: 'Gagal memuat leaderboard produk: ' + error.message },
      { status: 500 }
    );
  }
}