import { loadAllLibrary } from "@/lib/library/content";
import LibraryManager from "@/components/admin/LibraryManager";

export const dynamic = "force-dynamic";

export default async function AdminLibrary() {
  const items = await loadAllLibrary();
  return <LibraryManager items={items} />;
}
