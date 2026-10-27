"use client";

import { useState } from "react";
import { Check, X, RotateCcw, Radar, ChevronDown } from "lucide-react";
import { INFO_SOURCE_GROUPS, INFO_SOURCES } from "@/lib/events/sources";

interface Props {
  done: string[];
  onChange: (next: string[]) => void;
  readOnly?: boolean;
  /** start expanded (default collapsed) */
  defaultOpen?: boolean;
}

/**
 * The information sources reminder. Collapsed it is one line with the count and a
 * progress bar; expanded, every source is a pill until marked exhausted (✕), then
 * green with a strike-through and undo on click.
 */
export default function InfoSources({ done, onChange, readOnly = false, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const total    = INFO_SOURCES.length;
  const count    = done.filter((k) => INFO_SOURCES.some((s) => s.key === k)).length;
  const complete = count === total;

  function mark(key: string) { if (!done.includes(key)) onChange([...done, key]); }
  function restore(key: string) { onChange(done.filter((k) => k !== key)); }

  return (
    <section aria-label="מקורות המידע"
      className={`rounded-2xl border bg-white transition-colors ${complete ? "border-green-300" : "border-amber-200"}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-right">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${complete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            <Radar className="w-4 h-4" />
          </span>
          <div className="leading-tight min-w-0">
            <h3 className="font-bold text-sm text-pikud-navy">מקורות המידע</h3>
            <p className="text-[11px] text-gray-400 truncate">
              {complete ? "כל המקורות מוצו" : `${total - count} מקורות טרם מוצו · לחץ לפתיחה`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-28 h-2 rounded-full bg-gray-100 overflow-hidden hidden sm:block" aria-hidden>
            <div className={`h-full rounded-full transition-all ${complete ? "bg-green-500" : "bg-amber-400"}`} style={{ width: `${(count / total) * 100}%` }} />
          </div>
          <span className={`text-sm font-bold tabular-nums ${complete ? "text-green-700" : "text-amber-700"}`}>{count}/{total}</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2 border-t border-gray-100">
          {INFO_SOURCE_GROUPS.map((g) => (
            <div key={g.label} className="flex items-start gap-2 flex-wrap pt-2">
              <span className="text-[11px] font-bold text-gray-400 w-24 shrink-0 pt-1.5">{g.label}</span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {g.sources.map((s) => {
                  const isDone = done.includes(s.key);
                  return isDone ? (
                    <button key={s.key} type="button" onClick={() => !readOnly && restore(s.key)} disabled={readOnly}
                      title="מוצה. לחץ לשחזור" aria-pressed
                      className="group inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 disabled:hover:bg-green-100">
                      <Check className="w-3 h-3" />
                      <span className="line-through decoration-green-700/50">{s.label}</span>
                      {!readOnly && <RotateCcw className="w-3 h-3 opacity-0 group-hover:opacity-70" aria-hidden />}
                    </button>
                  ) : (
                    <span key={s.key}
                      className="inline-flex items-center gap-1 text-xs font-semibold pr-2.5 pl-1 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                      {s.label}
                      {!readOnly && (
                        <button type="button" onClick={() => mark(s.key)} aria-label={`סמן ${s.label} כמוצה`} title="סמן כמוצה"
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-amber-700 hover:bg-amber-200 hover:text-amber-900">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
