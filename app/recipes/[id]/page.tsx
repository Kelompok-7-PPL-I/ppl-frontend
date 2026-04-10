import Image from "next/image";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./page.css";

// Konfigurasi Font Plus Jakarta Sans
const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"]
});

// Mock database (Di real app, ini bisa diganti fetch API / Database query)
const recipeDatabase = [
  {
    id: "1",
    title: "Jagung Susu Keju",
    time: "10 min",
    tags: ["Snack", "Karbo"],
    description: "Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet.Lorem ipsum sil dolor amet.Lorem ipsum sil dolor amet.Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet.Lorem ipsum sil dolor amet.",
    image: "/images/corn-2.jpg",
    ingredients: ["Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum"],
    steps: "Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet.Lorem ipsum sil dolor amet.Lorem ipsum sil dolor amet.Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet.Lorem ipsum sil dolor amet."
  },
  {
    id: "2",
    title: "Nasi Tiwul",
    time: "10 min",
    tags: ["Weight Gain", "Protein"],
    description: "Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet.",
    image: "/images/banner1.png",
    ingredients: ["Bahan A", "Bahan B"],
    steps: "Langkah-langkah pembuatan..."
  }
];

// 1. Ubah tipe params menjadi Promise dan tambahkan 'async' di depan function
export default async function RecipeDetail({ params }: { params: Promise<{ id: string }> }) {
  
  // 2. Gunakan 'await' untuk membuka nilai dari params
  const resolvedParams = await params;

  // 3. Sekarang kita bisa pakai resolvedParams.id dengan aman
  const recipe = recipeDatabase.find((r) => r.id === resolvedParams.id);

  // Handling jika resep tidak ditemukan
  if (!recipe) {
    return (
      <div className={`not-found ${plusJakartaSans.className}`}>
        <h2>Resep tidak ditemukan!</h2>
        <Link href="/recipes">Kembali ke Daftar Resep</Link>
      </div>
    );
  }

  return (
    <main className={`recipe-detail-page ${plusJakartaSans.className}`}>
      {/* HEADER */}
      <header className="detail-header">
        <Link href="/recipes" className="back-link">
          Back
        </Link>
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
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          className="hero-image"
          style={{ objectFit: "cover" }}
          priority
        />
      </section>

      {/* META INFO (Time & Tags) */}
      <section className="meta-info">
        <div className="meta-pill time-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="clock-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {recipe.time}
        </div>
        {recipe.tags.map((tag, index) => (
          <div className="meta-pill tag-pill" key={index}>
            {tag}
          </div>
        ))}
      </section>

      {/* TITLE & DESCRIPTION */}
      <section className="title-section">
        <h1 className="recipe-title">RESEP: {recipe.title.toUpperCase()}</h1>
        <p className="recipe-description">{recipe.description}</p>
      </section>

      {/* ALAT & BAHAN */}
      <section className="content-section">
        <div className="section-header">
          <div className="line-divider"></div>
          <h2>ALAT & BAHAN</h2>
        </div>
        <ul className="ingredients-list">
          {recipe.ingredients.map((item, index) => (
            <li key={index}>
              <span className="checkbox-square"></span>
              {item}
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
        <p className="steps-text">{recipe.steps}</p>
      </section>
    </main>
  );
}