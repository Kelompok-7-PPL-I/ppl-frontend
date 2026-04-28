"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client"; 
import { usePathname, useRouter } from "next/navigation";
import { signOut as nextAuthSignOut } from "next-auth/react";

const navItems = [
  {
    label: "Beranda",
    href: "/admin",
    icon: (
      <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Pengguna",
    href: "/admin/users",
    icon: (
      <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Produk",
    href: "/admin/products",
    icon: (
      <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: "Resep", 
    href: "/admin/recipes",
    icon: (
      <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "Pesanan",
    href: "/admin/orders",
    icon: (
      <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { data: session } = useSession();
  
  // State untuk menyimpan info admin
  const [adminInfo, setAdminInfo] = useState({ nama: "Admin", email: "loading..." });

useEffect(() => {
    const getAdminData = async () => {
      try {
        const { data: { user: pengguna } } = await supabase.auth.getUser();
        
        if (pengguna) {
          setAdminInfo({
            nama: pengguna.user_metadata?.nama || pengguna.user_metadata?.full_name || "Admin Panganesia",
            email: pengguna.email || "admin@panganesia.com"
          });
          return; // Exit if found
        }

        if (session?.user) {
          setAdminInfo({
            nama: session.user.name || "Admin Panganesia",
            email: session.user.email || "admin@panganesia.com"
          });
          return;
        }

        // 3. Final Fallback: If both are null, stop the loading state
        setAdminInfo({
          nama: "Admin",
          email: "Session not found"
        });

      } catch (err) {
        console.error("Error fetching admin data:", err);
        setAdminInfo({ nama: "Admin", email: "Error loading profile" });
      }
    };

    getAdminData();
  }, [supabase, session]); // 'session' must be in dependencies

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await nextAuthSignOut({ redirect: false });
    router.refresh();
    router.push("/auth"); // Diarahkan ke auth page
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <Image
          src="/images/admin-logo.png"
          alt="Panganesia Logo"
          width={44}
          height={44}
          className="sidebar-logo"
        />
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Panganesia</span>
          <span className="sidebar-brand-sub">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <ul className="sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="sidebar-nav-item">
              <Link
                href={item.href}
                className={`sidebar-nav-link ${isActive ? "active" : ""}`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-user-container">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{adminInfo.nama}</span>
            <span className="sidebar-user-email">{adminInfo.email}</span>
          </div>
        </div>

        {/* Dropdown Menu dengan Settings & Logout */}
        <div className="admin-logout-dropdown">
          <Link href="/admin/settings" className="logout-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>
          <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '4px 0' }} />
          <button onClick={handleLogout} className="logout-item" style={{ color: '#e63946' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}