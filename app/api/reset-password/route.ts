import { sendEmail } from '@/lib/nodemailer';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        // 1. Cek apakah pengguna ada di database Prisma
        const user = await prisma.pengguna.findUnique({
            where: { email }
        });

        if (!user) {
            // Berpura-pura berhasil agar orang tidak bisa menebak email yang terdaftar
            return NextResponse.json({ success: true, message: "Email reset password terkirim jika akun ada!" });
        }

        // 2. Buat token rahasia
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Token berlaku selama 1 jam (3600000 ms)
        const expiry = new Date(Date.now() + 3600000);

        // 3. Simpan token ke database
        await prisma.pengguna.update({
            where: { email },
            data: {
                reset_token: resetToken,
                reset_token_expiry: expiry 
            }
        });

        // 4. Buat Action link
        // Karena kita di localhost, pakai APP_URL atau hardcode ke localhost:3000
        const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const resetLink = `${appUrl}/auth/reset-password?token=${resetToken}`;

        // 5. Desain isi emailnya
        const emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 20px 10px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: center;">
                
                <h2 style="color: #10B981; font-size: 24px; margin-bottom: 5px; margin-top: 0;">Panganesia</h2>
                <hr style="border: none; border-top: 2px solid #f0f0f0; margin-bottom: 25px;">

                <h3 style="color: #333333; margin-bottom: 15px;">Reset Password Akun Kamu</h3>
                
                <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                Halo!<br>Kami menerima permintaan untuk mengatur ulang password kamu. Klik tombol di bawah ini untuk melanjutkan:
                </p>

                <a href="${resetLink}" style="display: inline-block; background-color: #10B981; color: #ffffff; padding: 14px 30px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                Reset Password
                </a>

                <p style="color: #777777; font-size: 13px; line-height: 1.5; margin-top: 30px;">
                Tombol tidak berfungsi? Salin dan tempel tautan berikut di browser kamu:<br>
                <span style="color: #10B981; word-break: break-all; font-size: 12px;">${resetLink}</span>
                </p>

                <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;">
                
                <p style="color: #aaaaaa; font-size: 12px; line-height: 1.4; margin-bottom: 0;">
                Jika kamu tidak meminta reset password ini, abaikan saja email ini. Akun kamu akan tetap aman.
                </p>
            </div>
            </div>
            `;

        // 6. Kirim pakai Nodemailer!
        await sendEmail(email, "Reset Password Akun Panganesia", emailHtml);

        return NextResponse.json({ success: true, message: "Email reset password terkirim!" });

    } catch (error: any) {
        console.error("Error di reset password:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}