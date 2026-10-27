import { redirect } from "next/navigation";
import { loadSession } from "@/lib/auth/session";
import { SessionProvider } from "@/lib/session";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await loadSession();
  if (!session) redirect("/login?next=/admin");
  if (!session.isAdmin) redirect("/");

  return (
    <SessionProvider value={session}>
      <AdminShell username={session.username}>{children}</AdminShell>
    </SessionProvider>
  );
}
