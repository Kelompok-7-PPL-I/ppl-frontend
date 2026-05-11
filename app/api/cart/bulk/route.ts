import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const userId = (session.user as any).id;
        const { items } = await request.json();

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const results = [];

        // Gunakan transaksi agar semua operasi berhasil atau gagal bersamaan
        await prisma.$transaction(async (tx) => {
            for (const item of items) {
                const { id_produk, jumlah } = item;
                if (!id_produk || !jumlah) continue;

                // Cek jika produk sudah ada di keranjang
                const existingItem = await tx.keranjang.findFirst({
                    where: { id_user: userId, id_produk: Number(id_produk) }
                });

                let cartItem;
                if (existingItem) {
                    cartItem = await tx.keranjang.update({
                        where: { id_keranjang: existingItem.id_keranjang },
                        data: { jumlah: existingItem.jumlah + jumlah }
                    });
                } else {
                    cartItem = await tx.keranjang.create({
                        data: {
                            id_user: userId,
                            id_produk: Number(id_produk),
                            jumlah: jumlah
                        }
                    });
                }
                results.push(cartItem);
            }
        });

        return NextResponse.json({ success: true, items: results });
    } catch (error: any) {
        console.error("Bulk cart error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
