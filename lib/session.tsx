"use client";

import React, { createContext, useContext } from "react";

/** Per-battalion configuration. Filled in by the settings page (stage 4). */
export interface BattalionSettings {
  [key: string]: unknown;
}

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
