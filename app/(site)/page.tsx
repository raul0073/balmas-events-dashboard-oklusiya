import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Entry page: pick a color. Orange holds today's tools; green is its own space. */
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
        <Link href="/orange"
          className="group min-h-[220px] sm:min-h-[300px] rounded-3xl bg-pikud-orange hover:bg-pikud-orange-dark text-white shadow-md hover:shadow-xl transition-all p-8 flex flex-col justify-between focus:outline-none focus-visible:ring-4 focus-visible:ring-pikud-orange/40">
          <span className="text-5xl sm:text-6xl font-black leading-none">כתום</span>
          <span className="inline-flex items-center gap-2 text-lg font-bold">
            כניסה <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
          </span>
        </Link>
        <Link href="/green"
          className="group min-h-[220px] sm:min-h-[300px] rounded-3xl bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-xl transition-all p-8 flex flex-col justify-between focus:outline-none focus-visible:ring-4 focus-visible:ring-green-600/40">
          <span className="text-5xl sm:text-6xl font-black leading-none">ירוק</span>
          <span className="inline-flex items-center gap-2 text-lg font-bold">
            כניסה <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
          </span>
        </Link>
      </section>
    </div>
  );
}
