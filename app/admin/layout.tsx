import { redirect } from "next/navigation";
import { loadSession } from "@/lib/auth/session";
import { SessionProvider } from "@/lib/session";
import AdminNavbar from "@/components/AdminNavbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await loadSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/");

  return (
    <SessionProvider value={session}>
      <AdminNavbar />
      <main>{children}</main>
    </SessionProvider>
  );
}
