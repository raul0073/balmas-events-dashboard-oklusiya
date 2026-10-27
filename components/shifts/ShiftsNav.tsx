"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarRange, Users, Scale, Settings2, LogOut } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useT } from "@/lib/shifts/i18n";

const ITEMS = [
  { href: "/shifts",          key: "nav.dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/shifts/schedule", key: "nav.schedule",  icon: <CalendarRange className="w-4 h-4" /> },
  { href: "/shifts/people",   key: "nav.people",    icon: <Users className="w-4 h-4" /> },
  { href: "/shifts/rules",    key: "nav.rules",     icon: <Scale className="w-4 h-4" /> },
  { href: "/shifts/config",   key: "nav.config",    icon: <Settings2 className="w-4 h-4" /> },
];

/** Tab bar of the shifts organizer, inside the hub shell. Carries the language switch. */
export default function ShiftsNav() {
  const path = usePathname();
  const { t, lang, setLang } = useT();

  return (
    <div className="bg-surface border-b border-line sticky top-0 z-20">
      <div className="px-4 sm:px-6 pt-3">
        <Breadcrumbs items={[{ label: "כתום", href: "/orange" }, { label: "סידור משמרות" }]} className="text-ink-muted" />
      </div>
      <div className="px-4 sm:px-6 flex items-center justify-between gap-3 overflow-x-auto">
        <nav aria-label="סידור משמרות" className="flex items-center gap-1 py-2">
          {ITEMS.map((it) => {
            const active = path === it.href;
            return (
              <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  active ? "bg-olive text-white" : "text-ink-soft hover:text-ink hover:bg-surface-2"
                }`}>
                {it.icon} {t(it.key)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center rounded-lg bg-surface-2 border border-line p-0.5" role="radiogroup" aria-label="שפה">
            {(["he", "en"] as const).map((l) => (
              <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLang(l)}
                className={`rounded-md px-2 py-1 text-xs font-semibold ${lang === l ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}>
                {l === "he" ? "עברית" : "EN"}
              </button>
            ))}
          </div>
          <Link href="/" title="יציאה לדף הראשי" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">יציאה</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
