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
        const { id_produk, rating, komentar } = body;

        if (!id_produk || !rating) {
            return NextResponse.json({ error: "id_produk and rating are required" }, { status: 400 });
        }

        const ulasan = await prisma.ulasan.create({
            data: {
                id_user: userId,
                id_produk: Number(id_produk),
                rating: Number(rating),
                komentar: komentar || "",
            }
        });

        return NextResponse.json({ success: true, ulasan });
    } catch (error: any) {
        console.error("Error creating review:", error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem saat menyimpan ulasan" }, { status: 500 });
    }
}
