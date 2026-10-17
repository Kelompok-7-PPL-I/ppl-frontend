"use client";

import styles from "./Onboarding.module.css";

export type AvatarMood = "idle" | "talking" | "thinking" | "happy" | "waving";

interface Props {
  size?: number;
  mood?: AvatarMood;
  className?: string;
}

const INK = "#1F4D3A";

/**
 * Maskot onboarding: bulir padi bercaping, digambar flat + outline hijau tua seperti logo Panganesia.
 * Mata berkedip otomatis; ekspresi berganti lewat `mood`.
 */
export default function PangiAvatar({ size = 64, mood = "idle", className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`${styles.avatarSvg} ${styles[`mood_${mood}`]} ${className ?? ""}`}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="60" cy="60" r="60" fill="#F5EEDC" />

      <g className={styles.avatarBody}>
        {/* Badan bulir */}
        <path d="M60 40 C 80 43, 88 62, 85 80 C 82 99, 38 99, 35 80 C 32 62, 40 43, 60 40 Z" fill="#F2C94C" />
        <path d="M72 44 C 83 54, 87 66, 85 80 C 83 91, 75 96, 64 97.5 C 76 87, 79 64, 72 44 Z" fill="#E2AE2F" />
        <path
          d="M60 40 C 80 43, 88 62, 85 80 C 82 99, 38 99, 35 80 C 32 62, 40 43, 60 40 Z"
          fill="none"
          stroke={INK}
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path d="M34 55 Q60 63 86 55 Q60 70 34 55 Z" fill="#D69E2E" opacity="0.55" />

        {/* Wajah */}
        <circle cx="44" cy="81" r="4" fill="#EE9677" opacity="0.8" />
        <circle cx="76" cy="81" r="4" fill="#EE9677" opacity="0.8" />
        <g className={styles.avatarEyes} fill={INK}>
          <ellipse cx="51" cy="72" rx="3.3" ry="4.3" />
          <ellipse cx="69" cy="72" rx="3.3" ry="4.3" />
        </g>
        <g className={styles.avatarEyesHappy} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
          <path d="M47.5 73.5 Q51 68.5 54.5 73.5" />
          <path d="M65.5 73.5 Q69 68.5 72.5 73.5" />
        </g>
        <path className={styles.mouthSmile} d="M55.5 81 Q60 85.5 64.5 81" fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
        <ellipse className={styles.mouthTalk} cx="60" cy="83" rx="4" ry="3.3" fill="#8C3B2E" stroke={INK} strokeWidth="2" />
        <path className={styles.mouthHappy} d="M54 80 Q60 90.5 66 80 Z" fill="#8C3B2E" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path className={styles.mouthThink} d="M56 83.5 Q60 81 65 84" fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />

        {/* Tangan (hanya saat melambai) */}
        <g className={styles.avatarArm}>
          <path d="M84 83 C 92 81, 97 77, 100 71" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <circle cx="101.5" cy="67" r="4.8" fill="#F2C94C" stroke={INK} strokeWidth="2.4" />
        </g>

        {/* Caping */}
        <path d="M14 51 Q60 62 106 51 L64 17 Q60 14 56 17 Z" fill="#DDB872" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <g stroke="#B68A41" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M60 19 L38 54" />
          <path d="M60 19 L60 57" />
          <path d="M60 19 L82 54" />
          <path d="M33 40 Q60 47 87 40" />
        </g>
        <circle cx="60" cy="16.5" r="3.2" fill="#C99A4E" stroke={INK} strokeWidth="2.4" />

        {/* Tangkai padi di caping */}
        <g className={styles.avatarSprig} stroke={INK} strokeWidth="2.4" strokeLinecap="round" fill="#E9C46A">
          <path d="M95 50 C 99 41, 101 33, 99 25" fill="none" stroke="#3E7D5A" />
          <ellipse cx="102" cy="31" rx="2.6" ry="4" transform="rotate(25 102 31)" />
          <ellipse cx="96" cy="36" rx="2.6" ry="4" transform="rotate(-25 96 36)" />
        </g>
      </g>
    </svg>
  );
}
