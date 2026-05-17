import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "Semua Pesanan";
    const openOrder = searchParams.get("openOrder");

    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
        // Jika ada openOrder, kembalikan single order langsung
        if (openOrder) {
            const singleOrder = await prisma.pesanan.findFirst({
                where: {
                    id_user: userId,
                    OR: [
                        { order_id: openOrder },
                        ...(isNaN(Number(openOrder)) ? [] : [{ id_pesanan: Number(openOrder) }])
                    ]
                },
                include: {
                    item_pesanan: {
                        include: {
                            produk: true,
                            ulasan: true,
                        },
                    },
                },
            });

            return NextResponse.json({
                success: true,
                orders: singleOrder ? [singleOrder] : [],
            });
        }

        let whereClause: any = { id_user: userId };

        if (tab === "Belum Bayar") {
            // Belum bayar = status pembayaran bukan salah satu dari yang sudah terbayar,
            // dan pesanan belum dibatalkan
            whereClause.status_pembayaran = { notIn: ["dibayar", "settlement", "capture"] };
            whereClause.order_status = { not: "dibatalkan" };

        } else if (tab === "Dibatalkan") {
            // Semua pesanan yang dibatalkan, terlepas dari status pembayaran
            whereClause.order_status = "dibatalkan";

        } else if (tab === "Dalam Proses") {
            // Sudah bayar (bukan pending) + order sedang dikemas (default admin)
            whereClause.status_pembayaran = { notIn: ["pending"] };
            whereClause.order_status = "dikemas";

        } else if (tab === "Dalam Pengiriman") {
            // Sudah bayar + sudah dikirim oleh admin
            whereClause.status_pembayaran = { in: ["dibayar", "settlement", "capture"] };
            whereClause.order_status = "dikirim";

        } else if (tab === "Selesai") {
            // Sudah bayar + sudah selesai (dikonfirmasi user via tombol "Pesanan Diterima")
            whereClause.status_pembayaran = { in: ["dibayar", "settlement", "capture"] };
            whereClause.order_status = "selesai";
        }
        // "Semua Pesanan" → whereClause hanya filter by userId, tampilkan semua

        const [orders, totalCount] = await Promise.all([
            prisma.pesanan.findMany({
                where: whereClause,
                include: {
                    item_pesanan: {
                        include: {
                            produk: true,
                            ulasan: true,
                        },
                    },
                },
                orderBy: { tanggal_pesanan: "desc" },
                take: limit,
                skip: skip,
            }),
            prisma.pesanan.count({ where: whereClause }),
        ]);

        return NextResponse.json({
            success: true,
            orders,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ orders: [] }, { status: 500 });
    }
}