import { redirect } from "next/navigation";
import { loadSession } from "@/lib/auth/session";
import { EventsProvider } from "@/lib/events-context";
import { LogProvider } from "@/lib/logger";
import DisabledAccount from "@/components/DisabledAccount";

/** The events board needs a battalion. Admins and disabled accounts get an explanation instead. */
export default async function EventsLayout({ children }: { children: React.ReactNode }) {
  const session = await loadSession();
  if (!session) redirect("/login?next=/events");
  if (!session.battalion) return <DisabledAccount isAdmin={session.isAdmin} />;

  return (
    <LogProvider>
      <EventsProvider>{children}</EventsProvider>
    </LogProvider>
  );
}
