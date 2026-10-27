"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type ThemePref } from "@/lib/theme";

const OPTIONS: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
  { value: "light",  label: "בהיר",      icon: <Sun className="w-4 h-4" /> },
  { value: "dark",   label: "כהה",       icon: <Moon className="w-4 h-4" /> },
  { value: "system", label: "לפי המכשיר", icon: <Monitor className="w-4 h-4" /> },
];

/**
 * Three-way theme switch. `onDark` renders it for a navy surface (sidebar);
 * otherwise for a page surface (header).
 */
export default function ThemeToggle({ onDark = false, compact = false }: { onDark?: boolean; compact?: boolean }) {
  const { pref, setPref } = useTheme();
  const base = onDark
    ? { wrap: "bg-white/10", on: "bg-surface text-ink", off: "text-white/70 hover:text-white" }
    : { wrap: "bg-surface-2 border border-line", on: "bg-surface text-ink shadow-sm", off: "text-ink-muted hover:text-ink" };

  return (
    <div role="radiogroup" aria-label="מצב תצוגה" className={`inline-flex items-center rounded-lg p-0.5 ${base.wrap}`}>
      {OPTIONS.map((o) => {
        const active = pref === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={active} title={o.label} onClick={() => setPref(o.value)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${active ? base.on : base.off}`}>
            {o.icon}
            {!compact && <span className="hidden sm:inline">{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
