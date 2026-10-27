import { createAdminClient } from "@/lib/supabase/admin";
import AdminDashboard, { type BattalionSummary } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

interface BattalionRow {
  id: string;
  user_id: string;
  username: string;
  name: string;
  active: boolean;
  created_at: string;
  events: { count: number }[];
  logs: { count: number }[];
  last_log: { created_at: string }[];
}

export default async function AdminHome() {
  const admin = createAdminClient();

  const [{ data: rows }, { data: users }] = await Promise.all([
    admin
      .from("battalions")
      .select("id, user_id, username, name, active, created_at, events(count), logs(count), last_log:logs(created_at)")
      .order("created_at", { ascending: true })
      .order("created_at", { referencedTable: "last_log", ascending: false })
      .limit(1, { referencedTable: "last_log" }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const lastSignIn = new Map<string, string | null>();
  for (const u of users?.users ?? []) lastSignIn.set(u.id, u.last_sign_in_at ?? null);

  const battalions: BattalionSummary[] = ((rows ?? []) as unknown as BattalionRow[]).map((b) => ({
    id: b.id,
    userId: b.user_id,
    username: b.username,
    name: b.name,
    active: b.active,
    createdAt: b.created_at,
    lastSignInAt: lastSignIn.get(b.user_id) ?? null,
    eventCount: b.events?.[0]?.count ?? 0,
    logCount: b.logs?.[0]?.count ?? 0,
    lastActivityAt: b.last_log?.[0]?.created_at ?? null,
  }));

  return <AdminDashboard battalions={battalions} />;
}
