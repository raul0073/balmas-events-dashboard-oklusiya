"use client";

import { useActionState, useEffect, useState } from "react";
import { Shield, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { signIn, type SignInState } from "@/app/login/actions";

export default function LoginPage({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, {});
  const [showPass, setShowPass] = useState(false);
  const [shaking, setShaking]   = useState(false);

  useEffect(() => {
    if (!state.error) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 500);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div className="min-h-screen bg-pikud-navy flex items-center justify-center px-4">

      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

      <div className={`relative w-full max-w-sm ${shaking ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          <div className="bg-pikud-navy px-8 pt-8 pb-6 text-center border-b-4 border-pikud-orange">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-pikud-orange rounded-2xl mb-4 shadow-lg">
              <Shield className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-white font-black text-xl leading-tight">חמ&quot;ל אוכלוסייה</h1>
            <p className="text-white/50 text-sm mt-1">פיקוד העורף | מרכז פיקוד אירועים</p>
          </div>

          <form action={formAction} className="px-8 py-7 space-y-5">
            <input type="hidden" name="next" value={next ?? "/"} />
            <p className="text-center text-gray-500 text-sm">כניסה עם פרטי הגדוד</p>

            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-bold text-gray-500 uppercase tracking-wider">שם משתמש</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoFocus
                required
                dir="ltr"
                placeholder="gdod996"
                className="w-full h-11 px-4 rounded-lg border-2 border-gray-200 text-pikud-navy text-sm font-medium focus:outline-none focus:border-pikud-navy transition-colors placeholder:text-gray-300 text-left"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase tracking-wider">סיסמה</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  dir="ltr"
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pl-11 rounded-lg border-2 border-gray-200 text-pikud-navy text-sm font-medium focus:outline-none focus:border-pikud-navy transition-colors placeholder:text-gray-300 text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "הסתר סיסמה" : "הצג סיסמה"}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {state.error && (
              <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-red-600 text-sm font-medium">{state.error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full h-11 bg-pikud-orange hover:bg-pikud-orange-dark disabled:opacity-70 text-white font-bold text-base rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              כניסה למערכת
            </button>
          </form>

          <div className="px-8 pb-6 text-center">
            <p className="text-gray-300 text-xs">גישה מורשית בלבד · פרטי הכניסה ניתנים לכל גדוד בנפרד</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
