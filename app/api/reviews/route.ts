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
        const body = await request.json();
        const { id_produk, id_item, rating, komentar } = body;

        if (!id_produk || !id_item || !rating) {
            return NextResponse.json({ error: "id_produk, id_item, and rating are required" }, { status: 400 });
        }

        const ulasan = await prisma.ulasan.create({
            data: {
                id_user: userId,
                id_produk: Number(id_produk),
                id_item: Number(id_item),
                rating: Number(rating),
                komentar: komentar || "",
            }
        });

        return NextResponse.json({ success: true, ulasan });
    } catch (error: any) {
        console.error("Error creating review:", error);
        
        // Tips: Cek jika error karena duplikasi id_item (P2002 adalah kode error unique constraint Prisma)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Item ini sudah pernah Anda ulas sebelumnya" }, { status: 400 });
        }

        return NextResponse.json({ error: "Terjadi kesalahan sistem saat menyimpan ulasan" }, { status: 500 });
    }
}
