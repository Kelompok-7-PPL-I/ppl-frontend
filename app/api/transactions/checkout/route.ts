import { NextResponse } from 'next/server';

// Pakai require karena kita tidak punya @types/midtrans-client
const Midtrans = require('midtrans-client');

export async function POST(request: Request) {
    try {
        const { orderId, totalAmount, userDetails } = await request.json();

        // Inisialisasi di dalam agar selalu fresh membaca ENV
        let snap = new Midtrans.Snap({
            isProduction: false, 
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY
        });

        let parameter = {
            transaction_details: {
                order_id: orderId,
                // Pastikan jadi angka bulat (Integer)
                gross_amount: Math.round(Number(totalAmount)) 
            },
            customer_details: {
                first_name: userDetails?.nama || "Customer",
                email: userDetails?.email,
                phone: userDetails?.nomor_telp
            }
        };

        const token = await snap.createTransactionToken(parameter);
        return NextResponse.json({ token });

    } catch (error: any) {
        console.error("Midtrans Error:", error);
        return NextResponse.json(
            { error: "Gagal membuat token", details: error.message }, 
            { status: 500 }
        );
    }
}