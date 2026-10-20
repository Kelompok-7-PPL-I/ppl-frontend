"use client";

/* eslint-disable @next/next/no-img-element -- gambar resep/produk bisa dari domain mana saja (lihat halaman resep) */
import Link from "next/link";
import { Sparkles, ShoppingBag, Heart, ChefHat, TrendingUp, Tag, Clock, Utensils, Eye } from "lucide-react";
import type { ReasonKind, RecoProduct, RecoRecipe } from "@/lib/recommendation/types";
import styles from "./Recommendations.module.css";

const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

const REASON_ICON: Record<ReasonKind, typeof Sparkles> = {
  preference: Sparkles,
  purchase: ShoppingBag,
  viewed: Eye,
  favorite: Heart,
  recipe: ChefHat,
  popular: TrendingUp,
  promo: Tag,
};

export function ReasonPill({ kind, text }: { kind: ReasonKind; text: string }) {
  const Icon = REASON_ICON[kind];
  return (
    <span className={`${styles.reason} ${styles[`reason_${kind}`]}`} title={text}>
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
      <span className={styles.reasonText}>{text}</span>
    </span>
  );
}

/** Alasan di badan kartu produk (kartu sempit, jadi boleh 2 baris) */
function ReasonLine({ kind, text }: { kind: ReasonKind; text: string }) {
  const Icon = REASON_ICON[kind];
  return (
    <p className={`${styles.reasonLine} ${styles[`reason_${kind}`]}`}>
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
      <span>{text}</span>
    </p>
  );
}

export function RecoProductCard({ item, showReason = true }: { item: RecoProduct; showReason?: boolean }) {
  return (
    <Link href={`/product/${item.id}`} className={styles.productCard}>
      <div className={styles.productMedia}>
        {item.image ? (
          <img src={item.image} alt="" loading="lazy" className={styles.media} />
        ) : (
          <div className={styles.mediaFallback} aria-hidden="true">
            <ShoppingBag size={28} />
          </div>
        )}
      </div>
      <div className={styles.productBody}>
        {showReason && item.reason && <ReasonLine kind={item.reasonKind} text={item.reason} />}
        <p className={styles.productName}>{item.name}</p>
        <p className={styles.productPrice}>{formatRupiah(item.price)}</p>
      </div>
    </Link>
  );
}

export function RecoRecipeCard({ item }: { item: RecoRecipe }) {
  return (
    <Link href={`/recipes/${item.id}`} className={styles.recipeCard}>
      <div className={styles.recipeMedia}>
        {item.image ? (
          <img src={item.image} alt="" loading="lazy" className={styles.media} />
        ) : (
          <div className={styles.mediaFallback} aria-hidden="true">
            <Utensils size={28} />
          </div>
        )}
        <span className={styles.recipeShade} aria-hidden="true" />
        {item.reason && <ReasonPill kind={item.reasonKind} text={item.reason} />}
      </div>
      <div className={styles.recipeBody}>
        <p className={styles.recipeTitle}>{item.title}</p>
        <div className={styles.recipeMeta}>
          {item.minutes ? (
            <span className={styles.metaItem}>
              <Clock size={13} aria-hidden="true" /> {item.minutes} mnt
            </span>
          ) : null}
          {item.tags.map((t) => (
            <span key={t} className={styles.tag}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className={styles.productCard} aria-hidden="true">
      <div className={`${styles.productMedia} ${styles.skeleton}`} />
      <div className={styles.productBody}>
        <div className={`${styles.skeleton} ${styles.skelLine}`} />
        <div className={`${styles.skeleton} ${styles.skelLineShort}`} />
      </div>
    </div>
  );
}
