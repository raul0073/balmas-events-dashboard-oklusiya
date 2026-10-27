"use client";

import { UserCheck, MessageCircle, Phone, Users, Radio, MoreHorizontal, FileQuestion } from "lucide-react";
import { Input } from "@/components/ui/primitives";
import { CHANNELS, type Channel, type Provenance } from "@/lib/events/provenance";

const CHANNEL_ICONS: Record<Channel, React.ReactNode> = {
  whatsapp: <MessageCircle className="w-3.5 h-3.5" />,
  phone:    <Phone className="w-3.5 h-3.5" />,
  face:     <Users className="w-3.5 h-3.5" />,
  radio:    <Radio className="w-3.5 h-3.5" />,
  other:    <MoreHorizontal className="w-3.5 h-3.5" />,
};

interface Props {
  value: Provenance;
  onChange: (next: Provenance) => void;
  /** the event's person in charge, offered as the default reporter */
  defaultReporter: string;
  disabled?: boolean;
}

/** "מקור העדכון": who reported, through which channel, why it changed. Pre-filled so a routine save is one click. */
export default function ProvenanceBar({ value, onChange, defaultReporter, disabled = false }: Props) {
  const reporter = value.reportedBy || defaultReporter;

  return (
    <div className="shrink-0 bg-pikud-cream border-t border-pikud-gray-light px-4 sm:px-6 py-2.5">
      <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
        <span className="text-xs font-bold text-ink shrink-0">מקור העדכון</span>

        <label className="flex items-center gap-1.5 text-xs text-ink-soft">
          <UserCheck className="w-3.5 h-3.5 text-pikud-orange shrink-0" />
          <span className="shrink-0">מסר</span>
          <Input value={reporter} disabled={disabled} placeholder="שם ותפקיד"
            onChange={(e) => onChange({ ...value, reportedBy: e.target.value })}
            className="h-8 text-xs w-44 bg-surface" />
        </label>

        <div className="flex items-center gap-1" role="radiogroup" aria-label="איך התקבל">
          {CHANNELS.map((c) => {
            const active = value.channel === c.value;
            return (
              <button key={c.value} type="button" role="radio" aria-checked={active} disabled={disabled}
                onClick={() => onChange({ ...value, channel: active ? null : c.value })}
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  active ? "bg-pikud-navy text-white border-ink" : "bg-surface text-ink border-pikud-gray-light hover:border-ink"
                } disabled:opacity-50`}>
                {CHANNEL_ICONS[c.value]} {c.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-ink-soft flex-1 min-w-[200px]">
          <FileQuestion className="w-3.5 h-3.5 text-pikud-orange shrink-0" />
          <span className="shrink-0">סיבת השינוי</span>
          <Input value={value.reason} disabled={disabled} placeholder="לא חובה"
            onChange={(e) => onChange({ ...value, reason: e.target.value })}
            className="h-8 text-xs bg-surface" />
        </label>
      </div>
    </div>
  );
}
