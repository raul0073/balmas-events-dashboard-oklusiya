"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ListChecks, BookOpen, Settings, ShieldCheck, LogOutIcon, Menu, X, Home, UserCircle2 } from "lucide-react";
import { ADMIN_NAV, adminPageTitle, type AdminNavItem } from "@/lib/admin-nav";
import { signOut } from "@/app/login/actions";

const ICONS: Record<AdminNavItem["icon"], React.ReactNode> = {
  battalions: <Building2 className="w-4 h-4" />,
  checklist:  <ListChecks className="w-4 h-4" />,
  library:    <BookOpen className="w-4 h-4" />,
  settings:   <Settings className="w-4 h-4" />,
};

interface Props {
  username: string;
  children: React.ReactNode;
}

export default function AdminShell({ username, children }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const title = adminPageTitle(pathname);

  // close the drawer on navigation and lock body scroll while it's open
  useEffect(() => { setDrawerOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

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
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              active ? "bg-pikud-orange text-white shadow-sm" : "text-white/75 hover:text-white hover:bg-white/10"
            }`}>
            {ICONS[item.icon]} {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const userBlock = (
    <div className="px-3 py-4 border-t border-white/10 space-y-3">
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

  const brand = (
    <Link href="/admin" className="flex items-center gap-3 px-5 h-16 border-b border-white/10 hover:opacity-90">
      <div className="bg-pikud-orange rounded-lg p-2 shrink-0"><ShieldCheck className="w-5 h-5 text-white" /></div>
      <div className="leading-tight min-w-0">
        <div className="font-bold text-base">ניהול המערכת</div>
        <div className="text-white/50 text-[11px] truncate">{`חמ"ל אוכלוסייה | פיקוד העורף`}</div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-pikud-cream lg:flex">

      {/* sidebar: wide screens only, on the start (right) side */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-pikud-navy text-white sticky top-0 h-screen">
        {brand}
        {nav}
        {userBlock}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* phone / tablet top bar */}
        <header className="lg:hidden sticky top-0 z-40 bg-pikud-navy text-white h-14 flex items-center justify-between px-3 shadow-md">
          <button onClick={() => setDrawerOpen(true)} aria-label="פתח תפריט" aria-expanded={drawerOpen}
            className="p-2 rounded-md hover:bg-white/10"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-pikud-orange shrink-0" />
            <span className="font-bold text-sm truncate">{title}</span>
          </div>
          <form action={signOut}>
            <button type="submit" aria-label="התנתק" title="התנתק" className="p-2 rounded-md text-red-300 hover:text-white hover:bg-red-600">
              <LogOutIcon className="w-5 h-5" />
            </button>
          </form>
        </header>

        {/* wide-screen page header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-6 bg-white border-b border-pikud-gray-light sticky top-0 z-30">
          <h1 className="text-pikud-navy font-black text-xl">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm text-pikud-navy bg-pikud-cream border border-pikud-gray-light rounded-full pl-3 pr-1.5 py-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pikud-navy text-white"><UserCircle2 className="w-4 h-4" /></span>
              <span className="font-semibold" dir="ltr">{username}</span>
              <span className="text-xs text-pikud-gray-mid">מנהל-על</span>
            </span>
            <form action={signOut}>
              <button type="submit"
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors">
                <LogOutIcon className="w-4 h-4" /> התנתק
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* drawer for small screens */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button aria-label="סגור תפריט" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-pikud-navy/60 backdrop-blur-sm" />
          <div role="dialog" aria-modal="true" aria-label="תפריט ניהול"
            className="absolute inset-y-0 right-0 w-72 max-w-[85vw] bg-pikud-navy text-white flex flex-col shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pl-2">
              {brand}
              <button onClick={() => setDrawerOpen(false)} aria-label="סגור" className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            {nav}
            {userBlock}
          </div>
        </div>
      )}
    </div>
  );
}
