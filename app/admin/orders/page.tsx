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
  id_pesanan: number;
  id_user: string;
  tanggal_pesanan: string;
  total_harga: number;
  status_pembayaran: string;
  order_status: string;
}

interface ItemPesanan {
  id_item: number;
  id_produk: number;
  kuantitas: number;
  subtotal: number;
  produk?: { nama_produk: string; gambar_url: string | null };
}

const PER_PAGE = 10;

const SearchIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
const DeleteIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
const EditIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const WarnIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const BoxIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;

// ── Tambah 'dibatalkan' ke list ──────────────────────────────────────────────
const ORDER_STATUS_LIST = ['dikemas', 'dikirim', 'selesai', 'dibatalkan'] as const;
type OrderStatus = typeof ORDER_STATUS_LIST[number];

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  dikemas: '📦 Dikemas',
  dikirim: '🚚 Dikirim',
  selesai: '✅ Selesai',
  dibatalkan: '❌ Dibatalkan',
};

export default function AdminOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Edit/Delete modal
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetOrder, setTargetOrder]           = useState<Order | null>(null);
  const [formData, setFormData]                 = useState({
    id_user: "a995b383-64fd-429f-8a25-741c407ca8e7",
    total_harga: 0,
    status_pembayaran: "Pending",
    order_status: "dikemas" as OrderStatus,
  });

  // Items modal
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [itemsLoading, setItemsLoading]         = useState(false);
  const [activeOrderId, setActiveOrderId]       = useState<number | null>(null);
  const [items, setItems]                       = useState<ItemPesanan[]>([]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pesanan')
      .select('*')
      .order('tanggal_pesanan', { ascending: false });
    if (!error) setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  // ── Order Status inline update ────────────────────────────────────────────
  const handleOrderStatusChange = async (id: number, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id_pesanan === id ? { ...o, order_status: newStatus } : o));
    await supabase.from('pesanan').update({ order_status: newStatus }).eq('id_pesanan', id);
  };

  // ── Items modal ───────────────────────────────────────────────────────────
  const openItemsModal = async (orderId: number) => {
    setActiveOrderId(orderId);
    setIsItemsModalOpen(true);
    setItemsLoading(true);
    setItems([]);

    const { data, error } = await supabase
      .from('item_pesanan')
      .select('*, produk(nama_produk, gambar_url)')
      .eq('id_pesanan', orderId);

    if (!error) setItems(data || []);
    setItemsLoading(false);
  };

  // ── Save (add/edit) ───────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetOrder) {
      await supabase.from('pesanan').update(formData).eq('id_pesanan', targetOrder.id_pesanan);
    } else {
      await supabase.from('pesanan').insert([{ ...formData, tanggal_pesanan: new Date().toISOString() }]);
    }
    fetchOrders();
    closeModal();
  };

  // ── Delete: hapus ulasan → item_pesanan → pesanan ─────────────────────────
  const handleDelete = async () => {
    if (!targetOrder) return;

    // 1. Ambil semua id_item milik pesanan ini
    const { data: itemList } = await supabase
      .from('item_pesanan')
      .select('id_item')
      .eq('id_pesanan', targetOrder.id_pesanan);

    const itemIds = (itemList || []).map((i: { id_item: number }) => i.id_item);

    // 2. Hapus ulasan yang terkait item tersebut (jika ada)
    if (itemIds.length > 0) {
      await supabase.from('ulasan').delete().in('id_item', itemIds);
    }

    // 3. Hapus item_pesanan
    await supabase.from('item_pesanan').delete().eq('id_pesanan', targetOrder.id_pesanan);

    // 4. Baru hapus pesanan
    await supabase.from('pesanan').delete().eq('id_pesanan', targetOrder.id_pesanan);

    fetchOrders();
    setIsDeleteModalOpen(false);
    setTargetOrder(null);
  };

  const openModal = (order: Order | null = null) => {
    if (order) {
      setTargetOrder(order);
      setFormData({
        id_user: order.id_user,
        total_harga: order.total_harga,
        status_pembayaran: order.status_pembayaran,
        order_status: (order.order_status as OrderStatus) || 'dikemas',
      });
    } else {
      setTargetOrder(null);
      setFormData({ id_user: "a995b383-64fd-429f-8a25-741c407ca8e7", total_harga: 0, status_pembayaran: "Pending", order_status: "dikemas" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setTargetOrder(null); };

  const filtered = orders.filter(o => {
    const matchSearch = (o.id_pesanan?.toString() || "").includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status_pembayaran?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const safePage  = Math.min(currentPage, Math.max(1, Math.ceil(filtered.length / PER_PAGE)));
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const startItem = filtered.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1;
  const endItem = Math.min(safePage * PER_PAGE, filtered.length);

  return (
    <>
      <div className="topbar">
        <div className="topbar-search-wrap">
          <div className="search-icon-inside"><SearchIcon /></div>
          <input type="text" placeholder="Cari ID Order..." className="topbar-search"
            value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
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
              <option value="dibayar">Dibayar</option>
              <option value="pending">Pending</option>
              <option value="gagal">Gagal</option>
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
                <th>Items</th>
                <th>Status Bayar</th>
                <th>Status Order</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>Memuat data...</td></tr>
              ) : pageItems.map((o, i) => (
                <tr key={o.id_pesanan}>
                  <td>{(safePage - 1) * PER_PAGE + i + 1}.</td>
                  <td className="mono-cell">#{o.id_pesanan}</td>
                  <td style={{ fontSize: '11px', color: '#666' }}>{o.id_user}</td>
                  <td className="bold-cell">Rp {o.total_harga?.toLocaleString('id-ID')}</td>

                  <td>
                    <button className="btn-items" onClick={() => openItemsModal(o.id_pesanan)}>
                      <BoxIcon /> Lihat
                    </button>
                  </td>

                  <td>
                    <span className={`status-badge ${o.status_pembayaran?.toLowerCase()}`}>
                      {o.status_pembayaran}
                    </span>
                  </td>

                  {/* Order Status — inline dropdown, dibatalkan tidak bisa diubah */}
                  <td>
                    {o.order_status === 'dibatalkan' ? (
                      <span className="order-status-select order-status-select--dibatalkan">
                        ❌ Dibatalkan
                      </span>
                    ) : (
                      <select
                        className={`order-status-select order-status-select--${o.order_status ?? 'dikemas'}`}
                        value={o.order_status ?? 'dikemas'}
                        onChange={(e) => handleOrderStatusChange(o.id_pesanan, e.target.value as OrderStatus)}
                      >
                        {ORDER_STATUS_LIST.filter(s => s !== 'dibatalkan').map(s => (
                          <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    )}
                  </td>

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

        {totalPages > 1 && (
          <div className="pagination-row">
            <span className="pagination-info">
              Menampilkan {startItem}-{endItem} dari {filtered.length} order
            </span>
            <div className="pagination-controls">
              <button className="pg-btn" disabled={safePage === 1} onClick={() => setCurrentPage(safePage - 1)}>
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`pg-btn ${p === safePage ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>
                  {p}
                </button>
              ))}
              <button className="pg-btn" disabled={safePage === totalPages} onClick={() => setCurrentPage(safePage + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Items ─────────────────────────────────────────────────────── */}
      {isItemsModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsItemsModalOpen(false)}>
          <div className="modal-content items-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Items Order #{activeOrderId}</h2>
                <p className="modal-sub">Detail produk dalam pesanan ini</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsItemsModalOpen(false)}>✕</button>
            </div>

            {itemsLoading ? (
              <div className="items-loading">Memuat items...</div>
            ) : items.length === 0 ? (
              <div className="items-empty">📭 Tidak ada item dalam pesanan ini</div>
            ) : (
              <table className="items-table">
                <thead>
                  <tr>
                    <th>ID Item</th>
                    <th>Produk</th>
                    <th>ID Produk</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id_item}>
                      <td className="mono-cell">#{item.id_item}</td>
                      <td>
                        <div className="item-produk-cell">
                          {item.produk?.gambar_url
                            ? <img src={item.produk.gambar_url} alt={item.produk.nama_produk} className="item-img" />
                            : <div className="item-img item-img--placeholder">🌾</div>
                          }
                          <span>{item.produk?.nama_produk ?? '—'}</span>
                        </div>
                      </td>
                      <td className="mono-cell" style={{ color: '#999', fontSize: 12 }}>#{item.id_produk}</td>
                      <td><strong>{item.kuantitas}</strong> pcs</td>
                      <td>Rp {item.subtotal?.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, paddingTop: 12, color: '#333' }}>Total Item:</td>
                    <td style={{ fontWeight: 800, color: '#1a3a2a' }}>
                      Rp {items.reduce((s, i) => s + Number(i.subtotal), 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Add / Edit ─────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{targetOrder ? "Edit Order" : "Tambah Order Baru"}</h2>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>User UUID</label>
                <input type="text" value={formData.id_user}
                  onChange={e => setFormData({ ...formData, id_user: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Total Harga (Rp)</label>
                <input type="number" value={formData.total_harga}
                  onChange={e => setFormData({ ...formData, total_harga: parseInt(e.target.value) })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status Bayar</label>
                  <select value={formData.status_pembayaran}
                    onChange={e => setFormData({ ...formData, status_pembayaran: e.target.value })}>
                    <option value="Pending">Pending</option>
                    <option value="Dibayar">Dibayar</option>
                    <option value="Gagal">Gagal</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status Order</label>
                  <select value={formData.order_status}
                    onChange={e => setFormData({ ...formData, order_status: e.target.value as OrderStatus })}>
                    {ORDER_STATUS_LIST.map(s => (
                      <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                    ))}
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

      {/* ── Modal Delete ─────────────────────────────────────────────────────── */}
      {isDeleteModalOpen && targetOrder && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="warning-box" onClick={e => e.stopPropagation()}>
            <div className="warning-header">
              <div className="warning-title-row">
                <div className="warning-icon"><WarnIcon /></div>
                <span className="warning-title">Hapus Order</span>
              </div>
            </div>
            <p className="warning-text">Hapus permanen order <strong>#{targetOrder.id_pesanan}</strong>?</p>
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