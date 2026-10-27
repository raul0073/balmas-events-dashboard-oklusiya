import { notFound } from "next/navigation";
import { loadLibrary } from "@/lib/library/content";
import { SPACE_LABELS } from "@/lib/library/types";
import type { ToolTone } from "@/lib/tools";
import Breadcrumbs from "@/components/Breadcrumbs";
import LibraryGrid from "@/components/library/LibraryGrid";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

const SPACES: Record<ToolTone, { hero: string; glow: string; bar: string; page: string; dot: string; home: string }> = {
  orange: {
    hero: "bg-pikud-navy-dark", glow: "to-pikud-orange/25", bar: "from-pikud-orange-dark via-pikud-orange to-pikud-orange-light",
    page: "bg-gradient-to-b from-pikud-orange-pale via-canvas to-canvas", dot: "bg-pikud-orange", home: "/orange",
  },
  green: {
    hero: "bg-idf-green-dark", glow: "to-idf-green-light/30", bar: "from-idf-green via-idf-green-light to-idf-green-pale",
    page: "bg-gradient-to-b from-idf-green-pale via-idf-green-mist to-canvas", dot: "bg-idf-green-light", home: "/green",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ space: string }> }) {
  const { space } = await params;
  const label = SPACE_LABELS[space as ToolTone] ?? "";
  return { title: `ספריית ידע ${label ? `ב${label}` : ""} | חמ"ל אוכלוסייה` };
}

export default async function LibraryPage({ params }: { params: Promise<{ space: string }> }) {
  const { space } = await params;
  if (space !== "orange" && space !== "green") notFound();
  const tone  = space as ToolTone;
  const s     = SPACES[tone];
  const items = await loadLibrary(tone);

  return (
    <div className={`min-h-[calc(100vh-64px)] ${s.page}`}>
      <section className={`relative ${s.hero} text-white overflow-hidden`}>
        <div className={`absolute inset-y-0 left-0 w-1/2 bg-gradient-to-l from-transparent ${s.glow} pointer-events-none`} aria-hidden />
        <div className={`absolute bottom-0 inset-x-0 h-1 bg-gradient-to-l ${s.bar}`} aria-hidden />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Breadcrumbs items={[{ label: SPACE_LABELS[tone], href: s.home }, { label: "ספריית ידע" }]} className="text-white/80 mb-4" />
          <h1 className="font-black text-3xl sm:text-4xl leading-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 opacity-90" />
            ספריית ידע ב{SPACE_LABELS[tone]}
          </h1>
          <p className="text-white/60 mt-3 max-w-2xl">טפסים להורדה והדפסה וחומרי הדרכה. לחץ על קובץ לתצוגה מקדימה, או הורד ישירות.</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <LibraryGrid items={items} space={tone} />
      </section>
    </div>
  );
}
