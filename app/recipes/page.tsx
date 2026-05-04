"use client";

import { useEffect, useRef, useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from '@/utils/supabase/client';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import "./page.css"

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"]});

interface RecipeUI {
  id: number;
  title: string;
  time: string;
  tags: string[];
  description: string;
  imageUrl: string;
  showButton: boolean;
  liked?: boolean;
}

export default function RecipesPage(){
    const router = useRouter();
    const supabase = createClient();
    const queryClient = useQueryClient();
    const { data: session, status } = useSession();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null)
    const itemsPerPage = 5;

    const [currentPage, setCurrentPage] = useState<number>(() => {
      if (typeof window !== "undefined") {
        const savedPage = sessionStorage.getItem("recipePage");
        return savedPage ? Number(savedPage) : 1;
      }
      return 1;
    });

    const ProfileIcon = () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffcc00" stroke="#ffcc00" strokeWidth="0">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );

    const { data: userData } = useQuery({
      queryKey: ["currentUser", session?.user?.email],
      queryFn: async () => {
        if (!session?.user?.email) return null;
        const { data, error } = await supabase
          .from("pengguna")
          .select("id")
          .eq("email", session.user.email)
          .single();
        return data;
      },
      enabled: !!session?.user?.email,
    });
    
    const userId = userData?.id;

    // --- 2. QUERY DATA RESEP (Gantikan useEffect lama) ---
    const { data: recipes = [], isLoading } = useQuery<RecipeUI[]>({
      queryKey: ["recipes", userId],
      queryFn: async () => {
        const { data: dbData, error: recipeError } = await supabase
          .from("resep")
          .select("*")
          .order("id_resep", { ascending: false });

        if (recipeError) throw recipeError;

        let favIds: number[] = [];
        if (userId) {
          const { data: favData } = await supabase
            .from("favorit_resep")
            .select("id_resep")
            .eq("id_user", userId);
          favIds = favData?.map((f) => f.id_resep) || [];
        }

        return dbData.map((dbRecipe: any) => {
          let mainNutritionTag = "";
          if (dbRecipe.informasi_gizi) {
            const firstItem = dbRecipe.informasi_gizi.split(",")[0];
            mainNutritionTag = firstItem.split(":")[0].trim();
          }
          const recipeTags = [dbRecipe.kategori_jenis, mainNutritionTag].filter(Boolean);

          return {
            id: dbRecipe.id_resep,
            title: dbRecipe.judul_resep || "Resep Tanpa Judul",
            time: `${dbRecipe.waktu_masak || 0} min`,
            tags: recipeTags,
            description: dbRecipe.deskripsi_singkat || "Tidak ada deskripsi.",
            imageUrl: dbRecipe.gambar_url || "/images/placeholder.jpg",
            showButton: true,
            liked: favIds.includes(dbRecipe.id_resep),
          };
        });
      },
      enabled: status !== "loading",
    });

    // --- 3. MUTATION UNTUK TOGGLE FAVORIT ---
    const toggleLikeMutation = useMutation({
      mutationFn: async ({ recipeId, isLiked }: { recipeId: number; isLiked: boolean }) => {
        if (!userId) throw new Error("Must login");

        if (isLiked) {
          await supabase.from("favorit_resep").delete().eq("id_user", userId).eq("id_resep", recipeId);
        } else {
          await supabase.from("favorit_resep").insert([{ id_user: userId, id_resep: recipeId }]);
        }
      },
      onMutate: async ({ recipeId }) => {
        await queryClient.cancelQueries({ queryKey: ["recipes", userId] });
        const previousRecipes = queryClient.getQueryData(["recipes", userId]);
        queryClient.setQueryData(["recipes", userId], (old: any) =>
          old.map((r: any) => (r.id === recipeId ? { ...r, liked: !r.liked } : r))
        );
        return { previousRecipes };
      },
      onError: (_, __, context) => {
        queryClient.setQueryData(["recipes", userId], context?.previousRecipes);
        alert("Gagal memperbarui favorit.");
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["recipes", userId] });
      },
    });
    
    const handleToggleLike = (id: number) => {
      const recipe = recipes.find((r) => r.id === id);
      if (recipe) {
        toggleLikeMutation.mutate({ recipeId: id, isLiked: !!recipe.liked });
      }
    };

    useEffect(() => {
      sessionStorage.setItem("recipePage", currentPage.toString());
    }, [currentPage]);

    useEffect(() => {
      if (!isLoading) {
        const savedScroll = sessionStorage.getItem('recipeScroll');
        if (savedScroll) {
          setTimeout(() => {
            window.scrollTo({ top: Number(savedScroll), behavior: 'auto' });
            sessionStorage.removeItem('recipeScroll');
          }, 150);
        }
      }
    }, [isLoading, currentPage]);
    
    const handleSelectTag = (tag: string) => {
      // Kalau tag belum ada, tambahkan. Kalau sudah ada, biarkan.
      if (!selectedTags.includes(tag)) {
        setSelectedTags([...selectedTags, tag]);
        setCurrentPage(1);
      }
      setIsOpen(false); // Tutup dropdown setelah milih
    };
    
    const handleLogout = async () => {
      setIsOpen(false);
      await supabase.auth.signOut();
      await nextAuthSignOut({ redirect: false });
      window.location.href = "/auth";
    };

    const handleRemoveTag = (e: React.MouseEvent, tagToRemove: string) => {
      e.stopPropagation(); // Mencegah dropdown terbuka saat klik tombol 'X'
      setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
      setCurrentPage(1);
    };

    const clearAllTags = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedTags([]);
      setCurrentPage(1);
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

    // Dynamic Filtering Options from Database
    const dynamicCategories = Array.from(new Set(recipes.map(r => r.tags[0]))).filter(Boolean);
    const dynamicNutrition = Array.from(new Set(recipes.map(r => r.tags[1]))).filter(Boolean);
    
    const filteredRecipes = recipes.filter((recipe) => {
      const searchMatch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const filterMatch = selectedTags.length === 0 ||
        selectedTags.every(st => recipe.tags.some(rt => rt.toLowerCase() === st.toLowerCase()));

      return searchMatch && filterMatch;
    });
    
    const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);

    const currentRecipes = filteredRecipes.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

  return (
    <main className={`recipes-container ${plusJakarta.className}`}>
      {/* Header & Navigation */}


      <div className="controls-row">
        <a href="/DashboardProduct" className="back-button">
          Back
        </a>
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search" 
            value={searchTerm} 
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // <-- Tambahkan reset disini
            }} 
          />
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
              {dynamicCategories.length > 0 && (
                <>
                  <p className="group-title">Kategori</p>
                  {dynamicCategories
                    .filter(opt => !selectedTags.includes(opt as string))
                    .map((opt, i) => (
                      <div key={`cat-${i}`} className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleSelectTag(opt as string); }}>
                        {opt}
                      </div>
                    ))}
                </>
              )}

              {dynamicNutrition.length > 0 && (
                <>
                  <p className="group-title">Informasi Gizi</p>
                  {dynamicNutrition
                    .filter(opt => !selectedTags.includes(opt as string))
                    .map((opt, i) => (
                      <div key={`nut-${i}`} className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleSelectTag(opt as string); }}>
                        {opt}
                      </div>
                    ))}
                </>
              )}
            </div>
          )}
        </div>
        <div className="profile-dropdown-container-recipe">
            <div
              className="nav-link profile-trigger">
              <ProfileIcon />
              <span className="nav-link-label">Profil</span>
            </div>
            <div className="dropdown-menu-profile-recipe">
              <Link href="/profile" className="dropdown-item">Profil Saya</Link>
              <button onClick={handleLogout} className="dropdown-item">Keluar</button>
            </div>
          </div>
        <div className="logo-wrapper">
          <Image src="/images/logo.png" alt="Website Logo" width={48} height={48} className="logo-img" />
        </div>
      </div>

      {/* Page Titles */}
      <header className="page-header">
        <h1>RESEP</h1>
        <p>Cari Tau Apa Yang Mau Kamu Masak Hari Ini!</p>
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
              <h2>Coba<br/>Sekarang !</h2>
              <h3>Nasi Goreng Quinoa</h3>
              <p>Makan Siang Sempurna Untuk Kamu Yang Mau Bulking!</p>
              <a href="#" className="more-link">More</a>
            </div>
            <div className="hero-image-placeholder hero-img-1"></div>
          </div>

          {/* Card 2 */}
          <div className="hero-card green-card">
            <div className="hero-image-placeholder hero-img-2"></div>
            <div className="hero-content right-align">
              <h2>AYO MASAK SEKARANG!</h2>
              <p className="special-text">Menu<br/>Spesial<br/>Teman<br/>Dietmu</p>
              <button className="more-btn">More</button>
            </div>
          </div>

          {/* Card 3 (Baru) */}
          <div className="hero-card orange-card">
            <div className="hero-content">
              <h2>MENU<br/>PROTEIN BARU</h2>
              <h3>Salad Paprika</h3>
              <p>Enak & Sehat!</p>
              <a href="#" className="more-link-white">More</a>
            </div>
            <div className="hero-image-placeholder hero-img-3"></div>
          </div>

          {/* Card 4 */}
          <div className="hero-card yellow-card">
            <div className="hero-content">
              <h2>Coba<br/>Sekarang !</h2>
              <h3>Nasi Goreng Quinoa</h3>
              <p>Makan Siang Sempurna Untuk Kamu Yang Mau Bulking!</p>
              <a href="#" className="more-link">More</a>
            </div>
            <div className="hero-image-placeholder hero-img-1"></div>
          </div>
        </section>

        <button className="carousel-arrow right" onClick={() => scrollCarousel("right")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      {/* Recipe List Cards */}
      <section className="recipe-list">
        {isLoading ? (
          /* Render Skeleton Loader sebanyak 6 buah (atau sesuai kebutuhan) */
          Array.from({ length: 6 }).map((_, i) => (
            <div className="recipe-card" key={i}>
              <div className="recipe-image-wrapper">
                <div className="skeleton-box skeleton-img" style={{ position: 'absolute' }}></div>
              </div>
              
              <div className="recipe-info">
                <div className="recipe-header">
                  {/* Skeleton Title */}
                  <div className="skeleton-box skeleton-title"></div>
                </div>

                <div className="recipe-meta">
                  {/* Skeleton Tags/Meta */}
                  <div className="skeleton-box skeleton-meta"></div>
                </div>

                {/* Skeleton Description (2 baris) */}
                <div className="skeleton-box skeleton-desc"></div>
                <div className="skeleton-box skeleton-desc short"></div>

                {/* Skeleton Button */}
                <div className="skeleton-box skeleton-btn"></div>
              </div>
            </div>
          ))
        ) : currentRecipes.length === 0 ? (
          <p className="no-results">Tidak ada resep ditemukan</p>
        ) : (
          currentRecipes.map((recipe) => (
            <div className="recipe-card" key={recipe.id}>
              <div className="recipe-image-wrapper">
                <Link href={`/recipes/${recipe.id}`} onClick={() => sessionStorage.setItem('recipeScroll', window.scrollY.toString())}>
                  {/* Menggunakan tag img standar agar tidak bentrok dengan config domain next/image dari Supabase URL */}
                  <img 
                    src={recipe.imageUrl} 
                    alt={recipe.title} 
                    className="recipe-image object-cover w-full h-full cursor-pointer"
                    style={{ objectFit: 'cover', width: '100%', height: '100%', position: 'absolute' }}
                  />
                </Link>
              </div>
              
              <div className="recipe-info">
                <div className="recipe-header">
                  <Link href={`/recipes/${recipe.id}`} onClick={() => sessionStorage.setItem('recipeScroll', window.scrollY.toString())} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h2 className="cursor-pointer hover:opacity-80 transition-opacity">{recipe.title}</h2>
                  </Link>
                  <button className="favorite-btn" onClick={() => handleToggleLike(recipe.id)}>
                    <svg viewBox="0 0 24 24" fill={recipe.liked ? "#ff4d6d" : "none"} stroke={recipe.liked ? "#ff4d6d" : "#333"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <Link 
                    href={`/recipes/${recipe.id}`} 
                    className="cook-now-btn"
                    onClick={() => sessionStorage.setItem('recipeScroll', window.scrollY.toString())}
                  >
                      Cook Now 
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </section>
      {!isLoading && totalPages > 1 && (
        <div className="pagination-wrapper">
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}