"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";
import PangiAvatar from "@/components/onboarding/PangiAvatar";
import { ASSISTANT_NAME } from "@/components/onboarding/onboarding-content";
import { useOnboardingOptions } from "@/components/onboarding/useOnboardingStatus";
import { topProfileDimensions, type DimensionGroup } from "@/lib/recommendation/explain";
import { toVector } from "@/lib/recommendation/features";

interface ProfileVectorResponse {
  data: { vector: unknown; interaction_count: number; updated_at: string };
}

export const profileVectorKey = (userId?: string) => ["profile-vector", userId] as const;

const GROUP_LABEL: Record<DimensionGroup, string> = {
  nutrition: "Nutrisi",
  kelompok: "Bahan",
  category: "Tujuan",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

/**
 * Selera yang dipelajari engine (user profile vector): gabungan preferensi onboarding + aktivitas.
 * Bisa diatur ulang ke preferensi awal (POST /api/profile/vector).
 */
export default function LearnedTasteCard({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const options = useOnboardingOptions();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  const { data, isLoading, isError } = useQuery<ProfileVectorResponse>({
    queryKey: profileVectorKey(userId),
    queryFn: async () => {
      const res = await fetch("/api/profile/vector");
      if (!res.ok) throw new Error(`Profil selera gagal dimuat (${res.status})`);
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  const dims = useMemo(() => {
    const vector = toVector(data?.data.vector);
    if (!vector) return [];
    const names = new Map((options.data?.kelompok ?? []).map((k) => [k.id, k.nama]));
    return topProfileDimensions(vector, names, 6);
  }, [data, options.data]);

  const reset = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/profile/vector", { method: "POST" });
      if (!res.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: profileVectorKey(userId) });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast.success("Selera diatur ulang", "Rekomendasi kembali mengikuti preferensi awalmu.");
      setConfirming(false);
    } catch {
      toast.danger("Gagal mengatur ulang", "Coba lagi sebentar ya.");
    } finally {
      setResetting(false);
    }
  };

  if (isError || (!isLoading && !dims.length)) return null;

  return (
    <section className="mt-6 rounded-3xl border border-[#e3eae4] bg-white p-5 sm:p-6 shadow-[0_4px_16px_rgba(16,40,24,0.04)]">
      <div className="flex items-start gap-4">
        <PangiAvatar size={48} mood="thinking" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-[#14532d]">Yang {ASSISTANT_NAME} pelajari dari seleramu</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gabungan preferensimu dan aktivitas belanja. Makin sering kamu berinteraksi, makin pas rekomendasinya.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3" aria-busy="true">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-5 rounded-full bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {dims.map((d) => (
            <li key={d.index} className="grid grid-cols-[minmax(0,9rem)_1fr] sm:grid-cols-[12rem_1fr] items-center gap-3">
              <span className="truncate text-sm font-semibold text-[#24382b]" title={d.label}>
                <span className="mr-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">{GROUP_LABEL[d.group]}</span>
                {d.label}
              </span>
              <span
                className="h-2.5 rounded-full bg-[#eaf2ec] overflow-hidden"
                role="meter"
                aria-label={`${d.label}: ${Math.round(d.strength * 100)}%`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(d.strength * 100)}
              >
                <span className="block h-full rounded-full bg-[#2a8a3a]" style={{ width: `${Math.max(6, d.strength * 100)}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}

      {data && (
        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center gap-3 border-t border-dashed border-[#e3eae4] pt-4">
          <p className="sm:mr-auto text-xs text-gray-500">
            Dari {data.data.interaction_count} aktivitas · diperbarui {formatDate(data.data.updated_at)}
          </p>
          {confirming ? (
            <div className="flex flex-wrap items-center gap-2" role="alertdialog" aria-label="Konfirmasi atur ulang selera">
              <span className="text-xs text-gray-600">Yang dipelajari dari aktivitasmu akan dihapus. Lanjut?</span>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={resetting}
                className="rounded-full px-4 py-2 text-xs font-bold text-[#2a5b3d] hover:bg-[#f1f6f2]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={resetting}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2a8a3a] px-4 py-2 text-xs font-bold text-white hover:bg-[#1f6e2b] disabled:opacity-60"
              >
                {resetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Ya, atur ulang
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-[#dfe7e1] px-4 py-2 text-xs font-bold text-[#34483b] hover:bg-[#f4f7f2]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Atur ulang ke preferensi
            </button>
          )}
        </div>
      )}
    </section>
  );
}
