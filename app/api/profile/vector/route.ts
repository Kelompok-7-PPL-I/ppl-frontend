import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserProfileVector, initializeUserProfileVector } from '@/lib/recommendation/vectorizer';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as any)?.id;

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('id_user') || sessionUserId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: id_user atau session login diperlukan' },
        { status: 401 }
      );
    }

    const profileVector = await getUserProfileVector(targetUserId);

    if (!profileVector) {
      return NextResponse.json(
        { error: 'User profile vector tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: profileVector
    });
  } catch (error: any) {
    console.error('Error fetching user profile vector:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil user profile vector: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as any)?.id;

    const body = await req.json().catch(() => ({}));
    const targetUserId = body?.id_user || sessionUserId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: id_user atau session login diperlukan' },
        { status: 401 }
      );
    }

    // Re-inisialisasi dari preferensi pengguna
    const vector = await initializeUserProfileVector(targetUserId);

    return NextResponse.json({
      message: 'User profile vector berhasil di-inisialisasi ulang dari preferensi onboarding',
      data: {
        id_user: targetUserId,
        vector
      }
    });
  } catch (error: any) {
    console.error('Error re-initializing user profile vector:', error);
    return NextResponse.json(
      { error: 'Gagal inisialisasi user profile vector: ' + error.message },
      { status: 500 }
    );
  }
}
