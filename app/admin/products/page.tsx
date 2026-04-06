"use client";

import { useState, useEffect } from "react";
import "./page.css";
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// ── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number; // Ini akan memetakan id_produk dari DB
  idProd: string;
  nama: string;
  harga: number;
  stok: number;
  deskripsi: string;
  gambar: string;
}

type ModalMode = "add" | "edit" | null;

const PER_PAGE = 10;

// ── Icons (Tetap Sama) ───────────────────────────────────────────────────────
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const WarnIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtRupiah = (n: number) =>
  "Rp" + n.toLocaleString("id-ID").replace(/,/g, ".");

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "medium" | "high">("all");

  // Modals
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({ idProd: "", nama: "", harga: "", stok: "", deskripsi: "" });
  const [editForm, setEditForm] = useState({ idProd: "", nama: "", harga: "", stok: "", deskripsi: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch Data From Supabase ──────────────────────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('produk')
      .select('*')
      .order('id_produk', { ascending: false });

    if (!error && data) {
      const mapped = data.map((p: any) => ({
        id: p.id_produk,
        idProd: p.id_produk.toString(),
        nama: p.nama_produk,
        harga: p.harga,
        stok: p.stok,
        deskripsi: p.deskripsi || "",
        gambar: p.gambar_url || "/images/corn-1.jpg",
      }));
      setProducts(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ── Image Upload Logic ───────────────────────────────────────────────
const uploadImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('panganesia')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('panganesia').getPublicUrl(filePath);
  
  // Pastikan mengembalikan string, jangan biarkan ada celah null
  return data.publicUrl;
};

  // ── Derived data ────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.idProd.toLowerCase().includes(search.toLowerCase());

    let matchStock = true;
    if (stockFilter === "low") matchStock = p.stok <= 50;
    else if (stockFilter === "medium") matchStock = p.stok > 50 && p.stok <= 200;
    else if (stockFilter === "high") matchStock = p.stok > 200;

    return matchSearch && matchStock;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // ── Handlers ────────────────────────────────────────────────────────
  const openAdd = () => {
    setAddForm({ idProd: "", nama: "", harga: "", stok: "", deskripsi: "" });
    setSelectedFile(null);
    setModalMode("add");
  };

  const openEdit = (p: Product) => {
    setEditTarget(p);
    setEditForm({
      idProd: p.idProd,
      nama: p.nama,
      harga: String(p.harga),
      stok: String(p.stok),
      deskripsi: p.deskripsi,
    });
    setSelectedFile(null);
    setModalMode("edit");
  };

  const handleAdd = async () => {
    if (!addForm.nama.trim()) return;
    setIsSubmitting(true);
    try {
      let imageUrl = "/images/corn-1.jpg";
      if (selectedFile) {
        const url = await uploadImage(selectedFile); 
        imageUrl = url;
      }

      const { error } = await supabase.from('produk').insert([{
        nama_produk: addForm.nama,
        harga: Number(addForm.harga),
        stok: Number(addForm.stok),
        deskripsi: addForm.deskripsi,
        gambar_url: imageUrl,
        id_kategori: 1 // Ganti sesuai kebutuhan
      }]);

      if (error) throw error;
      await fetchProducts();
      setModalMode(null);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setIsSubmitting(true);
    try {
      let imageUrl = editTarget.gambar;
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const { error } = await supabase.from('produk').update({
        nama_produk: editForm.nama,
        harga: Number(editForm.harga),
        stok: Number(editForm.stok),
        deskripsi: editForm.deskripsi,
        gambar_url: imageUrl
      }).eq('id_produk', editTarget.id);

      if (error) throw error;
      await fetchProducts();
      setModalMode(null);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from('produk').delete().eq('id_produk', deleteTarget.id);
      if (error) throw error;
      await fetchProducts();
      setDeleteTarget(null);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

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
      {/* Topbar */}
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
        <button className="topbar-bell" aria-label="Notifications">
          <BellIcon />
        </button>
      </div>

      {/* Page body */}
      <div className="products-page">
        <div className="products-header">
          <div className="products-header-left">
            <h1>Products</h1>
            <p>Kelola semua produk Panganesia</p>
          </div>
          <div className="products-header-right">
            <button className="btn-tambah" onClick={openAdd}>
              + Tambah Produk
            </button>
            <select 
              className="select-filter" 
              value={stockFilter} 
              onChange={(e) => { setStockFilter(e.target.value as any); setCurrentPage(1); }}
            >
              <option value="all">All Stock</option>
              <option value="low">Low (≤ 50)</option>
              <option value="medium">Medium (51 - 200)</option>
              <option value="high">High (&gt; 200)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          {loading ? <div style={{padding: "20px", textAlign: "center"}}>Loading data...</div> : (
          <table className="products-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Produk</th>
                <th>ID Prod</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Deskripsi</th>
                <th>Gambar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                pageItems.map((p, idx) => (
                  <tr key={p.id}>
                    <td>{(safePage - 1) * PER_PAGE + idx + 1}.</td>
                    <td>{p.nama}</td>
                    <td>{p.idProd}</td>
                    <td>{fmtRupiah(p.harga)}</td>
                    <td>{p.stok.toLocaleString("id-ID")}</td>
                    <td className="td-desc">{p.deskripsi}</td>
                    <td>
                      <img src={p.gambar} alt="thumb" style={{width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover'}} />
                    </td>
                    <td>
                      <div className="action-cell">
                        <button className="btn-icon edit" onClick={() => openEdit(p)} aria-label="Edit">
                          <EditIcon />
                        </button>
                        <button className="btn-icon delete" onClick={() => setDeleteTarget(p)} aria-label="Delete">
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>

        {/* Pagination */}
        <div className="pagination-row">
          <span className="pagination-info">
            Menampilkan {filtered.length === 0 ? 0 : startItem}–{endItem} dari {filtered.length} produk
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
                  key={pg}
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

      {/* ── Modal: Add Product ── */}
      {modalMode === "add" && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalMode(null)}><CloseIcon /></button>
            <div className="modal-content">  
              <div className="modal-title">Add New Product</div>
              <div className="modal-sub">Menambah Produk Baru ke Database</div>

              <div className="form-group">
                <label className="form-label">Nama Produk</label>
                <input className="form-input" value={addForm.nama} onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Harga</label>
                <input className="form-input" type="number" value={addForm.harga} onChange={(e) => setAddForm({ ...addForm, harga: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Stok</label>
                <input className="form-input" type="number" value={addForm.stok} onChange={(e) => setAddForm({ ...addForm, stok: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea className="form-textarea" value={addForm.deskripsi} onChange={(e) => setAddForm({ ...addForm, deskripsi: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Gambar Produk</label>
                <input type="file" accept="image/*" className="form-upload" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
              </div>
              <button className="btn-modal-submit" onClick={handleAdd} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Tambah"}
              </button>
            </div>
          </div>  
        </div>
      )}

      {/* ── Modal: Edit Product ── */}
      {modalMode === "edit" && editTarget && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalMode(null)}><CloseIcon /></button>
            <div className="modal-content">
              <div className="modal-title">Edit Detail Product</div>
              <div className="modal-sub">Edit Data dari Sebuah Produk</div>

              <div className="form-group">
                <label className="form-label">Nama Produk</label>
                <input className="form-input" value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Harga</label>
                <input className="form-input" value={editForm.harga} onChange={(e) => setEditForm({ ...editForm, harga: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Stok</label>
                <input className="form-input" value={editForm.stok} onChange={(e) => setEditForm({ ...editForm, stok: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea className="form-textarea" value={editForm.deskripsi} onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Ganti Gambar (Opsional)</label>
                <input type="file" accept="image/*" className="form-upload" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
              </div>
              <button className="btn-modal-submit" onClick={handleEdit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Edit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Warning ── */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="warning-box" onClick={(e) => e.stopPropagation()}>
            <div className="warning-header">
              <div className="warning-title-row">
                <div className="warning-icon"><WarnIcon /></div>
                <span className="warning-title">Warning!</span>
              </div>
              <button className="modal-close" style={{ position: "static" }} onClick={() => setDeleteTarget(null)}>
                <CloseIcon />
              </button>
            </div>
            <p className="warning-text">Do you want to delete this product?</p>
            <div className="warning-actions">
              <button className="btn-warn-yes" onClick={handleDelete}>Yes</button>
              <button className="btn-warn-no" onClick={() => setDeleteTarget(null)}>No</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}