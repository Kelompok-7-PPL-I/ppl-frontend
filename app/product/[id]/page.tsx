"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";
import Link from "next/link";
import "./page.css";

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID").replace(/\./g, ".");

export default function DetailProduct() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const { toast } = useToast(); 
  console.log(id);

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
  const fetchProductAndReviews = async () => {
    const { data: productData, error: productError } = await supabase
      .from("produk")
      .select("*")
      .eq("id_produk", id)
      .single();

    if (productData) {
      setProduct({
        id: productData.id_produk,
        name: productData.nama_produk,
        price: Number(productData.harga),
        images: productData.gambar_url ? [productData.gambar_url] : [],
        desc: productData.deskripsi,
      });
    }

    if (productError) {
      console.error(productError);
    }

    const { data: reviewData, error: reviewError } = await supabase
      .from("ulasan")
      .select(`
        id_ulasan,
        rating,
        komentar,
        tanggal_ulasan,
        is_anonim,
        pengguna ( nama )
      `)
      .eq("id_produk", id)
      .order("tanggal_ulasan", { ascending: false });

    if (reviewData) {
      setReviews(reviewData);
    }
  };

  if (id) fetchProductAndReviews();
}, [id]);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const images = product?.images ?? [];
  const visibleThumbs = images.slice(0, 3);
  const extraCount = images.length - 3;

  // Extract weight unit from description (e.g., "Per 1 kg - ..." -> "1 kg")
  const descPrefix = product?.desc?.split(" - ")[0] || "";
  const unitText = descPrefix.replace(/^Per\s+/i, "");

  const handleDecrease = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity((q) => q + 1);

  const handleNext = () => {
  if (activeImage < images.length - 1) {
    const newIndex = activeImage + 1;
    setActiveImage(newIndex);

    // geser thumbnail kalau keluar range
    if (newIndex >= startIndex + 3) {
      setStartIndex((prev) => prev + 1);
    }
  }
};

const handlePrev = () => {
  if (activeImage > 0) {
    const newIndex = activeImage - 1;
    setActiveImage(newIndex);

    if (newIndex < startIndex) {
      setStartIndex((prev) => prev - 1);
    }
  }
};

  const handleAddToCart = async () => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_produk: product.id, quantity })
      });
      if (res.ok) {
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
      } else {
        toast.danger("Gagal menambahkan ke keranjang. Pastikan Anda sudah login.");
      }
    } catch (err) {
      console.error(err);
      toast.danger("Terjadi kesalahan sistem.");
    }
  };

  const handleBuyNow = () => {
  sessionStorage.setItem(
    "buyNowItem",
    JSON.stringify({
      id: product.id_produk,
      name: product.nama_produk,
      price: Number(product.harga),
      quantity: quantity || 1,
      image: product.gambar_url,
    })
  );

  router.push("/checkout?mode=buy-now");
};
  
