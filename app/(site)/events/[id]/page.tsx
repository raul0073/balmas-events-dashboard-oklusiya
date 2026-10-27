"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEvents } from "@/lib/events-context";
import { useLogs } from "@/lib/logger";
import { useBattalion } from "@/lib/session";
import { CrisisEvent, CounterKey, PLUGAH_KEYS, PLUGAH_LABELS, INFRASTRUCTURE_GROUPS, INFRASTRUCTURE_LABELS, CRISIS_TYPES, eventTitle, plugahHex, plugahLabel } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, NumberInput } from "@/components/ui/primitives";
import { formatEventForWhatsApp } from "@/lib/whatsapp";
import { accountedFor, calcMissing, isMetaIncomplete } from "@/lib/events/math";
import { now } from "@/lib/utils";
import {
  ArrowRight, Check, AlertTriangle, Save, Loader2,
  MapPin, Clock, Pencil, X, CheckCircle, MessageCircle, UserCog,
  PartyPopper, XCircle, ShieldAlert
} from "lucide-react";

interface FieldDef { key: CounterKey; label: string; hint: string; }

const EDITABLE_FIELDS: FieldDef[] = [
  { key: "punu",          label: "פונו",           hint: "פונו לאתר אחר" },
  { key: "hulitzu",       label: "חולצו",          hint: "חולצו מהשטח" },
  { key: "meautarim",     label: "מאותרים",        hint: "אותרו, בטיפול" },
  { key: "lekudimGluyim", label: "לכודים גלויים", hint: "נמצאו, טרם חולצו" },
  { key: "lekudimSmuim",  label: "לכודים סמויים", hint: "מוערכים, טרם אותרו" },
];

const FIELD_LABELS: Partial<Record<keyof CrisisEvent, string>> = {
  name: "שם האירוע", address: "כתובת", commander: "אחראי אירוע", anchor: "עוגן", tzapi: "צפי", lekudimGluyim: "לכודים גלויים",
  lekudimSmuim: "לכודים סמויים", hulitzu: "חולצו", meautarim: "מאותרים",
  punu: "פונו", hearot: "הערות", crisisType: "סוג אירוע", infrastructureType: "תשתית",
};

function translateValue(key: keyof CrisisEvent, val: unknown): string {
  if (val === null || val === undefined || val === "") return "ריק";
  if (key === "infrastructureType") return INFRASTRUCTURE_LABELS[val as keyof typeof INFRASTRUCTURE_LABELS] ?? String(val);
  if (key === "plugah") return PLUGAH_LABELS[val as keyof typeof PLUGAH_LABELS] ?? String(val);
  return String(val);
}

function buildChangeSummary(prev: CrisisEvent, next: CrisisEvent): string {
  const changes: string[] = [];
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const k = key as keyof CrisisEvent;
    if (prev[k] !== next[k]) {
      changes.push(`ערך שהשתנה: ${label}\n${translateValue(k, prev[k])} השתנה ל${translateValue(k, next[k])}`);
    }
  }
  return changes.join(" | ");
}

