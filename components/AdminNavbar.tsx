import Link from "next/link";
import { ShieldCheck, LogOutIcon, Home } from "lucide-react";
import { signOut } from "@/app/login/actions";

export default function AdminNavbar() {
  return (
    <nav className="bg-pikud-navy text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/admin" className="flex items-center gap-3 hover:opacity-90">
            <div className="bg-pikud-orange rounded-lg p-2">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="text-right leading-tight">
              <div className="font-bold text-base">ניהול המערכת</div>
              <div className="text-white/50 text-xs">{`חמ"ל אוכלוסייה | פיקוד העורף`}</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/10">
              <Home className="w-4 h-4" /> <span className="hidden sm:inline">לכלים</span>
            </Link>
            <form action={signOut}>
              <button type="submit" aria-label="יציאה"
                className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-md text-sm text-red-300 hover:text-white hover:bg-red-600 transition-colors">
                <LogOutIcon className="w-4 h-4" /> <span className="hidden sm:inline">יציאה</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
