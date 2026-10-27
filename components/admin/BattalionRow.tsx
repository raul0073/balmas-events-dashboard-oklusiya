"use client";

import { useActionState, useState } from "react";
import { KeyRound, Pencil, Power, Trash2, X, Check, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteBattalion, renameBattalion, resetPassword, setBattalionActive, type ActionState } from "@/app/admin/actions";
import PasswordReveal from "./PasswordReveal";
import type { BattalionSummary } from "./AdminDashboard";

function relative(iso: string | null): string {
  if (!iso) return "אף פעם";
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1)  return "עכשיו";
  if (diffMin < 60) return `לפני ${diffMin} דק'`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `לפני ${h} ש'`;
  const d = Math.floor(h / 24);
  if (d < 30) return `לפני ${d} ימים`;
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function exact(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("he-IL") : "";
}

export default function BattalionRow({ battalion: b }: { battalion: BattalionSummary }) {
  const [mode, setMode] = useState<"view" | "rename" | "reset">("view");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameState, renameAction, renaming] = useActionState<ActionState, FormData>(renameBattalion, {});
  const [resetState, resetAction, resetting]  = useActionState<ActionState, FormData>(resetPassword, {});

  const rowTone = b.active ? "" : "bg-gray-50 text-gray-500";

  return (
    <li className={`px-5 py-3 ${rowTone}`}>
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr_0.7fr_auto] gap-2 md:gap-3 items-center">

        <div className="min-w-0">
          {mode === "rename" ? (
            <form action={(fd) => { renameAction(fd); setMode("view"); }} className="flex items-center gap-2">
              <input type="hidden" name="id" value={b.id} />
              <Input name="name" defaultValue={b.name} autoFocus required className="h-8 text-sm" />
              <button type="submit" aria-label="שמור" className="text-green-700 hover:text-green-900"><Check className="w-4 h-4" /></button>
              <button type="button" aria-label="ביטול" onClick={() => setMode("view")} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </form>
          ) : (
            <>
              <p className="font-bold text-pikud-navy truncate flex items-center gap-2">
                {b.name}
                {renaming && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
              </p>
              <p className="text-xs text-pikud-gray-mid font-mono" dir="ltr">{b.username}</p>
            </>
          )}
          {renameState.error && <p className="text-xs text-red-600">{renameState.error}</p>}
        </div>

        <div className="text-sm" title={exact(b.lastSignInAt)}>
          <span className="md:hidden text-xs text-pikud-gray-mid">כניסה אחרונה: </span>{relative(b.lastSignInAt)}
        </div>
        <div className="text-sm" title={exact(b.lastActivityAt)}>
          <span className="md:hidden text-xs text-pikud-gray-mid">פעילות אחרונה: </span>{relative(b.lastActivityAt)}
        </div>
        <div className="text-sm tabular-nums">
          <span className="md:hidden text-xs text-pikud-gray-mid">אירועים / יומן: </span>{b.eventCount} / {b.logCount}
        </div>
        <div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
            {b.active ? "פעיל" : "מושבת"}
          </span>
        </div>

        <div className="flex items-center gap-1 justify-end w-full md:w-24">
          <button onClick={() => setMode(mode === "rename" ? "view" : "rename")} title="שנה שם" aria-label="שנה שם"
            className="p-1.5 rounded-md text-pikud-gray-mid hover:text-pikud-navy hover:bg-pikud-cream"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setMode(mode === "reset" ? "view" : "reset")} title="אפס סיסמה" aria-label="אפס סיסמה"
            className="p-1.5 rounded-md text-pikud-gray-mid hover:text-pikud-navy hover:bg-pikud-cream"><KeyRound className="w-4 h-4" /></button>
          <form action={setBattalionActive}>
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="active" value={String(!b.active)} />
            <button type="submit" title={b.active ? "השבת" : "הפעל"} aria-label={b.active ? "השבת" : "הפעל"}
              className={`p-1.5 rounded-md hover:bg-pikud-cream ${b.active ? "text-amber-600 hover:text-amber-800" : "text-green-600 hover:text-green-800"}`}>
              <Power className="w-4 h-4" />
            </button>
          </form>
          <button onClick={() => setDeleteOpen(true)} title="מחק" aria-label="מחק"
            className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {mode === "reset" && (
        <div className="mt-3 rounded-lg border border-pikud-gray-light bg-pikud-cream/50 p-4">
          {resetState.ok && resetState.password ? (
            <div className="space-y-3">
              <PasswordReveal username={b.username} password={resetState.password} />
              <Button variant="outline" size="sm" onClick={() => setMode("view")}>סגור</Button>
            </div>
          ) : (
            <form action={resetAction} className="flex items-end gap-3 flex-wrap">
              <input type="hidden" name="userId" value={b.userId} />
              <div className="space-y-1">
                <label htmlFor={`pw-${b.id}`} className="text-xs font-semibold text-pikud-navy">סיסמה חדשה ל{b.name}</label>
                <Input id={`pw-${b.id}`} name="password" placeholder="ריק = סיסמה אקראית" dir="ltr" minLength={8} className="h-9 text-sm w-56 text-left" />
              </div>
              <Button type="submit" size="sm" variant="orange" disabled={resetting} className="flex items-center gap-1.5">
                {resetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} אפס סיסמה
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setMode("view")}>ביטול</Button>
              {resetState.error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {resetState.error}</p>}
            </form>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          const fd = new FormData();
          fd.set("userId", b.userId);
          void deleteBattalion(fd);
        }}
        title={`מחיקת ${b.name}`}
        description={`החשבון, ${b.eventCount} האירועים ו-${b.logCount} רשומות היומן של הגדוד יימחקו לצמיתות. לא ניתן לשחזר.`}
        confirmLabel="מחק גדוד"
        cancelLabel="ביטול"
      />
    </li>
  );
}
