import { COUNTER_KEYS, type CrisisEvent } from "@/types";

/** Sum of the five counters (people accounted for). */
export function accountedFor(e: Pick<CrisisEvent, (typeof COUNTER_KEYS)[number]>): number {
  return COUNTER_KEYS.reduce((sum, k) => sum + (e[k] ?? 0), 0);
}

/**
 * Missing = anchor − accounted. null while there is no anchor list.
 * 0 means everyone is known; negative means the counters exceed the anchor (a data error).
 */
export function calcMissing(e: Pick<CrisisEvent, "anchor" | (typeof COUNTER_KEYS)[number]>): number | null {
  if (e.anchor === null || e.anchor === undefined) return null;
  return e.anchor - accountedFor(e);
}

export function isMetaIncomplete(e: Pick<CrisisEvent, "crisisType" | "infrastructureType" | "plugah">): boolean {
  return !e.crisisType || !e.infrastructureType || !e.plugah;
}
