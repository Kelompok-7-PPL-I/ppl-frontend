import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const EVENT_WEIGHTS: Record<string, number> = {
  view: 1,
  filter: 1,
  cart: 2,
  favorite: 3,
  purchase: 5
};

export async function POST(req: Request) {
  try {
    // 1. Ambil userId dari NextAuth session (keamanan utama)
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;

    const body = await req.json().catch(() => ({}));
    const { item_id, item_type, event, id_user } = body;

    // Fallback: Jika tidak ada session NextAuth (misal testing Postman/Development), gunakan id_user dari body
    if (!userId && id_user) {
      userId = id_user;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    if (!item_id || !item_type || !event) {
      return NextResponse.json(
        { error: 'Invalid payload: item_id, item_type, dan event wajib diisi.' },
        { status: 400 }
      );
    }

    const eventKey = String(event).toLowerCase();
    const weight = EVENT_WEIGHTS[eventKey] || 1;
    const itemTypeKey = String(item_type).toLowerCase();

    // 2. Simpan interaksi pengguna ke database
    const interaction = await prisma.userInteraction.create({
      data: {
        id_user: userId,
        item_id: Number(item_id),
        item_type: itemTypeKey,
        event: eventKey,
        weight
      }
    });

    // 3. Increment / Update count di user_profile_vector
    await prisma.userProfileVector.upsert({
      where: { id_user: userId },
      update: {
        interaction_count: { increment: 1 },
        updated_at: new Date()
      },
      create: {
        id_user: userId,
        interaction_count: 1,
        vector: new Array(32).fill(0)
      }
    });

    return NextResponse.json({
      message: 'Interaksi berhasil dicatat',
      interaction
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording interaction:', error);
    return NextResponse.json(
      { error: 'Gagal mencatat interaksi: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as any)?.id;

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('id_user') || sessionUserId;

    if (!targetUserId) {
      const interactions = await prisma.userInteraction.findMany({
        take: 50,
        orderBy: { created_at: 'desc' }
      });
      return NextResponse.json(interactions);
    }

    const userInteractions = await prisma.userInteraction.findMany({
      where: { id_user: targetUserId },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(userInteractions);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal mengambil interaksi: ' + error.message },
      { status: 500 }
    );
  }
}
