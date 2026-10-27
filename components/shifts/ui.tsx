"use client";
import { ReactNode, useState } from "react";
import { Person } from "@/lib/shifts/types";
import { colorFor } from "@/lib/shifts/colors";

export function cls(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export function Button({
  children,
  onClick,
  kind = "primary",
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cls(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40",
        kind === "primary" && "bg-pikud-orange text-white hover:bg-pikud-orange-dark",
        kind === "ghost" && "border border-line-strong bg-surface text-ink hover:border-pikud-orange",
        kind === "danger" && "bg-danger-pale text-danger hover:bg-danger hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-line bg-panel px-2.5 py-1.5 text-sm text-ink placeholder:text-faint";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cls("rounded-lg border border-line bg-panel p-4 shadow-lift", className)}>{children}</div>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">{children}</h2>
      {right}
    </div>
  );
}

export function RoleBadge({ roles }: { roles: Person["roles"] }) {
  const both = roles.length > 1;
  const officer = roles.includes("officer");
  return (
    <span
      className={cls(
        "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
        both
          ? "border border-line bg-paper text-ink"
          : officer
            ? "bg-officer-pale text-officer"
            : "bg-surface-2 text-ink-soft border border-line"
      )}
    >
      {both ? "O+S" : officer ? "OFC" : "SOL"}
    </span>
  );
}

export function PersonChip({
  person,
  onRemove,
  warn,
  as,
  variant,
}: {
  person: Person;
  onRemove?: () => void;
  warn?: boolean;
  as?: Person["roles"][number];
  variant?: "backup";
}) {
  const display = as ?? (person.roles.includes("officer") ? "officer" : "soldier");
  const c = person.color ?? colorFor(person.id);
  return (
    <span
      data-chip
      className={cls(
        "inline-flex items-center gap-1 rounded-md border py-0.5 ps-1.5 pe-1 text-xs font-medium text-ink",
        variant === "backup" && "border-dashed",
        warn && "!border-danger !bg-danger-pale !text-danger"
      )}
      style={
        warn
          ? undefined
          : { borderColor: c, backgroundColor: variant === "backup" ? `${c}14` : `${c}26` }
      }
      title={warn ? "This assignment breaks a rule" : undefined}
    >
      {person.name}
      {display === "officer" && (
        <span className="font-mono text-[9px] font-semibold opacity-60">O</span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${person.name}`}
          className="rounded px-0.5 leading-none text-current/60 hover:bg-black/10"
        >
          ×
        </button>
      )}
    </span>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pikud-navy/60 backdrop-blur-sm p-4 pt-14"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cls("w-full rounded-xl bg-surface border border-line p-5 shadow-2xl", wide ? "max-w-4xl" : "max-w-2xl")}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded px-2 text-faint hover:text-ink">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={cls(
        "inline-flex items-center gap-2 text-sm rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-pikud-orange/50",
        !label && "align-middle"
      )}
    >
      <span
        className={cls(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          on ? "bg-pikud-orange border-pikud-orange" : "bg-field border-line-strong"
        )}
      >
        <span
          className={cls(
            "absolute top-0.5 h-[18px] w-[18px] rounded-full shadow transition-all",
            on ? "bg-white end-0.5" : "bg-ink-muted start-0.5"
          )}
        />
      </span>
      {label && <span className="text-left">{label}</span>}
    </button>
  );
}

export function TagInput({
  tags,
  onChange,
  suggestions = [],
  placeholder = "Add tag…",
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-line bg-panel p-1.5">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded bg-paper px-1.5 py-0.5 text-xs">
          {t}
          <button
            onClick={() => onChange(tags.filter((x) => x !== t))}
            aria-label={`Remove tag ${t}`}
            className="text-faint hover:text-ink"
          >
            ×
          </button>
        </span>
      ))}
      <input
        list="tag-suggestions"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={placeholder}
        className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-faint"
      />
      <datalist id="tag-suggestions">
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}

export function ColorDot({ color, className }: { color?: string; className?: string }) {
  return (
    <span
      className={cls("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color ?? "#999" }}
    />
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-panel/60 p-10 text-center">
      <p className="mb-2 font-medium">{title}</p>
      <div className="text-sm text-faint">{children}</div>
    </div>
  );
}
