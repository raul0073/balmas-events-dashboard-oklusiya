import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMPTY_CHECKLIST, normalizeChecklist, type ChecklistContent } from "./types";

/** What the public page needs to render an aid chip: its title and the library page it lives on. */
export interface AidRef { title: string; href: string }

export async function resolveAids(content: ChecklistContent): Promise<Record<string, AidRef>> {
  const ids = content.sections.flatMap((s) => s.items.map((i) => i.libraryItemId)).filter((x): x is string => Boolean(x));
  if (ids.length === 0) return {};
  const { data } = await createAdminClient().from("library_items").select("id, title, space").in("id", ids);
  const out: Record<string, AidRef> = {};
  for (const r of data ?? []) out[r.id] = { title: r.title, href: `/library/${r.space}?item=${r.id}` };
  return out;
}

/** The published checklist. Readable by everyone through the anon key. */
export async function loadChecklist(): Promise<{ content: ChecklistContent; updatedAt: string | null }> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_content").select("data, updated_at").eq("key", "checklist").maybeSingle();
  if (!data) return { content: EMPTY_CHECKLIST, updatedAt: null };
  return { content: normalizeChecklist(data.data), updatedAt: data.updated_at };
}
