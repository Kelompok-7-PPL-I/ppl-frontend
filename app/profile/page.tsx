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
    const [modalType, setModalType] = useState<'kontak' | 'alamat_list' | 'alamat_form' | null>(null);    
    const [addresses, setAddresses] = useState<any[]>([]); // Simpan semua alamat
    const [selectedAddress, setSelectedAddress] = useState<any>(null); // Untuk Edit alamat spesifik
    const [formData, setFormData] = useState({
        nama: '',
        nomor_telp: '',
        alamat: ''
    });
    const [addressFormData, setAddressFormData] = useState({
        label_alamat: '',
        nama_penerima: '',
        nomor_telepon: '',
        alamat_lengkap: '',
        kota_kabupaten: '',
        kode_pos: '',
        is_utama: false
    });
    const [showWarning, setShowWarning] = useState<{ type: 'hapus' | 'close', active: boolean }>({ 
        type: 'close', 
        active: false 
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

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
                
                if (userData) {
                    setProfile(userData);
                    
                    // AMBIL SEMUA ALAMAT USER
                    const { data: addrData } = await supabase
                        .from('alamat_pengguna')
                        .select('*')
                        .eq('id_user', userData.id)
                        .order('is_utama', { ascending: false });

                    if (addrData) setAddresses(addrData);
                }

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


    useEffect(() => {
        if (selectedAddress && modalType === 'alamat_form') {
            setAddressFormData({
                label_alamat: selectedAddress.label_alamat || '',
                nama_penerima: selectedAddress.nama_penerima || '',
                nomor_telepon: selectedAddress.nomor_telepon || '',
                alamat_lengkap: selectedAddress.alamat_lengkap || '',
                kota_kabupaten: selectedAddress.kota_kabupaten || '',
                kode_pos: selectedAddress.kode_pos || '',
                is_utama: selectedAddress.is_utama || false
            });
        } else if (modalType === 'alamat_form') {
            // Reset form jika klik Tambah Baru
            setAddressFormData({
                label_alamat: '', nama_penerima: '', nomor_telepon: '',
                alamat_lengkap: '', kota_kabupaten: '', kode_pos: '', is_utama: false
            });
        }
    }, [selectedAddress, modalType]);

    
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

    // 1. Fungsi Ambil Daftar Alamat
    const fetchAddresses = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Ambil ID UUID dari tabel pengguna
        const { data: userData } = await supabase
            .from('pengguna')
            .select('id')
            .eq('email', user.email)
            .single();

        if (!userData) {
            console.error("User data tidak ditemukan di tabel pengguna");
            return;
        }

        const { data, error } = await supabase
            .from('alamat_pengguna')
            .select('*')
            .eq('id_user', userData.id) // Sekarang aman, tidak akan error null
            .order('is_utama', { ascending: false });

        if (!error) setAddresses(data || []);
    };

    // 2. Fungsi Simpan (Tambah & Edit)
    const handleSaveAddress = async () => {
        const newErrors: Record<string, string> = {};
        const requiredFields = {
            label_alamat: "Label Alamat",
            nama_penerima: "Nama Penerima",
            nomor_telepon: "Nomor Telepon",
            alamat_lengkap: "Alamat Lengkap",
            kota_kabupaten: "Kota/Kabupaten",
            kode_pos: "Kode Pos"
        };

        Object.entries(requiredFields).forEach(([key, label]) => {
            if (!addressFormData[key as keyof typeof addressFormData]) {
                newErrors[key] = `${label} wajib diisi`;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return; // Berhenti jika ada error
        }

        setErrors({});

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User tidak ditemukan");

            // Ambil UUID internal
            const { data: userData } = await supabase
                .from('pengguna')
                .select('id')
                .eq('email', user.email)
                .single();
            
            if (!userData) {
                throw new Error("Gagal mengambil ID pengguna dari database.");
            }

            if (addressFormData.is_utama) {
            // Jika alamat yang sedang diproses ini diset jadi UTAMA,
            // maka set semua alamat milik user ini menjadi FALSE dulu.
            await supabase
                .from('alamat_pengguna')
                .update({ is_utama: false })
                .eq('id_user', userData.id);
        }

            const payload = {
                ...addressFormData,
                id_user: userData.id
            };

            let error;
            if (selectedAddress) {
                // Jika sedang EDIT (id_alamat ada)
                const { error: err } = await supabase
                    .from('alamat_pengguna')
                    .update(payload)
                    .eq('id_alamat', selectedAddress.id_alamat);
                error = err;
            } else {
                // Jika sedang TAMBAH BARU
                const { error: err } = await supabase
                    .from('alamat_pengguna')
                    .insert([payload]);
                error = err;
            }

            if (error) throw error;

            // Berhasil
            setModalType('alamat_list'); // Kembali ke daftar alamat
            await fetchAddresses(); // Refresh list
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAddress = async () => {
        if (!selectedAddress) return;
        setLoading(true);
        try {
            // Hapus langsung datanya berdasarkan ID alamat
            const { error } = await supabase
                .from('alamat_pengguna')
                .delete()
                .eq('id_alamat', selectedAddress.id_alamat);

            if (error) throw error;

            // Jika berhasil:
            setModalType('alamat_list'); // Tutup form, balik ke list
            await fetchAddresses();      // Refresh daftar alamat
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            
        } catch (err: any) {
            alert("Gagal menghapus alamat: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk tombol X atau Overlay
    const handleCloseForm = () => {
        const isFormDirty = Object.values(addressFormData).some(value => value !== '' && value !== false);
        if (isFormDirty) {
            setShowWarning({ type: 'close', active: true });
        } else {
            setModalType('alamat_list');
        }
    };

    // Fungsi untuk tombol Hapus
    const triggerDelete = () => {
        setShowWarning({ type: 'hapus', active: true });
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
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative hover:border-green-500 transition group flex flex-col h-full">
                <h3 className="font-bold text-gray-800 mb-6">Alamat Pengiriman</h3>
                <div className="flex-1 space-y-4">
                    {addresses.length > 0 ? (
                        // Cari yang is_utama, kalau tidak ada ambil yang pertama
                        (() => {
                            const main = addresses.find(a => a.is_utama) || addresses[0];
                            return (
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded">
                                            {main.label_alamat} (Utama)
                                        </p>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800">{main.nama_penerima}</p>
                                    <p className="text-xs text-gray-500 mb-2">{main.nomor_telepon}</p>
                                    <p className="text-sm font-medium text-gray-700 leading-relaxed line-clamp-2">
                                        {main.alamat_lengkap}
                                    </p>
                                </div>
                            )
                        })()
                    ) : (
                        <p className="text-sm text-gray-400 italic">Belum ada alamat. Klik untuk menambahkan.</p>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50">
                    <button 
                        onClick={() => setModalType('alamat_list')}
                        className="w-full text-center text-sm font-bold text-[#064E3B] hover:text-green-700 transition flex items-center justify-center gap-1 group-hover:translate-x-1 duration-300"
                    >
                        Lihat Semua <span className="text-lg">❯</span>
                    </button>
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

        {/* MODAL LIST ALAMAT */}
            {modalType === 'alamat_list' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Alamat Saya 🏠</h2>
                            <button onClick={() => setModalType(null)} className="text-2xl text-gray-400">&times;</button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-4">
                            <button 
                                onClick={() => { setSelectedAddress(null); setModalType('alamat_form'); }}
                                className="w-full py-3 border-2 border-dashed border-green-600 rounded-2xl text-green-700 font-bold hover:bg-green-50"
                            >
                                + Tambah Alamat Baru
                            </button>

                            {addresses.map((addr) => (
                                <div key={addr.id_alamat} className={`p-4 rounded-2xl border-2 transition ${addr.is_utama ? 'border-green-600 bg-green-50' : 'border-gray-100'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase bg-gray-200 px-2 py-0.5 rounded text-gray-600">{addr.label_alamat}</span>
                                                {addr.is_utama && <span className="text-[10px] font-bold text-green-700 uppercase">Utama</span>}
                                            </div>
                                            <p className="font-bold text-gray-800">{addr.nama_penerima}</p>
                                            <p className="text-xs text-gray-500">{addr.nomor_telepon}</p>
                                            <p className="text-sm text-gray-600 mt-2">{addr.alamat_lengkap}</p>
                                        </div>
                                        <div className="flex flex-col gap-2 ml-4">
                                            <button 
                                                onClick={() => { setSelectedAddress(addr); setModalType('alamat_form'); }}
                                                className="text-xs font-bold text-blue-600 hover:underline"
                                            >
                                                EDIT
                                            </button>
                                            {/* Tombol hapus dan jadikan utama bisa ditaruh di sini */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL FORM ALAMAT (TAMBAH/EDIT) */}
            {modalType === 'alamat_form' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) handleCloseForm(); }}>
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] relative animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}>
                        <button 
                            onClick={handleCloseForm}
                            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all z-10"
                            title="Tutup">
                            <span className="text-2xl leading-none">&times;</span>
                        </button>

                        <h2 className="text-xl font-bold text-gray-800 mb-6">
                            {selectedAddress ? "Edit Alamat ✏️" : "Tambah Alamat Baru 🏠"}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Label: Rumah/Kantor */}
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    Label Alamat<span className="text-red-500">*</span>
                                </label>
                                {/* Pesan Error di Sebelah Kanan Label */}
                                {errors.label_alamat && (
                                    <span className="text-[10px] text-red-500 font-bold animate-pulse">
                                        {errors.label_alamat}
                                    </span>
                                )}
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Rumah/Kantor" 
                                    className={`w-full border rounded-xl px-4 py-3 bg-white text-black font-semibold outline-none transition-all ${
                                        errors.label_alamat 
                                            ? 'border-red-500 bg-red-50 focus:ring-1 focus:ring-red-200' 
                                            : 'border-gray-200 focus:ring-2 focus:ring-green-500'
                                    }`}
                                    value={addressFormData.label_alamat} 
                                    onChange={(e) => {
                                        setAddressFormData({...addressFormData, label_alamat: e.target.value});
                                        if (errors.label_alamat) setErrors({...errors, label_alamat: ''}); 
                                    }}
                                />
                            </div>
                            
                            {/* Nama Penerima */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    Nama Penerima<span className="text-red-500">*</span>
                                </label>
                                {errors.nama_penerima && (
                                    <span className="text-[10px] text-red-500 font-bold animate-pulse">
                                        {errors.nama_penerima}
                                    </span>
                                )}
                                <input 
                                    type="text" 
                                    className={`w-full border rounded-xl px-4 py-3 bg-white text-black font-semibold outline-none transition-all ${
                                        errors.nama_penerima 
                                            ? 'border-red-500 bg-red-50 focus:ring-1 focus:ring-red-200' 
                                            : 'border-gray-200 focus:ring-2 focus:ring-green-500'
                                    }`}                                    
                                    value={addressFormData.nama_penerima} 
                                    onChange={(e) => {
                                        setAddressFormData({...addressFormData, nama_penerima: e.target.value});
                                        if (errors.nama_penerima) setErrors({...errors, nama_penerima: ''}); 
                                    }}
                                />
                            </div>

                            {/* No Telp */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    Nomor Telepon<span className="text-red-500">*</span>
                                </label>
                                {errors.nomor_telepon && (
                                    <span className="text-[10px] text-red-500 font-bold animate-pulse">
                                        {errors.nomor_telepon}
                                    </span>
                                )}
                                <input 
                                    type="text" 
                                    className={`w-full border rounded-xl px-4 py-3 bg-white text-black font-semibold outline-none transition-all ${
                                        errors.nomor_telepon 
                                            ? 'border-red-500 bg-red-50 focus:ring-1 focus:ring-red-200' 
                                            : 'border-gray-200 focus:ring-2 focus:ring-green-500'
                                    }`}                                    
                                    value={addressFormData.nomor_telepon} 
                                    onChange={(e) => {
                                        setAddressFormData({...addressFormData, nomor_telepon: e.target.value});
                                        if (errors.nomor_telepon) setErrors({...errors, nomor_telepon: ''}); 
                                    }}                                
                                />
                            </div>

                            {/* Alamat Lengkap */}
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    Alamat Lengkap<span className="text-red-500">*</span>
                                </label>
                                {errors.alamat_lengkap && (
                                    <span className="text-[10px] text-red-500 font-bold animate-pulse">
                                        {errors.alamat_lengkap}
                                    </span>
                                )}
                                <textarea 
                                    placeholder="Nama jalan, nomor rumah, blok, dll"
                                    className={`w-full border rounded-xl px-4 py-3 mt-1 bg-white text-black font-semibold outline-none transition-all ${
                                        errors.alamat_lengkap
                                            ? 'border-red-500 bg-red-50 focus:ring-1 focus:ring-red-200'
                                            : 'border-gray-200 focus:ring-2 focus:ring-2 focus:ring-green-500 h-24 resize-none'
                                    }`}
                                    value={addressFormData.alamat_lengkap} 
                                    onChange={(e) => {
                                        setAddressFormData({...addressFormData, alamat_lengkap: e.target.value});
                                        if (errors.alamat_lengkap) setErrors({...errors, alamat_lengkap: ''}); 
                                    }}                                
                                />
                            </div>

                            {/* Kota & Kode Pos */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    Kota/Kabupaten <span className="text-red-500">*</span>
                                </label>

                                {errors.kota_kabupaten && (
                                    <span className="text-[10px] text-red-500 font-bold animate-pulse">
                                        {errors.kota_kabupaten}
                                    </span>
                                )}

                                <input 
                                    type="text" 
                                    className={`w-full border rounded-xl px-4 py-3 bg-white text-black font-semibold outline-none transition-all ${
                                        errors.kota_kabupaten 
                                            ? 'border-red-500 bg-red-50 focus:ring-1 focus:ring-red-200' 
                                            : 'border-gray-200 focus:ring-2 focus:ring-green-500'
                                    }`}                                    
                                    value={addressFormData.kota_kabupaten} 
                                    onChange={(e) => {
                                        setAddressFormData({...addressFormData, kota_kabupaten: e.target.value});
                                        if (errors.kota_kabupaten) setErrors({...errors, kota_kabupaten: ''}); 
                                    }}                                
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    Kode Pos <span className="text-red-500">*</span>
                                </label>
                                {errors.kode_pos && (
                                    <span className="text-[10px] text-red-500 font-bold animate-pulse">
                                        {errors.kode_pos}
                                    </span>
                                )}
                                <input 
                                    type="text" 
                                    className={`w-full border rounded-xl px-4 py-3 bg-white text-black font-semibold outline-none transition-all ${
                                        errors.kode_pos 
                                            ? 'border-red-500 bg-red-50 focus:ring-1 focus:ring-red-200' 
                                            : 'border-gray-200 focus:ring-2 focus:ring-green-500'
                                    }`}                                    
                                    value={addressFormData.kode_pos} 
                                    onChange={(e) => {
                                        setAddressFormData({...addressFormData, kode_pos: e.target.value});
                                        if (errors.kode_pos) setErrors({...errors, kode_pos: ''}); 
                                    }}                                
                                />
                            </div>
                        </div>

                        {/* Checkbox Utama */}
                        <div className="flex items-center gap-2 mt-6">
                            <input 
                                type="checkbox" 
                                id="is_utama" 
                                checked={addressFormData.is_utama} 
                                onChange={(e) => setAddressFormData({...addressFormData, is_utama: e.target.checked})}
                                className="w-4 h-4 accent-green-600" 
                            />
                            <label htmlFor="is_utama" className="text-sm font-bold text-gray-700 cursor-pointer">Jadikan Alamat Utama</label>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex gap-3 mt-8">
                            {/* TOMBOL HAPUS (Hanya muncul jika sedang EDIT) */}
                            {selectedAddress && (
                                <button 
                                    onClick={triggerDelete}
                                    className="flex-1 py-3 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition"
                                >
                                    Hapus Alamat
                                </button>
                            )}
                            
                            <button 
                                onClick={handleSaveAddress} 
                                className="flex-[2] py-3 bg-[#064E3B] text-white rounded-xl font-bold hover:bg-[#053d2e] transition shadow-lg"
                            >
                                {loading ? 'Menyimpan...' : 'Simpan Alamat'}
                            </button>
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

            {showWarning.active && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95 duration-200">
                        {/* Icon Warning */}
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-6 ${showWarning.type === 'hapus' ? 'bg-red-50' : 'bg-orange-50'}`}>
                            {showWarning.type === 'hapus' ? '🗑️' : '⚠️'}
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {showWarning.type === 'hapus' ? 'Hapus Alamat?' : 'Simpan Perubahan?'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-8">
                            {showWarning.type === 'hapus' 
                                ? 'Alamat yang dihapus tidak dapat dikembalikan. Yakin ingin melanjutkan?' 
                                : 'Kamu memiliki perubahan yang belum disimpan. Yakin ingin keluar?'}
                        </p>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={async () => {
                                    if (showWarning.type === 'hapus') {
                                        await handleDeleteAddress(); // Pastikan handleDeleteAddress tidak pakai confirm() lagi di dalamnya
                                    } else {
                                        setModalType('alamat_list');
                                    }
                                    setShowWarning({ ...showWarning, active: false });
                                }}
                                className={`w-full py-4 rounded-2xl font-bold text-white transition shadow-lg ${showWarning.type === 'hapus' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#064E3B] hover:bg-[#053d2e]'}`}
                            >
                                {showWarning.type === 'hapus' ? 'Ya, Hapus Sekarang' : 'Ya, Keluar Tanpa Simpan'}
                            </button>
                            
                            <button 
                                onClick={() => setShowWarning({ ...showWarning, active: false })}
                                className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition"
                            >
                                Batalkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}