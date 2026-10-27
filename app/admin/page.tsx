import { createAdminClient } from "@/lib/supabase/admin";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const admin = createAdminClient();
  const { data: battalions } = await admin
    .from("battalions")
    .select("id, username, name, active, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto bg-pikud-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-pikud-navy font-black text-2xl mb-1">ניהול גדודים</h1>
        <p className="text-pikud-gray-mid text-sm mb-6">יצירה, איפוס סיסמה והשבתה של חשבונות גדודים יגיעו בשלב 3.</p>

        <div className="bg-white rounded-xl border border-pikud-gray-light shadow-sm overflow-hidden">
          <div className="bg-pikud-navy px-5 py-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-pikud-orange" />
            <span className="text-white font-bold text-sm">גדודים ({battalions?.length ?? 0})</span>
          </div>
          {!battalions || battalions.length === 0 ? (
            <p className="px-5 py-8 text-center text-pikud-gray-mid text-sm">אין גדודים עדיין</p>
          ) : (
            <ul className="divide-y divide-pikud-gray-light">
              {battalions.map((b) => (
                <li key={b.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-pikud-navy">{b.name}</p>
                    <p className="text-xs text-pikud-gray-mid" dir="ltr">{b.username}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {b.active ? "פעיל" : "מושבת"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
