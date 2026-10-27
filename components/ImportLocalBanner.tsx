"use client";

import { useEffect, useMemo, useState } from "react";
import { DatabaseBackup, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useBattalion } from "@/lib/session";
import { useLogs } from "@/lib/logger";
import { Button } from "@/components/ui/button";

const EVENTS_KEY = "crisis-events";
const LOGS_KEY   = "crisis-logs";

/** Shape the pre-Supabase app stored in localStorage. */
interface LegacyEvent {
  id: string; address: string; crisisType: string | null; infrastructureType: string | null; plugah: string | null;
  tzapi: number | null; resheimEogen: number | null; lekudimSmuim: number | null; lekudimGluyim: number | null;
  hulitzu: number | null; meautarim: number | null; punu: number | null; hearot: string;
  createdAt: string; updatedAt: string; status: "active" | "closed";
}
interface LegacyLog {
  id: string; timestamp: string; action: string; eventId: string; eventAddress: string; plugah: string | null; detail?: string;
}

function readLegacy(): { events: LegacyEvent[]; logs: LegacyLog[] } {
  try {
    const events = JSON.parse(localStorage.getItem(EVENTS_KEY) ?? "[]") as LegacyEvent[];
    const logs   = JSON.parse(localStorage.getItem(LOGS_KEY) ?? "[]") as LegacyLog[];
    return { events: Array.isArray(events) ? events : [], logs: Array.isArray(logs) ? logs : [] };
  } catch {
    return { events: [], logs: [] };
  }
}

/**
 * One-time import of a board that an older version of this app left in this browser.
 * Shows only while the battalion still has no events of its own.
 */
export default function ImportLocalBanner({ hasEvents }: { hasEvents: boolean }) {
  const battalion = useBattalion();
  const { addLog } = useLogs();
  const supabase = useMemo(() => createClient(), []);
  const [legacy, setLegacy]       = useState<{ events: LegacyEvent[]; logs: LegacyLog[] } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => { setLegacy(readLegacy()); }, []);

  if (!legacy || legacy.events.length === 0 || hasEvents || dismissed) return null;

  async function runImport() {
    if (!legacy) return;
    setBusy(true); setError("");
    try {
      const idMap = new Map<string, string>();
      const rows = legacy.events.map((e) => {
        const id = crypto.randomUUID();
        idMap.set(e.id, id);
        return {
          id, battalion_id: battalion.id, name: "", address: e.address, commander: "",
          crisis_type: e.crisisType, infrastructure_type: e.infrastructureType, plugah: e.plugah,
          tzapi: e.tzapi, anchor: e.resheimEogen,
          lekudim_gluyim: e.lekudimGluyim, lekudim_smuim: e.lekudimSmuim,
          hulitzu: e.hulitzu, meautarim: e.meautarim, punu: e.punu,
          hearot: e.hearot ?? "", sources_done: [], status: e.status ?? "active",
          created_at: e.createdAt, updated_at: e.updatedAt,
        };
      });
      const { error: evErr } = await supabase.from("events").insert(rows);
      if (evErr) throw new Error(evErr.message);

      if (legacy.logs.length) {
        const logRows = legacy.logs.map((l) => ({
          id: crypto.randomUUID(), battalion_id: battalion.id,
          event_id: idMap.get(l.eventId) ?? null, event_address: l.eventAddress,
          action: l.action, plugah: l.plugah, detail: l.detail ?? null, created_at: l.timestamp,
        }));
        const { error: logErr } = await supabase.from("logs").insert(logRows);
        if (logErr) throw new Error(logErr.message);
      }

      await addLog({ action: "ייבוא נתונים", eventId: "", eventAddress: "לוח מקומי", plugah: null,
        detail: `${rows.length} אירועים ו-${legacy.logs.length} רשומות יומן יובאו מהדפדפן` });

      localStorage.removeItem(EVENTS_KEY);
      localStorage.removeItem(LOGS_KEY);
      setLegacy({ events: [], logs: [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "הייבוא נכשל");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center gap-3 flex-wrap">
      <DatabaseBackup className="w-4 h-4 text-amber-600 shrink-0" />
      <p className="text-sm text-amber-800 flex-1 min-w-[200px]">
        נמצא לוח ישן בדפדפן הזה: <strong>{legacy.events.length}</strong> אירועים
        {legacy.logs.length > 0 && <> ו-<strong>{legacy.logs.length}</strong> רשומות יומן</>}.
        לייבא אותם לחשבון {battalion.name}?
      </p>
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
      <Button size="sm" variant="orange" onClick={runImport} disabled={busy} className="flex items-center gap-1.5">
        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} ייבא
      </Button>
      <button onClick={() => setDismissed(true)} aria-label="סגור" className="text-amber-600 hover:text-amber-800">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
