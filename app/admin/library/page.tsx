import { loadAllLibrary } from "@/lib/library/content";
import { loadWantedWithOffers } from "@/lib/library/wanted";
import LibraryManager from "@/components/admin/LibraryManager";

export const dynamic = "force-dynamic";

export default async function AdminLibrary() {
  const [items, wanted] = await Promise.all([loadAllLibrary(), loadWantedWithOffers()]);
  return <LibraryManager items={items} wanted={wanted.items} offers={wanted.offers} />;
}
