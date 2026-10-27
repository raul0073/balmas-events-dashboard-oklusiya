import { AppConfig, Person, Schedule } from "./types";
import { eachDay, parseYmd, shiftHours } from "./time";

export interface PersonStats {
  person: Person;
  shifts: number;
  hours: number;
  nights: number;
  weekend: number; // duty shifts on Friday or Saturday
  backups: number;
  loadPct: number | null; // duty hours as % of the whole range
}

export interface CoverageDay {
  date: string;
  filled: number;
  required: number;
}

export function computeStats(schedule: Schedule | null, people: Person[], config: AppConfig) {
  const byShift = new Map<string, number>();
  const byWeekday = new Array(7).fill(0) as number[];
  const perPerson = new Map<string, { shifts: number; hours: number; nights: number; weekend: number; backups: number }>();
  const coverage: CoverageDay[] = [];
  let filled = 0;
  let required = 0;

  const bucket = (id: string) => {
    const cur = perPerson.get(id) ?? { shifts: 0, hours: 0, nights: 0, weekend: 0, backups: 0 };
    perPerson.set(id, cur);
    return cur;
  };

  if (schedule) {
    const days = eachDay(schedule.from, schedule.to);
    const covMap = new Map<string, CoverageDay>();
    for (const d of days) covMap.set(d, { date: d, filled: 0, required: 0 });

    for (const inst of Object.values(schedule.instances)) {
      const shift = config.shifts.find((s) => s.id === inst.shiftId);
      if (!shift) continue;
      const req = shift.soldiers + shift.officers;
      const cov = covMap.get(inst.date);
      if (cov) {
        cov.required += req;
        cov.filled += Math.min(inst.assigned.length, req);
      }
      required += req;
      filled += Math.min(inst.assigned.length, req);
      byShift.set(inst.shiftId, (byShift.get(inst.shiftId) ?? 0) + inst.assigned.length);
      byWeekday[parseYmd(inst.date).getDay()] += inst.assigned.length;
      const h = shiftHours(shift);
      const wd = parseYmd(inst.date).getDay();
      const isWeekend = wd === 5 || wd === 6; // Friday / Saturday
      for (const id of inst.assigned) {
        const cur = bucket(id);
        cur.shifts += 1;
        cur.hours += h;
        if (shift.isNight) cur.nights += 1;
        if (isWeekend) cur.weekend += 1;
      }
      for (const id of inst.backups) bucket(id).backups += 1;
    }
    coverage.push(...days.map((d) => covMap.get(d)!));
  }

  const rangeHours = schedule ? eachDay(schedule.from, schedule.to).length * 24 : 0;
  const personStats: PersonStats[] = people
    .filter((p) => p.active)
    .map((p) => {
      const s = perPerson.get(p.id) ?? { shifts: 0, hours: 0, nights: 0, weekend: 0, backups: 0 };
      return { person: p, ...s, loadPct: rangeHours > 0 ? (s.hours / rangeHours) * 100 : null };
    })
    .sort((a, b) => b.hours - a.hours);

  return { personStats, byShift, byWeekday, coverage, filled, required };
}
