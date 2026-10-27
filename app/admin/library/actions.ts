"use server";

import { revalidatePath } from "next/cache";
import { loadSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/app/admin/actions";

const MAX_BYTES = 25 * 1024 * 1024;

async function requireAdmin() {
  const session = await loadSession();
  if (!session?.isAdmin) throw new Error("admin only");
}

function revalidate() {
  revalidatePath("/library/orange");
  revalidatePath("/library/green");
  revalidatePath("/admin/library");
}

function valid(space: string, category: string) {
  return (space === "orange" || space === "green") && ["forms", "guides", "other"].includes(category);
}

export async function uploadLibraryItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const file     = formData.get("file");
  const space    = String(formData.get("space") ?? "");
  const category = String(formData.get("category") ?? "");
  const title    = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!(file instanceof File) || file.size === 0) return { error: "בחר קובץ" };
  if (file.size > MAX_BYTES) return { error: "קובץ גדול מדי (עד 25MB)" };
  if (!valid(space, category)) return { error: "מרחב או קטגוריה לא תקינים" };

  const ext  = (file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase();
  const key  = `${space}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}${ext}`;
  const admin = createAdminClient();

  const { error: upErr } = await admin.storage.from("library").upload(key, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type || "application/octet-stream", upsert: false,
  });
  if (upErr) return { error: `העלאה נכשלה: ${upErr.message}` };

  const { data: last } = await admin.from("library_items").select("sort").eq("space", space).eq("category", category)
    .order("sort", { ascending: false }).limit(1).maybeSingle();

  const { error } = await admin.from("library_items").insert({
    space, category, title: title || file.name.replace(/\.[^.]+$/, ""), description,
    file_path: key, file_name: file.name, mime: file.type || "application/octet-stream",
    size_bytes: file.size, sort: (last?.sort ?? 0) + 1,
  });
  if (error) {
    await admin.storage.from("library").remove([key]);
    return { error: error.message };
  }
  revalidate();
  return { ok: true };
}

export async function updateLibraryItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id       = String(formData.get("id") ?? "");
  const space    = String(formData.get("space") ?? "");
  const category = String(formData.get("category") ?? "");
  const title    = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!id || !title) return { error: "חסרה כותרת" };
  if (!valid(space, category)) return { error: "מרחב או קטגוריה לא תקינים" };
  const { error } = await createAdminClient().from("library_items").update({ space, category, title, description }).eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return { ok: true };
}

export async function moveLibraryItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const id  = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "") === "up" ? -1 : 1;
  const admin = createAdminClient();
  const { data: me } = await admin.from("library_items").select("id, space, category, sort").eq("id", id).maybeSingle();
  if (!me) return;
  const { data: siblings } = await admin.from("library_items").select("id, sort").eq("space", me.space).eq("category", me.category)
    .order("sort").order("created_at");
  if (!siblings) return;
  const idx = siblings.findIndex((s) => s.id === id);
  const other = siblings[idx + dir];
  if (!other) return;
  // renumber the whole group so ties never block a move
  const reordered = siblings.slice();
  [reordered[idx], reordered[idx + dir]] = [reordered[idx + dir], reordered[idx]];
  await Promise.all(reordered.map((s, i) => admin.from("library_items").update({ sort: i + 1 }).eq("id", s.id)));
  revalidate();
}

export async function deleteLibraryItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const admin = createAdminClient();
  const { data } = await admin.from("library_items").select("file_path").eq("id", id).maybeSingle();
  await admin.from("library_items").delete().eq("id", id);
  if (data?.file_path) await admin.storage.from("library").remove([data.file_path]);
  revalidate();
}
