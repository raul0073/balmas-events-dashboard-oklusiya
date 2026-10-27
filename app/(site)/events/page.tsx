"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEvents } from "@/lib/events-context";
import { useLogs } from "@/lib/logger";
import { useBattalion } from "@/lib/session";
import EventCard from "@/components/EventCard";
import CreateEventDialog from "@/components/CreateEventDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import ImportLocalBanner from "@/components/ImportLocalBanner";
import ActivityPulse from "@/components/ActivityPulse";
import { Button } from "@/components/ui/button";
import { formatAllEventsForWhatsApp } from "@/lib/whatsapp";
import { anchorInfo, calcMissing, isMetaIncomplete } from "@/lib/events/math";
import { PLUGAH_KEYS, PLUGAH_LABELS, Plugah } from "@/types";
import { Plus, Copy, Check, AlertTriangle, Users, Activity, ArrowUpDown, Filter, ScrollText, Trash2, Loader2, EyeOff, Eye, LogOut } from "lucide-react";
import { FaUsersSlash, FaPeopleRoof } from "react-icons/fa6";

type SortKey = "time" | "missing" | "anchor" | "plugah";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "time",    label: "זמן פתיחה" },
  { key: "missing", label: "נעדרים" },
  { key: "anchor",  label: "עוגן" },
  { key: "plugah",  label: "פלוגה" },
];

