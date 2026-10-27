"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/** Supabase client for client components. One instance per browser tab. */
export function createClient() {
  if (!browserClient) browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return browserClient;
}
