/**
 * Information sources a population HAMAL works through at a collapse site
 * ("מודיעין אוכלוסייה"). Each event tracks which ones were already exhausted.
 * Becomes per-battalion editable in the settings stage.
 */
export interface InfoSource {
  key: string;
  label: string;
}

export interface InfoSourceGroup {
  label: string;
  sources: InfoSource[];
}

export const INFO_SOURCE_GROUPS: InfoSourceGroup[] = [
  {
    label: "בזירה",
    sources: [
      { key: "neighbors",   label: "שכנים" },
      { key: "bystanders",  label: "עוברי אורח ועדי ראייה" },
      { key: "police",      label: "משטרה" },
      { key: "fire",        label: "כבאות" },
      { key: "mda",         label: "מד\"א" },
    ],
  },
  {
    label: "המבנה",
    sources: [
      { key: "committee",   label: "ועד הבית / רשימת דיירים" },
      { key: "owner",       label: "בעל הנכס / חברת ניהול" },
      { key: "cameras",     label: "מצלמות אבטחה" },
      { key: "registry",    label: "רישום מוסד (תלמידים, מאושפזים, עובדים, אורחים)" },
    ],
  },
  {
    label: "גופים",
    sources: [
      { key: "hfc_info",    label: "מרכז המידע של פיקוד העורף" },
      { key: "municipality",label: "רשות מקומית (רישום תושבים, רווחה)" },
      { key: "hospitals",   label: "בתי חולים וקופות חולים" },
      { key: "hotline105",  label: "מוקד 105 נעדרים" },
    ],
  },
  {
    label: "קרובים ורשתות",
    sources: [
      { key: "family",      label: "משפחות וקרובים" },
      { key: "employers",   label: "מעסיקים" },
      { key: "social",      label: "קבוצות ווטסאפ שכונתיות ורשתות חברתיות" },
      { key: "phones",      label: "איכון טלפונים" },
    ],
  },
];

export const INFO_SOURCES: InfoSource[] = INFO_SOURCE_GROUPS.flatMap((g) => g.sources);

export function sourceLabel(key: string): string {
  return INFO_SOURCES.find((s) => s.key === key)?.label ?? key;
}

/** Sources not yet exhausted, in list order. */
export function pendingSources(done: string[]): InfoSource[] {
  return INFO_SOURCES.filter((s) => !done.includes(s.key));
}