export default function EventsBoard() {
  const router = useRouter();
  const battalion = useBattalion();
  const { events, loaded, error, clearAll } = useEvents();
  const { clearLogs } = useLogs();

  const [createOpen, setCreateOpen] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [filter, setFilter]         = useState<Plugah | "all">("all");
  const [sort, setSort]             = useState<SortKey>("time");
  const [showClosed, setShowClosed] = useState(false);
  const [showPulse, setShowPulse]   = useState(true);
  const [resetOpen, setResetOpen]   = useState(false);
  const [resetLogs, setResetLogs]   = useState(true);

  const activeEvents  = useMemo(() => events.filter((e) => e.status === "active"), [events]);
  const closedEvents  = useMemo(() => events.filter((e) => e.status === "closed"), [events]);
  const visibleEvents = showClosed ? events : activeEvents;

  const activePlugot = PLUGAH_KEYS.filter((p) => activeEvents.some((e) => e.plugah === p));

  const totalMissing     = activeEvents.reduce((s, e) => { const n = calcMissing(e); return s + (n !== null && n > 0 ? n : 0); }, 0);
  const totalTrapped     = activeEvents.reduce((s, e) => s + (e.lekudimGluyim ?? 0) + (e.lekudimSmuim ?? 0), 0);
  const totalPeople      = activeEvents.reduce((s, e) => s + (anchorInfo(e).value ?? 0), 0);
  const eventsWithAnchor = activeEvents.filter((e) => anchorInfo(e).value !== null).length;
  const assumedCount     = activeEvents.filter((e) => anchorInfo(e).assumed).length;
  const incompleteCount  = activeEvents.filter(isMetaIncomplete).length;
  const anchorErrorCount = activeEvents.filter((e) => { const n = calcMissing(e); return n !== null && n < 0; }).length;

  const filtered = useMemo(() => {
    const list = filter === "all" ? visibleEvents : visibleEvents.filter((e) => e.plugah === filter);
    return [...list].sort((a, b) => {
      switch (sort) {
        case "missing": return (calcMissing(b) ?? -1) - (calcMissing(a) ?? -1);
        case "anchor":  return (anchorInfo(b).value ?? -1) - (anchorInfo(a).value ?? -1);
        case "plugah":  return (a.plugah ?? "z").localeCompare(b.plugah ?? "z");
        case "time":
        default:        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [visibleEvents, filter, sort]);

  async function copyAll() {
    await navigator.clipboard.writeText(formatAllEventsForWhatsApp(events, `${battalion.name} | פיקוד העורף`));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleReset() {
    await clearAll();
    if (resetLogs) await clearLogs();
  }

  const pill = (active: boolean) =>
    `shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
      active ? "bg-pikud-navy text-white shadow-sm" : "bg-pikud-cream text-ink border border-pikud-gray-light hover:border-ink"
    }`;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-pikud-cream">

      {/* ── STATS BAR ── */}
      <div className="bg-pikud-navy-dark border-b border-white/10 shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center gap-5 overflow-x-auto scrollbar-hide select-none">
            <div className="flex items-center gap-2 shrink-0">
              <Activity className="w-4 h-4 text-pikud-orange" />
              <span className="text-white/60 text-sm">אירועים פעילים:</span>
              <span className="text-white font-bold text-sm">{activeEvents.length}</span>
            </div>
            {eventsWithAnchor > 0 && (
              <>
                <div className="w-px h-4 bg-white/20 shrink-0" />
                <div className="flex items-center gap-2 shrink-0">
                  <Users className="w-4 h-4 text-pikud-orange" />
                  <span className="text-white/60 text-sm">{`סה"כ אנשים (עוגן):`}</span>
                  <span className="text-white font-bold text-sm">{totalPeople}</span>
                </div>
              </>
            )}
            {totalMissing > 0 && (
              <>
                <div className="w-px h-4 bg-white/20 shrink-0" />
                <div className="flex items-center gap-2 shrink-0">
                  <FaUsersSlash className="w-4 h-4 text-red-400" />
                  <span className="text-white/60 text-sm">נעדרים:</span>
                  <span className="text-red-400 font-bold text-sm">{totalMissing}</span>
                </div>
              </>
            )}
            {totalTrapped > 0 && (
              <>
                <div className="w-px h-4 bg-white/20 shrink-0" />
                <div className="flex items-center gap-2 shrink-0">
                  <FaPeopleRoof className="w-4 h-4 text-amber-400" />
                  <span className="text-white/60 text-sm">לכודים:</span>
                  <span className="text-amber-400 font-bold text-sm">{totalTrapped}</span>
                </div>
              </>
            )}
            {assumedCount > 0 && (
              <>
                <div className="w-px h-4 bg-white/20 shrink-0" />
                <div className="flex items-center gap-2 shrink-0" title="אירועים שבהם העוגן משוער לפי צפי">
                  <AlertTriangle className="w-4 h-4 text-amber-300" />
                  <span className="text-amber-300 text-sm font-medium">{assumedCount} עוגן משוער</span>
                </div>
              </>
            )}
            {anchorErrorCount > 0 && (
              <>
                <div className="w-px h-4 bg-white/20 shrink-0" />
                <div className="flex items-center gap-2 shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm font-medium">{anchorErrorCount} סטיות עוגן</span>
                </div>
              </>
            )}
            {incompleteCount > 0 && (
              <>
                <div className="w-px h-4 bg-white/20 shrink-0" />
                <div className="flex items-center gap-2 shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-sm font-medium">{incompleteCount} דורשים השלמה</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ImportLocalBanner hasEvents={events.length > 0} />

      {/* ── TOOLBAR ── */}
      <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 flex-wrap bg-surface border-b border-pikud-gray-light">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-pikud-gray-mid" />

          {activePlugot.length > 1 && (
            <button onClick={() => setFilter("all")} className={pill(filter === "all")}>
              הכל ({activeEvents.length})
            </button>
          )}
          {activePlugot.map((p) => (
            <button key={p} onClick={() => setFilter(filter === p ? "all" : p)} className={pill(filter === p)}>
              {PLUGAH_LABELS[p]} ({activeEvents.filter((e) => e.plugah === p).length})
            </button>
          ))}

          <div className="flex items-center gap-1 border-r border-pikud-gray-light pr-3 mr-1 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-pikud-gray-mid" />
            {SORT_OPTIONS.map((o) => (
              <button key={o.key} onClick={() => setSort(o.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  sort === o.key ? "bg-pikud-orange text-white" : "text-pikud-gray-mid hover:text-ink"
                }`}>
                {o.label}
              </button>
            ))}
          </div>

          <button onClick={() => setShowClosed((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              showClosed ? "bg-gray-600 text-white border-gray-600" : "bg-surface text-pikud-gray-mid border-pikud-gray-light hover:border-gray-400"
            }`}>
            {showClosed ? "הסתר סגורים" : `הצג סגורים (${closedEvents.length})`}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} title="יציאה מהלוח לדף הראשי" className="flex items-center gap-1.5 text-pikud-gray-mid hover:text-ink">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">יציאה</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/events/logs")} className="flex items-center gap-1.5 text-ink">
            <ScrollText className="w-4 h-4" />
            <span className="hidden sm:inline">יומן</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setResetOpen(true)} disabled={events.length === 0}
            className="flex items-center gap-1.5 text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">אפס הכל</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={copyAll} disabled={activeEvents.length === 0} className="flex items-center gap-1.5">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? "הועתק!" : "סיכום לוואטסאפ"}</span>
          </Button>
          <Button variant="orange" onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            אירוע חדש
          </Button>
        </div>
      </div>

      {/* ── EVENTS GRID ── */}
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="m-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">טעינת האירועים נכשלה: {error}</div>
        ) : !loaded ? (
          <div className="flex items-center justify-center h-full text-pikud-gray-mid gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> טוען אירועים…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-ink/5 rounded-2xl p-12 max-w-sm mx-auto">
              <Activity className="w-12 h-12 text-pikud-gray-mid mx-auto mb-4" />
              <p className="text-ink font-semibold text-lg mb-2">אין אירועים פעילים</p>
              <p className="text-pikud-gray-mid text-sm mb-6">
                {filter === "all" ? "לחץ על 'אירוע חדש' כדי להתחיל" : "אין אירועים לפלוגה זו"}
              </p>
              {filter === "all" && (
                <Button variant="orange" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4 ml-1" />
                  פתח אירוע ראשון
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((event, i) => (
              <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ACTIVITY PULSE ── */}
      {events.length > 0 && (
        <div className="shrink-0 border-t border-pikud-gray-light bg-surface px-4 sm:px-6 py-2">
          {showPulse ? (
            <div className="flex items-start gap-2">
              <div className="flex-1"><ActivityPulse /></div>
              <button onClick={() => setShowPulse(false)} aria-label="הסתר דופק מבצעי" title="הסתר"
                className="p-1.5 rounded-md text-pikud-gray-mid hover:text-ink hover:bg-pikud-cream">
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowPulse(true)} className="flex items-center gap-1.5 text-xs text-pikud-gray-mid hover:text-ink">
              <Eye className="w-3.5 h-3.5" /> הצג דופק מבצעי
            </button>
          )}
        </div>
      )}

      <CreateEventDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        title="איפוס הלוח"
        description={`פעולה זו תמחק את כל האירועים של ${battalion.name} לצמיתות, מכל המסכים. לא ניתן לשחזר. האם אתה בטוח?`}
        confirmLabel="מחק הכל"
        cancelLabel="ביטול"
        checkbox={{ label: "מחק גם את יומן הפעולות", checked: resetLogs, onChange: setResetLogs }}
      />
    </div>
  );
}
