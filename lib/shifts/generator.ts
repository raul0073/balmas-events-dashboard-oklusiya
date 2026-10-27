import {
  AppConfig,
  GenIssue,
  Person,
  Role,
  RotationPeriod,
  Rule,
  Schedule,
  ShiftInstance,
  ShiftTemplate,
  SlotKind,
  instanceKey,
} from "./types";
import { absenceInterval, eachDay, shiftInterval, weekKey } from "./time";

export interface GenContext {
  people: Person[];
  config: AppConfig;
  rules: Rule[];
  periods: RotationPeriod[];
  instances: Record<string, ShiftInstance>;
}

function shiftById(config: AppConfig, id: string): ShiftTemplate | undefined {
  return config.shifts.find((s) => s.id === id);
}

/** Split an instance's duty roster into officer/soldier buckets. Dual-role people top up officers first. */
export function bucketAssigned(assigned: Person[], shift: ShiftTemplate) {
  const officers: Person[] = [];
  const soldiers: Person[] = [];
  const both: Person[] = [];
  for (const p of assigned) {
    const o = p.roles.includes("officer");
    const s = p.roles.includes("soldier");
    if (o && !s) officers.push(p);
    else if (s && !o) soldiers.push(p);
    else both.push(p);
  }
  for (const p of both) {
    if (officers.length < shift.officers) officers.push(p);
    else soldiers.push(p);
  }
  return { officers, soldiers };
}

interface Interval {
  start: number;
  end: number;
  inst: ShiftInstance;
  shift: ShiftTemplate;
  isBackup: boolean;
}

function personIntervals(ctx: GenContext, personId: string, excludeKey?: string): Interval[] {
  const out: Interval[] = [];
  for (const inst of Object.values(ctx.instances)) {
    if (inst.key === excludeKey) continue;
    const duty = inst.assigned.includes(personId);
    const backup = inst.backups.includes(personId);
    if (!duty && !backup) continue;
    const shift = shiftById(ctx.config, inst.shiftId);
    if (!shift) continue;
    out.push({ ...shiftInterval(inst.date, shift), inst, shift, isBackup: !duty });
  }
  return out;
}

/**
 * Violation codes if `personId` were put on instance `key` as duty or backup.
 * Backup slots skip rest/limit checks — standby doesn't consume rest — but still
 * respect availability, bans, rotation, and physical overlap with real shifts.
 * Soft-rule violations are prefixed "soft:".
 */
