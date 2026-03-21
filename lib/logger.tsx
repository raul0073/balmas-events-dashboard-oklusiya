"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Plugah, PLUGAH_LABELS } from "@/types";

export type LogActionType =
  | "פתיחת אירוע"
  | "עדכון נתונים"
  | "סגירת אירוע"
  | "שינוי פלוגה";

export interface LogEntry {
  id: string;
  timestamp: string;
  action: LogActionType;
  eventId: string;
  eventAddress: string;
  plugah: Plugah | null;
  detail?: string;
}

interface LogContextType {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextType | null>(null);

function makeId() {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function LogProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("crisis-logs");
      if (stored) setLogs(JSON.parse(stored));
    } catch { setLogs([]); }
  }, []);

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    const full: LogEntry = { ...entry, id: makeId(), timestamp: new Date().toISOString() };
    setLogs((prev) => {
      const next = [full, ...prev];
      localStorage.setItem("crisis-logs", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem("crisis-logs");
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLogs() {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error("useLogs must be used within LogProvider");
  return ctx;
}

function plugahLabel(plugah: Plugah | null): string {
  if (!plugah) return "ללא פלוגה";
  return PLUGAH_LABELS[plugah as NonNullable<Plugah>];
}

function filterLabel(plugahFilter: Plugah | "all"): string {
  if (plugahFilter === "all" || plugahFilter === null) return "כל הפלוגות";
  return PLUGAH_LABELS[plugahFilter as NonNullable<Plugah>];
}

export function formatLogLine(entry: LogEntry): string {
  const time   = new Date(entry.timestamp).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date   = new Date(entry.timestamp).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
  const detail = entry.detail ? ` | ${entry.detail}` : "";
  return `${date} ${time} | ${entry.action} | ${entry.eventAddress} | ${plugahLabel(entry.plugah)}${detail}`;
}

export function exportLogsAsText(logs: LogEntry[], plugahFilter: Plugah | "all"): string {
  const filtered = plugahFilter === "all"
    ? logs
    : logs.filter((l) => l.plugah === plugahFilter);

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const header = [
    `יומן פעולות — פיקוד העורף`,
    `סינון: ${filterLabel(plugahFilter)}`,
    `יוצא: ${new Date().toLocaleString("he-IL")}`,
    `סה"כ רשומות: ${sorted.length}`,
    `${"─".repeat(60)}`,
    "",
  ].join("\n");

  return header + sorted.map(formatLogLine).join("\n");
}

export function exportLogsAsJson(logs: LogEntry[], plugahFilter: Plugah | "all"): string {
  const filtered = plugahFilter === "all"
    ? logs
    : logs.filter((l) => l.plugah === plugahFilter);

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    filter: plugahFilter === "all" ? "all" : plugahFilter,
    totalEntries: sorted.length,
    logs: sorted,
  }, null, 2);
}