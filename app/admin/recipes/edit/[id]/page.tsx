"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from "@/app/context/ToastContext";
import "./page.css";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProdukKatalog {
  id_produk: number;
  nama_produk: string;
  gambar_url: string;
}

interface BahanDipilih {
  id_produk: number;
  nama_produk: string;
  gambar_url: string;
  takaran: string;
}

export default function EditRecipePage() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();

  // ── State Form ───────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    judul_resep: "",
    kategori_jenis: "",
    informasi_gizi: "",
    deskripsi_singkat: "",
    langkah_masak: "",
    gambar_url: "",
    waktu_masak: "",  
    bahan_bahan: "", 
  });

  // ── State Gizi ───────────────────────────────────────────────
  const [nutritionList, setNutritionList] = useState<{ tipe: string; nilai: string }[]>([]);
  const categoryOptions = ["Diet", "Weight Gain", "Snack", "High Protein"];
  const nutritionOptions = [
    "Kalori",
    "Karbohidrat",
    "Protein",
    "Serat",
    "Lemak",
    "Gula",
    "Sodium",
    "Vitamin A",
    "Vitamin B",
    "Vitamin C",
    "Vitamin D",
    "Vitamin E",
    "Kalsium",
    "Zat Besi",
    "Fosfor",
    "Magnesium",
    "Zinc",
    "Kolesterol",
  ];

  // ── State Katalog Produk / Bahan ─────────────────────────────
  const [produkList, setProdukList] = useState<ProdukKatalog[]>([]);
  const [bahanDipilih, setBahanDipilih] = useState<BahanDipilih[]>([]);
  const [searchProduk, setSearchProduk] = useState("");
  const [showKatalog, setShowKatalog] = useState(false);

  // ── Fetch Produk ─────────────────────────────────────────────
  useEffect(() => {
    const fetchProduk = async () => {
      const { data } = await supabase
        .from("produk")
        .select("id_produk, nama_produk, gambar_url")
        .order("nama_produk");
      setProdukList(data || []);
    };
    fetchProduk();
  }, []);

  // ── Fetch Bahan yang sudah ada di resep ini ──────────────────
  const fetchBahanResep = useCallback(async (id_resep: string | string[]) => {
    const { data } = await supabase
      .from("resep_bahan_produk")
      .select("*, produk(nama_produk, gambar_url)")
      .eq("id_resep", id_resep);

    if (data) {
      const mapped: BahanDipilih[] = data.map((b: any) => ({
        id_produk: b.id_produk,
        nama_produk: b.produk?.nama_produk || `Produk #${b.id_produk}`,
        gambar_url: b.produk?.gambar_url || "",
        takaran: String(b.takaran_resep ?? ""),
      }));
      setBahanDipilih(mapped);
    }
  }, []);

  // ── Fetch Resep ──────────────────────────────────────────────
  const fetchRecipe = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('resep')
        .select('*')
        .eq('id_resep', id)
        .single();

      if (error) throw error;

      if (data) {
        // Normalize \n literal string → actual newline (data lama mungkin tersimpan sebagai "\\n")
        const normalizeNewlines = (str: string | null) =>
          (str ?? "").replace(/\\n/g, "\n");

        setForm({
          judul_resep: data.judul_resep,
          kategori_jenis: data.kategori_jenis,
          deskripsi_singkat: normalizeNewlines(data.deskripsi_singkat),
          informasi_gizi: data.informasi_gizi,
          langkah_masak: normalizeNewlines(data.langkah_masak),
          gambar_url: data.gambar_url,
          waktu_masak: data.waktu_masak != null ? String(data.waktu_masak) : "",
          bahan_bahan: normalizeNewlines(data.bahan_bahan),
        });
        setPreview(data.gambar_url);

        if (data.informasi_gizi && data.informasi_gizi !== "-") {
          const parsed = data.informasi_gizi.split(", ").map((p: string) => {
            const [tipe, nilai] = p.split(": ");
            return { tipe: tipe || "Kalori", nilai: nilai || "" };
          });
          setNutritionList(parsed);
        } else {
          setNutritionList([{ tipe: "Kalori", nilai: "" }]);
        }
      }
    } catch (err: any) {
      console.error("Error:", err.message);
      toast.warning("Resep tidak ditemukan!");
      router.push("/admin/recipes");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
      fetchRecipe();
      fetchBahanResep(id);
    }
  }, [id, fetchRecipe, fetchBahanResep]);

  // ── Handler Katalog ──────────────────────────────────────────
  const toggleProduk = (p: ProdukKatalog) => {
    const exists = bahanDipilih.find(b => b.id_produk === p.id_produk);
    if (exists) {
      setBahanDipilih(prev => prev.filter(b => b.id_produk !== p.id_produk));
    } else {
      setBahanDipilih(prev => [...prev, { ...p, takaran: "" }]);
    }
  };

  const updateTakaran = (id_produk: number, val: string) => {
    setBahanDipilih(prev =>
      prev.map(b => b.id_produk === id_produk ? { ...b, takaran: val } : b)
    );
  };

  const removeBahan = (id_produk: number) => {
    setBahanDipilih(prev => prev.filter(b => b.id_produk !== id_produk));
  };

  const produkFiltered = produkList.filter(p =>
    p.nama_produk.toLowerCase().includes(searchProduk.toLowerCase())
  );

  // ── Handler Form ─────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ── Handler Gizi ─────────────────────────────────────────────
  const addNutritionField = () => setNutritionList([...nutritionList, { tipe: "Protein", nilai: "" }]);
  const removeNutrition = (index: number) => {
    if (nutritionList.length > 1) setNutritionList(nutritionList.filter((_, i) => i !== index));
  };
  const updateNutrition = (index: number, field: string, value: string) => {
    const newList = [...nutritionList];
    newList[index] = { ...newList[index], [field]: value };
    setNutritionList(newList);
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
          if (!form.judul_resep.trim()) {
        toast.warning("Judul resep wajib diisi!");
        return;
      }
      if (!form.kategori_jenis) {
        toast.warning("Kategori program wajib dipilih!");
        return;
      }
      if (!form.deskripsi_singkat.trim()) {
        toast.warning("Deskripsi singkat wajib diisi!");
        return;
      }
      if (!form.waktu_masak.trim() || isNaN(Number(form.waktu_masak)) || Number(form.waktu_masak) <= 0) {
        toast.warning("Durasi masak wajib diisi dan harus berupa angka positif!");
        return;
      }
      if (bahanDipilih.length === 0) {
        toast.warning("Minimal satu bahan dari katalog wajib dipilih!");
        return;
      }

      if (!form.langkah_masak.trim()) {
        toast.warning("Langkah memasak wajib diisi!");
        return;
      }

    // ← Validasi bahan tanpa takaran, sesuai add
    const bahanTanpaTakaran = bahanDipilih.filter(b => !b.takaran || Number(b.takaran) <= 0);
    if (bahanTanpaTakaran.length > 0) {
      toast.danger(`Isi takaran untuk: ${bahanTanpaTakaran.map(b => b.nama_produk).join(", ")}`);
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = form.gambar_url;

      if (file) {
        const fileName = `recipes/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('panganesia').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('panganesia').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }

      const giziString = nutritionList
        .filter(n => n.nilai.trim() !== "")
        .map(n => `${n.tipe}: ${n.nilai}`)
        .join(", ");

      const { error } = await supabase
        .from('resep')
        .update({
          judul_resep: form.judul_resep,
          kategori_jenis: form.kategori_jenis,
          deskripsi_singkat: form.deskripsi_singkat,
          informasi_gizi: giziString || "-",
          langkah_masak: form.langkah_masak,
          gambar_url: finalImageUrl,
          waktu_masak: form.waktu_masak ? Number(form.waktu_masak) : null,  
          bahan_bahan: form.bahan_bahan,
        })
        .eq('id_resep', id);

      if (error) throw error;

      // Update bahan: hapus lama, insert baru
      await supabase.from('resep_bahan_produk').delete().eq('id_resep', id);
      const bahanRows = bahanDipilih
        .filter(b => b.takaran !== "")
        .map(b => ({
          id_resep: id,
          id_produk: b.id_produk,
          takaran_resep: parseFloat(b.takaran) || 0,
        }));
      if (bahanRows.length > 0) {
        const { error: bahanError } = await supabase.from('resep_bahan_produk').insert(bahanRows);
        if (bahanError) throw bahanError;
      }

      toast.success("Resep berhasil diupdate!");
      router.push("/admin/recipes");
      router.refresh();
    } catch (err: any) {
      toast.danger("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p style={{ padding: "40px" }}>Memuat data resep...</p>;

  return (
    <div className="admin-form-page">
      <div className="form-container-wrap">
        <header className="form-view-header">
          <button type="button" onClick={() => router.back()} className="btn-back-link">
            ← Batal
          </button>
          <h1>Edit Resep: {form.judul_resep}</h1>
        </header>

        <form onSubmit={handleUpdate} className="main-recipe-form">

          {/* ── Top Section: Judul + Foto ── */}
          <div className="form-section-top">
            <div className="inputs-main">
              <div className="field-group">
                <label>Judul Resep</label>
                <input
                  suppressHydrationWarning
                  name="judul_resep"
                  className="input-judul-huge"
                  placeholder="Contoh: Salad Ayam Panggang..."
                  value={form.judul_resep}
                  onChange={handleChange}
                />
              </div>
              <div className="field-group">
                <label>Kategori Program</label>
                <select name="kategori_jenis" className="form-select" value={form.kategori_jenis} onChange={handleChange}>
                  <option value="" disabled>-- Pilih Kategori --</option>
                  {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              {/* ← Durasi Masak ditambahkan, sesuai add */}
              <div className="field-group">
                <label>Durasi Masak</label>
                <div style={{ position: "relative" }}>
                  <input
                    suppressHydrationWarning
                    name="waktu_masak"
                    type="number"
                    min="1"
                    placeholder="Contoh: 30"
                    value={form.waktu_masak}
                    onChange={handleChange}
                    style={{ paddingRight: "56px" }}
                  />
                  <span style={{
                    position: "absolute", right: 16, top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 13, fontWeight: 700, color: "#888",
                  }}>
                    menit
                  </span>
                </div>
              </div>
            </div>
            <div className="upload-preview-side">
              <div className="preview-display">
                {preview ? <img src={preview} alt="Preview" /> : <span className="placeholder-text">Belum ada foto</span>}
              </div>
              <label className="btn-upload-label">
                Ganti Foto
                <input suppressHydrationWarning type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
                }} />
              </label>
            </div>
          </div>

          <hr className="form-divider" />

          {/* ── Deskripsi ── */}
          <div className="field-group">
            <label>Deskripsi Singkat</label>
            <textarea name="deskripsi_singkat" rows={3} value={form.deskripsi_singkat} onChange={handleChange} placeholder="Tulis deskripsi singkat masakan..." />
          </div>

          {/* ── Informasi Gizi ── */}
          <div className="field-group">
            <label>Informasi Gizi</label>
            <div className="nutrition-input-area">
              {nutritionList.map((item, index) => (
                <div key={index} className="nutrition-row">
                  <select value={item.tipe} onChange={(e) => updateNutrition(index, 'tipe', e.target.value)}>
                    {nutritionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <input suppressHydrationWarning placeholder="Contoh: 250 kkal / 15g" value={item.nilai} onChange={(e) => updateNutrition(index, 'nilai', e.target.value)} />
                  <button type="button" className="btn-remove-gizi" onClick={() => removeNutrition(index)}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
              <button type="button" className="btn-add-gizi" onClick={addNutritionField}>+ Tambah Baris Gizi</button>
            </div>
          </div>

          {/* ── Bahan dari Katalog Produk ── */}
          <div className="field-group">
            <label>Bahan-Bahan</label>

            {/* Bahan yang sudah dipilih */}
            {bahanDipilih.length > 0 && (
              <div className="bahan-dipilih-list">
                {bahanDipilih.map(b => (
                  <div key={b.id_produk} className="bahan-dipilih-row">
                    <div className="bahan-dipilih-info">
                      {b.gambar_url && <img src={b.gambar_url} alt={b.nama_produk} className="bahan-dipilih-img" />}
                      <span className="bahan-dipilih-nama">{b.nama_produk}</span>
                    </div>
                    <div className="bahan-dipilih-input-wrap">
                      <input
                        suppressHydrationWarning
                        type="number"
                        className="bahan-takaran-input"
                        placeholder="0"
                        value={b.takaran}
                        onChange={e => updateTakaran(b.id_produk, e.target.value)}
                        min="0"
                      />
                      <span className="bahan-satuan">gram</span>
                      <button type="button" className="bahan-remove-btn" onClick={() => removeBahan(b.id_produk)}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tombol buka/tutup katalog */}
            <button type="button" className="btn-open-katalog" onClick={() => setShowKatalog(v => !v)}>
              {showKatalog ? "✕ Tutup Katalog" : "+ Tambah / Ubah Bahan dari Katalog"}
            </button>

            {/* Panel katalog produk */}
            {showKatalog && (
              <div className="katalog-panel">
                <input
                  suppressHydrationWarning
                  className="katalog-search"
                  placeholder="Cari produk..."
                  value={searchProduk}
                  onChange={e => setSearchProduk(e.target.value)}
                />
                <div className="katalog-grid">
                  {produkFiltered.length === 0 && (
                    <p className="katalog-empty">Produk tidak ditemukan.</p>
                  )}
                  {produkFiltered.map(p => {
                    const dipilih = bahanDipilih.some(b => b.id_produk === p.id_produk);
                    return (
                      <div
                        key={p.id_produk}
                        className={`katalog-item ${dipilih ? "katalog-item--selected" : ""}`}
                        onClick={() => toggleProduk(p)}
                      >
                        <div className="katalog-item-img-wrap">
                          {p.gambar_url
                            ? <img src={p.gambar_url} alt={p.nama_produk} className="katalog-item-img" />
                            : <div className="katalog-item-img-placeholder" />
                          }
                          {dipilih && <div className="katalog-item-check">✓</div>}
                        </div>
                        <span className="katalog-item-nama">{p.nama_produk}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="field-group">
            <label>Alat & Bahan</label>
            <textarea
              name="bahan_bahan"
              rows={6}
              value={form.bahan_bahan}
              onChange={handleChange}
              placeholder={"1. Bahan pertama...\n2. Alat kedua..."}
              style={{ whiteSpace: "pre-wrap", lineHeight: "1.8", resize: "vertical", minHeight: "140px" }}
            />
          </div>

          {/* ── Langkah Memasak ── */}
          <div className="field-group">
            <label>Langkah Memasak</label>
            <textarea
              name="langkah_masak"
              rows={12}
              value={form.langkah_masak}
              onChange={handleChange}
              placeholder={"1. Langkah pertama...\n2. Langkah kedua...\n3. Langkah ketiga..."}
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: "1.8",
                resize: "vertical",
                minHeight: "200px",
              }}
            />
          </div>

          <div className="form-footer-sticky">
            <button type="submit" className="btn-submit-recipe" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}