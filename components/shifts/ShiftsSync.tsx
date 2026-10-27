"use client";

import { useEffect, useMemo, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useBattalion } from "@/lib/session";
import { pickData, useApp, type DataSlice } from "@/lib/shifts/store";

interface Row { battalion_id: string; data: DataSlice | null; client_id: string | null; updated_at: string }

const SAVE_DELAY = 800;

/**
 * Keeps the shifts store in step with the battalion's row:
 * loads it once, saves every change after a short pause, and pulls in
 * changes other screens of the same battalion make.
 */
export default function ShiftsSync() {
  const battalion = useBattalion();
  const supabase  = useMemo(() => createClient(), []);
  const clientId  = useRef(crypto.randomUUID());
  const applying  = useRef(false);
  const timer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { importAll, setHydrated } = useApp.getState();

    supabase.from("shifts_state").select("data").eq("battalion_id", battalion.id).maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        applying.current = true;
        if (data?.data && Object.keys(data.data).length) importAll(data.data as Partial<DataSlice>);
        applying.current = false;
        setHydrated(true);
      });

    // save on change, debounced, skipping changes we just pulled from the server
    const unsub = useApp.subscribe((state, prev) => {
      if (!state.hydrated || applying.current) return;
      const a = pickData(state), b = pickData(prev);
      if ((Object.keys(a) as (keyof DataSlice)[]).every((k) => a[k] === b[k])) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const { error } = await supabase.from("shifts_state").upsert({
          battalion_id: battalion.id,
          data: pickData(useApp.getState()),
          client_id: clientId.current,
          updated_at: new Date().toISOString(),
        }, { onConflict: "battalion_id" });
        if (error) console.error("[shifts] save failed:", error.message);
      }, SAVE_DELAY);
    });

    const channel = supabase
      .channel(`shifts:${battalion.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "shifts_state", filter: `battalion_id=eq.${battalion.id}` },
        (payload: RealtimePostgresChangesPayload<Row>) => {
          const row = payload.new as Partial<Row>;
          if (!row?.data || row.client_id === clientId.current) return;
          applying.current = true;
          useApp.getState().importAll(row.data);
          applying.current = false;
        })
      .subscribe();

    return () => {
      cancelled = true;
      unsub();
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
      useApp.getState().setHydrated(false);
    };
  }, [supabase, battalion.id]);

  return null;
}
