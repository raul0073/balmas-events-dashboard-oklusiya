"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ListChecks, BookOpen, Settings, ShieldCheck, LogOutIcon, Home, UserCircle2, Inbox } from "lucide-react";
import Shell from "@/components/Shell";
import { ADMIN_NAV, adminPageTitle, type AdminNavItem } from "@/lib/admin-nav";
import { signOut } from "@/app/login/actions";
import ThemeToggle from "@/components/ThemeToggle";

const ICONS: Record<AdminNavItem["icon"], React.ReactNode> = {
  battalions: <Building2 className="w-4 h-4" />,
  feedback:   <Inbox className="w-4 h-4" />,
  checklist:  <ListChecks className="w-4 h-4" />,
  library:    <BookOpen className="w-4 h-4" />,
  settings:   <Settings className="w-4 h-4" />,
};

interface Props {
  username: string;
  /** unread submissions, shown as a badge on the feedback entry */
  newFeedback?: number;
  /** new "I have it" offers, shown as a badge on the library entry */
  newOffers?: number;
  children: React.ReactNode;
}

export default function AdminShell({ username, newFeedback = 0, newOffers = 0, children }: Props) {
  const pathname = usePathname();

  const brand = (
    <Link href="/admin" className="flex items-center gap-3 px-5 h-16 border-b border-white/10 hover:opacity-90">
      <div className="bg-pikud-orange rounded-lg p-2 shrink-0"><ShieldCheck className="w-5 h-5 text-white" /></div>
      <div className="leading-tight min-w-0">
        <div className="font-bold text-base">ניהול המערכת</div>
        <div className="text-white/50 text-[11px] truncate">{`חמ"ל אוכלוסייה | פיקוד העורף`}</div>
      </div>
    </Link>
  );

  const nav = (
    <nav aria-label="ניווט ניהול" className="flex-1 px-3 py-4 space-y-1">
      {ADMIN_NAV.map((item) => {
        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
        if (!item.ready) {
          return (
            <span key={item.href} aria-disabled
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-white/35 cursor-default">
              <span className="flex items-center gap-3">{ICONS[item.icon]} {item.label}</span>
              <span className="text-[10px] font-semibold bg-white/10 px-1.5 py-0.5 rounded">בקרוב</span>
            </span>
          );
        }
        const badge = item.icon === "feedback" ? newFeedback : item.icon === "library" ? newOffers : 0;
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              active ? "bg-pikud-orange text-white shadow-sm" : "text-white/75 hover:text-white hover:bg-white/10"
            }`}>
            <span className="flex items-center gap-3">{ICONS[item.icon]} {item.label}</span>
            {badge > 0 && (
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-surface text-pikud-orange-dark" : "bg-pikud-orange text-white"}`}
                aria-label={`${badge} פניות חדשות`}>{badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="px-3 py-4 border-t border-white/10 space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-white/50">תצוגה</span>
        <ThemeToggle onDark compact />
      </div>
      <div className="flex items-center gap-3 px-2">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-pikud-orange-light">
          <UserCircle2 className="w-5 h-5" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-bold text-white truncate" dir="ltr">{username}</p>
          <p className="text-[11px] text-white/50">מנהל-על · מחובר</p>
        </div>
      </div>
      <form action={signOut}>
        <button type="submit"
          className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-white/10 text-white hover:bg-red-600 transition-colors">
          <LogOutIcon className="w-4 h-4" /> התנתק
        </button>
      </form>
      <Link href="/" className="flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white">
        <Home className="w-3.5 h-3.5" /> לדף הכלים
      </Link>
    </div>
  );

  const headerActions = (
    <>
      <span className="hidden lg:inline-flex"><ThemeToggle compact /></span>
      <span className="hidden lg:inline-flex items-center gap-2 text-sm text-ink bg-pikud-cream border border-pikud-gray-light rounded-full pl-3 pr-1.5 py-1">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pikud-navy text-white"><UserCircle2 className="w-4 h-4" /></span>
        <span className="font-semibold" dir="ltr">{username}</span>
        <span className="text-xs text-pikud-gray-mid">מנהל-על</span>
      </span>
      <form action={signOut}>
        <button type="submit" aria-label="התנתק" title="התנתק"
          className="h-9 px-2.5 lg:px-3 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-white/80 lg:text-ink-muted lg:border lg:border-line hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors">
          <LogOutIcon className="w-4 h-4" /> <span className="hidden lg:inline">התנתק</span>
        </button>
      </form>
    </>
  );

  return (
    <Shell brand={brand} nav={nav} footer={footer} title={adminPageTitle(pathname)}
      titleIcon={<ShieldCheck className="w-4 h-4 text-pikud-orange shrink-0" />} headerActions={headerActions}>
      {children}
    </Shell>
  );
}
