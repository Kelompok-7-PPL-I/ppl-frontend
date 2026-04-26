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

        const cartItems = await prisma.keranjang.findMany({
            where: { id_user: userId },
            include: { produk: true },
            orderBy: { dibuat_pada: 'asc' }
        });

        // Format for frontend
        const formattedItems = cartItems.map(item => ({
            id_keranjang: item.id_keranjang,
            id_produk: item.id_produk,
            name: item.produk.nama_produk,
            price: Number(item.produk.harga),
            quantity: item.jumlah,
            image: item.produk.gambar_url || "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400",
            checked: true // Default to true for frontend logic
        }));

        return NextResponse.json(formattedItems);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = (session.user as any).id;
        const { id_produk, quantity = 1 } = await request.json();

        // Cek jika produk sudah ada di keranjang
        const existingItem = await prisma.keranjang.findFirst({
            where: { id_user: userId, id_produk: Number(id_produk) }
        });

        let cartItem;
        if (existingItem) {
            cartItem = await prisma.keranjang.update({
                where: { id_keranjang: existingItem.id_keranjang },
                data: { jumlah: existingItem.jumlah + quantity }
            });
        } else {
            cartItem = await prisma.keranjang.create({
                data: {
                    id_user: userId,
                    id_produk: Number(id_produk),
                    jumlah: quantity
                }
            });
        }

        return NextResponse.json(cartItem);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const { id_keranjang, quantity } = await request.json();

        if (quantity < 1) {
            return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
        }

        const updatedItem = await prisma.keranjang.update({
            where: { id_keranjang: Number(id_keranjang) },
            data: { jumlah: quantity }
        });

        return NextResponse.json(updatedItem);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const id_keranjang = url.searchParams.get('id');

        if (!id_keranjang) {
            return NextResponse.json({ error: "Missing id" }, { status: 400 });
        }

        await prisma.keranjang.delete({
            where: { id_keranjang: Number(id_keranjang) }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
