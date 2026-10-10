"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from "@/app/context/ToastContext";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Produk {
  id_produk: number;
  nama_produk: string;
  harga: number;
  gambar_url: string | null;
}

interface CartItem {
  id_item?: number;
  produk: Produk;
  kuantitas: number;
  catatan: string;
}

interface Order {
  id_pesanan: number;
  id_user: string;
  tanggal_pesanan: string;
  total_harga: number;
  status_pembayaran: string;
  order_status: string;
}

// ✅ FIX: lowercase selaras dengan AddOrder
type OrderStatus   = "dikemas" | "dikirim" | "selesai" | "dibatalkan";
type PaymentStatus = "pending" | "dibayar" | "gagal";

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string; icon: string }[] = [
  { value: "dikemas",    label: "Dikemas",    icon: "📦" },
  { value: "dikirim",    label: "Dikirim",    icon: "🚚" },
  { value: "selesai",    label: "Selesai",    icon: "✅" },
  { value: "dibatalkan", label: "Dibatalkan", icon: "❌" },
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "dibayar", label: "Dibayar" },
  { value: "gagal",   label: "Gagal" },
];

/* ── Icons ──────────────────────────────────────────────────────────────── */
const SearchIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const PlusIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const MinusIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const TrashIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
const ChevronLeft = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;

