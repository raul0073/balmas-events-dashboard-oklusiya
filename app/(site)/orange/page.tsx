import { loadSession } from "@/lib/auth/session";
import { TOOLS } from "@/lib/tools";
import Breadcrumbs from "@/components/Breadcrumbs";
import ToolCard from "@/components/ToolCard";

export const metadata = { title: "כתום | חמ\"ל אוכלוסייה" };

/** The orange space: Pikud HaOref orange, the operational tools. */
export default async function OrangeHome() {
  const session  = await loadSession();
  const signedIn = Boolean(session);
  const tools    = TOOLS.filter((t) => t.tones.includes("orange"));

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-pikud-orange-pale via-[#FBF1E6] to-pikud-cream">
      <section className="relative bg-pikud-navy-dark text-white overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-l from-transparent to-pikud-orange/25 pointer-events-none" aria-hidden />
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-l from-pikud-orange-dark via-pikud-orange to-pikud-orange-light" aria-hidden />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Breadcrumbs items={[{ label: "כתום" }]} className="text-white/80 mb-4" />
          <h1 className="font-black text-3xl sm:text-4xl leading-tight flex items-center gap-3">
            <span className="inline-block w-3.5 h-3.5 rounded-full bg-pikud-orange shadow-[0_0_0_6px_rgba(244,121,32,0.25)]" aria-hidden />
            כתום
          </h1>
          <p className="text-white/60 mt-3 max-w-2xl">
            {session?.battalion
              ? `מחובר כ${session.battalion.name}. הכלים המוגנים פתוחים לך.`
              : "חלק מהכלים פתוחים לכולם. הכלים המוגנים דורשים כניסה עם פרטי הגדוד."}
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => <ToolCard key={tool.key} tool={tool} tone="orange" signedIn={signedIn} />)}
        </div>
      </section>
    </div>
  );
}
