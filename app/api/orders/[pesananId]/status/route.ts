import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ pesananId: string }> }
) {
    try {
        const { pesananId } = await params; // ← await params
        const { status } = await request.json();

        const updatedOrder = await prisma.pesanan.update({
            where: { id_pesanan: Number(pesananId) },
            data: { status_pembayaran: status },
            include: {
                item_pesanan: true
            }
        });

        // Kosongkan keranjang untuk produk yang sudah dibeli jika status "dibayar"
        if (status === "dibayar" || status === "settlement" || status === "capture") {
            const productIds = updatedOrder.item_pesanan.map(item => item.id_produk);
            if (productIds.length > 0) {
                await prisma.keranjang.deleteMany({
                    where: {
                        id_user: updatedOrder.id_user,
                        id_produk: { in: productIds }
                    }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}