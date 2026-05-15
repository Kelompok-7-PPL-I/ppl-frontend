"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from "react-to-print";
import { InvoiceToPrint } from "./components/InvoiceToPrint";
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import './page.css'; 

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

const ReturnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
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

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState('Semua Pesanan');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const tabs = ['Semua Pesanan', 'Belum Bayar', 'Dalam Proses', 'Dalam Pengiriman', 'Dibatalkan', 'Selesai'];
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const contentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        // @ts-ignore
        contentRef,
        documentTitle: `Invoice-${selectedOrder?.order_id || 'Pesanan'}`,
    });

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

    const getStatusUI = (order: any) => {
        // 1. Cek Pembayaran Terlebih Dahulu
        if (order.status_pembayaran !== "settlement" && order.status_pembayaran !== "dibayar" && order.order_status !== "dibatalkan") {
            return { 
                label: "BELUM BAYAR", 
                color: "text-red", 
                bg: "bg-red", 
                icon: <PackageIcon />, // Pakai icon paket karena baru dipesan
                status: 'pending_payment' 
            };
        }

        // 2. Cek Berdasarkan Order Status
        switch (order.order_status) {
            case 'dikemas':
                return { 
                    label: "DALAM PROSES", 
                    color: "text-orange", 
                    bg: "bg-orange", 
                    icon: <PackageIcon />, 
                    status: 'processing' 
                };
            case 'dikirim':
                return { 
                    label: "DALAM PENGIRIMAN", 
                    color: "text-green", 
                    bg: "bg-green", 
                    icon: <TruckIcon />, 
                    status: 'shipping' 
                };
            case 'selesai':
                return { 
                    label: "SELESAI", 
                    color: "text-gray", 
                    bg: "bg-gray", 
                    icon: <CheckBasketIcon />, 
                    status: 'completed' 
                };
            case 'dibatalkan':
                return { 
                    label: "DIBATALKAN", 
                    color: "text-red", 
                    bg: "bg-red", 
                    icon: <CancelIcon />, 
                    status: 'cancelled' 
                };
            default:
                return { 
                    label: "PENDING", 
                    color: "text-gray", 
                    bg: "bg-gray", 
                    icon: <PackageIcon />, 
                    status: 'unknown' 
                };
        }
    }

    const OrderSkeleton = () => (
        <div className="order-card skeleton-container">
            <div className="card-header">
            <div className="header-left">
                <div className="skeleton-icon"></div>
                <div className="skeleton-text-container">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line medium"></div>
                </div>
            </div>
            <div className="header-right">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line short"></div>
            </div>
            </div>
            <div className="card-body">
            <div className="body-left">
                <div className="product-images">
                <div className="img-box skeleton-image"></div>
                <div className="img-box skeleton-image"></div>
                </div>
                <div className="product-info">
                <div className="skeleton-line long"></div>
                <div className="skeleton-line medium"></div>
                </div>
            </div>
            </div>
            <div className="card-footer">
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
            </div>
        </div>
        );

    return (
        <main className="orders-main">
            <header className="orders-header">
                <div>
                    <h1 className="orders-title">Lihat Pesanan</h1>
                </div>
                {/* Jika nanti ada tombol "Back" atau aksi lain di kanan, bisa ditaruh di sini */}
            </header>
                
                {/* Navbar / Tabs */}
            <div className="tabs-container">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Modal Detail Pesanan */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-gray-800">Detail Pesanan</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 max-h-[70vh] overflow-y-auto">
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Nomor Pesanan</p>
                                <p className="text-sm font-mono font-bold text-green-700">{selectedOrder.no_pesanan || 'PANGAN-12345'}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-800 mb-2">Item yang dibeli:</p>
                                    {selectedOrder.item_pesanan?.map((item: any) => (
                                        <div key={item.id_item} className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600 font-medium">{item.kuantitas}x {item.produk.nama_produk}</span>
                                            <span className="font-semibold text-gray-500">Rp {Number(item.subtotal).toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-3 border-t">
                                    <div className="flex justify-between text-base font-bold">
                                        <span className="text-gray-700">Total Pembayaran</span>
                                        <span className="text-green-600">Rp {Number(selectedOrder.total_harga).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Pop-up */}
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

            {/* List Order Cards */}
            <div className="orders-list">
                {loading ? (
                    <>
                        <OrderSkeleton />
                        <OrderSkeleton />
                        <OrderSkeleton />
                    </>
                ) : orders.length > 0 ? (
                    orders.map((order: any) => {
                        const ui = getStatusUI(order);
                        const firstTwoItems = order.item_pesanan.slice(0, 2);

                        return (
                            <div key={order.id_pesanan} className="order-card">
                                <div className="card-header">
                                    <div className="header-left">
                                        <div className={`icon-wrapper ${ui.bg}`}>
                                            {ui.icon}
                                        </div>
                                        <div>
                                            <p className={`status-text ${ui.color}`}>{ui.label}</p>
                                            <p className="order-id">{order.order_id}</p>
                                        </div>
                                    </div>
                                    <div className="header-right">
                                        <p className="date-label">Order Date</p>
                                        <p className="date-value">{new Date(order.tanggal_pesanan).toLocaleDateString('id-ID')}</p>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="body-left w-full flex flex-col items-start gap-2">
                                        
                                        {/* Memanggil selector produk & tombol nilai */}
                                        <ReviewItemSelector order={order} ui={ui} />

                                        {/* Meta harga & jumlah total */}
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

                                <div className="card-footer">
                                    {ui.status === 'pending_payment' && (
                                        <>
                                            <button className="btn btn-link-red">Batalkan</button>
                                            <button className="btn btn-solid-green">Bayar Sekarang</button>
                                        </>
                                    )}

                                    {ui.status === 'processing' && (
                                        <>
                                            <button className="btn btn-outline-red">Batalkan</button>
                                            <button 
                                                onClick={() => openDetail(order)}
                                                className="btn btn-outline-gray">
                                                Detail Pesanan
                                            </button>
                                            <button 
                                                className="btn btn-solid-black" 
                                                onClick={() => {
                                                    setSelectedOrder(order); // 1. Set data pesanan ke state
                                                    // Memberi sedikit jeda agar React sempat merender isi InvoiceToPrint sebelum diprint
                                                    setTimeout(() => {
                                                    handlePrint(); // 2. Baru panggil fungsi print
                                                    }, 100);
                                                }}
                                                >
                                                Cetak Tagihan
                                            </button>
                                        </>
                                    )}

                                    {ui.status === 'shipping' && (
                                        <>
                                            <button 
                                                onClick={() => openDetail(order)}
                                                className="btn btn-outline-gray">
                                                Detail Pesanan
                                            </button>
                                            <button 
                                                className="btn btn-solid-black" 
                                                onClick={() => {
                                                    setSelectedOrder(order); // 1. Set data pesanan ke state
                                                    // Memberi sedikit jeda agar React sempat merender isi InvoiceToPrint sebelum diprint
                                                    setTimeout(() => {
                                                    handlePrint(); // 2. Baru panggil fungsi print
                                                    }, 100);
                                                }}
                                                >
                                                Cetak Tagihan
                                            </button>
                                        </>
                                    )}

                                    {ui.status === 'completed' && (
                                        <>
                                            <button 
                                                onClick={() => openDetail(order)}
                                                className="btn btn-outline-gray">
                                                Detail Pesanan
                                            </button>
                                            <button className="btn btn-solid-green">Beli Lagi</button>
                                        </>
                                    )}

                                    {ui.status === 'cancelled' && (
                                        <button className="btn btn-outline-gray">Detail Pembatalan</button>
                                    )}
                                </div>
                            </div>
                        );
                    }) // Penutup map
                ) : (
                    <div className="empty-state">Belum ada pesanan.</div> // Penutup kondisi orders.length > 0
                )} 
            </div>
            {totalPages > 1 && (
                <div className="pagination-wrapper">
                    <div className="pagination-info">
                        Menampilkan halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
                    </div>
                    <div className="pagination-buttons">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => {
                                setCurrentPage(prev => prev - 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="pag-btn"
                        >
                            <ChevronLeftIcon /> Previous
                        </button>
                        
                        <div className="page-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        setCurrentPage(num);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`num-btn ${currentPage === num ? 'active' : ''}`}
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
                            className="pag-btn"
                        >
                            Next <ChevronRightIcon />
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