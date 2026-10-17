"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Check, ArrowRight, Pencil, RotateCcw, Loader2 } from "lucide-react";
import type { OnboardingData } from "@/lib/onboarding-options";
import PangiAvatar, { type AvatarMood } from "./PangiAvatar";
import { ASSISTANT_NAME, STEPS, availableOptions, answerText, labelsFor } from "./onboarding-content";
import type { SavedPreferences } from "./useOnboardingStatus";
import {
  type Answers,
  type Message,
  type Phase,
  loadProgress,
  saveProgress,
  clearProgress,
  answeredCount,
} from "./progress-storage";
import styles from "./Onboarding.module.css";

type Pending = string | { summary: Answers };

interface Props {
  userId: string;
  userName: string;
  /** "exit" = keluar sebelum selesai, "done" = selesai & tersimpan */
  /** `next` = halaman tujuan setelah chat ditutup */
  onClose: (reason: "exit" | "done", answered: number, next?: string) => void;
  onCompleted: (preferences?: SavedPreferences) => void;
}

let idCounter = 0;
const newId = () => `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

const toMessage = (item: Pending): Message =>
  typeof item === "string"
    ? { id: newId(), from: "bot", text: item }
    : { id: newId(), from: "bot", summary: item.summary };

const SUMMARY_INTRO = "Ini rangkuman preferensimu. Udah sesuai belum?";

/** Langkah berikutnya, melewati step yang opsinya habis (mis. semua karbo disukai → tidak ada yang bisa dihindari) */
function nextStep(from: number, answers: Answers): { index: number; answers: Answers; skipped: boolean } {
  let index = from;
  let skipped = false;
  let next = answers;
  while (index < STEPS.length && availableOptions(STEPS[index], next).length === 0) {
    next = { ...next, [STEPS[index].key]: [] };
    skipped = true;
    index++;
  }
  return { index, answers: next, skipped };
}

function initialState(userId: string, firstName: string) {
  const saved = loadProgress(userId);
  if (saved) {
    const reask: Pending[] =
      saved.phase.type === "summary"
        ? [SUMMARY_INTRO, { summary: saved.answers }]
        : STEPS[saved.phase.step].prompt;
    return {
      messages: [...saved.messages, { id: newId(), from: "system" as const, text: "Dilanjutkan dari sesi sebelumnya" }],
      answers: saved.answers,
      phase: saved.phase as Phase,
      queue: [`Hai lagi, ${firstName}! Kita lanjut dari yang tadi ya.`, ...reask],
      restored: saved.messages.length + 1,
    };
  }
  return {
    messages: [] as Message[],
    answers: {} as Answers,
    phase: { type: "question", step: 0, editing: false } as Phase,
    queue: [
      `Hai ${firstName}! Aku ${ASSISTANT_NAME}, teman masakmu di Panganesia.`,
      `Biar rekomendasi resep yang aku kasih pas sama selera dan kebutuhanmu, aku mau tanya ${STEPS.length} hal singkat ya. Nggak sampai semenit kok!`,
      ...STEPS[0].prompt,
    ] as Pending[],
    restored: 0,
  };
}

export default function OnboardingChat({ userId, userName, onClose, onCompleted }: Props) {
  const reduceMotion = useReducedMotion();
  const firstName = userName.trim().split(/\s+/)[0] || "kamu";

  const [init] = useState(() => initialState(userId, firstName));
  const [messages, setMessages] = useState<Message[]>(init.messages);
  const [answers, setAnswers] = useState<Answers>(init.answers);
  const [phase, setPhase] = useState<Phase>(init.phase);
  const [queue, setQueue] = useState<Pending[]>(init.queue);
  const [selected, setSelected] = useState<string[]>([]);
  const [noneChosen, setNoneChosen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const busy = queue.length > 0;

  // Antrian bubble avatar: tampilkan indikator mengetik, lalu munculkan bubble satu per satu
  useEffect(() => {
    if (!queue.length) return;
    const [head, ...rest] = queue;
    const length = typeof head === "string" ? head.length : 60;
    const delay = reduceMotion ? 120 : Math.min(1400, Math.max(550, 380 + length * 14));
    const timer = setTimeout(() => {
      setMessages((m) => [...m, toMessage(head)]);
      setQueue(rest);
    }, delay);
    return () => clearTimeout(timer);
  }, [queue, reduceMotion]);

  // Simpan progres agar bisa dilanjutkan setelah keluar
  useEffect(() => {
    if (phase.type === "question" || phase.type === "summary") {
      saveProgress(userId, { messages, answers, phase });
    }
  }, [userId, messages, answers, phase]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" }));
  }, [messages.length, busy, phase, reduceMotion]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const answered = answeredCount(answers);

  const requestClose = () => {
    if (phase.type === "done") return onClose("done", answered);
    if (answered === 0) return onClose("exit", 0);
    setConfirmExit(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    if (confirmExit) setConfirmExit(false);
    else requestClose();
  };

  const say = (items: Pending[]) => setQueue((q) => [...q, ...items]);
  const pushUser = (text: string) => setMessages((m) => [...m, { id: newId(), from: "user", text }]);

  const goToStep = (step: number, editing: boolean, current: Answers) => {
    setPhase({ type: "question", step, editing });
    setSelected(editing ? current[STEPS[step].key] ?? [] : []);
    setNoneChosen(editing && (current[STEPS[step].key]?.length ?? 0) === 0);
  };

  const sendAnswer = () => {
    if (phase.type !== "question") return;
    const step = STEPS[phase.step];
    const values = noneChosen ? [] : selected;

    let next: Answers = { ...answers, [step.key]: values };
    const notes: string[] = [step.react(values)];

    // Jaga aturan backend: bahan yang disukai tidak boleh ada di daftar yang dihindari
    if (step.key === "ingredient_preferences" && next.avoided_ingredients?.length) {
      const removed = next.avoided_ingredients.filter((v) => values.includes(v));
      if (removed.length) {
        next.avoided_ingredients = next.avoided_ingredients.filter((v) => !values.includes(v));
        const avoidStep = STEPS.find((s) => s.key === "avoided_ingredients")!;
        notes.push(`Aku juga hapus ${labelsFor(avoidStep, removed).join(", ")} dari daftar yang kamu hindari ya.`);
      }
    }

    pushUser(answerText(step, values));

    if (phase.editing) {
      setAnswers(next);
      setPhase({ type: "summary" });
      say([...notes, SUMMARY_INTRO, { summary: next }]);
      return;
    }

    const upcoming = nextStep(phase.step + 1, next);
    next = upcoming.answers;
    if (upcoming.skipped) {
      notes.push("Karena kamu suka semua sumber karbo, pertanyaan soal yang dihindari aku lewati ya.");
    }
    setAnswers(next);

    if (upcoming.index < STEPS.length) {
      goToStep(upcoming.index, false, next);
      say([...notes, ...STEPS[upcoming.index].prompt]);
    } else {
      setPhase({ type: "summary" });
      say([...notes, SUMMARY_INTRO, { summary: next }]);
    }
  };

  const editStep = (index: number) => {
    if (busy) return;
    pushUser(`Ubah ${STEPS[index].title.toLowerCase()}`);
    goToStep(index, true, answers);
    say(["Boleh! Pilih lagi ya:", ...STEPS[index].prompt]);
  };

  const save = async () => {
    if (phase.type !== "summary" && phase.type !== "error") return;
    const payload = Object.fromEntries(STEPS.map((s) => [s.key, answers[s.key] ?? []])) as unknown as OnboardingData;

    if (phase.type === "summary") pushUser("Udah sesuai, simpan!");
    setPhase({ type: "submitting" });

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok || res.status === 409) {
        clearProgress(userId);
        setPhase({ type: "done" });
        onCompleted(res.ok ? data?.preferences : undefined);
        say([
          ...(res.ok
            ? [
                "Yeay, preferensimu udah tersimpan!",
                "Mulai sekarang rekomendasi resep dan produk buat kamu bakal aku sesuaikan. Selamat masak!",
              ]
            : ["Ternyata preferensimu udah pernah tersimpan sebelumnya, jadi kita aman."]),
          "Jawabanmu bisa kamu cek lagi kapan aja di Profil → Preferensi Makanan.",
        ]);
        return;
      }

      console.error("Onboarding gagal disimpan:", data);
      setPhase({ type: "error" });
      say([
        res.status === 401
          ? "Sesi login kamu habis nih. Coba masuk lagi, nanti jawabanmu masih ada kok."
          : "Ups, aku gagal nyimpen jawabanmu. Coba sekali lagi ya.",
      ]);
    } catch {
      setPhase({ type: "error" });
      say(["Koneksinya lagi putus-nyambung nih. Jawabanmu masih aman, coba kirim lagi ya."]);
    }
  };

  const mood: AvatarMood =
    phase.type === "done" && !busy
      ? "happy"
      : busy
        ? "talking"
        : phase.type === "submitting" || phase.type === "error"
          ? "thinking"
          : "idle";

  const status = busy
    ? "sedang mengetik…"
    : phase.type === "question"
      ? phase.editing
        ? "Mengubah jawaban"
        : `Pertanyaan ${phase.step + 1} dari ${STEPS.length}`
      : phase.type === "done"
        ? "Preferensi tersimpan"
        : phase.type === "submitting"
          ? "Menyimpan…"
          : "Hampir selesai";

  const lastSummaryId = [...messages].reverse().find((m) => m.summary)?.id;
  const msgAnim = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 10, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 } };

  return (
    <div
      ref={dialogRef}
      className={styles.chat}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      {/* ── Header ── */}
      <header className={styles.chatHeader}>
        <div className={styles.chatHeaderAvatar}>
          <PangiAvatar size={44} mood={mood} />
          <span className={styles.onlineDot} />
        </div>
        <div className={styles.chatHeaderText}>
          <h2 id="onboarding-title" className={styles.chatTitle}>{ASSISTANT_NAME}</h2>
          <p className={styles.chatStatus} aria-live="polite">{status}</p>
        </div>
        <button type="button" className={styles.iconBtn} onClick={requestClose} aria-label="Tutup onboarding">
          <X size={20} />
        </button>
      </header>

      <div
        className={styles.progress}
        role="progressbar"
        aria-label="Progres onboarding"
        aria-valuemin={0}
        aria-valuemax={STEPS.length}
        aria-valuenow={answered}
      >
        {STEPS.map((s) => (
          <span key={s.key} className={`${styles.progressSeg} ${answers[s.key] ? styles.progressSegDone : ""}`} />
        ))}
      </div>

      {/* ── Percakapan ── */}
      <div ref={scrollRef} className={styles.thread} aria-live="polite" aria-relevant="additions">
        {messages.map((m, i) => {
          if (m.from === "system") {
            return (
              <div key={m.id} className={styles.divider}>
                <span>{m.text}</span>
              </div>
            );
          }

          const prev = messages[i - 1];
          const next = messages[i + 1];
          const firstInGroup = prev?.from !== m.from;
          const lastInGroup = next ? next.from !== m.from : !(m.from === "bot" && busy);
          const isBot = m.from === "bot";
          const anim = i < init.restored ? { initial: false as const, animate: msgAnim.animate } : msgAnim;

          return (
            <motion.div
              key={m.id}
              {...anim}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={`${styles.row} ${isBot ? styles.rowBot : styles.rowUser} ${firstInGroup ? styles.rowFirst : ""}`}
            >
              {isBot && (
                <div className={styles.rowAvatar}>{lastInGroup && <PangiAvatar size={30} />}</div>
              )}
              {m.summary ? (
                <SummaryCard
                  answers={m.summary}
                  interactive={m.id === lastSummaryId && phase.type === "summary" && !busy}
                  onEdit={editStep}
                />
              ) : (
                <div
                  className={`${styles.bubble} ${isBot ? styles.bubbleBot : styles.bubbleUser} ${
                    firstInGroup ? styles.bubbleFirst : ""
                  } ${lastInGroup ? styles.bubbleLast : ""}`}
                >
                  {m.text}
                </div>
              )}
            </motion.div>
          );
        })}

        <AnimatePresence>
          {busy && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className={`${styles.row} ${styles.rowBot} ${messages.at(-1)?.from !== "bot" ? styles.rowFirst : ""}`}
            >
              <div className={styles.rowAvatar}>
                <PangiAvatar size={30} mood="talking" />
              </div>
              <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.bubbleLast} ${styles.typing}`} aria-label={`${ASSISTANT_NAME} sedang mengetik`}>
                <span />
                <span />
                <span />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Area jawaban ── */}
      <AnimatePresence mode="wait">
        {!busy && (
          <motion.div
            key={`${phase.type}-${phase.type === "question" ? phase.step : ""}`}
            className={styles.composer}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 8, transition: { duration: 0.12 } }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {phase.type === "question" && (
              <QuestionComposer
                stepIndex={phase.step}
                answers={answers}
                selected={selected}
                noneChosen={noneChosen}
                onToggle={(v) => {
                  setNoneChosen(false);
                  setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
                }}
                onNone={() => {
                  setSelected([]);
                  setNoneChosen((n) => !n);
                }}
                onSend={sendAnswer}
              />
            )}

            {phase.type === "summary" && (
              <>
                <p className={styles.composerNote}>
                  Setelah disimpan, preferensi cuma bisa dilihat di Profil (belum bisa diubah), jadi cek lagi ya. Ketuk <b>Ubah</b> di kartu kalau ada yang mau diganti.
                </p>
                <button type="button" className={styles.primaryBtn} onClick={save}>
                  Simpan preferensi <Check size={18} />
                </button>
              </>
            )}

            {phase.type === "submitting" && (
              <button type="button" className={styles.primaryBtn} disabled>
                <Loader2 size={18} className={styles.spin} /> Menyimpan…
              </button>
            )}

            {phase.type === "error" && (
              <button type="button" className={styles.primaryBtn} onClick={save}>
                <RotateCcw size={18} /> Coba simpan lagi
              </button>
            )}

            {phase.type === "done" && (
              <div className={styles.doneActions}>
                <button type="button" className={styles.primaryBtn} onClick={() => onClose("done", answered, "/recipes")}>
                  Jelajahi resep <ArrowRight size={18} />
                </button>
                <button type="button" className={styles.ghostBtn} onClick={() => onClose("done", answered)}>
                  Lanjut belanja
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Exit plan: konfirmasi keluar ── */}
      <AnimatePresence>
        {confirmExit && (
          <motion.div
            className={styles.sheetBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmExit(false)}
          >
            <motion.div
              className={styles.sheet}
              role="alertdialog"
              aria-labelledby="exit-title"
              aria-describedby="exit-desc"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.sheetHandle} />
              <PangiAvatar size={64} mood="thinking" />
              <h3 id="exit-title" className={styles.sheetTitle}>Mau berhenti dulu?</h3>
              <p id="exit-desc" className={styles.sheetText}>
                Tenang, {answered} dari {STEPS.length} jawabanmu udah aku simpan. Kamu bisa lanjut kapan aja lewat aku di pojok kiri bawah.
              </p>
              <button type="button" className={styles.primaryBtn} onClick={() => setConfirmExit(false)} autoFocus>
                Lanjut isi
              </button>
              <button type="button" className={styles.ghostBtn} onClick={() => onClose("exit", answered)}>
                Keluar dulu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-komponen ──────────────────────────────────────────────────────────────

function QuestionComposer({
  stepIndex,
  answers,
  selected,
  noneChosen,
  onToggle,
  onNone,
  onSend,
}: {
  stepIndex: number;
  answers: Answers;
  selected: string[];
  noneChosen: boolean;
  onToggle: (value: string) => void;
  onNone: () => void;
  onSend: () => void;
}) {
  const step = STEPS[stepIndex];
  const options = availableOptions(step, answers);
  const valid = noneChosen || selected.length >= Math.max(1, step.min);
  const count = noneChosen ? 0 : selected.length;

  return (
    <>
      <p className={styles.composerHint}>{step.hint}</p>
      <div className={styles.chips} role="group" aria-label={step.title}>
        {options.map((o, i) => {
          const active = selected.includes(o.value);
          return (
            <motion.button
              key={o.value}
              type="button"
              className={`${styles.chip} ${active ? styles.chipActive : ""}`}
              aria-pressed={active}
              onClick={() => onToggle(o.value)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035, duration: 0.2 }}
              whileTap={{ scale: 0.95 }}
            >
              {o.label}
              {active && <Check size={15} strokeWidth={3} className={styles.chipCheck} />}
            </motion.button>
          );
        })}
        {step.noneLabel && (
          <motion.button
            type="button"
            className={`${styles.chip} ${styles.chipNone} ${noneChosen ? styles.chipActive : ""}`}
            aria-pressed={noneChosen}
            onClick={onNone}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: options.length * 0.035, duration: 0.2 }}
            whileTap={{ scale: 0.95 }}
          >
            {step.noneLabel}
            {noneChosen && <Check size={15} strokeWidth={3} className={styles.chipCheck} />}
          </motion.button>
        )}
      </div>
      <button type="button" className={styles.primaryBtn} onClick={onSend} disabled={!valid}>
        {valid ? (count > 1 ? `Kirim ${count} pilihan` : "Kirim") : step.min > 0 ? "Pilih minimal satu" : "Pilih salah satu"}
        {valid && <ArrowRight size={18} />}
      </button>
    </>
  );
}

function SummaryCard({
  answers,
  interactive,
  onEdit,
}: {
  answers: Answers;
  interactive: boolean;
  onEdit: (index: number) => void;
}) {
  return (
    <div className={styles.summary}>
      <p className={styles.summaryTitle}>Preferensi kamu</p>
      <ul className={styles.summaryList}>
        {STEPS.map((step, i) => {
          const values = answers[step.key] ?? [];
          const editable = interactive && availableOptions(step, answers).length > 0;
          return (
            <li key={step.key} className={styles.summaryRow}>
              <div className={styles.summaryRowHead}>
                <span className={styles.summaryLabel}>{step.title}</span>
                {editable && (
                  <button type="button" className={styles.editBtn} onClick={() => onEdit(i)} aria-label={`Ubah ${step.title}`}>
                    <Pencil size={13} /> Ubah
                  </button>
                )}
              </div>
              <div className={styles.summaryValues}>
                {values.length ? (
                  step.options
                    .filter((o) => values.includes(o.value))
                    .map((o) => (
                      <span key={o.value} className={styles.summaryTag}>
                        {o.label}
                      </span>
                    ))
                ) : (
                  <span className={`${styles.summaryTag} ${styles.summaryTagMuted}`}>{step.noneLabel ?? "-"}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
