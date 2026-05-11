"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID").replace(/\./g, ".");

const formatTakaran = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString("id-ID");
};

interface Product {
  id_produk: number;
  nama_produk: string;
  deskripsi: string | null;
  harga: number;
  stok: number;
  gambar_url: string | null;
  is_promo: boolean;
  satuan_produk: number | null;
  unit_nama: string;
  takaran_resep: number;
}

const getPurchasePlan = (product: Product) => {
  const takaranResep = Number(product.takaran_resep) || 0;
  const satuanProduk = Number(product.satuan_produk) || 0;

  if (satuanProduk > 1) {
    return {
      quantity: Math.max(1, Math.ceil(takaranResep / satuanProduk)),
      satuanDisplay: satuanProduk,
    };
  }

  return {
    quantity: 1,
    satuanDisplay: takaranResep,
  };
};

export default function RecipeProducts({ products }: { products: Product[] }) {
  const router = useRouter();

  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [isAddingBulk, setIsAddingBulk] = useState(false);

  if (!products || products.length === 0) {
    return null;
  }

  const handleBeliSemuaBahan = () => {
    setIsAddingBulk(true);

    try {
      const checkoutItems = products
        .filter((item) => item.stok > 0)
        .map((item) => {
          const { quantity } = getPurchasePlan(item);

          return {
            id: item.id_produk,
            id_produk: item.id_produk,
            name: item.nama_produk,
            price: Number(item.harga),
            quantity,
            image: item.gambar_url || "/images/placeholder.jpg",
          };
        });

      if (checkoutItems.length === 0) {
        alert("Tidak ada bahan yang tersedia untuk dibeli.");
        setIsAddingBulk(false);
        return;
      }

      sessionStorage.setItem("buyNowItem", JSON.stringify(checkoutItems));
      router.push("/checkout?mode=buy-now");
    } catch (error) {
      console.error("Gagal checkout bahan resep:", error);
      alert("Terjadi kesalahan sistem.");
      setIsAddingBulk(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    setAddingId(product.id_produk);

    try {
      const { quantity } = getPurchasePlan(product);

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_produk: product.id_produk,
          quantity,
        }),
      });

      if (res.ok) {
        setAddedIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(product.id_produk);
          return newSet;
        });

        setTimeout(() => {
          setAddedIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(product.id_produk);
            return newSet;
          });
        }, 2000);
      } else {
        alert("Gagal menambahkan ke keranjang. Pastikan Anda sudah login.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section className="content-section recipe-products-section">
      <div className="section-header">
        <div className="line-divider"></div>
        <h2>BAHAN YANG DIBUTUHKAN</h2>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <p className="recipe-products-subtitle" style={{ margin: 0 }}>
          Beli bahan-bahan segar langsung dari Panganesia untuk resep ini.
        </p>

        <button
          onClick={handleBeliSemuaBahan}
          disabled={isAddingBulk}
          className="recipe-add-cart-btn"
          style={{
            width: "auto",
            padding: "0.5rem 1rem",
            margin: 0,
            fontWeight: "bold",
          }}
        >
          {isAddingBulk ? "Mengarahkan..." : "+ Beli Semua Bahan"}
        </button>
      </div>

      <div className="recipe-products-grid">
        {products.map((product) => {
          const isAdded = addedIds.has(product.id_produk);
          const isAdding = addingId === product.id_produk;
          const { quantity, satuanDisplay } = getPurchasePlan(product);

          return (
            <div key={product.id_produk} className="recipe-product-card">
              <Link
                href={`/product/${product.id_produk}`}
                className="recipe-product-image-link"
              >
                <div className="recipe-product-image-wrapper">
                  <Image
                    src={product.gambar_url || "/images/placeholder.jpg"}
                    alt={product.nama_produk}
                    fill
                    className="recipe-product-image"
                    style={{ objectFit: "cover" }}
                  />

                  {product.is_promo && (
                    <span className="promo-badge">PROMO</span>
                  )}

                  {product.stok <= 0 && (
                    <span className="out-of-stock-badge">Habis</span>
                  )}
                </div>
              </Link>

              <div className="recipe-product-info">
                <Link href={`/product/${product.id_produk}`}>
                  <h3
                    className="recipe-product-name"
                    title={product.nama_produk}
                  >
                    {product.nama_produk}
                  </h3>
                </Link>

                <div
                  className="recipe-product-price-row"
                  style={{ marginBottom: "0.25rem" }}
                >
                  <span className="recipe-product-price">
                    {formatRupiah(Number(product.harga))}
                  </span>
                </div>

                <div
                  className="recipe-product-qty-info"
                  style={{
                    fontSize: "0.8rem",
                    color: "#666",
                    marginBottom: "0.75rem",
                    lineHeight: "1.3",
                  }}
                >
                  <strong>Butuh:</strong>{" "}
                  {formatTakaran(Number(product.takaran_resep) || 0)}{" "}
                  {product.unit_nama}
                  <br />
                  <span style={{ fontSize: "0.75rem" }}>
                    (Beli {quantity} x {formatTakaran(satuanDisplay)}{" "}
                    {product.unit_nama})
                  </span>
                </div>

                <button
                  className={`recipe-add-cart-btn ${isAdded ? "added" : ""}`}
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stok <= 0 || isAdding || isAdded}
                >
                  {isAdding
                    ? "Menambahkan..."
                    : isAdded
                    ? "✓ Ditambahkan"
                    : "Beli Bahan"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}