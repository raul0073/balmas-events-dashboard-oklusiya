"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarRange, ListChecks, BookOpen, Home, Lock, LogIn, LogOutIcon, ShieldCheck, UserCircle2, MessageSquarePlus } from "lucide-react";
import Shell from "@/components/Shell";
import Navbar from "@/components/Navbar";
import FeedbackDialog from "@/components/FeedbackDialog";
import emblem from "@/app/assets/pikud-haoref.svg";
import { useSession } from "@/lib/session";
import { TOOLS } from "@/lib/tools";
import { signOut } from "@/app/login/actions";

const ICONS: Record<string, React.ReactNode> = {
  events:    <Activity className="w-4 h-4" />,
  shifts:    <CalendarRange className="w-4 h-4" />,
  checklist: <ListChecks className="w-4 h-4" />,
  library:   <BookOpen className="w-4 h-4" />,
};

function pageTitle(pathname: string): string {
  if (pathname === "/") return "ראשי";
  return TOOLS.find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.name ?? "חמ\"ל אוכלוסייה";
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const session   = useSession();
  const pathname  = usePathname();
  const battalion = session?.battalion ?? null;
  const loginHref = `/login?next=${encodeURIComponent(pathname)}`;
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // The events board is not inside the shell yet: it keeps its own top bar until we work on it.
  if (pathname === "/events" || pathname.startsWith("/events/")) {
    return (
      <>
        <Navbar />
        <main>{children}</main>
      </>
    );
  }

  const brand = (
    <Link href="/" className="flex items-center gap-3 px-4 h-16 border-b border-white/10 hover:opacity-90 min-w-0">
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="bg-white rounded-lg w-10 h-10 overflow-hidden flex items-center justify-center p-0.5">
          <img src={emblem.src} alt="פיקוד העורף" className="w-full h-full object-contain" />
        </div>
        {battalion?.logoUrl && (
          <div className="bg-white rounded-lg w-10 h-10 overflow-hidden flex items-center justify-center p-0.5">
            <img src={battalion.logoUrl} alt={battalion.name} className="w-full h-full object-contain" />
          </div>
        )}
      </div>
      <div className="leading-tight min-w-0">
        <div className="font-bold text-base truncate">{`חמ"ל אוכלוסייה`}</div>
        <div className="text-white/50 text-[11px] truncate">{battalion ? battalion.name : "פיקוד העורף"}</div>
      </div>
    </Link>
  );

  const linkCls = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
      active ? "bg-pikud-orange text-white shadow-sm" : "text-white/75 hover:text-white hover:bg-white/10"
    }`;

  const nav = (
    <nav aria-label="כלים" className="flex-1 px-3 py-4 space-y-1">
      <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={linkCls(pathname === "/")}>
        <Home className="w-4 h-4" /> ראשי
      </Link>
      <p className="px-3 pt-4 pb-1 text-[11px] font-bold text-white/40 tracking-wide">כלים</p>
      {TOOLS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
        const locked = t.protected && !session;
        if (!t.ready) {
          return (
            <span key={t.key} aria-disabled className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-white/35 cursor-default">
              <span className="flex items-center gap-3">{ICONS[t.key]} {t.name}</span>
              <span className="text-[10px] font-semibold bg-white/10 px-1.5 py-0.5 rounded">בקרוב</span>
            </span>
          );
        }
        return (
          <Link key={t.key} href={locked ? `/login?next=${encodeURIComponent(t.href)}` : t.href}
            aria-current={active ? "page" : undefined} className={`${linkCls(active)} justify-between`}>
            <span className="flex items-center gap-3">{ICONS[t.key]} {t.name}</span>
            {locked && <Lock className="w-3.5 h-3.5 text-white/50" aria-label="דורש כניסה" />}
          </Link>
        );
      })}
      <p className="px-3 pt-4 pb-1 text-[11px] font-bold text-white/40 tracking-wide">עזרה</p>
      <button type="button" onClick={() => setFeedbackOpen(true)} className={`${linkCls(false)} w-full`}>
        <MessageSquarePlus className="w-4 h-4" /> משוב ובקשות
      </button>
      {session?.isAdmin && (
        <>
          <p className="px-3 pt-4 pb-1 text-[11px] font-bold text-white/40 tracking-wide">ניהול</p>
          <Link href="/admin" className={linkCls(false)}>
            <ShieldCheck className="w-4 h-4 text-pikud-orange" /> פאנל הניהול
          </Link>
        </>
      )}
    </nav>
  );

  const footer = (
    <div className="px-3 py-4 border-t border-white/10 space-y-3">
      {session ? (
        <>
          <div className="flex items-center gap-3 px-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-pikud-orange-light">
              <UserCircle2 className="w-5 h-5" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-bold text-white truncate">{battalion?.name ?? (session.isAdmin ? "מנהל המערכת" : session.username)}</p>
              <p className="text-[11px] text-white/50 truncate" dir="ltr">{session.username}</p>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit"
              className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-white/10 text-white hover:bg-red-600 transition-colors">
              <LogOutIcon className="w-4 h-4" /> התנתק
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="px-2 text-xs text-white/50">כניסה עם פרטי הגדוד פותחת את הכלים המוגנים</p>
          <Link href={loginHref}
            className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-bold bg-pikud-orange hover:bg-pikud-orange-dark text-white transition-colors">
            <LogIn className="w-4 h-4" /> כניסה
          </Link>
        </>
      )}
    </div>
  );

  const headerActions = session ? (
    <>
      <span className="hidden lg:inline-flex items-center gap-2 text-sm text-pikud-navy bg-pikud-cream border border-pikud-gray-light rounded-full pl-3 pr-1.5 py-1">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pikud-navy text-white"><UserCircle2 className="w-4 h-4" /></span>
        <span className="font-semibold">{battalion?.name ?? session.username}</span>
      </span>
      <form action={signOut}>
        <button type="submit" aria-label="התנתק" title="התנתק"
          className="h-9 px-2.5 lg:px-3 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-red-300 lg:text-red-600 lg:border lg:border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors">
          <LogOutIcon className="w-4 h-4" /> <span className="hidden lg:inline">התנתק</span>
        </button>
      </form>
    </>
  ) : (
    <Link href={loginHref}
      className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md text-sm font-bold bg-pikud-orange hover:bg-pikud-orange-dark text-white transition-colors">
      <LogIn className="w-4 h-4" /> כניסה
    </Link>
  );

  return (
    <>
      <Shell brand={brand} nav={nav} footer={footer} title={pageTitle(pathname)}
        titleIcon={<img src={emblem.src} alt="" className="w-5 h-5 object-contain bg-white rounded p-px" />}
        headerActions={headerActions}>
        {children}
      </Shell>
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
