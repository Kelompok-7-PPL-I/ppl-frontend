"use client";

import Link from 'next/link';

export default function FavoriteRecipesPage() {
    return (
        <main className="flex-1 p-10 w-full">
            <header className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-extrabold text-gray-800">Favorite Recipes</h1>
                <Link href="/dashboard" className="text-[#064E3B] font-bold text-sm hover:underline">
                    ← Back to Shop
                </Link>
            </header>

            {/* Grid Resep Favorit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center hover:shadow-md transition-shadow">
                        <div className="w-24 h-24 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                            <img src="/placeholder.jpg" alt="Recipe" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-800 text-lg mb-1">Jagung Susu Keju</h3>
                                <button className="text-red-500 hover:scale-110 transition text-xl">❤️</button>
                            </div>
                            <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                                Resep mudah membuat Jasuke lumer yang enak dinikmati saat hangat...
                            </p>
                            <button className="text-[#064E3B] text-sm font-bold hover:underline">
                                Lihat Resep →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}