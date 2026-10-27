"use server";

import { revalidatePath } from "next/cache";
import { loadSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/app/admin/actions";

async function requireAdmin() {
  const session = await loadSession();
  if (!session?.isAdmin) throw new Error("admin only");
}

function revalidate() {
  revalidatePath("/library/orange");
  revalidatePath("/library/green");
  revalidatePath("/admin/library");
  revalidatePath("/admin", "layout");
}

export async function createWanted(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const space = String(formData.get("space") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (space !== "orange" && space !== "green") return { error: "מרחב לא תקין" };
  if (!title) return { error: "יש להזין כותרת" };
  const { error } = await createAdminClient().from("wanted_items").insert({ space, title, description });
  if (error) return { error: error.message };
  revalidate();
  return { ok: true };
}

export async function setWantedStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["open", "received"].includes(status)) return;
  await createAdminClient().from("wanted_items").update({ status }).eq("id", id);
  revalidate();
}

export async function deleteWanted(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await createAdminClient().from("wanted_items").delete().eq("id", id);
  revalidate();
}

export async function setOfferStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["new", "handled"].includes(status)) return;
  await createAdminClient().from("wanted_offers").update({ status }).eq("id", id);
  revalidate();
}
