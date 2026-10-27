"use client";

import Link from "next/link";
import { Inbox, Trash2, Lightbulb, Bug, HelpCircle, MessageSquare, Building2, UserCircle2, Link2 } from "lucide-react";
import { FEEDBACK_STATUS, kindLabel, type FeedbackStatus } from "@/lib/feedback";
import { deleteFeedback, setFeedbackStatus } from "@/app/admin/actions";

export interface FeedbackItem {
  id: string;
  kind: string;
  subject: string;
  message: string;
  contact: string | null;
  page: string | null;
  status: FeedbackStatus;
  username: string | null;
  battalionName: string | null;
  createdAt: string;
}

const KIND_ICON: Record<string, React.ReactNode> = {
  feature:  <Lightbulb className="w-4 h-4" />,
  bug:      <Bug className="w-4 h-4" />,
  question: <HelpCircle className="w-4 h-4" />,
  other:    <MessageSquare className="w-4 h-4" />,
};

const KIND_TONE: Record<string, string> = {
  feature:  "bg-amber-100 text-amber-800",
  bug:      "bg-red-100 text-red-700",
  question: "bg-blue-100 text-blue-800",
  other:    "bg-surface-2 text-ink-soft",
};

const STATUS_TONE: Record<FeedbackStatus, string> = {
  new:  "bg-pikud-orange text-white",
  seen: "bg-ink/10 text-ink",
  done: "bg-green-100 text-green-700",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "open", label: "פתוחות" },
  { value: "new",  label: "חדשות" },
  { value: "seen", label: "נקראו" },
  { value: "done", label: "טופלו" },
];

function when(iso: string): string {
  return new Date(iso).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function FeedbackList({ items, filter }: { items: FeedbackItem[]; filter: string }) {
  return (
    <div className="bg-pikud-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          <h2 className="text-ink font-black text-2xl lg:hidden">פניות</h2>
          <p className="text-pikud-gray-mid text-sm">בקשות, תקלות ושאלות שנשלחו מהכפתור &quot;משוב ובקשות&quot;.</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <Link key={f.value} href={f.value === "open" ? "/admin/feedback" : `/admin/feedback?status=${f.value}`}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === f.value ? "bg-pikud-navy text-white" : "bg-surface text-ink border border-pikud-gray-light hover:border-ink"
                }`}>
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-surface rounded-xl border border-pikud-gray-light px-5 py-12 text-center">
            <Inbox className="w-10 h-10 text-pikud-gray-mid mx-auto mb-3" />
            <p className="text-ink font-bold">אין פניות</p>
            <p className="text-pikud-gray-mid text-sm mt-1">כשמישהו ישלח משוב, הוא יופיע כאן.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((f) => (
              <li key={f.id} className={`bg-surface rounded-xl border shadow-sm p-4 sm:p-5 ${f.status === "new" ? "border-pikud-orange/40" : "border-pikud-gray-light"}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${KIND_TONE[f.kind] ?? KIND_TONE.other}`}>
                      {KIND_ICON[f.kind] ?? KIND_ICON.other} {kindLabel(f.kind)}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_TONE[f.status]}`}>
                      {FEEDBACK_STATUS.find((s) => s.value === f.status)?.label}
                    </span>
                    <span className="text-xs text-pikud-gray-mid">{when(f.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {FEEDBACK_STATUS.filter((s) => s.value !== f.status).map((s) => (
                      <form key={s.value} action={setFeedbackStatus}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="status" value={s.value} />
                        <button type="submit"
                          className="text-xs font-semibold px-2.5 py-1 rounded-md border border-pikud-gray-light text-ink hover:bg-pikud-cream">
                          סמן {s.label}
                        </button>
                      </form>
                    ))}
                    <form action={deleteFeedback}>
                      <input type="hidden" name="id" value={f.id} />
                      <button type="submit" aria-label="מחק" title="מחק" className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>

                <h3 className="font-bold text-ink mt-3">{f.subject}</h3>
                <p className="text-sm text-ink-soft whitespace-pre-wrap leading-relaxed mt-1">{f.message}</p>

                <div className="flex items-center gap-4 flex-wrap mt-3 text-xs text-pikud-gray-mid">
                  <span className="inline-flex items-center gap-1">
                    {f.battalionName ? <Building2 className="w-3.5 h-3.5" /> : <UserCircle2 className="w-3.5 h-3.5" />}
                    {f.battalionName ?? (f.username ? `${f.username} (מנהל)` : "אורח")}
                    {f.username && f.battalionName && <span dir="ltr" className="font-mono">· {f.username}</span>}
                  </span>
                  {f.contact && <span>יצירת קשר: <strong className="text-ink">{f.contact}</strong></span>}
                  {f.page && <span className="inline-flex items-center gap-1 font-mono" dir="ltr"><Link2 className="w-3.5 h-3.5" /> {f.page}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
