"use server";

import { loadSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { FEEDBACK_KINDS, type FeedbackKind } from "@/lib/feedback";

export interface FeedbackState {
  error?: string;
  ok?: boolean;
}

const MAX_SUBJECT = 120;
const MAX_MESSAGE = 4000;

export async function sendFeedback(_prev: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const kind    = String(formData.get("kind") ?? "") as FeedbackKind;
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const page    = String(formData.get("page") ?? "").trim().slice(0, 200);

  if (!FEEDBACK_KINDS.some((k) => k.value === kind)) return { error: "בחר סוג פנייה" };
  if (!subject) return { error: "יש להזין נושא" };
  if (!message) return { error: "יש לכתוב את תוכן הפנייה" };
  if (subject.length > MAX_SUBJECT) return { error: `נושא: עד ${MAX_SUBJECT} תווים` };
  if (message.length > MAX_MESSAGE) return { error: `תוכן: עד ${MAX_MESSAGE} תווים` };

  const session = await loadSession();
  const admin = createAdminClient();
  const { error } = await admin.from("feedback").insert({
    battalion_id: session?.battalion?.id ?? null,
    username: session?.username ?? null,
    kind, subject, message,
    contact: contact || null,
    page: page || null,
  });
  if (error) return { error: "השליחה נכשלה, נסה שוב" };
  return { ok: true };
}
