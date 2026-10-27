import { notFound } from "next/navigation";
import { loadLibrary } from "@/lib/library/content";
import { loadOpenWanted } from "@/lib/library/wanted";
import WantedList from "@/components/library/WantedList";
import { loadSession } from "@/lib/auth/session";
import { SPACE_LABELS } from "@/lib/library/types";
import type { ToolTone } from "@/lib/tools";
import Breadcrumbs from "@/components/Breadcrumbs";
import LibraryGrid from "@/components/library/LibraryGrid";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

const SPACES: Record<ToolTone, { bar: string; home: string }> = {
  orange: { bar: "border-pikud-orange", home: "/orange" },
  green:  { bar: "border-idf-green-light", home: "/green" },
};

export async function generateMetadata({ params }: { params: Promise<{ space: string }> }) {
  const { space } = await params;
  const label = SPACE_LABELS[space as ToolTone] ?? "";
  return { title: `ספריית ידע ${label ? `ב${label}` : ""} | חמ"ל אוכלוסייה` };
}

export default async function LibraryPage({ params, searchParams }: { params: Promise<{ space: string }>; searchParams: Promise<{ item?: string }> }) {
  const { space } = await params;
  const { item: openId } = await searchParams;
  if (space !== "orange" && space !== "green") notFound();
  const tone  = space as ToolTone;
  const s     = SPACES[tone];
  const session = await loadSession();
  const [{ items, lockedCounts }, wanted] = await Promise.all([loadLibrary(tone, Boolean(session)), loadOpenWanted(tone)]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-canvas">
      <section className={`relative bg-pikud-navy-dark text-white border-b-4 ${s.bar}`}>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Breadcrumbs items={[{ label: SPACE_LABELS[tone], href: s.home }, { label: "ספריית ידע" }]} className="text-white/80 mb-4" />
          <h1 className="font-black text-3xl sm:text-4xl leading-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 opacity-90" />
            ספריית ידע ב{SPACE_LABELS[tone]}
          </h1>
          <p className="text-white/60 mt-3 max-w-2xl">חומרי הדרכה פתוחים לכולם. טפסים ושאר הקבצים דורשים כניסה עם פרטי הגדוד.</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <WantedList items={wanted} space={tone} />
        <LibraryGrid items={items} space={tone} lockedCounts={lockedCounts} openId={openId} loginHref={`/login?next=${encodeURIComponent(`/library/${tone}`)}`} />
      </section>
    </div>
  );
}