export default function EventPage() {
  const params    = useParams();
  const router    = useRouter();
  const battalion = useBattalion();
  const { getEvent, updateEvent, loaded } = useEvents();
  const { addLog } = useLogs();

  const [form, setForm]                 = useState<CrisisEvent | null>(null);
  const [metaOpen, setMetaOpen]         = useState(false);
  const [copied, setCopied]             = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [saveError, setSaveError]       = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const prevFormRef = useRef<CrisisEvent | null>(null);

  // Wait for the first server load before deciding the event doesn't exist.
  // The form is seeded once; later realtime updates don't clobber what's being typed.
  useEffect(() => {
    if (!loaded || form) return;
    const event = getEvent(params.id as string);
    if (event) {
      setForm(event);
      prevFormRef.current = event;
      setMetaOpen(isMetaIncomplete(event));
    } else {
      router.replace("/events");
    }
  }, [loaded, form, getEvent, params.id, router]);

  const missing = useMemo(() => (form ? calcMissing(form) : null), [form]);

  if (!loaded || !form) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center text-pikud-gray-mid gap-2 bg-gray-50">
        <Loader2 className="w-5 h-5 animate-spin" /> טוען אירוע…
      </div>
    );
  }

  function update<K extends keyof CrisisEvent>(key: K, value: CrisisEvent[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function parseNum(raw: string): number | null {
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : Math.max(0, n);
  }

  async function persist(next: CrisisEvent, logs: Parameters<typeof addLog>[0][]) {
    setSaving(true); setSaveError("");
    try {
      await updateEvent(next);
      for (const l of logs) void addLog(l);
      prevFormRef.current = next;
      return true;
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "השמירה נכשלה");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!form) return;
    const updated = { ...form, name: form.name.trim(), address: form.address.trim(), commander: form.commander.trim(), updatedAt: now() };
    const prev = prevFormRef.current!;
    const logs: Parameters<typeof addLog>[0][] = [];
    if (prev.plugah !== updated.plugah) {
      logs.push({ action: "שינוי פלוגה", eventId: updated.id, eventAddress: eventTitle(updated), plugah: updated.plugah,
        detail: `${plugahLabel(prev.plugah, "ללא")} → ${plugahLabel(updated.plugah, "ללא")}` });
    }
    const changeSummary = buildChangeSummary(prev, updated);
    if (changeSummary) {
      logs.push({ action: "עדכון נתונים", eventId: updated.id, eventAddress: eventTitle(updated), plugah: updated.plugah, detail: changeSummary });
    }
    if (await persist(updated, logs)) {
      setSaved(true);
      setTimeout(() => router.push("/events"), 600);
    }
  }

  async function handleClose() {
    if (!form) return;
    if (!confirmClose) {
      setConfirmClose(true);
      setTimeout(() => setConfirmClose(false), 4000);
      return;
    }
    const updated = { ...form, status: "closed" as const, updatedAt: now() };
    const ok = await persist(updated, [{
      action: "סגירת אירוע", eventId: updated.id, eventAddress: eventTitle(updated), plugah: updated.plugah,
      detail: missing === 0 ? "הושלם — אפס נעדרים" : `נעדרים בסגירה: ${missing ?? "—"}`,
    }]);
    if (ok) router.push("/events");
  }

  async function handleCopy() {
    if (!form) return;
    await navigator.clipboard.writeText(formatEventForWhatsApp(form, `${battalion.name} | פיקוד העורף`));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const incompleteMeta = isMetaIncomplete(form);
  const color      = plugahHex(form.plugah);
  const hasAnchor  = form.anchor !== null;
  const isFinale   = missing === 0;
  const isNegative = missing !== null && missing < 0;
  const isClosed   = form.status === "closed";
  const accounted  = hasAnchor ? accountedFor(form) : null;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-gray-50">

      {/* ── TOPBAR ── */}
      <div className="bg-pikud-navy-dark border-b border-white/10 shrink-0 shadow-sm">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push("/events")} aria-label="חזרה ללוח"
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0">
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="h-10 w-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pikud-orange shrink-0" />
                  <span className="font-bold text-pikud-cream text-base truncate">{eventTitle(form)}</span>
                </div>
                {form.name.trim() && form.address.trim() && (
                  <span className="text-white/60 text-sm truncate">{form.address}</span>
                )}
                {isClosed && (
                  <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full font-bold">סגור</span>
                )}
                {form.crisisType && (
                  <span className="bg-pikud-orange/15 text-pikud-orange-light text-xs px-2 py-0.5 rounded-md font-semibold border border-pikud-orange/20">
                    {form.crisisType}
                  </span>
                )}
                {form.plugah && (
                  <span style={{ backgroundColor: color }} className="text-white text-xs px-2 py-0.5 rounded-md font-semibold">
                    {PLUGAH_LABELS[form.plugah]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {form.infrastructureType && (
                  <span className="text-white/50 text-xs">{INFRASTRUCTURE_LABELS[form.infrastructureType]}</span>
                )}
                {form.commander.trim() && (
                  <span className="flex items-center gap-1 text-white/70 text-xs"><UserCog className="w-3 h-3 text-pikud-orange" /> {form.commander}</span>
                )}
                <span className="flex items-center gap-1 text-white/50 text-xs">
                  <Clock className="w-3 h-3" />
                  {new Date(form.createdAt).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
                {incompleteMeta && !isClosed && (
                  <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                    <AlertTriangle className="w-3 h-3" /> נדרשת השלמה
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setMetaOpen((v) => !v)} title="ערוך פרטי אירוע" aria-expanded={metaOpen}
              className={`p-2 rounded-lg transition-all text-sm font-semibold flex items-center gap-1.5 border ${
                metaOpen ? "bg-white text-pikud-navy border-white" : "text-white/80 border-white/30 hover:bg-white/10 hover:text-white"
              }`}>
              {metaOpen ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs">{metaOpen ? "סגור עריכה" : "ערוך כתובת, פלוגה וסוג אירוע"}</span>
            </button>
            <Button variant="whatsapp" size="sm" onClick={handleCopy} className="flex items-center gap-1.5 text-sm font-semibold">
              {copied ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "הועתק!" : "העתק סיכום לוואטסאפ"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── META PANEL ── */}
      {metaOpen && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200">
          <div className="px-4 sm:px-6 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="name" className="text-xs font-semibold text-gray-600">שם האירוע</Label>
              <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="לא חובה" className="h-9 text-sm bg-white" />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="address" className="text-xs font-semibold text-gray-600">כתובת</Label>
              <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="שם או כתובת, אחד חובה" className="h-9 text-sm bg-white" />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="commander" className="text-xs font-semibold text-gray-600">אחראי אירוע בגדוד</Label>
              <Input id="commander" value={form.commander} onChange={(e) => update("commander", e.target.value)} placeholder="שם ותפקיד" className="h-9 text-sm bg-white" />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="crisisType" className="text-xs font-semibold text-gray-600 flex gap-1">סוג אירוע {!form.crisisType && <span className="text-amber-600">*</span>}</Label>
              <Select id="crisisType" value={form.crisisType ?? ""} onChange={(e) => update("crisisType", (e.target.value || null) as CrisisEvent["crisisType"])} className="h-9 text-sm bg-white">
                <option value="">-- בחר --</option>
                {CRISIS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="infra" className="text-xs font-semibold text-gray-600 flex gap-1">תשתית {!form.infrastructureType && <span className="text-amber-600">*</span>}</Label>
              <Select id="infra" value={form.infrastructureType ?? ""} onChange={(e) => update("infrastructureType", (e.target.value || null) as CrisisEvent["infrastructureType"])} className="h-9 text-sm bg-white">
                <option value="">-- בחר --</option>
{INFRASTRUCTURE_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.keys.map((k) => <option key={k} value={k}>{INFRASTRUCTURE_LABELS[k]}</option>)}
                  </optgroup>
                ))}
              </Select>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="plugah" className="text-xs font-semibold text-gray-600 flex gap-1">פלוגה {!form.plugah && <span className="text-amber-600">*</span>}</Label>
              <Select id="plugah" value={form.plugah ?? ""} onChange={(e) => update("plugah", (e.target.value || null) as CrisisEvent["plugah"])} className="h-9 text-sm bg-white">
                <option value="">-- בחר --</option>
                {PLUGAH_KEYS.map((k) => <option key={k} value={k}>{PLUGAH_LABELS[k]}</option>)}
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* ── STATUS BANNER ── */}
      {isFinale && !isClosed && (
        <div className="shrink-0 bg-green-500 px-6 py-2.5 flex items-center justify-center gap-2">
          <PartyPopper className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">נעדרים: 0 — כל האנשים ידועים! מוכן לסגירה</span>
          <PartyPopper className="w-4 h-4 text-white" />
        </div>
      )}
      {isNegative && (
        <div className="shrink-0 bg-red-500 px-6 py-2.5 flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">שגיאה: הסכום ({accounted}) עולה על העוגן ({form.anchor})</span>
        </div>
      )}

      {/* ── BODY ── */}
      <div className="flex-1 flex overflow-hidden min-h-0 gap-0 px-1">
        <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-5 gap-3 min-h-0">

          <div className="shrink-0 flex gap-3">
            <div className="flex-1 bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-4">
              <div>
                <Label htmlFor="anchor" className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5 block">רשימת עוגן</Label>
                <NumberInput id="anchor"
                  value={form.anchor ?? ""}
                  onChange={(e) => update("anchor", parseNum(e.target.value))}
                  placeholder="לא הוגדר"
                  className="w-32 h-9 text-lg font-black border-gray-200 focus:border-pikud-navy"
                />
              </div>
              <div className="h-10 w-px bg-gray-100" />
              <div>
                <Label htmlFor="tzapi" className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5 block">צפי</Label>
                <NumberInput id="tzapi"
                  value={form.tzapi ?? ""}
                  onChange={(e) => update("tzapi", parseNum(e.target.value))}
                  placeholder="—"
                  className="w-24 h-9 text-sm border-gray-200"
                />
              </div>
              {hasAnchor && (
                <>
                  <div className="h-10 w-px bg-gray-100" />
                  <div className="text-xs text-gray-400 leading-relaxed">
                    <p>מסוכם: <strong className="text-pikud-navy">{accounted}</strong></p>
                    <p className="text-gray-300">עוגן − מסוכם = נעדרים</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-0">
            <div className="shrink-0 grid grid-cols-[1fr_160px_1fr] px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">שדה</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ערך</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">הסבר</span>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-gray-50">
              {EDITABLE_FIELDS.map((field) => {
                const val = form[field.key];
                const hasVal = val !== null && val > 0;
                return (
                  <div key={field.key}
                    className={`grid grid-cols-[1fr_160px_1fr] px-5 py-3 items-center transition-colors hover:bg-gray-50/80 ${hasVal ? "bg-blue-50/30" : "bg-white"}`}>
                    <Label htmlFor={field.key} className={`font-semibold text-sm ${hasVal ? "text-pikud-navy" : "text-gray-600"}`}>
                      {field.label}
                      {hasVal && <span className="mr-2 inline-block w-1.5 h-1.5 rounded-full bg-pikud-orange align-middle" />}
                    </Label>
                    <NumberInput id={field.key}
                      value={val ?? ""}
                      onChange={(e) => update(field.key, parseNum(e.target.value))}
                      placeholder="—"
                      className={`w-28 h-9 text-sm ${hasVal ? "border-pikud-navy/30 font-bold" : "border-gray-200"}`}
                    />
                    <span className="text-xs text-gray-400">{field.hint}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: "88px" }}>
            <div className="px-4 py-1.5 border-b border-gray-100 shrink-0">
              <Label htmlFor="hearot" className="text-xs font-bold text-gray-400 uppercase tracking-wider">הערות</Label>
            </div>
            <textarea id="hearot"
              value={form.hearot}
              onChange={(e) => update("hearot", e.target.value)}
              placeholder="הערות שדה, מידע נוסף..."
              className="flex-1 w-full px-4 py-2 resize-none text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none bg-transparent"
            />
          </div>
        </div>

        {/* RIGHT: missing panel */}
        <div className="w-48 shrink-0 flex flex-col p-4 pl-0 sm:p-5 sm:pl-0 gap-3">
          <div className={`flex-1 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all
            ${missing === null ? "bg-white border-gray-200" : isFinale ? "bg-green-50 border-green-300" : isNegative ? "bg-red-50 border-red-300" : "bg-red-50 border-red-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-widest
              ${isFinale ? "text-green-500" : isNegative ? "text-red-500" : missing !== null ? "text-red-400" : "text-gray-300"}`}>נעדרים</span>
            <span className={`font-black leading-none
              ${missing === null ? "text-5xl text-gray-200" : isFinale ? "text-6xl text-green-600" : isNegative ? "text-5xl text-red-600" : "text-6xl text-red-600"}`}>
              {missing === null ? "?" : missing}
            </span>
            {missing === null && <span className="text-xs text-gray-300 text-center px-3 leading-tight">הזן עוגן לחישוב</span>}
            {isFinale && (
              <div className="flex flex-col items-center gap-1">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-xs text-green-600 font-bold text-center">כולם ידועים</span>
              </div>
            )}
            {isNegative && <span className="text-xs text-red-500 font-bold text-center px-2">סכום מעל העוגן!</span>}
            {missing !== null && missing > 0 && <span className="text-xs text-red-400 font-semibold animate-pulse">דחוף</span>}
          </div>
        </div>
      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          {!isClosed ? (
            <Button onClick={handleClose} disabled={saving}
              className={`flex items-center gap-2 h-10 text-sm font-semibold transition-all ${
                confirmClose ? "bg-red-600 text-white border-red-600 shadow-md" : "bg-white text-red-500 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600"
              }`}>
              <XCircle className="w-4 h-4" />
              {confirmClose ? "לחץ שוב — לאישור סגירה" : "סגור אירוע"}
            </Button>
          ) : (
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-400 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
              <CheckCircle className="w-4 h-4" /> אירוע סגור
            </span>
          )}
          {saveError && <span role="alert" className="text-xs text-red-600 font-medium">{saveError}</span>}
        </div>

        <Button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 text-base font-bold px-8 h-11 transition-all shadow-sm ${
            saved ? "bg-green-500 hover:bg-green-600 text-white border-green-500" : "bg-pikud-orange hover:bg-pikud-orange-dark text-white border-pikud-orange"
          }`}>
          {saved ? <><Check className="w-5 h-5" /> נשמר!</>
            : saving ? <><Loader2 className="w-5 h-5 animate-spin" /> שומר…</>
            : <><Save className="w-5 h-5" /> שמור וחזור ללוח</>}
        </Button>
      </div>
    </div>
  );
}
