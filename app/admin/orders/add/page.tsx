"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  stok: number;
  gambar_url: string | null;
}

interface CartItem {
  produk: Produk;
  kuantitas: number;
  catatan: string;
}

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
const UserIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const CheckIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

export default function AddOrderPage() {
  const { toast } = useToast();
  const router   = useRouter();
  const supabase = createClient();

  /* ── State ────────────────────────────────────────────────────────────── */
  const [email,         setEmail]         = useState("");
  const [emailDebounce, setEmailDebounce] = useState("");
  const [userId,        setUserId]        = useState<string | null>(null);
  const [userName,      setUserName]      = useState<string | null>(null);
  const [emailStatus,   setEmailStatus]   = useState<"idle"|"loading"|"found"|"notfound">("idle");

  const [produkList,    setProdukList]    = useState<Produk[]>([]);
  const [produkLoading, setProdukLoading] = useState(true);
  const [produkSearch,  setProdukSearch]  = useState("");
  const [cart,          setCart]          = useState<CartItem[]>([]);

  const [orderStatus,   setOrderStatus]   = useState<OrderStatus>("dikemas");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [ongkir,        setOngkir]        = useState(0);

  const [saving,  setSaving]  = useState(false);

  /* ── Fetch products ───────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      setProdukLoading(true);
      const { data } = await supabase
        .from("produk")
        .select("id_produk, nama_produk, harga, stok, gambar_url")
        .order("nama_produk");
      if (data) setProdukList(data);
      setProdukLoading(false);
    })();
  }, []);

  /* ── Email debounce ───────────────────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setEmailDebounce(email), 500);
    return () => clearTimeout(t);
  }, [email]);

  useEffect(() => {
    if (!emailDebounce || !emailDebounce.includes("@")) {
      setUserId(null); setUserName(null); setEmailStatus("idle");
      return;
    }
    (async () => {
      setEmailStatus("loading");
      const { data } = await supabase
        .from("pengguna")
        .select("id, nama")
        .eq("email", emailDebounce)
        .single();
      if (data) {
        setUserId(data.id);
        setUserName(data.nama || null);
        setEmailStatus("found");
      } else {
        setUserId(null); setUserName(null);
        setEmailStatus("notfound");
      }
    })();
  }, [emailDebounce]);

  /* ── Cart helpers ─────────────────────────────────────────────────────── */
  const addToCart = (produk: Produk) => {
    setCart(prev => {
      const exists = prev.find(c => c.produk.id_produk === produk.id_produk);
      if (exists) return prev.map(c =>
        c.produk.id_produk === produk.id_produk
          ? { ...c, kuantitas: c.kuantitas + 1 }
          : c
      );
      return [...prev, { produk, kuantitas: 1, catatan: "" }];
    });
  };

  const updateQty = (id: number, delta: number) =>
    setCart(prev => prev.map(c =>
      c.produk.id_produk === id
        ? { ...c, kuantitas: Math.max(1, c.kuantitas + delta) }
        : c
    ));

  const removeFromCart = (id: number) =>
    setCart(prev => prev.filter(c => c.produk.id_produk !== id));

  const updateCatatan = (id: number, val: string) =>
    setCart(prev => prev.map(c =>
      c.produk.id_produk === id ? { ...c, catatan: val } : c
    ));

  const isInCart    = (id: number) => cart.some(c => c.produk.id_produk === id);
  const getCartItem = (id: number) => cart.find(c => c.produk.id_produk === id);

  /* ── Derived ──────────────────────────────────────────────────────────── */
  const subtotal       = cart.reduce((s, c) => s + Number(c.produk.harga) * c.kuantitas, 0);
  const total          = subtotal + ongkir;
  const filteredProduk = produkList.filter(p =>
    p.nama_produk.toLowerCase().includes(produkSearch.toLowerCase())
  );

  /* ── Save ─────────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!userId) { toast.warning("Cari dan pilih user terlebih dahulu."); return; }
    if (cart.length === 0) { toast.warning("Tambahkan setidaknya satu produk."); return; }
    setSaving(true);
    try {
      const orderId = `ADMIN-${Date.now()}`;

      const { data: pesanan, error: pErr } = await supabase
        .from("pesanan")
        .insert([{
          order_id:          orderId,
          id_user:           userId,
          total_harga:       total,
          status_pembayaran: paymentStatus,
          order_status:      orderStatus,
          tanggal_pesanan:   new Date().toISOString(),
        }])
        .select()
        .single();

      if (pErr || !pesanan) throw pErr || new Error("Gagal membuat pesanan");

      const items = cart.map(c => ({
        id_pesanan: pesanan.id_pesanan,
        id_produk:  c.produk.id_produk,
        kuantitas:  c.kuantitas,
        subtotal:   Number(c.produk.harga) * c.kuantitas,
        catatan:    c.catatan || null,
      }));

      const { error: iErr } = await supabase.from("item_pesanan").insert(items);
      if (iErr) throw iErr;
      
      toast.success("Order berhasil disimpan.");
      router.refresh();
      router.push("/admin/orders");
    } catch (err: any) {
      toast.danger(err?.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ao-page {
          min-height: 100vh;
          background: #f5f3ee;
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #1a1a1a;
        }

        /* ── Topbar ── */
        .ao-topbar {
          display: flex; align-items: center; gap: 12px;
          padding: 18px 32px;
          background: #fff;
          border-bottom: 1px solid #e8e4dc;
          position: sticky; top: 0; z-index: 10;
        }
        .ao-back-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px 7px 10px;
          border: 1.5px solid #e0dbd0; border-radius: 8px;
          background: none; cursor: pointer;
          font-size: 13px; color: #555; transition: all .15s;
        }
        .ao-back-btn:hover { background: #f5f3ee; border-color: #c8c3b8; }
        .ao-topbar h1 { font-size: 17px; font-weight: 700; }
        .ao-topbar-right { margin-left: auto; display: flex; gap: 10px; align-items: center; }
        .ao-save-btn {
          padding: 9px 22px; background: #f5c800; color: #1a1a1a;
          border: none; border-radius: 9px; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: background .15s;
        }
        .ao-save-btn:hover:not(:disabled) { background: #e0b800; }
        .ao-save-btn:disabled { opacity: .6; cursor: not-allowed; }
        .ao-cancel-btn {
          padding: 9px 18px; background: none;
          border: 1.5px solid #e0dbd0; border-radius: 9px;
          font-size: 14px; color: #555; cursor: pointer;
          font-family: inherit;
        }
        .ao-cancel-btn:hover { background: #f5f3ee; }

        /* ── Layout ── */
        .ao-body {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          padding: 28px 32px;
          max-width: 1400px;
          align-items: start;
        }

        /* ── Card ── */
        .ao-card {
          background: #fff; border-radius: 14px;
          border: 1px solid #e8e4dc; padding: 22px;
          margin-bottom: 20px;
        }
        .ao-card-title {
          font-size: 11.5px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .07em;
          color: #aaa; margin-bottom: 16px; padding-bottom: 12px;
          border-bottom: 1px solid #f0ece4;
          display: flex; align-items: center; justify-content: space-between;
        }

        /* ── Email / User ── */
        .ao-input {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #e0dbd0; border-radius: 9px;
          font-size: 14px; background: #fafaf8;
          outline: none; transition: border-color .15s;
          font-family: inherit;
        }
        .ao-input:focus { border-color: #f5c800; background: #fff; }
        .ao-input.error { border-color: #ef4444; }
        .ao-user-badge {
          display: flex; align-items: center; gap: 8px;
          margin-top: 10px; padding: 9px 13px;
          border-radius: 8px; font-size: 13px;
        }
        .ao-user-badge.found    { background: #f0fdf4; color: #166534; }
        .ao-user-badge.notfound { background: #fef2f2; color: #991b1b; }
        .ao-user-badge.loading  { background: #fffde6; color: #7a6000; }
        .ao-user-uuid { font-size: 11px; color: #bbb; margin-top: 4px; font-family: monospace; padding-left: 2px; }

        /* ── Produk katalog ── */
        .ao-search-wrap { position: relative; margin-bottom: 14px; }
        .ao-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #bbb; }
        .ao-search-input {
          width: 100%; padding: 9px 14px 9px 36px;
          border: 1.5px solid #e0dbd0; border-radius: 9px;
          font-size: 13.5px; background: #fafaf8; outline: none;
          transition: border-color .15s; font-family: inherit;
        }
        .ao-search-input:focus { border-color: #f5c800; background: #fff; }

        .ao-produk-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 2px;
        }
        .ao-produk-grid::-webkit-scrollbar { width: 4px; }
        .ao-produk-grid::-webkit-scrollbar-thumb { background: #e0dbd0; border-radius: 10px; }

        .ao-produk-card {
          border: 1.5px solid #e8e4dc; border-radius: 11px;
          overflow: hidden; cursor: pointer;
          transition: all .15s; background: #fafaf8;
          position: relative;
        }
        .ao-produk-card:hover          { border-color: #f5c800; box-shadow: 0 2px 12px rgba(245,200,0,.18); transform: translateY(-1px); }
        .ao-produk-card.in-cart        { border-color: #f5c800; background: #fffde6; }
        .ao-produk-card.out-of-stock   { opacity: .5; cursor: not-allowed; }

        .ao-produk-img {
          width: 100%; height: 100px; object-fit: cover; background: #f0ece4;
          display: block;
        }
        .ao-produk-img-ph {
          width: 100%; height: 100px;
          background: linear-gradient(135deg, #f0ece4, #e8e4dc);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px;
        }
        .ao-produk-info { padding: 9px 10px 10px; }
        .ao-produk-name  { font-size: 12px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; line-height: 1.3; }
        .ao-produk-price { font-size: 12px; color: #b8940a; font-weight: 700; }
        .ao-produk-stok  { font-size: 10.5px; color: #bbb; margin-top: 2px; }

        .ao-overlay-badge {
          position: absolute; top: 7px; right: 7px;
          width: 22px; height: 22px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
        }
        .ao-overlay-badge.check { background: #f5c800; color: #1a1a1a; }
        .ao-overlay-badge.plus  {
          background: rgba(255,255,255,.9); color: #b8940a;
          border: 1.5px solid #f5c800;
          opacity: 0; transition: opacity .15s;
        }
        .ao-produk-card:hover .ao-overlay-badge.plus { opacity: 1; }

        .ao-cart-qty-pill {
          position: absolute; bottom: 7px; right: 7px;
          background: #f5c800; color: #1a1a1a;
          border-radius: 10px; padding: 2px 8px;
          font-size: 11px; font-weight: 700;
        }

        .ao-skeleton {
          height: 160px; border-radius: 11px;
          background: linear-gradient(90deg, #f0ece4 25%, #e8e4dc 50%, #f0ece4 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .ao-produk-count { font-size: 11px; color: #bbb; font-weight: 400; }

        /* ── Cart ── */
        .ao-cart-item {
          display: flex; gap: 11px;
          padding: 13px 0; border-bottom: 1px solid #f5f3ee;
        }
        .ao-cart-item:last-child { border-bottom: none; padding-bottom: 0; }
        .ao-cart-img {
          width: 50px; height: 50px; border-radius: 8px;
          object-fit: cover; background: #f0ece4; flex-shrink: 0;
        }
        .ao-cart-img-ph {
          width: 50px; height: 50px; border-radius: 8px;
          background: linear-gradient(135deg, #f0ece4, #e8e4dc);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .ao-cart-info { flex: 1; min-width: 0; }
        .ao-cart-name  { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .ao-cart-price { font-size: 11.5px; color: #aaa; }
        .ao-qty-row    { display: flex; align-items: center; gap: 7px; margin-top: 7px; }
        .ao-qty-btn {
          width: 25px; height: 25px; border-radius: 7px;
          border: 1.5px solid #e0dbd0; background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .12s; flex-shrink: 0;
        }
        .ao-qty-btn:hover { border-color: #f5c800; color: #b8940a; }
        .ao-qty-val { font-size: 13px; font-weight: 700; min-width: 20px; text-align: center; }
        .ao-subtotal { margin-left: auto; font-size: 13px; font-weight: 700; white-space: nowrap; }
        .ao-remove-btn {
          background: none; border: none; cursor: pointer;
          color: #ddd; padding: 3px; border-radius: 5px;
          display: flex; align-items: center; transition: all .12s;
        }
        .ao-remove-btn:hover { color: #ef4444; background: #fef2f2; }
        .ao-cart-note {
          margin-top: 6px; width: 100%;
          padding: 5px 9px; font-size: 12px;
          border: 1.5px solid #e8e4dc; border-radius: 7px;
          outline: none; color: #555; background: #fafaf8;
          font-family: inherit;
        }
        .ao-cart-note:focus { border-color: #f5c800; background: #fff; }

        .ao-empty-cart {
          text-align: center; padding: 28px 0;
          color: #ccc; font-size: 13px;
        }
        .ao-empty-cart-icon { font-size: 32px; display: block; margin-bottom: 8px; }

        /* ── Ongkir ── */
        .ao-ongkir-wrap { position: relative; }
        .ao-ongkir-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #aaa; }
        .ao-ongkir-input {
          width: 100%; padding: 9px 14px 9px 40px;
          border: 1.5px solid #e0dbd0; border-radius: 9px;
          font-size: 14px; background: #fafaf8; outline: none;
          font-family: inherit;
        }
        .ao-ongkir-input:focus { border-color: #f5c800; background: #fff; }

        /* ── Summary ── */
        .ao-summary-row {
          display: flex; justify-content: space-between;
          font-size: 13px; color: #888; margin-bottom: 8px;
        }
        .ao-summary-total {
          display: flex; justify-content: space-between;
          font-size: 16px; font-weight: 800;
          margin-top: 12px; padding-top: 12px;
          border-top: 2px solid #f0ece4;
        }

        /* ── Status chips ── */
        .ao-chip-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .ao-chip {
          padding: 7px 14px; border-radius: 20px;
          border: 1.5px solid #e0dbd0; font-size: 13px;
          cursor: pointer; transition: all .13s;
          background: #fafaf8; color: #555; font-family: inherit;
        }
        .ao-chip:hover { border-color: #c8c3b8; }
        .ao-chip.os-dikemas    { background: #fffde6; border-color: #f5c800; color: #7a6000; font-weight: 700; }
        .ao-chip.os-dikirim    { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; font-weight: 700; }
        .ao-chip.os-selesai    { background: #f0fdf4; border-color: #22c55e; color: #166534; font-weight: 700; }
        .ao-chip.os-dibatalkan { background: #fef2f2; border-color: #ef4444; color: #991b1b; font-weight: 700; }
        .ao-chip.ps-pending { background: #fffde6; border-color: #f5c800; color: #7a6000; font-weight: 700; }
        .ao-chip.ps-dibayar { background: #f0fdf4; border-color: #10b981; color: #065f46; font-weight: 700; }
        .ao-chip.ps-gagal   { background: #fef2f2; border-color: #ef4444; color: #991b1b; font-weight: 700; }

        /* ── Error msg ── */
        .ao-errmsg { padding: 10px 14px; background: #fef2f2; color: #991b1b; border-radius: 8px; font-size: 13px; }

        /* ── Section label ── */
        .ao-label { font-size: 12px; color: #888; display: block; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
      `}</style>

      <div className="ao-page">
        {/* Topbar */}
        <div className="ao-topbar">
          <button suppressHydrationWarning className="ao-back-btn" onClick={() => window.location.href = '/admin/orders'}>
            <ChevronLeft /> Kembali
          </button>
          <h1>Tambah Order Baru</h1>
          <div className="ao-topbar-right">
            <button suppressHydrationWarning className="ao-cancel-btn" onClick={() => window.location.href = '/admin/orders'}>
                Batal
            </button>            <button suppressHydrationWarning className="ao-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Order"}
            </button>
          </div>
        </div>

        <div className="ao-body">
          {/* ── Kolom kiri: User + Katalog Produk ── */}
          <div>

            {/* User */}
            <div className="ao-card">
              <div className="ao-card-title">Informasi User</div>
              <label className="ao-label">Email Pelanggan</label>
              <input
                suppressHydrationWarning
                className={`ao-input${emailStatus === "notfound" ? " error" : ""}`}
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              {emailStatus === "loading" && (
                <div className="ao-user-badge loading"><UserIcon /> Mencari user...</div>
              )}
              {emailStatus === "found" && userId && (
                <>
                  <div className="ao-user-badge found">
                    <CheckIcon />
                    <strong>{userName || "User ditemukan"}</strong>
                  </div>
                  <div className="ao-user-uuid">{userId}</div>
                </>
              )}
              {emailStatus === "notfound" && (
                <div className="ao-user-badge notfound">User dengan email ini tidak ditemukan di tabel pengguna.</div>
              )}
            </div>

            {/* Katalog Produk */}
            <div className="ao-card">
              <div className="ao-card-title">
                <span>Katalog Produk</span>
                {!produkLoading && (
                  <span className="ao-produk-count">{filteredProduk.length} produk</span>
                )}
              </div>

              <div className="ao-search-wrap">
                <span className="ao-search-icon"><SearchIcon /></span>
                <input
                  suppressHydrationWarning
                  className="ao-search-input"
                  placeholder="Cari nama produk..."
                  value={produkSearch}
                  onChange={e => setProdukSearch(e.target.value)}
                />
              </div>

              <div className="ao-produk-grid">
                {produkLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="ao-skeleton" />
                    ))
                  : filteredProduk.map(p => {
                      const inCart  = isInCart(p.id_produk);
                      const cartQty = getCartItem(p.id_produk)?.kuantitas;
                      const oos     = p.stok === 0;
                      return (
                        <div
                          key={p.id_produk}
                          className={`ao-produk-card${inCart ? " in-cart" : ""}${oos ? " out-of-stock" : ""}`}
                          onClick={() => !oos && addToCart(p)}
                          title={oos ? "Stok habis" : p.nama_produk}
                        >
                          {p.gambar_url
                            ? <img src={p.gambar_url} alt={p.nama_produk} className="ao-produk-img" />
                            : <div className="ao-produk-img-ph">🌾</div>
                          }
                          {inCart
                            ? <div className="ao-overlay-badge check"><CheckIcon /></div>
                            : !oos && <div className="ao-overlay-badge plus"><PlusIcon /></div>
                          }
                          {inCart && cartQty && (
                            <div className="ao-cart-qty-pill">{cartQty}x</div>
                          )}
                          <div className="ao-produk-info">
                            <div className="ao-produk-name">{p.nama_produk}</div>
                            <div className="ao-produk-price">Rp {Number(p.harga).toLocaleString("id-ID")}</div>
                            <div className="ao-produk-stok">
                              {oos ? "Stok habis" : `Stok: ${p.stok}`}
                            </div>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            </div>
          </div>

          {/* ── Kolom kanan: Keranjang + Config ── */}
          <div>

            {/* Keranjang */}
            <div className="ao-card">
              <div className="ao-card-title">
                <span>Keranjang</span>
                {cart.length > 0 && <span className="ao-produk-count">{cart.length} item</span>}
              </div>

              {cart.length === 0 ? (
                <div className="ao-empty-cart">
                  <span className="ao-empty-cart-icon">🛒</span>
                  Klik produk di katalog untuk menambahkan
                </div>
              ) : (
                cart.map(c => (
                  <div className="ao-cart-item" key={c.produk.id_produk}>
                    {c.produk.gambar_url
                      ? <img src={c.produk.gambar_url} alt={c.produk.nama_produk} className="ao-cart-img" />
                      : <div className="ao-cart-img-ph">🌾</div>
                    }
                    <div className="ao-cart-info">
                      <div className="ao-cart-name">{c.produk.nama_produk}</div>
                      <div className="ao-cart-price">Rp {Number(c.produk.harga).toLocaleString("id-ID")} / pcs</div>
                      <div className="ao-qty-row">
                        <button suppressHydrationWarning className="ao-qty-btn" onClick={() => updateQty(c.produk.id_produk, -1)}><MinusIcon /></button>
                        <span className="ao-qty-val">{c.kuantitas}</span>
                        <button suppressHydrationWarning className="ao-qty-btn" onClick={() => updateQty(c.produk.id_produk, 1)}><PlusIcon /></button>
                        <span className="ao-subtotal">Rp {(Number(c.produk.harga) * c.kuantitas).toLocaleString("id-ID")}</span>
                        <button suppressHydrationWarning className="ao-remove-btn" onClick={() => removeFromCart(c.produk.id_produk)}><TrashIcon /></button>
                      </div>
                      <input
                        suppressHydrationWarning
                        className="ao-cart-note"
                        placeholder="Catatan (opsional)..."
                        value={c.catatan}
                        onChange={e => updateCatatan(c.produk.id_produk, e.target.value)}
                      />
                    </div>
                  </div>
                ))
              )}

              {/* Ongkir */}
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #f5f3ee" }}>
                <label className="ao-label">Ongkos Kirim</label>
                <div className="ao-ongkir-wrap">
                  <span className="ao-ongkir-prefix">Rp</span>
                  <input
                    suppressHydrationWarning
                    type="number" min={0}
                    className="ao-ongkir-input"
                    value={ongkir}
                    onChange={e => setOngkir(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Summary */}
              <div style={{ marginTop: 14 }}>
                <div className="ao-summary-row"><span>Subtotal</span><span>Rp {subtotal.toLocaleString("id-ID")}</span></div>
                <div className="ao-summary-row"><span>Ongkir</span><span>Rp {ongkir.toLocaleString("id-ID")}</span></div>
                <div className="ao-summary-total">
                  <span>Total</span>
                  <span style={{ color: "#b8940a" }}>Rp {total.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Status Order */}
            <div className="ao-card">
              <div className="ao-card-title">Status Order</div>
              <div className="ao-chip-group">
                {ORDER_STATUS_OPTIONS.map(s => (
                  <button
                    suppressHydrationWarning
                    key={s.value}
                    className={`ao-chip${orderStatus === s.value ? ` os-${s.value}` : ""}`}
                    onClick={() => setOrderStatus(s.value)}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Pembayaran */}
            <div className="ao-card">
              <div className="ao-card-title">Status Pembayaran</div>
              <p style={{ fontSize: 12, color: "#bbb", marginBottom: 12, lineHeight: 1.6 }}>
                Gunakan <strong style={{ color: "#888" }}>Dibayar</strong> untuk pembayaran tunai atau transfer yang sudah dikonfirmasi.
              </p>
              <div className="ao-chip-group">
                {PAYMENT_STATUS_OPTIONS.map(s => (
                  <button
                    suppressHydrationWarning
                    key={s.value}
                    className={`ao-chip${paymentStatus === s.value ? ` ps-${s.value}` : ""}`}
                    onClick={() => setPaymentStatus(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}