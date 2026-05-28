"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Search, ShoppingBag, Heart, Loader2 } from "lucide-react";
import styles from "./FavoriteProducts.module.css";

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID").replace(/\./g, ".");

export default function FavoriteProductsPage() {
  const [search, setSearch] = useState("");
  const { data: session } = useSession();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ["currentUser", session?.user?.email],
    queryFn: async () => {
      if (!session?.user?.email) return null;
      const { data, error } = await supabase
        .from("pengguna")
        .select("id")
        .eq("email", session.user.email)
        .single();
      return error ? null : data;
    },
    enabled: !!session?.user?.email,
  });

  const userId = userData?.id;

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("favorit_produk")
        .select(`id_fav, produk:id_produk (id_produk, nama_produk, harga, gambar_url, satuan_produk, unit_nama)`)
        .eq("id_user", userId);
      if (error) throw error;
      return data.map((fav: any) => ({ id_fav: fav.id_fav, ...fav.produk }));
    },
    enabled: !!userId,
  });

  const removeFavorite = useMutation({
    mutationFn: async (id_fav: number) => {
      await supabase.from("favorit_produk").delete().eq("id_fav", id_fav);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
      queryClient.invalidateQueries({ queryKey: ["products", userId] });
    },
  });

  const filteredProducts = favorites.filter((p: any) =>
    p.nama_produk.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 p-12 bg-white min-h-screen">
      <div className={styles["favorite-container"]}>
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-[#062F24] tracking-tight">
              Produk Favorit
            </h1>
            <p className="text-gray-500 text-sm mt-1">Kumpulan produk yang kamu sukai dari toko kami</p>
          </div>
          <Link href="/DashboardProduct" className="text-[#064E3B] font-bold text-sm hover:underline flex items-center gap-2">
            <span>← Kembali ke Toko</span>
          </Link>
        </header>

        {/* Search Bar */}
        <div className="relative mb-10 max-w-md text-gray-500">
          <input
            type="text"
            placeholder="Cari produk"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3.5 px-6 pl-12 bg-[#f2f3f5] rounded-full text-sm outline-none focus:bg-[#e8eaed] transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#2a8a3a] mb-4" />
            <p className="text-gray-400 animate-pulse">Memuat produk favoritmu...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-[#fcfdfc] rounded-[40px] border-2 border-dashed border-gray-100">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              {/* Pakai ShoppingBag karena ini konteksnya produk/belanja */}
              <ShoppingBag className="text-gray-400 w-8 h-8" />
            </div>
            <p className="text-gray-500 font-medium text-lg">Belum ada produk favorit yang ditemukan.</p>
            <Link href="/DashboardProduct" className="text-[#2a8a3a] font-bold mt-2 inline-block hover:text-[#1f6e2b]">
              Mulai belanja sekarang →
            </Link>
          </div>
        ) : (
          <div className={styles["products-grid"]}>
            {filteredProducts.map((product: any) => (
              <div key={product.id_fav} className={styles["product-card"]}>
                <div className={styles["card-image-wrap"]}>
                  <img src={product.gambar_url || "/placeholder.jpg"} alt={product.nama_produk} className={styles["card-image"]} />
                  <button onClick={() => removeFavorite.mutate(product.id_fav)} className={styles["like-btn"]} disabled={removeFavorite.isPending}>
                    <Heart className={`w-5 h-5 fill-white text-white ${removeFavorite.isPending ? 'opacity-50' : ''}`} />
                  </button>
                </div>
                <div className={styles["card-body"]}>
                  <h3 className={styles["card-name"]}>{product.nama_produk}</h3>
                  <p className={styles["card-price"]}>{formatRupiah(product.harga)} / {product.satuan_produk} {product.unit_nama}</p>
                  <div className={styles["card-actions"]}>
                    <Link href={`/product/${product.id_produk}`} className={styles["btn-detail"]}>Detail</Link>
                    <Link href="/checkout" className={styles["btn-buy"]}>Beli Sekarang</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}