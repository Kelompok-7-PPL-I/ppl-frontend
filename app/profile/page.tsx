"use client";

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
    const supabase = createClient();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
            
            if (!error) {
            setProfile(data);
            }
        }
        setLoading(false);
        };

        fetchProfile();
    }, [supabase]);

    if (loading) {
        return (
        <div className="flex-1 flex items-center justify-center min-h-screen">
            <div className="w-10 h-10 border-4 border-[#064E3B] border-t-transparent rounded-full animate-spin"></div>
        </div>
        );
    }

    return (
        <main className="flex-1 p-10 w-full">
        <header className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-extrabold text-gray-800">Personal Details</h1>
            <Link href="/DashboardProduct" className="text-[#064E3B] font-bold text-sm hover:underline">
            ← Back to Shop
            </Link>
        </header>

        {/* User Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-[#064E3B] text-3xl font-bold shrink-0">
                {profile?.nama?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">{profile?.nama}</h2>
            <p className="text-gray-500 text-xs">Joined Panganesia since {new Date(profile?.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-center px-6 border-l border-gray-100 shrink-0">
            <p className="text-xl font-black text-[#064E3B]">24</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Orders</p>
            </div>
            <div className="text-center px-6 border-l border-gray-100 shrink-0">
            <p className="text-xl font-black text-[#064E3B]">10</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Reviews</p>
            </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Section: Personal Info */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
            <button className="absolute top-6 right-6 text-gray-400 hover:text-[#064E3B]">✏️</button>
            <h3 className="font-bold text-gray-800 mb-6">Personal Details</h3>
            <div className="space-y-4">
                <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Full Name</p>
                <p className="text-sm font-medium text-gray-700">{profile?.nama}</p>
                </div>
                <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
                <p className="text-sm font-medium text-gray-700">{profile?.email}</p>
                </div>
                <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</p>
                <p className="text-sm font-medium text-gray-700">{profile?.nomor_telp || '-'}</p>
                </div>
            </div>
            </div>

            {/* Section: Address */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
            <button className="absolute top-6 right-6 text-gray-400 hover:text-[#064E3B]">✏️</button>
            <h3 className="font-bold text-gray-800 mb-6">Address</h3>
            <div className="space-y-4">
                <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Main Address</p>
                <p className="text-sm font-medium text-gray-700 leading-relaxed">
                    {profile?.alamat || 'Belum ada alamat yang didaftarkan.'}
                </p>
                </div>
            </div>
            </div>
        </div>
        </main>
    );
}