"use client";

import React, { useState, Suspense } from "react";
import { X, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const id_produk = searchParams.get("id_produk");
  const id_item = searchParams.get("id_item");
  const nama_produk = searchParams.get("nama_produk") || "Pesanan Panganesia";

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [hideName, setHideName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const tags = [
    { id: "quality", icon: "🥦", label: "Kualitas Bahan" },
    { id: "freshness", icon: "✨", label: "Kesegaran" },
    { id: "portion", icon: "⚖️", label: "Sesuai Takaran" },
    { id: "packaging", icon: "📦", label: "Pengemasan" },
    { id: "delivery", icon: "🚚", label: "Kecepatan Kirim" },
    { id: "value", icon: "💰", label: "Harga Terjangkau" },
  ];

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.warning("Silakan berikan rating bintang terlebih dahulu.");
      return;
    }
    if (!id_produk) {
      toast.warning("Data produk tidak ditemukan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_produk,
          id_item: parseInt(id_item),
          rating,
          komentar: comment + (selectedTags.length > 0 ? ` [Tags: ${selectedTags.join(", ")}]` : ""),
          is_anonim: hideName
        }),
      });

      if (res.ok) {
        toast.success("Ulasan berhasil dikirim! Terima kasih.");
        window.history.back();
      } else {
        const err = await res.json();
        toast.danger(err.error || "Gagal mengirim ulasan.");
      }
    } catch (error) {
      console.error(error);
      toast.danger("Terjadi kesalahan sistem saat mengirim ulasan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="relative">
        {/* --- NOTIFIKASI (TOAST) --- */}
        {showSuccess && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[999] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-[#3D663D] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[320px]">
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckCircle2 size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">Review Success!</p>
                <p className="text-xs text-white/80">Thank you for the review</p>
              </div>
            </div>
          </div>
        )}

        {/* FORM REVIEW UTAMA */}
        <div className={`w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row transition-all duration-500 ${showSuccess ? 'opacity-50 pointer-events-none scale-[0.98]' : ''}`}>
          
          {/* SISI KIRI: Info & Rating */}
          <div className="md:w-5/12 bg-gray-50 p-6 lg:p-8 border-r border-gray-100 flex flex-col justify-between gap-8">
            <div>
              <button 
                onClick={() => router.back()}
                className="mb-6 flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors text-xs font-semibold uppercase tracking-wider"
              >
                <X size={14} /> Kembali
              </button>

              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl text-green-600">
                  <CheckCircle2 size={24} />
                </div>
                <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900 leading-tight">
                  Bagaimana kualitas <span className="text-green-600 block">{nama_produk}</span>?
                </h2>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200/50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Rating Produk</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-90"
                  >
                    <Star
                      size={32}
                      className={`${star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SISI KANAN: Form */}
          <div className="md:w-7/12 p-6 lg:p-8 flex flex-col gap-6">
            <section>
              <h3 className="text-sm font-bold text-gray-900 mb-4">Apa yang kamu suka?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg border transition-all ${
                      selectedTags.includes(tag.id) ? "border-green-600 bg-green-50 text-green-700 font-bold" : "border-gray-100 text-gray-600"
                    }`}
                  >
                    <span>{tag.icon}</span>
                    <span className="text-[12px]">{tag.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-900 mb-4">Ceritakan pengalamanmu</h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full min-h-[100px] p-4 rounded-xl bg-gray-50 border-none outline-none text-sm text-gray-600 placeholder:text-gray-400"
                placeholder="Misal: Sayurnya masih segar..."
              />
            </section>

            <div className="pt-4 border-t flex flex-col sm:flex-row items-center gap-4">
              <div className="flex flex-col gap-1 w-full">
                  <button onClick={() => setHideName(!hideName)} className="flex items-center gap-3">
                    <div className={`w-9 h-5 rounded-full p-1 transition-colors ${hideName ? 'bg-green-600' : 'bg-gray-300'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${hideName ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-[12px] font-medium text-gray-600">Anonimkan ulasan</span>
                  </button>
              </div>

              <button 
                className={`w-full sm:w-auto font-bold py-3 px-8 rounded-xl text-sm transition-all duration-300
                  ${rating === 0 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" // Warna Abu-abu kalau rating 0
                    : "bg-green-600 text-white hover:bg-green-700 shadow-md active:scale-95" // Warna Hijau kalau sudah isi
                  } 
                  ${(isSubmitting || showSuccess) ? "opacity-70 cursor-wait" : ""}`}
                onClick={handleSubmit}
                disabled={isSubmitting || showSuccess || rating === 0}
              >
                {isSubmitting ? (
                  "Mengirim..."
                ) : showSuccess ? (
                  "Berhasil!"
                ) : rating === 0 ? (
                  "Kirim"
                ) : (
                  "Kirim"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <Suspense fallback={<div className="text-gray-500">Memuat form ulasan...</div>}>
        <ReviewContent />
      </Suspense>
    </div>
  );
}
