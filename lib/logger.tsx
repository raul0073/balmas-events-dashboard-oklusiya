"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Plugah, PLUGAH_LABELS, plugahLabel } from "@/types";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useSession } from "@/lib/session";
import { logToRow, rowToLog, type LogRow } from "@/lib/events/db";
import { formatProvenance } from "@/lib/events/provenance";

export type LogActionType =
  | "פתיחת אירוע"
  | "עדכון נתונים"
  | "סגירת אירוע"
  | "שינוי פלוגה"
  | "ייבוא נתונים";

export interface LogEntry {
  id: string;
  timestamp: string;
  action: LogActionType;
  eventId: string;
  eventAddress: string;
  plugah: Plugah | null;
  detail?: string;
  /** who gave the information */
  reportedBy?: string;
  /** how it reached the HAMAL (lib/events/provenance.ts) */
  channel?: string;
  /** why the data changed */
  reason?: string;
}

interface LogContextType {
  logs: LogEntry[];
  loaded: boolean;
  addLog: (entry: Omit<LogEntry, "id" | "timestamp">) => Promise<void>;
  clearLogs: () => Promise<void>;
}

const LogContext = createContext<LogContextType | null>(null);

export function LogProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const battalionId = session?.battalion?.id ?? null;
  const supabase = useMemo(() => createClient(), []);

  const [logs, setLogs]     = useState<LogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!battalionId) { setLoaded(true); return; }
    let cancelled = false;

    supabase
      .from("logs")
      .select("*")
      .eq("battalion_id", battalionId)
      .order("created_at", { ascending: false })
      .limit(2000)
      .then(({ data }) => {
        if (cancelled) return;
        if (data) setLogs((data as LogRow[]).map(rowToLog));
        setLoaded(true);
      });

    const channel = supabase
      .channel(`logs:${battalionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logs", filter: `battalion_id=eq.${battalionId}` },
        (payload: RealtimePostgresChangesPayload<LogRow>) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as Partial<LogRow>).id;
            if (id) setLogs((prev) => prev.filter((l) => l.id !== id));
          } else if (payload.eventType === "INSERT") {
            const entry = rowToLog(payload.new as LogRow);
            setLogs((prev) => (prev.some((l) => l.id === entry.id) ? prev : [entry, ...prev]));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, battalionId]);

  const addLog = useCallback(async (entry: Omit<LogEntry, "id" | "timestamp">) => {
    if (!battalionId) return;
    const full: LogEntry = { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setLogs((prev) => [full, ...prev]);
    await supabase.from("logs").insert(logToRow(full, battalionId));
  }, [supabase, battalionId]);

  const clearLogs = useCallback(async () => {
    if (!battalionId) return;
    setLogs([]);
    await supabase.from("logs").delete().eq("battalion_id", battalionId);
  }, [supabase, battalionId]);

  return (
    <LogContext.Provider value={{ logs, loaded, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLogs() {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error("useLogs must be used within LogProvider");
  return ctx;
}

function filterLabel(plugahFilter: Plugah | "all"): string {
  if (plugahFilter === "all" || plugahFilter === null) return "כל הפלוגות";
  return PLUGAH_LABELS[plugahFilter];
}

export function formatLogLine(entry: LogEntry): string {
  const time   = new Date(entry.timestamp).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date   = new Date(entry.timestamp).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
  const detail = entry.detail ? ` | ${entry.detail}` : "";
  const prov   = formatProvenance(entry);
  return `${date} ${time} | ${entry.action} | ${entry.eventAddress} | ${plugahLabel(entry.plugah)}${detail}${prov ? ` | ${prov}` : ""}`;
}

function filterAndSort(logs: LogEntry[], plugahFilter: Plugah | "all"): LogEntry[] {
  const filtered = plugahFilter === "all" ? logs : logs.filter((l) => l.plugah === plugahFilter);
  return [...filtered].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function exportLogsAsText(logs: LogEntry[], plugahFilter: Plugah | "all", battalionName = "פיקוד העורף"): string {
  const sorted = filterAndSort(logs, plugahFilter);
  const header = [
    `יומן פעולות — ${battalionName}`,
    `סינון: ${filterLabel(plugahFilter)}`,
    `יוצא: ${new Date().toLocaleString("he-IL")}`,
    `סה"כ רשומות: ${sorted.length}`,
    `${"─".repeat(60)}`,
    "",
  ].join("\n");
  return header + sorted.map(formatLogLine).join("\n");
}

export function exportLogsAsJson(logs: LogEntry[], plugahFilter: Plugah | "all"): string {
  const sorted = filterAndSort(logs, plugahFilter);
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    filter: plugahFilter === "all" ? "all" : plugahFilter,
    totalEntries: sorted.length,
    logs: sorted,
  }, null, 2);
}
