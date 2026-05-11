import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export default async function OrdersPage() {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as any).id) {
        return (
            <main className="flex-1 p-10 w-full flex items-center justify-center">
                <p className="text-gray-500 font-medium">Silakan login terlebih dahulu untuk melihat pesanan.</p>
            </main>
        );
    }

    const userId = (session.user as any).id;

    const orders = await prisma.pesanan.findMany({
        where: { id_user: userId },
        orderBy: { tanggal_pesanan: 'desc' },
        include: {
            item_pesanan: {
                include: {
                    produk: true
                }
            }
        }
    });

    return (
        <main className="flex-1 p-10 w-full bg-white">
            <header className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-extrabold text-gray-800">Riwayat Pesanan</h1>
                <Link href="/profile" className="text-[#064E3B] font-bold text-sm hover:underline">
                    ← Kembali ke Profil
                </Link>
            </header>

            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500 italic">Belum ada pesanan.</p>
                    </div>
                ) : (
                    orders.map((order) => {
                        // Ambil item pertama untuk preview
                        const firstItem = order.item_pesanan[0];
                        const produk = firstItem?.produk;
                        
                        // Cek apakah pesanan selesai untuk menampilkan tombol Review
                        const isSelesai = order.order_status?.toLowerCase() === 'selesai' || order.status_pembayaran?.toLowerCase() === 'dibayar';

                        return (
                            <div key={order.id_pesanan} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-md transition-shadow">
                                <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                                    <img 
                                        src={produk?.gambar_url || "/images/placeholder.jpg"} 
                                        alt={produk?.nama_produk || "Produk"} 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-800 text-lg">
                                            {produk?.nama_produk || "Pesanan Produk"}
                                            {order.item_pesanan.length > 1 && (
                                                <span className="text-sm font-normal text-gray-500 ml-2">
                                                    +{order.item_pesanan.length - 1} produk lainnya
                                                </span>
                                            )}
                                        </h3>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                            isSelesai 
                                                ? "bg-green-100 text-green-800 border-green-200" 
                                                : "bg-orange-100 text-orange-800 border-orange-200"
                                        }`}>
                                            {order.order_status || order.status_pembayaran}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-1">
                                        {new Date(order.tanggal_pesanan).toLocaleDateString('id-ID', {
                                            day: 'numeric', month: 'long', year: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-[#064E3B] font-bold">
                                        Rp {Number(order.total_harga).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                
                                <div className="border-l border-gray-100 pl-6 shrink-0 flex flex-col gap-2">
                                    {isSelesai && produk && (
                                        <Link 
                                            href={`/review?id_produk=${produk.id_produk}&nama_produk=${encodeURIComponent(produk.nama_produk)}`}
                                            className="block text-center bg-white border-2 border-[#169C2A] text-[#169C2A] px-6 py-2 rounded-lg font-bold text-sm hover:bg-green-50 transition shadow-sm"
                                        >
                                            Beri Ulasan
                                        </Link>
                                    )}
                                    <Link 
                                        href="/DashboardProduct"
                                        className="block text-center bg-[#064E3B] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-green-900 transition shadow-sm"
                                    >
                                        Beli Lagi
                                    </Link>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
}