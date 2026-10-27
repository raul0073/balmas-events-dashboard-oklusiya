/**
 * The hub's tool registry. Adding a tool = a folder under app/(site)/ plus one entry here.
 * `protected` tools need a signed-in battalion; the rest are open to everyone.
 */
/** The color spaces a tool appears in. Orange is Pikud HaOref orange, green is IDF olive. */
export type ToolTone = "orange" | "green";

export interface ToolDef {
  key: string;
  /** route prefix, e.g. "/events" */
  href: string;
  name: string;
  description: string;
  protected: boolean;
  /** false while the tool is not ported yet; the hub shows it as "coming soon" */
  ready: boolean;
  tones: ToolTone[];
}

export const TOOLS: ToolDef[] = [
  {
    key: "events",
    href: "/events",
    name: "לוח אירועים",
    description: "ניהול אירועים בזמן אמת: רשימת עוגן, נעדרים, פלוגות ודיווח לוואטסאפ",
    protected: true,
    ready: true,
    tones: ["orange"],
  },
  {
    key: "shifts",
    href: "/shifts",
    name: "מחולל משמרות",
    description: "בניית סבבי משמרות לפי אנשים וכללים, עם ייצוא לאקסל",
    protected: true,
    ready: false,
    tones: ["orange", "green"],
  },
  {
    key: "checklist",
    href: "/checklist",
    name: "צ'קליסט מש\"ק אוכלוסייה",
    description: "שלבי העבודה של מש\"ק האוכלוסייה, שלב אחר שלב",
    protected: false,
    ready: true,
    tones: ["orange"],
  },
  {
    key: "library",
    href: "/library",
    name: "ספריית ידע",
    description: "טפסים להורדה וחומרי למידה: טכניקות סקר, הנחיות ועזרים",
    protected: false,
    ready: false,
    tones: ["orange", "green"],
  },
];

/** Paths that never need a session, beyond the public tools. */
const PUBLIC_PATHS = ["/", "/login", "/orange", "/green"];

export function isProtectedPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return false;
  if (pathname.startsWith("/admin")) return true;
  const tool = TOOLS.find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`));
  if (tool) return tool.protected;
  // anything unregistered (settings, future pages) is protected by default
  return true;
}
