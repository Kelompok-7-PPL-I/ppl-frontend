import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/catalog-options — pilihan kelompok bahan pangan & wilayah (provinsi) untuk form produk admin
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.peran !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const [kelompok, wilayah] = await Promise.all([
      prisma.kelompokBahanPangan.findMany({ select: { id: true, kelompok_pangan: true }, orderBy: { id: "asc" } }),
      prisma.wilayah.findMany({ select: { id_wilayah: true, nama_wilayah: true }, orderBy: { nama_wilayah: "asc" } }),
    ]);
    return NextResponse.json({
      kelompok: kelompok.map((k) => ({ id: k.id, nama: k.kelompok_pangan ?? `Kelompok ${k.id}` })),
      wilayah: wilayah.map((w) => ({ id: w.id_wilayah, nama: w.nama_wilayah })),
    });
  } catch (e) {
    console.error("Gagal memuat opsi katalog:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
