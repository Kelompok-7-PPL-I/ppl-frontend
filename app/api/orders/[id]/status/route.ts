import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPaidStatus, recordPurchaseInteractions } from "@/lib/interactions/server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, order_status } = body;

        const updateData: any = {};

        if (status) {
            updateData.status_pembayaran = status;
            const sudahBayar = ["dibayar", "settlement", "capture"].includes(status);
            if (sudahBayar) updateData.order_status = "dikemas";
        }

        if (order_status) {
            updateData.order_status = order_status;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "Tidak ada data untuk diupdate" }, { status: 400 });
        }

        // Status sebelum diubah, supaya pembelian hanya dicatat sekali (saat berubah jadi dibayar)
        const before = status
            ? await prisma.pesanan.findUnique({ where: { id_pesanan: Number(id) }, select: { status_pembayaran: true } })
            : null;

        const updatedOrder = await prisma.pesanan.update({
            where: { id_pesanan: Number(id) },
            data: updateData,
            include: { item_pesanan: true },
        });

        // Kosongkan keranjang jika baru dibayar
        if (status && ["dibayar", "settlement", "capture"].includes(status)) {
            const productIds = updatedOrder.item_pesanan.map((item) => item.id_produk);
            if (productIds.length > 0) {
                await prisma.keranjang.deleteMany({
                    where: {
                        id_user: updatedOrder.id_user,
                        id_produk: { in: productIds },
                    },
                });
            }
        }

        // Catat pembelian untuk rekomendasi (interaksi "purchase")
        if (isPaidStatus(status) && !isPaidStatus(before?.status_pembayaran)) {
            await recordPurchaseInteractions(
                updatedOrder.id_user,
                updatedOrder.item_pesanan.map((item) => item.id_produk)
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Status update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}