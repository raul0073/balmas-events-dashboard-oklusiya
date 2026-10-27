"use client";

import { useActionState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { useSession } from "@/lib/session";
import { FEEDBACK_KINDS } from "@/lib/feedback";
import { sendFeedback, type FeedbackState } from "@/app/feedback/actions";

interface Props { open: boolean; onClose: () => void; }

export default function FeedbackDialog({ open, onClose }: Props) {
  const session  = useSession();
  const pathname = usePathname();
  const [state, formAction, pending] = useActionState<FeedbackState, FormData>(sendFeedback, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { if (state.ok) formRef.current?.reset(); }, [state]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const who = session?.battalion?.name ?? (session?.isAdmin ? "מנהל המערכת" : null);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-pikud-navy/60 backdrop-blur-sm px-4"
      role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        <div className="bg-pikud-navy px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-pikud-orange rounded-lg p-2"><MessageSquarePlus className="w-5 h-5 text-white" /></div>
            <div>
              <h2 id="feedback-title" className="text-white font-bold text-lg">משוב ובקשות</h2>
              <p className="text-white/60 text-sm">רעיון, תקלה או שאלה — נשמח לשמוע</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="סגור" className="text-white/60 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {state.ok ? (
          <div className="p-6 space-y-5 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-ink font-bold text-lg">הפנייה נשלחה</p>
            <p className="text-sm text-pikud-gray-mid">תודה. הפניות נקראות על ידי מנהל המערכת.</p>
            <Button variant="outline" className="w-full h-11" onClick={onClose}>סגור</Button>
          </div>
        ) : (
          <form ref={formRef} action={formAction} className="p-6 space-y-4 overflow-y-auto">
            <input type="hidden" name="page" value={pathname} />

            <div className="space-y-1.5">
              <Label htmlFor="fb-kind">סוג הפנייה *</Label>
              <Select id="fb-kind" name="kind" required defaultValue="feature" className="h-11">
                {FEEDBACK_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-subject">נושא *</Label>
              <Input id="fb-subject" name="subject" required maxLength={120} autoFocus placeholder="במשפט אחד" className="h-11" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-message">פירוט *</Label>
              <Textarea id="fb-message" name="message" required maxLength={4000} rows={5}
                placeholder="מה רצית שיקרה, מה קרה בפועל, באיזה מסך" className="min-h-[120px]" />
            </div>

            {who ? (
              <p className="text-xs text-pikud-gray-mid">נשלח בשם <strong className="text-ink">{who}</strong></p>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="fb-contact">איך לחזור אליך (לא חובה)</Label>
                <Input id="fb-contact" name="contact" maxLength={120} placeholder="שם, גדוד, טלפון או מייל" className="h-11" />
              </div>
            )}

            {state.error && (
              <p role="alert" className="text-red-600 text-sm flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {state.error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" variant="orange" disabled={pending} className="flex-1 h-11 text-base font-bold flex items-center gap-2">
                {pending && <Loader2 className="w-4 h-4 animate-spin" />} שלח
              </Button>
              <Button type="button" variant="outline" className="h-11" onClick={onClose}>ביטול</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
