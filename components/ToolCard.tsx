import Link from "next/link";
import { Activity, CalendarRange, ListChecks, BookOpen, Lock, ArrowLeft, ExternalLink } from "lucide-react";
import { toolHref, type ToolDef, type ToolTone } from "@/lib/tools";

const ICONS: Record<string, React.ReactNode> = {
  events:    <Activity className="w-6 h-6" />,
  shifts:    <CalendarRange className="w-6 h-6" />,
  checklist: <ListChecks className="w-6 h-6" />,
  library:   <BookOpen className="w-6 h-6" />,
};

const ACCENT: Record<ToolTone, { card: string; icon: string; link: string; open: string }> = {
  orange: {
    card: "bg-surface border-line hover:border-pikud-orange",
    icon: "bg-pikud-orange/10 text-pikud-orange-dark",
    link: "text-pikud-orange-dark",
    open: "bg-pikud-orange/10 text-pikud-orange-dark",
  },
  green: {
    card: "bg-surface border-line hover:border-idf-green-light",
    icon: "bg-idf-green/10 text-idf-green",
    link: "text-idf-green",
    open: "bg-idf-green/10 text-idf-green",
  },
};

interface Props {
  tool: ToolDef;
  tone: ToolTone;
  signedIn: boolean;
}

export default function ToolCard({ tool, tone, signedIn }: Props) {
  const a      = ACCENT[tone];
  const locked = tool.protected && !signedIn;
  const target = toolHref(tool, tone);
  const href   = locked ? `/login?next=${encodeURIComponent(target)}` : target;
  const cls    = `group rounded-2xl border shadow-sm p-5 flex flex-col gap-3 transition-all ${a.card}
        ${tool.ready ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "opacity-60"}`;

  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${a.icon}`}>{ICONS[tool.key]}</span>
        {tool.protected ? (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${locked ? "bg-ink/5 text-ink" : a.open}`}>
            <Lock className="w-3 h-3" /> {locked ? "דורש כניסה" : "פתוח לך"}
          </span>
        ) : (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-ink/5 text-pikud-gray-mid">פתוח לכולם</span>
        )}
      </div>
      <div>
        <h2 className="font-bold text-lg text-ink">{tool.name}</h2>
        <p className="text-sm text-pikud-gray-mid leading-snug mt-1">{tool.description}</p>
      </div>
      <div className={`mt-auto pt-2 text-sm font-semibold flex items-center gap-1 ${a.link}`}>
        {tool.ready
          ? tool.standalone
            ? <>פתח בחלון חדש <ExternalLink className="w-4 h-4" /></>
            : <>{locked ? "כניסה לכלי" : "פתח"} <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /></>
          : "בקרוב"}
      </div>
    </>
  );

  return tool.ready
    ? <Link href={href} className={cls} target={tool.standalone ? "_blank" : undefined} rel={tool.standalone ? "noopener" : undefined}>{body}</Link>
    : <div aria-disabled className={cls}>{body}</div>;
}
