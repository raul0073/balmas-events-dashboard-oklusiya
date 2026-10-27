import Link from "next/link";
import { ArrowLeft, Siren, Shield, Activity, CalendarRange, ListChecks, BookOpen } from "lucide-react";
import { TOOLS, type ToolTone } from "@/lib/tools";

const TOOL_ICONS: Record<string, React.ReactNode> = {
  events:    <Activity className="w-4 h-4" />,
  shifts:    <CalendarRange className="w-4 h-4" />,
  checklist: <ListChecks className="w-4 h-4" />,
  library:   <BookOpen className="w-4 h-4" />,
};

interface Space {
  tone: ToolTone;
  href: string;
  title: string;
  icon: React.ReactNode;
  cls: string;
  ring: string;
}

const SPACES: Space[] = [
  {
    tone: "orange",
    href: "/orange",
    title: "כתום",
    icon: <Siren className="w-10 h-10 sm:w-12 sm:h-12" />,
    cls: "bg-gradient-to-br from-pikud-orange to-pikud-orange-dark hover:from-pikud-orange-light hover:to-pikud-orange",
    ring: "focus-visible:ring-pikud-orange/40",
  },
  {
    tone: "green",
    href: "/green",
    title: "ירוק",
    icon: <Shield className="w-10 h-10 sm:w-12 sm:h-12" />,
    cls: "bg-gradient-to-br from-idf-green to-idf-green-dark hover:from-idf-green-light hover:to-idf-green",
    ring: "focus-visible:ring-idf-green/40",
  },
];

/** Entry page: pick a space. Each card says what it holds. */
export default function ChoosePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-pikud-cream flex flex-col">
      <section className="bg-pikud-navy-dark text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-pikud-orange font-bold text-sm mb-2">פיקוד העורף · גדודי חילוץ והצלה</p>
          <h1 className="font-black text-3xl sm:text-4xl leading-tight">כלי העבודה של חמ&quot;ל האוכלוסייה</h1>
        </div>
      </section>

      <section className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-2 gap-5 content-start">
        {SPACES.map((s) => {
          const tools = TOOLS.filter((t) => t.tones.includes(s.tone));
          const ready = tools.filter((t) => t.ready).length;
          return (
            <Link key={s.tone} href={s.href}
              className={`group relative overflow-hidden min-h-[260px] sm:min-h-[320px] rounded-3xl text-white shadow-md hover:shadow-xl transition-all p-7 sm:p-8 flex flex-col gap-5 focus:outline-none focus-visible:ring-4 ${s.cls} ${s.ring}`}>
              <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" aria-hidden />

              <div className="flex items-start justify-between gap-4">
                <span className="text-5xl sm:text-6xl font-black leading-none">{s.title}</span>
                <span className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 shadow-inner shrink-0">
                  {s.icon}
                </span>
              </div>

              <ul className="space-y-1.5 text-sm sm:text-base">
                {tools.map((t) => (
                  <li key={t.key} className={`flex items-center gap-2 ${t.ready ? "font-semibold" : "text-white/70"}`}>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/15 shrink-0">{TOOL_ICONS[t.key]}</span>
                    {t.name}
                    {!t.ready && <span className="text-[10px] font-semibold bg-white/15 px-1.5 py-0.5 rounded">בקרוב</span>}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex items-center justify-between">
                <span className="text-sm text-white/80">{ready} מתוך {tools.length} כלים זמינים</span>
                <span className="inline-flex items-center gap-2 text-lg font-bold">
                  כניסה <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
