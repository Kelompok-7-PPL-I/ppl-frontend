import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { buildRecommendations } from "@/lib/recommendation/rules";
import type { RecoPage } from "@/lib/recommendation/types";

export const dynamic = "force-dynamic";

const PAGES: RecoPage[] = ["dashboard", "recipes"];

// GET /api/recommendations?page=dashboard|recipes
// User selalu diambil dari session (bukan dari query) supaya tidak bisa membaca rekomendasi user lain.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = new URL(req.url).searchParams.get("page") as RecoPage | null;
  if (!page || !PAGES.includes(page)) {
    return NextResponse.json({ error: `page harus salah satu dari: ${PAGES.join(", ")}` }, { status: 400 });
  }

  try {
    return NextResponse.json(await buildRecommendations(userId, page));
  } catch (e) {
    console.error("Gagal menyusun rekomendasi:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
