import { TOOLS } from "@/lib/tools";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Sprout } from "lucide-react";

export const metadata = { title: "ירוק | חמ\"ל אוכלוסייה" };

/** The green space. Tools with tone "green" will list here; none exist yet. */
export default function GreenHome() {
  const tools = TOOLS.filter((t) => t.tone === "green");

  return (
    <div className="min-h-[calc(100vh-64px)] bg-green-50">
      <section className="bg-green-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Breadcrumbs items={[{ label: "ירוק" }]} className="text-white/80 mb-4" />
          <h1 className="font-black text-3xl sm:text-4xl leading-tight">
            <span className="inline-block w-3 h-3 rounded-full bg-green-400 ml-3 align-middle" aria-hidden />
            ירוק
          </h1>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {tools.length === 0 ? (
          <div className="bg-white rounded-2xl border border-green-200 px-6 py-14 text-center">
            <Sprout className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-green-900 font-bold text-lg">עדיין אין כלים ירוקים</p>
            <p className="text-green-800/70 text-sm mt-1">הכלים שיתווספו כאן יופיעו ברגע שיהיו מוכנים.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
