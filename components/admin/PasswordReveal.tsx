"use client";

import { useState } from "react";
import { Copy, Check, KeyRound } from "lucide-react";

/** Shows a freshly set password once, with copy. */
export default function PasswordReveal({ username, password }: { username: string; password: string }) {
  const [copied, setCopied] = useState(false);
  const text = `שם משתמש: ${username}\nסיסמה: ${password}`;

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
      <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
        <KeyRound className="w-4 h-4" /> פרטי הכניסה — מוצגים פעם אחת בלבד
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-ink-muted">שם משתמש</dt>
        <dd className="font-mono font-bold text-ink" dir="ltr">{username}</dd>
        <dt className="text-ink-muted">סיסמה</dt>
        <dd className="font-mono font-bold text-ink select-all" dir="ltr">{password}</dd>
      </dl>
      <button type="button" onClick={copy}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-800 hover:text-green-900">
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "הועתק" : "העתק שם משתמש וסיסמה"}
      </button>
    </div>
  );
}
