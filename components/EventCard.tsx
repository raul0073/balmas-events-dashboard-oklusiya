"use client";

import { useRouter } from "next/navigation";
import { CrisisEvent, INFRASTRUCTURE_LABELS, eventTitle } from "@/types";
import { useBattalionSettings } from "@/lib/session";
import { plugahColorOf, plugahLabelOf } from "@/lib/battalion-settings";
import { anchorInfo, calcMissing, isMetaIncomplete } from "@/lib/events/math";
import { INFO_SOURCES } from "@/lib/events/sources";
import { MapPin, AlertTriangle, Clock, CheckCircle, Eye, EyeOff, Zap, UserCheck, Info, TruckIcon, UserCog, Radar } from "lucide-react";

interface Props { event: CrisisEvent; }

export default function EventCard({ event }: Props) {
  const router   = useRouter();
  const settings = useBattalionSettings();
  const color    = plugahColorOf(settings, event.plugah);

  const missing    = calcMissing(event);
  const anchor     = anchorInfo(event);
  const hasAnchor  = anchor.value !== null;
  const isFinale   = missing === 0;
  const isNegative = missing !== null && missing < 0;
  const hasIssue   = missing !== null && missing > 0;
  const isClosed   = event.status === "closed";
  const incompleteMeta = !isClosed && isMetaIncomplete(event);
  const sourcesDone  = (event.sourcesDone ?? []).filter((k) => INFO_SOURCES.some((s) => s.key === k)).length;
  const sourcesTotal = INFO_SOURCES.length;

  const stats = [
    event.lekudimGluyim ? { label: "גלויים",  value: event.lekudimGluyim, cls: "bg-red-100 text-red-700",       icon: <Eye className="w-3 h-3" /> } : null,
    event.lekudimSmuim  ? { label: "סמויים",  value: event.lekudimSmuim,  cls: "bg-orange-100 text-orange-700", icon: <EyeOff className="w-3 h-3" /> } : null,
    event.hulitzu       ? { label: "חולצו",   value: event.hulitzu,       cls: "bg-blue-100 text-blue-700",     icon: <Zap className="w-3 h-3" /> } : null,
    event.meautarim     ? { label: "מאותרים", value: event.meautarim,     cls: "bg-purple-100 text-purple-700", icon: <UserCheck className="w-3 h-3" /> } : null,
    event.punu          ? { label: "פונו",    value: event.punu,          cls: "bg-teal-100 text-teal-700",     icon: <TruckIcon className="w-3 h-3" /> } : null,
  ].filter(Boolean) as { label: string; value: number; cls: string; icon?: React.ReactNode }[];

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/events/${event.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/events/${event.id}`); } }}
      style={{ borderTopColor: color }}
      className={`rounded-lg shadow-sm border border-t-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-pikud-orange
        ${isClosed                              ? "bg-canvas border-line opacity-75" : ""}
        ${!isClosed && isFinale                 ? "bg-green-50 border-green-200"          : ""}
        ${!isClosed && isNegative               ? "bg-red-50 border-red-300"              : ""}
        ${!isClosed && !isFinale && !isNegative ? "bg-surface border-pikud-gray-light"      : ""}
      `}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        {event.plugah ? (
          <span style={{ backgroundColor: color }} className="text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {plugahLabelOf(settings, event.plugah)}
          </span>
        ) : (
          <span className="bg-pikud-gray-light text-pikud-gray-mid text-xs px-2.5 py-1 rounded-full">ללא פלוגה</span>
        )}
        <div className="flex items-center gap-2">
          {isClosed && (
            <span className="bg-line text-ink-soft text-xs font-bold px-2 py-0.5 rounded-full">סגור</span>
          )}
          <div className="flex items-center gap-1 text-pikud-gray-mid">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{new Date(event.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-2">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-pikud-orange mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-ink text-sm leading-snug block">{eventTitle(event)}</span>
            {event.name.trim() && event.address.trim() && (
              <span className="text-xs text-pikud-gray-mid leading-snug block">{event.address}</span>
            )}
          </div>
        </div>
        {!isClosed && (
          <div className="flex items-center gap-1.5 mt-1 mr-6 text-[11px]" title="מקורות מידע שמוצו">
            <Radar className={`w-3.5 h-3.5 ${sourcesDone === sourcesTotal ? "text-green-600" : "text-amber-600"}`} />
            <span className={sourcesDone === sourcesTotal ? "text-green-700 font-semibold" : "text-amber-700"}>מקורות {sourcesDone}/{sourcesTotal}</span>
          </div>
        )}
        {event.commander.trim() && (
          <div className="flex items-center gap-1.5 mt-1 mr-6 text-xs text-ink/70">
            <UserCog className="w-3.5 h-3.5 text-pikud-orange" /> {event.commander}
          </div>
        )}
        {(event.crisisType || event.infrastructureType) && (
          <div className="flex items-center gap-1.5 mt-1.5 mr-6">
            {event.crisisType && (
              <span className="bg-pikud-orange-pale text-pikud-orange-dark text-xs px-2 py-0.5 rounded font-medium">{event.crisisType}</span>
            )}
            {event.infrastructureType && (
              <span className="text-pikud-gray-mid text-xs">· {INFRASTRUCTURE_LABELS[event.infrastructureType]}</span>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-2 flex items-center gap-3">
        {hasAnchor && (
          <>
            <div className={`flex flex-col items-center rounded-lg px-3 py-1.5 min-w-[48px] shrink-0 ${anchor.assumed ? "bg-amber-50 border border-amber-300" : "bg-ink/5"}`}
              title={anchor.assumed ? "עוגן משוער לפי צפי, טרם הוזנה רשימת עוגן" : undefined}>
              <span className={`text-[10px] font-medium ${anchor.assumed ? "text-amber-700" : "text-pikud-gray-mid"}`}>{anchor.assumed ? "עוגן משוער" : "עוגן"}</span>
              <span className={`text-xl font-bold leading-tight ${anchor.assumed ? "text-amber-800" : "text-ink"}`}>{anchor.value}</span>
            </div>
            <div className="w-px h-8 bg-pikud-gray-light shrink-0" />
          </>
        )}

        {isFinale ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-7 h-7 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-700 leading-tight">אפס נעדרים</p>
              <p className="text-xs text-green-600">כולם ידועים ✓</p>
            </div>
          </div>
        ) : isNegative ? (
          <div className="flex flex-col items-center bg-red-100 border border-red-300 rounded-lg px-3 py-1.5 min-w-[48px] shrink-0">
            <span className="text-[10px] text-red-400 font-medium">שגיאה</span>
            <span className="text-xl font-bold text-red-600 leading-tight">{missing}</span>
          </div>
        ) : hasIssue ? (
          <div className="flex flex-col items-center bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 min-w-[48px] shrink-0">
            <span className="text-[10px] text-red-400 font-medium">נעדרים</span>
            <span className="text-xl font-bold text-red-600 leading-tight">{missing}</span>
          </div>
        ) : !hasAnchor ? (
          <span className="text-xs text-pikud-gray-mid italic">הזן עוגן לחישוב</span>
        ) : null}

        {stats.length > 0 && (
          <div className="flex flex-wrap gap-1 mr-auto">
            {stats.map((s) => (
              <div key={s.label} className={`flex items-center gap-0.5 ${s.cls} rounded px-1.5 py-0.5`}>
                {s.icon}
                <span className="text-xs font-semibold">{s.value}</span>
                <span className="text-[10px]">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isNegative && (
        <div className="mt-auto border-t border-red-300 bg-red-100 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span className="text-xs text-red-700 font-medium">סכום עולה על העוגן — בדוק נתונים</span>
        </div>
      )}

      {!isNegative && incompleteMeta && (
        <div className="mt-auto border-t border-amber-200 bg-amber-50 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700">
            חסר: {[!event.crisisType && "סוג", !event.infrastructureType && "תשתית", !event.plugah && "פלוגה"].filter(Boolean).join(", ")}
          </span>
        </div>
      )}

      {isFinale && (
        <div className="mt-auto border-t border-green-200 bg-green-100 px-4 py-2 flex items-center justify-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs text-green-700 font-bold">כל האנשים ידועים ✓</span>
        </div>
      )}

      {event.hearot && event.hearot.trim() && (
        <div className="border-t border-indigo-200 bg-indigo-50 px-4 py-2 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-600 mt-0.5" />
          <p className="text-xs text-indigo-800 font-medium leading-snug line-clamp-2">{event.hearot.trim()}</p>
        </div>
      )}
    </div>
  );
}
