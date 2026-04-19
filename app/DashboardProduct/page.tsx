"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import "./page.css";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  liked: boolean;
}

interface Banner {
  id: number;
  title: string;
  bg: string;
<<<<<<< HEAD
=======
  buttonText?: string; 
  link?: string;       
>>>>>>> origin/feature/detail-product
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const banners: Banner[] = [
<<<<<<< HEAD
  { id: 0, title: "CHECK THIS\nOUT !", bg: "#2a8a3a" },
=======
  { 
    id: 0, 
    title: "DISCOVER\nNEW RECIPES", 
    bg: "url('https://i.pinimg.com/1200x/93/5c/63/935c63beb807c40e73966b6043af6f6a.jpg')", 
    buttonText: "Find out",
    link: "/recipes" 
  },
  // Sisanya tetap pakai warna atau bisa kamu ganti gambar juga nanti
>>>>>>> origin/feature/detail-product
  { id: 1, title: "SPECIAL\nDISCOUNT", bg: "#1f6e2b" },
  { id: 2, title: "FREE\nDELIVERY", bg: "#329c45" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID").replace(/\./g, ".");

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const CartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a8a3a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1.5" /><circle cx="20" cy="21" r="1.5" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
<<<<<<< HEAD
=======
const ChefHatIcon = () => (
  <svg 
    width="28" 
    height="28" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="#ff6b00" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Bagian Mahkota (Gembung) - Dibuat lebar dan bulat */}
    <path d="M6 13c-3 0-4-3-4-5a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 2-1 5-4 5" />
    
    {/* Bagian Bawah (Band) - Kotak simetris di tengah */}
    <path d="M6 13h12v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7Z" />
    
    {/* Garis detail lipatan topi */}
    <line x1="6" y1="17" x2="18" y2="17" />
  </svg>
);

>>>>>>> origin/feature/detail-product
const ProfileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffcc00" stroke="#ffcc00" strokeWidth="0">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#e53935" : "none"} stroke={filled ? "#e53935" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const ChevronRight = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  onToggleLike,
}: {
  product: Product;
  onToggleLike: (id: number) => void;
}) {
  return (
    <div className="product-card">
      <div className="card-image-wrap">
        <Image
          src={product.image}
          alt={product.name}
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 33vw"
          style={{ objectFit: "cover" }}
          className="card-image"
        />
        <button
          className="like-btn"
          onClick={() => onToggleLike(product.id)}
          aria-label="Toggle wishlist"
        >
          <HeartIcon filled={product.liked} />
        </button>
      </div>
      <div className="card-body">
        <h3 className="card-name">{product.name}</h3>
        <p className="card-price">{formatRupiah(product.price)}</p>
        <div className="card-actions">
          <Link href={`/product/${product.id}`} className="btn-detail">
            Detail
          </Link>
          <Link href={`/checkout`} className="btn-buy">
            Buy Now
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardProduct() {
  const [search, setSearch] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);
  const [localLikes, setLocalLikes] = useState<number[]>([]);

  const { data: serverProducts = [], isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produk").select("*");
      if (error) throw new Error(error.message);
      
      // Map data di sini 
      return data.map((item) => ({
        id: item.id_produk,
        name: item.nama_produk,
        price: Number(item.harga),
        image: item.gambar_url,
        liked: false,
      }));
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const products = serverProducts.map((p) => ({
    ...p,
    liked: localLikes.includes(p.id),
  }));
  
  const supabase = createClient();
  const router = useRouter();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  const handleToggleLike = (id: number) => {
    setLocalLikes((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
    console.log("Toggle like untuk id:", id);
  };

  const nextBanner = () =>
    setActiveBanner((i) => (i + 1) % banners.length);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function ProductSkeleton() {
  return (
      <div className="product-card skeleton">
        <div className="card-image-wrap skeleton-box" />
        <div className="card-body">
          <div className="skeleton-line title" />
          <div className="skeleton-line price" />
          <div className="skeleton-actions">
            <div className="skeleton-btn" />
            <div className="skeleton-btn" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="nav-logo">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={48}
            height={48}
            style={{ borderRadius: "50%", objectFit: "contain" }}
          />
        </div>

        <div className="search-wrap">
          <input
            type="text"
            className="search-input"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="search-icon-wrap">
            <SearchIcon />
          </span>
        </div>

        <div className="nav-actions">
<<<<<<< HEAD
=======
          <Link href="/recipes" className="nav-link">
            <ChefHatIcon />
            <span className="nav-link-label resep-label">Resep</span>
          </Link>
>>>>>>> origin/feature/detail-product
          <Link href="/cart" className="nav-link">
            <CartIcon />
            <span className="nav-link-label cart-label">Cart</span>
          </Link>

          {/* BAGIAN PROFILE DROPDOWN */}
          <div className="profile-dropdown-container">
            <div className="nav-link profile-trigger">
              <ProfileIcon />
              <span className="nav-link-label profile-label">Profile</span>
            </div>
            
            {/* Menu yang muncul saat hover */}
            <div className="dropdown-menu">
              <Link href="/profile" className="dropdown-item">My Profile</Link>
              <button onClick={handleLogout} className="dropdown-item logout-btn-text">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Text ── */}
      <section className="hero-text">
        <h1 className="welcome-title">WELCOME!</h1>
        <p className="welcome-sub">Take A Look Our Products And Go Check Out!</p>
      </section>

      {/* ── Banner / Carousel ── */}
      <section className="banner-section">
        <div
          className="banner-card"
<<<<<<< HEAD
          style={{ background: banners[activeBanner].bg }}
=======
          style={{ 
            background: banners[activeBanner].bg.startsWith('url') 
              ? `${banners[activeBanner].bg} center/cover no-repeat` 
              : banners[activeBanner].bg 
          }}
>>>>>>> origin/feature/detail-product
        >
          <div className="banner-content">
            <h2 className="banner-title">
              {banners[activeBanner].title.split('\n').map((line, idx) => (
                <span key={idx} style={{ display: 'block' }}>{line}</span>
              ))}
            </h2>
<<<<<<< HEAD
=======

            {/* Tampilkan tombol jika ada buttonText di data banner */}
            {banners[activeBanner].buttonText && (
              <Link href={banners[activeBanner].link || "#"}>
                <button className="banner-cta-button">
                  {banners[activeBanner].buttonText}
                </button>
              </Link>
            )}
>>>>>>> origin/feature/detail-product
          </div>

          <button className="banner-arrow banner-arrow-right" onClick={nextBanner}>
            <ChevronRight />
          </button>

          <div className="banner-dots">
            {banners.map((_, i) => (
              <button
                key={i}
                className={`banner-dot ${i === activeBanner ? "dot-active" : ""}`}
                onClick={() => setActiveBanner(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Products Grid ── */}
      <section className="products-section">
        {isLoading ? (
          <div className="products-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
        ) : isError ? (
          <p>Terjadi kesalahan saat memuat data.</p>
        ) : filtered.length === 0 ? (
          <p className="no-results">Produk tidak ditemukan.</p>
        ) : (
          <div className="products-grid">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onToggleLike={handleToggleLike}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}