import type { Person, ShiftTemplate } from "./types";

/** Slots that must be filled every day, summed over the day's shifts. */
export interface DailySlots {
  soldiers: number;
  officers: number;
  backups: number;
}

export function dailySlots(shifts: ShiftTemplate[]): DailySlots {
  return shifts.reduce(
    (a, s) => ({ soldiers: a.soldiers + (s.soldiers || 0), officers: a.officers + (s.officers || 0), backups: a.backups + (s.backups || 0) }),
    { soldiers: 0, officers: 0, backups: 0 }
  );
}

export interface StaffingNeeds {
  perDay: DailySlots;
  /** how many groups take turns; 1 when nobody rotates */
  groups: number;
  /** people needed per group on duty (each slot of a day is a different person at one shift per day) */
  perGroup: { soldiers: number; officers: number };
  /** across all groups */
  total: { soldiers: number; officers: number };
  have: { soldiers: number; officers: number; dual: number; total: number };
  missing: { soldiers: number; officers: number };
}

/**
 * How many people a plan needs versus how many are active.
 * Backups count as soldiers (anyone can stand by); a person holding both roles is counted
 * for both and reported as "dual" so the reader knows the two counts overlap.
 */
export function staffingNeeds(shifts: ShiftTemplate[], rotatingGroups: number, people: Person[], maxPerDay = 1): StaffingNeeds {
  const perDay = dailySlots(shifts);
  const groups = Math.max(1, rotatingGroups);
  const concurrency = Math.max(1, maxPerDay);
  const perGroup = {
    soldiers: Math.ceil((perDay.soldiers + perDay.backups) / concurrency),
    officers: Math.ceil(perDay.officers / concurrency),
  };
  const total = { soldiers: perGroup.soldiers * groups, officers: perGroup.officers * groups };
  const active = people.filter((p) => p.active);
  const have = {
    soldiers: active.filter((p) => p.roles.includes("soldier")).length,
    officers: active.filter((p) => p.roles.includes("officer")).length,
    dual: active.filter((p) => p.roles.includes("soldier") && p.roles.includes("officer")).length,
    total: active.length,
  };
  return {
    perDay, groups, perGroup, total, have,
    missing: { soldiers: Math.max(0, total.soldiers - have.soldiers), officers: Math.max(0, total.officers - have.officers) },
  };
}
