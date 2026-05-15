import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth"; // Import ini
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Import konfigurasi yang tadi kamu tunjukkan

export async function GET(request: Request) {
    // 1. Ambil session secara aman di sisi server
    const session = await getServerSession(authOptions);

    // 2. Cek apakah ada user yang sedang login
    if (!session || !session.user) {
        return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    // 3. Ambil ID User dari session (ini didapat dari token.id yang kamu buat di callback tadi)
    const userId = (session.user as any).id; 

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "Semua Pesanan";

    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10; // Load 10 data saja
    const skip = (page - 1) * limit;

    try {
        let whereClause: any = { id_user: userId }; // Filter otomatis berdasarkan ID yang login

        // Logika tab (sama seperti sebelumnya)
        if (tab === "Belum Bayar") {
            whereClause.status_pembayaran = { notIn: ["dibayar", "settlement", "capture"] };
        } else if (tab !== "Semua Pesanan") {
            whereClause.status_pembayaran = { in: ["dibayar", "settlement", "capture"] };
            if (tab === "Dalam Proses") whereClause.order_status = "dikemas";
            if (tab === "Dalam Pengiriman") whereClause.order_status = "dikirim";
            if (tab === "Selesai") whereClause.order_status = "selesai";
            if (tab === "Dibatalkan") whereClause.order_status = "dibatalkan";
        }

        const [orders, totalCount] = await Promise.all([
            prisma.pesanan.findMany({
                where: whereClause,
                include: {
                    item_pesanan: { include: { produk: true, ulasan: true } }
                },
                orderBy: { tanggal_pesanan: 'desc' },
                take: limit, // Ambil 10
                skip: skip,  // Lewati data sebelumnya
            }),
            prisma.pesanan.count({ where: whereClause }) // Hitung total data untuk info di frontend
        ]);

        return NextResponse.json({
            orders,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ orders: [] }, { status: 500 });
    }
}