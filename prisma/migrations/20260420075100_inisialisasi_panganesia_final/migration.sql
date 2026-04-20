-- CreateTable
CREATE TABLE "pengguna" (
    "id" UUID NOT NULL,
    "nama" VARCHAR,
    "email" VARCHAR NOT NULL,
    "alamat" TEXT,
    "nomor_telp" VARCHAR,
    "peran" VARCHAR NOT NULL DEFAULT 'user',
    "dibuat_pada" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produk" (
    "id_produk" SERIAL NOT NULL,
    "nama_produk" VARCHAR NOT NULL,
    "deskripsi" TEXT,
    "harga" DECIMAL(12,2) NOT NULL,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "gambar_url" VARCHAR,
    "is_promo" BOOLEAN NOT NULL DEFAULT false,
    "dibuat_pada" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produk_pkey" PRIMARY KEY ("id_produk")
);

-- CreateTable
CREATE TABLE "resep" (
    "id_resep" SERIAL NOT NULL,
    "judul_resep" VARCHAR NOT NULL,
    "bahan_bahan" TEXT,
    "langkah_masak" TEXT,
    "kategori_jenis" VARCHAR,
    "informasi_gizi" TEXT,
    "deskripsi_singkat" TEXT,
    "gambar_url" VARCHAR,
    "waktu_masak" INTEGER,
    "id_kategori" INTEGER,

    CONSTRAINT "resep_pkey" PRIMARY KEY ("id_resep")
);

-- CreateTable
CREATE TABLE "kategori" (
    "id_kategori" SERIAL NOT NULL,
    "nama_kategori" VARCHAR NOT NULL,
    "icon_url" TEXT,

    CONSTRAINT "kategori_pkey" PRIMARY KEY ("id_kategori")
);

-- CreateTable
CREATE TABLE "favorit_produk" (
    "id_fav" SERIAL NOT NULL,
    "id_user" UUID NOT NULL,
    "id_produk" INTEGER NOT NULL,

    CONSTRAINT "favorit_produk_pkey" PRIMARY KEY ("id_fav")
);

-- CreateTable
CREATE TABLE "favorit_resep" (
    "id_fav" SERIAL NOT NULL,
    "id_user" UUID NOT NULL,
    "id_resep" INTEGER NOT NULL,

    CONSTRAINT "favorit_resep_pkey" PRIMARY KEY ("id_fav")
);

-- CreateTable
CREATE TABLE "pesanan" (
    "id_pesanan" SERIAL NOT NULL,
    "id_user" UUID NOT NULL,
    "tanggal_pesanan" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_harga" DECIMAL(12,2) NOT NULL,
    "status_pembayaran" VARCHAR NOT NULL,
    "metode_bayar" VARCHAR,

    CONSTRAINT "pesanan_pkey" PRIMARY KEY ("id_pesanan")
);

-- CreateTable
CREATE TABLE "item_pesanan" (
    "id_item" SERIAL NOT NULL,
    "id_pesanan" INTEGER NOT NULL,
    "id_produk" INTEGER NOT NULL,
    "kuantitas" INTEGER NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "item_pesanan_pkey" PRIMARY KEY ("id_item")
);

-- CreateTable
CREATE TABLE "keranjang" (
    "id_keranjang" SERIAL NOT NULL,
    "id_user" UUID NOT NULL,
    "id_produk" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "dibuat_pada" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keranjang_pkey" PRIMARY KEY ("id_keranjang")
);

-- CreateTable
CREATE TABLE "ulasan" (
    "id_ulasan" SERIAL NOT NULL,
    "id_user" UUID NOT NULL,
    "id_produk" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "komentar" TEXT,
    "tanggal_ulasan" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ulasan_pkey" PRIMARY KEY ("id_ulasan")
);

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_email_key" ON "pengguna"("email");

-- CreateIndex
CREATE UNIQUE INDEX "favorit_produk_id_user_id_produk_key" ON "favorit_produk"("id_user", "id_produk");

-- CreateIndex
CREATE UNIQUE INDEX "favorit_resep_id_user_id_resep_key" ON "favorit_resep"("id_user", "id_resep");

-- AddForeignKey
ALTER TABLE "resep" ADD CONSTRAINT "resep_id_kategori_fkey" FOREIGN KEY ("id_kategori") REFERENCES "kategori"("id_kategori") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorit_produk" ADD CONSTRAINT "favorit_produk_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorit_produk" ADD CONSTRAINT "favorit_produk_id_produk_fkey" FOREIGN KEY ("id_produk") REFERENCES "produk"("id_produk") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorit_resep" ADD CONSTRAINT "favorit_resep_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorit_resep" ADD CONSTRAINT "favorit_resep_id_resep_fkey" FOREIGN KEY ("id_resep") REFERENCES "resep"("id_resep") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pesanan" ADD CONSTRAINT "item_pesanan_id_pesanan_fkey" FOREIGN KEY ("id_pesanan") REFERENCES "pesanan"("id_pesanan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pesanan" ADD CONSTRAINT "item_pesanan_id_produk_fkey" FOREIGN KEY ("id_produk") REFERENCES "produk"("id_produk") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keranjang" ADD CONSTRAINT "keranjang_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keranjang" ADD CONSTRAINT "keranjang_id_produk_fkey" FOREIGN KEY ("id_produk") REFERENCES "produk"("id_produk") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ulasan" ADD CONSTRAINT "ulasan_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ulasan" ADD CONSTRAINT "ulasan_id_produk_fkey" FOREIGN KEY ("id_produk") REFERENCES "produk"("id_produk") ON DELETE RESTRICT ON UPDATE CASCADE;
