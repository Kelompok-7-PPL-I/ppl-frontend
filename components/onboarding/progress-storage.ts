import type { OnboardingData } from "@/lib/onboarding-options";

export type Answers = {
  [K in keyof OnboardingData]?: OnboardingData[K];
};

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

interface SavedProgress {
  v: 1;
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
    if (parsed?.v !== 1 || !Array.isArray(parsed.messages) || !parsed.phase) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProgress(userId: string, data: Omit<SavedProgress, "v">) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify({ v: 1, ...data }));
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
