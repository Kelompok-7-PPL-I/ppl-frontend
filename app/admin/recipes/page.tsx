"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import "./page.css";
import { createBrowserClient } from '@supabase/ssr';

// 1. Inisialisasi di LUAR komponen (Singleton) 
// Ini mencegah error "Lock broken" karena instance hanya dibuat satu kali.
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Recipe {
  id_recipe: string;
  judul_resep: string;
  kategori_jenis: string;
  deskripsi_singkat: string;
  bahan_bahan: string;
  langkah_masak: string;
  informasi_gizi: string;
  gambar_url: string;
  created_at: string;
}

const PER_PAGE = 10;

// ── Icons 
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

export default function AdminRecipesPage() {
  // State Monitoring
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter & Pagination
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // State Delete Modal
  const [targetRecipe, setTargetRecipe] = useState<Recipe | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

const fetchRecipes = useCallback(async () => {
  try {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes')
      .select('*');

    if (!error) {
      setRecipes(data || []);
    }
  } catch (err) {
    console.error("Gagal mengambil data:", err);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Handler Hapus Data
  const handleDelete = async () => {
    if (!targetRecipe) return;
    try {      
      const { error } = await supabase.from('recipes').delete().eq('id_recipe', targetRecipe.id_recipe);
      if (error) throw error;
      await fetchRecipes();
      setIsDeleteModalOpen(false);
      setTargetRecipe(null);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Logic Filtering
  const filtered = recipes.filter(r => {
    const matchSearch = (r.judul_resep?.toLowerCase() || "").includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || r.kategori_jenis === categoryFilter;
    return matchSearch && matchCat;
  });

  // Logic Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <>
      {/* Search Bar Atas */}
      <div className="topbar">
        <div className="topbar-search-wrap">
          <input 
            className="topbar-search" 
            placeholder="Cari judul resep..." 
            value={search} 
            onChange={e => {setSearch(e.target.value); setCurrentPage(1);}} 
          />
        </div>
      </div>

      <div className="recipes-page">
        {/* Header Halaman */}
        <div className="recipes-header">
          <div className="recipes-header-left">
            <h1>Recipes</h1>
            <p>Kelola daftar resep masakan dan informasi gizi Panganesia</p>
          </div>
          <div className="recipes-header-right">
            <Link href="/admin/recipes/add" className="btn-tambah">
              + Tambah Resep
            </Link>
            
            <select 
              className="select-filter" 
              value={categoryFilter} 
              onChange={e => {setCategoryFilter(e.target.value); setCurrentPage(1);}}
            >
              <option value="all">Semua Kategori</option>
              {Array.from(new Set(recipes.map(r => r.kategori_jenis))).filter(Boolean).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-card">
        <table className="recipes-table">
          <colgroup>
            <col className="col-no"/>
            <col className="col-judul"/>
            <col className="col-kat"/>
            <col className="col-data"/> 
            <col className="col-data"/> 
            <col className="col-data"/>
            <col className="col-gizi"/>
            <col className="col-img"/>
            <col className="col-aksi"/>
          </colgroup>
          <thead>
            <tr>
              <th>No.</th>
              <th>Judul Resep</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Bahan</th>
              <th>Langkah</th>
              <th>Gizi</th>
              <th>Gambar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>              
            {loading ? (
                <tr><td colSpan={8} style={{textAlign: "center", padding: "40px"}}>Memuat...</td></tr>
              ) : pageItems.map((r, i) => (
              <tr key={r.id_recipe}>
                <td>{(safePage - 1) * PER_PAGE + i + 1}.</td>
                <td><span className="judul-wrapper" title={r.judul_resep}>{r.judul_resep}</span></td>
                <td><span className="cat-badge">{r.kategori_jenis}</span></td>
                
                {/* Deskripsi, Bahan, Langkah dibungkus div text-wrapper */}
                <td><div className="text-wrapper" title={r.deskripsi_singkat}>{r.deskripsi_singkat || "-"}</div></td>
                <td><div className="text-wrapper" title={r.bahan_bahan}>{r.bahan_bahan || "-"}</div></td>
                <td><div className="text-wrapper" title={r.langkah_masak}>{r.langkah_masak || "-"}</div></td>
                
                <td><div className="text-wrapper">{r.informasi_gizi || "-"}</div></td>
                
                <td>
                  <img src={r.gambar_url || "/placeholder.jpg"} className="img-thumb" alt="" />
                </td>
                <td className="action-cell">
                  <Link href={`/admin/recipes/edit/${r.id_recipe}`} className="btn-icon edit" aria-label="Edit">
                    <EditIcon />
                  </Link>
                  <button className="btn-icon delete" onClick={() => {
                    setTargetRecipe(r);
                    setIsDeleteModalOpen(true);
                  }} aria-label="Delete">
                    <DeleteIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

        {/* Baris Pagination */}
        <div className="pagination-row">
          <span className="pagination-info">
            Menampilkan {pageItems.length} dari {filtered.length} resep
          </span>
          <div className="pagination-controls">
            <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button 
                key={p} 
                className={`pg-btn ${safePage === p ? "active" : ""}`} 
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next</button>
          </div>
        </div>
      </div>

      {/* Modal Peringatan Hapus */}
      {isDeleteModalOpen && targetRecipe && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="warning-box" onClick={e => e.stopPropagation()}>
            <div className="warning-header">
              <div className="warning-title-row">
                <div className="warning-icon"><WarnIcon /></div>
                <span className="warning-title">Hapus Resep</span>
              </div>
            </div>
            <p className="warning-text">
              Yakin ingin menghapus resep <strong>{targetRecipe.judul_resep}</strong>? 
              Data yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="warning-actions">
              <button className="btn-warn-yes" onClick={handleDelete}>Ya, Hapus</button>
              <button className="btn-warn-no" onClick={() => setIsDeleteModalOpen(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}