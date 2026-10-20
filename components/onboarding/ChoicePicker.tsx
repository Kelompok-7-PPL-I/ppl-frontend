"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Search, X } from "lucide-react";
import type { Step, Value } from "./onboarding-content";
import styles from "./Onboarding.module.css";

interface Props {
  step: Step;
  selected: Value[];
  noneChosen: boolean;
  onToggle: (value: Value) => void;
  onNone: () => void;
  /** Animasi masuk chip (dipakai di chat) */
  animate?: boolean;
}

/** Pemilih jawaban preferensi: chip biasa, atau daftar panjang dengan pencarian (produk). */
export default function ChoicePicker({ step, selected, noneChosen, onToggle, onNone, animate = false }: Props) {
  const noneChip = step.noneLabel && (
    <Chip active={noneChosen} onClick={onNone} dashed index={step.picker === "chips" ? step.options.length : 0} animate={animate}>
      {step.noneLabel}
    </Chip>
  );

  if (step.picker === "search") {
    return (
      <SearchPicker step={step} selected={selected} onToggle={onToggle}>
        {selected.length === 0 && noneChip}
      </SearchPicker>
    );
  }

  return (
    <div className={styles.chips} role="group" aria-label={step.title}>
      {step.options.map((o, i) => (
        <Chip key={o.value} active={selected.includes(o.value)} onClick={() => onToggle(o.value)} index={i} animate={animate}>
          {o.label}
        </Chip>
      ))}
      {noneChip}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  dashed = false,
  index = 0,
  animate = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dashed?: boolean;
  index?: number;
  animate?: boolean;
}) {
  return (
    <motion.button
      type="button"
      className={`${styles.chip} ${dashed ? styles.chipNone : ""} ${active ? styles.chipActive : ""}`}
      aria-pressed={active}
      onClick={onClick}
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.035, duration: 0.2 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      {active && <Check size={15} strokeWidth={3} className={styles.chipCheck} />}
    </motion.button>
  );
}

function SearchPicker({
  step,
  selected,
  onToggle,
  children,
}: {
  step: Step;
  selected: Value[];
  onToggle: (value: Value) => void;
  children?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, typeof step.options>();
    for (const o of step.options) {
      if (selected.includes(o.value)) continue;
      if (q && !o.label.toLowerCase().includes(q) && !o.group?.toLowerCase().includes(q)) continue;
      const g = o.group ?? "Lainnya";
      map.set(g, [...(map.get(g) ?? []), o]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "id"));
  }, [step, selected, query]);

  const chosen = step.options.filter((o) => selected.includes(o.value));

  return (
    <div className={styles.searchPicker}>
      <label className={styles.searchBox}>
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari bahan, mis. kentang"
          aria-label={`Cari ${step.title.toLowerCase()}`}
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Hapus pencarian" className={styles.searchClear}>
            <X size={14} />
          </button>
        )}
      </label>

      {chosen.length > 0 && (
        <div className={styles.selectedRow} aria-label="Bahan yang dipilih">
          {chosen.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`${styles.chip} ${styles.chipActive} ${styles.chipSmall}`}
              onClick={() => onToggle(o.value)}
              aria-label={`Hapus ${o.label}`}
            >
              {o.label}
              <X size={13} strokeWidth={3} className={styles.chipCheck} />
            </button>
          ))}
        </div>
      )}

      <div className={styles.searchList}>
        {children && <div className={styles.searchNone}>{children}</div>}
        {groups.map(([group, options]) => (
          <div key={group} role="group" aria-label={group}>
            <p className={styles.groupLabel}>{group}</p>
            <div className={styles.chipsInline}>
              {options.map((o) => (
                <button key={o.value} type="button" className={`${styles.chip} ${styles.chipSmall}`} aria-pressed={false} onClick={() => onToggle(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && query && <p className={styles.searchEmpty}>Bahan &ldquo;{query}&rdquo; nggak ketemu.</p>}
      </div>
    </div>
  );
}
