import { redirect } from "next/navigation";
import { loadSession } from "@/lib/auth/session";
import DisabledAccount from "@/components/DisabledAccount";
import ShiftsSync from "@/components/shifts/ShiftsSync";
import ShiftsNav from "@/components/shifts/ShiftsNav";
import ShiftsFrame from "@/components/shifts/ShiftsFrame";

export const metadata = { title: "סידור משמרות | חמ\"ל אוכלוסייה" };

/** The shifts organizer needs a battalion; its data is that battalion's. */
export default async function ShiftsLayout({ children }: { children: React.ReactNode }) {
  const session = await loadSession();
  if (!session) redirect("/login?next=/shifts");
  if (!session.battalion) return <DisabledAccount isAdmin={session.isAdmin} />;

  return (
    <>
      <ShiftsSync />
      <ShiftsNav />
      <ShiftsFrame>{children}</ShiftsFrame>
    </>
  );
}
