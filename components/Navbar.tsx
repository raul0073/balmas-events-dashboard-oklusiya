"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon, LogIn, ShieldCheck } from "lucide-react";
import emblem from "@/app/assets/pikud-haoref.svg";
import { useSession } from "@/lib/session";
import { TOOLS } from "@/lib/tools";
import { signOut } from "@/app/login/actions";

export default function Navbar() {
  const session   = useSession();
  const pathname  = usePathname();
  const battalion = session?.battalion ?? null;
  const loginHref = `/login?next=${encodeURIComponent(pathname === "/login" ? "/" : pathname)}`;

  return (
    <nav className="bg-pikud-navy text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity shrink-0 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="bg-white rounded-lg w-11 h-11 overflow-hidden flex items-center justify-center p-0.5">
                <img src={emblem.src} alt="פיקוד העורף" className="w-full h-full object-contain" />
              </div>
              {battalion?.logoUrl && (
                <div className="bg-white rounded-lg w-11 h-11 overflow-hidden flex items-center justify-center p-0.5">
                  <img src={battalion.logoUrl} alt={battalion.name} className="w-full h-full object-contain" />
                </div>
              )}
            </div>
            <div className="text-right leading-tight min-w-0">
              <div className="font-bold text-base truncate">{`חמ"ל אוכלוסייה`}</div>
              <div className="text-white/50 text-xs truncate">{battalion ? `${battalion.name} | פיקוד העורף` : "פיקוד העורף"}</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {TOOLS.map((t) => {
              const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
              if (!t.ready) {
                return (
                  <span key={t.key} className="px-3 py-1.5 rounded-full text-sm text-white/30 cursor-default" title="בקרוב">
                    {t.name}
                  </span>
                );
              }
              return (
                <Link key={t.key} href={t.href}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    active ? "bg-white/15 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}>
                  {t.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {session?.isAdmin && (
              <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-pikud-orange hover:text-white transition-colors">
                <ShieldCheck className="w-4 h-4" /> <span className="hidden sm:inline">ניהול</span>
              </Link>
            )}
            {session ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs text-white/60" dir="ltr">{session.username}</span>
                <form action={signOut}>
                  <button type="submit" aria-label="התנתק" title="התנתק"
                    className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-md text-sm text-red-300 hover:text-white hover:bg-red-600 transition-colors">
                    <LogOutIcon className="w-4 h-4" /> <span className="hidden sm:inline">התנתק</span>
                  </button>
                </form>
              </div>
            ) : (
              <Link href={loginHref}
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold bg-pikud-orange hover:bg-pikud-orange-dark text-white transition-colors">
                <LogIn className="w-4 h-4" /> כניסה
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
