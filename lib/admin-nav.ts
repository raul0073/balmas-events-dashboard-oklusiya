/** Sidebar entries of the admin area. Add a page under app/admin/ and a line here. */
export interface AdminNavItem {
  href: string;
  label: string;
  icon: "battalions" | "feedback" | "checklist" | "library" | "settings";
  ready: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin",           label: "גדודים",        icon: "battalions", ready: true },
  { href: "/admin/feedback",  label: "פניות",         icon: "feedback",   ready: true },
  { href: "/admin/checklist", label: "תוכן הצ'קליסט", icon: "checklist",  ready: true },
  { href: "/admin/library",   label: "ספריית ידע",    icon: "library",    ready: false },
  { href: "/admin/settings",  label: "הגדרות מערכת",  icon: "settings",   ready: false },
];

export function adminPageTitle(pathname: string): string {
  const item = ADMIN_NAV.find((i) => pathname === i.href || (i.href !== "/admin" && pathname.startsWith(`${i.href}/`)));
  return item?.label ?? "ניהול";
}
