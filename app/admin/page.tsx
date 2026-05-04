"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import "./page.css";

// ── Types ─────────────────────────────────────────────────────────────────────
type TabKey = "Produk" | "Pengguna" | "Resep";

interface DashboardStats {
  totalPendapatan: number;
  totalPesanan:    number;
  totalProduk:     number;
  totalPelanggan:  number;
}
interface SalesTrendPoint   { month: string; penjualan: number; pesanan: number; }
interface StatusPoint       { name: string; value: number; }
interface LeaderboardProduk { id_produk: number; nama_produk: string; gambar_url: string | null; terjual: number; pendapatan: number; }
interface LeaderboardResep  { id_resep: number; judul_resep: string; gambar_url: string | null; kategori_jenis: string | null; total_favorit: number; }
interface LeaderboardUser   { id: string; nama: string | null; email: string; total_belanja: number; total_pesanan: number; }

// ── Icons ─────────────────────────────────────────────────────────────────────
const SearchIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const BellIcon    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const TrendUpIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const BoxIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
const CartIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const UserIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const RevenueIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;

// ── Micro components ──────────────────────────────────────────────────────────
const Skeleton = ({ w = "100%", h = 16 }: { w?: string; h?: number }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: 8 }} />
);
const EmptyState = ({ label }: { label: string }) => (
  <div style={{ textAlign: "center", padding: "48px 24px", color: "#bbb" }}>
    <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
    <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
  </div>
);
const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 0) return <span className="rank-badge rank-badge--gold">🥇</span>;
  if (rank === 1) return <span className="rank-badge rank-badge--silver">🥈</span>;
  if (rank === 2) return <span className="rank-badge rank-badge--bronze">🥉</span>;
  return <span className="rank-badge rank-badge--default">#{rank + 1}</span>;
};

// ── Donut helpers ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Lunas:   "#2e7d32",
  Pending: "#f5c800",
  Gagal:   "#e53935",
  Lainnya: "#90a4ae",
};
const STATUS_ICON: Record<string, string> = {
  Lunas: "✅", Pending: "⏳", Gagal: "❌", Lainnya: "•",
};

