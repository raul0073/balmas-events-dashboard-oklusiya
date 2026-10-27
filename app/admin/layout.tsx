import { redirect } from "next/navigation";
import { loadSession } from "@/lib/auth/session";
import { SessionProvider } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await loadSession();
  if (!session) redirect("/login?next=/admin");
  if (!session.isAdmin) redirect("/");

  const { count } = await createAdminClient()
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  return (
    <SessionProvider value={session}>
      <AdminShell username={session.username} newFeedback={count ?? 0}>{children}</AdminShell>
    </SessionProvider>
  );
}
