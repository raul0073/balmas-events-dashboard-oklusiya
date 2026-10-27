"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, RotateCcw, ChevronDown, Check, ListChecks } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { ChecklistContent } from "@/lib/checklist/types";

const STORAGE_KEY = "pikud-checklist-v1";
const ACCENTS = ["#F47920", "#2D7DD2", "#059669", "#7C3AED"];

function loadChecked(): Record<string, boolean> {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function saveChecked(checked: Record<string, boolean>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(checked)); } catch { /* private mode */ }
}

/** The public checklist: sections as an accordion, checks kept in this browser, print and reset. */
export default function ChecklistView({ content }: { content: ChecklistContent }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [open, setOpen]       = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setChecked(loadChecked());
    setOpen(content.sections.length ? [content.sections[0].id] : []);
    setMounted(true);
  }, [content.sections]);

  const allIds = useMemo(() => content.sections.flatMap((s) => s.items.map((i) => i.id)), [content]);
  const total  = allIds.length;
  const done   = allIds.filter((id) => checked[id]).length;
  const pct    = total ? Math.round((done / total) * 100) : 0;

  function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next); saveChecked(next);
  }
  function reset() { setChecked({}); saveChecked({}); }
  function toggleSection(id: string) {
    setOpen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function print() {
    const prevOpen = open;
    setOpen(content.sections.map((s) => s.id));
    setTimeout(() => { window.print(); setTimeout(() => setOpen(prevOpen), 300); }, 150);
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-pikud-orange-pale via-canvas to-pikud-cream print:bg-surface print:min-h-0">
      <section className="relative bg-pikud-navy-dark text-white overflow-hidden print:bg-surface print:text-ink">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-l from-transparent to-pikud-orange/25 pointer-events-none print:hidden" aria-hidden />
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-l from-pikud-orange-dark via-pikud-orange to-pikud-orange-light print:hidden" aria-hidden />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-7">
          <div className="print:hidden"><Breadcrumbs items={[{ label: "כתום", href: "/orange" }, { label: "צ'קליסט" }]} className="text-white/80 mb-4" /></div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-black text-3xl sm:text-4xl leading-tight flex items-center gap-3">
                <ListChecks className="w-8 h-8 text-pikud-orange print:hidden" />
                {content.title}{content.subtitle ? ` ${content.subtitle}` : ""}
              </h1>
              {content.intro && <p className="text-white/60 mt-2 print:text-pikud-gray-mid">{content.intro}</p>}
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-red-600 hover:border-red-600 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> איפוס
              </button>
              <button onClick={print}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-pikud-orange hover:border-pikud-orange transition-colors">
                <Printer className="w-3.5 h-3.5" /> הדפסה
              </button>
            </div>
          </div>

          {mounted && total > 0 && (
            <div className="mt-5 print:hidden">
              <div className="flex items-center justify-between mb-1.5 text-xs text-white/70">
                <span>{done} מתוך {total} בוצעו</span>
                <span className="font-bold text-white">{pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-400" : "bg-pikud-orange"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 print:py-2 print:max-w-full">
        {content.sections.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-pikud-gray-light px-6 py-12 text-center text-pikud-gray-mid">הצ'קליסט עדיין ריק.</div>
        ) : (
          <div className="rounded-2xl bg-surface shadow-sm border border-pikud-gray-light overflow-hidden print:shadow-none print:rounded-none">
            {content.sections.map((section, i) => {
              const accent  = ACCENTS[i % ACCENTS.length];
              const doneIn  = section.items.filter((it) => checked[it.id]).length;
              const allDone = section.items.length > 0 && doneIn === section.items.length;
              const isOpen  = open.includes(section.id);
              return (
                <div key={section.id} className="border-b border-pikud-gray-light last:border-b-0 border-r-4 print:break-inside-avoid" style={{ borderRightColor: accent }}>
                  <button type="button" onClick={() => toggleSection(section.id)} aria-expanded={isOpen} aria-controls={`sec-${section.id}`}
                    className="flex w-full items-center gap-3 px-4 sm:px-5 py-4 text-right transition-colors hover:bg-pikud-cream/60 print:hover:bg-transparent">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                      style={{ backgroundColor: allDone ? "#059669" : accent }}>
                      {allDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className={`flex-1 text-sm sm:text-lg font-bold leading-snug ${allDone ? "text-emerald-600" : "text-ink"}`}>{section.label}</span>
                    <span className="shrink-0 text-xs text-pikud-gray-mid tabular-nums print:hidden">{doneIn}/{section.items.length}</span>
                    <ChevronDown className={`w-5 h-5 shrink-0 text-pikud-gray-mid transition-transform print:hidden ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                  <div id={`sec-${section.id}`} hidden={!isOpen} className="print:!block">
                    <div className="border-t border-pikud-gray-light bg-pikud-cream/40 px-3 sm:px-5 py-2 flex flex-col print:bg-surface">
                      {section.items.map((item) => (
                        <label key={item.id} className={`flex cursor-pointer items-start gap-3 rounded-lg px-2 sm:px-3 py-2.5 transition-colors hover:bg-surface ${checked[item.id] ? "opacity-60" : ""}`}>
                          <input type="checkbox" checked={!!checked[item.id]} onChange={() => toggle(item.id)}
                            className="mt-1 h-5 w-5 shrink-0 rounded border-pikud-gray-mid accent-[#F47920] cursor-pointer" />
                          <span className={`text-sm sm:text-base leading-relaxed ${checked[item.id] ? "line-through text-pikud-gray-mid" : "text-ink-soft"}`}>{item.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <style>{`@media print { @page { margin: 1.5cm 2cm; size: A4; } aside, header, nav { display: none !important; } }`}</style>
    </div>
  );
}
