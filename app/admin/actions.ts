"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { loadSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { USERNAME_PATTERN, normalizeUsername, usernameToEmail } from "@/lib/auth/username";
import { normalizeChecklist } from "@/lib/checklist/types";

export interface ActionState {
  error?: string;
  /** a freshly set password, shown once */
  password?: string;
  username?: string;
  ok?: boolean;
}

async function requireAdmin() {
  const session = await loadSession();
  if (!session?.isAdmin) throw new Error("admin only");
}

function generatePassword(): string {
  // 12 chars, unambiguous, easy to read out loud in a HAMAL
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function pickPassword(raw: FormDataEntryValue | null): { password: string } | { error: string } {
  const typed = typeof raw === "string" ? raw.trim() : "";
  if (!typed) return { password: generatePassword() };
  if (typed.length < 8) return { error: "סיסמה: לפחות 8 תווים" };
  return { password: typed };
}

export async function createBattalion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const name     = String(formData.get("name") ?? "").trim();
  if (!USERNAME_PATTERN.test(username)) return { error: "שם משתמש: 3–32 תווים, אותיות לטיניות קטנות, ספרות או _" };
  if (!name) return { error: "יש להזין שם גדוד" };
  const pw = pickPassword(formData.get("password"));
  if ("error" in pw) return { error: pw.error };

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password: pw.password,
    email_confirm: true,
    app_metadata: { role: "battalion" },
    user_metadata: { username },
  });
  if (error) return { error: error.message.includes("already") ? "שם המשתמש תפוס" : error.message };

  const { error: rowErr } = await admin.from("battalions").insert({ user_id: created.user.id, username, name });
  if (rowErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: rowErr.message.includes("unique") ? "שם המשתמש תפוס" : rowErr.message };
  }

  revalidatePath("/admin");
  return { ok: true, username, password: pw.password };
}

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "חסר מזהה" };
  const pw = pickPassword(formData.get("password"));
  if ("error" in pw) return { error: pw.error };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.updateUserById(userId, { password: pw.password });
  if (error) return { error: error.message };
  return { ok: true, username: String(data.user.user_metadata?.username ?? ""), password: pw.password };
}

export async function renameBattalion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id   = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return { error: "יש להזין שם" };
  const admin = createAdminClient();
  const { error } = await admin.from("battalions").update({ name }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function setBattalionActive(formData: FormData): Promise<void> {
  await requireAdmin();
  const id     = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  const admin  = createAdminClient();
  await admin.from("battalions").update({ active }).eq("id", id);
  revalidatePath("/admin");
}

export async function setFeedbackStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const id     = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["new", "seen", "done"].includes(status)) return;
  const admin = createAdminClient();
  await admin.from("feedback").update({ status }).eq("id", id);
  revalidatePath("/admin/feedback");
  revalidatePath("/admin", "layout");
}

export async function deleteFeedback(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("feedback").delete().eq("id", id);
  revalidatePath("/admin/feedback");
  revalidatePath("/admin", "layout");
}

export async function saveChecklist(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  let parsed: unknown;
  try { parsed = JSON.parse(String(formData.get("content") ?? "")); } catch { return { error: "תוכן לא תקין" }; }
  const content = normalizeChecklist(parsed);
  if (!content.title) return { error: "חסרה כותרת" };
  const admin = createAdminClient();
  const { error } = await admin.from("site_content")
    .upsert({ key: "checklist", data: content, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { error: error.message };
  revalidatePath("/checklist");
  revalidatePath("/admin/checklist");
  return { ok: true };
}

export async function deleteBattalion(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  const admin = createAdminClient();
  // deleting the auth user cascades to the battalions row, its events and its logs
  await admin.auth.admin.deleteUser(userId);
  revalidatePath("/admin");
}
