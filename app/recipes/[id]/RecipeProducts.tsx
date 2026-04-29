"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID").replace(/\./g, ".");

interface Product {
  id_produk: number;
  nama_produk: string;
  deskripsi: string | null;
  harga: number;
  stok: number;
  gambar_url: string | null;
  is_promo: boolean;
  satuan_produk: number;
  unit_nama: string;
  takaran_resep: number;
}

export default function RecipeProducts({ products }: { products: Product[] }) {
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [isAddingBulk, setIsAddingBulk] = useState(false);

  if (!products || products.length === 0) {
    return null;
  }

  const handleBeliSemuaBahan = async () => {
    setIsAddingBulk(true);
    const payload = products.map((item) => {
      const quantity = Math.ceil(item.takaran_resep / (item.satuan_produk || 1));
      return {
        id_produk: item.id_produk,
        jumlah: quantity,
      };
    });

    try {
      const response = await fetch('/api/cart/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      });
      
      if(response.ok) {
         alert("Semua bahan berhasil dimasukkan ke keranjang!");
      } else {
         alert("Gagal menambahkan bahan ke keranjang.");
      }
    } catch (error) {
      console.error("Gagal nambah ke keranjang", error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsAddingBulk(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    setAddingId(product.id_produk);
    try {
      const quantity = Math.ceil(product.takaran_resep / (product.satuan_produk || 1));
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_produk: product.id_produk, quantity })
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
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <p className="recipe-products-subtitle" style={{ margin: 0 }}>
          Beli bahan-bahan segar langsung dari Panganesia untuk resep ini.
        </p>
        <button 
          onClick={handleBeliSemuaBahan} 
          disabled={isAddingBulk}
          className="recipe-add-cart-btn"
          style={{ width: "auto", padding: "0.5rem 1rem", margin: 0, fontWeight: "bold" }}
        >
          {isAddingBulk ? "Memproses..." : "+ Beli Semua Bahan"}
        </button>
      </div>

      <div className="recipe-products-grid">
        {products.map((product) => {
          const isAdded = addedIds.has(product.id_produk);
          const isAdding = addingId === product.id_produk;

          return (
            <div key={product.id_produk} className="recipe-product-card">
              <Link href={`/product/${product.id_produk}`} className="recipe-product-image-link">
                <div className="recipe-product-image-wrapper">
                  <Image
                    src={product.gambar_url || "/images/placeholder.jpg"}
                    alt={product.nama_produk}
                    fill
                    className="recipe-product-image"
                    style={{ objectFit: "cover" }}
                  />
                  {product.is_promo && <span className="promo-badge">PROMO</span>}
                  {product.stok <= 0 && <span className="out-of-stock-badge">Habis</span>}
                </div>
              </Link>
              
              <div className="recipe-product-info">
                <Link href={`/product/${product.id_produk}`}>
                  <h3 className="recipe-product-name" title={product.nama_produk}>
                    {product.nama_produk}
                  </h3>
                </Link>
                <div className="recipe-product-price-row" style={{ marginBottom: "0.25rem" }}>
                  <span className="recipe-product-price">
                    {formatRupiah(Number(product.harga))}
                  </span>
                </div>
                
                <div className="recipe-product-qty-info" style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.75rem", lineHeight: "1.3" }}>
                  <strong>Butuh:</strong> {product.takaran_resep} {product.unit_nama} <br/>
                  <span style={{ fontSize: "0.75rem" }}>
                    (Beli {Math.ceil(product.takaran_resep / (product.satuan_produk || 1))} x {product.satuan_produk} {product.unit_nama})
                  </span>
                </div>
                
                <button
                  className={`recipe-add-cart-btn ${isAdded ? "added" : ""}`}
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stok <= 0 || isAdding || isAdded}
                >
                  {isAdding ? "Menambahkan..." : isAdded ? "✓ Ditambahkan" : "Beli Bahan"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
