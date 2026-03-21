"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CrisisEvent } from "@/types";

interface EventsContextType {
  events: CrisisEvent[];
  addEvent: (event: CrisisEvent) => void;
  updateEvent: (event: CrisisEvent) => void;
  deleteEvent: (id: string) => void;
  getEvent: (id: string) => CrisisEvent | undefined;
  clearAll: () => void;
}

const EventsContext = createContext<EventsContextType | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CrisisEvent[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("crisis-events");
    if (stored) {
      try {
        setEvents(JSON.parse(stored));
      } catch {
        setEvents([]);
      }
    }
  }, []);

  const persist = useCallback((evts: CrisisEvent[]) => {
    setEvents(evts);
    localStorage.setItem("crisis-events", JSON.stringify(evts));
  }, []);

  const addEvent = useCallback((event: CrisisEvent) => {
    setEvents((prev) => {
      const next = [event, ...prev];
      localStorage.setItem("crisis-events", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateEvent = useCallback((event: CrisisEvent) => {
    setEvents((prev) => {
      const next = prev.map((e) => (e.id === event.id ? event : e));
      localStorage.setItem("crisis-events", JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      localStorage.setItem("crisis-events", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setEvents([]);
    localStorage.removeItem("crisis-events");
    localStorage.removeItem("crisis-logs");
  }, []);

  const getEvent = useCallback(
    (id: string) => events.find((e) => e.id === id),
    [events]
  );

  return (
    <EventsContext.Provider value={{ events, addEvent, updateEvent, deleteEvent, getEvent, clearAll }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within EventsProvider");
  return ctx;
}
