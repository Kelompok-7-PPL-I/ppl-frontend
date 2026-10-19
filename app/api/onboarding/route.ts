import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { validateOnboarding } from "@/lib/onboarding-options";

export const dynamic = "force-dynamic";

const include = { kelompok: true, avoided_produk: true } satisfies Prisma.UserPreferenceInclude;

type PreferenceWithRelations = Prisma.UserPreferenceGetPayload<{ include: typeof include }>;

// Ratakan relasi jadi array ID supaya bentuk response tetap sama seperti sebelumnya
function shape(p: PreferenceWithRelations) {
  const { kelompok, avoided_produk, ...rest } = p;
  return {
    ...rest,
    ingredient_preferences: kelompok.map((k) => k.id_kelompok),
    avoided_ingredients: avoided_produk.map((a) => a.id_produk),
  };
}

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id;
  return typeof id === "string" && id ? id : null;
}

// Cek status onboarding user yang sedang login
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const preferences = await prisma.userPreference.findUnique({
    where: { id_user: userId },
    include,
  });
  return NextResponse.json({
    completed: !!preferences,
    preferences: preferences ? shape(preferences) : null,
  });
}

// Simpan preference onboarding (pertama kali)
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

  const { ingredient_preferences, avoided_ingredients, ...rest } = result.data;

  try {
    const preferences = await prisma.userPreference.create({
      data: {
        id_user: userId,
        ...rest,
        kelompok: { create: ingredient_preferences.map((id) => ({ id_kelompok: id })) },
        avoided_produk: { create: avoided_ingredients.map((id) => ({ id_produk: id })) },
      },
      include,
    });
    return NextResponse.json({ preferences: shape(preferences) }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json({ error: "Onboarding sudah pernah diisi" }, { status: 409 });
      }
      if (e.code === "P2003") {
        return NextResponse.json({ error: "Kelompok atau produk tidak valid" }, { status: 400 });
      }
    }
    console.error("Gagal menyimpan onboarding:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// Ubah preference (hanya untuk user yang sudah onboarding)
export async function PUT(req: Request) {
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

  const { ingredient_preferences, avoided_ingredients, ...rest } = result.data;

  try {
    const preferences = await prisma.userPreference.update({
      where: { id_user: userId },
      data: {
        ...rest,
        // hapus relasi lama, lalu isi dengan pilihan terbaru
        kelompok: {
          deleteMany: {},
          create: ingredient_preferences.map((id) => ({ id_kelompok: id })),
        },
        avoided_produk: {
          deleteMany: {},
          create: avoided_ingredients.map((id) => ({ id_produk: id })),
        },
      },
      include,
    });
    return NextResponse.json({ preferences: shape(preferences) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Onboarding belum diisi" }, { status: 404 });
      }
      if (e.code === "P2003") {
        return NextResponse.json({ error: "Kelompok atau produk tidak valid" }, { status: 400 });
      }
    }
    console.error("Gagal mengubah preference:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}