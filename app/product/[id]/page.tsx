"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import "./page.css";

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID").replace(/\./g, ".");

export default function DetailProduct() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  console.log(id);

  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from("produk")
      .select("*")
      .eq("id_produk", id)
      .single();

    if (data) {
      setProduct({
        id: data.id_produk,
        name: data.nama_produk,
        price: Number(data.harga),
        images: data.gambar_url ? [data.gambar_url] : [],
        desc: data.deskripsi,
      });
    }

    if (error) {
      console.error(error);
    }
  };

  if (id) fetchProduct();
}, [id]);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const images = product?.images ?? [];
  const visibleThumbs = images.slice(0, 3);
  const extraCount = images.length - 3;

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

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
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
          ← Back
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

            <button
              className={`add-cart-btn ${addedToCart ? "added" : ""}`}
              onClick={handleAddToCart}
            >
              {addedToCart ? "✓ Added!" : "Tambahkan Ke Keranjang"}
            </button>
          </div>
          <Link href="/checkout" className="buy-now-btn">
            Beli Sekarang
          </Link>
        </section>
      </main>
    </div>
  );
}