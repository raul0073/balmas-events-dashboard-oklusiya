import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ToolTone } from "@/lib/tools";

export interface WantedItem {
  id: string;
  space: ToolTone;
  title: string;
  description: string;
  status: "open" | "received";
  sort: number;
  createdAt: string;
}

export interface WantedOffer {
  id: string;
  wantedId: string;
  battalionName: string | null;
  username: string | null;
  contact: string | null;
  note: string | null;
  status: "new" | "handled";
  createdAt: string;
}

interface ItemRow { id: string; space: string; title: string; description: string; status: string; sort: number; created_at: string }
interface OfferRow { id: string; wanted_id: string; username: string | null; contact: string | null; note: string | null; status: string; created_at: string; battalions: { name: string } | null }

function toItem(r: ItemRow): WantedItem {
  return { id: r.id, space: r.space as ToolTone, title: r.title, description: r.description ?? "", status: r.status as WantedItem["status"], sort: r.sort ?? 0, createdAt: r.created_at };
}

/** Open wanted items of one space, for the public library page. */
export async function loadOpenWanted(space: ToolTone): Promise<WantedItem[]> {
  const { data } = await createAdminClient().from("wanted_items").select("*").eq("space", space).eq("status", "open").order("sort").order("created_at");
  return ((data ?? []) as ItemRow[]).map(toItem);
}

/** Everything plus offers, for the admin page. */
export async function loadWantedWithOffers(): Promise<{ items: WantedItem[]; offers: WantedOffer[] }> {
  const admin = createAdminClient();
  const [{ data: items }, { data: offers }] = await Promise.all([
    admin.from("wanted_items").select("*").order("space").order("status").order("sort").order("created_at"),
    admin.from("wanted_offers").select("id, wanted_id, username, contact, note, status, created_at, battalions(name)").order("created_at", { ascending: false }),
  ]);
  return {
    items: ((items ?? []) as ItemRow[]).map(toItem),
    offers: ((offers ?? []) as unknown as OfferRow[]).map((o) => ({
      id: o.id, wantedId: o.wanted_id, battalionName: o.battalions?.name ?? null, username: o.username,
      contact: o.contact, note: o.note, status: o.status as WantedOffer["status"], createdAt: o.created_at,
    })),
  };
}

export async function countNewOffers(): Promise<number> {
  const { count } = await createAdminClient().from("wanted_offers").select("id", { count: "exact", head: true }).eq("status", "new");
  return count ?? 0;
}
