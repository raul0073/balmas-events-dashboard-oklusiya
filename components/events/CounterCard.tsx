"use client";

import { Minus, Plus } from "lucide-react";

interface Props {
  id: string;
  label: string;
  hint: string;
  value: number | null;
  icon: React.ReactNode;
  /** tailwind classes for the icon chip */
  tone: string;
  onChange: (next: number | null) => void;
}

/** One of the five people counters: big number, +/− steppers, direct typing. */
export default function CounterCard({ id, label, hint, value, icon, tone, onChange }: Props) {
  const n = value ?? 0;
  const has = value !== null && value > 0;

  function step(delta: number) {
    const next = Math.max(0, n + delta);
    onChange(next === 0 && value === null ? null : next);
  }

  return (
    <div className={`rounded-2xl border bg-surface p-4 flex flex-col gap-3 transition-colors ${has ? "border-pikud-navy/20 shadow-sm" : "border-line"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <label htmlFor={id} className={`block font-bold text-sm ${has ? "text-ink" : "text-ink-soft"}`}>{label}</label>
          <p className="text-[11px] text-ink-muted leading-tight">{hint}</p>
        </div>
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${tone}`}>{icon}</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => step(-1)} aria-label={`הפחת ${label}`} disabled={n === 0}
          className="h-11 w-11 rounded-xl border border-line text-ink hover:bg-pikud-cream disabled:opacity-30 disabled:hover:bg-transparent inline-flex items-center justify-center">
          <Minus className="w-4 h-4" />
        </button>
        <input
          id={id}
          type="number"
          min={0}
          inputMode="numeric"
          value={value ?? ""}
          placeholder="0"
          onChange={(e) => { const v = parseInt(e.target.value, 10); onChange(isNaN(v) ? null : Math.max(0, v)); }}
          className={`flex-1 min-w-0 h-11 text-center text-2xl font-black rounded-xl border bg-surface focus:outline-none focus:ring-2 focus:ring-pikud-navy focus:border-transparent
            ${has ? "text-ink border-pikud-navy/30" : "text-ink-faint border-line"}`}
        />
        <button type="button" onClick={() => step(1)} aria-label={`הוסף ${label}`}
          className="h-11 w-11 rounded-xl bg-pikud-navy text-white hover:bg-pikud-navy-dark inline-flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
