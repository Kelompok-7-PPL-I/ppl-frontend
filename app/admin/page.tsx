"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./page.css";

// Types 
type TabKey = "Produk" | "Pengguna" | "Resep";
type BadgeVariant = "up" | "neutral" | "down";

interface StatCard {
  label: string;
  value: string;
  badge: string;
  variant: BadgeVariant;
}

interface LeaderboardRow {
  id: number;
  rank: number;
  image: string;
  name: string;
  sold: number;
  revenue: string;
  trend: string;
}

// Mock Data 
// const statCards: StatCard[] = [
//   { label: "Total Penjualan", value: "Rp 45.2 M", badge: "+12.5%", variant: "up" },
//   { label: "Total Pesanan", value: "8,234", badge: "+0.5%", variant: "neutral" },
//   { label: "Total Produk", value: "456", badge: "-2.5%", variant: "down" },
//   { label: "Total Penjualan", value: "12,567", badge: "+1%", variant: "up" },
// ];

// const salesTrendData = [
//   { month: "Jan", penjualan: 3200, pesanan: 1800 },
//   { month: "Feb", penjualan: 4100, pesanan: 2200 },
//   { month: "Mar", penjualan: 3800, pesanan: 2000 },
//   { month: "Apr", penjualan: 5200, pesanan: 3100 },
//   { month: "Mei", penjualan: 4700, pesanan: 2800 },
//   { month: "Jun", penjualan: 6300, pesanan: 3800 },
//   { month: "Jul", penjualan: 9800, pesanan: 5200 },
// ];

// const categoryData = [
//   { name: "Bij-bijian", value: 4100 },
//   { name: "Umbi-umbian", value: 3200 },
//   { name: "Sayuran", value: 2100 },
//   { name: "Buah", value: 2800 },
//   { name: "Palawija", value: 1900 },
// ];

// const leaderboardData: LeaderboardRow[] = Array.from({ length: 5 }, (_, i) => ({
//   id: i + 1,
//   rank: i + 1,
//   image: "/images/corn-1.jpg",
//   name: "Beras Merah Organik",
//   sold: 1234,
//   revenue: "Rp. 12.340.000",
//   trend: "+12.5%",
// }));

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

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<TabKey>("Produk");
  const tabs: TabKey[] = ["Produk", "Pengguna", "Resep"];
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // const filteredLeaderboard = leaderboardData.filter((item) =>
  //   item.name.toLowerCase().includes(search.toLowerCase())
  // );

  const [realStats, setRealStats] = useState({
    penjualan: 0,
    pesanan: 0,
    produk: 0,
    pelanggan: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Ambil Total Produk (Tabel 'produk')
        const { count: pCount } = await supabase
          .from('produk')
          .select('*', { count: 'exact', head: true });
        
        // 2. Ambil Total Pelanggan (Tabel 'users' dengan role customer)
        const { count: cCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'customer');

        // 3. Ambil Data Penjualan & Pesanan (Tabel 'orders')
        const { data: orders } = await supabase
          .from('orders')
          .select('total_harga, created_at');

        // Kalkulasi total nominal dan jumlah transaksi
        const totalRevenue = orders?.reduce((sum, item) => sum + (item.total_harga || 0), 0) || 0;
        const totalOrders = orders?.length || 0;

        // Update state dengan data asli
        setRealStats({
          produk: pCount || 0,
          pelanggan: cCount || 0,
          pesanan: totalOrders,
          penjualan: totalRevenue
        });

        // Set data grafik (kosong jika tidak ada transaksi)
        if (orders && orders.length > 0) {
          // Logika sederhana pengelompokan data bisa ditambahkan di sini nanti
          setChartData(orders); 
        } else {
          setChartData([]);
        }

      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
      }
    };

    fetchDashboardData();
  }, []);
  
  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-search-wrap">
          <span className="topbar-search-icon">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Cari data"
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
      <div className="dashboard-page">
        {/* Page header */}
        <div className="page-header">
          <h1>Beranda</h1>
          <p>Selamat datang di panel admin Panganesia</p>
        </div>

        {/* Stat Cards Real-time*/}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Pendapatan</span>
            <span className="stat-value">Rp {realStats.penjualan.toLocaleString('id-ID')}</span>
            <span className="stat-badge up">Saat Ini</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Pesanan</span>
            <span className="stat-value">{realStats.pesanan.toLocaleString('id-ID')}</span>
            <span className="stat-badge neutral">Transaksi</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Jumlah Stok</span>
            <span className="stat-value">{realStats.produk}</span>
            <span className="stat-badge down">Produk</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pelanggan Aktif</span>
            <span className="stat-value">{realStats.pelanggan}</span>
            <span className="stat-badge up">Pengguna</span>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-row">
          {/* Area Chart — Tren Penjualan */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">Tren Penjualan</div>
              <div className="chart-card-sub">Penjualan dan pesanan 7 bulan terakhir</div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData.length > 0 ? chartData : [{month: 'N/A', penjualan: 0}]}>                <defs>
                  <linearGradient id="gradPenjualan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64b5f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#64b5f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPesanan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#26a69a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#26a69a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #eee", fontFamily: "Plus Jakarta Sans, sans-serif" }}
                />
                <Legend
                  formatter={(v) => <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span>}
                />
                <Area type="monotone" dataKey="penjualan" name="penjualan" stroke="#64b5f6" strokeWidth={2.5} fill="url(#gradPenjualan)" dot={false} />
                <Area type="monotone" dataKey="pesanan" name="pesanan" stroke="#26a69a" strokeWidth={2.5} fill="url(#gradPesanan)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart — Kategori Produk */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">Kategori Produk</div>
              <div className="chart-card-sub">Penjualan per kategori</div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              {/* <BarChart data={categoryData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}> */}
              <BarChart data={chartData.length > 0 ? chartData : [{name: 'Belum ada data', value: 0}]} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #eee", fontFamily: "Plus Jakarta Sans, sans-serif" }}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Bar dataKey="value" name="Penjualan" fill="#2e7d32" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="leaderboard-card">
          <div className="leaderboard-header">
            <span className="leaderboard-title">Daftar Peringkat</span>
            <div className="leaderboard-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`lb-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <table className="lb-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Produk</th>
                <th>Terjual</th>
                <th>Pendapatan</th>
                <th>Tren</th>
              </tr>
            </thead>
            <tbody>
              {topProducts && topProducts.length > 0 ? (
                topProducts.map((row, index) => (
                  <tr key={row.id || index}>
                    <td>{index + 1}.</td>
                    <td>
                      <div className="lb-product-cell">
                        <Image
                          src={row.image_url || "/images/placeholder.jpg"}
                          alt={row.name || "Produk"}
                          width={40}
                          height={40}
                          className="lb-product-img"
                        />
                        <span className="lb-product-name">{row.name || row.nama_produk}</span>
                      </div>
                    </td>
                    <td>{row.sold || 0}</td>
                    <td>Rp {(row.revenue || 0).toLocaleString("id-ID")}</td>
                    <td><span className="trend-badge">New</span></td>
                  </tr>
                ))
              ) : (
                /* Jika data kosong */
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>
                    Belum ada data peringkat untuk ditampilkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}