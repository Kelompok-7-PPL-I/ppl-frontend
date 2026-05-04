"use client";

import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut as nextAuthSignOut, getSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { User, ShoppingBag, Heart, Utensils, LogOut, Menu } from 'lucide-react';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const session = await getSession();
      const email = session?.user?.email;

      if (!email) return null;

      const { data, error } = await supabase
        .from('pengguna')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    },
    // Opsional: menjaga data tetap fresh
    staleTime: 1000 * 60 * 5, // 5 menit
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await nextAuthSignOut({ redirect: false });
    router.push('/');
  };

  const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

  const baseMenuClass = "flex items-center gap-3 px-5 py-3 rounded-full font-semibold text-sm transition-all duration-200 w-[85%] mx-auto";

  const getNavClass = (path: string) => {
    const isActive = pathname === path;
    return cn(
      baseMenuClass,
      isActive
        ? "bg-white text-[#062F24] shadow-md scale-[1.02]" 
        : "text-gray-300 hover:bg-[#084233] hover:text-white"
    );
  };

return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* Lebar aside berubah: jika collapsed jadi w-20, jika tidak tetap w-72 */}
      <aside className={cn(
        "bg-[#062F24] text-white flex flex-col shrink-0 py-10 z-10 sticky top-0 h-screen transition-all duration-300",
        isCollapsed ? "w-20" : "w-72"
      )}>
        
        <div className="px-6 mb-10 flex flex-col items-center">
          <div className={cn("w-full mb-8 flex", isCollapsed ? "justify-center" : "justify-start px-2")}>
            {/* Tambahkan onClick untuk mengubah state */}
            <Menu 
              className="w-7 h-7 text-white cursor-pointer hover:opacity-70" 
              onClick={() => setIsCollapsed(!isCollapsed)} 
            />
          </div>
          
          {/* Sembunyikan foto/nama jika collapsed agar tidak berantakan */}
          {!isCollapsed && (
            <>
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-[#062F24] text-4xl font-bold mb-4 border-4 border-[#084233] overflow-hidden">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 w-full h-full" />
                ) : profile?.foto_url ? (
                  <img src={profile.foto_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile?.nama?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="text-center w-full overflow-hidden">
                <p className="font-bold text-lg text-white tracking-tight truncate px-2">
                  {profile?.nama || 'User'}
                </p>
                <p className="text-[11px] text-gray-400 font-medium truncate px-4 mt-1">
                  {profile?.email}
                </p>
              </div>
            </>
          )}
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link href="/profile" className={getNavClass('/profile')}>
            <User className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Informasi Pribadi</span>}
          </Link>
          <Link href="/profile/orders" className={getNavClass('/profile/orders')}>
            <ShoppingBag className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Lihat Pesanan</span>}
          </Link>
          <Link href="/profile/favorites/products" className={getNavClass('/profile/favorites/products')}>
            <Heart className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Produk Favorit</span>}
          </Link>
          <Link href="/profile/favorites/recipes" className={getNavClass('/profile/favorites/recipes')}>
            <Utensils className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Resep Favorit</span>}
          </Link>
        </nav>

        <div className={cn("px-0 mt-auto mb-6 pt-2", isCollapsed ? "flex justify-center" : "")}>
        <button 
          onClick={handleLogout} 
          className={cn(
            baseMenuClass, 
            "text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
          )}
        >
          {/* Pastikan strokeWidth di luar className */}
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
      </aside>

      <div className="flex-1 bg-white">
        {children}
      </div>
    </div>
  );
}