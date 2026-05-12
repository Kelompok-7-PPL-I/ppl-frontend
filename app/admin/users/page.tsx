"use client";

import { useState, useEffect } from "react";
import "./page.css";
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

interface User {
  id: string;
  nama: string;
  email: string;
  alamat: string;
  nomor_telp: string;
  peran: string;
  dibuat_pada: string;
}

interface AlamatItem {
  id_alamat: string;        // ← fix: was "id"
  label: string;
  nama_penerima: string;
  nomor_telp: string;
  alamat_lengkap: string;
  kota: string;
  provinsi: string;
  kode_pos: string;
  is_utama: boolean;
}

interface FavProdukItem {
  id_fav: string;           // ← fix: was "id"
  id_produk: string;
  produk: {
    nama_produk: string;
    harga: number;
    gambar_url: string;
  };
}

interface FavResepItem {
  id_fav: string;           // ← fix: was "id"
  id_resep: string;
  resep: {
    judul_resep: string;
    kategori_jenis: string;
    gambar_url: string;
  };
}

interface UlasanItem {
  id_ulasan: string;
  id_produk: string;
  rating: number;
  komentar: string | null;
  tanggal_ulasan: string;
  produk: {
    nama_produk: string;
    gambar_url: string;
  };
}

type DetailModalType = "alamat" | "fav-produk" | "fav-resep" | "ulasan" | null;

const PER_PAGE = 10;

