"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEvents } from "@/lib/events-context";
import { useLogs } from "@/lib/logger";
import { generateId, now } from "@/lib/utils";
import { CrisisEvent, CRISIS_TYPES, INFRASTRUCTURE_GROUPS, INFRASTRUCTURE_LABELS, PLUGAH_KEYS, PLUGAH_LABELS, eventTitle, plugahLabel } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, NumberInput, Textarea } from "@/components/ui/primitives";
import { X, MapPin, AlertTriangle, Loader2, ArrowRight, ArrowLeft, Check, Tag, UserCog, Users } from "lucide-react";

interface Props { open: boolean; onClose: () => void; }

interface Draft {
  name: string;
  address: string;
  crisisType: CrisisEvent["crisisType"];
  infrastructureType: CrisisEvent["infrastructureType"];
  plugah: CrisisEvent["plugah"];
  commander: string;
  tzapi: number | null;
  hearot: string;
}

const EMPTY: Draft = {
  name: "", address: "", crisisType: null, infrastructureType: null,
  plugah: null, commander: "", tzapi: null, hearot: "",
};

const STEPS = [
  { n: 1, label: "פרטי האירוע" },
  { n: 2, label: "שיוך" },
];

/** Two-step wizard for opening an event with what the first call gives you. Numbers come later, inside the event. */
export default function CreateEventDialog({ open, onClose }: Props) {
  const router = useRouter();
  const { addEvent } = useEvents();
  const { addLog }   = useLogs();
  const [step, setStep]   = useState<1 | 2>(1);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1); setDraft(EMPTY); setError(""); setBusy(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setError("");
  }

  const hasIdentity = Boolean(draft.name.trim() || draft.address.trim());

  function next() {
    if (!hasIdentity) { setError("צריך שם אירוע או כתובת כדי לפתוח אירוע"); return; }
    setStep(2);
  }

  async function create() {
    if (!hasIdentity) { setStep(1); setError("צריך שם אירוע או כתובת כדי לפתוח אירוע"); return; }
    if (busy) return;
    const ts = now();
    const event: CrisisEvent = {
      id: generateId(),
      name: draft.name.trim(),
      address: draft.address.trim(),
      commander: draft.commander.trim(),
      crisisType: draft.crisisType,
      infrastructureType: draft.infrastructureType,
      plugah: draft.plugah,
      tzapi: draft.tzapi,
      anchor: null,
      lekudimGluyim: null, lekudimSmuim: null, hulitzu: null, meautarim: null, punu: null,
      hearot: draft.hearot.trim(),
      sourcesDone: [],
      createdAt: ts, updatedAt: ts, status: "active",
    };
    setBusy(true);
    try {
      await addEvent(event);
      const bits = [
        event.crisisType, event.infrastructureType ? INFRASTRUCTURE_LABELS[event.infrastructureType] : null,
        event.plugah ? plugahLabel(event.plugah) : null, event.commander ? `אחראי: ${event.commander}` : null,
      ].filter(Boolean).join(" · ");
      void addLog({ action: "פתיחת אירוע", eventId: event.id, eventAddress: eventTitle(event), plugah: event.plugah, detail: bits || undefined });
      onClose();
      router.push(`/events/${event.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שמירה נכשלה");
      setBusy(false);
    }
  }

  const summary = [
    draft.name.trim() && { icon: <Tag className="w-3.5 h-3.5" />, text: draft.name.trim() },
    draft.address.trim() && { icon: <MapPin className="w-3.5 h-3.5" />, text: draft.address.trim() },
    draft.crisisType && { icon: <AlertTriangle className="w-3.5 h-3.5" />, text: draft.crisisType },
    draft.infrastructureType && { icon: null, text: INFRASTRUCTURE_LABELS[draft.infrastructureType] },
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pikud-navy/60 backdrop-blur-sm px-4"
      role="dialog" aria-modal="true" aria-labelledby="create-event-title">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in max-h-[92vh] flex flex-col">

        <div className="bg-pikud-navy px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-pikud-orange rounded-lg p-2"><AlertTriangle className="w-5 h-5 text-white" /></div>
            <div>
              <h2 id="create-event-title" className="text-white font-bold text-lg">פתיחת אירוע חדש</h2>
              <p className="text-white/60 text-sm">מה שידוע מהקריאה הראשונה. השאר יתמלא בתוך האירוע.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="סגור" className="text-white/60 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* step indicator */}
        <ol className="flex items-center gap-2 px-6 py-3 bg-pikud-cream border-b border-pikud-gray-light shrink-0 text-sm" aria-label="שלבים">
          {STEPS.map((s, i) => {
            const state = s.n < step ? "done" : s.n === step ? "current" : "todo";
            return (
              <li key={s.n} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  state === "done" ? "bg-green-500 text-white" : state === "current" ? "bg-pikud-orange text-white" : "bg-pikud-gray-light text-pikud-gray-mid"
                }`}>{state === "done" ? <Check className="w-3.5 h-3.5" /> : s.n}</span>
                <span className={state === "current" ? "font-bold text-ink" : "text-pikud-gray-mid"}>{s.label}</span>
                {i < STEPS.length - 1 && <span className="w-8 h-px bg-pikud-gray-light mx-1" aria-hidden />}
              </li>
            );
          })}
        </ol>

        <div className="p-6 space-y-4 overflow-y-auto">
          {step === 1 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="ev-name" className="flex items-center gap-1"><Tag className="w-4 h-4 text-pikud-orange" /> שם האירוע</Label>
                <Input id="ev-name" value={draft.name} onChange={(e) => set("name", e.target.value)} autoFocus
                  placeholder="למשל: קריסה ברחוב הרצל" className="h-11 text-base"
                  onKeyDown={(e) => e.key === "Enter" && next()} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-address" className="flex items-center gap-1"><MapPin className="w-4 h-4 text-pikud-orange" /> כתובת</Label>
                <Input id="ev-address" value={draft.address} onChange={(e) => set("address", e.target.value)}
                  placeholder="רחוב, מספר, עיר" className="h-11 text-base"
                  onKeyDown={(e) => e.key === "Enter" && next()} />
                <p className="text-xs text-pikud-gray-mid">שם או כתובת — אחד מהם מספיק כדי לפתוח</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ev-type">סוג אירוע</Label>
                  <Select id="ev-type" value={draft.crisisType ?? ""} onChange={(e) => set("crisisType", (e.target.value || null) as Draft["crisisType"])} className="h-11">
                    <option value="">לא ידוע עדיין</option>
                    {CRISIS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-infra">תשתית</Label>
                  <Select id="ev-infra" value={draft.infrastructureType ?? ""} onChange={(e) => set("infrastructureType", (e.target.value || null) as Draft["infrastructureType"])} className="h-11">
                    <option value="">לא ידוע עדיין</option>
{INFRASTRUCTURE_GROUPS.map((g) => (
                      <optgroup key={g.label} label={g.label}>
                        {g.keys.map((k) => <option key={k} value={k}>{INFRASTRUCTURE_LABELS[k]}</option>)}
                      </optgroup>
                    ))}
                  </Select>
                </div>
              </div>
            </>
          ) : (
            <>
              {summary.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {summary.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs font-semibold bg-pikud-cream border border-pikud-gray-light text-ink px-2 py-1 rounded-full">
                      {s.icon}{s.text}
                    </span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ev-plugah">פלוגה</Label>
                  <Select id="ev-plugah" value={draft.plugah ?? ""} onChange={(e) => set("plugah", (e.target.value || null) as Draft["plugah"])} className="h-11" autoFocus>
                    <option value="">טרם שויך</option>
                    {PLUGAH_KEYS.map((k) => <option key={k} value={k}>{PLUGAH_LABELS[k]}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-commander" className="flex items-center gap-1"><UserCog className="w-4 h-4 text-pikud-orange" /> אחראי אירוע בגדוד</Label>
                  <Input id="ev-commander" value={draft.commander} onChange={(e) => set("commander", e.target.value)} placeholder="שם ותפקיד" className="h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-tzapi" className="flex items-center gap-1"><Users className="w-4 h-4 text-pikud-orange" /> צפי אנשים במקום</Label>
                <NumberInput id="ev-tzapi" value={draft.tzapi ?? ""} onChange={(e) => { const n = parseInt(e.target.value, 10); set("tzapi", isNaN(n) ? null : Math.max(0, n)); }}
                  placeholder="הערכה ראשונית" className="h-11 w-40" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-notes">הערות</Label>
                <Textarea id="ev-notes" value={draft.hearot} onChange={(e) => set("hearot", e.target.value)} rows={3} placeholder="מה נאמר בקריאה, מידע נוסף" />
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="text-red-600 text-sm flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 flex gap-3 shrink-0">
          {step === 1 ? (
            <>
              <Button variant="orange" className="flex-1 text-base font-bold h-11 flex items-center gap-2" onClick={next}>
                הבא <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="h-11" onClick={onClose}>ביטול</Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="h-11 flex items-center gap-2" onClick={() => setStep(1)} disabled={busy}>
                <ArrowRight className="w-4 h-4" /> חזרה
              </Button>
              <Button variant="orange" className="flex-1 text-base font-bold h-11 flex items-center gap-2" onClick={create} disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} פתח אירוע
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
