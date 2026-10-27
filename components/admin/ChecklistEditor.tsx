"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2, Save, ArrowUp, ArrowDown, Loader2, Check, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/primitives";
import { saveChecklist } from "@/app/admin/actions";
import type { ActionState } from "@/app/admin/actions";
import type { ChecklistContent } from "@/lib/checklist/types";

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Edits the public checklist: title, subtitle, intro, sections and items, with reordering. */
export default function ChecklistEditor({ initial, updatedAt }: { initial: ChecklistContent; updatedAt: string | null }) {
  const [content, setContent] = useState<ChecklistContent>(initial);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveChecklist, {});

  const set = (patch: Partial<ChecklistContent>) => setContent((c) => ({ ...c, ...patch }));
  const setSections = (fn: (s: ChecklistContent["sections"]) => ChecklistContent["sections"]) =>
    setContent((c) => ({ ...c, sections: fn(c.sections) }));

  function move<T>(arr: T[], from: number, to: number): T[] {
    if (to < 0 || to >= arr.length) return arr;
    const next = arr.slice();
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    return next;
  }

  return (
    <form action={formAction} className="bg-pikud-cream">
      <input type="hidden" name="content" value={JSON.stringify(content)} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-ink font-black text-2xl lg:hidden">תוכן הצ'קליסט</h2>
            <p className="text-pikud-gray-mid text-sm">מה שנשמר כאן מתפרסם מיד בעמוד הציבורי.
              {updatedAt && <> עודכן לאחרונה {new Date(updatedAt).toLocaleString("he-IL")}.</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/checklist" target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline underline-offset-4">
              <ExternalLink className="w-4 h-4" /> פתח את העמוד
            </Link>
            <Button type="submit" variant="orange" disabled={pending} className="flex items-center gap-1.5">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : state.ok ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {state.ok && !pending ? "נשמר" : "שמור ופרסם"}
            </Button>
          </div>
        </div>

        {state.error && (
          <p role="alert" className="text-red-600 text-sm flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {state.error}
          </p>
        )}

        <div className="bg-surface rounded-xl border border-pikud-gray-light p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cl-title">כותרת *</Label>
            <Input id="cl-title" value={content.title} onChange={(e) => set({ title: e.target.value })} required className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-subtitle">תת-כותרת</Label>
            <Input id="cl-subtitle" value={content.subtitle ?? ""} onChange={(e) => set({ subtitle: e.target.value })} className="h-10" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cl-intro">שורת פתיחה</Label>
            <Input id="cl-intro" value={content.intro ?? ""} onChange={(e) => set({ intro: e.target.value })} className="h-10" />
          </div>
        </div>

        <div className="space-y-4">
          {content.sections.map((section, si) => (
            <div key={section.id} className="bg-surface rounded-xl border border-pikud-gray-light overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-pikud-cream/60 border-b border-pikud-gray-light">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-pikud-navy text-white text-xs font-black shrink-0">{si + 1}</span>
                <Input value={section.label} placeholder="שם השלב"
                  onChange={(e) => setSections((s) => s.map((x, i) => (i === si ? { ...x, label: e.target.value } : x)))}
                  className="h-9 font-bold" />
                <button type="button" onClick={() => setSections((s) => move(s, si, si - 1))} disabled={si === 0} aria-label="העלה שלב"
                  className="p-1.5 rounded-md text-pikud-gray-mid hover:text-ink hover:bg-surface disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                <button type="button" onClick={() => setSections((s) => move(s, si, si + 1))} disabled={si === content.sections.length - 1} aria-label="הורד שלב"
                  className="p-1.5 rounded-md text-pikud-gray-mid hover:text-ink hover:bg-surface disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                <button type="button" onClick={() => setSections((s) => s.filter((_, i) => i !== si))} aria-label="מחק שלב"
                  className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="px-4 py-3 space-y-2">
                {section.items.map((item, ii) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <span className="text-xs text-pikud-gray-mid pt-3 w-5 shrink-0 tabular-nums">{ii + 1}.</span>
                    <Textarea value={item.text} rows={2} placeholder="טקסט הפריט"
                      onChange={(e) => setSections((s) => s.map((x, i) => i === si
                        ? { ...x, items: x.items.map((it, j) => (j === ii ? { ...it, text: e.target.value } : it)) } : x))}
                      className="min-h-[56px] text-sm" />
                    <div className="flex flex-col gap-0.5 pt-1">
                      <button type="button" aria-label="העלה פריט" disabled={ii === 0}
                        onClick={() => setSections((s) => s.map((x, i) => (i === si ? { ...x, items: move(x.items, ii, ii - 1) } : x)))}
                        className="p-1 rounded text-pikud-gray-mid hover:text-ink disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button type="button" aria-label="הורד פריט" disabled={ii === section.items.length - 1}
                        onClick={() => setSections((s) => s.map((x, i) => (i === si ? { ...x, items: move(x.items, ii, ii + 1) } : x)))}
                        className="p-1 rounded text-pikud-gray-mid hover:text-ink disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button type="button" aria-label="מחק פריט"
                        onClick={() => setSections((s) => s.map((x, i) => (i === si ? { ...x, items: x.items.filter((_, j) => j !== ii) } : x)))}
                        className="p-1 rounded text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setSections((s) => s.map((x, i) => (i === si ? { ...x, items: [...x.items, { id: newId(section.id), text: "" }] } : x)))}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-pikud-orange-dark hover:underline underline-offset-4">
                  <Plus className="w-4 h-4" /> הוסף פריט
                </button>
              </div>
            </div>
          ))}

          <button type="button"
            onClick={() => setSections((s) => [...s, { id: newId("s"), label: "", items: [{ id: newId("i"), text: "" }] }])}
            className="w-full rounded-xl border-2 border-dashed border-pikud-gray-light py-4 text-sm font-semibold text-ink hover:border-ink hover:bg-surface transition-colors inline-flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> הוסף שלב
          </button>
        </div>
      </div>
    </form>
  );
}
