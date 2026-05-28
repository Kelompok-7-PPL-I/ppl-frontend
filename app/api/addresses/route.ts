import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const alamat = await prisma.alamatPengguna.findMany({
            where: { id_user: userId },
            orderBy: { is_utama: 'desc' }
        });

        return NextResponse.json(alamat);
    } catch (error: any) {
        console.error("Error get alamat:", error);
        return NextResponse.json({ error: "Gagal mengambil alamat" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await request.json();

        // Tangkap data baru dari FE
        const {
            label_alamat, nama_penerima, nomor_telepon, alamat_lengkap,
            provinsi, kecamatan, kelurahan, kota_kabupaten, kode_pos
        } = body;

        // Simpan ke database
        const alamatBaru = await prisma.alamatPengguna.create({
            data: {
                id_user: userId,
                label_alamat,
                nama_penerima,
                nomor_telepon,
                alamat_lengkap,
                provinsi,   // Ini kolom barunya
                kecamatan,  // Ini kolom barunya
                kelurahan,  // Ini kolom barunya
                kota_kabupaten,
                kode_pos,
                is_utama: true // atau sesuaikan logic kamu
            }
        });

        return NextResponse.json({ success: true, data: alamatBaru });
    } catch (error: any) {
        console.error("Error simpan alamat:", error);
        return NextResponse.json({ error: "Gagal menyimpan alamat" }, { status: 500 });
    }
}