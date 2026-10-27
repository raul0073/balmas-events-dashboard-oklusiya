import { loadSession } from "@/lib/auth/session";
import { TOOLS } from "@/lib/tools";
import Breadcrumbs from "@/components/Breadcrumbs";
import ToolCard from "@/components/ToolCard";

export const metadata = { title: "ירוק | חמ\"ל אוכלוסייה" };

/** The green space: IDF olive. Tools listed here are placeholders until they are built. */
export default async function GreenHome() {
  const session  = await loadSession();
  const signedIn = Boolean(session);
  const tools    = TOOLS.filter((t) => t.tones.includes("green"));

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-idf-green-pale via-idf-green-mist to-pikud-cream">
      <section className="relative bg-idf-green-dark text-white overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-l from-transparent to-idf-green-light/30 pointer-events-none" aria-hidden />
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-l from-idf-green via-idf-green-light to-idf-green-pale" aria-hidden />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Breadcrumbs items={[{ label: "ירוק" }]} className="text-white/80 mb-4" />
          <h1 className="font-black text-3xl sm:text-4xl leading-tight flex items-center gap-3">
            <span className="inline-block w-3.5 h-3.5 rounded-full bg-idf-green-light shadow-[0_0_0_6px_rgba(107,122,58,0.3)]" aria-hidden />
            ירוק
          </h1>
          <p className="text-white/60 mt-3 max-w-2xl">
            {session?.battalion
              ? `מחובר כ${session.battalion.name}.`
              : "הכלים המוגנים דורשים כניסה עם פרטי הגדוד."}
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => <ToolCard key={tool.key} tool={tool} tone="green" signedIn={signedIn} />)}
        </div>
      </section>
    </div>
  );
}
