import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Daftar pilihan dinamis untuk onboarding: kelompok bahan pangan (ingredient_preferences)
// dan produk (avoided_ingredients). Data katalog publik, hanya baca.
export async function GET() {
  try {
    const [kelompok, produk] = await Promise.all([
      prisma.kelompokBahanPangan.findMany({
        select: { id: true, kelompok_pangan: true, _count: { select: { produk: true } } },
        orderBy: { id: "asc" },
      }),
      prisma.produk.findMany({
        select: { id_produk: true, nama_produk: true, kelompok_bahan_pangan: true },
        orderBy: { nama_produk: "asc" },
      }),
    ]);

    return NextResponse.json({
      kelompok: kelompok
        .filter((k) => k._count.produk > 0)
        .map((k) => ({ id: k.id, nama: k.kelompok_pangan ?? `Kelompok ${k.id}`, jumlah_produk: k._count.produk })),
      produk: produk.map((p) => ({ id: p.id_produk, nama: p.nama_produk, id_kelompok: p.kelompok_bahan_pangan })),
    });
  } catch (e) {
    console.error("Gagal memuat opsi onboarding:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
