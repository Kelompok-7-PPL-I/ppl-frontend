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
  id_order: number;
  id_user: string;
  tanggal_order: string;
  total_harga: number;
  status_pembayaran: string;
  metode_bayar: string;
}

const PER_PAGE = 10;

// Icons
const SearchIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
const DeleteIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const WarnIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;

export default function AdminOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);
  
  // Form States
  const [formData, setFormData] = useState({
    id_user: "a995b383-64fd-429f-8a25-741c407ca8e7",
    total_harga: 0,
    status_pembayaran: "Pending",
    metode_bayar: "QRIS"
  });

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('orders').select('*').order('tanggal_order', { ascending: false });
    if (!error) setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetOrder) {
      // UPDATE
      const { error } = await supabase.from('orders').update(formData).eq('id_order', targetOrder.id_order);
      if (!error) fetchOrders();
    } else {
      // INSERT
      const { error } = await supabase.from('orders').insert([{ ...formData, tanggal_order: new Date().toISOString() }]);
      if (!error) fetchOrders();
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (!targetOrder) return;
    const { error } = await supabase.from('orders').delete().eq('id_order', targetOrder.id_order);
    if (!error) {
      fetchOrders();
      setIsDeleteModalOpen(false);
      setTargetOrder(null);
    }
  };

  const openModal = (order: Order | null = null) => {
    if (order) {
      setTargetOrder(order);
      setFormData({
        id_user: order.id_user,
        total_harga: order.total_harga,
        status_pembayaran: order.status_pembayaran,
        metode_bayar: order.metode_bayar
      });
    } else {
      setTargetOrder(null);
      setFormData({ id_user: "a995b383-64fd-429f-8a25-741c407ca8e7", total_harga: 0, status_pembayaran: "Pending", metode_bayar: "QRIS" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTargetOrder(null);
  };

  const filtered = orders.filter(o => {
    const matchSearch = (o.id_order?.toString() || "").includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status_pembayaran?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const safePage = Math.min(currentPage, Math.max(1, Math.ceil(filtered.length / PER_PAGE)));
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <>
      <div className="topbar">
        <div className="topbar-search-wrap">
          <div className="search-icon-inside"><SearchIcon /></div>
          <input type="text" placeholder="Cari ID Order..." className="topbar-search" value={search} onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} />
        </div>
      </div>

      <div className="products-page">
        <div className="products-header">
          <div className="products-header-left">
            <h1>Orders</h1>
            <p>Kelola semua transaksi Panganesia.</p>
          </div>
          <div className="products-header-right">
            <button className="btn-add" onClick={() => openModal()}>+ Tambah Order</button>
            <select className="select-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Semua Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
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
                <tr><td colSpan={7} style={{textAlign: "center", padding: "40px"}}>Memuat data...</td></tr>
              ) : pageItems.map((o, i) => (
                <tr key={o.id_order}>
                  <td>{(safePage - 1) * PER_PAGE + i + 1}.</td>
                  <td className="mono-cell">#{o.id_order}</td>
                  <td style={{fontSize: '11px', color: '#666'}}>{o.id_user}</td>
                  <td className="bold-cell">Rp {o.total_harga?.toLocaleString('id-ID')}</td>
                  <td>{o.metode_bayar}</td>
                  <td><span className={`status-badge ${o.status_pembayaran?.toLowerCase()}`}>{o.status_pembayaran}</span></td>
                  <td>
                    <div className="action-cell">
                      <button className="btn-icon edit" onClick={() => openModal(o)}><EditIcon /></button>
                      <button className="btn-icon delete" onClick={() => { setTargetOrder(o); setIsDeleteModalOpen(true); }}><DeleteIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{targetOrder ? "Edit Order" : "Tambah Order Baru"}</h2>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>User UUID</label>
                <input type="text" value={formData.id_user} onChange={e => setFormData({...formData, id_user: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Total Harga (Rp)</label>
                <input type="number" value={formData.total_harga} onChange={e => setFormData({...formData, total_harga: parseInt(e.target.value)})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Metode Bayar</label>
                  <select value={formData.metode_bayar} onChange={e => setFormData({...formData, metode_bayar: e.target.value})}>
                    <option value="QRIS">QRIS</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.status_pembayaran} onChange={e => setFormData({...formData, status_pembayaran: e.target.value})}>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-save">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {isDeleteModalOpen && targetOrder && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="warning-box" onClick={(e) => e.stopPropagation()}>
            <div className="warning-header">
              <div className="warning-title-row">
                <div className="warning-icon"><WarnIcon /></div>
                <span className="warning-title">Hapus Order</span>
              </div>
            </div>
            <p className="warning-text">Hapus permanen order <strong>#{targetOrder.id_order}</strong>?</p>
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