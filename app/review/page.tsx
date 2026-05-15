"use client";

import React, { useState, Suspense } from "react";
import { X, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";

function ReviewContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const id_produk = searchParams.get("id_produk");
  const nama_produk = searchParams.get("nama_produk") || "Pesanan Panganesia";

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [hideName, setHideName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          rating,
          komentar: comment + (selectedTags.length > 0 ? ` [Tags: ${selectedTags.join(", ")}]` : "")
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
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="relative p-4 flex items-start border-b border-gray-100">
        <button 
          className="absolute left-4 top-4 text-gray-500 hover:text-gray-700 transition-colors"
          onClick={() => window.history.back()}
        >
          <X size={24} />
        </button>
        <div className="w-full text-center mt-1 px-8">
          <h2 className="font-semibold text-gray-900 text-[17px] truncate" title={nama_produk}>
            {nama_produk}
          </h2>
          <p className="text-gray-500 text-[13px] mt-0.5">
            Beri ulasan untuk pesananmu
          </p>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-8">
        {/* Rating Section */}
        <div className="flex flex-col items-center gap-4">
          <h3 className="font-bold text-[16px] text-gray-900">
            Bagaimana kualitas pesananmu?
          </h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform active:scale-95"
              >
                <svg
                  className={`w-10 h-10 ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-400 drop-shadow-sm"
                      : "text-gray-200"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Tags Section */}
        <div className="flex flex-col items-center gap-4">
          <h3 className="font-bold text-[16px] text-gray-900 text-center">
            Apa yang kamu suka dari pesanan ini?
          </h3>
          <div className="flex flex-wrap justify-center gap-2.5">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                    isSelected
                      ? "border-green-600 bg-green-50 text-green-700 font-medium"
                      : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                  }`}
                >
                  <span className="text-[16px]">{tag.icon}</span>
                  <span className="text-[14px]">{tag.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Comment Section */}
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-[16px] text-gray-900 text-center">
            Ceritakan lebih lanjut!
          </h3>
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bahan-bahannya sangat segar dan sesuai takaran!"
              className="w-full min-h-[120px] p-4 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none resize-none text-[15px] placeholder:text-gray-400"
              maxLength={4000}
            />
            <div className="text-gray-400 text-[13px] mt-1 text-left">
              {comment.length}/4000
            </div>
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Toggle and Submit Section */}
      <div className="p-4 flex flex-col gap-4 bg-white relative z-10">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <EyeOff size={20} className="text-gray-700" />
            <span className="text-[14px]">Sembunyikan nama saya pada ulasan</span>
          </div>
          
          <button
            onClick={() => setHideName(!hideName)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
              hideName ? "bg-green-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                hideName ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <button 
          className="w-full bg-[#169C2A] hover:bg-[#128221] text-white font-bold py-3.5 rounded-full text-[16px] transition-colors mt-2 disabled:bg-gray-400"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Mengirim..." : "Kirim Ulasan"}
        </button>
        
        <p className="text-center text-[11px] text-gray-500 mt-1 pb-2">
          Dengan mengirim, Anda menyetujui{" "}
          <a href="#" className="text-[#169C2A] hover:underline">
            Syarat & Ketentuan
          </a>{" "}
          dan{" "}
          <a href="#" className="text-[#169C2A] hover:underline">
            Kebijakan Privasi
          </a>
          .
        </p>
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
