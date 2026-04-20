import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import argon2 from "argon2";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email dan Password wajib diisi");
                }

                // 1. Cari user di database berdasarkan email
                const user = await prisma.pengguna.findUnique({
                    where: { email: credentials.email },
                });

                // 2. Jika user tidak ada atau belum punya password (misal user lama Supabase)
                if (!user || !user.password) {
                    throw new Error("Akun tidak ditemukan");
                }

                // 3. Cek apakah password cocok menggunakan Argon2
                const isPasswordCorrect = await argon2.verify(
                    user.password,
                    credentials.password
                );

                if (!isPasswordCorrect) {
                    throw new Error("Password salah");
                }

                // 4. Jika semua oke, kembalikan data user untuk disimpan di session
                return {
                    id: user.id.toString(), // Sesuaikan dengan nama kolom ID di skema kamu (dari 'id_pengguna' jadi 'id')
                    email: user.email,
                    name: user.nama, // Di database kamu namanya 'nama', bukan 'nama_lengkap'
                };
            },
        }),
    ],
    session: {
        strategy: "jwt", // Menggunakan JSON Web Token untuk session
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/auth/login", // Arahkan ke halaman login custom kamu
    },
});

export { handler as GET, handler as POST };