if (!product) {
  return (
    <div className="detail-root">
      <header className="detail-header skeleton-header">
        <div className="skeleton skeleton-logo"></div>
      </header>
      <main className="detail-main">
        <section className="gallery-section">
          <div className="main-image-wrap skeleton"></div>
          <div className="thumbnails-row">
            <div className="thumb-btn skeleton"></div>
            <div className="thumb-btn skeleton"></div>
            <div className="thumb-btn skeleton"></div>
          </div>
        </section>
        <section className="info-section">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-price"></div>
          <div className="skeleton skeleton-desc"></div>
          <div className="skeleton skeleton-desc"></div>
          <div className="skeleton skeleton-button"></div>
        </section>
      </main>
    </div>
  );
}

  return (
    <div className="detail-root">
      {/* Header */}
      <header className="detail-header">
        <div className="logo-wrap">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={52}
            height={52}
            className="logo-img"
            priority
          />
        </div>
        <button className="back-btn" onClick={() => router.back()}>
          ← Kembali
        </button>
      </header>

      {/* Main Content */}
      <main className="detail-main">
        {/* Left: Image Gallery */}
        <section className="gallery-section">
          <div className="main-image-wrap">
            <button className="arrow left" onClick={handlePrev}>
              {"<"}
            </button>

            {product.images.length > 0 ? (
              <Image
                src={product.images[activeImage]}
                alt={product.name}
                fill
                className="main-image"
                style={{ objectFit: "cover" }}
                priority
              />
            ) : (
              <div className="no-image">No Image</div>
            )}

            <button className="arrow right" onClick={handleNext}>
              {">"}
            </button>
          </div>

          <div className="thumbnails-row">
            {visibleThumbs.map((src: string, i: number) => (
              <button
                key={i}
                className={`thumb-btn ${activeImage === i ? "thumb-active" : ""}`}
                onClick={() => setActiveImage(i)}
              >
                <Image
                  src={src}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  className="thumb-img"
                />
              </button>
            ))}

            {extraCount > 0 && (
              <div className="thumb-extra">
                +{extraCount}
              </div>
            )}
          </div>
        </section>

        {/* Right: Product Info */}
        <section className="info-section">
          <h1 className="product-name">{product.name}</h1>
          <p className="product-price">{formatRupiah(product.price)}</p>

          <div className="description-box">
            <p className="description-text">
              {product.desc}
            </p>
          </div>

          <div className="action-row">
            <div className="qty-control">
              <button className="qty-btn" onClick={handleDecrease}>
                −
              </button>
              <span className="qty-value">{quantity}</span>
              <button className="qty-btn" onClick={handleIncrease}>
                +
              </button>
            </div>
            {unitText && (
              <span className="weight-unit" style={{ marginLeft: '12px', fontSize: '1rem', color: '#666', alignSelf: 'center', fontWeight: 500 }}>
                ({unitText})
              </span>
            )}

            <button
              className={`add-cart-btn ${addedToCart ? "Ditambahkan" : ""}`}
              onClick={handleAddToCart}
            >
              {addedToCart ? "✓ Ditambahkan!" : "Tambah ke Keranjang"}
            </button>
          </div>
          <button
            className="buy-now-btn"
            onClick={() => {
              try {
                sessionStorage.setItem(
                  "buyNowItem",
                  JSON.stringify({
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    quantity: quantity,
                    image: product.image,
                  })
                );

                router.push("/checkout?mode=buy-now");
              } catch (err) {
                console.error(err);
                toast.danger("Terjadi kesalahan sistem.");
              }
            }}
          >
            Beli Sekarang
          </button>
        </section>
      </main>

      {/* Reviews Section */}
      <section className="reviews-section" style={{ maxWidth: 1100, margin: '40px auto', padding: '0 80px' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#1a1a1a' }}>
          Ulasan Produk
        </h2>
        {reviews.length > 0 ? (
          <div className="reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reviews.map((r: any) => (
              <div key={r.id_ulasan} style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#f9f9f9', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <strong style={{ fontSize: 16, color: '#1a1a1a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {r.is_anonim ? 'Pengguna Anonim' : (r.pengguna?.nama || 'Pengguna Tanpa Nama')}
                  </strong>
                  <span style={{ fontSize: 13, color: '#888' }}>
                    {new Date(r.tanggal_ulasan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div style={{ marginBottom: 12, color: '#f5c800', fontSize: 18, letterSpacing: '2px' }}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </div>
                <p style={{ margin: 0, fontSize: 15, color: '#444', lineHeight: 1.6 }}>
                  {r.komentar || <span style={{ fontStyle: 'italic', color: '#999' }}>Tidak ada komentar tulisan.</span>}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '16px', border: '1px dashed #ccc' }}>
            <p style={{ color: '#888', margin: 0, fontSize: 15 }}>Belum ada ulasan untuk produk ini. Jadilah yang pertama memberikan ulasan!</p>
          </div>
        )}
      </section>
    </div>
  );
}