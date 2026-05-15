"use client";

import { useState, useEffect, useCallback } from "react";
import "./page.css";
import { createClient } from '@/utils/supabase/client';
import { useToast } from "@/app/context/ToastContext";

// ── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  idProd: string;
  nama: string;
  harga: number;
  stok: number;
  deskripsi: string;
  gambar: string;
  isPromo: boolean;
  dibuatPada: string;
}

interface Ulasan {
  id: number;
  id_user: string;
  id_produk: number;
  rating: number;
  komentar: string;
  dibuat_pada: string;
  nama_user?: string;
}

type ModalMode = "add" | "edit" | null;
const PER_PAGE = 10;

// ── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#f5c800" : "none"} stroke={filled ? "#f5c800" : "#ccc"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const ReviewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtRupiah = (n: number) => "Rp" + n.toLocaleString("id-ID").replace(/,/g, ".");
const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};
const renderStars = (rating: number) =>
  Array.from({ length: 5 }, (_, i) => <StarIcon key={i} filled={i < Math.round(rating)} />);

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "medium" | "high">("all");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Ulasan modal
  const [ulasanTarget, setUlasanTarget] = useState<Product | null>(null);
  const [ulasanList, setUlasanList] = useState<Ulasan[]>([]);
  const [ulasanLoading, setUlasanLoading] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nama: "",
    harga: "",
    stok: "",
    deskripsi: "",
    isPromo: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch Products ─────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal ambil data dari API");
      const data = await res.json();
      const mapped: Product[] = data.map((p: any) => ({
        id: p.id_produk,
        idProd: String(p.id_produk),
        nama: p.nama_produk,
        harga: Number(p.harga),
        stok: Number(p.stok),
        deskripsi: p.deskripsi || "",
        gambar: p.gambar_url || "/images/corn-1.jpg",
        isPromo: p.is_promo ?? false,
        dibuatPada: p.dibuat_pada || "",
      }));
      setProducts(mapped);
    } catch (err) {
      console.error("Gagal memuat produk:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Sync stok dari pesanan DIBAYAR ─────────────────────────────────────────
  useEffect(() => {
    const syncStokFromPaidOrders = async () => {
      try {
        const { data: paidItems, error } = await supabase
          .from("item_pesanan")
          .select("id_produk, jumlah, pesanan!inner(status_bayar)")
          .eq("pesanan.status_bayar", "DIBAYAR");

        if (error || !paidItems || paidItems.length === 0) return;

        const soldMap: Record<number, number> = {};
        paidItems.forEach((item: any) => {
          soldMap[item.id_produk] = (soldMap[item.id_produk] || 0) + item.jumlah;
        });

        for (const [idProduk, totalTerjual] of Object.entries(soldMap)) {
          const { data: prod } = await supabase
            .from("produk")
            .select("stok, stok_awal")
            .eq("id_produk", Number(idProduk))
            .single();

          if (prod && prod.stok_awal !== undefined) {
            const newStok = Math.max(0, prod.stok_awal - totalTerjual);
            await supabase
              .from("produk")
              .update({ stok: newStok })
              .eq("id_produk", Number(idProduk));
          }
        }
      } catch (err) {
        console.warn("Sync stok error (non-fatal):", err);
      }
    };

    syncStokFromPaidOrders();
  }, [supabase]);

  // ── Fetch Ulasan ──────────────────────────────────────────────────────────
  // FIX: column is `tanggal_ulasan` (timestamptz) not `dibuat_pada`
  const fetchUlasan = async (produk: Product) => {
    setUlasanTarget(produk);
    setUlasanList([]);
    setUlasanLoading(true);
    try {
      const { data, error } = await supabase
        .from("ulasan")
        .select("*, pengguna(nama)")
        .eq("id_produk", produk.id)
        .order("tanggal_ulasan", { ascending: false }); // FIX: was "dibuat_pada"

      if (error) throw error;

      const mapped: Ulasan[] = (data || []).map((u: any) => ({
        id: u.id_ulasan ?? u.id,
        id_user: u.id_user,
        id_produk: u.id_produk,
        rating: u.rating,
        komentar: u.komentar || "",
        dibuat_pada: u.tanggal_ulasan || "", // FIX: was u.dibuat_pada
        nama_user: u.pengguna?.nama || u.id_user,
      }));
      setUlasanList(mapped);
    } catch (err) {
      console.error("Gagal memuat ulasan:", err);
    } finally {
      setUlasanLoading(false);
    }
  };

  // ── Upload Gambar ─────────────────────────────────────────────────────────
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;
    const { error: uploadError } = await supabase.storage.from("panganesia").upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("panganesia").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // ── Close Modal ───────────────────────────────────────────────────────────
  const closeModal = () => {
    setModalMode(null);
    setEditTarget(null);
    setSelectedFile(null);
  };

  // ── Submit (Add & Edit) ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.nama.trim()) return toast.warning("Nama produk wajib diisi");
    if (!form.harga || isNaN(Number(form.harga))) return toast.warning("Harga harus berupa angka");
    if (!form.stok || isNaN(Number(form.stok))) return toast.warning("Stok harus berupa angka");

    setIsSubmitting(true);
    try {
      let imageUrl = modalMode === "edit" ? editTarget?.gambar : "/images/corn-1.jpg";
      if (selectedFile) imageUrl = await uploadImage(selectedFile);

      const method = modalMode === "add" ? "POST" : "PUT";

      const payload: Record<string, any> = {
        nama_produk: form.nama,
        harga: Number(form.harga),
        stok: Number(form.stok),
        deskripsi: form.deskripsi,
        gambar_url: imageUrl,
        is_promo: form.isPromo,
      };

      if (modalMode === "edit" && editTarget) {
        payload.id = editTarget.id;
        payload.id_produk = editTarget.id;
      }

      const res = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Gagal menyimpan ke database");
      }

      await fetchProducts();
      closeModal();
    } catch (err: any) {
      toast.danger(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/products?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      await fetchProducts();
      setDeleteTarget(null);
    } catch (err: any) {
      toast.danger(err.message);
    }
  };

  // ── Filter & Pagination ───────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.idProd.includes(search);
    let matchStock = true;
    if (stockFilter === "low") matchStock = p.stok <= 50;
    else if (stockFilter === "medium") matchStock = p.stok > 50 && p.stok <= 200;
    else if (stockFilter === "high") matchStock = p.stok > 200;
    return matchSearch && matchStock;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = (safePage - 1) * PER_PAGE + 1;
  const endItem = Math.min(safePage * PER_PAGE, filtered.length);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-search-wrap">
          <span className="topbar-search-icon"><SearchIcon /></span>
          <input
            type="text"
            placeholder="Search"
            className="topbar-search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button className="topbar-bell" aria-label="Notifikasi"><BellIcon /></button>
      </div>

      {/* PAGE BODY */}
      <div className="products-page">

        {/* Header */}
        <div className="products-header">
          <div className="products-header-left">
            <h1>Produk</h1>
            <p>Kelola semua produk Panganesia (Prisma Engine)</p>
          </div>
          <div className="products-header-right">
            <button
              className="btn-tambah"
              onClick={() => {
                setForm({ nama: "", harga: "", stok: "", deskripsi: "", isPromo: false });
                setSelectedFile(null);
                setModalMode("add");
              }}
            >+ Tambah Produk</button>
            <select
              className="select-filter"
              value={stockFilter}
              onChange={(e) => { setStockFilter(e.target.value as any); setCurrentPage(1); }}
            >
              <option value="all">Semua</option>
              <option value="low">Rendah (≤50)</option>
              <option value="medium">Sedang (51-200)</option>
              <option value="high">Tinggi (&gt;200)</option>
            </select>
          </div>
        </div>

        {/* Tabel */}
        <div className="table-card">
          <table className="products-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Produk</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Deskripsi</th>
                <th>Gambar</th>
                <th>Promo</th>
                <th>Ulasan</th>
                <th>Dibuat Pada</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "40px" }}>
                    Mengambil data...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : pageItems.map((p, idx) => (
                <tr key={p.id}>
                  <td>{(safePage - 1) * PER_PAGE + idx + 1}.</td>
                  <td className="td-name">{p.nama}</td>
                  <td>{fmtRupiah(p.harga)}</td>
                  <td>
                    <span className={`stok-badge ${p.stok <= 50 ? "stok-low" : p.stok <= 200 ? "stok-medium" : "stok-high"}`}>
                      {p.stok}
                    </span>
                  </td>
                  <td className="td-desc">
                    {p.deskripsi || <span className="td-empty">—</span>}
                  </td>
                  <td className="img-container">
                    <img src={p.gambar} className="img-thumb" alt={p.nama} />
                  </td>
                  <td>
                    <span className={`promo-badge ${p.isPromo ? "promo-yes" : "promo-no"}`}>
                      {p.isPromo ? "Ya" : "Tidak"}
                    </span>
                  </td>
                  {/* Kolom Ulasan */}
                  <td className="img-container">
                    <button
                      className="btn-icon review"
                      title="Lihat Ulasan"
                      onClick={() => fetchUlasan(p)}
                    >
                      <ReviewIcon />
                    </button>
                  </td>
                  <td className="td-date">{fmtDate(p.dibuatPada)}</td>
                  <td>
                    <div className="action-cell">
                      <button
                        className="btn-icon edit"
                        title="Edit"
                        onClick={() => {
                          setEditTarget(p);
                          setForm({
                            nama: p.nama,
                            harga: String(p.harga),
                            stok: String(p.stok),
                            deskripsi: p.deskripsi,
                            isPromo: p.isPromo,
                          });
                          setSelectedFile(null);
                          setModalMode("edit");
                        }}
                      ><EditIcon /></button>
                      <button
                        className="btn-icon delete"
                        title="Hapus"
                        onClick={() => setDeleteTarget(p)}
                      ><DeleteIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination-row">
          <span className="pagination-info">
            Menampilkan {filtered.length === 0 ? 0 : startItem}–{endItem} dari {filtered.length} produk
          </span>
          <div className="pagination-controls">
            <button className="pg-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
              Prev
            </button>
            {getPageNumbers().map((pg, i) =>
              pg === "..." ? (
                <span key={`e-${i}`} className="pg-ellipsis">...</span>
              ) : (
                <button
                  key={`p-${pg}`}
                  className={`pg-btn ${safePage === pg ? "active" : ""}`}
                  onClick={() => setCurrentPage(pg as number)}
                >{pg}</button>
              )
            )}
            <button className="pg-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL ADD / EDIT */}
      {modalMode && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} title="Tutup">
              <CloseIcon />
            </button>
            <div className="modal-content">
              <div className="modal-title">
                {modalMode === "add" ? "Tambah Produk" : "Edit Produk"}
              </div>
              <div className="modal-sub">
                {modalMode === "add" ? "Isi data produk baru di bawah ini" : `Mengedit: ${editTarget?.nama}`}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Nama Produk <span className="form-required">*</span>
                </label>
                <input
                  className="form-input"
                  placeholder="Contoh: Rumput Laut Kering"
                  value={form.nama}
                  onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Harga (Rp) <span className="form-required">*</span>
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="25000"
                    value={form.harga}
                    onChange={(e) => setForm((prev) => ({ ...prev, harga: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Stok <span className="form-required">*</span>
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="100"
                    value={form.stok}
                    onChange={(e) => setForm((prev) => ({ ...prev, stok: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea
                  className="form-textarea"
                  placeholder="Tuliskan deskripsi produk..."
                  value={form.deskripsi}
                  onChange={(e) => setForm((prev) => ({ ...prev, deskripsi: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gambar Produk</label>
                {modalMode === "edit" && editTarget?.gambar && (
                  <div className="form-img-preview">
                    <img src={editTarget.gambar} alt="preview" className="form-img-thumb" />
                    <span className="form-img-hint">Gambar saat ini — upload baru untuk mengganti</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="form-upload"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="form-group form-group-inline">
                <span className="form-label">Produk Promo?</span>
                <div className="toggle-wrap">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={form.isPromo}
                      onChange={(e) => setForm((prev) => ({ ...prev, isPromo: e.target.checked }))}
                    />
                    <span className="toggle-slider" />
                  </label>
                  <span className="toggle-label">{form.isPromo ? "Ya" : "Tidak"}</span>
                </div>
              </div>

              <button
                className="btn-modal-submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Menyimpan..." : modalMode === "add" ? "Tambah Produk" : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="warning-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDeleteTarget(null)} title="Tutup">
              <CloseIcon />
            </button>
            <div className="warning-header">
              <div className="warning-title-row">
                <div className="warning-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <span className="warning-title">Hapus Produk</span>
              </div>
            </div>
            <p className="warning-text">
              Yakin ingin menghapus <b>{deleteTarget.nama}</b>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="warning-actions">
              <button className="btn-warn-yes" onClick={handleDelete}>Hapus</button>
              <button className="btn-warn-no" onClick={() => setDeleteTarget(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ULASAN */}
      {ulasanTarget && (
        <div className="modal-backdrop" onClick={() => setUlasanTarget(null)}>
          <div className="modal-box ulasan-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setUlasanTarget(null)} title="Tutup">
              <CloseIcon />
            </button>
            <div className="modal-content">
              <div className="modal-title">Ulasan Produk</div>
              <div className="modal-sub">{ulasanTarget.nama}</div>

              {ulasanLoading ? (
                <div className="ulasan-loading">Memuat ulasan...</div>
              ) : ulasanList.length === 0 ? (
                <div className="ulasan-empty">Belum ada ulasan untuk produk ini.</div>
              ) : (
                <div className="table-card ulasan-table-wrap">
                  <table className="products-table ulasan-table">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Pengguna</th>
                        <th>Rating</th>
                        <th>Komentar</th>
                        <th>Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ulasanList.map((u, idx) => (
                        <tr key={u.id}>
                          <td>{idx + 1}.</td>
                          <td className="td-name" style={{ fontSize: "13px" }}>{u.nama_user}</td>
                          <td>
                            <div className="star-row">{renderStars(u.rating)}</div>
                          </td>
                          <td className="td-desc" style={{ maxWidth: "260px" }}>
                            {u.komentar || <span className="td-empty">—</span>}
                          </td>
                          <td className="td-date">{fmtDate(u.dibuat_pada)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}