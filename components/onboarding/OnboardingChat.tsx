"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Check, ArrowRight, Pencil, RotateCcw, Loader2 } from "lucide-react";
import type { OnboardingData } from "@/lib/onboarding-options";
import PangiAvatar, { type AvatarMood } from "./PangiAvatar";
import ChoicePicker from "./ChoicePicker";
import { ASSISTANT_NAME, STEP_COUNT, buildSteps, answerText, labelsFor, type Step, type Value } from "./onboarding-content";
import { useOnboardingOptions, type SavedPreferences } from "./useOnboardingStatus";
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
  /** "exit" = keluar sebelum selesai, "done" = selesai & tersimpan; `next` = halaman tujuan setelah ditutup */
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

function initialState(steps: Step[], userId: string, firstName: string) {
  const saved = loadProgress(userId);
  if (saved) {
    const reask: Pending[] =
      saved.phase.type === "summary"
        ? [SUMMARY_INTRO, { summary: saved.answers }]
        : steps[saved.phase.step].prompt;
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
      `Biar rekomendasi resep yang aku kasih pas sama selera dan kebutuhanmu, aku mau tanya ${STEP_COUNT} hal singkat ya. Nggak sampai semenit kok!`,
      ...steps[0].prompt,
    ] as Pending[],
    restored: 0,
  };
}

/** Chat onboarding. Menunggu opsi kelompok bahan & produk dari database sebelum percakapan dimulai. */
export default function OnboardingChat(props: Props) {
  const { data: options, isError, refetch, isFetching } = useOnboardingOptions();
  const steps = useMemo(() => (options ? buildSteps(options) : null), [options]);

  if (steps) return <ChatSession {...props} steps={steps} />;

  return (
    <div className={`${styles.chat} ${styles.chatLoading}`} role="dialog" aria-modal="true" aria-label={`Onboarding bersama ${ASSISTANT_NAME}`}>
      <button
        type="button"
        className={`${styles.iconBtn} ${styles.loadingClose}`}
        onClick={() => props.onClose("exit", 0)}
        aria-label="Tutup onboarding"
      >
        <X size={20} />
      </button>
      <PangiAvatar size={96} mood={isError ? "thinking" : "talking"} />
      {isError ? (
        <>
          <p className={styles.loadingText}>Aku gagal ambil daftar bahan pangan. Coba lagi ya.</p>
          <button type="button" className={styles.primaryBtn} onClick={() => refetch()} disabled={isFetching}>
            <RotateCcw size={18} /> Coba lagi
          </button>
        </>
      ) : (
        <p className={styles.loadingText} aria-live="polite">
          Menyiapkan pertanyaan…
        </p>
      )}
    </div>
  );
}

