import { normalizeInfrastructure, type CrisisEvent, type CrisisType, type Plugah } from "@/types";
import type { LogEntry } from "@/lib/logger";

/** Database row shapes (snake_case) ↔ app models (camelCase). */

export interface EventRow {
  id: string;
  battalion_id: string;
  name: string;
  address: string;
  commander: string;
  crisis_type: string | null;
  infrastructure_type: string | null;
  plugah: string | null;
  tzapi: number | null;
  anchor: number | null;
  lekudim_gluyim: number | null;
  lekudim_smuim: number | null;
  hulitzu: number | null;
  meautarim: number | null;
  punu: number | null;
  hearot: string;
  sources_done: string[] | null;
  status: "active" | "closed";
  created_at: string;
  updated_at: string;
}

export function rowToEvent(r: EventRow): CrisisEvent {
  return {
    id: r.id,
    name: r.name ?? "",
    address: r.address,
    commander: r.commander ?? "",
    crisisType: (r.crisis_type as CrisisType) ?? null,
    infrastructureType: normalizeInfrastructure(r.infrastructure_type),
    plugah: (r.plugah as Plugah) ?? null,
    tzapi: r.tzapi,
    anchor: r.anchor,
    lekudimGluyim: r.lekudim_gluyim,
    lekudimSmuim: r.lekudim_smuim,
    hulitzu: r.hulitzu,
    meautarim: r.meautarim,
    punu: r.punu,
    hearot: r.hearot ?? "",
    sourcesDone: r.sources_done ?? [],
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function eventToRow(e: CrisisEvent, battalionId: string): EventRow {
  return {
    id: e.id,
    battalion_id: battalionId,
    name: e.name ?? "",
    address: e.address,
    commander: e.commander ?? "",
    crisis_type: e.crisisType,
    infrastructure_type: e.infrastructureType,
    plugah: e.plugah,
    tzapi: e.tzapi,
    anchor: e.anchor,
    lekudim_gluyim: e.lekudimGluyim,
    lekudim_smuim: e.lekudimSmuim,
    hulitzu: e.hulitzu,
    meautarim: e.meautarim,
    punu: e.punu,
    hearot: e.hearot ?? "",
    sources_done: e.sourcesDone ?? [],
    status: e.status,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}

export interface LogRow {
  id: string;
  battalion_id: string;
  event_id: string | null;
  event_address: string;
  action: string;
  plugah: string | null;
  detail: string | null;
  created_at: string;
}

export function rowToLog(r: LogRow): LogEntry {
  return {
    id: r.id,
    timestamp: r.created_at,
    action: r.action as LogEntry["action"],
    eventId: r.event_id ?? "",
    eventAddress: r.event_address,
    plugah: (r.plugah as Plugah) ?? null,
    detail: r.detail ?? undefined,
  };
}

export function logToRow(l: LogEntry, battalionId: string): LogRow {
  return {
    id: l.id,
    battalion_id: battalionId,
    event_id: l.eventId || null,
    event_address: l.eventAddress,
    action: l.action,
    plugah: l.plugah,
    detail: l.detail ?? null,
    created_at: l.timestamp,
  };
}
