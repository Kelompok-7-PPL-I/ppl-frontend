import { NextResponse } from "next/server";
import argon2 from "argon2"; // Import Argon2 menggantikan Bcrypt
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Pastikan ada di .env.local
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, password } = body;

        // 1. Cek apakah email sudah terdaftar di database Panganesia
        const existingUser = await prisma.pengguna.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ message: "Email sudah terdaftar!" }, { status: 400 });
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Langsung konfirmasi agar tidak perlu cek email verifikasi
            user_metadata: { full_name: name }
        });

        if (authError) {
            throw authError;
        }

        // 2. Enkripsi Tingkat Dewa dengan Argon2
        // Argon2 otomatis membuatkan 'Salt' acak dan menyimpannya menyatu dengan hasil hash
        const hashedPassword = await argon2.hash(password, {
            type: argon2.argon2id, // Tipe paling direkomendasikan saat ini
        });

        // 3. Simpan ke Database Prisma
        const user = await prisma.pengguna.create({
            data: {
                id: crypto.randomUUID(), // Tambahkan ID manual karena tidak autogenerate
                email,
                nama: name, // Kolom di database namanya 'nama'
                password: hashedPassword, // Simpan hasil acakan Argon2
            },
        });

        // 4. Kirim Email Selamat Datang pakai Nodemailer
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2 style="color: #10B981;">Selamat Datang di Panganesia, ${name}! 🌱</h2>
        <p>Akunmu berhasil dibuat dengan tingkat keamanan maksimal.</p>
      </div>
    `;
        await sendEmail(email, "Pendaftaran Panganesia Berhasil", emailHtml);

        return NextResponse.json({ success: true, message: "User berhasil dibuat!" }, { status: 201 });
    } catch (error) {
        console.error("Error register:", error);
        return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
    }
}