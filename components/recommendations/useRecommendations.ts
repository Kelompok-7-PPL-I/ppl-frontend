"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import type { RecoPage, RecoResponse } from "@/lib/recommendation/types";

/** Rekomendasi untuk user yang sedang login. Disusun ulang saat preferensi berubah (invalidate ["recommendations"]). */
export function useRecommendations(page: RecoPage) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const enabled = status === "authenticated" && !!userId && session?.user?.peran !== "admin";

  const query = useQuery<RecoResponse>({
    queryKey: ["recommendations", page, userId],
    queryFn: async () => {
      const res = await fetch(`/api/recommendations/shelves?page=${page}`);
      if (!res.ok) throw new Error(`Rekomendasi gagal dimuat (${res.status})`);
      return res.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return { ...query, enabled };
}
