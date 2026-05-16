"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

interface UlasanItem {
  id_ulasan: number;
  rating: number;
  komentar: string;
  tanggal_ulasan: string;
  id_produk: number;
  id_item: number;
  produk: {
    nama_produk: string;
    gambar_url: string;
  };
  item_pesanan: {
    id_item: number;
    id_pesanan: number;
    pesanan: {
      id_pesanan: number;
      order_id: string | null;
      tanggal_pesanan: string;
      // Tambahkan item_pesanan di dalam pesanan jika di-include oleh API backend kamu
      item_pesanan?: Array<{
        id_item: number;
        produk: { nama_produk: string };
        // tambahkan detail harga/kuantitas jika ada di skema database kamu
      }>;
    };
  };
}

export default function HistoryUlasanPage() {
  const [historyUlasan, setHistoryUlasan] = useState<UlasanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State Kontrol Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("baru");

  // BARU: State untuk mengontrol Modal Detail Pesanan langsung di sini
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch("/api/reviews");
        const result = await response.json();

        if (response.ok && result.success) {
          setHistoryUlasan(result.data || []);
        } else {
          setError(result.error || "Gagal memuat riwayat ulasan");
        }
      } catch (err) {
        console.error("Error fetching history ulasan:", err);
        setError("Terjadi kesalahan jaringan saat memuat data");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

    // Fungsi pembuka modal tiruan dari page orders kamu
    const openDetail = async (order: any) => {
        if (!order) return;
        
        try {
            // Ambil identifier order string (PANGAN-xxx) atau angka id_pesanan
            const idPencarian = order.order_id || order.id_pesanan;
            
            const res = await fetch(`/api/orders?openOrder=${idPencarian}`);
            const data = await res.json();
            
            if (data && data.success) {
            let targetOrder = null;

            // Cek apakah data dikembalikan dalam bentuk array orders
            if (Array.isArray(data.orders)) {
                targetOrder = data.orders.find(
                (o: any) => String(o.order_id) === String(idPencarian) || String(o.id_pesanan) === String(idPencarian)
                );
            } 
            // Jika backend langsung mengembalikan objek tunggal
            else if (data.orders && typeof data.orders === "object") {
                targetOrder = data.orders;
            } else if (data.data && typeof data.data === "object") {
                targetOrder = data.data;
            }

            // JIKA DATA UTUH DITEMUKAN: Pastikan kita pakai data dari database backend ini
            if (targetOrder) {
                setSelectedOrder(targetOrder);
                setIsModalOpen(true);
                return;
            }
            }

            // ==========================================
            // FALLBACK PINTAR (JIKA API ORDERS GAGAL/MISS)
            // ==========================================
            // Jika fetch orders bermasalah, kita manfaatkan data ulasan yang ada di genggaman
            // agar minimal produk yang sedang diklik tetap muncul di dalam modal!
            console.warn("Menggunakan data fallback ulasan.");
            
            // Kita buat struktur tiruan yang mirip dengan skema Pesanan + item_pesanan kamu
            const fallbackOrder = {
            order_id: order.order_id || `ID: ${order.id_pesanan}`,
            total_harga: order.total_harga || null,
            // Kita bungkus produk dari baris ulasan saat ini ke dalam array item_pesanan
            item_pesanan: [
                {
                kuantitas: 1, // default 1 karena data history tidak membawa jumlah total belanjaan
                produk: {
                    nama_produk: order.produk?.nama_produk || "Produk Terkait"
                }
                }
            ]
            };
            
            setSelectedOrder(fallbackOrder);
            setIsModalOpen(true);

        } catch (err) {
            console.error("Gagal fetch detail pesanan utuh:", err);
            // Masukkan ke fallback jika terjadi error network
            setSelectedOrder({
            order_id: order.order_id || "Detail Pesanan",
            item_pesanan: [{ kuantitas: 1, produk: { nama_produk: "Produk Terkait" } }]
            });
            setIsModalOpen(true);
        }
    };

  // Pemrosesan Filter & Sorting
  const filteredAndSortedUlasan = useMemo(() => {
    let result = [...historyUlasan];

    if (searchQuery.trim() !== "") {
      result = result.filter((item) =>
        item.produk?.nama_produk?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (ratingFilter !== "all") {
      result = result.filter((item) => item.rating === parseInt(ratingFilter));
    }

    result.sort((a, b) => {
      if (sortBy === "baru") return new Date(b.tanggal_ulasan).getTime() - new Date(a.tanggal_ulasan).getTime();
      if (sortBy === "lama") return new Date(a.tanggal_ulasan).getTime() - new Date(b.tanggal_ulasan).getTime();
      if (sortBy === "tertinggi") return b.rating - a.rating;
      if (sortBy === "terendah") return a.rating - b.rating;
      return 0;
    });

    return result;
  }, [historyUlasan, searchQuery, ratingFilter, sortBy]);

  return (
    <main className="flex-1 min-h-screen p-12 w-full bg-white">
      <div className="max-w-4xl mx-auto">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-[#062F24] tracking-tight">Riwayat Ulasan</h1>
        <Link href="/profile" className="text-[#064E3B] font-bold text-sm hover:underline">
          ← Kembali ke Profil
        </Link>
      </header>

      {/* PANEL KONTROL INTERAKTIF */}
      {!loading && !error && historyUlasan.length > 0 && (
        <div className="mb-10 max-w-4xl flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80 group">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-400 group-focus-within:text-[#064E3B] transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari ulasan produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 placeholder-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-[#064E3B] focus:ring-4 focus:ring-[#064E3B]/5 shadow-sm hover:border-gray-300"
            />
          </div>

          <div className="flex w-full sm:w-auto items-center gap-3">
            <div className="relative flex-1 sm:flex-initial min-w-[140px]">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.911c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </span>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-8 py-2 text-sm font-semibold text-gray-600 appearance-none cursor-pointer outline-none hover:border-gray-300 focus:border-[#064E3B] focus:ring-4 focus:ring-[#064E3B]/5 transition-all shadow-sm"
              >
                <option value="all">Semua Rating</option>
                <option value="5">5 Bintang</option>
                <option value="4">4 Bintang</option>
                <option value="3">3 Bintang</option>
                <option value="2">2 Bintang</option>
                <option value="1">1 Bintang</option>
              </select>
              <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 pointer-events-none text-xs">▼</span>
            </div>

            <div className="relative flex-1 sm:flex-initial min-w-[130px]">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-8 py-2 text-sm font-semibold text-gray-600 appearance-none cursor-pointer outline-none hover:border-gray-300 focus:border-[#064E3B] focus:ring-4 focus:ring-[#064E3B]/5 transition-all shadow-sm"
              >
                <option value="baru">Terbaru</option>
                <option value="lama">Terlama</option>
                <option value="tertinggi">Rating Tertinggi</option>
                <option value="terendah">Rating Terendah</option>
              </select>
              <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 pointer-events-none text-xs">▼</span>
            </div>
          </div>
        </div>
      )}

        {/* STATE: Loading */}
        {loading && (
            <div className="flex flex-col items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 text-sm">Memuat riwayat ulasan...</p>
            </div>
        )}

        {/* STATE: Error */}
        {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm text-center">
            {error}
            </div>
        )}

        {/* STATE: Empty Database (Memang belum pernah mengulas sama sekali) */}
        {!loading && !error && historyUlasan.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl max-w-4xl">
            <span className="text-4xl">📝</span>
            <p className="mt-3 text-gray-500 font-medium">Kamu belum pernah memberikan ulasan produk.</p>
            <Link href="/DashboardProduct" className="mt-4 inline-block text-sm bg-[#064E3B] text-white font-semibold px-4 py-2 rounded-xl hover:bg-[#043427] transition">
                Mulai Belanja
            </Link>
            </div>
        )}

        {/* STATE: Filter Empty (Data ada, tapi tidak cocok dengan filter / search user) */}
        {!loading && !error && historyUlasan.length > 0 && filteredAndSortedUlasan.length === 0 && (
            <div className="text-center py-14 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl max-w-4xl">
            <span className="text-3xl">🔎</span>
            <p className="mt-3 text-gray-400 font-medium text-sm">Tidak ditemukan ulasan produk yang cocok dengan kriteria pencarian kamu.</p>
            <button 
                onClick={() => { setSearchQuery(""); setRatingFilter("all"); setSortBy("baru"); }}
                className="mt-3 text-xs text-[#064E3B] font-bold hover:underline"
            >
                Reset Filter & Pencarian
            </button>
            </div>
        )}

      {/* LIST KARDUS ULASAN */}
      {!loading && !error && filteredAndSortedUlasan.length > 0 && (
        <div className="space-y-5 max-w-4xl">
          {filteredAndSortedUlasan.map((ulasan) => (
            <div 
              key={ulasan.id_ulasan} 
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex gap-6"
            >
              <div className="w-28 h-28 relative flex-shrink-0">
                <img 
                  src={ulasan.produk?.gambar_url || "/placeholder-food.png"} 
                  alt={ulasan.produk?.nama_produk} 
                  className="w-full h-full object-cover rounded-xl bg-gray-50"
                />
              </div>
              
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400 font-medium">
                      Diulas pada {new Date(ulasan.tanggal_ulasan).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                    
                    {/* Ganti parameter dari ulasan.item_pesanan?.pesanan menjadi membungkus data produknya juga */}
                    <button 
                        onClick={() => openDetail({
                            ...ulasan.item_pesanan?.pesanan,
                            produk: ulasan.produk // kita selipkan data produk untuk jaga-jaga kalau fallback aktif
                        })}
                        className="bg-emerald-50 text-[#064E3B] font-bold px-2 py-1 rounded-md border border-emerald-100 hover:bg-emerald-100 transition tracking-wide text-[10px] cursor-pointer"
                        >
                        Nomor Pesanan: {(ulasan.item_pesanan?.pesanan?.order_id || ulasan.item_pesanan?.id_pesanan)?.toString().replace("PANGAN-", "")}
                    </button>
                  </div>

                  <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">{ulasan.produk?.nama_produk}</h3>
                  <div className="flex text-amber-400 text-sm mb-3">
                    {"★".repeat(ulasan.rating)}{"☆".repeat(5 - ulasan.rating)}
                  </div>
                  <p className="text-gray-600 text-sm italic leading-relaxed font-light">
                    "{ulasan.komentar || 'Pelanggan tidak meninggalkan ulasan tertulis.'}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center text-xs text-gray-400 gap-1.5">
                  <span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </span>
                  <span>Waktu Pembelian:</span>
                  <span className="font-semibold text-gray-500">
                    {ulasan.item_pesanan?.pesanan?.tanggal_pesanan 
                      ? new Date(ulasan.item_pesanan.pesanan.tanggal_pesanan).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMPONENT MODAL DETAIL PESANAN (SAMA SEPERTI DI PAGE ORDERS KAMU) */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all relative">
            
            {/* Tombol Silang Pojok Kanan */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-4">Detail Pesanan</h2>
            
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
              <span className="text-[10px] font-bold text-gray-400 block tracking-wider uppercase">Nomor Pesanan</span>
              <span className="text-emerald-600 font-extrabold text-sm tracking-wide">
                {selectedOrder.order_id || `ID: ${selectedOrder.id_pesanan}`}
              </span>
            </div>

            {/* Informasi Isian Item di Dalam Pesanan */}
            {/* Daftar Item yang Dibeli */}
            <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">Item yang dibeli:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.item_pesanan && selectedOrder.item_pesanan.length > 0 ? (
                    selectedOrder.item_pesanan.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm font-medium text-gray-600 py-1 border-b border-gray-50">
                        <span>{item.kuantitas || 1}x {item.produk?.nama_produk}</span>
                        {item.subtotal && (
                        <span className="text-gray-500">Rp {Number(item.subtotal).toLocaleString("id-ID")}</span>
                        )}
                    </div>
                    ))
                ) : (
                    <div className="text-sm font-medium text-gray-400 italic">
                    Tidak ada rincian item produk yang ditemukan.
                    </div>
                )}
                </div>
            </div>

            {/* TAMBAHKAN BARIS TOTAL PEMBAYARAN INI */}
            {selectedOrder.total_harga && (
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 mb-6">
                <span className="text-sm font-bold text-gray-700">Total Pembayaran</span>
                <span className="text-emerald-600 font-extrabold text-base">
                    Rp {Number(selectedOrder.total_harga).toLocaleString("id-ID")}
                </span>
                </div>
            )}

            {/* Tombol Tutup Bawah */}
            <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-[#064E3B] hover:bg-[#043427] text-white font-bold py-2.5 rounded-xl transition text-sm shadow-md"
            >
                Tutup
            </button>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}