function ChatSession({ userId, userName, onClose, onCompleted, steps }: Props & { steps: Step[] }) {
  const reduceMotion = useReducedMotion();
  const firstName = userName.trim().split(/\s+/)[0] || "kamu";

  const [init] = useState(() => initialState(steps, userId, firstName));
  const [messages, setMessages] = useState<Message[]>(init.messages);
  const [answers, setAnswers] = useState<Answers>(init.answers);
  const [phase, setPhase] = useState<Phase>(init.phase);
  const [queue, setQueue] = useState<Pending[]>(init.queue);
  const [selected, setSelected] = useState<Value[]>([]);
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
    const prev: Value[] = editing ? (current[steps[step].key] ?? []) : [];
    setPhase({ type: "question", step, editing });
    setSelected(prev);
    setNoneChosen(editing && prev.length === 0);
  };

  const sendAnswer = () => {
    if (phase.type !== "question") return;
    const step = steps[phase.step];
    const values = noneChosen ? [] : selected;
    const next = { ...answers, [step.key]: values } as Answers;

    pushUser(answerText(step, values));
    setAnswers(next);

    if (phase.editing) {
      setPhase({ type: "summary" });
      say([step.react(values), SUMMARY_INTRO, { summary: next }]);
      return;
    }

    const upcoming = phase.step + 1;
    if (upcoming < steps.length) {
      goToStep(upcoming, false, next);
      say([step.react(values), ...steps[upcoming].prompt]);
    } else {
      setPhase({ type: "summary" });
      say([step.react(values), SUMMARY_INTRO, { summary: next }]);
    }
  };

  const editStep = (index: number) => {
    if (busy) return;
    pushUser(`Ubah ${steps[index].title.toLowerCase()}`);
    goToStep(index, true, answers);
    say(["Boleh! Pilih lagi ya:", ...steps[index].prompt]);
  };

  const save = async () => {
    if (phase.type !== "summary" && phase.type !== "error") return;
    const payload = Object.fromEntries(steps.map((s) => [s.key, answers[s.key] ?? []])) as unknown as OnboardingData;

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
          "Kalau seleramu berubah, preferensinya bisa diubah kapan aja di Profil → Preferensi Makanan.",
        ]);
        return;
      }

      console.error("Onboarding gagal disimpan:", data);
      setPhase({ type: "error" });
      say([
        res.status === 401
          ? "Sesi login kamu habis nih. Coba masuk lagi, nanti jawabanmu masih ada kok."
          : res.status === 400 && Array.isArray(data?.details)
            ? `Ada jawaban yang nggak valid: ${data.details.join("; ")}. Coba ubah lewat kartu rangkuman ya.`
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
        : `Pertanyaan ${phase.step + 1} dari ${steps.length}`
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
        aria-valuemax={steps.length}
        aria-valuenow={answered}
      >
        {steps.map((s) => (
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
              {isBot && <div className={styles.rowAvatar}>{lastInGroup && <PangiAvatar size={30} />}</div>}
              {m.summary ? (
                <SummaryCard
                  steps={steps}
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
              <div
                className={`${styles.bubble} ${styles.bubbleBot} ${styles.bubbleLast} ${styles.typing}`}
                aria-label={`${ASSISTANT_NAME} sedang mengetik`}
              >
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
                step={steps[phase.step]}
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
                  Tenang, preferensi ini masih bisa kamu ubah nanti di Profil. Ketuk <b>Ubah</b> di kartu kalau ada yang mau diganti sekarang.
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
                  Lihat resep buatmu <ArrowRight size={18} />
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
                Tenang, {answered} dari {steps.length} jawabanmu udah aku simpan. Kamu bisa lanjut kapan aja lewat aku di pojok kiri bawah.
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
  step,
  selected,
  noneChosen,
  onToggle,
  onNone,
  onSend,
}: {
  step: Step;
  selected: Value[];
  noneChosen: boolean;
  onToggle: (value: Value) => void;
  onNone: () => void;
  onSend: () => void;
}) {
  const valid = noneChosen || selected.length >= Math.max(1, step.min);
  const count = noneChosen ? 0 : selected.length;

  return (
    <>
      <p className={styles.composerHint}>{step.hint}</p>
      <ChoicePicker step={step} selected={selected} noneChosen={noneChosen} onToggle={onToggle} onNone={onNone} animate />
      <button type="button" className={styles.primaryBtn} onClick={onSend} disabled={!valid}>
        {valid ? (count > 1 ? `Kirim ${count} pilihan` : "Kirim") : step.min > 0 ? "Pilih minimal satu" : "Pilih salah satu"}
        {valid && <ArrowRight size={18} />}
      </button>
    </>
  );
}

function SummaryCard({
  steps,
  answers,
  interactive,
  onEdit,
}: {
  steps: Step[];
  answers: Answers;
  interactive: boolean;
  onEdit: (index: number) => void;
}) {
  return (
    <div className={styles.summary}>
      <p className={styles.summaryTitle}>Preferensi kamu</p>
      <ul className={styles.summaryList}>
        {steps.map((step, i) => {
          const values: Value[] = answers[step.key] ?? [];
          return (
            <li key={step.key} className={styles.summaryRow}>
              <div className={styles.summaryRowHead}>
                <span className={styles.summaryLabel}>{step.title}</span>
                {interactive && (
                  <button type="button" className={styles.editBtn} onClick={() => onEdit(i)} aria-label={`Ubah ${step.title}`}>
                    <Pencil size={13} /> Ubah
                  </button>
                )}
              </div>
              <div className={styles.summaryValues}>
                {values.length ? (
                  labelsFor(step, values).map((label) => (
                    <span key={label} className={styles.summaryTag}>
                      {label}
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
