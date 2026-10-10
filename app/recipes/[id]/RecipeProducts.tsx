"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/app/context/ToastContext"; 
import { useSession } from "next-auth/react";

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
  const { toast } = useToast();
  const { data: session } = useSession();

  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [isKeranjangBulk, setIsKeranjangBulk] = useState(false);
  const [isBuyingBulk, setIsBuyingBulk] = useState(false);

  if (!products || products.length === 0) {
    return null;
  }

  const handleKeranjangkanBahan = async () => {
    setIsKeranjangBulk(true);

    try {
      const payloadItems = products
        .filter((item) => item.stok > 0)
        .map((item) => {
          const { quantity } = getPurchasePlan(item);
          return {
            id_produk: item.id_produk,
            jumlah: quantity,
          };
        });

      if (payloadItems.length === 0) {
        toast.danger("Tidak ada bahan yang tersedia untuk dibeli.");
        setIsKeranjangBulk(false);
        return;
      }

      const res = await fetch("/api/cart/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });

      if (res.ok) {
        toast.success("Semua bahan berhasil dimasukkan ke keranjang!");
      } else {
        toast.danger ("Gagal menambahkan ke keranjang. Pastikan Anda sudah login.");
      }
    } catch (error) {
      console.error("Gagal tambah ke keranjang:", error);
      toast.danger("Terjadi kesalahan sistem.");
    } finally {
      setIsKeranjangBulk(false);
    }
  };

  const handleBeliSemuaBahan = async () => {
    setIsBuyingBulk(true);

    try {
      const payloadItems = products
        .filter((item) => item.stok > 0)
        .map((item) => {
          const { quantity } = getPurchasePlan(item);
          return {
            id_produk: item.id_produk,
            id: item.id_produk,
            name: item.nama_produk,
            price: item.harga,
            quantity,
            image: item.gambar_url,
          };
        });

      if (payloadItems.length === 0) {
        toast.danger("Tidak ada bahan yang tersedia untuk dibeli.");
        return;
      }

      sessionStorage.setItem("recipeItems", JSON.stringify(payloadItems.map(item => ({
        ...item,
        id: item.id_produk,        // pastikan id = id_produk
        id_produk: item.id_produk, // kirim keduanya
      }))));
      router.push("/checkout?mode=recipe-checkout");
    } catch (error) {
      console.error("Gagal redirect ke checkout:", error);
      toast.danger("Terjadi kesalahan sistem.");
    } finally {
      setIsBuyingBulk(false);
    }
  };

  const [buyingId, setBuyingId] = useState<number | null>(null);

  const handleBeliBahan = (product: Product) => {
    setBuyingId(product.id_produk);
    const { quantity } = getPurchasePlan(product);

    const item = {
      id: product.id_produk,
      id_produk: product.id_produk,
      name: product.nama_produk,
      price: product.harga,
      quantity,
      image: product.gambar_url,
    };

    sessionStorage.setItem("recipeItems", JSON.stringify([item]));
    router.push("/checkout?mode=recipe-checkout");
    // buyingId tidak perlu di-reset karena langsung redirect
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
        toast.danger("Gagal menambahkan ke keranjang. Pastikan Anda sudah login.");
      }
    } catch (err) {
      console.error(err);
      toast.danger("Terjadi kesalahan sistem.");
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

        <div className="button-group" style={{ display: "flex", gap: "0.5rem" }}>

        <button
          onClick={handleKeranjangkanBahan}
          disabled={isKeranjangBulk}
          className="recipe-add-cart-btn"
          style={{
            width: "auto",
            padding: "0.5rem 1rem",
            margin: 0,
            fontWeight: "bold",
          }}
        >
          {isKeranjangBulk ? "Mengarahkan..." : "+ Masukkan Semua ke Keranjang"}
        </button>

        <button
          onClick={handleBeliSemuaBahan}
          disabled={isBuyingBulk}
          className="recipe-buy-now-btn"
          style={{
            width: "auto",
            padding: "0.5rem 1rem",
            margin: 0,
            fontWeight: "bold",
          }}
        >
          {isBuyingBulk ? "Mengarahkan..." : "+ Beli Semua Bahan"}
        </button>
      </div>
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

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {/* Masukkan ke Keranjang — outline */}
                  <button
                    className="recipe-add-cart-btn"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stok <= 0 || isAdding || isAdded}
                    style={{ width: "100%", padding: "0.6rem 0" }}
                  >
                    {isAdding
                      ? "Menambahkan..."
                      : isAdded
                      ? "✓ Ditambahkan"
                      : "🛒 Keranjang"}
                  </button>

                  {/* Beli Bahan — solid */}
                  <button
                    className="recipe-buy-now-btn"
                    onClick={() => handleBeliBahan(product)}
                    disabled={product.stok <= 0 || buyingId === product.id_produk}
                    style={{ width: "100%", padding: "0.6rem 0" }}
                  >
                    {buyingId === product.id_produk ? "Mengarahkan..." : "Beli Bahan"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}