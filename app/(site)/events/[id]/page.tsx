"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEvents } from "@/lib/events-context";
import { useLogs } from "@/lib/logger";
import { useBattalion, useBattalionSettings } from "@/lib/session";
import { CrisisEvent, CounterKey, INFRASTRUCTURE_GROUPS, INFRASTRUCTURE_LABELS, eventTitle } from "@/types";
import { plugahColorOf, plugahLabelOf, type ResolvedSettings } from "@/lib/battalion-settings";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/primitives";
import CounterCard from "@/components/events/CounterCard";
import InfoSources from "@/components/events/InfoSources";
import ProvenanceBar from "@/components/events/ProvenanceBar";
import { EMPTY_PROVENANCE, type Provenance } from "@/lib/events/provenance";
import { sourceLabel } from "@/lib/events/sources";
import { formatEventForWhatsApp } from "@/lib/whatsapp";
import { accountedFor, anchorInfo, calcMissing, isMetaIncomplete } from "@/lib/events/math";
import { now } from "@/lib/utils";
import {
  ArrowRight, Check, AlertTriangle, Save, Loader2,
  MapPin, Clock, Pencil, X, CheckCircle, MessageCircle, UserCog,
  PartyPopper, XCircle, ShieldAlert, Eye, EyeOff, Zap, UserCheck, Truck, Users, ListChecks, Sigma,
} from "lucide-react";

interface FieldDef { key: CounterKey; label: string; hint: string; icon: React.ReactNode; tone: string; }

const COUNTERS: FieldDef[] = [
  { key: "lekudimGluyim", label: "לכודים גלויים", hint: "נמצאו, טרם חולצו",    icon: <Eye className="w-4 h-4" />,       tone: "bg-red-100 text-red-700" },
  { key: "lekudimSmuim",  label: "לכודים סמויים", hint: "מוערכים, טרם אותרו",  icon: <EyeOff className="w-4 h-4" />,    tone: "bg-orange-100 text-orange-700" },
  { key: "hulitzu",       label: "חולצו",          hint: "חולצו מהשטח",         icon: <Zap className="w-4 h-4" />,       tone: "bg-blue-100 text-blue-700" },
  { key: "meautarim",     label: "מאותרים",        hint: "אותרו, בטיפול",       icon: <UserCheck className="w-4 h-4" />, tone: "bg-purple-100 text-purple-700" },
  { key: "punu",          label: "פונו",           hint: "פונו לאתר אחר",       icon: <Truck className="w-4 h-4" />,     tone: "bg-teal-100 text-teal-700" },
];

const FIELD_LABELS: Partial<Record<keyof CrisisEvent, string>> = {
  name: "שם האירוע", address: "כתובת", commander: "אחראי אירוע",
  anchor: "עוגן", tzapi: "צפי", lekudimGluyim: "לכודים גלויים",
  lekudimSmuim: "לכודים סמויים", hulitzu: "חולצו", meautarim: "מאותרים",
  punu: "פונו", hearot: "הערות", crisisType: "סוג אירוע", infrastructureType: "תשתית",
};

function translateValue(key: keyof CrisisEvent, val: unknown, settings: ResolvedSettings): string {
  if (val === null || val === undefined || val === "") return "ריק";
  if (key === "infrastructureType") return INFRASTRUCTURE_LABELS[val as keyof typeof INFRASTRUCTURE_LABELS] ?? String(val);
  if (key === "plugah") return plugahLabelOf(settings, String(val));
  return String(val);
}

function buildChangeSummary(prev: CrisisEvent, next: CrisisEvent, settings: ResolvedSettings): string {
  const changes: string[] = [];
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const k = key as keyof CrisisEvent;
    if (prev[k] !== next[k]) {
      changes.push(`ערך שהשתנה: ${label}\n${translateValue(k, prev[k], settings)} השתנה ל${translateValue(k, next[k], settings)}`);
    }
  }
  const prevS = prev.sourcesDone ?? [], nextS = next.sourcesDone ?? [];
  const marked   = nextS.filter((k) => !prevS.includes(k)).map(sourceLabel);
  const restored = prevS.filter((k) => !nextS.includes(k)).map(sourceLabel);
  if (marked.length)   changes.push(`מקורות מידע שמוצו: ${marked.join(", ")}`);
  if (restored.length) changes.push(`מקורות מידע שנפתחו מחדש: ${restored.join(", ")}`);
  return changes.join(" | ");
}

