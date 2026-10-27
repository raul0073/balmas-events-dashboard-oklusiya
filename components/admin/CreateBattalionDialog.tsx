"use client";

import { useActionState, useEffect, useRef } from "react";
import { Building2, X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";
import { createBattalion, type ActionState } from "@/app/admin/actions";
import PasswordReveal from "./PasswordReveal";

interface Props { open: boolean; onClose: () => void; }

export default function CreateBattalionDialog({ open, onClose }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createBattalion, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { if (state.ok) formRef.current?.reset(); }, [state]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pikud-navy/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="create-battalion-title">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        <div className="bg-pikud-navy px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-pikud-orange rounded-lg p-2"><Building2 className="w-5 h-5 text-white" /></div>
            <div>
              <h2 id="create-battalion-title" className="text-white font-bold text-lg">גדוד חדש</h2>
              <p className="text-white/60 text-sm">חשבון אחד לכל הגדוד</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="סגור" className="text-white/60 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {state.ok && state.password && state.username ? (
          <div className="p-6 space-y-5">
            <PasswordReveal username={state.username} password={state.password} />
            <p className="text-xs text-pikud-gray-mid">העבר את הפרטים לגדוד. אם יאבדו, אפשר לאפס סיסמה מרשימת הגדודים.</p>
            <Button variant="outline" className="w-full h-11" onClick={onClose}>סגור</Button>
          </div>
        ) : (
          <form ref={formRef} action={formAction} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="b-name">שם הגדוד *</Label>
              <Input id="b-name" name="name" placeholder="גדוד 996" required autoFocus className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-username">שם משתמש לכניסה *</Label>
              <Input id="b-username" name="username" placeholder="gdod996" required dir="ltr" autoCapitalize="none"
                pattern="[a-z0-9_]{3,32}" title="3–32 תווים: a-z, 0-9, _" className="h-11 text-left" />
              <p className="text-xs text-pikud-gray-mid">אותיות לטיניות קטנות, ספרות וקו תחתון בלבד</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-password">סיסמה</Label>
              <Input id="b-password" name="password" placeholder="ריק = סיסמה אקראית" dir="ltr" minLength={8} className="h-11 text-left" />
            </div>
            {state.error && (
              <p role="alert" className="text-red-600 text-sm flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {state.error}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <Button type="submit" variant="orange" disabled={pending} className="flex-1 h-11 text-base font-bold flex items-center gap-2">
                {pending && <Loader2 className="w-4 h-4 animate-spin" />} צור גדוד
              </Button>
              <Button type="button" variant="outline" className="h-11" onClick={onClose}>ביטול</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
