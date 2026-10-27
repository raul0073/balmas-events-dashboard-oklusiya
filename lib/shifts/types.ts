export type Role = "soldier" | "officer";
export type SlotKind = "duty" | "backup";
export type Lang = "en" | "he";

export interface Unavailability {
  id: string;
  from: string; // YYYY-MM-DD
  fromTime?: string; // HH:MM — absence starts at this time; empty = from 00:00
  to: string; // YYYY-MM-DD
  toTime?: string; // HH:MM — back at this time (available from then on); empty = whole day
  reason?: string;
}

export interface Person {
  id: string;
  name: string;
  roles: Role[]; // one or both — a person can fill any role they hold
  color?: string; // hex; auto-assigned on create, manually changeable
  groupId?: string;
  tags: string[];
  unavailable: Unavailability[];
  bannedShiftIds: string[];
  maxPerDay?: number;
  maxPerWeek?: number;
  minRestHours?: number;
  active: boolean;
  notes?: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface RotationTurn {
  groupId: string;
  days: number; // how long this group stays on before the next takes over
}

/** Project horizon + repeating turn sequence. Applying it tiles RotationPeriods back-to-back. */
export interface RotationPlan {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD inclusive — e.g. when the whole deployment ends
  turns: RotationTurn[];
}

/** During [from, to], only members of `groupId` are scheduled. Uncovered dates = everyone. */
export interface RotationPeriod {
  id: string;
  from: string;
  to: string;
  groupId: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  start: string; // HH:MM
  end: string; // HH:MM — if <= start, ends next day
  soldiers: number;
  officers: number;
  backups: number; // standby slots (typically for nights)
  isNight: boolean;
}

export interface AppConfig {
  shifts: ShiftTemplate[];
  minRestHours: number;
  maxPerDay: number;
  maxPerWeek: number;
  weekStart: 0 | 1;
}

interface RuleBase {
  id: string;
  enabled: boolean;
  hard: boolean;
}

export interface IncompatibleTagsRule extends RuleBase {
  type: "incompatible_tags";
  tagA: string;
  tagB: string;
}

export interface PinRule extends RuleBase {
  type: "pin";
  personId: string;
  date: string;
  shiftId: string;
}

export interface MaxNightsRule extends RuleBase {
  type: "max_nights_per_week";
  max: number;
  personId?: string;
}

export type Rule = IncompatibleTagsRule | PinRule | MaxNightsRule;
export type RuleType = Rule["type"];

export interface ShiftInstance {
  key: string; // `${date}_${shiftId}`
  date: string;
  shiftId: string;
  assigned: string[]; // duty
  backups: string[]; // standby
}

export interface GenIssue {
  key: string;
  role: Role | "backup";
  missing: number;
  blockers: Record<string, number>;
}

export interface Schedule {
  from: string;
  to: string;
  instances: Record<string, ShiftInstance>;
  issues: GenIssue[];
  generatedAt?: string;
}

export function instanceKey(date: string, shiftId: string): string {
  return `${date}_${shiftId}`;
}
