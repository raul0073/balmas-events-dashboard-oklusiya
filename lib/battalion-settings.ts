import { CRISIS_TYPES, PLUGAH_HEX, PLUGAH_KEYS, PLUGAH_LABELS } from "@/types";

/** One company (פלוגה) of a battalion. The key is what events store; label and color are the battalion's. */
export interface PlugahDef {
  key: string;
  label: string;
  color: string;
}

/** What a battalion may change about the events board. Stored in battalions.settings (jsonb). */
export interface BattalionSettingsData {
  plugot?: PlugahDef[];
  crisisTypes?: string[];
  whatsappHeader?: string;
}

export interface ResolvedSettings {
  plugot: PlugahDef[];
  crisisTypes: string[];
  whatsappHeader: string;
}

export const DEFAULT_PLUGOT: PlugahDef[] = PLUGAH_KEYS.map((k) => ({ key: k, label: PLUGAH_LABELS[k], color: PLUGAH_HEX[k] }));
export const NONE_COLOR = PLUGAH_HEX.none;

/** Fills in defaults so every consumer sees a complete settings object. */
export function resolveSettings(raw: unknown, battalionName: string): ResolvedSettings {
  const s = (raw ?? {}) as BattalionSettingsData;
  const plugot = Array.isArray(s.plugot) && s.plugot.length
    ? s.plugot.map((p) => ({ key: String(p.key), label: String(p.label ?? "").trim() || String(p.key), color: /^#[0-9a-f]{6}$/i.test(String(p.color)) ? String(p.color) : NONE_COLOR }))
    : DEFAULT_PLUGOT;
  const crisisTypes = Array.isArray(s.crisisTypes) && s.crisisTypes.length
    ? s.crisisTypes.map((t) => String(t).trim()).filter(Boolean)
    : [...CRISIS_TYPES];
  const whatsappHeader = String(s.whatsappHeader ?? "").trim() || `${battalionName} | פיקוד העורף`;
  return { plugot, crisisTypes, whatsappHeader };
}

/** Label of a plugah key under these settings; unknown keys fall back to the key itself. */
export function plugahLabelOf(settings: Pick<ResolvedSettings, "plugot">, key: string | null, fallback = "ללא פלוגה"): string {
  if (!key) return fallback;
  return settings.plugot.find((p) => p.key === key)?.label ?? key;
}

export function plugahColorOf(settings: Pick<ResolvedSettings, "plugot">, key: string | null): string {
  if (!key) return NONE_COLOR;
  return settings.plugot.find((p) => p.key === key)?.color ?? NONE_COLOR;
}

/** A stable key for a new plugah from its label (Hebrew labels get a short random key). */
export function plugahKeyFor(label: string, taken: string[]): string {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `p${Math.random().toString(36).slice(2, 6)}`;
  let key = base, i = 2;
  while (taken.includes(key)) key = `${base}-${i++}`;
  return key;
}
