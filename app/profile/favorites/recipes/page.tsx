"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client'; // Pastikan path ini benar

// Komponen Icon Hati
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#e53935" : "none"} stroke={filled ? "#e53935" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default function FavoriteRecipesPage() {
  const [favoriteRecipes, setFavoriteRecipes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchFavoriteRecipes = async () => {
      // 1. Cek User
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // 2. Ambil ID User dari tabel pengguna
      const { data: userData } = await supabase
        .from('pengguna')
        .select('id')
        .eq('email', user.email)
        .single();

      if (userData) {
        // 3. Ambil data favorit_resep join dengan tabel resep
        const { data, error } = await supabase
          .from('favorit_resep')
          .select(`
            id_fav,
            resep (
              id_resep,
              judul_resep,
              deskripsi_singkat,
              gambar_url
            )
          `)
          .eq('id_user', userData.id);

        if (data) {
          setFavoriteRecipes(data);
        }
      }
      setIsLoading(false);
    };

    fetchFavoriteRecipes();
  }, [router, supabase]);

  const handleRemoveFavorite = async (id_fav: number) => {
        // 1. Debug: Pastikan ID tidak undefined
        console.log("Menghapus favorit dengan ID:", id_fav);

        if (!id_fav) {
            console.error("Error: id_fav tidak terbaca!");
            return;
        }

        // 2. Eksekusi hapus di database
        const { error } = await supabase
            .from('favorit_resep')
            .delete()
            .eq('id_fav', id_fav); // Pakai 'id_fav' sesuai kolom di DB kamu

        if (!error) {
            // 3. Update UI secara instan (Optimistic Update)
            // Pastikan pengecekan di filter juga menggunakan id_fav
            setFavoriteRecipes((prev) => prev.filter((item) => item.id_fav !== id_fav));
            console.log("Berhasil dihapus!");
        } else {
            console.error("Gagal hapus di database:", error.message);
            alert("Gagal menghapus: " + error.message);
        }
    };

  return (
    <main className="flex-1 p-10 w-full">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-extrabold text-gray-800">Resep Favorit</h1>
        <Link href="/DashboardProduct" className="text-[#064E3B] font-bold text-sm hover:underline">
          ← Kembali ke Toko
        </Link>
      </header>

      {favoriteRecipes.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
           <p className="text-gray-500 text-lg">Belum ada resep favorit.</p>
           <Link href="/recipes" className="text-green-700 font-bold mt-2 inline-block hover:underline">Cari resep yuk!</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {favoriteRecipes.map((item) => (
            <div key={item.id_fav} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center hover:shadow-md transition-shadow relative">
              <div className="w-24 h-24 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                <img 
                  src={item.resep?.gambar_url || "/placeholder.jpg"} 
                  alt={item.resep?.judul_resep} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{item.resep?.judul_resep}</h3>
                    <button onClick={() => handleRemoveFavorite(item.id_fav)}>
                    <HeartIcon filled={true} />
                    </button>
                </div>
                <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                  {item.resep?.deskripsi || "Resep masakan lezat dan mudah dibuat..."}
                </p>
                <Link 
                  href={`/recipes/${item.resep?.id_resep}`} 
                  className="text-[#064E3B] text-sm font-bold hover:underline"
                >
                  Lihat Resep →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}