import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// 1. METHOD GET: UNTUK MENARIK HISTORY ULASAN
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Mengambil history berdasarkan struktur tabel 'ulasan'
        const historyUlasan = await prisma.ulasan.findMany({
            where: {
                id_user: userId // Tipe data UUID dari session
            },
            include: {
                // 1. Mengambil data nama dan gambar dari tabel 'produk'
                produk: {
                    select: {
                        nama_produk: true,
                        gambar_url: true 
                    }
                },
                // 2. Mengambil data dari tabel 'item_pesanan' untuk dihubungkan ke 'pesanan'
                item_pesanan: {
                    include: {
                        pesanan: {
                            select: {
                                id_pesanan: true,
                                order_id: true, 
                                tanggal_pesanan: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                tanggal_ulasan: 'desc' 
            }
        });

        return NextResponse.json({ success: true, data: historyUlasan });
    } catch (error: any) {
        console.error("Error fetching review history:", error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem saat mengambil history ulasan" }, { status: 500 });
    }
}

// 2. METHOD POST: UNTUK MEMBUAT ULASAN BARU
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
