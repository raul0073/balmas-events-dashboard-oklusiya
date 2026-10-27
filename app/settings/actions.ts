"use server";

import { revalidatePath } from "next/cache";
import { loadSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { plugahKeyFor, type BattalionSettingsData, type PlugahDef } from "@/lib/battalion-settings";

export interface SettingsState {
  error?: string;
  ok?: boolean;
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function revalidate() {
  revalidatePath("/", "layout");
}

/** Name, plugot, crisis types and WhatsApp header. Runs as the battalion itself (RLS allows these columns). */
export async function saveBattalionSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const session = await loadSession();
  if (!session?.battalion) return { error: "נדרשת כניסה כגדוד" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "שם הגדוד לא יכול להיות ריק" };

  let plugotRaw: unknown;
  let crisisRaw: unknown;
  try {
    plugotRaw = JSON.parse(String(formData.get("plugot") ?? "[]"));
    crisisRaw = JSON.parse(String(formData.get("crisisTypes") ?? "[]"));
  } catch {
    return { error: "נתונים לא תקינים" };
  }

  const taken: string[] = [];
  const plugot: PlugahDef[] = (Array.isArray(plugotRaw) ? plugotRaw : [])
    .map((p: Partial<PlugahDef>) => {
      const label = String(p.label ?? "").trim();
      if (!label) return null;
      const key = String(p.key ?? "").trim() || plugahKeyFor(label, taken);
      taken.push(key);
      const color = /^#[0-9a-f]{6}$/i.test(String(p.color)) ? String(p.color) : "#37474F";
      return { key, label, color };
    })
    .filter((p): p is PlugahDef => p !== null);
  if (plugot.length === 0) return { error: "צריך לפחות פלוגה אחת" };
  if (new Set(plugot.map((p) => p.key)).size !== plugot.length) return { error: "מפתחות פלוגה כפולים" };

  const crisisTypes = (Array.isArray(crisisRaw) ? crisisRaw : []).map((t) => String(t).trim()).filter(Boolean);
  if (crisisTypes.length === 0) return { error: "צריך לפחות סוג אירוע אחד" };

  const settings: BattalionSettingsData = {
    plugot, crisisTypes,
    whatsappHeader: String(formData.get("whatsappHeader") ?? "").trim() || undefined,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("battalions").update({ name, settings }).eq("id", session.battalion.id);
  if (error) return { error: error.message };
  revalidate();
  return { ok: true };
}

/** Logo upload goes through the service role into the public "logos" bucket. */
export async function uploadBattalionLogo(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const session = await loadSession();
  if (!session?.battalion) return { error: "נדרשת כניסה כגדוד" };
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "בחר קובץ תמונה" };
  if (!file.type.startsWith("image/")) return { error: "הלוגו חייב להיות תמונה" };
  if (file.size > MAX_LOGO_BYTES) return { error: "הלוגו גדול מדי (עד 2MB)" };

  const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? ".png").toLowerCase();
  const key = `${session.battalion.id}/${Date.now().toString(36)}${ext}`;
  const admin = createAdminClient();
  const { error: upErr } = await admin.storage.from("logos").upload(key, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (upErr) return { error: `העלאה נכשלה: ${upErr.message}` };

  const url = `${SUPABASE_URL}/storage/v1/object/public/logos/${key}`;
  const { error } = await admin.from("battalions").update({ logo_url: url }).eq("id", session.battalion.id);
  if (error) return { error: error.message };
  revalidate();
  return { ok: true };
}

export async function removeBattalionLogo(): Promise<void> {
  const session = await loadSession();
  if (!session?.battalion) return;
  await createAdminClient().from("battalions").update({ logo_url: null }).eq("id", session.battalion.id);
  revalidate();
}
