"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEvents } from "@/lib/events-context";
import { useLogs } from "@/lib/logger";
import { CrisisEvent, PLUGAH_LABELS, INFRASTRUCTURE_LABELS, CRISIS_TYPES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, NumberInput } from "@/components/ui/primitives";
import { formatEventForWhatsApp } from "@/lib/whatsapp";
import { now } from "@/lib/utils";
import {
  ArrowRight, Check, AlertTriangle, Save,
  MapPin, Clock, Pencil, X, CheckCircle, MessageCircle,
  PartyPopper, XCircle, ShieldAlert
} from "lucide-react";

const plugahAccent: Record<string, string> = {
  alef:  "border-l-[6px] border-l-[#1A3F7A]",
  bet:   "border-l-[6px] border-l-[#2E7D32]",
  gimel: "border-l-[6px] border-l-[#6A1B9A]",
  other: "border-l-[6px] border-l-[#37474F]",
  none:  "border-l-[6px] border-l-gray-300",
};

const plugahBadge: Record<string, string> = {
  alef:  "bg-[#1A3F7A] text-white",
  bet:   "bg-[#2E7D32] text-white",
  gimel: "bg-[#6A1B9A] text-white",
  other: "bg-[#37474F] text-white",
  none:  "bg-gray-400 text-white",
};

interface FieldDef { key: keyof CrisisEvent; label: string; hint: string; }

const EDITABLE_FIELDS: FieldDef[] = [
  { key: "punu",          label: "פונו",           hint: "פונו לאתר אחר" },
  { key: "hulitzu",       label: "חולצו",          hint: "חולצו מהשטח" },
  { key: "meautarim",     label: "מאותרים",        hint: "אותרו, בטיפול" },
  { key: "lekudimGluyim", label: "לכודים גלויים", hint: "נמצאו, טרם חולצו" },
  { key: "lekudimSmuim",  label: "לכודים סמויים", hint: "מוערכים, טרם אותרו" },
];

