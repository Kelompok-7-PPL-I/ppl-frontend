"use client";

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FavoriteProductsPage() {
    const supabase = createClient();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                console.log("Tidak ada session user");
                setLoading(false);
                return;
            }

            // 1. Ambil ID user dari tabel pengguna
            const { data: userData, error: userError } = await supabase
                .from('pengguna')
                .select('id')
                .eq('email', user.email)
                .single();

            if (userError || !userData) {
                console.error("User tidak ditemukan di tabel pengguna:", userError);
                setLoading(false);
                return;
            }

            const localId = userData.id;
            console.log("Mencari favorit untuk ID Lokal:", localId);

            // 2. Ambil data favorit (Gunakan '*' dulu untuk memastikan data narik)
            const { data, error: favError } = await supabase
                .from('favorit_produk')
                .select(`
                    id_fav,
                    produk:id_produk (
                        id_produk,
                        nama_produk,
                        harga,
                        gambar_url
                    )
                `)
                .eq('id_user', userData.id);

            if (favError) {
                console.error("Error saat ambil tabel favorit:", favError.message);
            } else {
                console.log("Hasil Akhir Data Favorit:", data);
                setFavorites(data || []);
            }
        } catch (err) {
            console.error("System Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [supabase]);

    const handleRemoveFavorite = async (id_fav: number) => {
        // 1. Cek apakah user masih login
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            alert("Silakan login terlebih dahulu");
            return;
        }

        // 2. Eksekusi hapus di database Supabase
        // Pastikan nama tabelnya 'favorit_produk' dan kolom ID-nya adalah 'id'
        const { error } = await supabase
            .from('favorit_produk')
            .delete()
            .eq('id_fav', id_fav);

        if (error) {
            console.error("Gagal menghapus favorit:", error.message);
            alert("Gagal menghapus dari favorit");
        } else {
            // 3. Update tampilan secara langsung (Optimistic Update)
            // Kita filter state 'favorites' agar item yang dihapus langsung hilang dari layar
            setFavorites((prev) => prev.filter((item: any) => item.id_fav !== id_fav));
            
            // Opsional: tampilkan toast atau notifikasi kecil
            console.log("Berhasil dihapus!");
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-[#064E3B]">Memuat Produk Favorit...</div>;

    return (
        <main className="flex-1 p-10 w-full bg-gray-50">
            <header className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-extrabold text-gray-800">Produk Favorit</h1>
                <Link href="/DashboardProduct" className="text-[#064E3B] font-bold text-sm hover:underline">
                    ← Kembali ke Toko
                </Link>
            </header>

            {favorites.length === 0 ? (
                <div className="bg-white p-20 rounded-3xl border border-dashed border-gray-200 text-center">
                    <p className="text-gray-400 font-medium">Belum ada produk favorit.</p>
                    <Link href="/DashboardProduct" className="text-[#064E3B] font-bold text-sm mt-2 inline-block underline">
                        Cari produk sekarang
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {favorites.map((item) => {
                        // Supabase join terkadang mengembalikan objek, terkadang array isi 1 objek
                        const p = Array.isArray(item.produk) ? item.produk[0] : item.produk;

                        if (!p) return null; // Jika data produk tidak ditemukan, jangan tampilkan apa-apa

                        return (
                            <div key={item.id_fav} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group">
                                <div className="relative h-56 w-full bg-gray-100">
                                    <img 
                                        src={item.produk?.gambar_url || "/placeholder.jpg"} 
                                        alt={item.produk?.nama_produk}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() => handleRemoveFavorite(item.id_fav)}
                                        className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
                                        <HeartIcon filled={true} />
                                    </button>
                                </div>
                                <div className="p-6 flex flex-col">
                                    <h3 className="font-bold text-gray-800 text-lg mb-1">{p.nama_produk}</h3>
                                    <p className="text-[#064E3B] font-black text-lg mb-6">
                                        Rp {p.harga?.toLocaleString('id-ID')}
                                    </p>
                                    <Link 
                                        href={`/product/${p.id_produk}`}
                                        className="w-full py-3 bg-[#064E3B] text-white rounded-xl text-center text-sm font-bold"
                                    >
                                        Beli Sekarang
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill={filled ? "#e53935" : "none"} 
    stroke={filled ? "#e53935" : "#aaa"} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);