import { redirect } from "next/navigation";
import { loadSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { resolveSettings } from "@/lib/battalion-settings";
import DisabledAccount from "@/components/DisabledAccount";
import SettingsForm from "@/components/settings/SettingsForm";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "הגדרות הגדוד | חמ\"ל אוכלוסייה" };

export default async function SettingsPage() {
  const session = await loadSession();
  if (!session) redirect("/login?next=/settings");
  if (!session.battalion) return <DisabledAccount isAdmin={session.isAdmin} />;
  const b = session.battalion;

  const supabase = await createClient();
  const { data: used } = await supabase.from("events").select("plugah").eq("battalion_id", b.id).not("plugah", "is", null);
  const usedKeys = Array.from(new Set((used ?? []).map((r) => r.plugah as string)));

  return (
    <div className="min-h-[calc(100vh-64px)] bg-canvas">
      <section className="bg-pikud-navy-dark text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-7">
          <h1 className="font-black text-3xl leading-tight flex items-center gap-3">
            <Settings className="w-7 h-7 text-pikud-orange" /> הגדרות הגדוד
          </h1>
          <p className="text-white/60 mt-2">שם, לוגו, פלוגות, סוגי אירוע וכותרת הדיווחים של {b.name}. חל על כל המסכים של הגדוד.</p>
        </div>
      </section>
      <SettingsForm battalionName={b.name} logoUrl={b.logoUrl} settings={resolveSettings(b.settings, b.name)} usedKeys={usedKeys} />
    </div>
  );
}
