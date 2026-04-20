"use client";

import Link from 'next/link';

export default function FavoriteProductsPage() {
    return (
        <main className="flex-1 p-10 w-full">
            <header className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-extrabold text-gray-800">Favorite Products</h1>
                <Link href="/dashboard" className="text-[#064E3B] font-bold text-sm hover:underline">
                    ← Back to Shop
                </Link>
            </header>

            {/* Grid Produk Favorit */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((item) => (
                    <div key={item} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative h-48 w-full bg-gray-200">
                            <img src="/placeholder.jpg" alt="Product" className="w-full h-full object-cover" />
                            {/* Tombol Hati */}
                            <button className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-500 shadow-md hover:scale-110 transition-transform">
                                ❤️
                            </button>
                        </div>
                        
                        <div className="p-4 flex flex-col">
                            <h3 className="font-bold text-gray-800 text-lg mb-1">Jagung Manis</h3>
                            <p className="text-gray-600 text-sm mb-4 font-medium">Rp 15.000</p>
                            
                            {/* Tombol Buy Now di bawah */}
                            <button className="w-full py-2 bg-[#064E3B] text-white rounded-lg text-sm font-bold hover:bg-green-900 transition shadow-sm mt-auto">
                                Buy Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}