export function violationsFor(
  ctx: GenContext,
  personId: string,
  key: string,
  slot: SlotKind = "duty"
): string[] {
  const inst = ctx.instances[key];
  const person = ctx.people.find((p) => p.id === personId);
  if (!inst || !person) return ["inactive"];
  const shift = shiftById(ctx.config, inst.shiftId);
  if (!shift) return ["inactive"];

  const v: string[] = [];
  if (!person.active) v.push("inactive");
  if (inst.assigned.includes(personId) || inst.backups.includes(personId)) v.push("already-assigned");
  if (person.bannedShiftIds.includes(shift.id)) v.push("banned-shift");
  {
    const me0 = shiftInterval(inst.date, shift);
    const away = person.unavailable.some((u) => {
      const ai = absenceInterval(u);
      return !!ai && me0.start < ai.end && ai.start < me0.end;
    });
    if (away) v.push("unavailable");
  }

  const covering = ctx.periods.filter((p) => p.from <= inst.date && inst.date <= p.to);
  if (covering.length > 0 && !covering.some((p) => p.groupId === person.groupId)) v.push("off-rotation");

  const mine = personIntervals(ctx, personId, key);
  const me = shiftInterval(inst.date, shift);

  for (const other of mine) {
    if (me.start < other.end && other.start < me.end) {
      v.push("overlap");
      break;
    }
  }

  if (slot === "duty") {
    const dutyIv = mine.filter((o) => !o.isBackup);
    const minRest = person.minRestHours ?? ctx.config.minRestHours;
    if (!v.includes("overlap")) {
      for (const other of dutyIv) {
        const gap =
          me.start >= other.end ? (me.start - other.end) / 3600000 : (other.start - me.end) / 3600000;
        if (gap < minRest) {
          v.push("min-rest");
          break;
        }
      }
    }

    const maxDay = person.maxPerDay ?? ctx.config.maxPerDay;
    const maxWeek = person.maxPerWeek ?? ctx.config.maxPerWeek;
    if (dutyIv.filter((o) => o.inst.date === inst.date).length >= maxDay) v.push("max-day");
    const wk = weekKey(inst.date, ctx.config.weekStart);
    if (dutyIv.filter((o) => weekKey(o.inst.date, ctx.config.weekStart) === wk).length >= maxWeek)
      v.push("max-week");

    const others = inst.assigned
      .map((id) => ctx.people.find((p) => p.id === id))
      .filter((p): p is Person => !!p && p.id !== personId);
    for (const rule of ctx.rules) {
      if (!rule.enabled) continue;
      const mark = (code: string) => v.push(rule.hard ? code : `soft:${code}`);
      if (rule.type === "incompatible_tags") {
        const clash = others.some(
          (o) =>
            (person.tags.includes(rule.tagA) && o.tags.includes(rule.tagB)) ||
            (person.tags.includes(rule.tagB) && o.tags.includes(rule.tagA))
        );
        if (clash) mark("incompatible");
      }
      if (rule.type === "max_nights_per_week" && shift.isNight) {
        if (!rule.personId || rule.personId === personId) {
          const nights = dutyIv.filter(
            (o) => o.shift.isNight && weekKey(o.inst.date, ctx.config.weekStart) === wk
          ).length;
          if (nights >= rule.max) mark("max-nights");
        }
      }
    }
  }
  return v;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSchedule(opts: {
  from: string;
  to: string;
  people: Person[];
  config: AppConfig;
  rules: Rule[];
  periods: RotationPeriod[];
  seed?: number;
}): Schedule {
  const { from, to, people, config, rules, periods } = opts;
  const rand = mulberry32(opts.seed ?? Date.now());
  const instances: Record<string, ShiftInstance> = {};
  for (const date of eachDay(from, to)) {
    for (const shift of config.shifts) {
      const key = instanceKey(date, shift.id);
      instances[key] = { key, date, shiftId: shift.id, assigned: [], backups: [] };
    }
  }

  const ctx: GenContext = { people, config, rules, periods, instances };
  const issues: GenIssue[] = [];

  for (const rule of rules) {
    if (rule.type !== "pin" || !rule.enabled) continue;
    const inst = instances[instanceKey(rule.date, rule.shiftId)];
    if (inst && !inst.assigned.includes(rule.personId)) inst.assigned.push(rule.personId);
  }

  const ordered = Object.values(instances).sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    const sa = shiftById(config, a.shiftId)!;
    const sb = shiftById(config, b.shiftId)!;
    return sa.start < sb.start ? -1 : 1;
  });

  const totalHours = new Map<string, number>();
  const totalNights = new Map<string, number>();
  const totalBackups = new Map<string, number>();
  const lastEnd = new Map<string, number>();
  const bump = (id: string, inst: ShiftInstance, shift: ShiftTemplate) => {
    const iv = shiftInterval(inst.date, shift);
    totalHours.set(id, (totalHours.get(id) ?? 0) + (iv.end - iv.start) / 3600000);
    if (shift.isNight) totalNights.set(id, (totalNights.get(id) ?? 0) + 1);
    lastEnd.set(id, Math.max(lastEnd.get(id) ?? 0, iv.end));
  };
  for (const inst of ordered) {
    const shift = shiftById(config, inst.shiftId)!;
    for (const id of inst.assigned) bump(id, inst, shift);
  }

  for (const inst of ordered) {
    const shift = shiftById(config, inst.shiftId)!;
    const iv = shiftInterval(inst.date, shift);

    for (const role of ["officer", "soldier"] as Role[]) {
      const required = role === "officer" ? shift.officers : shift.soldiers;
      const blockers: Record<string, number> = {};
      for (;;) {
        const assignedPeople = inst.assigned
          .map((id) => people.find((p) => p.id === id))
          .filter((p): p is Person => !!p);
        const buckets = bucketAssigned(assignedPeople, shift);
        const have = role === "officer" ? buckets.officers.length : buckets.soldiers.length;
        if (have >= required) break;

        const scored: { id: string; score: number }[] = [];
        for (const p of people) {
          if (!p.roles.includes(role)) continue;
          const v = violationsFor(ctx, p.id, inst.key, "duty");
          const hardV = v.filter((c) => !c.startsWith("soft:"));
          if (hardV.length > 0) {
            for (const c of hardV) blockers[c] = (blockers[c] ?? 0) + 1;
            continue;
          }
          const softCount = v.length - hardV.length;
          const rest = lastEnd.has(p.id) ? (iv.start - lastEnd.get(p.id)!) / 3600000 : 999;
          const score =
            -(totalHours.get(p.id) ?? 0) -
            (shift.isNight ? (totalNights.get(p.id) ?? 0) * 6 : 0) +
            Math.min(rest, 200) * 0.05 +
            (p.roles.length === 1 ? 1.5 : 0) - // keep dual-role people free for the other bucket
            softCount * 50 +
            rand() * 0.4;
          scored.push({ id: p.id, score });
        }
        if (scored.length === 0) {
          const assignedNow = inst.assigned
            .map((id) => people.find((p) => p.id === id))
            .filter((p): p is Person => !!p);
          const b = bucketAssigned(assignedNow, shift);
          const still = required - (role === "officer" ? b.officers.length : b.soldiers.length);
          if (still > 0) issues.push({ key: inst.key, role, missing: still, blockers });
          break;
        }
        scored.sort((a, b) => b.score - a.score);
        const pick = scored[0].id;
        inst.assigned.push(pick);
        bump(pick, inst, shift);
      }
    }

    // standby slots
    let bNeed = shift.backups - inst.backups.length;
    if (bNeed > 0) {
      const blockers: Record<string, number> = {};
      while (bNeed > 0) {
        const scored: { id: string; score: number }[] = [];
        for (const p of people) {
          const v = violationsFor(ctx, p.id, inst.key, "backup");
          const hardV = v.filter((c) => !c.startsWith("soft:"));
          if (hardV.length > 0) {
            for (const c of hardV) blockers[c] = (blockers[c] ?? 0) + 1;
            continue;
          }
          const score =
            -(totalBackups.get(p.id) ?? 0) * 2 -
            (totalHours.get(p.id) ?? 0) * 0.3 +
            rand() * 0.4;
          scored.push({ id: p.id, score });
        }
        if (scored.length === 0) break;
        scored.sort((a, b) => b.score - a.score);
        const pick = scored[0].id;
        inst.backups.push(pick);
        totalBackups.set(pick, (totalBackups.get(pick) ?? 0) + 1);
        bNeed--;
      }
      if (bNeed > 0) issues.push({ key: inst.key, role: "backup", missing: bNeed, blockers });
    }
  }

  return { from, to, instances, issues, generatedAt: new Date().toISOString() };
}
