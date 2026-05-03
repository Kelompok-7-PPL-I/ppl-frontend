import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
const Midtrans = require('midtrans-client');


export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const id_user = (session.user as any).id;

        const { totalAmount, userDetails, items = [] } = await request.json();
        const orderId = `PANGAN-${Date.now()}`;

        // 1. Ambil isi keranjang user dari DB
        const isiKeranjang = await prisma.keranjang.findMany({
            where: { id_user: id_user },
            include: { produk: true },
            orderBy: { dibuat_pada: 'asc' } // same order as frontend
        });

        if (isiKeranjang.length === 0) {
            return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });
        }

        // 2. Transaksi Database: Buat Pesanan & ItemPesanan
        const newOrder = await prisma.$transaction(async (tx: any) => {
                const pesanan = await tx.pesanan.create({
                data: {
                    order_id: orderId,
                    id_user: id_user,
                    total_harga: totalAmount,
                    status_pembayaran: "pending",
                }
            });

            // FIX: save per-item note using the index matched from frontend cart order
            for (let i = 0; i < isiKeranjang.length; i++) {
                const item = isiKeranjang[i];
                await tx.itemPesanan.create({
                    data: {
                        id_pesanan: pesanan.id_pesanan,
                        id_produk: item.id_produk,
                        kuantitas: item.jumlah,
                        subtotal: Number(item.produk.harga) * item.jumlah,
                        catatan: items[i]?.note || null,
                    }
                });
            }

            // 3. Kosongkan keranjang setelah pesanan dibuat
            await tx.keranjang.deleteMany({
                where: { id_user: id_user }
            });

            return pesanan;
        });

        // 4. Request Token Midtrans
        let snap = new Midtrans.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY?.trim(),
            clientKey: process.env.MIDTRANS_CLIENT_KEY?.trim()
        });

        const origin = request.headers.get('origin') || "http://localhost:3000";

        let parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: Math.round(Number(totalAmount))
            },
            customer_details: {
                first_name: userDetails.nama && userDetails.nama !== "Memuat nama..." ? userDetails.nama : "Customer",
                email: userDetails.email || "customer@example.com",
                phone: userDetails.nomor_telp && userDetails.nomor_telp !== "Nomor belum diatur" ? userDetails.nomor_telp : "081234567890"
            },
            callbacks: {
                finish: `${origin}/DashboardProduct`
            }
        };

        const transaction = await snap.createTransaction(parameter);

        // FIX: return pesananId so frontend can update status after payment
        return NextResponse.json({
            token: transaction.token,
            pesananId: newOrder.id_pesanan,
        });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}