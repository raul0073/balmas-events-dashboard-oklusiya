import "server-only";
import { createClient } from "@/lib/supabase/server";
import { EMPTY_CHECKLIST, normalizeChecklist, type ChecklistContent } from "./types";

/** The published checklist. Readable by everyone through the anon key. */
export async function loadChecklist(): Promise<{ content: ChecklistContent; updatedAt: string | null }> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_content").select("data, updated_at").eq("key", "checklist").maybeSingle();
  if (!data) return { content: EMPTY_CHECKLIST, updatedAt: null };
  return { content: normalizeChecklist(data.data), updatedAt: data.updated_at };
}
