"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from "react-to-print";
import { InvoiceToPrint } from "./components/InvoiceToPrint";
import { ChevronDown, ChevronUp, X, AlertTriangle, RefreshCcw, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/app/context/ToastContext";

import styles from './OrderPage.module.css';

// --- Komponen Ikon SVG Placeholder ---
const TruckIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
);

const PackageIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
);

const CheckBasketIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 11-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 8"/><path d="M8 6h12l-1.6 7.5A2 2 0 0 1 16.4 15H8"/><path d="M4 6h4"/><circle cx="9" cy="20" r="1"/><circle cx="16" cy="20" r="1"/></svg>
);

const CancelIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);

const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;

const renderStars = (rating: number) => {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={star <= rating ? "text-yellow-400" : "text-gray-300"}>
                    ★
                </span>
            ))}
        </div>
    );
};

const ProductItemRow = ({ item, ui }: any) => (
    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100 shadow-sm mt-2">
        <div className="flex items-center gap-3">
            <img 
                src={item.produk.gambar_url} 
                alt={item.produk.nama_produk} 
                className="w-10 h-10 object-cover rounded-md border"
            />
            <span className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
                {item.produk.nama_produk}
            </span>
            {item.catatan && (
                <span className="text-xs text-gray-500 italic  max-w-[560px] break-words">
                    📝Catatan: {item.catatan}
                </span>
            )}
        </div>
        {ui.status === 'completed' && (
            <div className="flex flex-col items-end">
                {item.ulasan ? (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Ulasan Anda</span>
                        {renderStars(item.ulasan.rating)}
                    </div>
                ) : (
                    <Link href={`/review?id_produk=${item.id_produk}&id_item=${item.id_item}&nama_produk=${encodeURIComponent(item.produk.nama_produk)}`}>
                        <button className="px-3 py-1 text-xs font-bold text-green-600 border border-green-200 rounded-md hover:bg-green-50 transition-all">
                            Nilai
                        </button>
                    </Link>
                )}
            </div>
        )}
    </div>
);

