"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, CheckCircle2, ArrowRight } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";
import PangiAvatar from "./PangiAvatar";
import OnboardingChat from "./OnboardingChat";
import { ASSISTANT_NAME, STEPS } from "./onboarding-content";
import { loadProgress, answeredCount } from "./progress-storage";
import {
  useOnboardingStatus,
  onboardingStatusKey,
  hasOnboardingAutostart,
  clearOnboardingAutostart,
  type OnboardingStatus,
  type SavedPreferences,
} from "./useOnboardingStatus";
import styles from "./Onboarding.module.css";

type NudgeState = "expanded" | "collapsed" | "hidden";

const NUDGE_KEY = "panganesia:onboarding-nudge";
const FAREWELL_MS = 6000;
const PREFERENCES_PATH = "/profile/preferences";

function readNudge(): NudgeState {
  try {
    const v = sessionStorage.getItem(NUDGE_KEY);
    return v === "collapsed" || v === "hidden" ? v : "expanded";
  } catch {
    return "expanded";
  }
}

function writeNudge(v: NudgeState) {
  try {
    sessionStorage.setItem(NUDGE_KEY, v);
  } catch {}
}

/**
 * Avatar onboarding preferensi makanan.
 * Muncul di pojok kiri bawah untuk user yang belum mengisi preferensi, lalu membuka chatroom onboarding.
 */
