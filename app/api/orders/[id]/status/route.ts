import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isPaidStatus, recordPurchaseInteractions } from "@/lib/interactions/server";
import { isMidtransPaid } from "@/lib/midtrans";

/**
 * PATCH /api/orders/[id]/status
 * - Wajib login. Pembeli hanya boleh mengubah pesanannya sendiri:
 *   - { status: "dibayar" }      → hanya kalau Midtrans menyatakan transaksinya lunas
 *   - { order_status: "selesai" } → konfirmasi pesanan diterima, hanya saat sedang "dikirim"
 * - Admin boleh mengubah status apa pun.
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (!user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isAdmin = user.peran === "admin";

    try {
        const { id } = await params;
        const idPesanan = Number(id);
        if (!Number.isInteger(idPesanan)) {
            return NextResponse.json({ error: "ID pesanan tidak valid" }, { status: 400 });
        }

        const body = await request.json().catch(() => null);
        const { status, order_status } = body ?? {};

        const order = await prisma.pesanan.findUnique({
            where: { id_pesanan: idPesanan },
            select: { id_user: true, order_id: true, status_pembayaran: true, order_status: true },
        });
        if (!order) {
            return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
        }
        if (!isAdmin && order.id_user !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const wasPaid = isPaidStatus(order.status_pembayaran);
        const becomesPaid = isPaidStatus(status) && !wasPaid;
        const updateData: Prisma.PesananUpdateInput = {};

        if (status) {
            if (!isAdmin) {
                if (status !== "dibayar") {
                    return NextResponse.json({ error: "Status pembayaran tidak bisa diubah" }, { status: 403 });
                }
                if (!wasPaid) {
                    const paid = await isMidtransPaid(order.order_id);
                    if (paid === null) {
                        return NextResponse.json({ error: "Gagal memverifikasi pembayaran. Coba lagi." }, { status: 502 });
                    }
                    if (!paid) {
                        return NextResponse.json({ error: "Pembayaran belum terkonfirmasi" }, { status: 409 });
                    }
                }
            }
            updateData.status_pembayaran = status;
            // Hanya saat baru lunas, supaya pesanan yang sudah dikirim tidak kembali ke "dikemas"
            if (becomesPaid) updateData.order_status = "dikemas";
        }

        if (order_status) {
            if (!isAdmin) {
                if (order_status !== "selesai") {
                    return NextResponse.json({ error: "Status pesanan tidak bisa diubah" }, { status: 403 });
                }
                if ((order.order_status ?? "").toLowerCase() !== "dikirim") {
                    return NextResponse.json({ error: "Pesanan belum dalam pengiriman" }, { status: 409 });
                }
            }
            updateData.order_status = order_status;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "Tidak ada data untuk diupdate" }, { status: 400 });
        }

        const updatedOrder = await prisma.pesanan.update({
            where: { id_pesanan: idPesanan },
            data: updateData,
            include: { item_pesanan: true },
        });

        if (becomesPaid) {
            const productIds = updatedOrder.item_pesanan.map((item) => item.id_produk);

            // Kosongkan keranjang dari produk yang baru dibayar
            if (productIds.length > 0) {
                await prisma.keranjang.deleteMany({
                    where: { id_user: updatedOrder.id_user, id_produk: { in: productIds } },
                });
            }

            // Catat pembelian untuk rekomendasi (interaksi "purchase")
            await recordPurchaseInteractions(updatedOrder.id_user, productIds);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Status update error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
    }
}
