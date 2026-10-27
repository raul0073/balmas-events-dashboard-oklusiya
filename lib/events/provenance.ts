/** How an update reached the HAMAL. */
export type Channel = "whatsapp" | "phone" | "face" | "radio" | "other";

export const CHANNELS: { value: Channel; label: string }[] = [
  { value: "whatsapp", label: "ווטסאפ" },
  { value: "phone",    label: "טלפון" },
  { value: "face",     label: "פנים אל פנים" },
  { value: "radio",    label: "קשר" },
  { value: "other",    label: "אחר" },
];

export function channelLabel(value: string | null | undefined): string {
  return CHANNELS.find((c) => c.value === value)?.label ?? (value ?? "");
}

/** The provenance attached to one save. */
export interface Provenance {
  reportedBy: string;
  channel: Channel | null;
  reason: string;
}

export const EMPTY_PROVENANCE: Provenance = { reportedBy: "", channel: null, reason: "" };

/** One line for the log: "מסר: X · ווטסאפ · סיבה: Y". */
export function formatProvenance(p: { reportedBy?: string | null; channel?: string | null; reason?: string | null }): string {
  const bits = [
    p.reportedBy ? `מסר: ${p.reportedBy}` : null,
    p.channel ? channelLabel(p.channel) : null,
    p.reason ? `סיבה: ${p.reason}` : null,
  ].filter(Boolean);
  return bits.join(" · ");
}
