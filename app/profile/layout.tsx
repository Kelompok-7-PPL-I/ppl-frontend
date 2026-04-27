"use client";

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function ProfileLayout({
  children, // Ini adalah "lubang" tempat page.tsx akan dimasukkan
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname(); // Untuk mendeteksi URL saat ini
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      // GANTI: Ambil session langsung dari Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (user) {
        // Ambil data profil dari tabel 'pengguna' berdasarkan ID atau Email
        const { data } = await supabase
          .from('pengguna')
          .select('*')
          .eq('email', user.email)
          .single();
        setProfile(data);
      } else {
        // Jika tidak ada session, tendang ke halaman login
        router.push('/auth');
      }
    };
    fetchProfile();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth'); // Redirect ke halaman auth
    router.refresh();
  };

  // Fungsi pintar untuk mengubah warna menu secara otomatis
  const navClass = (path: string) => {
    return pathname === path 
      ? "block px-4 py-3 bg-white text-[#064E3B] rounded-full font-bold text-sm" // Sedang aktif
      : "block px-4 py-3 hover:bg-green-800 rounded-full font-bold text-sm transition text-white"; // Tidak aktif
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* SIDEBAR CUKUP DITULIS 1 KALI DI SINI */}
      <aside className="w-64 bg-[#064E3B] text-white flex flex-col shrink-0">
        <div className="p-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#064E3B] text-2xl font-bold mb-4 mx-auto">
            {profile?.nama?.charAt(0).toUpperCase() || 'U'}
          </div>
          <p className="text-center font-bold text-sm mb-8">{profile?.nama || 'User'}</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/profile" className={navClass('/profile')}>
            👤 Informasi Pribadi
          </Link>
          <Link href="/profile/orders" className={navClass('/profile/orders')}>
            📦 Lihat Pesanan
          </Link>
          <Link href="/profile/favorites/products" className={navClass('/profile/favorites/products')}>
            ❤️ Produk Favorit
          </Link>
          <Link href="/profile/favorites/recipes" className={navClass('/profile/favorites/recipes')}>
            🍳 Resep Favorit
          </Link>
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-700 rounded-full font-bold text-sm transition mt-10 text-white">
            🚪 Keluar
          </button>
        </nav>
      </aside>

      {/* INI TEMPAT HALAMAN BERGANTI-GANTI */}
      {children}
    </div>
  );
}