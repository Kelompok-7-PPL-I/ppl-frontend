"use client";

import { useState, useEffect } from "react";
import "./page.css";
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

interface Order {
  id_order_internal: string;
  id_order: string; 
  id_user: string;
  total: number;
  metode: string;
  status: string;
  created_at: string;
}

const PER_PAGE = 10;

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

export default function AdminOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error) setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleDelete = async () => {
    if (!targetOrder) return;
    const { error } = await supabase.from('orders').delete().eq('id_order_internal', targetOrder.id_order_internal);
    if (!error) {
      fetchOrders();
      setIsDeleteModalOpen(false);
      setTargetOrder(null);
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = (o.id_order?.toLowerCase() || "").includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <>
      <div className="topbar">
        <div className="topbar-search-wrap">
          <input type="text" placeholder="Cari ID Order..." className="topbar-search" value={search} onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} />
        </div>
      </div>

      <div className="products-page">
        <div className="products-header">
          <div className="products-header-left">
            <h1>Orders</h1>
            <p>Kelola semua order transaksi Panganesia.</p>
          </div>
          <div className="products-header-right">
            <select className="select-filter" value={statusFilter} onChange={(e) => {setStatusFilter(e.target.value); setCurrentPage(1);}}>
              <option value="all">Semua Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="table-card">
          <table className="products-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>ID Order</th>
                <th>ID User</th>
                <th>Total</th>
                <th>Metode</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{textAlign: "center", padding: "40px"}}>Memuat...</td></tr>
              ) :  pageItems.map((o, i) => (
                <tr key={o.id_order_internal}>
                  <td>{(safePage - 1) * PER_PAGE + i + 1}.</td>
                  <td className="mono-cell">{o.id_order}</td>
                  <td>{o.id_user}</td>
                  <td className="bold-cell">Rp {o.total?.toLocaleString()}</td>
                  <td>{o.metode}</td>
                  <td>
                    <span className={`status-badge ${o.status?.toLowerCase()}`}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-cell">
                      <button className="btn-icon delete" onClick={() => { setTargetOrder(o); setIsDeleteModalOpen(true); }}>
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <span className="pagination-info">Menampilkan {(safePage-1)*PER_PAGE+1}–{Math.min(safePage*PER_PAGE, filtered.length)} dari {filtered.length} order</span>
          <div className="pagination-controls">
            <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`pg-btn ${safePage === p ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next</button>
          </div>
        </div>
      </div>

      {isDeleteModalOpen && targetOrder && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="warning-box" onClick={(e) => e.stopPropagation()}>
            <div className="warning-header">
              <div className="warning-title-row">
                <div className="warning-icon"><WarnIcon /></div>
                <span className="warning-title">Hapus Order</span>
              </div>
            </div>
            <p className="warning-text">Hapus order <strong>{targetOrder.id_order}</strong>?</p>
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