function ReviewItemSelector({ order, ui }: any) {
    const [isExpanded, setIsExpanded] = useState(false);
    const items = order.item_pesanan || [];
    const initialItems = items.slice(0, 2);
    const remainingItems = items.slice(2);

    return (
        <div className="w-full flex flex-col mt-2">
            {initialItems.map((item: any) => (
                <ProductItemRow key={item.id_item} item={item} ui={ui} />
            ))}

            {remainingItems.length > 0 && (
                <div className="w-full">
                    {isExpanded && remainingItems.map((item: any) => (
                        <ProductItemRow key={item.id_item} item={item} ui={ui} />
                    ))}
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full mt-2 py-1 flex items-center justify-center gap-1 text-[11px] font-bold text-gray-400 hover:text-green-600 transition-colors"
                    >
                        {isExpanded ? <>Sembunyikan <ChevronUp size={14} /></> : <>...dan {remainingItems.length} produk lainnya <ChevronDown size={14} /></>}
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── MODAL BATALKAN ────────────────────────────────────────────────────────────
// Mendukung 2 status:
//   - 'pending_payment' → tidak perlu pengembalian dana (belum terbayar)
//   - 'processing'      → sudah bayar, perlu proses refund
interface CancelModalProps {
    order: any;
    orderStatus: 'pending_payment' | 'processing';
    onClose: () => void;
    onSuccess: (orderId: number) => void;
}

function CancelModal({ order, orderStatus, onClose, onSuccess }: CancelModalProps) {
    const [step, setStep] = useState<'confirm' | 'loading' | 'success' | 'error'>('confirm');
    const [alasan, setAlasan] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const needsRefund = orderStatus === 'processing'; // sudah bayar → perlu refund
    const totalHarga = Number(order.total_harga);

    const alasanOptions = [
        'Salah pilih produk',
        'Ingin mengubah alamat pengiriman',
        'Menemukan harga lebih murah',
        'Berubah pikiran',
        'Lainnya',
    ];

    const handleConfirmCancel = async () => {
        if (!alasan) return;
        setStep('loading');
        try {
            const res = await fetch(`/api/orders/${order.id_pesanan}/cancel`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    alasan_pembatalan: alasan,
                    proses_refund: needsRefund,
                }),
            });

            if (res.ok) {
                setStep('success');
            } else {
                let errMsg = 'Gagal membatalkan pesanan.';
                try {
                    const err = await res.json();
                    errMsg = err.error || errMsg;
                } catch {
                    errMsg = `Server error (${res.status})`;
                }
                setErrorMsg(errMsg);
                setStep('error');
            }
        } catch (e: any) {
            const msg = e?.message || 'Terjadi kesalahan jaringan.';
            setErrorMsg(
                msg.includes('fetch') 
                    ? 'Endpoint cancel belum tersedia. Tambahkan /api/orders/[id]/cancel/route.ts'
                    : msg
            );
            setStep('error');
        }
    };

    const handleDone = () => {
        onSuccess(order.id_pesanan);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 overflow-hidden">
                
                {/* ── STEP: KONFIRMASI ── */}
                {step === 'confirm' && (
                    <>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-gray-800">Batalkan Pesanan</h3>
                            <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Info pesanan */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <div className="flex -space-x-2">
                                    {order.item_pesanan.slice(0, 3).map((item: any) => (
                                        <img key={item.id_item} src={item.produk.gambar_url} alt="" className="w-9 h-9 rounded-lg object-cover border-2 border-white" />
                                    ))}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 leading-tight">
                                        {order.item_pesanan.length} item • {order.no_pesanan}
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">
                                        Rp {totalHarga.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>

                            {/* Notif refund jika sudah bayar */}
                            {needsRefund && (
                                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                    <RefreshCcw size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-blue-700">Pengembalian Dana Otomatis</p>
                                        <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                                            Karena pesanan ini sudah dibayar, dana sebesar{' '}
                                            <span className="font-bold">Rp {totalHarga.toLocaleString('id-ID')}</span>{' '}
                                            akan dikembalikan ke metode pembayaran kamu dalam <span className="font-bold">3–7 hari kerja</span>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Pilih alasan */}
                            <div>
                                <p className="text-xs font-bold text-gray-700 mb-2">Alasan pembatalan <span className="text-red-500">*</span></p>
                                <div className="space-y-1.5">
                                    {alasanOptions.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setAlasan(opt)}
                                            className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                                                alasan === opt
                                                    ? 'border-red-400 bg-red-50 text-red-700 font-semibold'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Kembali
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                disabled={!alasan}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                    alasan
                                        ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Ya, Batalkan
                            </button>
                        </div>
                    </>
                )}

                {/* ── STEP: LOADING ── */}
                {step === 'loading' && (
                    <div className="flex flex-col items-center justify-center gap-4 p-12">
                        <Loader2 size={40} className="text-green-600 animate-spin" />
                        <p className="text-sm font-semibold text-gray-600">Memproses pembatalan...</p>
                    </div>
                )}

                {/* ── STEP: SUKSES ── */}
                {step === 'success' && (
                    <>
                        <div className="flex flex-col items-center gap-3 p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M20 6 9 17l-5-5"/></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">Pesanan Dibatalkan</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                    Pesanan <span className="font-semibold text-gray-700">{order.no_pesanan}</span> berhasil dibatalkan.
                                </p>
                            </div>

                            {needsRefund && (
                                <div className="w-full mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl text-left space-y-2">
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Info Pengembalian Dana</p>
                                    <div className="space-y-1.5 text-[12px] text-blue-600">
                                        <div className="flex justify-between">
                                            <span>Jumlah dikembalikan</span>
                                            <span className="font-bold text-blue-800">Rp {totalHarga.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Estimasi waktu</span>
                                            <span className="font-semibold">3–7 hari kerja</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Metode refund</span>
                                            <span className="font-semibold">Ke sumber pembayaran awal</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-blue-500 mt-2 leading-relaxed">
                                        Jika dana belum masuk setelah 7 hari kerja, hubungi tim support kami.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50">
                            <button
                                onClick={handleDone}
                                className="w-full py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 active:scale-95 transition-all"
                            >
                                Selesai
                            </button>
                        </div>
                    </>
                )}

                {/* ── STEP: ERROR ── */}
                {step === 'error' && (
                    <>
                        <div className="flex flex-col items-center gap-3 p-8 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle size={32} className="text-red-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">Gagal Membatalkan</h4>
                                <p className="text-sm text-gray-500 mt-1">{errorMsg}</p>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                                Tutup
                            </button>
                            <button onClick={() => setStep('confirm')} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all">
                                Coba Lagi
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── BELI LAGI ────────────────────────────────────────────────────────────────
function useReorder(): { handleReorder: (order: any) => void; reorderingId: number | null } {
    const router = useRouter();
    const [reorderingId, setReorderingId] = useState<number | null>(null);

    const handleReorder = (order: any) => {
        if (reorderingId !== null) return;
        setReorderingId(order.id_pesanan);

        const items = order.item_pesanan.map((item: any) => ({
            id_produk: item.id_produk,
            nama_produk: item.produk.nama_produk,
            harga: item.produk.harga,
            jumlah: item.kuantitas,
            gambar_url: item.produk.gambar_url,
        }));

        sessionStorage.setItem('reorderItems', JSON.stringify(items));
        router.push('/checkout?mode=reorder');
    };

    return { handleReorder, reorderingId };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState('Semua Pesanan');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const tabs = ['Semua Pesanan', 'Belum Bayar', 'Dalam Proses', 'Dalam Pengiriman', 'Dibatalkan', 'Selesai'];
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal Detail
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // Modal Batalkan
    const [cancelModal, setCancelModal] = useState<{ order: any; orderStatus: 'pending_payment' | 'processing' } | null>(null);

    // Loading state konfirmasi terima
    const [confirmingId, setConfirmingId] = useState<number | null>(null);

    const contentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        // @ts-ignore
        contentRef,
        documentTitle: `Invoice-${selectedOrder?.order_id || 'Pesanan'}`,
    });

    const { handleReorder, reorderingId } = useReorder();
    const { toast } = useToast();

    const openDetail = (order: any) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/orders?tab=${activeTab}&page=${currentPage}`);
                const data = await res.json();
                setOrders(data.orders || []);
                setTotalPages(data.totalPages || 1);
            } catch (err) {
                console.error("fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [activeTab, currentPage]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    // Setelah berhasil cancel → update status order di state lokal
    const handleCancelSuccess = (cancelledOrderId: number) => {
        setOrders(prev =>
            prev.map(o =>
                o.id_pesanan === cancelledOrderId
                    ? { ...o, order_status: 'dibatalkan' }
                    : o
            )
        );
    };

    // ── KONFIRMASI PESANAN DITERIMA ──
    // Dipanggil dari tombol "Pesanan Diterima" di tab Dalam Pengiriman.
    // Mengupdate order_status menjadi 'selesai' via PATCH /api/orders/[id]/status
    const handleConfirmReceived = async (id_pesanan: number) => {
        if (confirmingId !== null) return;
        setConfirmingId(id_pesanan);
        try {
            const res = await fetch(`/api/orders/${id_pesanan}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_status: 'selesai' }),
            });

            if (res.ok) {
                // Update state lokal langsung tanpa refetch
                setOrders(prev =>
                    prev.map(o =>
                        o.id_pesanan === id_pesanan
                            ? { ...o, order_status: 'selesai' }
                            : o
                    )
                );
                toast.success('Pesanan dikonfirmasi diterima!');
            } else {
                toast.danger('Gagal mengkonfirmasi pesanan. Coba lagi.');
            }
        } catch (err) {
            console.error('handleConfirmReceived error:', err);
            toast.danger('Terjadi kesalahan jaringan.');
        } finally {
            setConfirmingId(null);
        }
    };

    const getStatusUI = (order: any) => {
        const sudahBayar = 
            order.status_pembayaran === "dibayar" ||
            order.status_pembayaran === "settlement" ||
            order.status_pembayaran === "capture";

        // Dibatalkan — prioritas tertinggi
        if (order.order_status === 'dibatalkan') {
            return { label: "DIBATALKAN", color: "text-red", bg: "bg-red", icon: <CancelIcon />, status: 'cancelled' };
        }

        // Belum bayar
        if (!sudahBayar) {
            return { label: "BELUM BAYAR", color: "text-red", bg: "bg-red", icon: <PackageIcon />, status: 'pending_payment' };
        }

        // Sudah bayar — cek order_status
        switch (order.order_status) {
            case 'dikemas':
                return { label: "DALAM PROSES", color: "text-orange", bg: "bg-orange", icon: <PackageIcon />, status: 'processing' };
            case 'dikirim':
                return { label: "DALAM PENGIRIMAN", color: "text-green", bg: "bg-green", icon: <TruckIcon />, status: 'shipping' };
            case 'selesai':
                return { label: "SELESAI", color: "text-gray", bg: "bg-gray", icon: <CheckBasketIcon />, status: 'completed' };
            default:
                return { label: "DALAM PROSES", color: "text-orange", bg: "bg-orange", icon: <PackageIcon />, status: 'processing' };
        }
    };

    const OrderSkeleton = () => (
        <div className={`${styles['order-card']} ${styles['skeleton-container']}`}>
            <div className={styles["card-header"]}>
                <div className={styles["header-left"]}>
                    <div className={styles["skeleton-icon"]}></div>
                    <div className={styles["skeleton-text-container"]}>
                        <div className={`${styles['skeleton-line']} ${styles.short}`}></div>
                        <div className={`${styles['skeleton-line']} ${styles.medium}`}></div>
                    </div>
                </div>
                <div className={styles["header-right"]}>
                    <div className={`${styles['skeleton-line']} ${styles.short}`}></div>
                    <div className={`${styles['skeleton-line']} ${styles.short}`}></div>
                </div>
            </div>
            <div className={styles["card-body"]}>
                <div className={styles["body-left"]}>
                    <div className={styles["product-images"]}>
                        <div className={`${styles['img-box']} ${styles['skeleton-image']}`}></div>
                        <div className={`${styles['img-box']} ${styles['skeleton-image']}`}></div>
                    </div>
                    <div className={styles["product-info"]}>
                        <div className={`${styles['skeleton-line']} ${styles.long}`}></div>
                        <div className={`${styles['skeleton-line']} ${styles.medium}`}></div>
                    </div>
                </div>
            </div>
            <div className={styles["card-footer"]}>
                <div className={styles["skeleton-button"]}></div>
                <div className={styles["skeleton-button"]}></div>
            </div>
        </div>
    );

    return (
        <main className={styles["orders-main"]}>
            <header className={styles["orders-header"]}>
                <div>
                    <h1 className={styles["orders-title"]}>Lihat Pesanan</h1>
                    <p className="text-gray-500 text-sm mt-1">Riwayat Pesanan dari Aplikasi Kami </p>
                </div>
                <Link href="/DashboardProduct" className="text-[#064E3B] font-bold text-sm hover:underline flex items-center gap-2">
                    <span>← Kembali ke Toko</span>
                </Link>
            </header>
                
            <div className={styles["tabs-container"]}>
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`${styles['tab-btn']} ${activeTab === tab ? styles.active : ''}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── Modal Detail Pesanan / Detail Pembatalan ── */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-gray-800">
                                {getStatusUI(selectedOrder).status === 'cancelled' ? 'Detail Pembatalan' : 'Detail Pesanan'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Nomor Pesanan</p>
                                <p className="text-sm font-mono font-bold text-green-700">{(selectedOrder.order_id || 'PANGAN-12345').toString().replace("PANGAN-", "")}</p>
                            </div>

                            {/* Info pembatalan & refund — hanya muncul kalau status dibatalkan */}
                            {getStatusUI(selectedOrder).status === 'cancelled' && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Pesanan Dibatalkan</p>
                                    {selectedOrder.alasan_pembatalan && (
                                        <div className="flex justify-between text-[12px]">
                                            <span className="text-red-500">Alasan</span>
                                            <span className="font-semibold text-red-700">{selectedOrder.alasan_pembatalan}</span>
                                        </div>
                                    )}
                                    {selectedOrder.tanggal_pembatalan && (
                                        <div className="flex justify-between text-[12px]">
                                            <span className="text-red-500">Tanggal batalkan</span>
                                            <span className="font-semibold text-red-700">
                                                {new Date(selectedOrder.tanggal_pembatalan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    )}
                                    {/* Tampilkan info refund jika pesanan pernah dibayar */}
                                    {(selectedOrder.status_pembayaran === 'settlement' || selectedOrder.status_pembayaran === 'dibayar') && (
                                        <div className="mt-3 pt-3 border-t border-red-200 space-y-1.5">
                                            <p className="text-[11px] font-bold text-blue-700">Pengembalian Dana</p>
                                            <div className="flex justify-between text-[12px]">
                                                <span className="text-blue-500">Jumlah</span>
                                                <span className="font-bold text-blue-800">Rp {Number(selectedOrder.total_harga).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between text-[12px]">
                                                <span className="text-blue-500">Estimasi</span>
                                                <span className="font-semibold text-blue-700">3–7 hari kerja</span>
                                            </div>
                                            <div className="flex justify-between text-[12px]">
                                                <span className="text-blue-500">Metode</span>
                                                <span className="font-semibold text-blue-700">Ke sumber pembayaran awal</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-bold text-gray-800 mb-2">Item yang dibeli:</p>
                                {selectedOrder.item_pesanan?.map((item: any) => (
                                    <div key={item.id_item} className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600 font-medium">{item.kuantitas}x {item.produk.nama_produk}</span>
                                        <span className="font-semibold text-gray-500">Rp {Number(item.subtotal).toLocaleString('id-ID')}</span>
                                    </div>
                                ))}
                                <div className="pt-3 border-t">
                                    <div className="flex justify-between text-base font-bold">
                                        <span className="text-gray-700">Total Pembayaran</span>
                                        <span className="text-green-600">Rp {Number(selectedOrder.total_harga).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Batalkan ── */}
            {cancelModal && (
                <CancelModal
                    order={cancelModal.order}
                    orderStatus={cancelModal.orderStatus}
                    onClose={() => setCancelModal(null)}
                    onSuccess={handleCancelSuccess}
                />
            )}

            {/* ── List Order Cards ── */}
            <div className={styles["orders-list"]}>
                {loading ? (
                    <>
                        <OrderSkeleton />
                        <OrderSkeleton />
                        <OrderSkeleton />
                    </>
                ) : orders.length > 0 ? (
                    orders.map((order: any) => {
                        const ui = getStatusUI(order);

                        return (
                            <div key={order.id_pesanan} className={styles["order-card"]}>
                                <div className={styles["card-header"]}>
                                    <div className={styles["header-left"]}>
                                        <div className={`${styles['icon-wrapper']} ${styles[ui.bg]}`}>
                                            {ui.icon}
                                        </div>
                                        <div>
                                            <p className={`${styles['status-text']} ${styles[ui.color]}`}>{ui.label}</p>
                                            <p className={styles['order-id']}>Nomor Pesanan: {(order.order_id).toString().replace("PANGAN-", "")}</p>
                                        </div>
                                    </div>
                                    <div className={styles["header-right"]}>
                                        <p className={styles["date-label"]}>Order Date</p>
                                        <p className={styles["date-value"]}>{new Date(order.tanggal_pesanan).toLocaleDateString('id-ID')}</p>
                                    </div>
                                </div>

                                <div className={styles["card-body"]}>
                                    <div className="body-left w-full flex flex-col items-start gap-2">
                                        <ReviewItemSelector order={order} ui={ui} />

                                        <div className="w-full flex justify-between items-center mt-3 pt-3 border-t border-dashed border-gray-100">
                                            <span className="text-xs text-gray-400 font-medium">
                                                {order.item_pesanan.length} Items
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">
                                                Rp {Number(order.total_harga).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles["card-footer"]}>
                                    {/* ── BELUM BAYAR ── */}
                                    {ui.status === 'pending_payment' && (
                                        <>
                                            {/* Batalkan: tidak perlu refund karena belum bayar */}
                                            <button
                                                className={`${styles.btn} ${styles['btn-link-red']}`}
                                                onClick={() => setCancelModal({ order, orderStatus: 'pending_payment' })}
                                            >
                                                Batalkan
                                            </button>
                                            <button className={`${styles.btn} ${styles['btn-solid-green']}`}>Bayar Sekarang</button>
                                        </>
                                    )}

                                    {/* ── DALAM PROSES ── */}
                                    {ui.status === 'processing' && (
                                        <>
                                            <button 
                                                onClick={() => openDetail(order)}
                                                className={`${styles.btn} ${styles['btn-outline-gray']}`}
                                            >
                                                Detail Pesanan
                                            </button>
                                            <button 
                                                className={`${styles.btn} ${styles['btn-solid-black']}`}
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setTimeout(() => { handlePrint(); }, 100);
                                                }}
                                            >
                                                Cetak Tagihan
                                            </button>
                                        </>
                                    )}

                                    {/* ── DALAM PENGIRIMAN ── */}
                                    {ui.status === 'shipping' && (
                                        <>
                                            <button 
                                                onClick={() => openDetail(order)}
                                                className={`${styles.btn} ${styles['btn-outline-gray']}`}
                                            >
                                                Detail Pesanan
                                            </button>
                                            {/* Tombol konfirmasi terima — mengubah order_status jadi 'selesai' */}
                                            <button
                                                className={`${styles.btn} ${styles['btn-solid-green']}`}
                                                disabled={confirmingId === order.id_pesanan}
                                                onClick={() => handleConfirmReceived(order.id_pesanan)}
                                            >
                                                {confirmingId === order.id_pesanan ? (
                                                    <span className="flex items-center gap-1">
                                                        <Loader2 size={14} className={styles["animate-spin"]} />
                                                        Memproses...
                                                    </span>
                                                ) : (
                                                    'Pesanan Diterima'
                                                )}
                                            </button>
                                        </>
                                    )}

                                    {/* ── SELESAI ── */}
                                    {ui.status === 'completed' && (
                                        <>
                                            <button 
                                                onClick={() => openDetail(order)}
                                                className={`${styles.btn} ${styles['btn-outline-gray']}`}
                                            >
                                                Detail Pesanan
                                            </button>
                                            {/* Beli Lagi: encode items ke sessionStorage → redirect ke /checkout */}
                                            <button
                                                className={`${styles.btn} ${styles['btn-solid-green']}`}
                                                onClick={() => handleReorder(order)}
                                            >
                                                Beli Lagi
                                            </button>
                                        </>
                                    )}

                                    {/* ── DIBATALKAN ── */}
                                    {ui.status === 'cancelled' && (
                                        <button
                                            className={`${styles.btn} ${styles['btn-outline-gray']}`}
                                            onClick={() => openDetail(order)}
                                        >
                                            Detail Pembatalan
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className={styles["empty-state"]}>Belum ada pesanan.</div>
                )}
            </div>

            {totalPages > 1 && (
                <div className={styles["pagination-wrapper"]}>
                    <div className={styles["pagination-info"]}>
                        Menampilkan halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
                    </div>
                    <div className={styles["pagination-buttons"]}>
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => {
                                setCurrentPage(prev => prev - 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={styles["pag-btn"]}
                        >
                            <ChevronLeftIcon /> Sebelumnya
                        </button>
                        
                        <div className={styles["page-numbers"]}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        setCurrentPage(num);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`${styles['num-btn']} ${currentPage === num ? styles.active : ''}`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => {
                                setCurrentPage(prev => prev + 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={styles["pag-btn"]}
                        >
                            Berikutnya <ChevronRightIcon />
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: "none" }}>
                <div ref={contentRef}>
                    <InvoiceToPrint order={selectedOrder} />
                </div>
            </div>
        </main>
    );
}