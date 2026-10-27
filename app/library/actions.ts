"use server";

import { revalidatePath } from "next/cache";
import { loadSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export interface OfferState {
  error?: string;
  ok?: boolean;
}

/** "יש לי את זה": someone offers a wanted form. No file is uploaded; the admin follows up. */
export async function offerWanted(_prev: OfferState, formData: FormData): Promise<OfferState> {
  const wantedId = String(formData.get("wantedId") ?? "");
  const note     = String(formData.get("note") ?? "").trim().slice(0, 1000);
  const contact  = String(formData.get("contact") ?? "").trim().slice(0, 200);
  if (!wantedId) return { error: "חסר פריט" };

  const session = await loadSession();
  if (!session && !contact) return { error: "השאר דרך ליצור איתך קשר" };

  const admin = createAdminClient();
  const { data: wanted } = await admin.from("wanted_items").select("id, status").eq("id", wantedId).maybeSingle();
  if (!wanted || wanted.status !== "open") return { error: "הפריט כבר לא פתוח" };

  const { error } = await admin.from("wanted_offers").insert({
    wanted_id: wantedId,
    battalion_id: session?.battalion?.id ?? null,
    username: session?.username ?? null,
    contact: contact || null,
    note: note || null,
  });
  if (error) return { error: "השליחה נכשלה, נסה שוב" };
  revalidatePath("/admin/library");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
