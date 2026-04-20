import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import argon2 from "argon2";

const handler = NextAuth({
    providers: [
        // 1. PROVIDER GOOGLE
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        // 2. PROVIDER CREDENTIALS (Email & Password)
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

                const user = await prisma.pengguna.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.password) {
                    throw new Error("Akun tidak ditemukan atau silakan masuk dengan Google");
                }

                const isPasswordCorrect = await argon2.verify(
                    user.password,
                    credentials.password
                );

                if (!isPasswordCorrect) {
                    throw new Error("Password salah");
                }

                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.nama,
                    peran: user.peran,
                };
            },
        }),
    ],
    callbacks: {
        // CALLBACK: Dijalankan saat user mencoba login
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                // Cek apakah user Google sudah ada di tabel pengguna
                const existingUser = await prisma.pengguna.findUnique({
                    where: { email: user.email! },
                });

                // Jika belum ada, buatkan akun baru otomatis di tabel pengguna
                if (!existingUser) {
                    try {
                        await prisma.pengguna.create({
                            data: {
                                id: crypto.randomUUID(), // Menggunakan UUID baru
                                email: user.email!,
                                nama: user.name,
                                peran: "user", // Default role untuk user baru
                                // Password dibiarkan NULL karena login via Google
                            },
                        });
                    } catch (error) {
                        console.error("Gagal mendaftarkan user Google ke database:", error);
                        return false; // Batalkan login jika gagal simpan ke DB
                    }
                }
            }
            return true;
        },

        // CALLBACK: Menyimpan data ke dalam JWT (Token)
        async jwt({ token, user }) {
            if (user) {
                // 'user' di sini datang dari authorize() atau data Google pertama kali
                token.peran = (user as any).peran || "user";
            } else if (!token.peran) {
                // Jika token sudah ada tapi peran belum nempel, ambil dari DB
                const dbUser = await prisma.pengguna.findUnique({
                    where: { email: token.email! },
                });
                token.peran = dbUser?.peran || "user";
            }
            return token;
        },

        // CALLBACK: Mengirim data dari JWT ke Session Frontend
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).peran = token.peran;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/auth", // Sesuai folder halaman login kamu
    },
});

export { handler as GET, handler as POST };