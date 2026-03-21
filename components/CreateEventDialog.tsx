"use client";

import { useState } from "react";
import { useEvents } from "@/lib/events-context";
import { useLogs } from "@/lib/logger";
import { generateId, now } from "@/lib/utils";
import { CrisisEvent, CRISIS_TYPES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";
import { X, MapPin, AlertTriangle } from "lucide-react";

interface Props { open: boolean; onClose: () => void; }

export default function CreateEventDialog({ open, onClose }: Props) {
  const { addEvent } = useEvents();
  const { addLog }   = useLogs();
  const [address, setAddress] = useState("");
  const [error, setError]     = useState("");

  function handleCreate() {
    if (!address.trim()) { setError("כתובת היא שדה חובה"); return; }

    const event: CrisisEvent = {
      id: generateId(), address: address.trim(),
      crisisType: null, infrastructureType: null, plugah: null,
      tzapi: null, resheimEogen: null,
      patzuim: null, lekudimSmuim: null, lekudimGluyim: null,
      hulitzu: null, meautarim: null, punu: null, nedarim: null,
      hearot: "", createdAt: now(), updatedAt: now(), status: "active",
    };

    addEvent(event);

    addLog({
      action: "פתיחת אירוע",
      eventId: event.id,
      eventAddress: event.address,
      plugah: null,
      detail: undefined,
    });

    setAddress(""); setError("");
    onClose();
    window.location.href = `/events/${event.id}`;
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pikud-navy/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        <div className="bg-pikud-navy px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-pikud-orange rounded-lg p-2">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">פתיחת אירוע חדש</h2>
              <p className="text-white/60 text-sm">כתובת בלבד נדרשת לפתיחה</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1 text-sm font-semibold">
              <MapPin className="w-4 h-4 text-pikud-orange" />
              כתובת האירוע <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address" placeholder="רחוב, מספר, עיר"
              value={address} onChange={(e) => { setAddress(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus className="text-base h-11"
            />
            {error && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />{error}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-pikud-orange-pale border border-pikud-orange/20 p-3">
            <p className="text-sm text-pikud-orange-dark font-medium">
              ℹ️ פרטים נוספים (סוג אירוע, תשתית, פלוגה, צפי) יוכלו להתמלא בדף האירוע
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <Button variant="orange" className="flex-1 text-base font-bold h-11" onClick={handleCreate}>פתח אירוע</Button>
          <Button variant="outline" className="h-11" onClick={onClose}>ביטול</Button>
        </div>
      </div>
    </div>
  );
}
