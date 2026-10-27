import { loadChecklist, resolveAids } from "@/lib/checklist/content";
import ChecklistView from "@/components/checklist/ChecklistView";

export const dynamic = "force-dynamic";
export const metadata = { title: "צ'קליסט מש\"ק אוכלוסייה | חמ\"ל אוכלוסייה" };

export default async function ChecklistPage() {
  const { content } = await loadChecklist();
  const aids = await resolveAids(content);
  return <ChecklistView content={content} aids={aids} />;
}
