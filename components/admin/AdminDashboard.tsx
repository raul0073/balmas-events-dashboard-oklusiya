"use client";

import { useState } from "react";
import { Building2, Plus, Users, Activity, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateBattalionDialog from "./CreateBattalionDialog";
import BattalionRow from "./BattalionRow";

export interface BattalionSummary {
  id: string;
  userId: string;
  username: string;
  name: string;
  active: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  eventCount: number;
  logCount: number;
  lastActivityAt: string | null;
}

export default function AdminDashboard({ battalions }: { battalions: BattalionSummary[] }) {
  const [createOpen, setCreateOpen] = useState(false);

  const active   = battalions.filter((b) => b.active).length;
  const disabled = battalions.length - active;
  const events   = battalions.reduce((s, b) => s + b.eventCount, 0);

  return (
    <div className="bg-pikud-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h2 className="text-pikud-navy font-black text-2xl lg:hidden">ניהול גדודים</h2>
            <p className="text-pikud-gray-mid text-sm mt-1">כל חשבון הוא גדוד אחד. פרטי הכניסה משותפים לכל חמ&quot;ל הגדוד.</p>
          </div>
          <Button variant="orange" onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> גדוד חדש
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat icon={<Building2 className="w-4 h-4" />} label="גדודים" value={battalions.length} />
          <Stat icon={<Users className="w-4 h-4" />} label="פעילים" value={active} tone="green" />
          <Stat icon={<ShieldOff className="w-4 h-4" />} label="מושבתים" value={disabled} tone={disabled ? "gray" : undefined} />
          <Stat icon={<Activity className="w-4 h-4" />} label="אירועים בכל המערכת" value={events} />
        </div>

        <div className="bg-white rounded-xl border border-pikud-gray-light shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_1fr_0.7fr_auto] gap-3 px-5 py-2.5 bg-pikud-cream border-b border-pikud-gray-light text-xs font-bold text-pikud-navy">
            <span>גדוד</span>
            <span>כניסה אחרונה</span>
            <span>פעילות אחרונה</span>
            <span>אירועים / יומן</span>
            <span>מצב</span>
            <span className="w-24" />
          </div>
          {battalions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Building2 className="w-10 h-10 text-pikud-gray-mid mx-auto mb-3" />
              <p className="text-pikud-navy font-bold">אין גדודים עדיין</p>
              <p className="text-pikud-gray-mid text-sm mt-1">צור את הגדוד הראשון כדי לתת לו פרטי כניסה</p>
            </div>
          ) : (
            <ul className="divide-y divide-pikud-gray-light">
              {battalions.map((b) => <BattalionRow key={b.id} battalion={b} />)}
            </ul>
          )}
        </div>
      </div>

      <CreateBattalionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: "green" | "gray" }) {
  const color = tone === "green" ? "text-green-700" : tone === "gray" ? "text-gray-500" : "text-pikud-navy";
  return (
    <div className="bg-white rounded-xl border border-pikud-gray-light px-4 py-3 flex items-center gap-3">
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-pikud-orange/10 text-pikud-orange-dark">{icon}</span>
      <div>
        <p className={`text-xl font-black leading-tight ${color}`}>{value}</p>
        <p className="text-xs text-pikud-gray-mid">{label}</p>
      </div>
    </div>
  );
}
