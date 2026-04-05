"use client";

import { useState } from "react";
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
type TabKey = "Product" | "Customers" | "Recipes";
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
const statCards: StatCard[] = [
  { label: "Total Penjualan", value: "Rp 45.2 M", badge: "+12.5%", variant: "up" },
  { label: "Total Pesanan", value: "8,234", badge: "+0.5%", variant: "neutral" },
  { label: "Total Produk", value: "456", badge: "-2.5%", variant: "down" },
  { label: "Total Penjualan", value: "12,567", badge: "+1%", variant: "up" },
];

const salesTrendData = [
  { month: "Jan", penjualan: 3200, pesanan: 1800 },
  { month: "Feb", penjualan: 4100, pesanan: 2200 },
  { month: "Mar", penjualan: 3800, pesanan: 2000 },
  { month: "Apr", penjualan: 5200, pesanan: 3100 },
  { month: "Mei", penjualan: 4700, pesanan: 2800 },
  { month: "Jun", penjualan: 6300, pesanan: 3800 },
  { month: "Jul", penjualan: 9800, pesanan: 5200 },
];

const categoryData = [
  { name: "Bij-bijian", value: 4100 },
  { name: "Umbi-umbian", value: 3200 },
  { name: "Sayuran", value: 2100 },
  { name: "Buah", value: 2800 },
  { name: "Palawija", value: 1900 },
];

const leaderboardData: LeaderboardRow[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  rank: i + 1,
  image: "/images/corn-1.jpg",
  name: "Beras Merah Organik",
  sold: 1234,
  revenue: "Rp. 12.340.000",
  trend: "+12.5%",
}));

// ── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("Product");
  const tabs: TabKey[] = ["Product", "Customers", "Recipes"];
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLeaderboard = leaderboardData.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );
  
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
      <div className="dashboard-page">
        {/* Page header */}
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Selamat datang di admin panel Panganesia</p>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid">
          {statCards.map((card, i) => (
            <div key={i} className="stat-card">
              <span className="stat-label">{card.label}</span>
              <span className="stat-value">{card.value}</span>
              <span className={`stat-badge ${card.variant}`}>{card.badge}</span>
            </div>
          ))}
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
              <AreaChart data={salesTrendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
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
              <BarChart data={categoryData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
            <span className="leaderboard-title">Leaderboard</span>
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
                <th>Product</th>
                <th>Sold</th>
                <th>Revenue</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.map((row) => (
                <tr key={row.id}>
                  <td>{row.rank}.</td>
                  <td>
                    <div className="lb-product-cell">
                      <Image
                        src={row.image}
                        alt={row.name}
                        width={40}
                        height={40}
                        className="lb-product-img"
                      />
                      <span className="lb-product-name">{row.name}</span>
                    </div>
                  </td>
                  <td>{row.sold.toLocaleString("id-ID")}</td>
                  <td>{row.revenue}</td>
                  <td>
                    <span className="trend-badge">{row.trend}</span>
                  </td>
                </tr>
              ))}
              
              {/* State ketika pencarian tidak ditemukan. colSpan diubah jadi 5 sesuai jumlah header */}
              {filteredLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                    Produk "{search}" tidak ditemukan.
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