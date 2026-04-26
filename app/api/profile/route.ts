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

        const pengguna = await prisma.pengguna.findUnique({
            where: { id: userId },
            select: {
                nama: true,
                email: true,
                alamat: true,
                nomor_telp: true
            }
        });

        if (!pengguna) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(pengguna);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
