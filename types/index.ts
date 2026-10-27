export type Plugah = "alef" | "bet" | "gimel" | "other" | null;

export type InfrastructureType =
  | "private_home" | "residential" | "assisted_living"
  | "education" | "medical"
  | "public" | "mall" | "hotel" | "offices"
  | "industrial" | "shelter" | "transport"
  | "open_area" | "other"
  | null;

export type CrisisType =
  | "שברי רסיס"
  | "הרס מבנה"
  | "פגיעה ישירה"
  | "שריפה"
  | "הצפה"
  | "רעידת אדמה"
  | "אחר"
  | null;

export type EventStatus = "active" | "closed";

export interface CrisisEvent {
  id: string;
  /** optional event name; the card title is name, else address */
  name: string;
  address: string;
  /** person in charge of the event at battalion level */
  commander: string;
  crisisType: CrisisType;
  infrastructureType: InfrastructureType;
  plugah: Plugah;
  /** forecast of people on site, before the anchor list exists */
  tzapi: number | null;
  /** the anchor list: how many people are known to have been on site */
  anchor: number | null;
  lekudimGluyim: number | null;
  lekudimSmuim: number | null;
  hulitzu: number | null;
  meautarim: number | null;
  punu: number | null;
  hearot: string;
  createdAt: string;
  updatedAt: string;
  status: EventStatus;
}

/** The five counters that are subtracted from the anchor to give the missing count. */
export const COUNTER_KEYS = ["lekudimGluyim", "lekudimSmuim", "hulitzu", "meautarim", "punu"] as const;
export type CounterKey = (typeof COUNTER_KEYS)[number];

export const PLUGAH_KEYS: NonNullable<Plugah>[] = ["alef", "bet", "gimel", "other"];

export const PLUGAH_LABELS: Record<NonNullable<Plugah>, string> = {
  alef:  "פלוגה א",
  bet:   "פלוגה ב",
  gimel: "פלוגה ג",
  other: "אחר",
};

/** One source of truth for plugah colors. Becomes per-battalion in the settings stage. */
export const PLUGAH_HEX: Record<NonNullable<Plugah> | "none", string> = {
  alef:  "#1A3F7A",
  bet:   "#2E7D32",
  gimel: "#6A1B9A",
  other: "#37474F",
  none:  "#9B9890",
};

export function plugahHex(plugah: Plugah): string {
  return PLUGAH_HEX[plugah ?? "none"];
}

export function plugahLabel(plugah: Plugah, fallback = "ללא פלוגה"): string {
  return plugah ? PLUGAH_LABELS[plugah] : fallback;
}

/** What to call the event: its name, else its address. */
export function eventTitle(e: Pick<CrisisEvent, "name" | "address">): string {
  return e.name.trim() || e.address.trim() || "אירוע ללא שם";
}

export const INFRASTRUCTURE_LABELS: Record<NonNullable<InfrastructureType>, string> = {
  private_home:    "בית פרטי",
  residential:     "בניין מגורים",
  assisted_living: "דיור מוגן / בית אבות",
  education:       "מוסד חינוך (בית ספר / גן)",
  medical:         "בית חולים / מרפאה",
  public:          "מבנה ציבור",
  mall:            "מרכז מסחרי / קניון",
  hotel:           "מלון",
  offices:         "משרדים",
  industrial:      "מפעל / תעשייה",
  shelter:         "מקלט ציבורי",
  transport:       "תחנת תחבורה",
  open_area:       "שטח פתוח",
  other:           "אחר",
};

/** Select groups, in display order. */
export const INFRASTRUCTURE_GROUPS: { label: string; keys: NonNullable<InfrastructureType>[] }[] = [
  { label: "מגורים",          keys: ["private_home", "residential", "assisted_living"] },
  { label: "חינוך ובריאות",   keys: ["education", "medical"] },
  { label: "ציבור ומסחר",     keys: ["public", "mall", "hotel", "offices"] },
  { label: "תעשייה ותשתית",   keys: ["industrial", "shelter", "transport"] },
  { label: "אחר",             keys: ["open_area", "other"] },
];

/** Keys used before the list grew; rows still carrying them read as the new key. */
const LEGACY_INFRASTRUCTURE: Record<string, NonNullable<InfrastructureType>> = {
  house: "private_home", building: "residential", school: "education",
};

export function normalizeInfrastructure(raw: string | null | undefined): InfrastructureType {
  if (!raw) return null;
  if (raw in LEGACY_INFRASTRUCTURE) return LEGACY_INFRASTRUCTURE[raw];
  return raw in INFRASTRUCTURE_LABELS ? (raw as NonNullable<InfrastructureType>) : "other";
}

export const CRISIS_TYPES: NonNullable<CrisisType>[] = [
  "שברי רסיס",
  "רעידת אדמה",
  "הרס מבנה",
  "פגיעה ישירה",
  "שריפה",
  "הצפה",
  "אחר",
];
