// Shared helpers for the maintenance scripts. Reads .env.local (never committed).
import { existsSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    try { process.loadEnvFile(file); } catch { /* ignore */ }
  }
}

// People paste the REST endpoint by mistake; the clients need the project origin only.
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/(\.supabase\.co)\/.*$/, "$1");
}

export function need(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name} in .env.local`);
    process.exit(1);
  }
  return v;
}

export function projectRef() {
  const url = need("NEXT_PUBLIC_SUPABASE_URL");
  const m = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/);
  if (!m) { console.error(`NEXT_PUBLIC_SUPABASE_URL is not a supabase.co url: ${url}`); process.exit(1); }
  return m[1];
}

/** Username → the synthetic email stored in Supabase Auth. Mirrors lib/auth/username.ts. */
export const AUTH_EMAIL_DOMAIN = "battalions.local";
export function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}
