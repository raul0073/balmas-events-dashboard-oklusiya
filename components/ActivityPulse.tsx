"use client";

import { useMemo } from "react";
import { useLogs } from "@/lib/logger";
import { Activity } from "lucide-react";

interface Props {
  /** number of time buckets to show, default 24 */
  buckets?: number;
  /** width of each bucket in minutes, default 5 */
  bucketMinutes?: number;
  /** compact single-line mode for navbar/toolbar */
  compact?: boolean;
  className?: string;
}

export default function ActivityPulse({
  buckets = 24,
  bucketMinutes = 5,
  compact = false,
  className = "",
}: Props) {
  const { logs } = useLogs();
  
  const { bars, totalWindow, recentCount, lastActivity } = useMemo(() => {
    const now      = Date.now();
    const windowMs = buckets * bucketMinutes * 60 * 1000;
    const bucketMs = bucketMinutes * 60 * 1000;

    // Build buckets oldest → newest
    const counts = Array(buckets).fill(0) as number[];
    let recentCount = 0;

    for (const log of logs) {
      const age = now - new Date(log.timestamp).getTime();
      if (age < 0 || age > windowMs) continue;
      const idx = buckets - 1 - Math.floor(age / bucketMs);
      if (idx >= 0 && idx < buckets) {
        counts[idx]++;
        if (age < bucketMs * 2) recentCount++;
      }
    }

    const max = Math.max(...counts, 1);
    const bars = counts.map((c) => ({ count: c, height: Math.max(c / max, c > 0 ? 0.08 : 0) }));

    // Last activity
    const sorted = [...logs].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const lastTs = sorted[0]?.timestamp;
    let lastActivity = "אין פעילות";
    if (lastTs) {
      const diffMin = Math.floor((now - new Date(lastTs).getTime()) / 60000);
      if (diffMin < 1)       lastActivity = "עכשיו";
      else if (diffMin < 60) lastActivity = `לפני ${diffMin} דק'`;
      else                   lastActivity = `לפני ${Math.floor(diffMin / 60)} ש'`;
    }

    return { bars, totalWindow: windowMs / 60000, recentCount, lastActivity };
  }, [logs, buckets, bucketMinutes]);

  const isActive = recentCount > 0;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Pulse dot */}
        <span className={`relative flex h-2 w-2 shrink-0`}>
          {isActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? "bg-green-500" : "bg-gray-300"}`} />
        </span>

        {/* Mini sparkline */}
        <div className="flex items-end gap-px h-5">
          {bars.slice(-16).map((bar, i) => (
            <div
              key={i}
              className={`w-1 rounded-sm transition-all duration-500 ${
                bar.count > 0
                  ? i >= bars.slice(-16).length - 3
                    ? "bg-pikud-orange"
                    : "bg-pikud-navy/40"
                  : "bg-gray-200"
              }`}
              style={{ height: `${Math.max(bar.height * 100, 8)}%` }}
            />
          ))}
        </div>

        <span className="text-xs text-gray-400 whitespace-nowrap">{lastActivity}</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {isActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? "bg-green-500" : "bg-gray-300"}`} />
          </span>
          <span className="text-sm font-bold text-gray-700">דופק מבצעי</span>
        </div>
        <div className="flex items-center gap-3">
          {recentCount > 0 && (
            <span className="text-xs font-semibold text-pikud-orange bg-pikud-orange/10 px-2 py-0.5 rounded-full">
              {recentCount} עדכונים אחרונים
            </span>
          )}
          <span className="text-xs text-gray-400">{lastActivity}</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-0.5 h-12">
        {bars.map((bar, i) => {
          const isRecent = i >= buckets - 3;
          const isEmpty  = bar.count === 0;
          return (
            <div
              key={i}
              title={bar.count > 0 ? `${bar.count} פעולות` : ""}
              className={`flex-1 rounded-sm transition-all duration-500 cursor-default ${
                isEmpty
                  ? "bg-gray-100"
                  : isRecent
                  ? "bg-pikud-orange"
                  : "bg-pikud-navy/30 hover:bg-pikud-navy/50"
              }`}
              style={{ height: `${Math.max(bar.height * 100, isEmpty ? 15 : 10)}%` }}
            />
          );
        })}
      </div>

      {/* X axis labels */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-gray-300">{totalWindow} {`דק' אחרונות`}</span>
        <span className="text-[10px] text-gray-300">עכשיו</span>
      </div>
    </div>
  );
}
