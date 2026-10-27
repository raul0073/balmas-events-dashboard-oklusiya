import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ToolTone } from "@/lib/tools";
import type { LibraryCategory, LibraryItem } from "./types";

interface Row {
  id: string; space: string; category: string; title: string; description: string;
  file_path: string; file_name: string; mime: string; size_bytes: number; sort: number; updated_at: string;
}

/** Categories open to visitors; everything else needs a signed-in battalion. */
export const PUBLIC_CATEGORIES: LibraryCategory[] = ["guides"];

const LINK_TTL_SECONDS = 60 * 60;

/** Rows to items with signed links (the bucket is private). */
async function withLinks(rows: Row[]): Promise<LibraryItem[]> {
  if (rows.length === 0) return [];
  const admin = createAdminClient();
  const { data: signed } = await admin.storage.from("library").createSignedUrls(rows.map((r) => r.file_path), LINK_TTL_SECONDS);
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return rows.map((r) => ({
    id: r.id, space: r.space as ToolTone, category: r.category as LibraryCategory,
    title: r.title, description: r.description ?? "", filePath: r.file_path, fileName: r.file_name,
    mime: r.mime, sizeBytes: r.size_bytes ?? 0, sort: r.sort ?? 0, updatedAt: r.updated_at,
    url: urlByPath.get(r.file_path) ?? "",
  }));
}

/**
 * Items of one space for the public page. Visitors get the public categories only;
 * `lockedCounts` says how many items per category were held back, so the page can say so.
 */
export async function loadLibrary(space: ToolTone, signedIn: boolean): Promise<{ items: LibraryItem[]; lockedCounts: Partial<Record<LibraryCategory, number>> }> {
  const { data } = await createAdminClient().from("library_items").select("*").eq("space", space)
    .order("category").order("sort").order("created_at");
  const rows = (data ?? []) as Row[];
  const allowed = signedIn ? rows : rows.filter((r) => PUBLIC_CATEGORIES.includes(r.category as LibraryCategory));
  const lockedCounts: Partial<Record<LibraryCategory, number>> = {};
  if (!signedIn) {
    for (const r of rows) {
      if (!PUBLIC_CATEGORIES.includes(r.category as LibraryCategory)) {
        const c = r.category as LibraryCategory;
        lockedCounts[c] = (lockedCounts[c] ?? 0) + 1;
      }
    }
  }
  return { items: await withLinks(allowed), lockedCounts };
}

/** Every item, for the admin page. */
export async function loadAllLibrary(): Promise<LibraryItem[]> {
  const { data } = await createAdminClient().from("library_items").select("*")
    .order("space").order("category").order("sort").order("created_at");
  return withLinks((data ?? []) as Row[]);
}
