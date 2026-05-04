import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const STATUS_LUNAS = new Set(['dibayar']);

export async function GET() {
  try {
    const [
      totalProduk,
      totalPelanggan,
      pesanan,
      produkTerlaris,
    ] = await Promise.all([
      prisma.produk.count(),

      prisma.pengguna.count({
        where: { peran: 'customer' },
      }),

      prisma.pesanan.findMany({
        where: {
          tanggal_pesanan: {
            gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
          },
        },
        select: {
          tanggal_pesanan: true,
          total_harga: true,
          status_pembayaran: true,
        },
        orderBy: { tanggal_pesanan: 'asc' },
      }),

      prisma.itemPesanan.groupBy({
        by: ['id_produk'],
        _sum: { kuantitas: true, subtotal: true },
        orderBy: { _sum: { kuantitas: 'desc' } },
        take: 10,
      }),
    ]);

    // ── Detail produk untuk leaderboard ─────────────────────────────────────
    const produkIds    = produkTerlaris.map((p) => p.id_produk);
    const produkDetail = await prisma.produk.findMany({
      where: { id_produk: { in: produkIds } },
      select: { id_produk: true, nama_produk: true, gambar_url: true },
    });
    const produkMap = Object.fromEntries(produkDetail.map((p) => [p.id_produk, p]));

    // ── Kalkulasi stats ──────────────────────────────────────────────────────
    const isLunas = (status: string | null) =>
      STATUS_LUNAS.has((status ?? '').toLowerCase().trim());

    const totalPendapatan = pesanan
      .filter((p) => isLunas(p.status_pembayaran))
      .reduce((sum, p) => sum + Number(p.total_harga ?? 0), 0);

    const totalPesanan = pesanan.length;

    // ── Tren penjualan — group by bulan ─────────────────────────────────────
    const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const trendMap: Record<string, { month: string; penjualan: number; pesanan: number }> = {};

    pesanan.forEach((p) => {
      const d   = new Date(p.tanggal_pesanan);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!trendMap[key]) {
        trendMap[key] = { month: BULAN[d.getMonth()], penjualan: 0, pesanan: 0 };
      }
      if (isLunas(p.status_pembayaran)) {
        trendMap[key].penjualan += Number(p.total_harga ?? 0);
      }
      trendMap[key].pesanan += 1;
    });

    const salesTrend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([, val]) => val);

    // ── Distribusi status pesanan ────────────────────────────────────────────
    const normalizeStatus = (raw: string | null): string => {
      const s = (raw ?? '').toLowerCase().trim();
      if (STATUS_LUNAS.has(s))                                                          return 'Lunas';
      if (['pending', 'waiting', 'unpaid', 'created'].includes(s))                      return 'Pending';
      if (['expire','expired','cancel','cancelled','deny','denied','failed','gagal','failure'].includes(s))
        return 'Gagal';
      return 'Lainnya';
    };

    const statusCount: Record<string, number> = {};
    pesanan.forEach((p) => {
      const label = normalizeStatus(p.status_pembayaran);
      statusCount[label] = (statusCount[label] ?? 0) + 1;
    });

    const STATUS_ORDER = ['Lunas', 'Pending', 'Gagal', 'Lainnya'];
    const statusDistribusi = STATUS_ORDER
      .filter((s) => statusCount[s] > 0)
      .map((s) => ({ name: s, value: statusCount[s] ?? 0 }));

    // ── Leaderboard produk ───────────────────────────────────────────────────
    const leaderboard = produkTerlaris.map((item) => ({
      id_produk:   item.id_produk,
      nama_produk: produkMap[item.id_produk]?.nama_produk ?? `Produk #${item.id_produk}`,
      gambar_url:  produkMap[item.id_produk]?.gambar_url  ?? null,
      terjual:     item._sum.kuantitas ?? 0,
      pendapatan:  Number(item._sum.subtotal ?? 0),
    }));

    return NextResponse.json({
      stats: { totalPendapatan, totalPesanan, totalProduk, totalPelanggan },
      salesTrend,
      statusDistribusi,
      leaderboard,
    });

  } catch (error: any) {
    console.error('[Dashboard API Error]', error.message);
    return NextResponse.json(
      { error: 'Gagal memuat data dashboard: ' + error.message },
      { status: 500 }
    );
  }
}