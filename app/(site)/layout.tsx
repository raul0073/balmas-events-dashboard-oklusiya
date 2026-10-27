import { loadSession } from "@/lib/auth/session";
import { SessionProvider } from "@/lib/session";
import Navbar from "@/components/Navbar";

/** Shell for every tool and the hub home: session (may be null), navbar, content. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await loadSession();
  return (
    <SessionProvider value={session}>
      <Navbar />
      <main>{children}</main>
    </SessionProvider>
  );
}
