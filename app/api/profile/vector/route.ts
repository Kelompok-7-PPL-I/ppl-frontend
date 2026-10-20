import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserProfileVector, initializeUserProfileVector } from '@/lib/recommendation/vectorizer';

export const dynamic = 'force-dynamic';

/**
 * Tentukan user mana yang boleh diakses.
 * - Wajib login (session NextAuth).
 * - User biasa hanya boleh mengakses profil miliknya sendiri.
 * - Admin boleh menentukan id_user lain (untuk debugging).
 */
async function resolveUserId(
  requestedId: string | null | undefined
): Promise<{ userId: string } | { error: NextResponse }> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; peran?: string } | undefined;

  if (!user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (requestedId && requestedId !== user.id) {
    if (user.peran !== 'admin') {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { userId: requestedId };
  }

  return { userId: user.id };
}

// Lihat user profile vector milik user yang sedang login
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const resolved = await resolveUserId(searchParams.get('id_user'));
  if ('error' in resolved) return resolved.error;

  try {
    const profile = await getUserProfileVector(resolved.userId);
    if (!profile) {
      return NextResponse.json({ error: 'User profile vector tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error('Error fetching user profile vector:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// Hitung ulang user profile vector dari preferensi onboarding
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const resolved = await resolveUserId(typeof body?.id_user === 'string' ? body.id_user : null);
  if ('error' in resolved) return resolved.error;

  try {
    const vector = await initializeUserProfileVector(resolved.userId);
    return NextResponse.json({
      message: 'User profile vector berhasil di-inisialisasi ulang dari preferensi onboarding',
      data: { id_user: resolved.userId, vector },
    });
  } catch (error) {
    console.error('Error re-initializing user profile vector:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}