export interface CheckItem {
  id: string;
  text: string;
}

export interface ChecklistSection {
  id: string;
  label: string;
  items: CheckItem[];
}

export interface ChecklistContent {
  title: string;
  subtitle?: string;
  /** one line under the title on the public page */
  intro?: string;
  sections: ChecklistSection[];
}

export const EMPTY_CHECKLIST: ChecklistContent = { title: "צ'קליסט", sections: [] };

/** Drops blanks and guarantees ids, so a half-edited draft never breaks the page. */
export function normalizeChecklist(raw: unknown): ChecklistContent {
  const c = (raw ?? {}) as Partial<ChecklistContent>;
  const sections = Array.isArray(c.sections) ? c.sections : [];
  return {
    title: String(c.title ?? "").trim() || "צ'קליסט",
    subtitle: String(c.subtitle ?? "").trim() || undefined,
    intro: String(c.intro ?? "").trim() || undefined,
    sections: sections
      .map((s, si) => ({
        id: String(s?.id ?? `s${si + 1}`),
        label: String(s?.label ?? "").trim(),
        items: (Array.isArray(s?.items) ? s.items : [])
          .map((it, ii) => ({ id: String(it?.id ?? `s${si + 1}i${ii + 1}`), text: String(it?.text ?? "").trim() }))
          .filter((it) => it.text),
      }))
      .filter((s) => s.label),
  };
}
