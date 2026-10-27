export type FeedbackKind = "feature" | "bug" | "question" | "other";
export type FeedbackStatus = "new" | "seen" | "done";

export const FEEDBACK_KINDS: { value: FeedbackKind; label: string }[] = [
  { value: "feature",  label: "בקשת פיצ'ר" },
  { value: "bug",      label: "דיווח על תקלה" },
  { value: "question", label: "שאלה" },
  { value: "other",    label: "אחר" },
];

export const FEEDBACK_STATUS: { value: FeedbackStatus; label: string }[] = [
  { value: "new",  label: "חדש" },
  { value: "seen", label: "נקרא" },
  { value: "done", label: "טופל" },
];

export function kindLabel(kind: string): string {
  return FEEDBACK_KINDS.find((k) => k.value === kind)?.label ?? kind;
}
