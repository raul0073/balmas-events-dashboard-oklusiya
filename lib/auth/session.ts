import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BattalionInfo, SessionInfo } from "@/lib/session";

/** Loads the signed-in user and, for battalions, their battalion row. null when signed out. */
export async function loadSession(): Promise<SessionInfo | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") {
    // a cookie exists but the auth server rejects it (deleted user, revoked token, network)
    console.error("[session] getUser failed:", error.message);
  }
  if (!user) return null;

  const isAdmin  = user.app_metadata?.role === "admin";
  const username = String(user.user_metadata?.username ?? user.email?.split("@")[0] ?? "");

  let battalion: BattalionInfo | null = null;
  if (!isAdmin) {
    const { data } = await supabase
      .from("battalions")
      .select("id, username, name, logo_url, settings, active")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data && data.active) {
      battalion = {
        id: data.id,
        username: data.username,
        name: data.name,
        logoUrl: data.logo_url,
        settings: (data.settings ?? {}) as BattalionInfo["settings"],
      };
    }
  }

  return { userId: user.id, username, isAdmin, battalion };
}
