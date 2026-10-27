"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLogs, exportLogsAsText, exportLogsAsJson, LogActionType } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { PLUGAH_KEYS, PLUGAH_LABELS, Plugah } from "@/types";
import { useBattalion } from "@/lib/session";
import { ArrowRight, Download, Trash2, ScrollText, Filter } from "lucide-react";

const ACTION_COLORS: Record<LogActionType, string> = {
  "פתיחת אירוע":  "bg-blue-100 text-blue-800",
  "עדכון נתונים": "bg-amber-100 text-amber-800",
  "סגירת אירוע":  "bg-gray-100 text-gray-700",
  "שינוי פלוגה":  "bg-purple-100 text-purple-800",
  "ייבוא נתונים": "bg-teal-100 text-teal-800",
};

const plugahFilters: (Plugah | "all")[] = ["all", ...PLUGAH_KEYS];

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function LogsPage() {
  const router = useRouter();
  const { logs, loaded, clearLogs } = useLogs();
  const battalion = useBattalion();

  const [plugahFilter, setPlugahFilter] = useState<Plugah | "all">("all");
  const [actionFilter, setActionFilter] = useState<LogActionType | "all">("all");
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    let list = plugahFilter === "all" ? logs : logs.filter((l) => l.plugah === plugahFilter);
    if (actionFilter !== "all") list = list.filter((l) => l.action === actionFilter);
    return [...list].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [logs, plugahFilter, actionFilter]);

  function handleExportTxt() {
    const content = exportLogsAsText(logs, plugahFilter, battalion.name);
    const label   = plugahFilter === "all" || plugahFilter === null
      ? "כל-הפלוגות"
      : PLUGAH_LABELS[plugahFilter as NonNullable<Plugah>].replace(" ", "-");
    const date    = new Date().toLocaleDateString("he-IL").replace(/\./g, "-");
    downloadFile(content, `יומן-${label}-${date}.txt`, "text/plain;charset=utf-8");
  }

  function handleExportJson() {
    const content = exportLogsAsJson(logs, plugahFilter);
    const label   = plugahFilter === "all" || plugahFilter === null ? "all" : String(plugahFilter);
    downloadFile(content, `logs-${label}-${Date.now()}.json`, "application/json");
  }

  function handleClear() {
    if (confirmClear) { clearLogs(); setConfirmClear(false); }
    else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); }
  }

  const actionTypes: (LogActionType | "all")[] = [
    "all", "פתיחת אירוע", "עדכון נתונים", "סגירת אירוע", "שינוי פלוגה", "ייבוא נתונים"
  ];

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-pikud-cream">

      {/* ── TOP BAR ── */}
      <div className="bg-pikud-navy shrink-0">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/events")} className="text-white/60 hover:text-white transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-pikud-orange" />
              <div>
                <h1 className="text-white font-bold text-base">יומן פעולות</h1>
                <p className="text-white/50 text-xs">{logs.length} {`רשומות סה"כ`}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportTxt}
              className="flex items-center gap-1.5 text-sm font-semibold">
              <Download className="w-4 h-4" /> TXT
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportJson}
              className="flex items-center gap-1.5 text-sm font-semibold">
              <Download className="w-4 h-4" /> JSON
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear}
              className={`flex items-center gap-1.5 text-sm ${confirmClear ? "text-red-600 bg-red-50" : "text-white/50 hover:text-white"}`}>
              <Trash2 className="w-4 h-4" />
              {confirmClear ? "לחץ שוב לאיפוס" : "נקה יומן"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="shrink-0 bg-white border-b border-pikud-gray-light px-4 sm:px-6 py-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-pikud-gray-mid shrink-0" />
          <span className="text-sm font-semibold text-pikud-navy shrink-0">פלוגה:</span>
          {plugahFilters.map((f) => (
            <button key={String(f)} onClick={() => setPlugahFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                plugahFilter === f
                  ? "bg-pikud-navy text-white"
                  : "bg-pikud-cream text-pikud-navy border border-pikud-gray-light hover:border-pikud-navy"
              }`}>
              {f === "all" ? "הכל" : PLUGAH_LABELS[f as NonNullable<Plugah>]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-pikud-navy shrink-0 mr-5">פעולה:</span>
          {actionTypes.map((a) => (
            <button key={a} onClick={() => setActionFilter(a)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                actionFilter === a
                  ? "bg-pikud-orange text-white"
                  : "bg-pikud-cream text-pikud-navy border border-pikud-gray-light hover:border-pikud-orange"
              }`}>
              {a === "all" ? "כל הפעולות" : a}
            </button>
          ))}
        </div>
      </div>

      {/* ── LOG LIST ── */}
      <div className="flex-1 overflow-auto p-4 sm:p-5">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-white rounded-2xl p-12 max-w-sm mx-auto border border-pikud-gray-light">
              <ScrollText className="w-12 h-12 text-pikud-gray-mid mx-auto mb-4" />
              <p className="text-pikud-navy font-bold text-lg mb-2">אין רשומות</p>
              <p className="text-pikud-gray-mid text-sm">{loaded ? "הפעולות יירשמו אוטומטית" : "טוען…"}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-pikud-gray-light shadow-sm overflow-hidden">
            <div className="bg-pikud-cream border-b border-pikud-gray-light grid grid-cols-[120px_140px_1fr_1fr_1fr] px-4 py-2.5">
              <span className="text-sm font-bold text-pikud-navy uppercase tracking-wide">תאריך</span>
              <span className="text-sm font-bold text-pikud-navy uppercase tracking-wide">שעה</span>
              <span className="text-sm font-bold text-pikud-navy uppercase tracking-wide">פעולה</span>
              <span className="text-sm font-bold text-pikud-navy uppercase tracking-wide">אירוע</span>
              <span className="text-sm font-bold text-pikud-navy uppercase tracking-wide">פרטים</span>
            </div>

            {filtered.map((entry, i) => {
              const ts          = new Date(entry.timestamp);
              const date        = ts.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
              const time        = ts.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              const actionCls   = ACTION_COLORS[entry.action] ?? "bg-gray-100 text-gray-700";
              const plugahLabel = entry.plugah ? PLUGAH_LABELS[entry.plugah as NonNullable<Plugah>] : "ללא פלוגה";

              return (
                <div key={entry.id}
                  className={`grid grid-cols-[120px_140px_1fr_1fr_1fr] px-4 py-3 border-b border-pikud-gray-light/50 text-sm transition-colors hover:bg-pikud-cream/30
                    ${i % 2 === 0 ? "bg-white" : "bg-pikud-cream/10"}`}>
                  <span className="text-pikud-gray-mid font-medium">{date}</span>
                  <span className="text-pikud-navy font-bold tabular-nums">{time}</span>
                  <span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${actionCls}`}>
                      {entry.action}
                    </span>
                  </span>
                  <div>
                    <p className="text-pikud-navy font-semibold leading-tight truncate max-w-[200px]">{entry.eventAddress}</p>
                    <p className="text-pikud-gray-mid text-xs">{plugahLabel}</p>
                  </div>
                  <div className="text-xs text-pikud-gray-mid">
                    {entry.detail
                      ? entry.detail.split("\n").map((line, idx) => (
                          <p key={idx} className={idx === 0 ? "font-semibold text-pikud-navy" : "text-pikud-gray-mid"}>{line}</p>
                        ))
                      : <span>—</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      {filtered.length > 0 && (
        <div className="shrink-0 bg-white border-t border-pikud-gray-light px-6 py-2.5 flex items-center justify-between">
          <span className="text-sm text-pikud-gray-mid">
            מציג <strong className="text-pikud-navy">{filtered.length}</strong> רשומות מתוך {logs.length}
          </span>
          <span className="text-xs text-pikud-gray-mid">ממוין לפי זמן עולה</span>
        </div>
      )}
    </div>
  );
}