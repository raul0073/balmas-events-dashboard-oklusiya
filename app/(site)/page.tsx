import Link from "next/link";
import { loadSession } from "@/lib/auth/session";
import { TOOLS, type ToolTone } from "@/lib/tools";
import { Activity, CalendarRange, ListChecks, Lock, ArrowLeft, BookOpen } from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  events:    <Activity className="w-6 h-6" />,
  shifts:    <CalendarRange className="w-6 h-6" />,
  checklist: <ListChecks className="w-6 h-6" />,
  library:   <BookOpen className="w-6 h-6" />,
};

/** Card styling per tone: background, border, icon chip, link color. */
const TONES: Record<ToolTone, { card: string; icon: string; link: string }> = {
  orange: {
    card: "bg-pikud-orange-pale border-pikud-orange/30 hover:border-pikud-orange/60",
    icon: "bg-pikud-orange text-white",
    link: "text-pikud-orange-dark",
  },
  green: {
    card: "bg-green-50 border-green-200 hover:border-green-400",
    icon: "bg-green-600 text-white",
    link: "text-green-800",
  },
};

export default async function HubHome() {
  const session = await loadSession();
  const signedIn = Boolean(session);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-pikud-cream">
      <section className="bg-pikud-navy-dark text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-pikud-orange font-bold text-sm mb-2">פיקוד העורף · גדודי חילוץ והצלה</p>
          <h1 className="font-black text-3xl sm:text-4xl leading-tight">כלי העבודה של חמ&quot;ל האוכלוסייה</h1>
          <p className="text-white/60 mt-3 max-w-2xl">
            {session?.battalion
              ? `מחובר כ${session.battalion.name}. הכלים המוגנים פתוחים לך.`
              : "חלק מהכלים פתוחים לכולם. הכלים המוגנים דורשים כניסה עם פרטי הגדוד."}
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => {
            const tone   = TONES[tool.tone];
            const locked = tool.protected && !signedIn;
            const href   = locked ? `/login?next=${encodeURIComponent(tool.href)}` : tool.href;
            const cls    = `group rounded-2xl border shadow-sm p-5 flex flex-col gap-3 transition-all ${tone.card}
                  ${tool.ready ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "opacity-60"}`;
            const body = (
              <>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl shadow-sm ${tone.icon}`}>
                    {ICONS[tool.key]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {tool.protected && (
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${locked ? "bg-pikud-navy/10 text-pikud-navy" : "bg-white/70 text-green-700"}`}>
                        <Lock className="w-3 h-3" /> {locked ? "דורש כניסה" : "פתוח לך"}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="font-bold text-lg text-pikud-navy">{tool.name}</h2>
                  <p className="text-sm text-pikud-navy/70 leading-snug mt-1">{tool.description}</p>
                </div>
                <div className={`mt-auto pt-2 text-sm font-semibold flex items-center gap-1 ${tone.link}`}>
                  {tool.ready ? <>{locked ? "כניסה לכלי" : "פתח"} <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /></> : "בקרוב"}
                </div>
              </>
            );
            return tool.ready
              ? <Link key={tool.key} href={href} className={cls}>{body}</Link>
              : <div key={tool.key} aria-disabled className={cls}>{body}</div>;
          })}
        </div>
      </section>
    </div>
  );
}
