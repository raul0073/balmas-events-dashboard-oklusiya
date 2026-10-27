import { COUNTER_KEYS, type CrisisEvent } from "@/types";

type Counters = Pick<CrisisEvent, (typeof COUNTER_KEYS)[number]>;
type AnchorInput = Pick<CrisisEvent, "anchor" | "tzapi">;

/** Sum of the five counters (people accounted for). */
export function accountedFor(e: Counters): number {
  return COUNTER_KEYS.reduce((sum, k) => sum + (e[k] ?? 0), 0);
}

/**
 * The anchor used for the missing count. A real anchor list wins; until it is
 * entered, the forecast (צפי) stands in and the result is flagged as assumed.
 */
export function anchorInfo(e: AnchorInput): { value: number | null; assumed: boolean } {
  if (e.anchor !== null && e.anchor !== undefined) return { value: e.anchor, assumed: false };
  if (e.tzapi !== null && e.tzapi !== undefined) return { value: e.tzapi, assumed: true };
  return { value: null, assumed: false };
}

/**
 * Missing = anchor − accounted. null while there is neither an anchor nor a forecast.
 * 0 means everyone is known; negative means the counters exceed the anchor (a data error).
 */
export function calcMissing(e: AnchorInput & Counters): number | null {
  const { value } = anchorInfo(e);
  if (value === null) return null;
  return value - accountedFor(e);
}

export function isMetaIncomplete(e: Pick<CrisisEvent, "crisisType" | "infrastructureType" | "plugah">): boolean {
  return !e.crisisType || !e.infrastructureType || !e.plugah;
}
