"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, Info, CalendarDays, ArrowRight, RotateCcw } from "lucide-react";
import PangiAvatar from "@/components/onboarding/PangiAvatar";
import { ASSISTANT_NAME, STEPS } from "@/components/onboarding/onboarding-content";
import { loadProgress, answeredCount } from "@/components/onboarding/progress-storage";
import { useOnboardingStatus, requestOnboardingAutostart } from "@/components/onboarding/useOnboardingStatus";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default function PreferencesPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, enabled, userId, session, sessionStatus } = useOnboardingStatus();

  const startOnboarding = () => {
    requestOnboardingAutostart();
    router.push("/DashboardProduct");
  };

  const saved = userId && data && !data.completed ? loadProgress(userId) : null;
  const remaining = saved ? STEPS.length - answeredCount(saved.answers) : 0;
  const isAdmin = session?.user?.peran === "admin";

  return (
    <main className="flex-1 p-4 sm:p-12 bg-white min-h-screen">
      <div className="max-w-[1100px]">
        <header className="flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#062F24] tracking-tight">Preferensi Makanan</h1>
            <p className="text-gray-500 text-sm mt-1">
              Dipakai {ASSISTANT_NAME} buat nyesuaiin rekomendasi resep & produk untukmu
            </p>
          </div>
          <Link
            href="/DashboardProduct"
            className="text-[#064E3B] font-bold text-sm hover:underline flex items-center gap-2 mb-2 sm:mb-0 self-start sm:self-auto"
          >
            <span>← Kembali ke Toko</span>
          </Link>
        </header>

        {isAdmin ? (
          <p className="text-gray-500 text-sm">Akun admin tidak memiliki preferensi makanan.</p>
        ) : sessionStatus === "unauthenticated" ? (
          <p className="text-gray-500 text-sm">
            Sesi login kamu nggak ketemu.{" "}
            <Link href="/auth" className="font-bold text-[#064E3B] hover:underline">
              Masuk lagi
            </Link>{" "}
            untuk melihat preferensimu.
          </p>
        ) : isLoading || (!data && !isError) || !enabled ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-3xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-sm text-red-700 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <span>Preferensi gagal dimuat. Coba lagi sebentar ya.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 font-bold text-red-700 border border-red-200 hover:bg-red-100"
            >
              <RotateCcw className="w-4 h-4" /> Coba lagi
            </button>
          </div>
        ) : !data.completed || !data.preferences ? (
          <section className="rounded-[28px] bg-[#f4f7f2] border border-[#e3eae4] p-8 sm:p-12 flex flex-col items-center text-center">
            <PangiAvatar size={112} mood="idle" />
            <h2 className="mt-5 text-xl font-extrabold text-[#14532d]">Kamu belum isi preferensi</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">
              {saved
                ? `Tinggal ${remaining} pertanyaan lagi! Lanjutin bareng ${ASSISTANT_NAME} biar rekomendasinya pas buat kamu.`
                : `Jawab ${STEPS.length} pertanyaan singkat bareng ${ASSISTANT_NAME}, nggak sampai semenit. Rekomendasi resep & produk bakal disesuaikan sama selera dan alergimu.`}
            </p>
            <button
              type="button"
              onClick={startOnboarding}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2a8a3a] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(42,138,58,0.25)] hover:bg-[#1f6e2b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532d]"
            >
              {saved ? "Lanjutin" : `Isi bareng ${ASSISTANT_NAME}`} <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        ) : (
          <>
            <section className="mb-6 flex items-center gap-4 rounded-[28px] bg-[#f4f7f2] border border-[#e3eae4] p-5 sm:p-6">
              <PangiAvatar size={64} mood="happy" className="shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-[#14532d]">Ini preferensi yang kamu isi bareng {ASSISTANT_NAME}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <CalendarDays className="w-3.5 h-3.5" /> Diisi pada {formatDate(data.preferences.created_at)}
                </p>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {STEPS.map((step) => {
                const values = data.preferences![step.key] ?? [];
                const isAllergy = step.key === "allergies";
                const chosen = step.options.filter((o) => values.includes(o.value));
                return (
                  <section
                    key={step.key}
                    className={`rounded-3xl border p-5 ${
                      isAllergy && chosen.length ? "border-amber-200 bg-amber-50/60" : "border-[#e3eae4] bg-white"
                    } shadow-[0_4px_16px_rgba(16,40,24,0.04)]`}
                  >
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-500">
                      {isAllergy && <ShieldAlert className="w-4 h-4 text-amber-600" />}
                      {step.title}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {chosen.length ? (
                        chosen.map((o) => (
                          <span
                            key={o.value}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                              isAllergy ? "bg-amber-100 text-amber-900" : "bg-[#eaf6ec] text-[#14532d]"
                            }`}
                          >
                            {o.label}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-500">
                          {step.noneLabel ?? "-"}
                        </span>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            <p className="mt-6 flex items-start gap-2 rounded-2xl bg-[#fff8e1] border border-[#f6e3a8] px-4 py-3 text-sm text-[#6b5a1e]">
              <Info className="mt-0.5 w-4 h-4 shrink-0" />
              Fitur ubah preferensi segera hadir. Untuk sekarang, preferensi yang sudah disimpan belum bisa diganti.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
