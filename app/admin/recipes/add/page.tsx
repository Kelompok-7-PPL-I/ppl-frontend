"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function AddRecipePage() {
  const router = useRouter();
  const { toast } = useToast();

  // ── State Form ──────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    judul_resep: "",
    kategori_jenis: "Diet",
    deskripsi_singkat: "",
    langkah_masak: "",
    waktu_masak: "",  // ← tambah
  });

  // ── State Gizi ───────────────────────────────────────────────
  const [nutritionList, setNutritionList] = useState([{ tipe: "Kalori", nilai: "" }]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  // ── Handler Gizi ─────────────────────────────────────────────
  const addNutritionField = () => setNutritionList([...nutritionList, { tipe: "Protein", nilai: "" }]);
  const updateNutrition = (index: number, field: string, value: string) => {
    const newList = [...nutritionList];
    newList[index] = { ...newList[index], [field]: value };
    setNutritionList(newList);
  };
  const removeNutrition = (index: number) => {
    if (nutritionList.length > 1) setNutritionList(nutritionList.filter((_, i) => i !== index));
  };

  // ── Submit ───────────────────────────────────────────────────
  const bahanTanpaTakaran = bahanDipilih.filter(b => !b.takaran || Number(b.takaran) <= 0);
    if (bahanTanpaTakaran.length > 0) {
      toast.danger(`Isi takaran untuk: ${bahanTanpaTakaran.map(b => b.nama_produk).join(", ")}`);
      setIsSubmitting(false);
      return;
    }
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalImageUrl = "";

      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `recipes/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('panganesia').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('panganesia').getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      }

      const giziString = nutritionList.filter(n => n.nilai).map(n => `${n.tipe}: ${n.nilai}`).join(", ");

      // Insert resep
      const { data: resepData, error: insertError } = await supabase
        .from('resep')
        .insert([{
          judul_resep: form.judul_resep,
          kategori_jenis: form.kategori_jenis,
          deskripsi_singkat: form.deskripsi_singkat,
          langkah_masak: form.langkah_masak,
          informasi_gizi: giziString,
          gambar_url: finalImageUrl,
          waktu_masak: form.waktu_masak ? Number(form.waktu_masak) : null, // ← tambah
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Insert bahan ke resep_bahan_produk
      if (bahanDipilih.length > 0 && resepData) {
        const bahanRows = bahanDipilih
          .filter(b => b.takaran !== "")
          .map(b => ({
            id_resep: resepData.id_resep,
            id_produk: b.id_produk,
            takaran_resep: parseFloat(b.takaran) || 0,
          }));
        if (bahanRows.length > 0) {
          const { error: bahanError } = await supabase.from('resep_bahan_produk').insert(bahanRows);
          if (bahanError) throw bahanError;
        }
      }

      toast.success("Resep berhasil dipublikasikan!");
      router.push("/admin/recipes");
      router.refresh();
    } catch (err: any) {
      toast.danger("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-form-page">
      <div className="form-container-wrap">
        <header className="form-view-header">
          <button type="button" onClick={() => router.back()} className="btn-back-link" suppressHydrationWarning>
            ← Kembali ke Daftar
          </button>
          <h1>Tambah Resep Baru</h1>
        </header>

        <form onSubmit={handleSave} className="main-recipe-form">

          {/* ── Top Section: Judul + Foto ── */}
          <div className="form-section-top">
            <div className="inputs-main">
              <div className="field-group">
                <label>Judul Resep</label>
                <input
                  name="judul_resep"
                  className="input-judul-huge"
                  placeholder="Contoh: Salad Ayam Panggang..."
                  value={form.judul_resep}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="field-group">
                <label>Kategori Program</label>
                <select name="kategori_jenis" className="form-select" value={form.kategori_jenis} onChange={handleChange}>
                  {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="field-group">
              <label>Durasi Masak</label>
              <div style={{ position: "relative" }}>
                <input
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
                Pilih Foto Resep
                <input type="file" accept="image/*" onChange={handleFileChange} />
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
                  <input placeholder="Contoh: 250 kkal / 15g" value={item.nilai} onChange={(e) => updateNutrition(index, 'nilai', e.target.value)} />
                  <button type="button" className="btn-remove-gizi" onClick={() => removeNutrition(index)}>×</button>
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
                        type="number"
                        className="bahan-takaran-input"
                        placeholder="gram"
                        value={b.takaran}
                        onChange={e => updateTakaran(b.id_produk, e.target.value)}
                        min="0"
                      />
                      <span className="bahan-satuan">gram</span>
                      <button type="button" className="bahan-remove-btn" onClick={() => removeBahan(b.id_produk)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tombol buka/tutup katalog */}
            <button type="button" className="btn-open-katalog" onClick={() => setShowKatalog(v => !v)}>
              {showKatalog ? "✕ Tutup Katalog" : "+ Tambah Bahan dari Katalog"}
            </button>

            {/* Panel katalog produk */}
            {showKatalog && (
              <div className="katalog-panel">
                <input
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

          {/* ── Langkah Memasak ── */}
          <div className="field-group">
            <label>Langkah Memasak</label>
            <textarea
              name="langkah_masak"
              rows={12}
              value={form.langkah_masak}
              onChange={handleChange}
              required
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
              {isSubmitting ? "Sedang Memproses..." : "Publikasikan Resep"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}