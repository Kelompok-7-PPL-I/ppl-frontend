import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const id_pesanan = parseInt(id);
        if (!id_pesanan || isNaN(id_pesanan)) {
            return NextResponse.json({ error: 'ID pesanan tidak valid.' }, { status: 400 });
        }

        const body = await req.json();
        const { alasan_pembatalan } = body;

        if (!alasan_pembatalan) {
            return NextResponse.json({ error: 'Alasan pembatalan wajib diisi.' }, { status: 400 });
        }

        const id_user = (session.user as any).id;

        const pesanan = await prisma.pesanan.findFirst({
            where: {
                id_pesanan,
                id_user,
            },
        });

        if (!pesanan) {
            return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
        }

        if (pesanan.order_status === 'dibatalkan') {
            return NextResponse.json({ error: 'Pesanan sudah dibatalkan.' }, { status: 400 });
        }

        const sudahBayar =
            pesanan.status_pembayaran === 'settlement' ||
            pesanan.status_pembayaran === 'dibayar';

        if (sudahBayar) {
            return NextResponse.json(
                { error: 'Pesanan yang sudah dibayar tidak dapat dibatalkan.' },
                { status: 400 }
            );
        }

        await prisma.pesanan.update({
            where: { id_pesanan },
            data: {
                order_status: 'dibatalkan',
                alasan_pembatalan,
                tanggal_pembatalan: new Date(),
            },
        });

        return NextResponse.json({ message: 'Pesanan berhasil dibatalkan.' });

    } catch (error) {
        console.error('[CANCEL ORDER ERROR]', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
    }
}