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

const SessionContext = createContext<SessionInfo | null>(null);

export function SessionProvider({ value, children }: { value: SessionInfo; children: React.ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionInfo {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
