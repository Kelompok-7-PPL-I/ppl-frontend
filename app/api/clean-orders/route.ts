import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        await prisma.$executeRawUnsafe(`DELETE FROM "public"."item_pesanan";`);
        await prisma.$executeRawUnsafe(`DELETE FROM "public"."pesanan";`);
        return NextResponse.json({ message: "Cleaned orders" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
