import { NextResponse } from 'next/server';
import argon2 from 'argon2';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ success: false, error: "Data tidak lengkap" }, { status: 400 });
        }

        // 1. Cari pengguna dengan token tersebut
        const user = await prisma.pengguna.findFirst({
            where: {
                reset_token: token,
                reset_token_expiry: {
                    gt: new Date() // Cek apakah expiry time masih LEBIH BESAR dari waktu sekarang
                }
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "Token tidak valid atau sudah kadaluarsa!" }, { status: 401 });
        }

        // 2. Hash password baru dengan argon2
        const hashedPassword = await argon2.hash(password);

        // 3. Update database: Set password baru dan hapus token reset
        await prisma.pengguna.update({
            where: { email: user.email },
            data: {
                password: hashedPassword,
                reset_token: null,
                reset_token_expiry: null
            }
        });

        return NextResponse.json({ success: true, message: "Password berhasil diperbarui!" });

    } catch (error: any) {
        console.error("Error confirm reset password:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