export default function EventPage() {
  const params  = useParams();
  const router  = useRouter();
  const { getEvent, updateEvent } = useEvents();
  const { addLog } = useLogs();

  const [form, setForm]               = useState<CrisisEvent | null>(null);
  const [metaOpen, setMetaOpen]       = useState(false);
  const [copied, setCopied]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const prevFormRef                   = useRef<CrisisEvent | null>(null);

  useEffect(() => {
    const event = getEvent(params.id as string);
    if (event) {
      setForm(event);
      prevFormRef.current = event;
      setMetaOpen(!event.crisisType || !event.infrastructureType || !event.plugah);
    } else {
      router.push("/");
    }
  }, [params.id]);

  const nedarim = useMemo(() => {
    if (!form || form.resheimEogen === null) return null;
    return form.resheimEogen
      - (form.lekudimGluyim ?? 0)
      - (form.lekudimSmuim  ?? 0)
      - (form.hulitzu       ?? 0)
      - (form.meautarim     ?? 0)
      - (form.punu          ?? 0);
  }, [form?.resheimEogen, form?.lekudimGluyim, form?.lekudimSmuim, form?.hulitzu, form?.meautarim, form?.punu]);

  if (!form) return null;

  const formWithNedarim: CrisisEvent = { ...form, nedarim };

  function update<K extends keyof CrisisEvent>(key: K, value: CrisisEvent[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function translateValue(key: string, val: any): string {
    if (val === null || val === undefined) return "ריק";
    if (key === "infrastructureType") {
      const m: Record<string, string> = { house: "בית", building: "בניין", school: "בית ספר", other: "אחר" };
      return m[val] ?? val;
    }
    if (key === "plugah") {
      const m: Record<string, string> = { alef: "פלוגה א", bet: "פלוגה ב", gimel: "פלוגה ג", other: "אחר" };
      return m[val] ?? val;
    }
    return String(val);
  }

  function buildChangeSummary(prev: CrisisEvent, next: CrisisEvent): string {
    const labels: Partial<Record<keyof CrisisEvent, string>> = {
      resheimEogen: "עוגן", tzapi: "צפי", lekudimGluyim: "לכודים גלויים",
      lekudimSmuim: "לכודים סמויים", hulitzu: "חולצו", meautarim: "מאותרים",
      punu: "פונו", hearot: "הערות", crisisType: "סוג אירוע", infrastructureType: "תשתית",
    };
    const changes: string[] = [];
    for (const [key, label] of Object.entries(labels)) {
      const k = key as keyof CrisisEvent;
      if (prev[k] !== next[k]) {
        const from = translateValue(key, prev[k]);
        const to   = translateValue(key, next[k]);
        changes.push(`ערך שהשתנה: ${label}\n${from} השתנה ל${to}`);
      }
    }
    return changes.join(" | ");
  }

  function handleSave() {
    const updated = { ...formWithNedarim, updatedAt: now() };
    updateEvent(updated);
    const prev = prevFormRef.current!;
    const changeSummary = buildChangeSummary(prev, updated);
    if (prev.plugah !== updated.plugah) {
      addLog({ action: "שינוי פלוגה", eventId: updated.id, eventAddress: updated.address, plugah: updated.plugah,
        detail: `${prev.plugah ? PLUGAH_LABELS[prev.plugah] : "ללא"} → ${updated.plugah ? PLUGAH_LABELS[updated.plugah] : "ללא"}` });
    }
    if (changeSummary) {
      addLog({ action: "עדכון נתונים", eventId: updated.id, eventAddress: updated.address, plugah: updated.plugah, detail: changeSummary });
    }
    prevFormRef.current = updated;
    setSaved(true);
    setTimeout(() => router.push("/"), 700);
  }

  function handleClose() {
    if (!confirmClose) {
      setConfirmClose(true);
      setTimeout(() => setConfirmClose(false), 4000);
      return;
    }
    const updated = { ...formWithNedarim, status: "closed" as const, updatedAt: now() };
    updateEvent(updated);
    addLog({ action: "סגירת אירוע", eventId: updated.id, eventAddress: updated.address, plugah: updated.plugah,
      detail: nedarim === 0 ? "הושלם — אפס נעדרים" : `נעדרים בסגירה: ${nedarim ?? "—"}` });
    router.push("/");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(formatEventForWhatsApp(formWithNedarim));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const incompleteMeta = !form.crisisType || !form.infrastructureType || !form.plugah;
  const plugahKey  = form.plugah ?? "none";
  const hasAnchor  = form.resheimEogen !== null;
  const isFinale   = nedarim === 0;
  const isNegative = nedarim !== null && nedarim < 0;
  const isClosed   = form.status === "closed";
  const accounted  = hasAnchor
    ? (form.lekudimGluyim ?? 0) + (form.lekudimSmuim ?? 0) +
      (form.hulitzu ?? 0) + (form.meautarim ?? 0) + (form.punu ?? 0)
    : null;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-gray-50">

      {/* ── TOPBAR ── */}
      <div className="bg-pikud-navy-dark border-b border-gray-200 shrink-0 shadow-sm">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">

          {/* Left: back + address */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push("/")}
              className="p-1.5 rounded-lg text-gray-400 hover:text-pikud-navy hover:bg-gray-100 transition-colors shrink-0">
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Plugah color bar */}
            <div className={`h-10 w-1 rounded-full shrink-0 ${
              plugahKey === "alef" ? "bg-[#1A3F7A]" :
              plugahKey === "bet"  ? "bg-[#2E7D32]" :
              plugahKey === "gimel"? "bg-[#6A1B9A]" :
              plugahKey === "other"? "bg-[#37474F]"  : "bg-gray-300"
            }`} />

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pikud-orange shrink-0" />
                  <span className="font-bold text-pikud-cream text-base truncate">{form.address}</span>
                </div>
                {isClosed && (
                  <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-bold border border-gray-200">סגור</span>
                )}
                {form.crisisType && (
                  <span className="bg-pikud-orange/10 text-pikud-orange-dark text-xs px-2 py-0.5 rounded-md font-semibold border border-pikud-orange/20">
                    {form.crisisType}
                  </span>
                )}
                {form.plugah && (
                  <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${plugahBadge[plugahKey]}`}>
                    {PLUGAH_LABELS[form.plugah]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {form.infrastructureType && (
                  <span className="text-gray-400 text-xs">{INFRASTRUCTURE_LABELS[form.infrastructureType]}</span>
                )}
                <span className="flex items-center gap-1 text-gray-400 text-xs">
                  <Clock className="w-3 h-3" />
                  {new Date(form.createdAt).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
                {incompleteMeta && !isClosed && (
                  <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                    <AlertTriangle className="w-3 h-3" /> נדרש השלמה
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setMetaOpen((v) => !v)}
              title="ערוך פרטי אירוע"
              className={`p-2 rounded-lg transition-all text-sm font-semibold flex items-center gap-1.5 ${
                metaOpen
                  ? "bg-pikud-navy text-red-600"
                  : "text-gray-500 hover:text-pikud-navy hover:bg-gray-400 border border-gray-600"
              }`}>
              {metaOpen ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs">{metaOpen ? "סגור עריכה" : "ערוך כתובת, פלוגה וסוג אירוע"}</span>
            </button>
            <Button variant="whatsapp" size="sm" onClick={handleCopy} className="flex items-center gap-1.5 text-sm font-semibold">
              {copied ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "הועתק!" : "העתק סיכום לואטסאפ"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── META PANEL ── */}
      {metaOpen && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200">
          <div className="px-4 sm:px-6 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-1 lg:col-span-2">
              <Label className="text-xs font-semibold text-gray-600">כתובת *</Label>
              <Input value={form.address} onChange={(e) => update("address", e.target.value)} className="h-9 text-sm bg-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600 flex gap-1">סוג אירוע {!form.crisisType && <span className="text-amber-600">*</span>}</Label>
              <Select value={form.crisisType ?? ""} onChange={(e) => update("crisisType", (e.target.value || null) as any)} className="h-9 text-sm bg-white">
                <option value="">-- בחר --</option>
                {CRISIS_TYPES.map((t) => t && <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600 flex gap-1">תשתית {!form.infrastructureType && <span className="text-amber-600">*</span>}</Label>
              <Select value={form.infrastructureType ?? ""} onChange={(e) => update("infrastructureType", (e.target.value || null) as any)} className="h-9 text-sm bg-white">
                <option value="">-- בחר --</option>
                <option value="house">בית</option>
                <option value="building">בניין</option>
                <option value="school">בית ספר</option>
                <option value="other">אחר</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600 flex gap-1">פלוגה {!form.plugah && <span className="text-amber-600">*</span>}</Label>
              <Select value={form.plugah ?? ""} onChange={(e) => update("plugah", (e.target.value || null) as any)} className="h-9 text-sm bg-white">
                <option value="">-- בחר --</option>
                <option value="alef">פלוגה א</option>
                <option value="bet">פלוגה ב</option>
                <option value="gimel">פלוגה ג</option>
                <option value="other">אחר</option>
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
          <span className="text-white font-bold text-sm">שגיאה: הסכום ({accounted}) עולה על העוגן ({form.resheimEogen})</span>
        </div>
      )}

      {/* ── BODY: two-column layout ── */}
      <div className="flex-1 flex overflow-hidden min-h-0 gap-0 px-1">

        {/* LEFT: data table */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-5 gap-3 min-h-0">

          {/* Anchor + tzapi mini row */}
          <div className="shrink-0 flex gap-3">
            <div className="flex-1 bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">רשימת עוגן</p>
                <NumberInput
                  value={form.resheimEogen ?? ""}
                  onChange={(e) => { const n = parseInt(e.target.value); update("resheimEogen", isNaN(n) ? null : n); }}
                  placeholder="לא הוגדר"
                  className="w-32 h-9 text-lg font-black border-gray-200 focus:border-pikud-navy"
                />
              </div>
              <div className="h-10 w-px bg-gray-100" />
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">צפי</p>
                <NumberInput
                  value={form.tzapi ?? ""}
                  onChange={(e) => { const n = parseInt(e.target.value); update("tzapi", isNaN(n) ? null : n); }}
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

          {/* Fields table */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-0">
            <div className="shrink-0 grid grid-cols-[1fr_160px_1fr] px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">שדה</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ערך</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">הסבר</span>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-gray-50">
              {EDITABLE_FIELDS.map((field, i) => {
                const val = form[field.key] as number | null;
                const hasVal = val !== null && val !== undefined && val > 0;
                return (
                  <div key={field.key}
                    className={`grid grid-cols-[1fr_160px_1fr] px-5 py-3 items-center transition-colors hover:bg-gray-50/80
                      ${hasVal ? "bg-blue-50/30" : "bg-white"}`}>
                    <span className={`font-semibold text-sm ${hasVal ? "text-pikud-navy" : "text-gray-600"}`}>
                      {field.label}
                      {hasVal && <span className="mr-2 inline-block w-1.5 h-1.5 rounded-full bg-pikud-orange align-middle" />}
                    </span>
                    <NumberInput
                      value={val ?? ""}
                      onChange={(e) => { const n = parseInt(e.target.value); update(field.key, (isNaN(n) ? null : n) as any); }}
                      placeholder="—"
                      className={`w-28 h-9 text-sm ${hasVal ? "border-pikud-navy/30 font-bold" : "border-gray-200"}`}
                    />
                    <span className="text-xs text-gray-400">{field.hint}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: "88px" }}>
            <div className="px-4 py-1.5 border-b border-gray-100 shrink-0">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">הערות</span>
            </div>
            <textarea
              value={form.hearot}
              onChange={(e) => update("hearot", e.target.value)}
              placeholder="הערות שדה, מידע נוסף..."
              className="flex-1 w-full px-4 py-2 resize-none text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none bg-transparent"
            />
          </div>
        </div>

        {/* RIGHT: נעדרים panel */}
        <div className="w-48 shrink-0 flex flex-col p-4 pl-0 sm:p-5 sm:pl-0 gap-3">
          <div className={`flex-1 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all
            ${nedarim === null   ? "bg-white border-gray-200"            : ""}
            ${isFinale          ? "bg-green-50 border-green-300"         : ""}
            ${isNegative        ? "bg-red-50 border-red-300"             : ""}
            ${nedarim !== null && !isFinale && !isNegative && nedarim === 0 ? "bg-white border-gray-200" : ""}
            ${nedarim !== null && !isFinale && !isNegative && nedarim > 0  ? "bg-red-50 border-red-200" : ""}
          `}>
            <span className={`text-xs font-bold uppercase tracking-widest
              ${isFinale ? "text-green-500" : isNegative ? "text-red-500" : nedarim !== null && nedarim > 0 ? "text-red-400" : "text-gray-300"}
            `}>נעדרים</span>

            <span className={`font-black leading-none
              ${nedarim === null                       ? "text-5xl text-gray-200"      : ""}
              ${isFinale                              ? "text-6xl text-green-600"      : ""}
              ${isNegative                            ? "text-5xl text-red-600"        : ""}
              ${nedarim !== null && !isFinale && !isNegative && nedarim > 0 ? "text-6xl text-red-600" : ""}
              ${nedarim !== null && !isFinale && !isNegative && nedarim === 0 ? "text-5xl text-gray-300" : ""}
            `}>
              {nedarim === null ? "?" : nedarim}
            </span>

            {nedarim === null && (
              <span className="text-xs text-gray-300 text-center px-3 leading-tight">הזן עוגן לחישוב</span>
            )}
            {isFinale && (
              <div className="flex flex-col items-center gap-1">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-xs text-green-600 font-bold text-center">כולם ידועים</span>
              </div>
            )}
            {isNegative && (
              <span className="text-xs text-red-500 font-bold text-center px-2">סכום מעל העוגן!</span>
            )}
            {nedarim !== null && nedarim > 0 && !isNegative && (
              <span className="text-xs text-red-400 font-semibold animate-pulse">דחוף</span>
            )}
          </div>
        </div>
      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          {!isClosed ? (
            <Button
              onClick={handleClose}
              className={`flex items-center gap-2 h-10 text-sm font-semibold transition-all ${
                confirmClose
                  ? "bg-red-600 text-white border-red-600 shadow-md"
                  : "bg-white text-red-500 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600"
              }`}
            >
              <XCircle className="w-4 h-4" />
              {confirmClose ? "לחץ שוב — לאישור סגירה" : "סגור אירוע"}
            </Button>
          ) : (
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-400 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
              <CheckCircle className="w-4 h-4" />
              אירוע סגור
            </span>
          )}
        </div>

        <Button
          onClick={handleSave}
          className={`flex items-center gap-2 text-base font-bold px-8 h-11 transition-all shadow-sm ${
            saved
              ? "bg-green-500 hover:bg-green-600 text-white border-green-500"
              : "bg-pikud-orange hover:bg-pikud-orange-dark text-white border-pikud-orange"
          }`}
        >
          {saved
            ? <><Check className="w-5 h-5" /> נשמר!</>
            : <><Save className="w-5 h-5" /> שמור וחזור ללוח</>
          }
        </Button>
      </div>

    </div>
  );
}
