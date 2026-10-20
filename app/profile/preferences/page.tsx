"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, CalendarDays, ArrowRight, RotateCcw, Pencil, Loader2, Check } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";
import type { OnboardingData } from "@/lib/onboarding-options";
import PangiAvatar from "@/components/onboarding/PangiAvatar";
import ChoicePicker from "@/components/onboarding/ChoicePicker";
import { ASSISTANT_NAME, STEP_COUNT, buildSteps, labelsFor, type Step, type Value } from "@/components/onboarding/onboarding-content";
import { loadProgress, answeredCount } from "@/components/onboarding/progress-storage";
import {
  useOnboardingStatus,
  useOnboardingOptions,
  onboardingStatusKey,
  requestOnboardingAutostart,
  type OnboardingStatus,
  type SavedPreferences,
} from "@/components/onboarding/useOnboardingStatus";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default function PreferencesPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, enabled, userId, session, sessionStatus } = useOnboardingStatus();
  const options = useOnboardingOptions(enabled);
  const steps = useMemo(() => (options.data ? buildSteps(options.data) : null), [options.data]);
  const [editing, setEditing] = useState(false);

  const startOnboarding = () => {
    requestOnboardingAutostart();
    router.push("/DashboardProduct");
  };

  const saved = userId && data && !data.completed ? loadProgress(userId) : null;
  const remaining = saved ? STEP_COUNT - answeredCount(saved.answers) : 0;
  const isAdmin = session?.user?.peran === "admin";
  const loading = isLoading || (!data && !isError) || !enabled || (data?.completed && !steps && !options.isError);

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
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-3xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : isError || !data || options.isError ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-sm text-red-700 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <span>Preferensi gagal dimuat. Coba lagi sebentar ya.</span>
            <button
              type="button"
              onClick={() => {
                refetch();
                options.refetch();
              }}
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
                : `Jawab ${STEP_COUNT} pertanyaan singkat bareng ${ASSISTANT_NAME}, nggak sampai semenit. Rekomendasi resep & produk bakal disesuaikan sama selera dan alergimu.`}
            </p>
            <button
              type="button"
              onClick={startOnboarding}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2a8a3a] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(42,138,58,0.25)] hover:bg-[#1f6e2b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532d]"
            >
              {saved ? "Lanjutin" : `Isi bareng ${ASSISTANT_NAME}`} <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        ) : editing && steps ? (
          <PreferenceEditor
            steps={steps}
            initial={data.preferences}
            userId={userId!}
            onDone={() => setEditing(false)}
          />
        ) : (
          steps && <PreferenceView steps={steps} preferences={data.preferences} onEdit={() => setEditing(true)} />
        )}
      </div>
    </main>
  );
}

// ─── Mode lihat ────────────────────────────────────────────────────────────────

