"use client";

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut as nextAuthSignOut, getSession } from "next-auth/react";

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
      // Dapatkan session dari NextAuth dulu karena login Credentials nyimpannya di sana
      const session = await getSession();
      const email = session?.user?.email;

      if (email) {
        const { data } = await supabase.from('pengguna').select('*').eq('email', email).single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, [supabase]);

  const handleLogout = async () => {
    // Log out dari Supabase
    await supabase.auth.signOut();
    // Log out dari NextAuth
    await nextAuthSignOut({ redirect: false });
    router.push('/');
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
            👤 Personal Details
          </Link>
          <Link href="/profile/orders" className={navClass('/profile/orders')}>
            📦 View Orders
          </Link>
          <Link href="/profile/favorites/products" className={navClass('/profile/favorites/products')}>
            ❤️ Favorite Products
          </Link>
          <Link href="/profile/favorites/recipes" className={navClass('/profile/favorites/recipes')}>
            🍳 Favorite Recipes
          </Link>
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-700 rounded-full font-bold text-sm transition mt-10 text-white">
            🚪 Logout
          </button>
        </nav>
      </aside>

      {/* INI TEMPAT HALAMAN BERGANTI-GANTI */}
      {children}
    </div>
  );
}