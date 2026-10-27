/**
 * Battalions sign in with a username. Supabase Auth needs an email underneath,
 * so every username maps to a synthetic address nobody ever sees.
 * Keep in sync with scripts/env.mjs.
 */
export const AUTH_EMAIL_DOMAIN = "battalions.local";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}
