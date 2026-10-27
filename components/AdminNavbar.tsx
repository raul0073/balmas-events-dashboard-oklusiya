import { ShieldCheck, LogOutIcon } from "lucide-react";
import { signOut } from "@/app/login/actions";

export default function AdminNavbar() {
  return (
    <nav className="bg-pikud-navy text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-pikud-orange rounded-lg p-2">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="font-bold text-base leading-tight">ניהול המערכת</div>
              <div className="text-white/50 text-xs">{`חמ"ל אוכלוסייה | פיקוד העורף`}</div>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" aria-label="יציאה"
              className="h-9 w-9 inline-flex items-center justify-center rounded-md text-red-400 hover:text-white hover:bg-red-600 transition-colors">
              <LogOutIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