export default function OnboardingAssistant() {
  const { data, enabled, userId, session } = useOnboardingStatus();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = useState(() => typeof window !== "undefined" && hasOnboardingAutostart());
  const [doneInSession, setDoneInSession] = useState(false);
  const [farewell, setFarewell] = useState(false);
  const [nudge, setNudge] = useState<NudgeState>(() => (typeof window === "undefined" ? "expanded" : readNudge()));
  const avatarBtnRef = useRef<HTMLButtonElement>(null);

  // Flag autostart hanya berlaku sekali
  useEffect(() => {
    clearOnboardingAutostart();
  }, []);

  // Chat hanya untuk user yang belum selesai, kecuali baru saja selesai di sesi ini (layar "Yeay")
  const chatVisible = open && !!data && (!data.completed || doneInSession);

  // Kunci scroll halaman saat chat terbuka
  useEffect(() => {
    if (!chatVisible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [chatVisible]);

  // Pangi pamit otomatis setelah beberapa detik
  useEffect(() => {
    if (!farewell) return;
    const timer = setTimeout(() => setFarewell(false), FAREWELL_MS);
    return () => clearTimeout(timer);
  }, [farewell]);

  if (!enabled || !userId || !data) return null;

  const saved = chatVisible || data.completed ? null : loadProgress(userId);
  const remaining = saved ? STEPS.length - answeredCount(saved.answers) : 0;
  const showNudge = !data.completed && !chatVisible && nudge !== "hidden";

  const updateNudge = (v: NudgeState) => {
    setNudge(v);
    writeNudge(v);
  };

  const handleCompleted = (preferences?: SavedPreferences) => {
    setDoneInSession(true);
    const key = onboardingStatusKey(userId);
    queryClient.setQueryData<OnboardingStatus>(key, (old) => ({
      completed: true,
      preferences: preferences ?? old?.preferences ?? null,
    }));
    // Ambil versi dari server (mis. kasus 409 yang tidak mengembalikan data)
    queryClient.invalidateQueries({ queryKey: key });
  };

  const handleClose = (reason: "exit" | "done", answered: number, next?: string) => {
    setOpen(false);

    if (reason === "done") {
      if (next) {
        toast.success("Preferensi tersimpan", "Kamu bisa cek lagi di Profil → Preferensi Makanan.");
        router.push(next);
      } else {
        setFarewell(true);
      }
      return;
    }

    updateNudge("collapsed");
    if (answered > 0) {
      toast.info("Progres disimpan", `Ketuk ${ASSISTANT_NAME} di pojok kiri bawah untuk melanjutkan.`);
    }
    requestAnimationFrame(() => avatarBtnRef.current?.focus());
  };

  const bubbleText = saved
    ? `Lanjutin kenalan kita yuk? Tinggal ${remaining} pertanyaan lagi!`
    : `Hai ${session?.user?.name?.split(" ")[0] ?? ""}! Mau aku rekomendasiin resep yang pas buat kamu?`;

  return (
    <>
      <AnimatePresence>
        {showNudge && (
          <motion.div
            key="nudge"
            className={styles.nudge}
            initial={{ opacity: 0, y: 24, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.85 }}
            transition={{ type: "spring", damping: 18, stiffness: 220, delay: reduceMotion ? 0 : 0.6 }}
          >
            <AnimatePresence>
              {nudge === "expanded" && (
                <motion.div
                  className={styles.nudgeBubble}
                  role="region"
                  aria-label={`Pesan dari ${ASSISTANT_NAME}`}
                  initial={{ opacity: 0, scale: 0.85, x: -8, y: 8 }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, x: -8, y: 8 }}
                  transition={{ type: "spring", damping: 20, stiffness: 260, delay: reduceMotion ? 0 : 0.9 }}
                >
                  <button
                    type="button"
                    className={styles.nudgeClose}
                    onClick={() => updateNudge("collapsed")}
                    aria-label="Sembunyikan pesan"
                  >
                    <X size={14} />
                  </button>
                  <p className={styles.nudgeText}>{bubbleText}</p>
                  <div className={styles.nudgeActions}>
                    <button type="button" className={styles.nudgePrimary} onClick={() => setOpen(true)}>
                      {saved ? "Lanjutin" : "Mau dong!"}
                    </button>
                    <button type="button" className={styles.nudgeGhost} onClick={() => updateNudge("collapsed")}>
                      Nanti aja
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.nudgeAvatarWrap}>
              <button
                ref={avatarBtnRef}
                type="button"
                className={`${styles.nudgeAvatar} ${nudge === "collapsed" ? styles.nudgeAvatarSmall : ""}`}
                onClick={() => setOpen(true)}
                aria-label={
                  saved
                    ? `Lanjutkan onboarding bersama ${ASSISTANT_NAME}, sisa ${remaining} pertanyaan`
                    : `Buka onboarding bersama ${ASSISTANT_NAME}`
                }
              >
                <PangiAvatar size={nudge === "collapsed" ? 56 : 72} />
              </button>
              {saved && remaining > 0 && (
                <span className={styles.nudgeBadge} aria-hidden="true">
                  {remaining}
                </span>
              )}
              {nudge === "collapsed" && (
                <button
                  type="button"
                  className={styles.nudgeHide}
                  onClick={() => updateNudge("hidden")}
                  aria-label={`Sembunyikan ${ASSISTANT_NAME} untuk sesi ini`}
                  title="Sembunyikan untuk sesi ini"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Perpisahan setelah onboarding selesai: Pangi pamit & menunjukkan tempat preferensi tersimpan */}
      <AnimatePresence>
        {farewell && (
          <motion.div
            key="farewell"
            className={styles.nudge}
            role="status"
            initial={{ opacity: 0, y: 24, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.3, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: "spring", damping: 18, stiffness: 220, delay: reduceMotion ? 0 : 0.35 }}
          >
            <motion.div
              className={`${styles.nudgeBubble} ${styles.farewellBubble}`}
              initial={{ opacity: 0, scale: 0.85, x: -8, y: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 260, delay: reduceMotion ? 0 : 0.6 }}
            >
              <button type="button" className={styles.nudgeClose} onClick={() => setFarewell(false)} aria-label="Tutup">
                <X size={14} />
              </button>
              <p className={styles.farewellTitle}>
                <CheckCircle2 size={16} /> Preferensi tersimpan
              </p>
              <p className={styles.nudgeText}>Sampai jumpa! Jawabanmu bisa kamu cek kapan aja di Profil.</p>
              <Link href={PREFERENCES_PATH} className={styles.farewellLink}>
                Lihat preferensi <ArrowRight size={15} />
              </Link>
              <span className={styles.farewellTimer} style={{ animationDuration: `${FAREWELL_MS}ms` }} />
            </motion.div>
            <div className={styles.nudgeAvatarWrap}>
              <div className={styles.nudgeAvatar} aria-hidden="true">
                <PangiAvatar size={72} mood="waving" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatVisible && (
          <motion.div
            key="chat"
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={styles.panel}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, x: "-30vw", y: "30vh" }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, x: "-30vw", y: "30vh" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <OnboardingChat
                userId={userId}
                userName={session?.user?.name ?? ""}
                onClose={handleClose}
                onCompleted={handleCompleted}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
