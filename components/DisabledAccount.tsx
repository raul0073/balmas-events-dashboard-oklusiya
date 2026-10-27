import Link from "next/link";
import { ShieldOff, ShieldCheck } from "lucide-react";

/** Shown inside a protected tool to a signed-in user who has no active battalion. */
export default function DisabledAccount({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-pikud-cream px-4">
      <div className="text-center bg-surface rounded-2xl p-10 max-w-sm border border-pikud-gray-light shadow-sm">
        {isAdmin ? (
          <>
            <ShieldCheck className="w-12 h-12 text-pikud-orange mx-auto mb-4" />
            <p className="text-ink font-bold text-lg mb-2">חשבון מנהל</p>
            <p className="text-pikud-gray-mid text-sm mb-5">הכלים המבצעיים שייכים לגדודים. כמנהל אתה מנהל את חשבונות הגדודים.</p>
            <Link href="/admin" className="inline-block bg-pikud-navy text-white font-semibold text-sm px-4 py-2 rounded-lg">לפאנל הניהול</Link>
          </>
        ) : (
          <>
            <ShieldOff className="w-12 h-12 text-pikud-gray-mid mx-auto mb-4" />
            <p className="text-ink font-bold text-lg mb-2">החשבון אינו פעיל</p>
            <p className="text-pikud-gray-mid text-sm">חשבון הגדוד הושבת או טרם הוגדר. פנה למנהל המערכת.</p>
          </>
        )}
      </div>
    </div>
  );
}
