"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface Props {
  /** logo + title block, rendered at the top of the sidebar and the drawer */
  brand: React.ReactNode;
  /** navigation list */
  nav: React.ReactNode;
  /** bottom block: signed-in user and logout, or a login button */
  footer: React.ReactNode;
  /** current page title for the headers */
  title: string;
  /** small icon shown next to the title on the phone top bar */
  titleIcon?: React.ReactNode;
  /** right side of the wide-screen header and the phone top bar */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * App shell: sidebar on wide screens (start side, so right in RTL),
 * top bar with a drawer on phones and tablets.
 */
export default function Shell({ brand, nav, footer, title, titleIcon, headerActions, children }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-pikud-cream lg:flex">

      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-pikud-navy text-white sticky top-0 h-screen">
        {brand}
        {nav}
        {footer}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-40 bg-pikud-navy text-white h-14 flex items-center justify-between px-3 shadow-md gap-2">
          <button onClick={() => setDrawerOpen(true)} aria-label="פתח תפריט" aria-expanded={drawerOpen}
            className="p-2 rounded-md hover:bg-white/10 shrink-0"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2 min-w-0">
            {titleIcon}
            <span className="font-bold text-sm truncate">{title}</span>
          </div>
          <div className="shrink-0 flex items-center gap-1">{headerActions}</div>
        </header>

        <header className="hidden lg:flex h-16 items-center justify-between px-6 bg-surface border-b border-pikud-gray-light sticky top-0 z-30">
          <h1 className="text-ink font-black text-xl">{title}</h1>
          <div className="flex items-center gap-3">{headerActions}</div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button aria-label="סגור תפריט" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-pikud-navy/60 backdrop-blur-sm" />
          <div role="dialog" aria-modal="true" aria-label="תפריט"
            className="absolute inset-y-0 right-0 w-72 max-w-[85vw] bg-pikud-navy text-white flex flex-col shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pl-2">
              {brand}
              <button onClick={() => setDrawerOpen(false)} aria-label="סגור" className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}