// ── Tab meta ──────────────────────────────────────────────────────────────────
const TAB_META: Record<TabKey, { emoji: string; title: string; sub: string }> = {
  Produk:   { emoji: "🏆", title: "Produk Terlaris",  sub: "Berdasarkan total unit terjual"      },
  Pengguna: { emoji: "💎", title: "Top Spender",       sub: "Berdasarkan total belanja (lunas)"   },
  Resep:    { emoji: "❤️", title: "Resep Terfavorit",  sub: "Berdasarkan jumlah pengguna favorit" },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("Produk");
  const tabs: TabKey[]            = ["Produk", "Pengguna", "Resep"];
  const [search, setSearch]       = useState("");

  const [stats, setStats]           = useState<DashboardStats>({ totalPendapatan: 0, totalPesanan: 0, totalProduk: 0, totalPelanggan: 0 });
  const [salesTrend, setSalesTrend] = useState<SalesTrendPoint[]>([]);
  const [statusDist, setStatusDist] = useState<StatusPoint[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [lbProduk,   setLbProduk]   = useState<LeaderboardProduk[]>([]);
  const [lbPengguna, setLbPengguna] = useState<LeaderboardUser[]>([]);
  const [lbResep,    setLbResep]    = useState<LeaderboardResep[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const res  = await fetch("/api/admin/dashboard");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setStats(data.stats);
        setSalesTrend(data.salesTrend ?? []);
        setStatusDist(data.statusDistribusi ?? []);
        setLbProduk(data.leaderboard ?? []);
      } catch (e: any) {
        setError("Gagal memuat data dashboard: " + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setTabLoading(true);
      try {
        if (activeTab === "Pengguna" && lbPengguna.length === 0) {
          const res = await fetch("/api/admin/leaderboard/pengguna").catch(() => null);
          if (res?.ok) setLbPengguna(await res.json());
        }
        if (activeTab === "Resep" && lbResep.length === 0) {
          const res = await fetch("/api/admin/leaderboard/resep").catch(() => null);
          if (res?.ok) setLbResep(await res.json());
        }
      } finally {
        setTabLoading(false);
      }
    })();
  }, [activeTab]);

  const q                = search.toLowerCase();
  const filteredProduk   = lbProduk.filter(p => p.nama_produk.toLowerCase().includes(q));
  const filteredPengguna = lbPengguna.filter(u => (u.nama ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  const filteredResep    = lbResep.filter(r => r.judul_resep.toLowerCase().includes(q));

  const statCards = [
    { label: "Total Pendapatan", value: `Rp ${stats.totalPendapatan.toLocaleString("id-ID")}`, icon: <RevenueIcon />, variant: "green"  as const, note: "Pesanan lunas"     },
    { label: "Total Pesanan",    value: stats.totalPesanan.toLocaleString("id-ID"),             icon: <CartIcon />,    variant: "blue"   as const, note: "12 bulan terakhir" },
    { label: "Jumlah Produk",    value: stats.totalProduk.toLocaleString("id-ID"),              icon: <BoxIcon />,     variant: "orange" as const, note: "Stok terdaftar"    },
    { label: "Pelanggan Aktif",  value: stats.totalPelanggan.toLocaleString("id-ID"),           icon: <UserIcon />,    variant: "purple" as const, note: "Role: customer"    },
  ];

  const totalPesananAll = statusDist.reduce((s, d) => s + d.value, 0);
  const meta            = TAB_META[activeTab];

  return (
    <>
      <div className="topbar">
        <div className="topbar-search-wrap">
          <span className="topbar-search-icon"><SearchIcon /></span>
          <input
            type="text" placeholder="Cari di leaderboard..."
            className="topbar-search" value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="topbar-bell" aria-label="Notifications"><BellIcon /></button>
      </div>

      <div className="dashboard-page">
        <div className="page-header">
          <h1>Beranda</h1>
          <p>Selamat datang di panel admin Panganesia</p>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        <div className="stats-grid">
          {statCards.map(card => (
            <div className={`stat-card stat-card--${card.variant}`} key={card.label}>
              <div className="stat-icon-wrap">{card.icon}</div>
              <span className="stat-label">{card.label}</span>
              {loading ? <Skeleton h={32} w="70%" /> : <span className="stat-value">{card.value}</span>}
              <span className="stat-note">{card.note}</span>
            </div>
          ))}
        </div>

        <div className="charts-row">
          {/* Area — Tren Penjualan */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title">Tren Penjualan</div>
                <div className="chart-card-sub">Pendapatan & jumlah pesanan per bulan</div>
              </div>
              <span className="chart-badge"><TrendUpIcon /> Live</span>
            </div>
            {loading ? <Skeleton h={200} /> : salesTrend.length === 0
              ? <EmptyState label="Belum ada data penjualan" />
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="gradP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2e7d32" stopOpacity={0.28}/>
                        <stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradO" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f5c800" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f5c800" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}jt` : v >= 1_000 ? `${(v/1_000).toFixed(0)}rb` : String(v)}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #eee", fontFamily: "Plus Jakarta Sans, sans-serif" }}
                      formatter={(val, name) => [
                        name === "penjualan" ? `Rp ${Number(val).toLocaleString("id-ID")}` : `${val} pesanan`,
                        name === "penjualan" ? "Pendapatan" : "Pesanan",
                      ]}
                    />
                    <Legend formatter={v => <span style={{ fontSize: 12, fontWeight: 600 }}>{v === "penjualan" ? "Pendapatan" : "Pesanan"}</span>}/>
                    <Area type="monotone" dataKey="penjualan" stroke="#2e7d32" strokeWidth={2.5} fill="url(#gradP)" dot={false}/>
                    <Area type="monotone" dataKey="pesanan"   stroke="#f5c800" strokeWidth={2.5} fill="url(#gradO)" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              )
            }
          </div>

          {/* Donut — Distribusi Status Pesanan */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title">Status Pesanan</div>
                <div className="chart-card-sub">Distribusi status pembayaran (12 bln)</div>
              </div>
              <span className="chart-badge chart-badge--yellow">📊 Live</span>
            </div>

            {loading ? <Skeleton h={200} /> : statusDist.length === 0
              ? <EmptyState label="Belum ada data pesanan" />
              : (
                <div className="donut-wrap">
                  <div className="donut-chart-area">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusDist}
                          cx="50%" cy="50%"
                          innerRadius={58} outerRadius={84}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {statusDist.map((entry) => (
                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#ccc"} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #eee", fontFamily: "Plus Jakarta Sans, sans-serif" }}
                          formatter={(val, name) => {
                            const num = Number(val);
                            return [
                              `${num} pesanan (${totalPesananAll ? Math.round(num / totalPesananAll * 100) : 0}%)`,
                              String(name),
                            ];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Label tengah via absolute */}
                    <div className="donut-center-label">
                      <span className="donut-center-num">{totalPesananAll}</span>
                      <span className="donut-center-sub">pesanan</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="donut-legend">
                    {statusDist.map((entry) => {
                      const pct = totalPesananAll ? Math.round(entry.value / totalPesananAll * 100) : 0;
                      return (
                        <div key={entry.name} className="donut-legend-item">
                          <div className="donut-legend-dot" style={{ background: STATUS_COLORS[entry.name] ?? "#ccc" }} />
                          <div>
                            <div className="donut-legend-label">{entry.name}</div>
                            <div className="donut-legend-val">
                              <strong>{entry.value}</strong>
                              <span className="donut-legend-pct"> ({pct}%)</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            }
          </div>
        </div>

        {/* Leaderboard */}
        <div className="leaderboard-card">
          <div className="leaderboard-header">
            <div>
              <span className="leaderboard-title">{meta.emoji} {meta.title}</span>
              <p className="leaderboard-sub">{meta.sub}</p>
            </div>
            <div className="leaderboard-tabs">
              {tabs.map(tab => (
                <button
                  key={tab}
                  className={`lb-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => { setActiveTab(tab); setSearch(""); }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Produk */}
          {activeTab === "Produk" && (
            <table className="lb-table">
              <thead><tr><th>Rank</th><th>Produk</th><th>Terjual</th><th>Pendapatan</th><th>Status</th></tr></thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={5}><Skeleton h={20} /></td></tr>)
                  : filteredProduk.length === 0
                    ? <tr><td colSpan={5}><EmptyState label={search ? "Produk tidak ditemukan" : "Belum ada data"} /></td></tr>
                    : filteredProduk.map((row, i) => (
                        <tr key={row.id_produk}>
                          <td><RankBadge rank={i} /></td>
                          <td>
                            <div className="lb-product-cell">
                              {row.gambar_url
                                ? <Image src={row.gambar_url} alt={row.nama_produk} width={40} height={40} className="lb-product-img" />
                                : <div className="lb-product-img lb-product-img--placeholder">🌾</div>
                              }
                              <span className="lb-product-name">{row.nama_produk}</span>
                            </div>
                          </td>
                          <td><strong>{row.terjual}</strong> unit</td>
                          <td>Rp {row.pendapatan.toLocaleString("id-ID")}</td>
                          <td><span className="trend-badge trend-badge--green">↑ Laris</span></td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          )}

          {/* Pengguna */}
          {activeTab === "Pengguna" && (
            <table className="lb-table">
              <thead><tr><th>Rank</th><th>Pengguna</th><th>Total Pesanan</th><th>Total Belanja</th><th>Status</th></tr></thead>
              <tbody>
                {tabLoading
                  ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={5}><Skeleton h={20} /></td></tr>)
                  : filteredPengguna.length === 0
                    ? <tr><td colSpan={5}><EmptyState label={search ? "Pengguna tidak ditemukan" : "Belum ada data"} /></td></tr>
                    : filteredPengguna.map((u, i) => (
                        <tr key={u.id}>
                          <td><RankBadge rank={i} /></td>
                          <td>
                            <div className="lb-product-cell">
                              <div className="lb-avatar">{(u.nama ?? u.email).charAt(0).toUpperCase()}</div>
                              <div>
                                <div className="lb-product-name">{u.nama ?? "—"}</div>
                                <div className="lb-sub-text">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{u.total_pesanan} pesanan</td>
                          <td><strong>Rp {u.total_belanja.toLocaleString("id-ID")}</strong></td>
                          <td><span className="trend-badge trend-badge--blue">💎 Top</span></td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          )}

          {/* Resep */}
          {activeTab === "Resep" && (
            <table className="lb-table">
              <thead><tr><th>Rank</th><th>Resep</th><th>Kategori</th><th>Difavoritkan</th><th>Status</th></tr></thead>
              <tbody>
                {tabLoading
                  ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={5}><Skeleton h={20} /></td></tr>)
                  : filteredResep.length === 0
                    ? <tr><td colSpan={5}><EmptyState label={search ? "Resep tidak ditemukan" : "Belum ada data"} /></td></tr>
                    : filteredResep.map((r, i) => (
                        <tr key={r.id_resep}>
                          <td><RankBadge rank={i} /></td>
                          <td>
                            <div className="lb-product-cell">
                              {r.gambar_url
                                ? <Image src={r.gambar_url} alt={r.judul_resep} width={40} height={40} className="lb-product-img" />
                                : <div className="lb-product-img lb-product-img--placeholder">🍳</div>
                              }
                              <span className="lb-product-name">{r.judul_resep}</span>
                            </div>
                          </td>
                          <td style={{ color: "#555", fontSize: 13 }}>{r.kategori_jenis ?? "—"}</td>
                          <td><strong>{r.total_favorit}</strong> pengguna</td>
                          <td><span className="trend-badge trend-badge--yellow">❤️ Favorit</span></td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}