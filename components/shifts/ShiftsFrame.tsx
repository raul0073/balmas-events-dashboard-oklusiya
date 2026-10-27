"use client";

import { Loader2 } from "lucide-react";
import { useT } from "@/lib/shifts/i18n";
import { useMounted } from "@/lib/shifts/store";

/** Direction follows the organizer's own language switch; a spinner shows until the battalion row is in. */
export default function ShiftsFrame({ children }: { children: React.ReactNode }) {
  const { dir } = useT();
  const hydrated = useMounted();

  return (
    <div dir={dir} className="min-h-[calc(100vh-64px)] bg-paper">
      {hydrated ? (
        <div className="px-4 pb-8 pt-4 md:px-6">{children}</div>
      ) : (
        <div className="flex items-center justify-center py-24 text-ink-muted gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> טוען…
        </div>
      )}
    </div>
  );
}
