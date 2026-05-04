"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Search, Heart, Loader2, Clock, Utensils, ArrowRight } from "lucide-react";
import styles from "./FavoriteRecipes.module.css";

export default function FavoriteRecipesPage() {
    const [search, setSearch] = useState("");
    const { data: session } = useSession();
    const supabase = createClient();
    const queryClient = useQueryClient();

    // 1. Ambil Data User
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

    // 2. Ambil Data Resep Favorit
    const { data: favorites = [], isLoading } = useQuery({
        queryKey: ["favoriteRecipes", userId],
        queryFn: async () => {
            if (!userId) return [];
            
            const { data, error } = await supabase
                .from("favorit_resep")
                .select(`
                    id_fav, 
                    resep:id_resep (
                        id_resep, 
                        judul_resep, 
                        gambar_url, 
                        waktu_masak, 
                        kategori_jenis,
                        informasi_gizi,
                        deskripsi_singkat
                    )
                `)
                .eq("id_user", userId);

            if (error) throw error;

            return data
                .filter((fav: any) => fav.resep !== null) 
                .map((fav: any) => {
                    // Logic ambil kata pertama dari informasi_gizi (misal: "Kalori")
                    let tagGizi = "";
                    if (fav.resep.informasi_gizi) {
                        tagGizi = fav.resep.informasi_gizi.split(":")[0].trim();
                    }

                    return {
                        id_fav: fav.id_fav,
                        ...fav.resep,
                        tagGizi: tagGizi,
                        tagKategori: fav.resep.kategori_jenis
                    };
                });
        },
        enabled: !!userId,
    });

    // 3. Mutasi untuk Hapus Favorit
    const removeFavorite = useMutation({
        mutationFn: async (id_fav: number) => {
        const { error } = await supabase
            .from("favorit_resep")
            .delete()
            .eq("id_fav", id_fav);
        if (error) throw error;
        },
        onSuccess: () => {
        // Refresh data favorit secara otomatis tanpa reload halaman
        queryClient.invalidateQueries({ queryKey: ["favoriteRecipes", userId] });
        },
    });

    // 4. Logic Filter Pencarian
    const filteredRecipes = favorites.filter((r: any) =>
        r.judul_resep?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <main className="flex-1 p-12 bg-white min-h-screen">
            <div className={styles["recipe-container"]}>
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#062F24] tracking-tight">
                        Resep Favorit
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Kumpulan resep masakan yang kamu simpan</p>
                    </div>
                    <Link href="/DashboardProduct" className="text-[#064E3B] font-bold text-sm hover:underline flex items-center gap-2">
                        <span>← Kembali ke Toko</span>
                    </Link>
                </header>

                {/* Search Bar */}
                <div className="relative mb-10 max-w-md text-gray-500">
                <input
                    type="text"
                    placeholder="Cari resep"
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
                    <p className="text-gray-400 animate-pulse">Menyiapkan resep pilihanmu...</p>
                </div>
                ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-24 bg-[#fcfdfc] rounded-[40px] border-2 border-dashed border-gray-100">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Utensils className="text-gray-400 w-8 h-8" />
                    </div>
                    <p className="text-gray-500 font-medium text-lg">Belum ada resep yang ditemukan.</p>
                    <Link href="/recipes" className="text-[#2a8a3a] font-bold mt-2 inline-block hover:text-[#1f6e2b]">
                    Jelajahi ide masak baru →
                    </Link>
                </div>
                ) : (
                <div className={styles["recipes-grid"]}>
                    {filteredRecipes.map((recipe: any) => (
                    <div key={recipe.id_fav} className={styles["recipe-card"]}>
                        {/* Overlay Green Box */}
                        <div className={styles["recipe-overlay"]}>
                        <h3 className={styles["recipe-name"]}>{recipe.judul_resep}</h3>
                        <div className={styles["recipe-footer"]}>
                            <div className={styles["recipe-meta"]}>
                                {/* Tag 1: Waktu Masak */}
                                <div className={styles["meta-item"]}>
                                    <Clock className="w-3 h-3" />
                                    <span>{recipe.waktu_masak || "20"} min</span>
                                </div>

                                {/* Tag 2: Kategori Jenis (misal: Sayuran, Ayam, dll) */}
                                {recipe.tagKategori && (
                                    <span className={`${styles["category-tag"]} bg-white/20`}>
                                        {recipe.tagKategori}
                                    </span>
                                )}

                                {/* Tag 3: Info Gizi (misal: Kalori) */}
                                {recipe.tagGizi && (
                                    <span className={`${styles["category-tag"]} bg-white/20`}>
                                        {recipe.tagGizi}
                                    </span>
                                )}
                            </div>
                            <Link href={`/recipes/${recipe.id_resep}`} className={styles["more-btn"]}>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        </div>

                        {/* Main Image */}
                        <div className={styles["recipe-image-wrap"]}>
                        <img
                            src={recipe.gambar_url || "/placeholder.jpg"}
                            alt={recipe.judul_resep}
                            className={styles["recipe-image"]}
                        />
                        </div>

                        {/* Absolute Heart Button */}
                        <button
                        onClick={() => removeFavorite.mutate(recipe.id_fav)}
                        className={styles["recipe-like-btn"]}
                        disabled={removeFavorite.isPending}
                        >
                        <Heart className={`w-5 h-5 fill-white text-white ${removeFavorite.isPending ? 'opacity-50' : ''}`} />
                        </button>
                    </div>
                    ))}
                </div>
                )}
            </div>
        </main>
    );
}