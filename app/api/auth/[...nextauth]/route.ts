export const dynamic = "force-dynamic";

import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import argon2 from "argon2";
import { randomUUID } from "crypto";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

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
          id: String(user.id),
          email: user.email,
          name: user.nama ?? user.email ?? "User",
          peran: user.peran,
        } as any;
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) {
          console.error("Google login gagal: email tidak ditemukan.");
          return false;
        }

        const existingUser = await prisma.pengguna.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          try {
            await prisma.pengguna.create({
              data: {
                id: randomUUID(),
                email: user.email,
                nama: user.name ?? user.email.split("@")[0] ?? "User",
                peran: "user",
                password: null,
              },
            });
          } catch (error) {
            console.error("Gagal mendaftarkan user Google ke database:", error);
            return false;
          }
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      const email = user?.email ?? token.email;

      if (email) {
        const dbUser = await prisma.pengguna.findUnique({
          where: { email },
        });

        if (dbUser) {
          token.id = String(dbUser.id);
          token.peran = dbUser.peran;
          token.name = dbUser.nama ?? dbUser.email ?? "User";
          token.email = dbUser.email;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).peran = token.peran;
        session.user.name = String(token.name ?? "User");
        session.user.email = String(token.email ?? "");
      }

      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/auth",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };