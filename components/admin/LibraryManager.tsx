"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, Loader2, Check, AlertTriangle, Pencil, Trash2, ArrowUp, ArrowDown, X, ExternalLink, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/primitives";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { ActionState } from "@/app/admin/actions";
import { deleteLibraryItem, moveLibraryItem, updateLibraryItem, uploadLibraryItem } from "@/app/admin/library/actions";
import { LIBRARY_CATEGORIES, SPACE_LABELS, categoryLabel, fileKindLabel, formatSize, previewKind, type LibraryItem } from "@/lib/library/types";
import type { ToolTone } from "@/lib/tools";

const SPACES: ToolTone[] = ["orange", "green"];

export default function LibraryManager({ items }: { items: LibraryItem[] }) {
  const [space, setSpace] = useState<ToolTone>("orange");
  const visible = items.filter((i) => i.space === space);

  return (
    <div className="bg-pikud-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-ink font-black text-2xl lg:hidden">ספריית ידע</h2>
            <p className="text-ink-muted text-sm">קבצים להורדה ותצוגה. לכל מרחב ספרייה משלו.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-lg bg-surface-2 border border-line p-0.5" role="radiogroup" aria-label="מרחב">
              {SPACES.map((s) => (
                <button key={s} type="button" role="radio" aria-checked={space === s} onClick={() => setSpace(s)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ${space === s ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${s === "orange" ? "bg-pikud-orange" : "bg-idf-green-light"}`} aria-hidden />
                  {SPACE_LABELS[s]}
                </button>
              ))}
            </div>
            <Link href={`/library/${space}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline underline-offset-4">
              <ExternalLink className="w-4 h-4" /> פתח את העמוד
            </Link>
          </div>
        </div>

        <UploadForm space={space} />

        {visible.length === 0 ? (
          <div className="bg-surface rounded-xl border border-line px-5 py-12 text-center text-ink-muted">אין קבצים במרחב {SPACE_LABELS[space]} עדיין.</div>
        ) : (
          <ul className="space-y-3">
            {visible.map((item) => <ItemRow key={item.id} item={item} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

function UploadForm({ space }: { space: ToolTone }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(uploadLibraryItem, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState("");
  useEffect(() => { if (state.ok) { formRef.current?.reset(); setFileName(""); } }, [state]);

  return (
    <form ref={formRef} action={formAction} className="bg-surface rounded-xl border border-line p-5 space-y-4">
      <input type="hidden" name="space" value={space} />
      <div className="flex items-center gap-2 text-ink font-bold"><Upload className="w-4 h-4 text-pikud-orange" /> העלאת קובץ ל{SPACE_LABELS[space]}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="sm:col-span-2 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line hover:border-ink py-6 cursor-pointer text-sm text-ink-muted">
          <input type="file" name="file" required className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
          <Upload className="w-6 h-6" />
          <span className="font-semibold text-ink">{fileName || "בחר קובץ"}</span>
          <span className="text-xs">תמונה, PDF או Office, עד 25MB</span>
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="up-title">כותרת</Label>
          <Input id="up-title" name="title" placeholder="ריק = שם הקובץ" className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="up-category">קטגוריה</Label>
          <Select id="up-category" name="category" defaultValue="forms" className="h-10">
            {LIBRARY_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="up-desc">תיאור</Label>
          <Textarea id="up-desc" name="description" rows={2} placeholder="שורה או שתיים על הקובץ" className="min-h-[56px]" />
        </div>
      </div>
      {state.error && <p role="alert" className="text-red-600 text-sm flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> {state.error}</p>}
      <Button type="submit" variant="orange" disabled={pending} className="flex items-center gap-1.5">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : state.ok ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
        {pending ? "מעלה…" : "העלה ופרסם"}
      </Button>
    </form>
  );
}

function ItemRow({ item }: { item: LibraryItem }) {
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateLibraryItem, {});
  useEffect(() => { if (state.ok) setEditing(false); }, [state]);
  const kind = previewKind(item.mime, item.fileName);

  return (
    <li className="bg-surface rounded-xl border border-line p-4">
      <div className="flex items-start gap-4">
        <a href={item.url} target="_blank" rel="noopener" className="w-24 h-18 shrink-0 rounded-lg bg-surface-2 border border-line overflow-hidden flex items-center justify-center" aria-label="פתח את הקובץ">
          {kind === "image"
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={item.url} alt="" className="w-full h-full object-cover object-top" />
            : <FileText className="w-8 h-8 text-ink-muted" />}
        </a>
        <div className="min-w-0 flex-1">
          {editing ? (
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="id" value={item.id} />
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
                <Input name="title" defaultValue={item.title} required className="h-9" />
                <Select name="space" defaultValue={item.space} className="h-9">
                  {SPACES.map((s) => <option key={s} value={s}>{SPACE_LABELS[s]}</option>)}
                </Select>
                <Select name="category" defaultValue={item.category} className="h-9">
                  {LIBRARY_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
              </div>
              <Textarea name="description" defaultValue={item.description} rows={2} className="min-h-[56px] text-sm" />
              {state.error && <p className="text-xs text-red-600">{state.error}</p>}
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" variant="orange" disabled={pending} className="flex items-center gap-1.5">
                  {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} שמור
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} className="flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> ביטול</Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-ink">{item.title}</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-ink/5 text-ink">{categoryLabel(item.category)}</span>
              </div>
              {item.description && <p className="text-sm text-ink-soft mt-1">{item.description}</p>}
              <p className="text-[11px] text-ink-muted mt-1 inline-flex items-center gap-2">
                {kind === "image" ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                {fileKindLabel(item.mime, item.fileName)} · {formatSize(item.sizeBytes)} · <span dir="ltr" className="font-mono">{item.fileName}</span>
              </p>
            </>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-1 shrink-0">
            <form action={moveLibraryItem}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="dir" value="up" />
              <button type="submit" aria-label="העלה" className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2"><ArrowUp className="w-4 h-4" /></button></form>
            <form action={moveLibraryItem}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="dir" value="down" />
              <button type="submit" aria-label="הורד" className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2"><ArrowDown className="w-4 h-4" /></button></form>
            <button type="button" onClick={() => setEditing(true)} aria-label="ערוך" className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2"><Pencil className="w-4 h-4" /></button>
            <button type="button" onClick={() => setDeleteOpen(true)} aria-label="מחק" className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </div>
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)}
        onConfirm={() => { const fd = new FormData(); fd.set("id", item.id); void deleteLibraryItem(fd); }}
        title={`מחיקת "${item.title}"`} description="הקובץ יימחק מהספרייה ומהאחסון. לא ניתן לשחזר." confirmLabel="מחק" cancelLabel="ביטול" />
    </li>
  );
}
