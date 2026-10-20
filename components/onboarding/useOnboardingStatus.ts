"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import type { OnboardingData } from "@/lib/onboarding-options";
import type { OnboardingOptions } from "./onboarding-content";

export type SavedPreferences = OnboardingData & { created_at: string; updated_at: string };

export interface OnboardingStatus {
  completed: boolean;
  preferences: SavedPreferences | null;
}

export const onboardingStatusKey = (userId?: string) => ["onboarding-status", userId] as const;

/** Status onboarding user yang sedang login (GET /api/onboarding). Admin tidak ikut onboarding. */
export function useOnboardingStatus() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const enabled = status === "authenticated" && !!userId && session?.user?.peran !== "admin";

  const query = useQuery<OnboardingStatus>({
    queryKey: onboardingStatusKey(userId),
    queryFn: async () => {
      const res = await fetch("/api/onboarding");
      if (!res.ok) throw new Error(`Status onboarding gagal dimuat (${res.status})`);
      return res.json();
    },
    enabled,
    staleTime: Infinity,
    retry: false,
  });

  return { ...query, enabled, userId, session, sessionStatus: status };
}

/** Opsi dinamis onboarding (kelompok bahan pangan & produk) dari database */
export function useOnboardingOptions(enabled = true) {
  return useQuery<OnboardingOptions>({
    queryKey: ["onboarding-options"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding/options");
      if (!res.ok) throw new Error(`Opsi onboarding gagal dimuat (${res.status})`);
      return res.json();
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

// Dipakai halaman lain (mis. Profil) untuk langsung membuka chat onboarding setelah pindah ke dashboard
const AUTOSTART_KEY = "panganesia:onboarding-autostart";

export function requestOnboardingAutostart() {
  try {
    sessionStorage.setItem(AUTOSTART_KEY, "1");
  } catch {}
}

export function hasOnboardingAutostart() {
  try {
    return sessionStorage.getItem(AUTOSTART_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearOnboardingAutostart() {
  try {
    sessionStorage.removeItem(AUTOSTART_KEY);
  } catch {}
}

// Membuka chat onboarding dari komponen lain di halaman yang sama (mis. kartu rekomendasi)
const OPEN_EVENT = "panganesia:open-onboarding";

/** Return `false` kalau tidak ada OnboardingAssistant di halaman ini yang menangani. */
export function openOnboardingHere(): boolean {
  const detail = { handled: false };
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail }));
  return detail.handled;
}

export function onOpenOnboarding(handler: () => void) {
  const listener = (e: Event) => {
    (e as CustomEvent<{ handled: boolean }>).detail.handled = true;
    handler();
  };
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
}
