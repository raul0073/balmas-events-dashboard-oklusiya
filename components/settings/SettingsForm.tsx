"use client";

import { useActionState, useEffect, useState } from "react";
import { Save, Loader2, Check, AlertTriangle, Plus, Trash2, ArrowUp, ArrowDown, Upload, ImageOff, Shield, Palette, Tag, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";
import { saveBattalionSettings, uploadBattalionLogo, removeBattalionLogo, type SettingsState } from "@/app/settings/actions";
import { NONE_COLOR, type PlugahDef, type ResolvedSettings } from "@/lib/battalion-settings";
import emblem from "@/app/assets/pikud-haoref.svg";

interface Props {
  battalionName: string;
  logoUrl: string | null;
  settings: ResolvedSettings;
  /** plugah keys currently used by events, so removing one can warn */
  usedKeys: string[];
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

export default function SettingsForm({ battalionName, logoUrl, settings, usedKeys }: Props) {
  const [name, setName]       = useState(battalionName);
  const [plugot, setPlugot]   = useState<PlugahDef[]>(settings.plugot);
  const [crisis, setCrisis]   = useState<string[]>(settings.crisisTypes);
  const [header, setHeader]   = useState(settings.whatsappHeader);
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(saveBattalionSettings, {});

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <LogoSection logoUrl={logoUrl} />

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="plugot" value={JSON.stringify(plugot)} />
        <input type="hidden" name="crisisTypes" value={JSON.stringify(crisis)} />

        <section className="bg-surface rounded-2xl border border-line p-5 space-y-4">
          <h2 className="font-bold text-ink flex items-center gap-2"><Shield className="w-4 h-4 text-pikud-orange" /> זהות</h2>
          <div className="space-y-1.5">
            <Label htmlFor="s-name">שם הגדוד *</Label>
            <Input id="s-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" />
            <p className="text-xs text-ink-muted">מופיע בסרגל הצדי, בכרטיסי האירועים ובדוחות.</p>
          </div>
        </section>

        <section className="bg-surface rounded-2xl border border-line p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h2 className="font-bold text-ink flex items-center gap-2"><Palette className="w-4 h-4 text-pikud-orange" /> פלוגות</h2>
            <p className="text-xs text-ink-muted">שם וצבע לכל פלוגה. הצבע מסמן את האירועים שלה בלוח.</p>
          </div>
          <ul className="space-y-2">
            {plugot.map((p, i) => {
              const inUse = usedKeys.includes(p.key);
              return (
                <li key={p.key} className="flex items-center gap-2">
                  <label className="relative w-10 h-10 shrink-0 rounded-lg border border-line overflow-hidden cursor-pointer" title="צבע">
                    <input type="color" value={p.color} aria-label={`צבע ${p.label}`}
                      onChange={(e) => setPlugot((s) => s.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))}
                      className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
                    <span className="absolute inset-0" style={{ backgroundColor: p.color }} aria-hidden />
                  </label>
                  <Input value={p.label} placeholder="שם הפלוגה" aria-label="שם הפלוגה"
                    onChange={(e) => setPlugot((s) => s.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    className="h-10" />
                  <button type="button" onClick={() => setPlugot((s) => move(s, i, i - 1))} disabled={i === 0} aria-label="העלה"
                    className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setPlugot((s) => move(s, i, i + 1))} disabled={i === plugot.length - 1} aria-label="הורד"
                    className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  <button type="button" aria-label="מחק פלוגה" title={inUse ? "פלוגה זו משויכת לאירועים; הם ישמרו את השיוך בלי שם" : "מחק"}
                    onClick={() => setPlugot((s) => s.filter((_, j) => j !== i))}
                    className={`p-2 rounded-md hover:bg-red-50 ${inUse ? "text-amber-600 hover:text-amber-800" : "text-red-500 hover:text-red-700"}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button"
            onClick={() => setPlugot((s) => [...s, { key: "", label: "", color: NONE_COLOR }])}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-pikud-orange-dark hover:underline underline-offset-4">
            <Plus className="w-4 h-4" /> הוסף פלוגה
          </button>
        </section>

        <section className="bg-surface rounded-2xl border border-line p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h2 className="font-bold text-ink flex items-center gap-2"><Tag className="w-4 h-4 text-pikud-orange" /> סוגי אירוע</h2>
            <p className="text-xs text-ink-muted">הרשימה שנפתחת באשף ובדף האירוע.</p>
          </div>
          <ul className="space-y-2">
            {crisis.map((t, i) => (
              <li key={i} className="flex items-center gap-2">
                <Input value={t} aria-label="סוג אירוע" onChange={(e) => setCrisis((s) => s.map((x, j) => (j === i ? e.target.value : x)))} className="h-10" />
                <button type="button" onClick={() => setCrisis((s) => move(s, i, i - 1))} disabled={i === 0} aria-label="העלה"
                  className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                <button type="button" onClick={() => setCrisis((s) => move(s, i, i + 1))} disabled={i === crisis.length - 1} aria-label="הורד"
                  className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                <button type="button" onClick={() => setCrisis((s) => s.filter((_, j) => j !== i))} aria-label="מחק"
                  className="p-2 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setCrisis((s) => [...s, ""])}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-pikud-orange-dark hover:underline underline-offset-4">
            <Plus className="w-4 h-4" /> הוסף סוג
          </button>
        </section>

        <section className="bg-surface rounded-2xl border border-line p-5 space-y-4">
          <h2 className="font-bold text-ink flex items-center gap-2"><MessageCircle className="w-4 h-4 text-pikud-orange" /> כותרת וואטסאפ</h2>
          <div className="space-y-1.5">
            <Label htmlFor="s-header">השורה הראשונה של הדיווחים</Label>
            <Input id="s-header" name="whatsappHeader" value={header} onChange={(e) => setHeader(e.target.value)} className="h-11" />
            <p className="text-xs text-ink-muted">למשל: 🚨 *דיווח אירוע | {header || `${name} | פיקוד העורף`}*</p>
          </div>
        </section>

        {state.error && (
          <p role="alert" className="text-red-600 text-sm flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {state.error}
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          {state.ok && !pending && <span className="text-sm text-green-700 font-semibold inline-flex items-center gap-1"><Check className="w-4 h-4" /> נשמר</span>}
          <Button type="submit" variant="orange" disabled={pending} className="h-11 px-6 text-base font-bold flex items-center gap-2">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} שמור הגדרות
          </Button>
        </div>
      </form>
    </div>
  );
}

function LogoSection({ logoUrl }: { logoUrl: string | null }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(uploadBattalionLogo, {});
  const [fileName, setFileName] = useState("");
  useEffect(() => { if (state.ok) setFileName(""); }, [state]);

  return (
    <section className="bg-surface rounded-2xl border border-line p-5 space-y-4">
      <h2 className="font-bold text-ink flex items-center gap-2"><Upload className="w-4 h-4 text-pikud-orange" /> לוגו הגדוד</h2>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="bg-[#fff] rounded-lg w-14 h-14 overflow-hidden flex items-center justify-center p-1 border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={emblem.src} alt="פיקוד העורף" className="w-full h-full object-contain" />
          </div>
          <div className="bg-[#fff] rounded-lg w-14 h-14 overflow-hidden flex items-center justify-center p-1 border border-dashed border-line">
            {logoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logoUrl} alt="לוגו הגדוד" className="w-full h-full object-contain" />
              : <ImageOff className="w-5 h-5 text-ink-faint" />}
          </div>
        </div>
        <p className="text-xs text-ink-muted flex-1 min-w-[200px]">הלוגו מופיע ליד סמל פיקוד העורף בסרגל הצדי. תמונה מרובעת עובדת הכי טוב, עד 2MB.</p>
      </div>
      <form action={formAction} className="flex items-center gap-3 flex-wrap">
        <label className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-line text-sm font-semibold text-ink hover:bg-surface-2 cursor-pointer">
          <input type="file" name="logo" accept="image/*" required className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          <Upload className="w-4 h-4" /> {fileName || "בחר תמונה"}
        </label>
        <Button type="submit" variant="outline" disabled={pending || !fileName} className="h-10 flex items-center gap-1.5">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} העלה
        </Button>
        {logoUrl && (
          <Button type="button" variant="ghost" onClick={() => void removeBattalionLogo()} className="h-10 text-red-600 flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" /> הסר לוגו
          </Button>
        )}
        {state.error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {state.error}</p>}
      </form>
    </section>
  );
}
