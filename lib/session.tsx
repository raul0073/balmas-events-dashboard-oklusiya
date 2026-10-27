"use client";

import React, { createContext, useContext, useMemo } from "react";
import { resolveSettings, type BattalionSettingsData, type ResolvedSettings } from "@/lib/battalion-settings";

/** Per-battalion configuration as stored (partial); see lib/battalion-settings.ts. */
export type BattalionSettings = BattalionSettingsData;

export interface BattalionInfo {
  id: string;
  username: string;
  name: string;
  logoUrl: string | null;
  settings: BattalionSettings;
}

export interface SessionInfo {
  userId: string;
  username: string;
  isAdmin: boolean;
  /** null for admins and for disabled battalions */
  battalion: BattalionInfo | null;
}

const SessionContext = createContext<{ session: SessionInfo | null } | undefined>(undefined);

export function SessionProvider({ value, children }: { value: SessionInfo | null; children: React.ReactNode }) {
  return <SessionContext.Provider value={{ session: value }}>{children}</SessionContext.Provider>;
}

/** The signed-in session, or null for a visitor. */
export function useSession(): SessionInfo | null {
  const ctx = useContext(SessionContext);
  if (ctx === undefined) throw new Error("useSession must be used within SessionProvider");
  return ctx.session;
}

/** The signed-in battalion. Only call inside a protected tool, where the layout guarantees it. */
export function useBattalion(): BattalionInfo {
  const session = useSession();
  if (!session?.battalion) throw new Error("useBattalion called outside a battalion session");
  return session.battalion;
}

/** The battalion's plugot, crisis types and WhatsApp header, defaults filled in. */
export function useBattalionSettings(): ResolvedSettings {
  const b = useBattalion();
  return useMemo(() => resolveSettings(b.settings, b.name), [b.settings, b.name]);
}