// ── Icons ────────────────────────────────────────────────────────────────────
const DeleteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const WarnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const HeartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const BookIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// ── Format currency ──────────────────────────────────────────────────────────
const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ── Detail modal state ───────────────────────────────────────────────────
  const [detailModalType, setDetailModalType] = useState<DetailModalType>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [alamatData, setAlamatData] = useState<AlamatItem[]>([]);
  const [favProdukData, setFavProdukData] = useState<FavProdukItem[]>([]);
  const [favResepData, setFavResepData] = useState<FavResepItem[]>([]);
  const [ulasanData, setUlasanData] = useState<UlasanItem[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('pengguna').select('*').order('dibuat_pada', { ascending: false });
    if (!error) setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Open detail modal & fetch data ──────────────────────────────────────
  const openDetailModal = async (user: User, type: DetailModalType) => {
    setDetailUser(user);
    setDetailModalType(type);
    setDetailLoading(true);
    setAlamatData([]);
    setFavProdukData([]);
    setFavResepData([]);
    setUlasanData([]);

    if (type === "alamat") {
      const { data } = await supabase
        .from('alamat_pengguna')
        .select('*')
        .eq('id_user', user.id)
        .order('is_utama', { ascending: false });
      setAlamatData(data || []);

    } else if (type === "fav-produk") {
      const { data } = await supabase
        .from('favorit_produk')
        .select('id_fav, id_produk, produk(nama_produk, harga, gambar_url)')
        .eq('id_user', user.id);
      setFavProdukData((data as any) || []);

    } else if (type === "fav-resep") {
      const { data } = await supabase
        .from('favorit_resep')
        .select('id_fav, id_resep, resep(judul_resep, kategori_jenis, gambar_url)')
        .eq('id_user', user.id);
      setFavResepData((data as any) || []);
    
    } else if (type === "ulasan") {
      const { data } = await supabase
        .from('ulasan')
        .select('id_ulasan, id_produk, rating, komentar, tanggal_ulasan, produk(nama_produk, gambar_url)')
        .eq('id_user', user.id);
      setUlasanData((data as any) || []);
    }

    setDetailLoading(false);
  };

  const closeDetailModal = () => {
    setDetailModalType(null);
    setDetailUser(null);
  };

  // ── Nama split ───────────────────────────────────────────────────────────
  const splitName = (fullName: string) => {
    const parts = fullName?.trim().split(/\s+/) || ["-"];
    return {
      firstName: parts[0],
      lastName: parts.length > 1 ? parts.slice(1).join(" ") : "-"
    };
  };

  const handleDelete = async () => {
    if (!targetUser) return;
    const { error } = await supabase.from('pengguna').delete().eq('id', targetUser.id);
    if (!error) {
      fetchUsers();
      setIsDeleteModalOpen(false);
      setTargetUser(null);
    }
  };

  const updateRole = async (idUser: string, newRole: string) => {
    const sure = window.confirm(`Apakah Anda yakin ingin mengubah role user ini menjadi ${newRole.toUpperCase()}?`);
    if (!sure) { fetchUsers(); return; }

    try {
      const { error } = await supabase.from('pengguna').update({ peran: newRole }).eq('id', idUser);
      if (error) throw error;
      setUsers(users.map(u => (u.id === idUser ? { ...u, peran: newRole } : u)));
      alert("Role berhasil diperbarui!");
    } catch (err: any) {
      alert("Gagal update role: " + err.message);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = (u.nama?.toLowerCase() ?? "").includes(search.toLowerCase()) || (u.email?.toLowerCase() ?? "").includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.peran?.toLowerCase() === roleFilter.toLowerCase();
    return matchSearch && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // ── Modal title & icon map ───────────────────────────────────────────────
  const modalMeta: Record<string, { title: string; sub: string }> = {
    "alamat": { title: "Alamat Tersimpan", sub: "Daftar alamat pengiriman milik pengguna ini." },
    "fav-produk": { title: "Favorit Produk", sub: "Produk yang di-favoritkan pengguna ini." },
    "fav-resep": { title: "Favorit Resep", sub: "Resep yang di-favoritkan pengguna ini." },
    "ulasan": { title: "Ulasan Produk", sub: "Review yang telah diberikan pengguna ini." },
  };

  return (
    <>
      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="topbar-search-wrap">
          <input
            type="text"
            placeholder="Cari user"
            className="topbar-search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="products-page">
        <div className="products-header">
          <div className="products-header-left">
            <h1>Pengguna</h1>
            <p>Data seluruh pengguna yang terdaftar di Panganesia.</p>
          </div>
          <div className="products-header-right">
            <select className="select-filter" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Semua Role</option>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="table-card" style={{ overflowX: 'auto' }}>
          <table className="products-table" style={{ minWidth: '1300px' }}>
            <thead>
              <tr>
                <th>No.</th>
                <th>ID Pengguna</th>
                <th>Email</th>
                <th>Nama Depan</th>
                <th>Nama Belakang</th>
                <th style={{ textAlign: 'center' }}>Role</th>
                <th>No Telepon</th>
                <th style={{ textAlign: 'center' }}>Alamat</th>
                <th style={{ textAlign: 'center' }}>Fav Produk</th>
                <th style={{ textAlign: 'center' }}>Fav Resep</th>
                <th style={{ textAlign: 'center' }}>Ulasan</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ textAlign: "center", padding: "40px" }}>Memuat...</td></tr>
              ) : pageItems.map((u, i) => {
                const { firstName, lastName } = splitName(u.nama);
                return (
                  <tr key={u.id}>
                    <td>{(safePage - 1) * PER_PAGE + i + 1}.</td>
                    <td style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>
                      {u.id.substring(0, 8)}...
                    </td>
                    <td>{u.email}</td>
                    <td style={{ fontWeight: "700" }}>{firstName}</td>
                    <td>{lastName}</td>
                    <td style={{ textAlign: 'center' }}>
                      <select
                        className={`role-select-dropdown ${u.peran?.toLowerCase() === 'admin' ? 'is-admin' : 'is-user'}`}
                        value={u.peran || "customer"}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                      >
                        <option value="customer">customer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>{u.nomor_telp || "-"}</td>

                    {/* ── Kolom Alamat ── */}
                    <td style={{ textAlign: 'center' }}>
                      <button className="detail-badge badge-alamat" onClick={() => openDetailModal(u, "alamat")}>
                        <MapPinIcon /> Alamat
                      </button>
                    </td>

                    {/* ── Kolom Fav Produk ── */}
                    <td style={{ textAlign: 'center' }}>
                      <button className="detail-badge badge-fav-produk" onClick={() => openDetailModal(u, "fav-produk")}>
                        <HeartIcon /> Produk
                      </button>
                    </td>

                    {/* ── Kolom Fav Resep ── */}
                    <td style={{ textAlign: 'center' }}>
                      <button className="detail-badge badge-fav-resep" onClick={() => openDetailModal(u, "fav-resep")}>
                        <BookIcon /> Resep
                      </button>
                    </td>

                    {/* ── Kolom Ulasan ── */}
                    <td style={{ textAlign: 'center' }}>
                      <button className="detail-badge badge-ulasan" onClick={() => openDetailModal(u, "ulasan")}>
                        <StarIcon filled={true} /> Ulasan
                      </button>
                    </td>

                    <td>
                      <div className="action-cell">
                        <button className="btn-icon delete" onClick={() => { setTargetUser(u); setIsDeleteModalOpen(true); }}>
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <span className="pagination-info">
            Menampilkan {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filtered.length)} dari {filtered.length} user
          </span>
          <div className="pagination-controls">
            <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`pg-btn ${safePage === p ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next</button>
          </div>
        </div>
      </div>

      {/* ── Delete Warning Modal ── */}
      {isDeleteModalOpen && targetUser && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="warning-box" onClick={(e) => e.stopPropagation()}>
            <div className="warning-header">
              <div className="warning-title-row">
                <div className="warning-icon"><WarnIcon /></div>
                <span className="warning-title">Hapus Profil</span>
              </div>
            </div>
            <p className="warning-text">Hapus profil <strong>{targetUser.nama}</strong>? Tindakan ini hanya menghapus data di tabel pengguna.</p>
            <div className="warning-actions">
              <button className="btn-warn-yes" onClick={handleDelete}>Ya, Hapus</button>
              <button className="btn-warn-no" onClick={() => setIsDeleteModalOpen(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal (Alamat / Fav Produk / Fav Resep) ── */}
      {detailModalType && detailUser && (
        <div className="modal-backdrop" onClick={closeDetailModal}>
          <div className="modal-box detail-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeDetailModal}><CloseIcon /></button>
            <div className="modal-content">
              <p className="modal-title">{modalMeta[detailModalType].title}</p>
              <p className="modal-sub">
                {detailUser.nama} · {modalMeta[detailModalType].sub}
              </p>

              {detailLoading ? (
                <div className="detail-loading">Memuat data...</div>
              ) : (
                <>
                  {/* ── Alamat ── */}
                  {detailModalType === "alamat" && (
                    alamatData.length === 0
                      ? <div className="detail-empty">Tidak ada alamat tersimpan.</div>
                      : <div className="detail-list">
                          {alamatData.map((a) => (
                            <div key={a.id_alamat} className="detail-card">  {/* ← fix: id_alamat */}
                              <div className="detail-card-header">
                                <span className="detail-card-label">{a.label || "Alamat"}</span>
                                {a.is_utama && <span className="badge-utama">Utama</span>}
                              </div>
                              <p className="detail-card-name">{a.nama_penerima}</p>
                              <p className="detail-card-phone">{a.nomor_telp}</p>
                              <p className="detail-card-addr">
                                {a.alamat_lengkap}, {a.kota}, {a.provinsi} {a.kode_pos}
                              </p>
                            </div>
                          ))}
                        </div>
                  )}

                  {/* ── Favorit Produk ── */}
                  {detailModalType === "fav-produk" && (
                    favProdukData.length === 0
                      ? <div className="detail-empty">Tidak ada produk yang difavoritkan.</div>
                      : <div className="detail-list">
                          {favProdukData.map((fp) => (
                            <div key={fp.id_fav} className="detail-card detail-card-product">  {/* ← fix: id_fav */}
                              {fp.produk?.gambar_url && (
                                <img
                                  src={fp.produk.gambar_url}
                                  alt={fp.produk.nama_produk}
                                  className="detail-product-img"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <div className="detail-product-info">
                                <p className="detail-card-name">{fp.produk?.nama_produk || "-"}</p>
                                <p className="detail-card-price">{fp.produk?.harga ? formatRupiah(fp.produk.harga) : "-"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                  )}

                  {/* ── Favorit Resep ── */}
                  {detailModalType === "fav-resep" && (
                    favResepData.length === 0
                      ? <div className="detail-empty">Tidak ada resep yang difavoritkan.</div>
                      : <div className="detail-list">
                          {favResepData.map((fr) => (
                            <div key={fr.id_fav} className="detail-card detail-card-product">  {/* ← fix: id_fav */}
                              {fr.resep?.gambar_url && (
                                <img
                                  src={fr.resep.gambar_url}
                                  alt={fr.resep.judul_resep}
                                  className="detail-product-img"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <div className="detail-product-info">
                                <p className="detail-card-name">{fr.resep?.judul_resep || "-"}</p>
                                <p className="detail-card-kategori">{fr.resep?.kategori_jenis || "-"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                  )}

                  {/* ── Ulasan Produk ── */}
                  {detailModalType === "ulasan" && (
                    ulasanData.length === 0
                      ? <div className="detail-empty">Belum ada ulasan yang diberikan.</div>
                      : <div className="detail-list">
                          {ulasanData.map((ul) => (
                            <div key={ul.id_ulasan} className="detail-card detail-card-product">
                              {ul.produk?.gambar_url && (
                                <img
                                  src={ul.produk.gambar_url}
                                  alt={ul.produk.nama_produk}
                                  className="detail-product-img"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <div className="detail-product-info">
                                <p className="detail-card-name">{ul.produk?.nama_produk || "-"}</p>
                                <div className="detail-star-row">
                                  {[1,2,3,4,5].map(s => (
                                    <span key={s} className={s <= ul.rating ? "star-filled" : "star-empty"}>
                                      <StarIcon filled={s <= ul.rating} />
                                    </span>
                                  ))}
                                  <span className="detail-rating-num">{ul.rating}/5</span>
                                </div>
                                {ul.komentar && <p className="detail-card-komentar">"{ul.komentar}"</p>}
                                <p className="detail-card-tanggal">
                                  {new Date(ul.tanggal_ulasan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                  )}
                                  </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}