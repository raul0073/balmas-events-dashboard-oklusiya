import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_URL } from "@/lib/supabase/env";
import type { ToolTone } from "@/lib/tools";
import type { LibraryItem } from "./types";

interface Row {
  id: string; space: string; category: string; title: string; description: string;
  file_path: string; file_name: string; mime: string; size_bytes: number; sort: number; updated_at: string;
}

export function publicUrl(filePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/library/${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

function toItem(r: Row): LibraryItem {
  return {
    id: r.id, space: r.space as ToolTone, category: r.category as LibraryItem["category"],
    title: r.title, description: r.description ?? "", filePath: r.file_path, fileName: r.file_name,
    mime: r.mime, sizeBytes: r.size_bytes ?? 0, sort: r.sort ?? 0, updatedAt: r.updated_at,
    url: publicUrl(r.file_path),
  };
}

/** Published items of one space, for the public page (anon read). */
export async function loadLibrary(space: ToolTone): Promise<LibraryItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("library_items").select("*").eq("space", space)
    .order("category").order("sort").order("created_at");
  return ((data ?? []) as Row[]).map(toItem);
}

/** Every item, for the admin page. */
export async function loadAllLibrary(): Promise<LibraryItem[]> {
  const { data } = await createAdminClient().from("library_items").select("*")
    .order("space").order("category").order("sort").order("created_at");
  return ((data ?? []) as Row[]).map(toItem);
}
