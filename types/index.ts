export type Plugah = "alef" | "bet" | "gimel" | "other" | null;

export type InfrastructureType = "house" | "building" | "school" | "other" | null;

export type CrisisType =
  | "שברי רסיס"
  | "הרס מבנה"
  | "פגיעה ישירה"
  | "שריפה"
  | "הצפה"
  | "רעידת אדמה"
  | "אחר"
  | null;

export interface CrisisEvent {
  id: string;
  address: string;
  crisisType: CrisisType;
  infrastructureType: InfrastructureType;
  plugah: Plugah;
  tzapi: number | null;
  resheimEogen: number | null;
  patzuim: number | null;
  lekudimSmuim: number | null;
  lekudimGluyim: number | null;
  hulitzu: number | null;
  meautarim: number | null;
  punu: number | null;
  nedarim: number | null;
  hearot: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "closed";
}

export const PLUGAH_LABELS: Record<NonNullable<Plugah>, string> = {
  alef: "פלוגה א",
  bet:  "פלוגה ב",
  gimel:"פלוגה ג",
  other:"אחר",
};

export const PLUGAH_COLORS: Record<NonNullable<Plugah> | "none", string> = {
  alef:  "plugah-alef",
  bet:   "plugah-bet",
  gimel: "plugah-gimel",
  other: "plugah-other",
  none:  "plugah-none",
};

export const INFRASTRUCTURE_LABELS: Record<NonNullable<InfrastructureType>, string> = {
  house:    "בית",
  building: "בניין",
  school:   "בית ספר",
  other:    "אחר",
};

export const CRISIS_TYPES: CrisisType[] = [
  "שברי רסיס",
  "רעידת אדמה",
  "הרס מבנה",
  "פגיעה ישירה",
  "שריפה",
  "הצפה",
  "אחר",
];
