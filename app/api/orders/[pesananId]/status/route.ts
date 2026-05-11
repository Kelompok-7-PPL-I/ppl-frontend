import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ pesananId: string }> }
) {
    try {
        const { pesananId } = await params; // ← await params
        const { status } = await request.json();

        await prisma.pesanan.update({
            where: { id_pesanan: Number(pesananId) },
            data: { status_pembayaran: status }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}