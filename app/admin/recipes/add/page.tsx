"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import "./page.css";

export default function AddRecipePage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // State Monitoring
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // State Form disesuaikan dengan nama kolom di database kamu
  const [form, setForm] = useState({
    judul_resep: "",
    kategori_jenis: "Diet",
    deskripsi_singkat: "",
    bahan_bahan: "",
    langkah_masak: "",
  });

  // State Informasi Gizi (Dynamic List)
  const [nutritionList, setNutritionList] = useState([
    { tipe: "Kalori", nilai: "" }
  ]);

  const categoryOptions = ["Diet", "Weight Gain", "Snack", "High Protein"];
  const nutritionOptions = ["Kalori", "Karbohidrat", "Protein", "Serat", "Lemak", "Gula"];

  // Handlers Input
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

  // Handlers Gizi
  const addNutritionField = () => {
    setNutritionList([...nutritionList, { tipe: "Protein", nilai: "" }]);
  };

  const updateNutrition = (index: number, field: string, value: string) => {
    const newList = [...nutritionList];
    newList[index] = { ...newList[index], [field]: value };
    setNutritionList(newList);
  };

  const removeNutrition = (index: number) => {
    if (nutritionList.length > 1) {
      setNutritionList(nutritionList.filter((_, i) => i !== index));
    }
  };

  // Submit Function
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = "";

      // 1. Upload Gambar ke Storage
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`; // Date.now() di sini aman (client-side)
        const filePath = `recipes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('panganesia')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('panganesia')
          .getPublicUrl(filePath);
        
        finalImageUrl = publicUrl;
      }

      // 2. Gabungkan List Gizi menjadi string
      const giziString = nutritionList
        .filter(n => n.nilai)
        .map(n => `${n.tipe}: ${n.nilai}`)
        .join(", ");

      // 3. Insert ke Supabase (Mapping sesuai kolom DB kamu)
      const { error: insertError } = await supabase
        .from('recipes')
        .insert([{
          judul_resep: form.judul_resep,
          kategori_jenis: form.kategori_jenis,
          deskripsi_singkat: form.deskripsi_singkat,
          bahan_bahan: form.bahan_bahan,
          langkah_masak: form.langkah_masak,
          informasi_gizi: giziString,
          gambar_url: finalImageUrl
        }]);

      if (insertError) throw insertError;

      alert("Resep berhasil dipublikasikan!");
      router.push("/admin/recipes");
      router.refresh();

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-form-page">
      <div className="form-container-wrap">
        <header className="form-view-header">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="btn-back-link"
            suppressHydrationWarning // Menghilangkan error hydration mismatch
          >
            ← Kembali ke Daftar
          </button>
          <h1>Add New Recipe</h1>
        </header>

        <form onSubmit={handleSave} className="main-recipe-form">
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
                <select 
                  name="kategori_jenis" 
                  className="form-select" 
                  value={form.kategori_jenis} 
                  onChange={handleChange}
                >
                  {categoryOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
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

          <div className="form-section-details">
            <div className="field-group">
              <label>Deskripsi Singkat</label>
              <textarea 
                name="deskripsi_singkat" 
                rows={3} 
                value={form.deskripsi_singkat} 
                onChange={handleChange} 
                placeholder="Tulis deskripsi singkat masakan..."
              />
            </div>

            <div className="field-group">
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

            <div className="field-group">
              <label>Bahan-Bahan</label>
              <textarea 
                name="bahan_bahan" 
                rows={6} 
                value={form.bahan_bahan} 
                onChange={handleChange} 
                required 
                placeholder="Masukkan bahan-bahan..."
              />
            </div>

            <div className="field-group">
              <label>Langkah Memasak</label>
              <textarea 
                name="langkah_masak" 
                rows={8} 
                value={form.langkah_masak} 
                onChange={handleChange} 
                required 
                placeholder="Masukkan langkah-langkah memasak..."
              />
            </div>
          </div>

          <div className="form-footer-sticky">
            <button type="submit" className="btn-submit-recipe" disabled={isSubmitting}>
              {isSubmitting ? "Sedang Memproses..." : "Publish Resep"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}