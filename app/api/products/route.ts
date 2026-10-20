import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { vectorizeProduct } from '@/lib/recommendation/vectorizer';

export const dynamic = 'force-dynamic';

// "" / null → kosongkan relasi; angka valid → ID
const optionalId = (v: unknown) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
};

// Kelompok bahan & wilayah dipakai engine rekomendasi; hanya diubah kalau dikirim
const relationFields = (data: Record<string, unknown>) => ({
    ...('kelompok' in data ? { kelompok_bahan_pangan: optionalId(data.kelompok) } : {}),
    ...('wilayah' in data ? { id_wilayah: optionalId(data.wilayah) } : {}),
});

// Perbarui item vector produk supaya rekomendasi ikut data terbaru. Gagal tidak menggagalkan simpan.
const refreshVector = (id: number) =>
    vectorizeProduct(id).catch((e) => console.error('Gagal vectorize produk:', e));

export async function GET() {
    try {
        // 1. Coba ambil data pakai Prisma
        const products = await prisma.produk.findMany({
            orderBy: { id_produk: 'desc' }
        });

        // 2. KASIH LOG: Cek di terminal VS Code kamu, muncul gak angkanya?
        console.log("Jumlah produk ditemukan Prisma:", products.length);

        return NextResponse.json(products);
    } catch (error: any) {
        console.error("Prisma Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();

        const product = await prisma.produk.create({
            data: {
                nama_produk: data.nama,          // Membaca 'nama' dari frontend
                harga: Number(data.harga),       // Dipaksa jadi angka
                stok: Number(data.stok),         // Dipaksa jadi angka
                deskripsi: data.deskripsi,
                gambar_url: data.gambar,        // Membaca 'gambar' dari frontend
                ...relationFields(data),
            }
        });
        await refreshVector(product.id_produk);
        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: "Gagal simpan: " + error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const data = await req.json();
        const product = await prisma.produk.update({
            where: { id_produk: Number(data.id) },
            data: {
                nama_produk: data.nama,
                harga: Number(data.harga),
                stok: Number(data.stok),
                deskripsi: data.deskripsi,
                gambar_url: data.gambar,
                ...relationFields(data),
            }
        });
        await refreshVector(product.id_produk);
        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: "Gagal update: " + error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        if (!id) throw new Error("ID tidak valid");
        await prisma.produk.delete({
            where: { id_produk: Number(id) }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Gagal menghapus: " + error.message }, { status: 500 });
    }
}