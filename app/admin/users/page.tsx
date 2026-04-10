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
  id_user: string;
  nama: string;
  email: string;
  alamat: string;
  nomor_telp: string;
  role: string;
  created_at: string;
}

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

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (!error) setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  // Fungsi memecah nama untuk tampilan tabel
  const splitName = (fullName: string) => {
    const parts = fullName?.trim().split(/\s+/) || ["-"];
    return {
      firstName: parts[0],
      lastName: parts.length > 1 ? parts.slice(1).join(" ") : "-"
    };
  };

  const handleDelete = async () => {
    if (!targetUser) return;
    const { error } = await supabase.from('users').delete().eq('id_user', targetUser.id_user);
    if (!error) {
      fetchUsers();
      setIsDeleteModalOpen(false);
      setTargetUser(null);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = (u.nama?.toLowerCase() || "").includes(search.toLowerCase()) || (u.email?.toLowerCase() || "").includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role?.toLowerCase() === roleFilter.toLowerCase();
    return matchSearch && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <>
      <div className="topbar">
        <div className="topbar-search-wrap">
          <input type="text" placeholder="Cari user..." className="topbar-search" value={search} onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} />
        </div>
      </div>

      <div className="products-page">
        <div className="products-header">
          <div className="products-header-left">
            <h1>Users</h1>
            <p>Data seluruh pengguna yang terdaftar di Panganesia.</p>
          </div>
          <div className="products-header-right">
            <select className="select-filter" value={roleFilter} onChange={(e) => {setRoleFilter(e.target.value); setCurrentPage(1);}}>
              <option value="all">Semua Role</option>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="table-card" style={{ overflowX: 'auto' }}>
          <table className="products-table" style={{ minWidth: '1100px' }}>
            <thead>
              <tr>
                <th>No.</th>
                <th>ID User</th>
                <th>Email</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th style={{ textAlign: 'center' }}>Role</th>
                <th>Nomor Telp</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{textAlign: "center", padding: "40px"}}>Memuat...</td></tr>
              ) : pageItems.map((u, i) => {
                const { firstName, lastName } = splitName(u.nama);
                return (
                  <tr key={u.id_user}>
                    <td>{(safePage - 1) * PER_PAGE + i + 1}.</td>
                    <td style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>
                      {u.id_user.substring(0, 8)}...
                    </td>
                    <td>{u.email}</td>
                    <td style={{ fontWeight: "700" }}>{firstName}</td>
                    <td>{lastName}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`role-badge ${u.role?.toLowerCase() === 'admin' ? 'role-admin' : 'role-user'}`}>
                        {u.role || "customer"}
                      </span>
                    </td>
                    <td>{u.nomor_telp || "-"}</td>
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
          <span className="pagination-info">Menampilkan {(safePage-1)*PER_PAGE+1}–{Math.min(safePage*PER_PAGE, filtered.length)} dari {filtered.length} user</span>
          <div className="pagination-controls">
            <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={safePage === 1}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`pg-btn ${safePage === p ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={safePage === totalPages}>Next</button>
          </div>
        </div>
      </div>

      {isDeleteModalOpen && targetUser && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="warning-box" onClick={(e) => e.stopPropagation()}>
            <div className="warning-header">
              <div className="warning-title-row">
                <div className="warning-icon"><WarnIcon /></div>
                <span className="warning-title">Hapus Profil</span>
              </div>
            </div>
            <p className="warning-text">Hapus profil <strong>{targetUser.nama}</strong>? Tindakan ini hanya menghapus data di tabel users.</p>
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