import { loadSession } from "@/lib/auth/session";
import { TOOLS } from "@/lib/tools";
import Breadcrumbs from "@/components/Breadcrumbs";
import ToolCard from "@/components/ToolCard";

export const metadata = { title: "תפקידי אוכלוסייה בירוק | חמ\"ל אוכלוסייה" };

/** The green space: IDF olive. Tools listed here are placeholders until they are built. */
export default async function GreenHome() {
  const session  = await loadSession();
  const signedIn = Boolean(session);
  const tools    = TOOLS.filter((t) => t.tones.includes("green"));

  return (
    <div className="min-h-[calc(100vh-64px)] bg-canvas">
      <section className="relative bg-pikud-navy-dark text-white border-b-4 border-idf-green-light">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Breadcrumbs items={[{ label: "ירוק" }]} className="text-white/80 mb-4" />
          <h1 className="font-black text-3xl sm:text-4xl leading-tight flex items-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-idf-green-light" aria-hidden />
            תפקידי אוכלוסייה בירוק
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
