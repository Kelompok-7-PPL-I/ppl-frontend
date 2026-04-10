"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./page.css"

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"]});

export default function RecipesPage(){
    const [localLikes, setLocalLikes] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null)
    
    const handleToggleLike = (id: number) => {
    setLocalLikes((prev) =>
        prev.includes(id)
        ? prev.filter((favId) => favId !== id)
        : [...prev, id]
    );
    };

    const handleSelectTag = (tag: string) => {
      // Kalau tag belum ada, tambahkan. Kalau sudah ada, biarkan.
      if (!selectedTags.includes(tag)) {
        setSelectedTags([...selectedTags, tag]);
      }
      setIsOpen(false); // Tutup dropdown setelah milih
    };

    const handleRemoveTag = (e: React.MouseEvent, tagToRemove: string) => {
      e.stopPropagation(); // Mencegah dropdown terbuka saat klik tombol 'X'
      setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
    };

    const clearAllTags = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedTags([]);
      setIsOpen(false);
    };
    
    // Fungsi untuk menggeser carousel menggunakan tombol
    const scrollCarousel = (direction: "left" | "right") => {
        if (carouselRef.current) {
            const scrollAmount = 420; // Lebar card + gap
            carouselRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    const options = [
        { label: "Snack", group: "Kategori" },
        { label: "Diet", group: "Kategori" },
        { label: "Weight Gain", group: "Kategori" },
        { label: "High Protein", group: "Kategori" },
        { label: "Healthy", group: "Kategori" },
        { label: "Low Sugar", group: "Kategori" },
        { label: "Karbohidrat", group: "Informasi Gizi" },
        { label: "Protein", group: "Informasi Gizi" },
    ];
    
    const recipeList = [
        {
            id: 1,
            title: "Jagung Susu Keju",
            time: "10 min",
            tags: ["Snack", "Kalori"],
            description:
            "Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet.",
            showButton: true,
        },
        {
            id: 2,
            title: "Nasi Tiwul",
            time: "10 min",
            tags: ["Weight Gain", "Protein"],
            description:
            "Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet.Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet.",
            showButton: true,
        },
        {
            id: 3,
            title: "Salad Jagung Sehat",
            time: "15 min",
            tags: ["Diet", "Healthy"],
            description:
            "Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet. Lorem ipsum sil dolor amet.",
            showButton: true,
        },
    ];
    
    const filteredRecipes = recipeList.filter((recipe) => {
        const searchMatch =
            recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.tags.some(tag =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
            );

        const filterMatch =
          selectedTags.length === 0 || // Kalau nggak ada tag yang dipilih, tampilkan semua
          selectedTags.every(selectedTag => 
            // .every() memastikan resep punya SEMUA tag yang dipilih
            // pakai .some() di dalamnya untuk ngecek mengabaikan huruf besar/kecil
            recipe.tags.some(recipeTag => 
              recipeTag.toLowerCase() === selectedTag.toLowerCase()
            )
          );

        return searchMatch && filterMatch;
    });

  return (
    <main className={`recipes-container ${plusJakarta.className}`}>
      {/* Header & Navigation */}
      <nav className="top-nav">
        <a href="#" className="back-button">
          Back
        </a>
      </nav>

      <div className="controls-row">
        <div className="search-box">
          <input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        <div className="filter-box">
          <div className="custom-select" onClick={() => setIsOpen(!isOpen)}>
            
            {/* Area Tag Pills */}
            <div className="selected-tags-wrapper">
              {selectedTags.length === 0 && <span className="placeholder-text">Filter</span>}
              
              {selectedTags.map((tag, index) => (
                <span key={index} className="tag-pill-ui">
                  <span className="tag-dot"></span>
                  {tag}
                  <button className="remove-tag-btn" onClick={(e) => handleRemoveTag(e, tag)}>
                    &times;
                  </button>
                </span>
              ))}

              {selectedTags.length > 0 && <span className="add-tag-text">Add tag</span>}
            </div>

            {/* Icon Garis 3 atau Icon X untuk Clear All */}
            {selectedTags.length > 0 ? (
              <div 
                className="clear-all-btn-wrapper"
                onClick={clearAllTags} 
                style={{ cursor: "pointer", display: "flex", padding: "4px" }}
              >
                <svg className="icon-select clear-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
            ) : (
              <svg className="icon-select" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="21" y1="10" x2="3" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="21" y1="18" x2="3" y2="18"></line>
              </svg>
            )}
          </div>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="dropdown-menu">
              <p className="group-title">Kategori</p>
              {options
                .filter(opt => opt.group === "Kategori")
                // Sembunyikan opsi yang sudah dipilih dari dropdown
                .filter(opt => !selectedTags.includes(opt.label))
                .map((opt, i) => (
                  <div key={i} className="dropdown-item" onClick={() => handleSelectTag(opt.label)}>
                    {opt.label}
                  </div>
                ))}

              <p className="group-title">Informasi Gizi</p>
              {options
                .filter(opt => opt.group === "Informasi Gizi")
                .filter(opt => !selectedTags.includes(opt.label))
                .map((opt, i) => (
                  <div key={i} className="dropdown-item" onClick={() => handleSelectTag(opt.label)}>
                    {opt.label}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="logo-wrapper">
          <Image src="/images/logo.png" alt="Website Logo" width={48} height={48} className="logo-img" />
        </div>
      </div>

      {/* Page Titles */}
      <header className="page-header">
        <h1>RECIPES</h1>
        <p>Find Out What Do You Want To Cook Today!</p>
      </header>

      {/* Hero Carousel Cards */}
      <div className="carousel-wrapper">
        <button className="carousel-arrow left" onClick={() => scrollCarousel("left")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      <section className="hero-carousel" ref={carouselRef}>
          {/* Card 1 */}
          <div className="hero-card yellow-card">
            <div className="hero-content">
              <h2>CHECK THIS<br/>OUT !</h2>
              <h3>Nasi Goreng Quinoa</h3>
              <p>Perfect Lunch For Your Bulking Menu!</p>
              <a href="#" className="more-link">More</a>
            </div>
            <div className="hero-image-placeholder hero-img-1"></div>
          </div>

          {/* Card 2 */}
          <div className="hero-card green-card">
            <div className="hero-image-placeholder hero-img-2"></div>
            <div className="hero-content right-align">
              <h2>LET&apos;S COOK NOW!</h2>
              <p className="special-text">Special<br/>As Ur<br/>Diet<br/>Partner</p>
              <button className="more-btn">More</button>
            </div>
          </div>

          {/* Card 3 (Baru) */}
          <div className="hero-card orange-card">
            <div className="hero-content">
              <h2>OUR NEW<br/>PROTEIN</h2>
              <h3>Stuffed Paprika</h3>
              <p>Delicious & Healthy!</p>
              <a href="#" className="more-link-white">More</a>
            </div>
            <div className="hero-image-placeholder hero-img-3"></div>
          </div>
        </section>

        <button className="carousel-arrow right" onClick={() => scrollCarousel("right")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      {/* Recipe List Cards */}
      <section className="recipe-list">
        {filteredRecipes.length === 0 ? (
        <p className="no-results">Tidak ada resep ditemukan </p>
        ) : (
        filteredRecipes.map((recipe) => 
          <div className="recipe-card" key={recipe.id}>
            <div className="recipe-image-wrapper">
              <Image 
                src="/images/corn-2.jpg" 
                alt={recipe.title} 
                fill 
                className="recipe-image"
                objectFit="cover"
                loading="eager"
              />
            </div>
            
            <div className="recipe-info">
              <div className="recipe-header">
                <h2>{recipe.title}</h2>
                <button className="favorite-btn" onClick={() => handleToggleLike(recipe.id)}>
                  <svg viewBox="0 0 24 24" fill={localLikes.includes(recipe.id) ? "#ff4d6d" : "none"} stroke={localLikes.includes(recipe.id) ? "#ff4d6d" : "#333"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
              </div>

              <div className="recipe-meta">
                <span className="time">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="clock-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {recipe.time}
                </span>
                {recipe.tags.map((tag, index) => (
                  <span className="tag" key={index}>{tag}</span>
                ))}
              </div>

              <p className="recipe-description">{recipe.description}</p>

              {recipe.showButton && (
                <Link href={`/recipes/${recipe.id}`} className="cook-now-btn">
                    Cook Now 
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </Link>
            )}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}