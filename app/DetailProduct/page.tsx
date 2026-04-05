"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./page.css";

const thumbnails = [
  "/images/corn-1.jpg",
  "/images/corn-2.jpg",
  "/images/corn-3.jpg",
  "/images/corn-4.jpg",
  "/images/corn-5.jpg",
  "/images/corn-6.jpg",
];

export default function DetailProduct() {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const visibleThumbs = thumbnails.slice(startIndex, startIndex + 3);
  const extraCount = thumbnails.length - (startIndex + 3);

  const handleDecrease = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity((q) => q + 1);

  const handleNext = () => {
  if (activeImage < thumbnails.length - 1) {
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
            <Image
              src={thumbnails[activeImage]}
              alt="Jagung Manis"
              fill
              sizes="(max-width: 768px) 100vw, 440px"
              className="main-image"
              style={{ objectFit: "cover" }}
              priority
            />
            <button className="arrow right" onClick={handleNext}>
              {">"}
            </button>
          </div>

          <div className="thumbnails-row">
            {visibleThumbs.map((src, i) => (
              <button
                key={i}
                className={`thumb-btn ${activeImage === startIndex + i ? "thumb-active" : ""}`}
                onClick={() => setActiveImage(startIndex + i)}
              >
                <Image
                  src={src}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  sizes="96px"
                  style={{ objectFit: "cover" }}
                  className="thumb-img"
                />
              </button>
            ))}
            {extraCount > 0 && (
              <button
                className="thumb-btn thumb-extra"
                onClick={() => {
                  setStartIndex(startIndex + 3);
                  setActiveImage(startIndex + 3);
                }}
              >
                <span className="extra-label">+{extraCount}</span>
              </button>
            )}
          </div>
        </section>

        {/* Right: Product Info */}
        <section className="info-section">
          <h1 className="product-name">Jagung Manis</h1>
          <p className="product-price">Rp 10.000</p>

          <div className="description-box">
            <p className="description-text">
              Jagung manis segar pilihan langsung dari kebun petani lokal.
              Dipanen pada pagi hari untuk menjaga kesegaran dan kadar gula
              alaminya. Cocok untuk direbus, dibakar, atau diolah menjadi
              berbagai hidangan lezat. Tekstur renyah dan manis alami tanpa
              tambahan bahan pengawet.
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
              {addedToCart ? "✓ Added!" : "Add To Cart"}
            </button>
          </div>

          <button className="buy-now-btn">Buy Now</button>
        </section>
      </main>
    </div>
  );
}