"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, ChevronLeft, ChevronRight, ShoppingBag, ChefHat, TrendingUp, Sparkles, ArrowRight, X, Eye } from "lucide-react";
import PangiAvatar from "@/components/onboarding/PangiAvatar";
import { ASSISTANT_NAME } from "@/components/onboarding/onboarding-content";
import { openOnboardingHere, requestOnboardingAutostart } from "@/components/onboarding/useOnboardingStatus";
import type { RecoPage, RecoResponse, RecoSection } from "@/lib/recommendation/types";
import { useRecommendations } from "./useRecommendations";
import { RecoProductCard, RecoRecipeCard, ProductCardSkeleton } from "./RecoCards";
import styles from "./Recommendations.module.css";

const SECTION_ICON = {
  "for-you": Sparkles,
  "because-viewed": Eye,
  "because-bought": ShoppingBag,
  "complete-recipe": ChefHat,
  popular: TrendingUp,
} as const;

/**
 * Rak rekomendasi personal ("Untukmu"): beberapa baris geser horizontal ala e-commerce/Netflix.
 * Disembunyikan untuk admin, user belum login, atau saat API gagal (tidak mengganggu halaman).
 */
export default function RecommendationShelf({ page }: { page: RecoPage }) {
  const { data, isLoading, isError, enabled } = useRecommendations(page);

  if (!enabled || isError) return null;

  if (isLoading || !data) {
    return (
      <section className={styles.shelf} aria-busy="true" aria-label="Memuat rekomendasi">
        <div className={styles.shelfHead}>
          <div className={`${styles.skeleton} ${styles.skelAvatar}`} />
          <div className={styles.skelHeadText}>
            <div className={`${styles.skeleton} ${styles.skelLine}`} />
            <div className={`${styles.skeleton} ${styles.skelLineShort}`} />
          </div>
        </div>
        <div className={styles.track}>
          {[...Array(6)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!data.sections.length && data.hasPreferences) return null;

  return (
    <section id="rekomendasi" className={styles.shelf} aria-labelledby="reco-title">
      <ShelfHeader data={data} />
      {!data.hasPreferences && <PersonalizeCard />}
      {data.sections.map((s) => (
        <RecoRow key={s.id} section={s} />
      ))}
    </section>
  );
}

function ShelfHeader({ data }: { data: RecoResponse }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const basis = data.basis.length
    ? data.basis.length > 1
      ? `${data.basis.slice(0, -1).join(", ")}${data.basis.length > 2 ? "," : ""} dan ${data.basis.at(-1)}`
      : data.basis[0]
    : "produk dan resep yang paling disukai pengguna Panganesia";

  return (
    <div className={styles.shelfHead}>
      <PangiAvatar size={44} mood="idle" className={styles.shelfAvatar} />
      <div className={styles.shelfHeadText}>
        <h2 id="reco-title" className={styles.shelfTitle}>
          {data.personalized ? "Untukmu" : "Lagi rame di Panganesia"}
        </h2>
        <p className={styles.shelfSub}>
          {data.personalized ? `Pilihan ${ASSISTANT_NAME} dari ${basis}` : "Produk dan resep yang paling disukai pembeli lain"}
        </p>
      </div>
      <div className={styles.whyWrap} ref={wrapRef}>
        <button
          type="button"
          className={styles.whyBtn}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
        >
          <Info size={15} aria-hidden="true" />
          <span className={styles.whyLabel}>Kenapa rekomendasi ini?</span>
        </button>
        {open && (
          <div id={panelId} className={styles.whyPanel} role="dialog" aria-label="Tentang rekomendasi">
            <button type="button" className={styles.whyClose} onClick={() => setOpen(false)} aria-label="Tutup">
              <X size={14} />
            </button>
            <p className={styles.whyTitle}>Gimana {ASSISTANT_NAME} milih ini?</p>
            <ul className={styles.whyList}>
              <li>
                <b>Sumber:</b> {basis}.
              </li>
              {data.engine === "vector" && (
                <li>
                  <b>Cara:</b> profil seleramu dicocokkan dengan gizi, kelompok bahan, dan kategori tiap resep & produk.
                  Pangan dari daerahmu didahulukan.
                </li>
              )}
              <li>
                <b>Aktivitas:</b> yang kamu buka, masukkan ke keranjang, favoritkan, dan beli.
              </li>
              <li>
                <b>Disaring:</b> bahan yang kamu hindari. Alergen juga disaring dari teks bahan, tapi tetap cek daftar bahannya
                ya.
              </li>
            </ul>
            {data.hasPreferences ? (
              <Link href="/profile/preferences" className={styles.whyLink}>
                Ubah preferensi <ArrowRight size={14} />
              </Link>
            ) : (
              <StartOnboardingButton className={styles.whyLink}>
                Isi preferensi <ArrowRight size={14} />
              </StartOnboardingButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StartOnboardingButton({ className, children }: { className: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        // Di dashboard chat langsung terbuka; dari halaman lain pindah dulu ke dashboard
        if (openOnboardingHere()) return;
        requestOnboardingAutostart();
        router.push("/DashboardProduct");
      }}
    >
      {children}
    </button>
  );
}

function PersonalizeCard() {
  return (
    <div className={styles.personalize}>
      <PangiAvatar size={64} mood="waving" className={styles.personalizeAvatar} />
      <div className={styles.personalizeText}>
        <p className={styles.personalizeTitle}>Mau rekomendasi yang lebih pas?</p>
        <p className={styles.personalizeSub}>
          Ceritain selera, alergi, dan tujuan makanmu ke {ASSISTANT_NAME}. Cuma 5 pertanyaan.
        </p>
      </div>
      <StartOnboardingButton className={styles.personalizeBtn}>
        Isi preferensi <ArrowRight size={16} />
      </StartOnboardingButton>
    </div>
  );
}

function RecoRow({ section }: { section: RecoSection }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const titleId = useId();
  const Icon = SECTION_ICON[section.variant];

  const updateEdges = () => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // Bagian nama acuan ("Karena kamu membeli X") ditebalkan
  const anchorName = section.anchor ? section.title.match(/^(Karena kamu membeli|Karena kamu melihat|Lengkapi bahan) (.+)$/) : null;

  return (
    <div className={styles.row} role="region" aria-labelledby={titleId}>
      <div className={styles.rowHead}>
        <span className={`${styles.rowIcon} ${styles[`rowIcon_${section.variant}`]}`} aria-hidden="true">
          <Icon size={16} strokeWidth={2.4} />
        </span>
        <div className={styles.rowHeadText}>
          <h3 id={titleId} className={styles.rowTitle}>
            {anchorName ? (
              <>
                {anchorName[1]} <strong>{anchorName[2]}</strong>
              </>
            ) : (
              section.title
            )}
          </h3>
          {section.subtitle && <p className={styles.rowSub}>{section.subtitle}</p>}
        </div>
        {section.anchor?.type === "recipe" && (
          <Link href={`/recipes/${section.anchor.id}`} className={styles.rowLink}>
            Lihat resep <ArrowRight size={14} />
          </Link>
        )}
        <div className={styles.arrows}>
          <button type="button" className={styles.arrow} onClick={() => scroll(-1)} disabled={edges.start} aria-label="Geser ke kiri">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className={styles.arrow} onClick={() => scroll(1)} disabled={edges.end} aria-label="Geser ke kanan">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <ul ref={trackRef} className={styles.track} onScroll={updateEdges}>
        {section.items.map((item) => (
          <li key={`${item.type}-${item.id}`} className={styles.trackItem}>
            {item.type === "product" ? (
              <RecoProductCard item={item} showReason={section.variant !== "complete-recipe"} />
            ) : (
              <RecoRecipeCard item={item} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
