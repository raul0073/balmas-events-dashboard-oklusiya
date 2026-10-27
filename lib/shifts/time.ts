import { ShiftTemplate, Unavailability } from "./types";

/** Parse 'YYYY-MM-DD' into a local Date at midnight. */
export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(s: string, n: number): string {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  let guard = 0;
  while (cur <= to && guard < 400) {
    out.push(cur);
    cur = addDays(cur, 1);
    guard++;
  }
  return out;
}

export function todayYmd(): string {
  return ymd(new Date());
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayShort(s: string): string {
  return WEEKDAYS[parseYmd(s).getDay()];
}

export function fmtDay(s: string): string {
  const d = parseYmd(s);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** First day (YMD) of the week containing `date`, given week start day. */
export function weekKey(date: string, weekStart: 0 | 1): string {
  const d = parseYmd(date);
  const diff = (d.getDay() - weekStart + 7) % 7;
  d.setDate(d.getDate() - diff);
  return ymd(d);
}

export function parseHm(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}
const minutes = parseHm;

/**
 * Absolute interval of an absence window. Missing fromTime = 00:00 of `from`;
 * missing toTime = end of `to` (person is back only the next day).
 * A set toTime means the person is available again from that moment.
 */
export function absenceInterval(u: Unavailability): { start: number; end: number } | null {
  if (!u.from || !u.to) return null;
  const start = parseYmd(u.from).getTime() + (u.fromTime ? parseHm(u.fromTime) * 60000 : 0);
  const end = parseYmd(u.to).getTime() + (u.toTime ? parseHm(u.toTime) * 60000 : 24 * 3600000);
  return end > start ? { start, end } : null;
}

export function weekdayIndex(s: string): number {
  return parseYmd(s).getDay();
}

/** Absolute start/end (ms epoch) of a shift on a date. End <= start means it crosses midnight. */
export function shiftInterval(date: string, shift: ShiftTemplate): { start: number; end: number } {
  const base = parseYmd(date).getTime();
  const s = minutes(shift.start);
  let e = minutes(shift.end);
  if (e <= s) e += 24 * 60;
  return { start: base + s * 60000, end: base + e * 60000 };
}

export function shiftHours(shift: ShiftTemplate): number {
  const s = minutes(shift.start);
  let e = minutes(shift.end);
  if (e <= s) e += 24 * 60;
  return (e - s) / 60;
}

export function hoursBetween(aMs: number, bMs: number): number {
  return Math.abs(bMs - aMs) / 3600000;
}
