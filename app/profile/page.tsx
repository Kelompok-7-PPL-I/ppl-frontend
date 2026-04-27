"use client";

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
    const supabase = createClient();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [stats, setStats] = useState({ orders: 0, reviews: 0 });

    // State untuk fitur edit
    const [modalType, setModalType] = useState<'kontak' | 'alamat' | null>(null);    
    
    const [formData, setFormData] = useState({
        nama: '',
        nomor_telp: '',
        alamat: ''
    });

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                // 1. Ambil Data Profil
                const { data: userData } = await supabase
                    .from('pengguna')
                    .select('*')
                    .eq('email', user.email)
                    .single();
                
                if (userData) setProfile(userData);

                // 2. Ambil Jumlah Pesanan (Manual Count)
                const { count: orderCount } = await supabase
                    .from('pesanan')
                    .select('*', { count: 'exact', head: true })
                    .eq('id_pengguna', user.id);

                // 3. Ambil Jumlah Ulasan (Manual Count)
                const { count: reviewCount } = await supabase
                    .from('ulasan')
                    .select('*', { count: 'exact', head: true })
                    .eq('id_pengguna', user.id);

                setStats({ 
                    orders: orderCount || 0, 
                    reviews: reviewCount || 0 
                });
            }
            setLoading(false);
        };

        fetchAllData();
    }, [supabase]);

    const handleUpdateProfile = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('pengguna')
            .update({
                nama: formData.nama,
                nomor_telp: formData.nomor_telp,
                alamat: formData.alamat
            })
            .eq('email', profile.email);

        if (!error) {
            setProfile({ ...profile, ...formData });
            setModalType(null); // Tutup modal setelah simpan

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } else {
            alert("Gagal memperbarui profil.");
        }
        setLoading(false);
    };

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
            <h1 className="text-2xl font-extrabold text-gray-800">Informasi Pribadi</h1>
            <Link href="/DashboardProduct" className="text-[#064E3B] font-bold text-sm hover:underline">
            ← Kembali ke Toko
            </Link>
        </header>

        {/* User Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-[#064E3B] text-3xl font-bold shrink-0">
                {profile?.nama?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">{profile?.nama}</h2>
            <p className="text-gray-500 text-xs">Bergabung dengan Panganesia sejak {profile?.dibuat_pada ? new Date(profile.dibuat_pada).toLocaleDateString() : 'Invalid Date'}</p>
            </div>
            <div className="text-center px-6 border-l border-gray-100 shrink-0">
            <p className="text-xl font-black text-[#064E3B]">
                {stats.orders ?? 0}
            </p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pesanan</p>
            </div>
            <div className="text-center px-6 border-l border-gray-100 shrink-0">
            <p className="text-xl font-black text-[#064E3B]">
                {stats.reviews ?? 0}
            </p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ulasan</p>
            </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Section: Personal Info */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                <button 
                    onClick={() => setModalType('kontak')} 
                    className="absolute top-6 right-6 text-xl hover:scale-110 transition z-10 cursor-pointer p-2"
                    style={{ pointerEvents: 'auto' }} // Memastikan klik terdeteksi
                >
                    ✏️
                </button>                
                <h3 className="font-bold text-gray-800 mb-6">Informasi Pribadi</h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Nama Lengkap</p>
                        <p className="text-sm font-medium text-gray-700">{profile?.nama}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Alamat Email</p>
                        <p className="text-sm font-medium text-gray-700">{profile?.email}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Nomor Telepon</p>
                        <p className="text-sm font-medium text-gray-700">{profile?.nomor_telp || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Section: Address */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                <button onClick={() => setModalType(null)} className="absolute top-6 right-6 text-gray-400 hover:text-[#064E3B]">✏️</button>            
                <h3 className="font-bold text-gray-800 mb-6">Alamat Pengiriman</h3>
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

        {/* MODAL EDIT KONTAK */}
            {modalType === 'kontak' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Kontak ✏️</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Nama Lengkap</label>
                                <input 
                                    type="text"
                                    className="w-full border rounded-xl px-4 py-3 mt-1 outline-none focus:ring-2 focus:ring-green-500 bg-white text-black font-semibold"
                                    value={formData.nama}
                                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Nomor Telepon</label>
                                <input 
                                    type='text'
                                    className="w-full border rounded-xl px-4 py-3 mt-1 outline-none focus:ring-2 focus:ring-green-500 bg-white text-black font-semibold"
                                    value={formData.nomor_telp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        setFormData({...formData, nomor_telp: value});
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setModalType(null)} className="flex-1 py-3 text-gray-400 font-bold">Batal</button>
                            <button onClick={handleUpdateProfile} className="flex-1 py-3 bg-[#064E3B] text-white rounded-xl font-bold">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDIT ALAMAT */}
            {modalType === 'alamat' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Alamat ✏️</h2>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Alamat Lengkap</label>
                            <textarea 
                                className="w-full border rounded-xl px-4 py-3 mt-1 outline-none focus:ring-2 focus:ring-green-500 h-32 resize-none"
                                value={formData.alamat}
                                onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                            />
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setModalType(null)} className="flex-1 py-3 text-gray-400 font-bold">Batal</button>
                            <button onClick={handleUpdateProfile} className="flex-1 py-3 bg-[#064E3B] text-white rounded-xl font-bold">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTIFIKASI SUKSES (TOAST) */}
            {showSuccess && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-[#064E3B] text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-green-400">
                        <span className="text-xl">✅</span>
                        <div className="flex flex-col">
                            <p className="font-bold text-sm">Berhasil!</p>
                            <p className="text-xs text-green-100">Profil Panganesia kamu telah diperbarui.</p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}