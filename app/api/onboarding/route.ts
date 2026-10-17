import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { validateOnboarding } from "@/lib/onboarding-options";
import { initializeUserProfileVector } from "@/lib/recommendation/vectorizer";

export const dynamic = "force-dynamic";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id;
  return typeof id === "string" && id ? id : null;
}

// Cek status onboarding user yang sedang login
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const preferences = await prisma.userPreference.findUnique({ where: { id_user: userId } });
  return NextResponse.json({ completed: !!preferences, preferences });
}

// Simpan preference onboarding (sekali saja, belum bisa diubah)
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON yang valid" }, { status: 400 });
  }

  const result = validateOnboarding(body);
  if (!result.ok) {
    return NextResponse.json({ error: "Validasi gagal", details: result.errors }, { status: 400 });
  }

  try {
    const preferences = await prisma.userPreference.create({
      data: { id_user: userId, ...result.data },
    });

    // Inisialisasi User Profile Vector (Cold-Start)
    try {
      await initializeUserProfileVector(userId);
    } catch (vecErr) {
      console.warn("Gagal inisialisasi user profile vector:", vecErr);
    }

    return NextResponse.json({ preferences }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Onboarding sudah pernah diisi" }, { status: 409 });
    }
    console.error("Gagal menyimpan onboarding:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}