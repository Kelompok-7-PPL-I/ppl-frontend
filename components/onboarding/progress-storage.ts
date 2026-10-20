import type { OnboardingData } from "@/lib/onboarding-options";

export type Answers = Partial<OnboardingData>;

export interface Message {
  id: string;
  from: "bot" | "user" | "system";
  text?: string;
  /** Kalau ada, bubble dirender sebagai kartu rangkuman jawaban */
  summary?: Answers;
}

export type Phase =
  | { type: "question"; step: number; editing: boolean }
  | { type: "summary" }
  | { type: "submitting" }
  | { type: "error" }
  | { type: "done" };

// v2: kelompok bahan & produk disimpan sebagai ID (schema preferensi baru). Progres v1 diabaikan.
const VERSION = 2;

interface SavedProgress {
  v: typeof VERSION;
  messages: Message[];
  answers: Answers;
  phase: Extract<Phase, { type: "question" | "summary" }>;
}

// Backend belum menyimpan status "skip", jadi progres yang belum dikirim disimpan per user di browser.
const storageKey = (userId: string) => `panganesia:onboarding:${userId}`;

export function loadProgress(userId: string): SavedProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProgress;
    if (parsed?.v !== VERSION || !Array.isArray(parsed.messages) || !parsed.phase) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProgress(userId: string, data: Omit<SavedProgress, "v">) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify({ v: VERSION, ...data }));
  } catch {
    // Storage penuh / diblokir: onboarding tetap jalan, hanya tidak bisa dilanjutkan nanti
  }
}

export function clearProgress(userId: string) {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {}
}

export const answeredCount = (answers: Answers) => Object.keys(answers).length;
