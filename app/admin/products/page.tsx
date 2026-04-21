"use client";

import { useState, useEffect } from "react";
import "./page.css";
import { createClient } from '@/utils/supabase/client'; // Digunakan khusus untuk upload ke Storage

// ── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  idProd: string;
  nama: string;
  harga: number;
  stok: number;
  deskripsi: string;
  gambar: string;
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
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const fmtRupiah = (n: number) => "Rp" + n.toLocaleString("id-ID").replace(/,/g, ".");

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

  const [form, setForm] = useState({ nama: "", harga: "", stok: "", deskripsi: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch Data via API Route ──
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Tambahkan timestamp agar browser tidak mengambil data dari cache (selalu fresh)
      const res = await fetch(`/api/products?t=${Date.now()}`, {
        cache: 'no-store' // Memaksa ambil data terbaru dari server
      });

      if (!res.ok) throw new Error("Gagal ambil data dari API");

      const data = await res.json();

      // Debugging: Munculkan di console F12 buat cek datanya nyampe atau nggak
      console.log("Data dari API:", data);

      const mapped = data.map((p: any) => ({
        id: p.id_produk, // Pastikan ini sesuai nama kolom di database (id_produk)
        idProd: String(p.id_produk),
        nama: p.nama_produk, // Mapping dari nama_produk ke nama
        harga: Number(p.harga),
        stok: Number(p.stok),
        deskripsi: p.deskripsi || "",
        gambar: p.gambar_url || "/images/corn-1.jpg",
      }));

      setProducts(mapped);
    } catch (err) {
      console.error("Gagal memuat produk:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ── Image Upload Logic ──
  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('panganesia').upload(`products/${fileName}`, file);
    if (error) throw error;
    const { data } = supabase.storage.from('panganesia').getPublicUrl(`products/${fileName}`);
    return data.publicUrl;
  };

  // ── Handle Submit (Add & Edit) ──
  const handleSubmit = async () => {
    if (!form.nama) return alert("Nama produk wajib diisi");
    setIsSubmitting(true);
    try {
      let imageUrl = modalMode === "edit" ? editTarget?.gambar : "/images/corn-1.jpg";
      if (selectedFile) imageUrl = await uploadImage(selectedFile);

      const method = modalMode === "add" ? "POST" : "PUT";
      const payload = {
        id: modalMode === "edit" ? editTarget?.id : undefined,
        nama: form.nama,
        harga: form.harga,
        stok: form.stok,
        deskripsi: form.deskripsi,
        gambar: imageUrl
      };

      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyimpan ke database");
      }

      await fetchProducts();
      setModalMode(null);
      setSelectedFile(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handle Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/products?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Gagal menghapus");
      await fetchProducts();
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ── Filter & Pagination Logic ──
  const filtered = products.filter((p) => {
    const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase());
    let matchStock = true;
    if (stockFilter === "low") matchStock = p.stok <= 50;
    else if (stockFilter === "medium") matchStock = p.stok > 50 && p.stok <= 200;
    else if (stockFilter === "high") matchStock = p.stok > 200;
    return matchSearch && matchStock;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const getPageNumbers = () => {
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

  return (
    <>
      <div className="topbar">
        <div className="topbar-search-wrap">
          <span className="topbar-search-icon"><SearchIcon /></span>
          <input type="text" placeholder="Search" className="topbar-search" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <button className="topbar-bell"><BellIcon /></button>
      </div>

      <div className="products-page">
        <div className="products-header">
          <div className="products-header-left">
            <h1>Produk</h1>
            <p>Kelola semua produk Panganesia (Prisma Engine)</p>
          </div>
          <div className="products-header-right">
            <button className="btn-tambah" onClick={() => {
              setForm({ nama: "", harga: "", stok: "", deskripsi: "" });
              setModalMode("add");
            }}>+ Tambah Produk</button>
          </div>
        </div>

        <div className="table-card">
          <table className="products-table">
            <thead>
              <tr>
                <th>No.</th><th>Nama Produk</th><th>Harga</th><th>Stok</th><th>Gambar</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>Mengambil data...</td></tr>
              ) : pageItems.map((p, idx) => (
                <tr key={p.id}>
                  <td>{(safePage - 1) * PER_PAGE + idx + 1}.</td>
                  <td>{p.nama}</td>
                  <td>{fmtRupiah(p.harga)}</td>
                  <td>{p.stok}</td>
                  <td className="img-container"><img src={p.gambar} className="img-thumb" alt="thumb" /></td>
                  <td>
                    <div className="action-cell">
                      <button className="btn-icon edit" onClick={() => {
                        setEditTarget(p);
                        setForm({ nama: p.nama, harga: String(p.harga), stok: String(p.stok), deskripsi: p.deskripsi });
                        setModalMode("edit");
                      }}><EditIcon /></button>
                      <button className="btn-icon delete" onClick={() => setDeleteTarget(p)}><DeleteIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Restored */}
        <div className="pagination-row">
          <span className="pagination-info">
            Menampilkan {filtered.length === 0 ? 0 : startItem}-{endItem} dari {filtered.length} produk
          </span>
          <div className="pagination-controls">
            <button
              className="pg-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >Prev</button>
            {getPageNumbers().map((pg, i) =>
              pg === "..." ? (
                <span key={`ellipsis-${i}`} className="pg-ellipsis">...</span>
              ) : (
                <button
                  key={`pg-${pg}`}
                  className={`pg-btn ${safePage === pg ? "active" : ""}`}
                  onClick={() => setCurrentPage(pg as number)}
                >{pg}</button>
              )
            )}
            <button
              className="pg-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >Next</button>
          </div>
        </div>
      </div>

      {/* MODAL ADD / EDIT */}
      {modalMode && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-title">{modalMode === "add" ? "Tambah Produk" : "Edit Produk"}</div>
              <div className="form-group">
                <label className="form-label">Nama Produk</label>
                <input className="form-input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Harga</label>
                <input className="form-input" type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" >Stok</label>
                <input className="form-input" type="number" value={form.stok} onChange={(e) => setForm({ ...form, stok: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea className="form-textarea" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Gambar</label>
                <input type="file" accept="image/*" className="form-upload" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
              <button className="btn-modal-submit" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="warning-box" onClick={(e) => e.stopPropagation()}>
            <p>Yakin ingin menghapus <b>{deleteTarget.nama}</b>?</p>
            <div className="warning-actions">
              <button className="btn-warn-yes" onClick={handleDelete}>Hapus</button>
              <button className="btn-warn-no" onClick={() => setDeleteTarget(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}