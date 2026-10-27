import { loadSession } from "@/lib/auth/session";
import { SessionProvider } from "@/lib/session";
import SiteShell from "@/components/SiteShell";

/** Main layout: session (may be null) and the sidebar shell around every tool and the hub. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await loadSession();
  return (
    <SessionProvider value={session}>
      <SiteShell>{children}</SiteShell>
    </SessionProvider>
  );
}
