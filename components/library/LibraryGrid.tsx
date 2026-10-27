"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Eye, X, FileText, File, Image as ImageIcon, ExternalLink, Lock, LogIn } from "lucide-react";
import type { ToolTone } from "@/lib/tools";
import { LIBRARY_CATEGORIES, categoryLabel, fileKindLabel, formatSize, previewKind, type LibraryCategory, type LibraryItem } from "@/lib/library/types";

const ACCENT: Record<ToolTone, { chip: string; btn: string; ring: string; line: string }> = {
  orange: { chip: "bg-pikud-orange/10 text-pikud-orange-dark", btn: "bg-pikud-orange hover:bg-pikud-orange-dark", ring: "focus-visible:ring-pikud-orange/40", line: "border-pikud-orange/30 hover:border-pikud-orange/60" },
  green:  { chip: "bg-idf-green/10 text-idf-green",            btn: "bg-idf-green hover:bg-idf-green-dark",       ring: "focus-visible:ring-idf-green/40",    line: "border-idf-green/30 hover:border-idf-green/60" },
};

function officeViewer(url: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
}

/** Cards grouped by category with a preview lightbox and direct download. */
interface Props {
  items: LibraryItem[];
  space: ToolTone;
  /** items per category a visitor cannot see yet */
  lockedCounts?: Partial<Record<LibraryCategory, number>>;
  loginHref?: string;
}

export default function LibraryGrid({ items, space, lockedCounts = {}, loginHref = "/login" }: Props) {
  const [open, setOpen] = useState<LibraryItem | null>(null);
  const a = ACCENT[space];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const groups = LIBRARY_CATEGORIES.map((c) => ({ ...c, items: items.filter((i) => i.category === c.value), locked: lockedCounts[c.value] ?? 0 }))
    .filter((g) => g.items.length || g.locked);

  if (groups.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-line px-6 py-14 text-center">
        <File className="w-12 h-12 text-ink-muted mx-auto mb-4" />
        <p className="text-ink font-bold text-lg">עדיין אין קבצים במרחב הזה</p>
        <p className="text-ink-muted text-sm mt-1">קבצים שיועלו בפאנל הניהול יופיעו כאן.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.value} aria-labelledby={`lib-${g.value}`}>
            <h2 id={`lib-${g.value}`} className="text-ink font-black text-xl mb-3 flex items-center gap-2">
              {g.label} <span className="text-sm font-semibold text-ink-muted">({g.items.length || g.locked})</span>
              {g.locked > 0 && <Lock className="w-4 h-4 text-ink-muted" aria-label="דורש כניסה" />}
            </h2>
            {g.locked > 0 && (
              <div className="bg-surface rounded-2xl border border-dashed border-line px-6 py-8 text-center">
                <Lock className="w-8 h-8 text-ink-muted mx-auto mb-3" />
                <p className="text-ink font-bold">{g.locked} קבצים ב{g.label} זמינים לגדודים מחוברים</p>
                <p className="text-ink-muted text-sm mt-1 mb-4">הכניסה עם פרטי הגדוד פותחת אותם להורדה ולתצוגה.</p>
                <Link href={loginHref} className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-bold text-white ${a.btn}`}>
                  <LogIn className="w-4 h-4" /> כניסה
                </Link>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {g.items.map((item) => {
                const kind = previewKind(item.mime, item.fileName);
                return (
                  <article key={item.id} className={`group bg-surface rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-colors ${a.line}`}>
                    <button type="button" onClick={() => setOpen(item)} aria-label={`תצוגה מקדימה: ${item.title}`}
                      className={`relative block w-full aspect-[4/3] bg-surface-2 overflow-hidden focus:outline-none focus-visible:ring-4 ${a.ring}`}>
                      {kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt="" loading="lazy" className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-ink-muted">
                          {kind === "pdf" ? <FileText className="w-12 h-12" /> : <File className="w-12 h-12" />}
                          <span className="text-xs font-semibold">{fileKindLabel(item.mime, item.fileName)}</span>
                        </div>
                      )}
                      <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 bg-surface/90 text-ink text-xs font-bold px-3 py-1.5 rounded-full shadow">
                          <Eye className="w-3.5 h-3.5" /> תצוגה מקדימה
                        </span>
                      </span>
                    </button>

                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-ink leading-snug">{item.title}</h3>
                        <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${a.chip}`}>{categoryLabel(item.category)}</span>
                      </div>
                      {item.description && <p className="text-sm text-ink-soft leading-snug">{item.description}</p>}
                      <dl className="mt-auto pt-2 flex items-center gap-3 text-[11px] text-ink-muted">
                        <div className="inline-flex items-center gap-1">{kind === "image" ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}<dd>{fileKindLabel(item.mime, item.fileName)}</dd></div>
                        <dd>{formatSize(item.sizeBytes)}</dd>
                        <dd>עודכן {new Date(item.updatedAt).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" })}</dd>
                      </dl>
                      <div className="flex items-center gap-2 pt-1">
                        <a href={item.url} download={item.fileName}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-lg text-sm font-bold text-white transition-colors ${a.btn}`}>
                          <Download className="w-4 h-4" /> הורדה
                        </a>
                        <button type="button" onClick={() => setOpen(item)}
                          className="h-10 px-3 inline-flex items-center gap-1.5 rounded-lg border border-line text-sm font-semibold text-ink hover:bg-surface-2">
                          <Eye className="w-4 h-4" /> <span className="hidden sm:inline">תצוגה</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex flex-col" role="dialog" aria-modal="true" aria-label={open.title} onClick={() => setOpen(null)}>
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="min-w-0">
              <p className="font-bold truncate">{open.title}</p>
              <p className="text-xs text-white/60">{fileKindLabel(open.mime, open.fileName)} · {formatSize(open.sizeBytes)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a href={open.url} download={open.fileName} className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-bold text-white ${a.btn}`}>
                <Download className="w-4 h-4" /> הורדה
              </a>
              <a href={open.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold text-white/80 hover:text-white bg-white/10">
                <ExternalLink className="w-4 h-4" /> <span className="hidden sm:inline">בחלון חדש</span>
              </a>
              <button type="button" onClick={() => setOpen(null)} aria-label="סגור" className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 px-2 pb-4 sm:px-6" onClick={(e) => e.stopPropagation()}>
            {previewKind(open.mime, open.fileName) === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.url} alt={open.title} className="w-full h-full object-contain" />
            ) : previewKind(open.mime, open.fileName) === "pdf" ? (
              <iframe src={open.url} title={open.title} className="w-full h-full rounded-lg bg-white" />
            ) : previewKind(open.mime, open.fileName) === "office" ? (
              <iframe src={officeViewer(open.url)} title={open.title} className="w-full h-full rounded-lg bg-white" />
            ) : (
              <div className="h-full flex items-center justify-center text-white/70">אין תצוגה מקדימה לסוג הקובץ הזה. הורד אותו כדי לפתוח.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
