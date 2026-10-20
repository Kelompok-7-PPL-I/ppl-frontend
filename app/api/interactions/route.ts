import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateUserProfileVector } from "@/lib/recommendation/vectorizer";

export const dynamic = "force-dynamic";

// Bobot interaksi: makin kuat sinyalnya, makin besar pengaruhnya ke profil user
const EVENT_WEIGHT = { view: 1, filter: 1, cart: 2, favorite: 3, purchase: 5 } as const;
type EventName = keyof typeof EVENT_WEIGHT;
const ITEM_TYPES = ["product", "recipe"];

/**
 * POST /api/interactions
 * body: { item_id: number, item_type: "product" | "recipe", event: "view" | "filter" | "cart" | "favorite" | "purchase" }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { item_id, item_type, event } = body ?? {};

  if (
    !Number.isInteger(item_id) ||
    !ITEM_TYPES.includes(item_type) ||
    typeof event !== "string" ||
    !(event in EVENT_WEIGHT)
  ) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const weight = EVENT_WEIGHT[event as EventName];

  try {
    await prisma.userInteraction.create({
      data: { id_user: userId, item_id, item_type, event, weight },
    });
  } catch (e) {
    console.error("Gagal menyimpan interaksi:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }

  // Update profil user. Kalau gagal, interaksi tetap tersimpan dan request tidak dianggap error.
  try {
    await updateUserProfileVector(userId, item_id, item_type, weight);
  } catch (e) {
    console.error("Gagal update user profile vector:", e);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
