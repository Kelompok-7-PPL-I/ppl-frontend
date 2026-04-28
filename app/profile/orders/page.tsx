"use client";

import Link from 'next/link';

export default function OrdersPage() {
    return (
        <main className="flex-1 p-10 w-full">
        <header className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-extrabold text-gray-800">Orders History</h1>
            <Link href="/dashboard" className="text-[#064E3B] font-bold text-sm hover:underline">
            ← Back to Shop
            </Link>
        </header>

        {/* List Order Dummy */}
        <div className="space-y-4">
            {[1, 2].map((item) => (
            <div key={item} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                <img src="/placeholder.jpg" alt="Product" className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 text-lg">Jagung Manis Organik</h3>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                    Selesai
                    </span>
                </div>
                <p className="text-gray-500 text-sm mb-1">30 September 2025</p>
                <p className="text-[#064E3B] font-bold">Rp 45.000</p>
                </div>
                
                <div className="border-l border-gray-100 pl-6 shrink-0">
                <button className="bg-[#064E3B] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-green-900 transition shadow-sm">
                    Beli Lagi
                </button>
                </div>
            </div>
            ))}
        </div>
        </main>
    );
}