function PreferenceView({
  steps,
  preferences,
  onEdit,
}: {
  steps: Step[];
  preferences: SavedPreferences;
  onEdit: () => void;
}) {
  const changed = preferences.updated_at && preferences.updated_at !== preferences.created_at;

  return (
    <>
      <section className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 rounded-[28px] bg-[#f4f7f2] border border-[#e3eae4] p-5 sm:p-6">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <PangiAvatar size={64} mood="happy" className="shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-[#14532d]">Ini preferensi yang kamu isi bareng {ASSISTANT_NAME}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <CalendarDays className="w-3.5 h-3.5" />
              {changed ? `Terakhir diubah ${formatDate(preferences.updated_at)}` : `Diisi pada ${formatDate(preferences.created_at)}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-full bg-[#2a8a3a] px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_14px_rgba(42,138,58,0.22)] hover:bg-[#1f6e2b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532d]"
        >
          <Pencil className="w-4 h-4" /> Ubah preferensi
        </button>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step) => {
          const values: Value[] = preferences[step.key] ?? [];
          const isAllergy = step.key === "allergies";
          const labels = labelsFor(step, values);
          return (
            <section
              key={step.key}
              className={`rounded-3xl border p-5 ${
                isAllergy && labels.length ? "border-amber-200 bg-amber-50/60" : "border-[#e3eae4] bg-white"
              } shadow-[0_4px_16px_rgba(16,40,24,0.04)]`}
            >
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-500">
                {isAllergy && <ShieldAlert className="w-4 h-4 text-amber-600" />}
                {step.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {labels.length ? (
                  labels.map((label) => (
                    <span
                      key={label}
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${
                        isAllergy ? "bg-amber-100 text-amber-900" : "bg-[#eaf6ec] text-[#14532d]"
                      }`}
                    >
                      {label}
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
    </>
  );
}

// ─── Mode ubah (PUT /api/onboarding) ──────────────────────────────────────────

function PreferenceEditor({
  steps,
  initial,
  userId,
  onDone,
}: {
  steps: Step[];
  initial: SavedPreferences;
  userId: string;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Record<string, Value[]>>(() =>
    Object.fromEntries(steps.map((s) => [s.key, [...((initial[s.key] as Value[]) ?? [])]]))
  );
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const invalid = steps.filter((s) => draft[s.key].length < s.min);
  const dirty = steps.some((s) => {
    const a = [...draft[s.key]].map(String).sort().join("|");
    const b = [...((initial[s.key] as Value[]) ?? [])].map(String).sort().join("|");
    return a !== b;
  });

  const toggle = (key: string, value: Value) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value] }));

  const save = async () => {
    if (invalid.length || !dirty || saving) return;
    setSaving(true);
    setServerError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft as unknown as OnboardingData),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setServerError(
          res.status === 400 && Array.isArray(data?.details)
            ? `Ada pilihan yang nggak valid: ${data.details.join("; ")}`
            : res.status === 401
              ? "Sesi login kamu habis. Masuk lagi lalu coba simpan ulang."
              : "Preferensi gagal disimpan. Coba lagi sebentar ya."
        );
        return;
      }
      queryClient.setQueryData<OnboardingStatus>(onboardingStatusKey(userId), {
        completed: true,
        preferences: data.preferences,
      });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast.success("Preferensi diperbarui", "Rekomendasi resep & produk ikut disesuaikan.");
      onDone();
    } catch {
      setServerError("Koneksinya lagi bermasalah. Coba simpan lagi ya.");
    } finally {
      setSaving(false);
    }
  };

  const actions = (
    <div className="flex items-center gap-2 self-end sm:self-auto">
      <button
        type="button"
        onClick={onDone}
        disabled={saving}
        className="rounded-full px-5 py-2.5 text-sm font-bold text-[#2a5b3d] hover:bg-[#eaf2ec] disabled:opacity-50"
      >
        Batal
      </button>
      <button
        type="submit"
        disabled={saving || !dirty || invalid.length > 0}
        className="inline-flex items-center gap-2 rounded-full bg-[#2a8a3a] px-6 py-2.5 text-sm font-bold text-white shadow-[0_6px_14px_rgba(42,138,58,0.22)] hover:bg-[#1f6e2b] disabled:bg-[#dde9df] disabled:text-[#87a08d] disabled:shadow-none disabled:cursor-not-allowed"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {saving ? "Menyimpan…" : "Simpan perubahan"}
      </button>
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 rounded-[28px] bg-[#f4f7f2] border border-[#e3eae4] p-5 sm:p-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <PangiAvatar size={56} mood="idle" className="shrink-0" />
          <p className="text-sm text-gray-600">
            Ubah yang perlu aja, lalu simpan. Rekomendasi resep & produk bakal langsung disesuaikan.
          </p>
        </div>
        {actions}
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const values = draft[step.key];
          const error = values.length < step.min;
          return (
            <fieldset
              key={step.key}
              className={`rounded-3xl border bg-white p-5 shadow-[0_4px_16px_rgba(16,40,24,0.04)] ${
                error ? "border-red-200" : "border-[#e3eae4]"
              }`}
            >
              <legend className="sr-only">{step.title}</legend>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="flex items-center gap-2 text-base font-bold text-[#14532d]">
                  {step.key === "allergies" && <ShieldAlert className="w-4 h-4 text-amber-600" />}
                  {step.title}
                </h2>
                <span className={`text-xs font-semibold ${error ? "text-red-600" : "text-gray-500"}`}>
                  {error ? "Pilih minimal satu" : step.hint}
                </span>
              </div>
              <ChoicePicker
                step={step}
                selected={values}
                noneChosen={step.min === 0 && values.length === 0}
                onToggle={(v) => toggle(step.key, v)}
                onNone={() => setDraft((d) => ({ ...d, [step.key]: [] }))}
              />
            </fieldset>
          );
        })}
      </div>

      {serverError && (
        <p role="alert" className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center gap-3 rounded-3xl border border-[#e3eae4] bg-[#f9fbf9] px-5 py-4">
        <span className="sm:mr-auto text-xs text-gray-500">
          {invalid.length ? `Lengkapi: ${invalid.map((s) => s.title).join(", ")}` : dirty ? "Ada perubahan yang belum disimpan" : "Belum ada perubahan"}
        </span>
        {actions}
      </div>
    </form>
  );
}
