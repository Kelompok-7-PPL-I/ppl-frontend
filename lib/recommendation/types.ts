// Kontrak response GET /api/recommendations/shelves — dipakai UI rak rekomendasi.
// Engine boleh diganti (rules → vektor), asal bentuk response ini tetap.

export type ReasonKind =
  | "preference" // cocok dengan preferensi (kelompok bahan, nutrisi, tujuan makan)
  | "purchase" // berkaitan dengan produk yang pernah dibeli
  | "viewed" // berkaitan dengan yang sering dilihat/disimpan (log interaksi)
  | "favorite" // berkaitan dengan resep/produk favorit
  | "recipe" // bahan dari resep tertentu
  | "popular" // banyak dibeli/difavoritkan pengguna lain
  | "promo";

export interface RecoProduct {
  type: "product";
  id: number;
  name: string;
  price: number;
  image: string | null;
  unit: string | null;
  /** Kalimat singkat alasan rekomendasi, mis. "Kamu suka umbi-umbian" */
  reason: string;
  reasonKind: ReasonKind;
  score: number;
}

export interface RecoRecipe {
  type: "recipe";
  id: number;
  title: string;
  image: string | null;
  minutes: number | null;
  category: string | null;
  /** Label kecocokan tambahan, mis. ["Protein 15g", "Diet"] */
  tags: string[];
  reason: string;
  reasonKind: ReasonKind;
  score: number;
}

export type RecoItem = RecoProduct | RecoRecipe;

export type SectionVariant = "for-you" | "because-viewed" | "because-bought" | "complete-recipe" | "popular";

export interface RecoSection {
  id: string;
  variant: SectionVariant;
  itemType: "product" | "recipe";
  title: string;
  subtitle?: string;
  /** Item acuan untuk section "Karena kamu membeli X" / "Lengkapi bahan resep Y" */
  anchor?: { type: "product" | "recipe"; id: number; name: string };
  items: RecoItem[];
}

export interface RecoResponse {
  /** false = belum ada sinyal personal (belum onboarding, belum belanja, belum favorit) */
  personalized: boolean;
  /** Sudah mengisi preferensi onboarding (kalau belum, UI menampilkan ajakan isi preferensi) */
  hasPreferences: boolean;
  /** Sumber data yang dipakai, untuk penjelasan "Kenapa rekomendasi ini?" */
  basis: string[];
  engine: "rules" | "vector";
  sections: RecoSection[];
}

export type RecoPage = "dashboard" | "recipes";
