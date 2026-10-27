import { createAdminClient } from "@/lib/supabase/admin";
import FeedbackList, { type FeedbackItem } from "@/components/admin/FeedbackList";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  kind: string;
  subject: string;
  message: string;
  contact: string | null;
  page: string | null;
  status: "new" | "seen" | "done";
  username: string | null;
  created_at: string;
  battalions: { name: string } | null;
}

export default async function AdminFeedback({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = status === "seen" || status === "done" || status === "new" ? status : "open";

  let query = createAdminClient()
    .from("feedback")
    .select("id, kind, subject, message, contact, page, status, username, created_at, battalions(name)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (filter === "open") query = query.neq("status", "done");
  else query = query.eq("status", filter);

  const { data } = await query;
  const items: FeedbackItem[] = ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    kind: r.kind,
    subject: r.subject,
    message: r.message,
    contact: r.contact,
    page: r.page,
    status: r.status,
    username: r.username,
    battalionName: r.battalions?.name ?? null,
    createdAt: r.created_at,
  }));

  return <FeedbackList items={items} filter={filter} />;
}
