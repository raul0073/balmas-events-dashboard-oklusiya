"use client";

import { useActionState, useEffect, useState } from "react";
import { HandHeart, Search, X, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/primitives";
import { useSession } from "@/lib/session";
import { offerWanted, type OfferState } from "@/app/library/actions";
import type { WantedItem } from "@/lib/library/wanted";
import type { ToolTone } from "@/lib/tools";

const BTN: Record<ToolTone, string> = { orange: "bg-pikud-orange hover:bg-pikud-orange-dark", green: "bg-idf-green hover:bg-idf-green-dark" };

/** "טפסים שאנחנו מחפשים": the admin's wish list, with an offer button per item. */
export default function WantedList({ items, space }: { items: WantedItem[]; space: ToolTone }) {
  const [open, setOpen] = useState<WantedItem | null>(null);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="wanted-title" className="rounded-2xl border border-dashed border-line bg-surface/70 p-5">
      <h2 id="wanted-title" className="text-ink font-black text-xl mb-1 flex items-center gap-2">
        <Search className="w-5 h-5 text-ink-muted" /> טפסים שאנחנו מחפשים
      </h2>
      <p className="text-sm text-ink-muted mb-4">יש לך אחד מאלה? לחץ "יש לי את זה" ונחזור אליך. אין צורך להעלות כלום.</p>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((w) => (
          <li key={w.id} className="rounded-xl border border-line bg-surface p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-ink">{w.title}</h3>
              {w.description && <p className="text-sm text-ink-soft mt-1">{w.description}</p>}
            </div>
            <button type="button" onClick={() => setOpen(w)}
              className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-bold text-white ${BTN[space]}`}>
              <HandHeart className="w-4 h-4" /> יש לי את זה
            </button>
          </li>
        ))}
      </ul>
      {open && <OfferDialog item={open} space={space} onClose={() => setOpen(null)} />}
    </section>
  );
}

function OfferDialog({ item, space, onClose }: { item: WantedItem; space: ToolTone; onClose: () => void }) {
  const session = useSession();
  const [state, formAction, pending] = useActionState<OfferState, FormData>(offerWanted, {});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const who = session?.battalion?.name ?? (session?.isAdmin ? "מנהל המערכת" : null);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-pikud-navy/60 backdrop-blur-sm px-4" role="dialog" aria-modal="true" aria-labelledby="offer-title">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="bg-pikud-navy px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-pikud-orange rounded-lg p-2"><HandHeart className="w-5 h-5 text-white" /></div>
            <div>
              <h2 id="offer-title" className="text-white font-bold text-lg">יש לי את זה</h2>
              <p className="text-white/60 text-sm truncate max-w-[260px]">{item.title}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="סגור" className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {state.ok ? (
          <div className="p-6 space-y-4 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-ink font-bold text-lg">תודה, קיבלנו</p>
            <p className="text-sm text-ink-muted">מנהל המערכת יחזור אליך כדי לקבל את הקובץ.</p>
            <Button variant="outline" className="w-full h-11" onClick={onClose}>סגור</Button>
          </div>
        ) : (
          <form action={formAction} className="p-6 space-y-4">
            <input type="hidden" name="wantedId" value={item.id} />
            <div className="space-y-1.5">
              <Label htmlFor="offer-note">מה יש לך (לא חובה)</Label>
              <Textarea id="offer-note" name="note" rows={3} placeholder="למשל: גרסה מעודכנת מ-2025, בפורמט Word" />
            </div>
            {who ? (
              <p className="text-xs text-ink-muted">נשלח בשם <strong className="text-ink">{who}</strong></p>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="offer-contact">איך לחזור אליך *</Label>
                <Input id="offer-contact" name="contact" required placeholder="שם, גדוד, טלפון או מייל" className="h-11" />
              </div>
            )}
            {state.error && (
              <p role="alert" className="text-red-600 text-sm flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {state.error}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="submit" disabled={pending} className={`flex-1 h-11 text-base font-bold text-white border-0 flex items-center gap-2 ${BTN[space]}`}>
                {pending && <Loader2 className="w-4 h-4 animate-spin" />} שלח
              </Button>
              <Button type="button" variant="outline" className="h-11" onClick={onClose}>ביטול</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
