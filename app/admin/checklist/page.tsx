import { createAdminClient } from "@/lib/supabase/admin";
import { EMPTY_CHECKLIST, normalizeChecklist } from "@/lib/checklist/types";
import ChecklistEditor from "@/components/admin/ChecklistEditor";
import { loadAllLibrary } from "@/lib/library/content";

export const dynamic = "force-dynamic";

export default async function AdminChecklist() {
  const { data } = await createAdminClient().from("site_content").select("data, updated_at").eq("key", "checklist").maybeSingle();
  const content = data ? normalizeChecklist(data.data) : EMPTY_CHECKLIST;
  const library = (await loadAllLibrary()).map((i) => ({ id: i.id, title: i.title, space: i.space, category: i.category }));
  return <ChecklistEditor initial={content} updatedAt={data?.updated_at ?? null} library={library} />;
}
