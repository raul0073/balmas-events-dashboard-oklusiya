import type { ToolTone } from "@/lib/tools";

export type LibraryCategory = "forms" | "guides" | "other";

export const LIBRARY_CATEGORIES: { value: LibraryCategory; label: string }[] = [
  { value: "forms",  label: "טפסים" },
  { value: "guides", label: "הדרכה" },
  { value: "other",  label: "אחר" },
];

export function categoryLabel(c: string): string {
  return LIBRARY_CATEGORIES.find((x) => x.value === c)?.label ?? c;
}

export const SPACE_LABELS: Record<ToolTone, string> = { orange: "כתום", green: "ירוק" };

export interface LibraryItem {
  id: string;
  space: ToolTone;
  category: LibraryCategory;
  title: string;
  description: string;
  filePath: string;
  fileName: string;
  mime: string;
  sizeBytes: number;
  sort: number;
  updatedAt: string;
  /** public URL of the file */
  url: string;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type PreviewKind = "image" | "pdf" | "office" | "none";

export function previewKind(mime: string, fileName: string): PreviewKind {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf" || /\.pdf$/i.test(fileName)) return "pdf";
  if (/\.(docx?|xlsx?|pptx?)$/i.test(fileName)) return "office";
  return "none";
}

export function fileKindLabel(mime: string, fileName: string): string {
  const k = previewKind(mime, fileName);
  if (k === "image") return "תמונה";
  if (k === "pdf") return "PDF";
  if (/\.docx?$/i.test(fileName)) return "Word";
  if (/\.xlsx?$/i.test(fileName)) return "Excel";
  if (/\.pptx?$/i.test(fileName)) return "PowerPoint";
  return fileName.split(".").pop()?.toUpperCase() ?? "קובץ";
}
