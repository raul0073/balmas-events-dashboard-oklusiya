"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import logo from "@/app/assets/logo_gdod_996.png";
import { useEvents } from "@/lib/events-context";
import { useLogs } from "@/lib/logger";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function Navbar() {
  const router = useRouter();
  const { clearAll } = useEvents();
  const { clearLogs } = useLogs();
  const [clearOpen, setClearOpen]     = useState(false);
  const [deleteLogs, setDeleteLogs]   = useState(true);

  function openWhatsApp() {
    const width = 500, height = 700;
    const left  = window.screen.width - width - 20;
    window.open("https://web.whatsapp.com", "whatsapp",
      `width=${width},height=${height},left=${left},top=80,resizable=yes,scrollbars=yes`);
  }

  function handleConfirmClear() {
    clearAll(); // always clears events (also clears crisis-logs via clearAll)
    if (deleteLogs) clearLogs();
  }

  return (
    <>
      <nav className="bg-pikud-navy text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            <button onClick={() => router.push("/")} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="bg-pikud-orange rounded-lg p-0.5 w-12 h-auto">
                <Image src={logo} alt="logo" width={500} height={500} className="w-full h-full" />
              </div>
              <div className="text-right">
                <div className="font-bold text-base leading-tight">{`חמ"ל אוכלוסייה`}</div>
                <div className="text-white/50 text-xs">{`גדוד 996 | פיקוד העורף`}</div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/logs")}
                className="flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/10">
                <ScrollText className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-semibold">יומן פעולות</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setClearOpen(true)}
                className="flex items-center gap-1.5 text-red-400 hover:text-white hover:bg-red-600">
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-semibold">אפס הכל</span>
              </Button>
            </div>

          </div>
        </div>
      </nav>

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={handleConfirmClear}
        title="איפוס מערכת"
        description="פעולה זו תמחק את כל האירועים והנתונים לצמיתות. לא ניתן לשחזר. האם אתה בטוח?"
        confirmLabel="מחק הכל"
        cancelLabel="ביטול"
        checkbox={{
          label: "מחק גם את יומן הפעולות",
          checked: deleteLogs,
          onChange: setDeleteLogs,
        }}
      />
    </>
  );
}