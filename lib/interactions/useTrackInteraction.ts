"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

// Kontrak POST /api/interactions (lihat route interaksi). id_user TIDAK dikirim: server mengambilnya dari session.
export type InteractionItem = "product" | "recipe";
// "purchase" dicatat server saat pembayaran terkonfirmasi; "filter" belum punya item_id.
export type InteractionEvent = "view" | "cart" | "favorite";

const VIEW_DEDUPE_MS = 30 * 60 * 1000;

/** View yang sama dalam 30 menit cukup dicatat sekali (re-render, StrictMode, bolak-balik halaman) */
function isDuplicateView(type: InteractionItem, id: number) {
  try {
    const key = `panganesia:viewed:${type}:${id}`;
    const last = Number(sessionStorage.getItem(key));
    if (last && Date.now() - last < VIEW_DEDUPE_MS) return true;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {}
  return false;
}

/**
 * Catat interaksi user untuk rekomendasi. Fire-and-forget: gagal mencatat tidak boleh mengganggu user.
 * Hanya untuk user login non-admin.
 */
export function useTrackInteraction() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const enabled = status === "authenticated" && !!session?.user?.id && session.user.peran !== "admin";

  return useCallback(
    (type: InteractionItem, id: number, event: InteractionEvent) => {
      if (!enabled || !Number.isInteger(id) || id <= 0) return;
      if (event === "view" && isDuplicateView(type, id)) return;

      fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_type: type, item_id: id, event }),
        keepalive: true, // tetap terkirim walau user langsung pindah halaman
      })
        .then((res) => {
          // Rekomendasi ditandai basi supaya disusun ulang saat rak berikutnya tampil
          if (res.ok) queryClient.invalidateQueries({ queryKey: ["recommendations"], refetchType: "none" });
        })
        .catch(() => {});
    },
    [enabled, queryClient]
  );
}
