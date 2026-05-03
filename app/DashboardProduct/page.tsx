  "use client";

  import { useState } from "react";
  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import Image from "next/image";
  import Link from "next/link";
  import "./page.css";
  import { createClient } from "@/utils/supabase/client";
  import { useRouter } from "next/navigation";
  import { signOut as nextAuthSignOut } from "next-auth/react";
  import { useSession } from "next-auth/react";

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
    buttonText?: string; 
    link?: string;       
  }

  // ─── Mock Data ────────────────────────────────────────────────────────────────
  const banners: Banner[] = [
    { 
      id: 0, 
      title: "TEMUKAN\nRESEP BARU", 
      bg: "url('https://i.pinimg.com/1200x/93/5c/63/935c63beb807c40e73966b6043af6f6a.jpg')", 
      buttonText: "Temukan",
      link: "/recipes" 
    },
    { id: 1, title: "DISKON\nSPESIAL", bg: "#1f6e2b" },
    { id: 2, title: "PENGIRIMAN\nGRATIS", bg: "#329c45" },
  ];

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const formatRupiah = (n: number) =>
    "Rp " + n.toLocaleString("id-ID").replace(/\./g, ".");

  // ─── Icons ────────────────────────────────────────────────────────────────────
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
  const ChefHatIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13c-3 0-4-3-4-5a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 2-1 5-4 5" />
      <path d="M6 13h12v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7Z" />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  );
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

  // ─── Components ───────────────────────────────────────────────────────────────
  function ProductCard({ product, onToggleLike }: { product: Product; onToggleLike: (id: number) => void }) {
    return (
      <div className="product-card">
        <div className="card-image-wrap">
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: "cover" }} className="card-image" />
          <button className="like-btn" onClick={() => onToggleLike(product.id)} aria-label="Toggle wishlist">
            <HeartIcon filled={product.liked} />
          </button>
        </div>
        <div className="card-body">
          <h3 className="card-name">{product.name}</h3>
          <p className="card-price">{formatRupiah(product.price)}</p>
          <div className="card-actions">
            <Link href={`/product/${product.id}`} className="btn-detail">Detail</Link>
            <Link href={`/checkout`} className="btn-buy">Beli Sekarang</Link>
          </div>
        </div>
      </div>
    );
  }
    function ProductSkeleton() {
    return (
      <div className="product-card">
        <div className="card-image-wrap skeleton-box" style={{ height: "200px" }}></div>
        <div className="card-body">
          <div className="skeleton-box" style={{ height: "20px", width: "80%", marginBottom: "10px" }}></div>
          <div className="skeleton-box" style={{ height: "15px", width: "40%", marginBottom: "20px" }}></div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div className="skeleton-box" style={{ height: "35px", flex: 1 }}></div>
            <div className="skeleton-box" style={{ height: "35px", flex: 1 }}></div>
          </div>
        </div>
      </div>
    );
  }

  export default function DashboardProduct() {
    const [search, setSearch] = useState("");
    const [activeBanner, setActiveBanner] = useState(0);
    const supabase = createClient();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: session, status } = useSession();

    // 1. Ambil ID User dari tabel 'pengguna' berdasarkan email session NextAuth
    const { data: userData } = useQuery({
      queryKey: ["currentUser", session?.user?.email],
      queryFn: async () => {
        if (!session?.user?.email) return null;
        const { data, error } = await supabase
          .from("pengguna")
          .select("id")
          .eq("email", session.user.email)
          .single();
        if (error) return null;
        return data;
      },
      enabled: !!session?.user?.email,
    });

    const userId = userData?.id;

    // 2. Query Produk & Status Favorit
    const { data: products = [], isLoading, isError } = useQuery<Product[]>({
      queryKey: ["products", userId],
      queryFn: async () => {
        // Ambil semua produk
        const { data: productsData, error: prodError } = await supabase.from("produk").select("*");
        if (prodError) throw prodError;

        let favoriteIds: number[] = [];
        if (userId) {
          // Ambil daftar id_produk yang sudah difavoritkan user ini
          const { data: favData } = await supabase
            .from("favorit_produk")
            .select("id_produk")
            .eq("id_user", userId);
          favoriteIds = favData?.map(f => f.id_produk) || [];
        }

        return productsData.map((item: any) => ({
          id: item.id_produk,
          name: item.nama_produk,
          price: Number(item.harga),
          image: item.gambar_url,
          liked: favoriteIds.includes(item.id_produk),
        }));
      },
      // Re-fetch otomatis saat userId berhasil didapat
      enabled: status !== "loading", 
    });

    // 3. Mutation untuk Toggle Like (Insert/Delete)
    const toggleLikeMutation = useMutation({
      mutationFn: async ({ productId, isLiked }: { productId: number; isLiked: boolean }) => {
        if (!userId) throw new Error("Harus login");

        if (isLiked) {
          // Jika sudah liked, maka hapus (Unfavorite)
          const { error } = await supabase
            .from("favorit_produk")
            .delete()
            .eq("id_user", userId)
            .eq("id_produk", productId);
          if (error) throw error;
        } else {
          // Jika belum liked, maka tambah (Favorite)
          const { error } = await supabase
            .from("favorit_produk")
            .insert([{ id_user: userId, id_produk: productId }]);
          if (error) throw error;
        }
      },
      // Optimistic Update: Hati langsung merah/putih tanpa nunggu loading database
      onMutate: async ({ productId }) => {
        await queryClient.cancelQueries({ queryKey: ["products", userId] });
        const prev = queryClient.getQueryData(["products", userId]);

        queryClient.setQueryData(["products", userId], (old: any) =>
          old ? old.map((p: any) => (p.id === productId ? { ...p, liked: !p.liked } : p)) : []
        );

        return { prev };
      },
      onError: (_, __, ctx) => {
        queryClient.setQueryData(["products", userId], ctx?.prev);
        alert("Gagal memperbarui favorit.");
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["products", userId] });
      },
    });

    const handleToggleLike = (id: number) => {
      const prod = products.find(p => p.id === id);
      if (prod) toggleLikeMutation.mutate({ productId: id, isLiked: prod.liked });
    };

    const handleLogout = async () => {
      // Log out dari Supabase
      await supabase.auth.signOut();
      // Log out dari NextAuth (tanpa paksa reload biar router yang handle)
      await nextAuthSignOut({ redirect: false });
      
      router.push("/auth");
      router.refresh();
    };

    const nextBanner = () => setActiveBanner((i) => (i + 1) % banners.length);
    const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="dashboard-root">
        <nav className="navbar">
          <div className="nav-logo">
            <Image src="/images/logo.png" alt="Logo" width={48} height={48} style={{ borderRadius: "50%", objectFit: "contain" }} />
          </div>
          <div className="search-wrap">
            <input type="text" className="search-input" placeholder="Cari Produk..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <span className="search-icon-wrap"><SearchIcon /></span>
          </div>
          <div className="nav-actions">
            <Link href="/recipes" className="nav-link">
              <ChefHatIcon />
              <span className="nav-link-label">Resep</span>
            </Link>
            <Link href="/cart" className="nav-link">
              <CartIcon />
              <span className="nav-link-label">Keranjang</span>
            </Link>
            <div className="profile-dropdown-container">
              <div className="nav-link profile-trigger"><ProfileIcon /><span className="nav-link-label">Profil</span></div>
              <div className="dropdown-menu">
                <Link href="/profile" className="dropdown-item">Profil Saya</Link>
                <button onClick={handleLogout} className="dropdown-item">Keluar</button>
              </div>
            </div>
          </div>
        </nav>

        <section className="hero-text">
          <h1 className="welcome-title">SELAMAT DATANG!</h1>
          <p className="welcome-sub">Temukan Produk Pangan Terbaik Untukmu</p>
        </section>

        <section className="banner-section">
          <div className="banner-card" style={{ background: banners[activeBanner].bg.startsWith('url') ? `${banners[activeBanner].bg} center/cover no-repeat` : banners[activeBanner].bg }}>
            <div className="banner-content">
              <h2 className="banner-title">
                {banners[activeBanner].title.split('\n').map((line, idx) => (
                  <span key={idx} style={{ display: 'block' }}>{line}</span>
                ))}
              </h2>
              {banners[activeBanner].buttonText && (
                <Link href={banners[activeBanner].link || "#"}><button className="banner-cta-button">{banners[activeBanner].buttonText}</button></Link>
              )}
            </div>
            <button className="banner-arrow banner-arrow-right" onClick={nextBanner}><ChevronRight /></button>
          <div className="banner-dots">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`banner-dot ${index === activeBanner ? 'dot-active' : ''}`}
                onClick={() => setActiveBanner(index)} // Agar titik bisa diklik
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          </div>
        </section>

        <section className="products-section">
          {isLoading ? (
            <div className="products-grid">
            {[...Array(6)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
          ) : isError ? (
            <p>Terjadi kesalahan saat memuat data.</p>
          ) : (
            <div className="products-grid">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} onToggleLike={handleToggleLike} />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }