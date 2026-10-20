"use client";

import { useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";
import styles from "./RecommendationDataCard.module.css";

/** Panel admin: generate ulang item vector semua resep & produk (POST /api/recommendations/rebuild) */
export default function RecommendationDataCard() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{ recipes: number; products: number; at: Date } | null>(null);

  const rebuild = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/recommendations/rebuild", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.danger(
          "Gagal memperbarui data rekomendasi",
          res.status === 403 ? "Hanya admin yang boleh menjalankan ini." : data?.error ?? "Coba lagi sebentar."
        );
        return;
      }
      setLastResult({ recipes: data.recipes, products: data.products, at: new Date() });
      toast.success("Data rekomendasi diperbarui", `${data.recipes} resep dan ${data.products} produk sudah dihitung ulang.`);
    } catch {
      toast.danger("Gagal memperbarui data rekomendasi", "Koneksi bermasalah. Coba lagi.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className={styles.card} aria-labelledby="reco-data-title">
      <span className={styles.icon} aria-hidden="true">
        <Sparkles size={20} />
      </span>
      <div className={styles.text}>
        <h2 id="reco-data-title" className={styles.title}>Data rekomendasi</h2>
        <p className={styles.desc}>
          Hitung ulang vektor semua resep dan produk. Jalankan setelah mengubah info gizi, bahan resep, kategori resep, atau
          kelompok produk.
        </p>
        {lastResult && (
          <p className={styles.result} role="status">
            Terakhir: {lastResult.recipes} resep & {lastResult.products} produk,{" "}
            {lastResult.at.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
      <button type="button" className={styles.button} onClick={rebuild} disabled={running}>
        <RefreshCw size={16} className={running ? styles.spin : undefined} aria-hidden="true" />
        {running ? "Memproses…" : "Perbarui data"}
      </button>
    </section>
  );
}
