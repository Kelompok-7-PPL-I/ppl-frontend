"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import "./page.css"; 

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditRecipePage() {
  const router = useRouter();
  const { id } = useParams(); 

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // --- Tambahkan State & Opsi Gizi ---
  const [nutritionList, setNutritionList] = useState<{ tipe: string; nilai: string }[]>([]);
  const nutritionOptions = ["Kalori", "Karbohidrat", "Protein", "Serat", "Lemak", "Gula"];

  const [form, setForm] = useState({
    judul_resep: "",
    kategori_jenis: "Diet",
    informasi_gizi: "",
    deskripsi_singkat: "",
    bahan_bahan: "",
    langkah_masak: "",
    gambar_url: ""
  });

  // --- Fungsi Kelola Gizi ---
  const addNutritionField = () => {
    setNutritionList([...nutritionList, { tipe: "Kalori", nilai: "" }]);
  };

  const removeNutrition = (index: number) => {
    setNutritionList(nutritionList.filter((_, i) => i !== index));
  };

  const updateNutrition = (index: number, field: string, value: string) => {
    const newList = [...nutritionList];
    newList[index] = { ...newList[index], [field]: value };
    setNutritionList(newList);
  };

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
        setForm({
          judul_resep: data.judul_resep,
          kategori_jenis: data.kategori_jenis,
          deskripsi_singkat: data.deskripsi_singkat,
          informasi_gizi: data.informasi_gizi,
          bahan_bahan: data.bahan_bahan,
          langkah_masak: data.langkah_masak,
          gambar_url: data.gambar_url
        });
        setPreview(data.gambar_url);

        // Parsing Informasi Gizi (String ke Array)
        // Contoh: "Kalori: 250 kkal, Protein: 10g" -> [{tipe: "Kalori", nilai: "250 kkal"}, ...]
        if (data.informasi_gizi && data.informasi_gizi !== "-") {
          const parts = data.informasi_gizi.split(", ");
          const parsed = parts.map((p: string) => {
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
      alert("Resep tidak ditemukan!");
      router.push("/admin/recipes");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) fetchRecipe();
  }, [id, fetchRecipe]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = form.gambar_url;

      if (file) {
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('panganesia')
          .upload(`recipes/${fileName}`, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('panganesia')
          .getPublicUrl(`recipes/${fileName}`);
        
        finalImageUrl = publicUrl;
      }

      // Gabungkan Array Gizi menjadi String untuk DB
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
          bahan_bahan: form.bahan_bahan,
          langkah_masak: form.langkah_masak,
          gambar_url: finalImageUrl
        })
        .eq('id_resep', id);

      if (error) throw error;

      alert("Resep berhasil diupdate!");
      router.push("/admin/recipes");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p style={{ padding: "40px" }}>Memuat data resep...</p>;

  return (
    <div className="admin-form-page">
      <div className="form-container-wrap" style={{ maxWidth: '1000px' }}>
        <header className="form-view-header">
          <button type="button" onClick={() => router.back()} className="btn-back-link">
            ← Batal
          </button>
          <h1>Edit Resep: {form.judul_resep}</h1>
        </header>

        <form onSubmit={handleUpdate} className="main-recipe-form">
          <div className="form-section-top">
            <div className="inputs-main">
              <div className="field-group">
                <label>Judul Resep</label>
                <input 
                  name="judul_resep" 
                  className="input-judul-huge"
                  value={form.judul_resep} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="field-group">
                <label>Kategori</label>
                <select name="kategori_jenis" className="form-select" value={form.kategori_jenis} onChange={handleChange}>
                  <option value="Diet">Diet</option>
                  <option value="Weight Gain">Weight Gain</option>
                  <option value="Snack">Snack</option>
                  <option value="High Protein">High Protein</option>
                </select>
              </div>
            </div>

            <div className="upload-preview-side">
              <div className="preview-display">
                {preview ? <img src={preview} alt="Preview" /> : <div className="placeholder">No Image</div>}
              </div>
              <label className="btn-upload-label">
                Ganti Foto
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
                }} />
              </label>
            </div>
          </div>

          {/* --- Bagian Gizi yang Sudah Dibenerin --- */}
          <div className="field-group" style={{ marginBottom: '24px' }}>
            <label>Informasi Gizi</label>
            <div className="nutrition-input-area">
              {nutritionList.map((item, index) => (
                <div key={index} className="nutrition-row">
                  <select 
                    value={item.tipe} 
                    onChange={(e) => updateNutrition(index, 'tipe', e.target.value)}
                  >
                    {nutritionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <input 
                    placeholder="Contoh: 250 kkal / 15g" 
                    value={item.nilai}
                    onChange={(e) => updateNutrition(index, 'nilai', e.target.value)}
                  />
                  <button type="button" className="btn-remove-gizi" onClick={() => removeNutrition(index)}>×</button>
                </div>
              ))}
              <button type="button" className="btn-add-gizi" onClick={addNutritionField}>
                + Tambah Baris Gizi
              </button>
            </div>
          </div>

          <div className="form-section-details">
            <div className="field-group">
              <label>Deskripsi Singkat</label>
              <textarea name="deskripsi_singkat" rows={3} value={form.deskripsi_singkat} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>Bahan-Bahan</label>
              <textarea name="bahan_bahan" rows={6} value={form.bahan_bahan} onChange={handleChange} required />
            </div>
            <div className="field-group">
              <label>Langkah Memasak</label>
              <textarea name="langkah_masak" rows={8} value={form.langkah_masak} onChange={handleChange} required />
            </div>
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