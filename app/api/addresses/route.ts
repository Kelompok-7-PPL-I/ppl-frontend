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

        const addresses = await prisma.alamatPengguna.findMany({
            where: { id_user: userId },
            orderBy: [
                { is_utama: 'desc' },
                { id_alamat: 'asc' }
            ]
        });

        return NextResponse.json(addresses);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}