function parseNum(raw: string): number | null {
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : Math.max(0, n);
}

export default function EventPage() {
  const params    = useParams();
  const router    = useRouter();
  const battalion = useBattalion();
  const settings  = useBattalionSettings();
  const { getEvent, updateEvent, loaded } = useEvents();
  const { addLog } = useLogs();

  const [form, setForm]                 = useState<CrisisEvent | null>(null);
  const [metaOpen, setMetaOpen]         = useState(false);
  const [copied, setCopied]             = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [saveError, setSaveError]       = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [prov, setProv]                 = useState<Provenance>(EMPTY_PROVENANCE);
  const prevFormRef = useRef<CrisisEvent | null>(null);

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
  const anchor  = useMemo(() => (form ? anchorInfo(form) : { value: null, assumed: false }), [form]);

  if (!loaded || !form) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center text-pikud-gray-mid gap-2 bg-canvas">
        <Loader2 className="w-5 h-5 animate-spin" /> טוען אירוע…
      </div>
    );
  }

  function update<K extends keyof CrisisEvent>(key: K, value: CrisisEvent[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function persist(next: CrisisEvent, logs: Parameters<typeof addLog>[0][]) {
    setSaving(true); setSaveError("");
    const stamp = {
      reportedBy: (prov.reportedBy || next.commander).trim() || undefined,
      channel: prov.channel ?? undefined,
      reason: prov.reason.trim() || undefined,
    };
    try {
      await updateEvent(next);
      for (const l of logs) void addLog({ ...l, ...stamp });
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
        detail: `${plugahLabelOf(settings, prev.plugah, "ללא")} → ${plugahLabelOf(settings, updated.plugah, "ללא")}` });
    }
    const changeSummary = buildChangeSummary(prev, updated, settings);
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
    await navigator.clipboard.writeText(formatEventForWhatsApp(form, settings.whatsappHeader, (k, f) => plugahLabelOf(settings, k, f)));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const incompleteMeta = isMetaIncomplete(form);
  const color      = plugahColorOf(settings, form.plugah);
  const isFinale   = missing === 0;
  const isNegative = missing !== null && missing < 0;
  const isUrgent   = missing !== null && missing > 0;
  const isClosed   = form.status === "closed";
  const accounted  = accountedFor(form);

  const missingTone = missing === null
    ? "bg-surface border-line text-ink-faint"
    : isFinale ? "bg-green-600 border-green-700 text-white"
    : isNegative ? "bg-red-700 border-red-800 text-white"
    : "bg-red-600 border-red-700 text-white";

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-canvas">

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
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-pikud-orange shrink-0" />
                  <span className="font-bold text-white text-base truncate">{eventTitle(form)}</span>
                </div>
                {form.name.trim() && form.address.trim() && (
                  <span className="text-white/60 text-sm truncate">{form.address}</span>
                )}
                {isClosed && <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full font-bold">סגור</span>}
                {form.crisisType && (
                  <span className="bg-pikud-orange/15 text-pikud-orange-light text-xs px-2 py-0.5 rounded-md font-semibold border border-pikud-orange/20">{form.crisisType}</span>
                )}
                {form.plugah && (
                  <span style={{ backgroundColor: color }} className="text-white text-xs px-2 py-0.5 rounded-md font-semibold">{plugahLabelOf(settings, form.plugah)}</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {form.infrastructureType && <span className="text-white/50 text-xs">{INFRASTRUCTURE_LABELS[form.infrastructureType]}</span>}
                {form.commander.trim() && (
                  <span className="flex items-center gap-1 text-white/70 text-xs"><UserCog className="w-3 h-3 text-pikud-orange" /> {form.commander}</span>
                )}
                <span className="flex items-center gap-1 text-white/50 text-xs">
                  <Clock className="w-3 h-3" />
                  {new Date(form.createdAt).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
                {incompleteMeta && !isClosed && (
                  <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold"><AlertTriangle className="w-3 h-3" /> נדרשת השלמה</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setMetaOpen((v) => !v)} title="ערוך פרטי אירוע" aria-expanded={metaOpen}
              className={`p-2 rounded-lg transition-all text-sm font-semibold flex items-center gap-1.5 border ${
                metaOpen ? "bg-surface text-ink border-white" : "text-white/80 border-white/30 hover:bg-white/10 hover:text-white"
              }`}>
              {metaOpen ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs">{metaOpen ? "סגור עריכה" : "ערוך פרטי אירוע"}</span>
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
              <Label htmlFor="name" className="text-xs font-semibold text-ink-soft">שם האירוע</Label>
              <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="לא חובה" className="h-9 text-sm bg-surface" />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="address" className="text-xs font-semibold text-ink-soft">כתובת</Label>
              <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="שם או כתובת, אחד חובה" className="h-9 text-sm bg-surface" />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="commander" className="text-xs font-semibold text-ink-soft">אחראי אירוע בגדוד</Label>
              <Input id="commander" value={form.commander} onChange={(e) => update("commander", e.target.value)} placeholder="שם ותפקיד" className="h-9 text-sm bg-surface" />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="crisisType" className="text-xs font-semibold text-ink-soft flex gap-1">סוג אירוע {!form.crisisType && <span className="text-amber-600">*</span>}</Label>
              <Select id="crisisType" value={form.crisisType ?? ""} onChange={(e) => update("crisisType", (e.target.value || null) as CrisisEvent["crisisType"])} className="h-9 text-sm bg-surface">
                <option value="">-- בחר --</option>
                {(form.crisisType && !settings.crisisTypes.includes(form.crisisType) ? [form.crisisType, ...settings.crisisTypes] : settings.crisisTypes).map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="infra" className="text-xs font-semibold text-ink-soft flex gap-1">תשתית {!form.infrastructureType && <span className="text-amber-600">*</span>}</Label>
              <Select id="infra" value={form.infrastructureType ?? ""} onChange={(e) => update("infrastructureType", (e.target.value || null) as CrisisEvent["infrastructureType"])} className="h-9 text-sm bg-surface">
                <option value="">-- בחר --</option>
                {INFRASTRUCTURE_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.keys.map((k) => <option key={k} value={k}>{INFRASTRUCTURE_LABELS[k]}</option>)}
                  </optgroup>
                ))}
              </Select>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="plugah" className="text-xs font-semibold text-ink-soft flex gap-1">פלוגה {!form.plugah && <span className="text-amber-600">*</span>}</Label>
              <Select id="plugah" value={form.plugah ?? ""} onChange={(e) => update("plugah", (e.target.value || null) as CrisisEvent["plugah"])} className="h-9 text-sm bg-surface">
                <option value="">-- בחר --</option>
                {settings.plugot.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                {form.plugah && !settings.plugot.some((p) => p.key === form.plugah) && <option value={form.plugah}>{form.plugah}</option>}
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* ── BANNERS ── */}
      {isFinale && !isClosed && (
        <div className="shrink-0 bg-green-500 px-6 py-2 flex items-center justify-center gap-2 text-white font-bold text-sm">
          <PartyPopper className="w-4 h-4" /> נעדרים: 0 — כל האנשים ידועים! מוכן לסגירה <PartyPopper className="w-4 h-4" />
        </div>
      )}
      {isNegative && (
        <div className="shrink-0 bg-red-600 px-6 py-2 flex items-center justify-center gap-2 text-white font-bold text-sm">
          <ShieldAlert className="w-4 h-4" /> שגיאה: הסכום ({accounted}) עולה על העוגן ({anchor.value})
        </div>
      )}
      {anchor.assumed && !isClosed && (
        <div role="alert" className="shrink-0 bg-amber-100 border-b border-amber-300 px-4 sm:px-6 py-2 flex items-center gap-2 text-amber-900 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span><strong>רשימת עוגן טרם הוזנה.</strong> החישוב מניח עוגן לפי הצפי ({anchor.value}). הזן עוגן כשהרשימה תתקבל.</span>
        </div>
      )}

      {/* ── BODY ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

        {/* information sources reminder, collapsed by default */}
        <InfoSources done={form.sourcesDone ?? []} onChange={(next) => update("sourcesDone", next)} readOnly={isClosed} />

        {/* status tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={`rounded-2xl border-2 p-4 flex flex-col justify-between min-h-[136px] col-span-2 lg:col-span-1 lg:row-span-2 ${missingTone}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest opacity-90">נעדרים</span>
              {isUrgent && <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full animate-pulse">דחוף</span>}
              {isFinale && <CheckCircle className="w-5 h-5" />}
            </div>
            <span className="font-black leading-none text-6xl lg:text-7xl tabular-nums">{missing === null ? "?" : missing}</span>
            <span className="text-xs opacity-90">
              {missing === null ? "הזן עוגן או צפי לחישוב" : isFinale ? "כולם ידועים" : isNegative ? "סכום מעל העוגן, בדוק נתונים" : anchor.assumed ? "לפי עוגן משוער" : "עוגן − מסוכם"}
            </span>
          </div>

          <div className={`rounded-2xl border p-4 flex flex-col gap-1 bg-surface ${anchor.assumed ? "border-amber-300" : "border-line"}`}>
            <div className="flex items-center justify-between">
              <Label htmlFor="anchor" className="text-xs font-bold text-ink-muted flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" /> רשימת עוגן</Label>
              {anchor.assumed && <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">משוער לפי צפי</span>}
            </div>
            <input id="anchor" type="number" min={0} inputMode="numeric"
              value={form.anchor ?? ""}
              placeholder={anchor.assumed ? String(anchor.value) : "—"}
              onChange={(e) => update("anchor", parseNum(e.target.value))}
              className={`w-full h-12 text-3xl font-black rounded-xl border px-3 focus:outline-none focus:ring-2 focus:ring-pikud-navy focus:border-transparent
                ${form.anchor !== null ? "text-ink border-pikud-navy/30" : anchor.assumed ? "text-amber-700/60 placeholder:text-amber-700/50 border-amber-200 bg-amber-50/40" : "text-ink-faint border-line"}`} />
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 flex flex-col gap-1">
            <Label htmlFor="tzapi" className="text-xs font-bold text-ink-muted flex items-center gap-1"><Users className="w-3.5 h-3.5" /> צפי אנשים במקום</Label>
            <input id="tzapi" type="number" min={0} inputMode="numeric"
              value={form.tzapi ?? ""} placeholder="—"
              onChange={(e) => update("tzapi", parseNum(e.target.value))}
              className={`w-full h-12 text-3xl font-black rounded-xl border px-3 focus:outline-none focus:ring-2 focus:ring-pikud-navy focus:border-transparent
                ${form.tzapi !== null ? "text-ink border-pikud-navy/30" : "text-ink-faint border-line"}`} />
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 flex flex-col gap-1 col-span-2 lg:col-span-2">
            <span className="text-xs font-bold text-ink-muted flex items-center gap-1"><Sigma className="w-3.5 h-3.5" /> מסוכם (חמשת המונים)</span>
            <div className="flex items-end justify-between gap-3">
              <span className="text-3xl font-black text-ink tabular-nums">{accounted}</span>
              <span className="text-xs text-ink-muted text-left leading-tight">
                {anchor.value !== null ? `${anchor.value} עוגן${anchor.assumed ? " (משוער)" : ""} − ${accounted} מסוכם` : "ללא עוגן אין חישוב"}
              </span>
            </div>
          </div>
        </div>

        {/* counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {COUNTERS.map((c) => (
            <CounterCard key={c.key} id={c.key} label={c.label} hint={c.hint} icon={c.icon} tone={c.tone}
              value={form[c.key]} onChange={(v) => update(c.key, v)} />
          ))}
        </div>

        {/* notes */}
        <div className="rounded-2xl border border-line bg-surface overflow-hidden">
          <div className="px-4 py-2 border-b border-line">
            <Label htmlFor="hearot" className="text-xs font-bold text-ink-muted">הערות</Label>
          </div>
          <textarea id="hearot" rows={3}
            value={form.hearot}
            onChange={(e) => update("hearot", e.target.value)}
            placeholder="הערות שדה, מידע נוסף..."
            className="w-full px-4 py-3 resize-y text-sm text-ink-soft placeholder:text-ink-faint focus:outline-none bg-transparent min-h-[80px]"
          />
        </div>
      </div>

      {/* ── UPDATE PROVENANCE ── */}
      <ProvenanceBar value={prov} onChange={setProv} defaultReporter={form.commander} disabled={isClosed} />

      {/* ── STICKY BOTTOM BAR ── */}
      <div className="shrink-0 bg-surface border-t border-line px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          {!isClosed ? (
            <Button onClick={handleClose} disabled={saving}
              className={`flex items-center gap-2 h-10 text-sm font-semibold transition-all ${
                confirmClose ? "bg-red-600 text-white border-red-600 shadow-md" : "bg-surface text-red-500 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600"
              }`}>
              <XCircle className="w-4 h-4" />
              {confirmClose ? "לחץ שוב — לאישור סגירה" : "סגור אירוע"}
            </Button>
          ) : (
            <span className="flex items-center gap-2 text-sm font-semibold text-ink-muted bg-surface-2 px-4 py-2 rounded-lg border border-line">
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
