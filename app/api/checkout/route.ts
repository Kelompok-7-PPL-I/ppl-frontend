import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const Midtrans = require("midtrans-client");

// ── tambah "reorder" ke union type ──────────────────────────────
type CheckoutMode = "cart" | "selected_cart" | "buy_now" | "reorder" | "recipe_checkout";

type CheckoutBodyItem = {
  id?: string | number;
  id_produk?: string | number;
  name?: string;
  price?: number;
  quantity?: number;
  jumlah?: number;
  image?: string;
  note?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id_user = (session.user as any).id;

    const body = await request.json();

    const {
      mode = "cart",
      userDetails,
      items = [],
      shippingCost = 0,
    }: {
      mode?: CheckoutMode;
      userDetails?: {
        nama?: string;
        email?: string;
        nomor_telp?: string;
      };
      items?: CheckoutBodyItem[];
      shippingCost?: number;
    } = body;

    // ── normalise mode — termasuk "reorder" ─────────────────────
    const checkoutMode: CheckoutMode =
      mode === "selected_cart" || mode === "buy_now" || mode === "reorder" || mode === "recipe_checkout"
        ? mode
        : "cart";

    const orderId = `PANGAN-${Date.now()}`;

    const requestedItems = items
      .map((item) => {
        const idProduk = Number(item.id_produk ?? item.id);
        const quantity = Number(item.quantity ?? item.jumlah ?? 1);

        return {
          id_produk: idProduk,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
          note: item.note || null,
        };
      })
      .filter((item) => Number.isFinite(item.id_produk) && item.id_produk > 0);

    let checkoutItems: {
      id_produk: number;
      harga: number;
      quantity: number;
      note: string | null;
    }[] = [];

    // ── CART ────────────────────────────────────────────────────
    if (checkoutMode === "cart") {
      const isiKeranjang = await prisma.keranjang.findMany({
        where: { id_user },
        include: { produk: true },
        orderBy: { dibuat_pada: "asc" },
      });

      if (isiKeranjang.length === 0) {
        return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });
      }

      checkoutItems = isiKeranjang.map((item, index) => ({
        id_produk: item.id_produk,
        harga: Number(item.produk.harga),
        quantity: item.jumlah,
        note: requestedItems[index]?.note || null,
      }));
    }

    // ── SELECTED CART ────────────────────────────────────────────
    if (checkoutMode === "selected_cart") {
      if (requestedItems.length === 0) {
        return NextResponse.json(
          { error: "Tidak ada produk yang dipilih" },
          { status: 400 }
        );
      }

      const selectedProductIds = requestedItems.map((item) => item.id_produk);

      const selectedCartItems = await prisma.keranjang.findMany({
        where: { id_user, id_produk: { in: selectedProductIds } },
        include: { produk: true },
        orderBy: { dibuat_pada: "asc" },
      });

      if (selectedCartItems.length === 0) {
        return NextResponse.json(
          { error: "Produk pilihan tidak ditemukan di keranjang" },
          { status: 400 }
        );
      }

      checkoutItems = selectedCartItems.map((cartItem) => {
        const requested = requestedItems.find(
          (item) => item.id_produk === cartItem.id_produk
        );

        return {
          id_produk: cartItem.id_produk,
          harga: Number(cartItem.produk.harga),
          quantity: cartItem.jumlah,
          note: requested?.note || null,
        };
      });
    }

    // ── BUY NOW ──────────────────────────────────────────────────
    if (checkoutMode === "buy_now") {
      if (requestedItems.length === 0) {
        return NextResponse.json(
          { error: "Produk tidak ditemukan" },
          { status: 400 }
        );
      }

      const buyNowProductIds = requestedItems.map((item) => item.id_produk);

      const products = await prisma.produk.findMany({
        where: { id_produk: { in: buyNowProductIds } },
      });

      if (products.length === 0) {
        return NextResponse.json(
          { error: "Produk tidak ditemukan" },
          { status: 400 }
        );
      }

      checkoutItems = products.map((product) => {
        const requested = requestedItems.find(
          (item) => item.id_produk === product.id_produk
        );

        return {
          id_produk: product.id_produk,
          harga: Number(product.harga),
          quantity: requested?.quantity || 1,
          note: requested?.note || null,
        };
      });
    }

    // ── RECIPE CHECKOUT ──────────────────────────────────────────
    // Seperti buy_now: ambil harga terbaru dari DB, skip keranjang.
    // Dipakai untuk flow "Beli Semua Bahan" dari halaman resep.
    if (checkoutMode === "recipe_checkout") {
      if (requestedItems.length === 0) {
        return NextResponse.json(
          { error: "Tidak ada produk untuk dibeli" },
          { status: 400 }
        );
      }

      const recipeProductIds = requestedItems.map((item) => item.id_produk);

      const products = await prisma.produk.findMany({
        where: { id_produk: { in: recipeProductIds } },
      });

      if (products.length === 0) {
        return NextResponse.json(
          { error: "Produk tidak ditemukan" },
          { status: 400 }
        );
      }

      checkoutItems = products.map((product) => {
        const requested = requestedItems.find(
          (item) => item.id_produk === product.id_produk
        );

        return {
          id_produk: product.id_produk,
          harga: Number(product.harga),
          quantity: requested?.quantity || 1,
          note: requested?.note || null,
        };
      });
    }

    // ── REORDER ──────────────────────────────────────────────────
    // Sama seperti buy_now: ambil harga terbaru dari DB,
    // tapi pakai quantity dari request (bukan DB).
    // TIDAK sentuh keranjang sama sekali.
    if (checkoutMode === "reorder") {
      if (requestedItems.length === 0) {
        return NextResponse.json(
          { error: "Tidak ada produk untuk reorder" },
          { status: 400 }
        );
      }

      const reorderProductIds = requestedItems.map((item) => item.id_produk);

      const products = await prisma.produk.findMany({
        where: { id_produk: { in: reorderProductIds } },
      });

      if (products.length === 0) {
        return NextResponse.json(
          { error: "Produk reorder tidak ditemukan" },
          { status: 400 }
        );
      }

      checkoutItems = products.map((product) => {
        const requested = requestedItems.find(
          (item) => item.id_produk === product.id_produk
        );

        return {
          id_produk: product.id_produk,
          harga: Number(product.harga),       // harga terbaru dari DB
          quantity: requested?.quantity || 1,  // quantity dari pesanan lama
          note: requested?.note || null,
        };
      });
    }

    if (checkoutItems.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada item untuk checkout" },
        { status: 400 }
      );
    }

    // ── Hitung total — satu sumber kebenaran ─────────────────────
    // subtotal dihitung dari checkoutItems (harga DB × quantity),
    // bukan dari body.subtotal / body.totalAmount yang dikirim client.
    // Ini mencegah manipulasi harga dari sisi client.
    const subtotal = checkoutItems.reduce(
      (acc, item) => acc + item.harga * item.quantity,
      0
    );

    const ongkir = Number(shippingCost) || 0;
    const totalAmount = subtotal + ongkir;

    // ── Simpan pesanan ke DB ─────────────────────────────────────
    const newOrder = await prisma.$transaction(async (tx: any) => {
      const pesanan = await tx.pesanan.create({
        data: {
          order_id: orderId,
          id_user,
          total_harga: totalAmount,
          status_pembayaran: "pending",
        },
      });

      for (const item of checkoutItems) {
        await tx.itemPesanan.create({
          data: {
            id_pesanan: pesanan.id_pesanan,
            id_produk: item.id_produk,
            kuantitas: item.quantity,
            subtotal: item.harga * item.quantity,
            catatan: item.note,
          },
        });
      }

      /*
        PENTING:
        Jangan kosongkan keranjang di sini.
        Hapus cart setelah pembayaran sukses di endpoint
        update status pembayaran atau webhook Midtrans.
      */

      return pesanan;
    });

    // ── Buat Snap token ──────────────────────────────────────────
    const snap = new Midtrans.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY?.trim(),
      clientKey: process.env.MIDTRANS_CLIENT_KEY?.trim(),
    });

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(totalAmount),
      },
      customer_details: {
        first_name:
          userDetails?.nama && userDetails.nama !== "Memuat nama..."
            ? userDetails.nama
            : "Customer",
        email: userDetails?.email || "customer@example.com",
        phone:
          userDetails?.nomor_telp &&
          userDetails.nomor_telp !== "Nomor belum diatur"
            ? userDetails.nomor_telp
            : "081234567890",
      },
      callbacks: {
        finish: `${origin}/DashboardProduct`,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      pesananId: newOrder.id_pesanan,
      orderId,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan checkout" },
      { status: 500 }
    );
  }
}