export default function EditOrderPage() {
  const router   = useRouter();
  const params   = useParams();
  const orderId  = Number(params?.id);
  const supabase = createClient();
  const { toast } = useToast();

  /* ── State ────────────────────────────────────────────────────────────── */
  const [order,          setOrder]          = useState<Order | null>(null);
  const [pageLoading,    setPageLoading]    = useState(true);

  const [cart,           setCart]           = useState<CartItem[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([]);

  const [produkList,     setProdukList]     = useState<Produk[]>([]);
  const [produkSearch,   setProdukSearch]   = useState("");
  const [showCatalog,    setShowCatalog]    = useState(false);

  const [orderStatus,    setOrderStatus]    = useState<OrderStatus>("dikemas");
  const [paymentStatus,  setPaymentStatus]  = useState<PaymentStatus>("pending"); // ✅ FIX: lowercase default
  const [ongkir,         setOngkir]         = useState(0);

  const [saving,  setSaving]  = useState(false);

  /* ── Load order + items ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!orderId) return;
    (async () => {
      setPageLoading(true);

      const [{ data: pesanan }, { data: items }, { data: produk }] = await Promise.all([
        supabase.from("pesanan").select("*").eq("id_pesanan", orderId).single(),
        supabase.from("item_pesanan").select("*, produk(id_produk, nama_produk, harga, gambar_url)").eq("id_pesanan", orderId),
        supabase.from("produk").select("id_produk, nama_produk, harga, gambar_url").order("nama_produk"),
      ]);

      if (pesanan) {
        setOrder(pesanan);
        setOrderStatus((pesanan.order_status as OrderStatus) || "dikemas");
        // ✅ FIX: normalize ke lowercase saat load (jaga-jaga data lama pakai capitalize)
        const rawPayment = (pesanan.status_pembayaran as string || "pending").toLowerCase() as PaymentStatus;
        setPaymentStatus(rawPayment);

        const itemSubtotal = (items || []).reduce((s: number, i: any) => s + Number(i.subtotal), 0);
        setOngkir(Math.max(0, Number(pesanan.total_harga) - itemSubtotal));
      }

      if (items) {
        setCart(items.map((i: any) => ({
          id_item: i.id_item,
          produk: i.produk as Produk,
          kuantitas: i.kuantitas,
          catatan: i.catatan || "",
        })));
      }

      if (produk) setProdukList(produk);

      setPageLoading(false);
    })();
  }, [orderId]);

  /* ── Cart helpers ─────────────────────────────────────────────────────── */
  const addToCart = (produk: Produk) => {
    if (cart.find(c => c.produk.id_produk === produk.id_produk)) return;
    setCart(prev => [...prev, { produk, kuantitas: 1, catatan: "" }]);
    setShowCatalog(false);
  };

  const updateQty = (id: number, delta: number) =>
    setCart(prev => prev.map(c => c.produk.id_produk === id
      ? { ...c, kuantitas: Math.max(1, c.kuantitas + delta) } : c));

  const removeFromCart = (id: number) => {
    const item = cart.find(c => c.produk.id_produk === id);
    if (item?.id_item) setDeletedItemIds(prev => [...prev, item.id_item!]);
    setCart(prev => prev.filter(c => c.produk.id_produk !== id));
  };

  const updateCatatan = (id: number, val: string) =>
    setCart(prev => prev.map(c => c.produk.id_produk === id ? { ...c, catatan: val } : c));

  /* ── Derived ──────────────────────────────────────────────────────────── */
  const subtotal = cart.reduce((s, c) => s + c.produk.harga * c.kuantitas, 0);
  const total    = subtotal + ongkir;

  const filteredProduk = produkList
    .filter(p => p.nama_produk.toLowerCase().includes(produkSearch.toLowerCase()))
    .filter(p => !cart.find(c => c.produk.id_produk === p.id_produk));

  /* ── Save ─────────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!order) return;
    if (cart.length === 0) { toast.warning("Tambahkan setidaknya satu produk."); return; }
    setSaving(true);
    try {
      // 1. Update pesanan — ✅ FIX: simpan lowercase selaras dengan add
      await supabase.from("pesanan").update({
        total_harga:       total,
        status_pembayaran: paymentStatus, // lowercase: "pending"|"dibayar"|"gagal"
        order_status:      orderStatus,
      }).eq("id_pesanan", order.id_pesanan);

      // 2. Hapus item yang diremove
      if (deletedItemIds.length > 0) {
        await supabase.from("item_pesanan").delete().in("id_item", deletedItemIds);
      }

      // 3. Upsert setiap cart item
      for (const c of cart) {
        if (c.id_item) {
          await supabase.from("item_pesanan").update({
            kuantitas: c.kuantitas,
            subtotal:  c.produk.harga * c.kuantitas,
            catatan:   c.catatan || null,
          }).eq("id_item", c.id_item);
        } else {
          await supabase.from("item_pesanan").insert([{
            id_pesanan: order.id_pesanan,
            id_produk:  c.produk.id_produk,
            kuantitas:  c.kuantitas,
            subtotal:   c.produk.harga * c.kuantitas,
            catatan:    c.catatan || null,
          }]);
        }
      }

      router.refresh();
      toast.success("Order berhasil diperbarui!");
      router.push("/admin/orders");
    } catch (err: any) {
      toast.danger(err?.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (pageLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#888" }}>
      Memuat data order...
    </div>
  );

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .eo-page {
          min-height: 100vh;
          background: #f5f3ee;
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #1a1a1a;
        }

        .eo-topbar {
          display: flex; align-items: center; gap: 12px;
          padding: 18px 32px;
          background: #fff;
          border-bottom: 1px solid #e8e4dc;
          position: sticky; top: 0; z-index: 10;
        }
        .eo-back-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px 7px 10px;
          border: 1.5px solid #e0dbd0; border-radius: 8px;
          background: none; cursor: pointer;
          font-size: 13px; color: #555; transition: all .15s;
        }
        .eo-back-btn:hover { background: #f5f3ee; border-color: #c8c3b8; }
        .eo-topbar h1 { font-size: 17px; font-weight: 700; }
        .eo-order-id { font-size: 13px; color: #888; font-family: monospace; margin-top: 2px; }
        .eo-topbar-right { margin-left: auto; display: flex; gap: 10px; align-items: center; }

        /* ✅ #f5c800 */
        .eo-save-btn {
          padding: 9px 22px; background: #f5c800; color: #1a1a1a;
          border: none; border-radius: 9px; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: background .15s;
        }
        .eo-save-btn:hover:not(:disabled) { background: #e0b800; }
        .eo-save-btn:disabled { opacity: .6; cursor: not-allowed; }
        .eo-cancel-btn {
          padding: 9px 18px; background: none;
          border: 1.5px solid #e0dbd0; border-radius: 9px;
          font-size: 14px; color: #555; cursor: pointer;
        }
        .eo-cancel-btn:hover { background: #f5f3ee; }

        .eo-body {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
          padding: 28px 32px;
          max-width: 1280px;
        }

        .eo-card {
          background: #fff; border-radius: 14px;
          border: 1px solid #e8e4dc; padding: 24px;
          margin-bottom: 20px;
        }
        .eo-card-title {
          font-size: 13px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .06em;
          color: #888; margin-bottom: 18px; padding-bottom: 12px;
          border-bottom: 1px solid #f0ece4;
        }

        /* User info strip */
        .eo-user-strip {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; background: #f5f3ee;
          border-radius: 10px; border: 1px solid #e8e4dc;
        }
        .eo-user-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: #f5c800; color: #1a1a1a;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 15px; flex-shrink: 0;
        }
        .eo-user-id { font-size: 11px; color: #999; font-family: monospace; margin-top: 2px; }
        .eo-user-note { font-size: 12px; color: #aaa; margin-top: 8px; font-style: italic; }

        /* Items list */
        .eo-cart-item {
          display: flex; gap: 12px;
          padding: 14px 0; border-bottom: 1px solid #f0ece4;
        }
        .eo-cart-item:last-child { border-bottom: none; }
        .eo-cart-img {
          width: 54px; height: 54px; border-radius: 8px;
          object-fit: cover; background: #f0ece4; flex-shrink: 0;
        }
        .eo-cart-img-ph {
          width: 54px; height: 54px; border-radius: 8px;
          background: #f0ece4; display: flex; align-items: center;
          justify-content: center; font-size: 22px; flex-shrink: 0;
        }
        .eo-cart-info { flex: 1; }
        .eo-cart-name { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
        .eo-cart-price { font-size: 12px; color: #888; }
        .eo-cart-note {
          margin-top: 6px; width: 100%;
          padding: 5px 9px; font-size: 12px;
          border: 1.5px solid #e8e4dc; border-radius: 7px;
          outline: none; color: #555; background: #fafaf8;
          font-family: inherit;
        }
        .eo-cart-note:focus { border-color: #f5c800; background: #fff; }
        .eo-qty-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
        .eo-qty-btn {
          width: 26px; height: 26px; border-radius: 7px;
          border: 1.5px solid #e0dbd0; background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .12s;
        }
        .eo-qty-btn:hover { border-color: #f5c800; color: #b8940a; }
        .eo-qty-val { font-size: 13px; font-weight: 700; min-width: 22px; text-align: center; }
        .eo-remove-btn {
          background: none; border: none; cursor: pointer;
          color: #ef4444; margin-left: auto;
          display: flex; align-items: center; padding: 4px;
          border-radius: 6px; transition: background .12s;
        }
        .eo-remove-btn:hover { background: #fef2f2; }

        /* Add product toggle */
        .eo-add-product-btn {
          width: 100%; padding: 10px; margin-top: 12px;
          border: 1.5px dashed #f5c800; border-radius: 9px;
          background: #fffde6; color: #7a6000;
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all .15s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-family: inherit;
        }
        .eo-add-product-btn:hover { background: #fff9c2; }

        /* Catalog dropdown */
        .eo-catalog-wrap { margin-top: 14px; }
        .eo-catalog-search-wrap { position: relative; margin-bottom: 12px; }
        .eo-catalog-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #aaa; }
        .eo-catalog-search {
          width: 100%; padding: 9px 14px 9px 36px;
          border: 1.5px solid #e0dbd0; border-radius: 9px;
          font-size: 13.5px; background: #fafaf8; outline: none;
          font-family: inherit;
        }
        .eo-catalog-search:focus { border-color: #f5c800; background: #fff; }
        .eo-catalog-list { max-height: 260px; overflow-y: auto; }
        .eo-catalog-list::-webkit-scrollbar { width: 5px; }
        .eo-catalog-list::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
        .eo-catalog-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 9px;
          cursor: pointer; transition: background .12s;
        }
        .eo-catalog-item:hover { background: #f5f3ee; }
        .eo-catalog-img {
          width: 40px; height: 40px; border-radius: 7px;
          object-fit: cover; flex-shrink: 0; background: #f0ece4;
        }
        .eo-catalog-img-ph {
          width: 40px; height: 40px; border-radius: 7px;
          background: #f0ece4; display: flex; align-items: center;
          justify-content: center; font-size: 18px; flex-shrink: 0;
        }

        /* Summary */
        .eo-ongkir-wrap { position: relative; margin-bottom: 16px; }
        .eo-ongkir-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #888; }
        .eo-ongkir-input {
          width: 100%; padding: 9px 14px 9px 42px;
          border: 1.5px solid #e0dbd0; border-radius: 9px;
          font-size: 14px; background: #fafaf8; outline: none;
          font-family: inherit;
        }
        .eo-ongkir-input:focus { border-color: #f5c800; background: #fff; }

        .eo-summary-row {
          display: flex; justify-content: space-between;
          font-size: 13.5px; color: #555; margin-bottom: 10px;
        }
        .eo-summary-total {
          display: flex; justify-content: space-between;
          font-size: 16px; font-weight: 800; color: #1a1a1a;
          margin-top: 14px; padding-top: 14px;
          border-top: 2px solid #f0ece4;
        }

        /* ✅ Status chips — naming selaras dengan AddOrder (os-/ps- prefix) */
        .eo-status-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .eo-status-chip {
          padding: 7px 14px; border-radius: 20px;
          border: 1.5px solid #e0dbd0; font-size: 13px;
          cursor: pointer; transition: all .13s;
          background: #fafaf8; color: #555; font-family: inherit;
        }
        .eo-status-chip.os-dikemas    { background: #fffde6; border-color: #f5c800; color: #7a6000; font-weight: 700; }
        .eo-status-chip.os-dikirim    { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; font-weight: 700; }
        .eo-status-chip.os-selesai    { background: #f0fdf4; border-color: #22c55e; color: #166534; font-weight: 700; }
        .eo-status-chip.os-dibatalkan { background: #fef2f2; border-color: #ef4444; color: #991b1b; font-weight: 700; }

        .eo-pay-chip {
          padding: 7px 16px; border-radius: 20px;
          border: 1.5px solid #e0dbd0; font-size: 13px;
          cursor: pointer; transition: all .13s;
          background: #fafaf8; color: #555; font-family: inherit;
        }
        .eo-pay-chip.ps-pending { background: #fffde6; border-color: #f5c800; color: #7a6000; font-weight: 700; }
        .eo-pay-chip.ps-dibayar { background: #f0fdf4; border-color: #10b981; color: #065f46; font-weight: 700; }
        .eo-pay-chip.ps-gagal   { background: #fef2f2; border-color: #ef4444; color: #991b1b; font-weight: 700; }

        .eo-errmsg {
          padding: 10px 14px; background: #fef2f2; color: #991b1b;
          border-radius: 8px; font-size: 13px; margin-top: 4px;
        }

        .eo-new-badge {
          display: inline-block; padding: 2px 8px;
          background: #fffde6; border: 1px solid #f5c800;
          color: #7a6000; border-radius: 10px;
          font-size: 11px; font-weight: 700; margin-left: 8px;
        }
      `}</style>

      <div className="eo-page">
        {/* Topbar */}
        <div className="eo-topbar">
            <button suppressHydrationWarning className="eo-back-btn" onClick={() => window.location.href = '/admin/orders'}>
            <ChevronLeft /> Kembali
            </button>
          <div>
            <h1>Edit Order</h1>
            <div className="eo-order-id">#{orderId}</div>
          </div>
          <div suppressHydrationWarning className="eo-topbar-right">
            <button suppressHydrationWarning className="eo-cancel-btn" onClick={() => window.location.href = '/admin/orders'}>
              Batal
            </button>
            <button suppressHydrationWarning className="eo-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>

        <div className="eo-body">
          {/* ── Kiri ── */}
          <div>
            {/* User info (read-only) */}
            <div className="eo-card">
              <div className="eo-card-title">User</div>
              <div className="eo-user-strip">
                <div className="eo-user-avatar">
                  {order?.id_user?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>User ID</div>
                  <div className="eo-user-id">{order?.id_user}</div>
                </div>
              </div>
              <div className="eo-user-note">User tidak dapat diubah saat edit order.</div>
            </div>

            {/* Items */}
            <div className="eo-card">
              <div className="eo-card-title">Item Pesanan</div>

              {cart.map(c => (
                <div className="eo-cart-item" key={c.produk.id_produk}>
                  {c.produk.gambar_url
                    ? <img src={c.produk.gambar_url} alt={c.produk.nama_produk} className="eo-cart-img" />
                    : <div className="eo-cart-img-ph">🌾</div>
                  }
                  <div className="eo-cart-info">
                    <div className="eo-cart-name">
                      {c.produk.nama_produk}
                      {!c.id_item && <span className="eo-new-badge">Baru</span>}
                    </div>
                    <div className="eo-cart-price">Rp {c.produk.harga?.toLocaleString("id-ID")} / pcs</div>
                    <div className="eo-qty-row">
                      <button suppressHydrationWarning className="eo-qty-btn" onClick={() => updateQty(c.produk.id_produk, -1)}><MinusIcon /></button>
                      <span className="eo-qty-val">{c.kuantitas}</span>
                      <button suppressHydrationWarning className="eo-qty-btn" onClick={() => updateQty(c.produk.id_produk, 1)}><PlusIcon /></button>
                      <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700 }}>
                        Rp {(c.produk.harga * c.kuantitas).toLocaleString("id-ID")}
                      </span>
                      <button suppressHydrationWarning className="eo-remove-btn" onClick={() => removeFromCart(c.produk.id_produk)}><TrashIcon /></button>
                    </div>
                    <input
                      suppressHydrationWarning
                      className="eo-cart-note"
                      placeholder="Catatan (opsional)..."
                      value={c.catatan}
                      onChange={e => updateCatatan(c.produk.id_produk, e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <button suppressHydrationWarning className="eo-add-product-btn" onClick={() => setShowCatalog(v => !v)}>
                <PlusIcon /> {showCatalog ? "Tutup Katalog" : "Tambah Produk"}
              </button>

              {showCatalog && (
                <div className="eo-catalog-wrap">
                  <div className="eo-catalog-search-wrap">
                    <span className="eo-catalog-search-icon"><SearchIcon /></span>
                    <input
                      suppressHydrationWarning
                      className="eo-catalog-search"
                      placeholder="Cari produk..."
                      value={produkSearch}
                      onChange={e => setProdukSearch(e.target.value)}
                    />
                  </div>
                  <div className="eo-catalog-list">
                    {filteredProduk.length === 0
                      ? <div style={{ textAlign: "center", color: "#aaa", padding: "16px 0", fontSize: 13 }}>Tidak ada produk</div>
                      : filteredProduk.map(p => (
                        <div suppressHydrationWarning className="eo-catalog-item" key={p.id_produk} onClick={() => addToCart(p)}>
                          {p.gambar_url
                            ? <img src={p.gambar_url} alt={p.nama_produk} className="eo-catalog-img" />
                            : <div className="eo-catalog-img-ph">🌾</div>
                          }
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nama_produk}</div>
                            <div style={{ fontSize: 12, color: "#b8940a", fontWeight: 700 }}>Rp {p.harga?.toLocaleString("id-ID")}</div>
                          </div>
                          <div style={{ marginLeft: "auto", color: "#b8940a" }}><PlusIcon /></div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Kanan ── */}
          <div>
            {/* Summary */}
            <div className="eo-card">
              <div className="eo-card-title">Ringkasan Harga</div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Ongkos Kirim</label>
              <div className="eo-ongkir-wrap">
                <span className="eo-ongkir-prefix">Rp</span>
                <input
                  type="number"
                  className="eo-ongkir-input"
                  value={ongkir}
                  min={0}
                  onChange={e => setOngkir(Number(e.target.value))}
                />
              </div>
              <div className="eo-summary-row"><span>Subtotal</span><span>Rp {subtotal.toLocaleString("id-ID")}</span></div>
              <div className="eo-summary-row"><span>Ongkir</span><span>Rp {ongkir.toLocaleString("id-ID")}</span></div>
              <div className="eo-summary-total">
                <span>Total</span>
                <span style={{ color: "#b8940a" }}>Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Status Order */}
            <div className="eo-card">
              <div className="eo-card-title">Status Order</div>
              <div className="eo-status-group">
                {ORDER_STATUS_OPTIONS.map(s => (
                  <button
                    suppressHydrationWarning
                    key={s.value}
                    className={`eo-status-chip ${orderStatus === s.value ? `os-${s.value}` : ""}`}
                    onClick={() => setOrderStatus(s.value)}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Pembayaran */}
            <div className="eo-card">
              <div className="eo-card-title">Status Pembayaran</div>
              <p style={{ fontSize: 12, color: "#999", marginBottom: 12, lineHeight: 1.5 }}>
                Ubah status pembayaran secara manual jika diperlukan (misal: konfirmasi transfer bank atau pembayaran COD).
              </p>
              <div className="eo-status-group">
                {PAYMENT_STATUS_OPTIONS.map(s => (
                  <button   
                    suppressHydrationWarning
                    key={s.value}
                    className={`eo-pay-chip ${paymentStatus === s.value ? `ps-${s.value}` : ""}`}
                    onClick={() => setPaymentStatus(s.value as PaymentStatus)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meta */}
            {order && (
              <div className="eo-card" style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 12, color: "#aaa" }}>
                  <div>Dibuat: <strong style={{ color: "#666" }}>{new Date(order.tanggal_pesanan).toLocaleString("id-ID")}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}