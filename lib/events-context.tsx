"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { CrisisEvent } from "@/types";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useSession } from "@/lib/session";
import { eventToRow, rowToEvent, type EventRow } from "@/lib/events/db";

interface EventsContextType {
  events: CrisisEvent[];
  /** false until the first load from the server finished */
  loaded: boolean;
  error: string | null;
  addEvent: (event: CrisisEvent) => Promise<void>;
  updateEvent: (event: CrisisEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEvent: (id: string) => CrisisEvent | undefined;
  /** deletes every event of the battalion */
  clearAll: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | null>(null);

function upsert(list: CrisisEvent[], e: CrisisEvent): CrisisEvent[] {
  const idx = list.findIndex((x) => x.id === e.id);
  if (idx === -1) return [e, ...list];
  const next = list.slice();
  next[idx] = e;
  return next;
}

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const battalionId = session?.battalion?.id ?? null;
  const supabase = useMemo(() => createClient(), []);

  const [events, setEvents] = useState<CrisisEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // initial load + realtime subscription, scoped to the battalion
  useEffect(() => {
    if (!battalionId) { setLoaded(true); return; }
    let cancelled = false;

    supabase
      .from("events")
      .select("*")
      .eq("battalion_id", battalionId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setEvents((data as EventRow[]).map(rowToEvent));
        setLoaded(true);
      });

    const channel = supabase
      .channel(`events:${battalionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `battalion_id=eq.${battalionId}` },
        (payload: RealtimePostgresChangesPayload<EventRow>) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as Partial<EventRow>).id;
            if (id) setEvents((prev) => prev.filter((e) => e.id !== id));
          } else {
            setEvents((prev) => upsert(prev, rowToEvent(payload.new as EventRow)));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, battalionId]);

  const addEvent = useCallback(async (event: CrisisEvent) => {
    if (!battalionId) return;
    setEvents((prev) => upsert(prev, event));
    const { error } = await supabase.from("events").insert(eventToRow(event, battalionId));
    if (error) {
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      throw new Error(error.message);
    }
  }, [supabase, battalionId]);

  const updateEvent = useCallback(async (event: CrisisEvent) => {
    if (!battalionId) return;
    setEvents((prev) => upsert(prev, event));
    const { id, battalion_id: _b, created_at: _c, ...patch } = eventToRow(event, battalionId);
    const { error } = await supabase.from("events").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  }, [supabase, battalionId]);

  const deleteEvent = useCallback(async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }, [supabase]);

  const clearAll = useCallback(async () => {
    if (!battalionId) return;
    setEvents([]);
    const { error } = await supabase.from("events").delete().eq("battalion_id", battalionId);
    if (error) throw new Error(error.message);
  }, [supabase, battalionId]);

  const getEvent = useCallback((id: string) => events.find((e) => e.id === id), [events]);

  return (
    <EventsContext.Provider value={{ events, loaded, error, addEvent, updateEvent, deleteEvent, getEvent, clearAll }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within EventsProvider");
  return ctx;
}
