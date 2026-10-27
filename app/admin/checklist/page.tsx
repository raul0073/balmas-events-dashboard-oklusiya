import { createAdminClient } from "@/lib/supabase/admin";
import { EMPTY_CHECKLIST, normalizeChecklist } from "@/lib/checklist/types";
import ChecklistEditor from "@/components/admin/ChecklistEditor";

export const dynamic = "force-dynamic";

export default async function AdminChecklist() {
  const { data } = await createAdminClient().from("site_content").select("data, updated_at").eq("key", "checklist").maybeSingle();
  const content = data ? normalizeChecklist(data.data) : EMPTY_CHECKLIST;
  return <ChecklistEditor initial={content} updatedAt={data?.updated_at ?? null} />;
}
