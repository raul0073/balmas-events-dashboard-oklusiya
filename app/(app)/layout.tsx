import { redirect } from "next/navigation";
import { loadSession } from "@/lib/auth/session";
import { SessionProvider } from "@/lib/session";
import { EventsProvider } from "@/lib/events-context";
import { LogProvider } from "@/lib/logger";
import Navbar from "@/components/Navbar";
import DisabledAccount from "@/components/DisabledAccount";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await loadSession();
  if (!session) redirect("/login");
  if (session.isAdmin) redirect("/admin");

  return (
    <SessionProvider value={session}>
      <LogProvider>
        <EventsProvider>
          <Navbar />
          <main>{session.battalion ? children : <DisabledAccount />}</main>
        </EventsProvider>
      </LogProvider>
    </SessionProvider>
  );
}
