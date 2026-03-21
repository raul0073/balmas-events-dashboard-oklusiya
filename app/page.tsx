"use client";

import { useState, useMemo } from "react";
import { useEvents } from "@/lib/events-context";
import EventCard from "@/components/EventCard";
import CreateEventDialog from "@/components/CreateEventDialog";
import { Button } from "@/components/ui/button";
import { formatAllEventsForWhatsApp } from "@/lib/whatsapp";
import { Plus, Copy, Check, AlertTriangle, Users, Activity, ArrowUpDown, Filter } from "lucide-react";
import { PLUGAH_LABELS, Plugah } from "@/types";
import { FaUsersSlash } from "react-icons/fa6";
import { FaPeopleRoof } from "react-icons/fa6";

type SortKey = "time" | "nedarim" | "anchor" | "plugah";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "time",    label: "זמן פתיחה" },
  { key: "nedarim", label: "נעדרים" },
  { key: "anchor",  label: "עוגן" },
  { key: "plugah",  label: "פלוגה" },
];

export default function DashboardPage() {
  const { events } = useEvents();
  const [createOpen, setCreateOpen] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [filter, setFilter]         = useState<Plugah | "all">("all");
  const [sort, setSort]             = useState<SortKey>("time");
  const [showClosed, setShowClosed] = useState(false);

  const activeEvents  = events.filter((e) => e.status === "active");
  const closedEvents  = events.filter((e) => e.status === "closed");
  const visibleEvents = showClosed ? events : activeEvents;

  // Anchor calculation helper
  const calcNedarim = (e: any): number | null =>
    e.resheimEogen === null ? null :
    e.resheimEogen - (e.lekudimGluyim ?? 0) - (e.lekudimSmuim ?? 0) -
    (e.hulitzu ?? 0) - (e.meautarim ?? 0) - (e.punu ?? 0);

  // Plugot that actually have active events — drives both stats bar and filter pills
  const activePlogot = (["alef", "bet", "gimel", "other"] as NonNullable<Plugah>[])
    .filter((p) => activeEvents.some((e) => e.plugah === p));

  // Per-plugah stats for the stats bar
  const plugahStats = activePlogot.map((p) => {
    const evts    = activeEvents.filter((e) => e.plugah === p);
    const missing = evts.reduce((s, e) => { const n = calcNedarim(e); return s + (n !== null && n > 0 ? n : 0); }, 0);
    const people  = evts.reduce((s, e) => s + (e.resheimEogen ?? 0), 0);
    return { plugah: p, count: evts.length, missing, people };
  });

  // Stats
  const totalMissing     = activeEvents.reduce((s, e) => { const n = calcNedarim(e); return s + (n !== null && n > 0 ? n : 0); }, 0);
  const totalTrapped     = activeEvents.reduce((s, e) => s + (e.lekudimGluyim ?? 0) + (e.lekudimSmuim ?? 0), 0);
  const totalPeople      = activeEvents.reduce((s, e) => s + (e.resheimEogen ?? 0), 0);
  const eventsWithAnchor = activeEvents.filter((e) => e.resheimEogen !== null).length;
  const incompleteCount  = activeEvents.filter((e) => !e.crisisType || !e.infrastructureType || !e.plugah).length;
  const anchorErrorCount = activeEvents.filter((e) => {
    if (!e.resheimEogen) return false;
    const n = calcNedarim(e);
    return n !== null && n < 0;
  }).length;

  const filtered = useMemo(() => {
    let list = filter === "all" ? visibleEvents : visibleEvents.filter((e) => e.plugah === filter);
    return [...list].sort((a, b) => {
      switch (sort) {
        case "nedarim": return ((calcNedarim(b) ?? -1)) - ((calcNedarim(a) ?? -1));
        case "anchor":  return (b.resheimEogen ?? -1) - (a.resheimEogen ?? -1);
        case "plugah":  return (a.plugah ?? "z").localeCompare(b.plugah ?? "z");
        case "time":
        default:        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [events, filter, sort, showClosed]);

  async function copyAll() {
    await navigator.clipboard.writeText(formatAllEventsForWhatsApp(events));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

      {/* ── TOOLBAR ── */}
      <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 flex-wrap bg-white border-b border-pikud-gray-light">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-pikud-gray-mid" />

          {activePlogot.length > 1 && (
            <button
              onClick={() => setFilter("all")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === "all"
                  ? "bg-pikud-navy text-white shadow-sm"
                  : "bg-pikud-cream text-pikud-navy border border-pikud-gray-light hover:border-pikud-navy"
              }`}
            >
              הכל ({activeEvents.length})
            </button>
          )}

          {activePlogot.map((p) => {
            const count = activeEvents.filter((e) => e.plugah === p).length;
            return (
              <button
                key={p}
                onClick={() => setFilter(filter === p ? "all" : p)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === p
                    ? "bg-pikud-navy text-white shadow-sm"
                    : "bg-pikud-cream text-pikud-navy border border-pikud-gray-light hover:border-pikud-navy"
                }`}
              >
                {PLUGAH_LABELS[p]} ({count})
              </button>
            );
          })}

          {/* Sort toggle */}
          <div className="flex items-center gap-1 border-r border-pikud-gray-light pr-3 mr-1 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-pikud-gray-mid" />
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => setSort(o.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  sort === o.key
                    ? "bg-pikud-orange text-white"
                    : "text-pikud-gray-mid hover:text-pikud-navy"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowClosed(v => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              showClosed
                ? "bg-gray-600 text-white border-gray-600"
                : "bg-white text-pikud-gray-mid border-pikud-gray-light hover:border-gray-400"
            }`}
          >
            {showClosed ? "הסתר סגורים" : `הצג סגורים (${closedEvents.length})`}
          </button>
        </div>

        <div className="flex items-center gap-2">
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
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-pikud-navy/5 rounded-2xl p-12 max-w-sm mx-auto">
              <Activity className="w-12 h-12 text-pikud-gray-mid mx-auto mb-4" />
              <p className="text-pikud-navy font-semibold text-lg mb-2">אין אירועים פעילים</p>
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
              <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateEventDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
