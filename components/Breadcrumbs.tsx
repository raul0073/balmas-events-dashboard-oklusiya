import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

/** Trail at the top of a page: ראשי › כתום › ... The last crumb is the current page. */
export default function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  const all: Crumb[] = [{ label: "ראשי", href: "/" }, ...items];
  return (
    <nav aria-label="מיקום" className={`flex items-center gap-1 text-sm flex-wrap ${className}`}>
      {all.map((c, i) => {
        const last = i === all.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronLeft className="w-4 h-4 opacity-50" aria-hidden />}
            {c.href && !last ? (
              <Link href={c.href} className="inline-flex items-center gap-1 opacity-70 hover:opacity-100 hover:underline underline-offset-4">
                {i === 0 && <Home className="w-3.5 h-3.5" aria-hidden />} {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-bold">{c.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
