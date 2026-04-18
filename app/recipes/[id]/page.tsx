import Image from "next/image";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from '@/utils/supabase/client';
import BackButton from "./BackButton";
import "./page.css";

// Konfigurasi Font Plus Jakarta Sans
const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"]
});

// 1. Ubah tipe params menjadi Promise dan tambahkan 'async' di depan function
export default async function RecipeDetail({ params }: { params: Promise<{ id: string }> }) {
  
  // 2. Gunakan 'await' untuk membuka nilai dari params
  const resolvedParams = await params;
  const supabase = await createClient();

  // 1. Fetch data dari Supabase berdasarkan id_recipe
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id_recipe', resolvedParams.id)
    .single();

  // Handling jika resep tidak ditemukan atau error
  if (error || !recipe) {
    return (
      <div className={`not-found ${plusJakartaSans.className}`}>
        <h2>Resep tidak ditemukan!</h2>
        <Link href="/recipes">Kembali ke Daftar Resep</Link>
      </div>
    );
  }

  // Olah data bahan-bahan
  const ingredientsArray = recipe.bahan_bahan ? recipe.bahan_bahan.split(',') : [];

  // Olah langkah
  const stepsArray = recipe.langkah_masak ? recipe.langkah_masak.split(/\\n|\n/) : [];

  // Olah data Informasi Gizi untuk section baru
  const nutritionItems = recipe.informasi_gizi ? recipe.informasi_gizi.split(',') : [];

  // Ambil tag utama dari gizi (untuk pill di atas)
  const mainNutritionTag = nutritionItems.length > 0 ? nutritionItems[0].split(':')[0].trim() : "";

  return (
    <main className={`recipe-detail-page ${plusJakartaSans.className}`}>
      {/* HEADER */}
      <header className="detail-header">
        <BackButton />
        <div className="logo-wrapper">
          <Image 
            src="/images/logo.png" 
            alt="Logo" 
            width={40} 
            height={40} 
            className="logo-img"
          />
        </div>
      </header>

      {/* HERO IMAGE */}
      <section className="hero-image-wrapper">
        {/* Menggunakan img standar agar aman dari domain remote Next.js */}
        <img
          src={recipe.gambar_url || "/images/placeholder.jpg"}
          alt={recipe.judul_resep}
          className="hero-image"
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
      </section>

      {/* META INFO (Time & Tags) */}
      <section className="meta-info">
        <div className="meta-pill time-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="clock-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {recipe.waktu_masak} min
        </div>

        <div className="meta-pill tag-pill">
          {recipe.kategori_jenis}
        </div>

        {mainNutritionTag && (
           <div className="meta-pill tag-pill">
             {mainNutritionTag}
           </div>
        )}

      </section>

      {/* TITLE & DESCRIPTION */}
      <section className="title-section">
        <h1 className="recipe-title">RESEP: {recipe.judul_resep?.toUpperCase()}</h1>
        <p className="recipe-description">{recipe.deskripsi_singkat}</p>
      </section>

      {/* NEW SECTION: INFORMASI GIZI LENGKAP */}
      <section className="content-section nutrition-section">
        <div className="section-header">
          <div className="line-divider"></div>
          <h2>INFORMASI GIZI</h2>
        </div>
        <div className="nutrition-grid">
          {nutritionItems.map((item: string, index: number) => (
            <div key={index} className="nutrition-card">
              <span className="nutrition-text">{item.trim()}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ALAT & BAHAN */}
      <section className="content-section">
        <div className="section-header">
          <div className="line-divider"></div>
          <h2>ALAT & BAHAN</h2>
        </div>
        <ul className="ingredients-list">
          {ingredientsArray.map((item: string, index: number) => (
            <li key={index}>
              <span className="checkbox-square"></span>
              {item.trim()}
            </li>
          ))}
        </ul>
      </section>

      {/* LANGKAH PEMBUATAN */}
      <section className="content-section">
        <div className="section-header">
          <div className="line-divider"></div>
          <h2>LANGKAH PEMBUATAN</h2>
        </div>
        
        <div className="steps-container">
          {stepsArray.map((step: string, index: number) => {
            // Kita skip jika ada baris kosong (misal user ga sengaja enter 2 kali di DB)
            if (!step.trim()) return null; 

            return (
              <p key={index} className="steps-text">
                {step.trim()}
              </p>
            );
          })}
        </div>
      </section>
    </main>
  );
}