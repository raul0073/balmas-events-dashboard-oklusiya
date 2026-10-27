"use client";

import { useActionState, useEffect, useRef } from "react";
import { Search, Plus, Loader2, Check, AlertTriangle, Trash2, RotateCcw, Building2, UserCircle2, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/primitives";
import type { ActionState } from "@/app/admin/actions";
import { createWanted, deleteWanted, setOfferStatus, setWantedStatus } from "@/app/admin/library/wanted-actions";
import type { WantedItem, WantedOffer } from "@/lib/library/wanted";
import { SPACE_LABELS } from "@/lib/library/types";
import type { ToolTone } from "@/lib/tools";

function when(iso: string): string {
  return new Date(iso).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** "דרושים": the wish list for one space and the offers that came in. */
export default function WantedManager({ space, items, offers }: { space: ToolTone; items: WantedItem[]; offers: WantedOffer[] }) {
  const mine = items.filter((i) => i.space === space);
  const open = mine.filter((i) => i.status === "open");
  const received = mine.filter((i) => i.status === "received");

  return (
    <section className="bg-surface rounded-xl border border-line p-5 space-y-4" aria-labelledby="wanted-admin-title">
      <div className="flex items-center gap-2 text-ink font-bold">
        <Search className="w-4 h-4 text-pikud-orange" />
        <h3 id="wanted-admin-title">דרושים ב{SPACE_LABELS[space]}</h3>
        <span className="text-xs font-semibold text-ink-muted">מתפרסם בעמוד הספרייה. משתמשים מציעים, אתה מעלה.</span>
      </div>

      <NewWantedForm space={space} />

      {open.length === 0 && received.length === 0 ? (
        <p className="text-sm text-ink-muted">אין פריטים דרושים ב{SPACE_LABELS[space]}.</p>
      ) : (
        <ul className="space-y-3">
          {[...open, ...received].map((w) => {
            const mineOffers = offers.filter((o) => o.wantedId === w.id);
            const fresh = mineOffers.filter((o) => o.status === "new").length;
            return (
              <li key={w.id} className={`rounded-xl border p-4 ${w.status === "open" ? "border-line" : "border-line bg-surface-2 opacity-80"}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-ink">{w.title}</h4>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${w.status === "open" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"}`}>
                        {w.status === "open" ? "מחפשים" : "התקבל"}
                      </span>
                      {fresh > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pikud-orange text-white">{fresh} הצעות חדשות</span>}
                    </div>
                    {w.description && <p className="text-sm text-ink-soft mt-1">{w.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <form action={setWantedStatus}>
                      <input type="hidden" name="id" value={w.id} />
                      <input type="hidden" name="status" value={w.status === "open" ? "received" : "open"} />
                      <button type="submit" className="text-xs font-semibold px-2.5 py-1 rounded-md border border-line text-ink hover:bg-surface-2 inline-flex items-center gap-1">
                        {w.status === "open" ? <><Check className="w-3.5 h-3.5" /> סמן התקבל</> : <><RotateCcw className="w-3.5 h-3.5" /> פתח מחדש</>}
                      </button>
                    </form>
                    <form action={deleteWanted}>
                      <input type="hidden" name="id" value={w.id} />
                      <button type="submit" aria-label="מחק" title="מחק" className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </form>
                  </div>
                </div>

                {mineOffers.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-line pt-3">
                    {mineOffers.map((o) => (
                      <li key={o.id} className={`flex items-start justify-between gap-3 text-sm rounded-lg px-3 py-2 ${o.status === "new" ? "bg-pikud-orange/10" : "bg-surface-2"}`}>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink inline-flex items-center gap-1.5">
                            <HandHeart className="w-3.5 h-3.5 text-pikud-orange" />
                            {o.battalionName ? <><Building2 className="w-3.5 h-3.5" /> {o.battalionName}</> : <><UserCircle2 className="w-3.5 h-3.5" /> {o.username ?? "אורח"}</>}
                            <span className="text-xs text-ink-muted font-normal">· {when(o.createdAt)}</span>
                          </p>
                          {o.note && <p className="text-ink-soft mt-0.5 whitespace-pre-wrap">{o.note}</p>}
                          {o.contact && <p className="text-xs text-ink-muted mt-0.5">יצירת קשר: <strong className="text-ink">{o.contact}</strong></p>}
                        </div>
                        <form action={setOfferStatus} className="shrink-0">
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="status" value={o.status === "new" ? "handled" : "new"} />
                          <button type="submit" className="text-xs font-semibold px-2 py-1 rounded-md border border-line text-ink hover:bg-surface">
                            {o.status === "new" ? "סמן טופל" : "החזר לחדש"}
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function NewWantedForm({ space }: { space: ToolTone }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createWanted, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);

  return (
    <form ref={ref} action={formAction} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-3 items-end rounded-xl border border-dashed border-line p-3">
      <input type="hidden" name="space" value={space} />
      <div className="space-y-1">
        <Label htmlFor="w-title">מה דרוש *</Label>
        <Input id="w-title" name="title" required placeholder="למשל: טופס פינוי משפחה" className="h-9" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="w-desc">פירוט</Label>
        <Textarea id="w-desc" name="description" rows={1} placeholder="איזו גרסה, מאיזה גוף, למה" className="min-h-[36px] h-9 py-2" />
      </div>
      <Button type="submit" variant="outline" disabled={pending} className="h-9 flex items-center gap-1.5">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} הוסף
      </Button>
      {state.error && <p className="sm:col-span-3 text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {state.error}</p>}
    </form>
  );
}
