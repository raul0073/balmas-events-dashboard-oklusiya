"use client";

import { useMemo, useRef, useState } from "react";
import { useLogs } from "@/lib/logger";

interface Props {
  /** number of time buckets, default 24 */
  buckets?: number;
  /** width of each bucket in minutes, default 5 */
  bucketMinutes?: number;
  className?: string;
}

const W = 600;   // viewBox units; the svg stretches to its container
const H = 72;
const PAD_X = 6;
const PAD_TOP = 14;
const PAD_BOTTOM = 6;

/** How often updates arrive: one line over the last two hours, a point per 5-minute bucket. */
export default function ActivityPulse({ buckets = 24, bucketMinutes = 5, className = "" }: Props) {
  const { logs } = useLogs();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const { counts, max, recentCount, lastActivity, peakIdx } = useMemo(() => {
    const now      = Date.now();
    const windowMs = buckets * bucketMinutes * 60 * 1000;
    const bucketMs = bucketMinutes * 60 * 1000;
    const counts   = Array(buckets).fill(0) as number[];
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
    let peakIdx = -1;
    counts.forEach((c, i) => { if (c > 0 && (peakIdx === -1 || c > counts[peakIdx])) peakIdx = i; });

    const lastTs = logs.reduce<string | null>((acc, l) => (!acc || l.timestamp > acc ? l.timestamp : acc), null);
    let lastActivity = "אין פעילות";
    if (lastTs) {
      const diffMin = Math.floor((now - new Date(lastTs).getTime()) / 60000);
      if (diffMin < 1)       lastActivity = "עכשיו";
      else if (diffMin < 60) lastActivity = `לפני ${diffMin} דק'`;
      else                   lastActivity = `לפני ${Math.floor(diffMin / 60)} ש'`;
    }
    return { counts, max, recentCount, lastActivity, peakIdx };
  }, [logs, buckets, bucketMinutes]);

  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => PAD_X + (i / (buckets - 1)) * innerW;
  const y = (c: number) => PAD_TOP + innerH - (c / max) * innerH;
  const baseline = PAD_TOP + innerH;

  const linePath = counts.map((c, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(c).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${x(buckets - 1).toFixed(1)},${baseline} L${x(0).toFixed(1)},${baseline} Z`;
  const isActive = recentCount > 0;
  const total = counts.reduce((s, c) => s + c, 0);

  function bucketLabel(i: number): string {
    const minsAgo = (buckets - 1 - i) * bucketMinutes;
    return minsAgo === 0 ? "עכשיו" : `לפני ${minsAgo} דק'`;
  }

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    // the svg is mirrored for RTL, so the newest bucket sits on the left edge of the screen
    const rel = 1 - (e.clientX - rect.left) / rect.width;
    const i = Math.round(rel * (buckets - 1));
    setHover(Math.max(0, Math.min(buckets - 1, i)));
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? "bg-green-500" : "bg-gray-300"}`} />
          </span>
          <span className="text-sm font-bold text-ink-soft">דופק מבצעי</span>
          <span className="text-xs text-ink-muted">עדכונים ל-{bucketMinutes} דק', {buckets * bucketMinutes} דק' אחרונות</span>
        </div>
        <div className="flex items-center gap-3">
          {recentCount > 0 && (
            <span className="text-xs font-semibold text-pikud-orange bg-pikud-orange/10 px-2 py-0.5 rounded-full">{recentCount} עדכונים אחרונים</span>
          )}
          <span className="text-xs text-ink-muted">{lastActivity}</span>
        </div>
      </div>

      <div className="relative">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-16 block" style={{ transform: "scaleX(-1)" }}
          role="img" aria-label={`${total} עדכונים ב-${buckets * bucketMinutes} הדקות האחרונות`}
          onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="pulse-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F47920" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#F47920" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <line x1={PAD_X} x2={W - PAD_X} y1={baseline} y2={baseline} stroke="#E8E6E1" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1={PAD_X} x2={W - PAD_X} y1={PAD_TOP} y2={PAD_TOP} stroke="#E8E6E1" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          <path d={areaPath} fill="url(#pulse-area)" />
          <path d={linePath} fill="none" stroke="#F47920" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {peakIdx >= 0 && (
            <circle cx={x(peakIdx)} cy={y(counts[peakIdx])} r="4" fill="#F47920" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          )}
          {hover !== null && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={PAD_TOP} y2={baseline} stroke="#0D2B5E" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
              <circle cx={x(hover)} cy={y(counts[hover])} r="5" fill="#0D2B5E" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>

        {/* y labels sit outside the mirrored svg so the text stays readable */}
        <span className="absolute top-0 right-0 -translate-y-1/2 text-[10px] text-ink-muted bg-surface px-1">{max}</span>
        <span className="absolute bottom-1 right-0 text-[10px] text-ink-muted bg-surface px-1">0</span>

        {hover !== null && (
          <div className="absolute top-0 -translate-y-full pointer-events-none"
            style={{ right: `${(hover / (buckets - 1)) * 100}%`, transform: "translate(50%, -110%)" }}>
            <div className="bg-pikud-navy text-white text-[11px] rounded-md px-2 py-1 whitespace-nowrap shadow">
              <span className="font-bold">{counts[hover]}</span> עדכונים · {bucketLabel(hover)}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-0.5 text-[10px] text-ink-muted">
        <span>עכשיו</span>
        <span>{`לפני ${buckets * bucketMinutes} דק'`}</span>
      </div>
    </div>
  );
}
