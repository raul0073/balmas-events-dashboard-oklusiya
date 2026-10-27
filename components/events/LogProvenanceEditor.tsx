"use client";

import { useState } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/primitives";
import { CHANNELS, formatProvenance, type Channel } from "@/lib/events/provenance";
import { useLogs, type LogEntry } from "@/lib/logger";

/** Shows an entry's who/how/why as a pill, with inline editing. */
export default function LogProvenanceEditor({ entry }: { entry: LogEntry }) {
  const { updateLogProvenance } = useLogs();
  const [editing, setEditing]   = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");
  const [reportedBy, setReportedBy] = useState(entry.reportedBy ?? "");
  const [channel, setChannel]       = useState<Channel | null>((entry.channel as Channel) ?? null);
  const [reason, setReason]         = useState(entry.reason ?? "");

  function open() {
    setReportedBy(entry.reportedBy ?? "");
    setChannel((entry.channel as Channel) ?? null);
    setReason(entry.reason ?? "");
    setError("");
    setEditing(true);
  }

  async function save() {
    setBusy(true); setError("");
    try {
      await updateLogProvenance(entry.id, { reportedBy, channel: channel ?? undefined, reason });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "השמירה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    const text = formatProvenance(entry);
    return (
      <button type="button" onClick={open} title="ערוך מקור העדכון"
        className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2 py-0.5 border transition-colors ${
          text ? "text-ink bg-pikud-cream border-pikud-gray-light hover:border-ink"
               : "text-pikud-gray-mid bg-surface border-dashed border-pikud-gray-light hover:text-ink hover:border-ink"
        }`}>
        <Pencil className="w-3 h-3" /> {text || "הוסף מקור עדכון"}
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-pikud-gray-light bg-pikud-cream/60 p-2.5 space-y-2" onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}>
      <div className="flex items-center gap-2 flex-wrap">
        <label className="flex items-center gap-1 text-[11px] text-ink-soft">
          <span className="shrink-0">מסר</span>
          <Input value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} placeholder="שם ותפקיד" autoFocus className="h-7 text-xs w-40 bg-surface" />
        </label>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="איך התקבל">
          {CHANNELS.map((c) => {
            const active = channel === c.value;
            return (
              <button key={c.value} type="button" role="radio" aria-checked={active}
                onClick={() => setChannel(active ? null : c.value)}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  active ? "bg-pikud-navy text-white border-ink" : "bg-surface text-ink border-pikud-gray-light hover:border-ink"
                }`}>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-[11px] text-ink-soft flex-1">
          <span className="shrink-0">סיבה</span>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="לא חובה" className="h-7 text-xs bg-surface" />
        </label>
        <button type="button" onClick={save} disabled={busy} aria-label="שמור"
          className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-pikud-navy text-white hover:bg-pikud-navy-dark disabled:opacity-50">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button type="button" onClick={() => setEditing(false)} aria-label="ביטול"
          className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-pikud-gray-light text-pikud-gray-mid hover:text-ink">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
