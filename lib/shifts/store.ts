"use client";
import { create } from "zustand";
import { AppConfig, Group, Lang, Person, RotationPeriod, RotationPlan, Rule, Schedule, ShiftTemplate } from "./types";
import { nextColor, paletteColor } from "./colors";
import { addDays, todayYmd } from "./time";
import { generateSchedule } from "./generator";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const defaultConfig = (): AppConfig => ({
  shifts: [
    { id: "morning", name: "Morning", start: "06:00", end: "14:00", soldiers: 2, officers: 1, backups: 0, isNight: false },
    { id: "evening", name: "Evening", start: "14:00", end: "22:00", soldiers: 2, officers: 1, backups: 0, isNight: false },
    { id: "night", name: "Night", start: "22:00", end: "06:00", soldiers: 2, officers: 1, backups: 1, isNight: true },
  ],
  minRestHours: 8,
  maxPerDay: 1,
  maxPerWeek: 7,
  weekStart: 0,
});

export interface DataSlice {
  lang: Lang;
  people: Person[];
  groups: Group[];
  periods: RotationPeriod[];
  plan: RotationPlan | null;
  config: AppConfig;
  rules: Rule[];
  schedule: Schedule | null;
}

export interface AppState extends DataSlice {
  /** true once the battalion row was loaded (or found empty) */
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setLang: (l: Lang) => void;

  addPerson: (p: Person) => void;
  updatePerson: (p: Person) => void;
  removePerson: (id: string) => void;

  addGroup: (name: string) => void;
  renameGroup: (id: string, name: string) => void;
  removeGroup: (id: string) => void;

  setPlan: (p: RotationPlan | null) => void;
  applyPlan: (from: string, firstTurn: number) => void;

  addPeriod: (p: RotationPeriod) => void;
  updatePeriod: (p: RotationPeriod) => void;
  removePeriod: (id: string) => void;

  setConfig: (c: AppConfig) => void;

  addRule: (r: Rule) => void;
  updateRule: (r: Rule) => void;
  removeRule: (id: string) => void;

  generate: (from: string, to: string, seed?: number) => void;
  clearSchedule: () => void;
  assign: (key: string, personId: string) => void;
  unassign: (key: string, personId: string) => void;
  assignBackup: (key: string, personId: string) => void;
  unassignBackup: (key: string, personId: string) => void;

  clearPeople: () => void;
  clearGroups: () => void;
  clearRules: () => void;
  clearPeriods: () => void;
  clearPlan: () => void;
  resetConfig: () => void;
  resetAll: () => void;

  importAll: (data: Partial<DataSlice>) => void;
  loadSample: () => void;

  applyWizard: (w: WizardResult) => void;
}

export interface WizardResult {
  from: string;
  to: string;
  shifts: ShiftTemplate[];
  minRestHours: number;
  maxPerDay: number;
  maxPerWeek: number;
  weekStart: 0 | 1;
  rotation: { groupId?: string; name: string; days: number }[];
  generateNow: boolean;
}

function patchInstance(
  s: AppState,
  key: string,
  fn: (inst: NonNullable<Schedule["instances"][string]>) => Schedule["instances"][string]
) {
  if (!s.schedule) return s;
  const inst = s.schedule.instances[key];
  if (!inst) return s;
  return {
    schedule: {
      ...s.schedule,
      instances: { ...s.schedule.instances, [key]: fn(inst) },
    },
  };
}

export const useApp = create<AppState>()(
    (set, get) => ({
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      lang: "he",
      people: [],
      groups: [],
      periods: [],
      plan: null,
      config: defaultConfig(),
      rules: [],
      schedule: null,

      setLang: (lang) => set({ lang }),

      addPerson: (p) =>
        set((s) => ({
          people: [...s.people, { ...p, color: p.color ?? nextColor(s.people.map((x) => x.color)) }],
        })),
      updatePerson: (p) => set((s) => ({ people: s.people.map((x) => (x.id === p.id ? p : x)) })),
      removePerson: (id) =>
        set((s) => ({
          people: s.people.filter((x) => x.id !== id),
          rules: s.rules.filter((r) => !("personId" in r) || r.personId !== id),
          schedule: s.schedule
            ? {
                ...s.schedule,
                instances: Object.fromEntries(
                  Object.entries(s.schedule.instances).map(([k, inst]) => [
                    k,
                    {
                      ...inst,
                      assigned: inst.assigned.filter((a) => a !== id),
                      backups: inst.backups.filter((a) => a !== id),
                    },
                  ])
                ),
              }
            : null,
        })),

      addGroup: (name) => set((s) => ({ groups: [...s.groups, { id: uid(), name }] })),
      renameGroup: (id, name) =>
        set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, name } : g)) })),
      removeGroup: (id) =>
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          people: s.people.map((p) => (p.groupId === id ? { ...p, groupId: undefined } : p)),
          periods: s.periods.filter((p) => p.groupId !== id),
          plan: s.plan ? { ...s.plan, turns: s.plan.turns.filter((tu) => tu.groupId !== id) } : null,
        })),

      setPlan: (plan) => set({ plan }),
      applyPlan: (from, firstTurn) =>
        set((s) => {
          const plan = s.plan;
          if (!plan || plan.turns.length === 0 || !plan.start || !plan.end) return s;
          const f = from && from > plan.start ? from : plan.start;
          if (f > plan.end) return s;
          const kept = s.periods
            .filter((p) => p.from < f)
            .map((p) => (p.to >= f ? { ...p, to: addDays(f, -1) } : p))
            .filter((p) => p.from <= p.to);
          const gen: RotationPeriod[] = [];
          let cursor = f;
          let i = ((firstTurn % plan.turns.length) + plan.turns.length) % plan.turns.length;
          let guard = 0;
          while (cursor <= plan.end && guard < 500) {
            const turn = plan.turns[i % plan.turns.length];
            const days = Math.max(1, Math.floor(turn.days || 1));
            const to = addDays(cursor, days - 1);
            gen.push({ id: uid(), from: cursor, to: to > plan.end ? plan.end : to, groupId: turn.groupId });
            cursor = addDays(cursor, days);
            i++;
            guard++;
          }
          return { periods: [...kept, ...gen] };
        }),

      addPeriod: (p) => set((s) => ({ periods: [...s.periods, p] })),
      updatePeriod: (p) => set((s) => ({ periods: s.periods.map((x) => (x.id === p.id ? p : x)) })),
      removePeriod: (id) => set((s) => ({ periods: s.periods.filter((x) => x.id !== id) })),

      setConfig: (c) => set({ config: c }),

      addRule: (r) => set((s) => ({ rules: [...s.rules, r] })),
      updateRule: (r) => set((s) => ({ rules: s.rules.map((x) => (x.id === r.id ? r : x)) })),
      removeRule: (id) => set((s) => ({ rules: s.rules.filter((x) => x.id !== id) })),

      generate: (from, to, seed) => {
        const { people, config, rules, periods } = get();
        set({ schedule: generateSchedule({ from, to, people, config, rules, periods, seed }) });
      },
      clearSchedule: () => set({ schedule: null }),

      assign: (key, personId) =>
        set((s) =>
          patchInstance(s as AppState, key, (inst) =>
            inst.assigned.includes(personId) || inst.backups.includes(personId)
              ? inst
              : { ...inst, assigned: [...inst.assigned, personId] }
          )
        ),
      unassign: (key, personId) =>
        set((s) =>
          patchInstance(s as AppState, key, (inst) => ({
            ...inst,
            assigned: inst.assigned.filter((a) => a !== personId),
          }))
        ),
      assignBackup: (key, personId) =>
        set((s) =>
          patchInstance(s as AppState, key, (inst) =>
            inst.assigned.includes(personId) || inst.backups.includes(personId)
              ? inst
              : { ...inst, backups: [...inst.backups, personId] }
          )
        ),
      unassignBackup: (key, personId) =>
        set((s) =>
          patchInstance(s as AppState, key, (inst) => ({
            ...inst,
            backups: inst.backups.filter((a) => a !== personId),
          }))
        ),

      clearPeople: () =>
        set((s) => ({
          people: [],
          rules: s.rules.filter((r) => !("personId" in r) || !r.personId),
          schedule: s.schedule
            ? {
                ...s.schedule,
                instances: Object.fromEntries(
                  Object.entries(s.schedule.instances).map(([k, inst]) => [
                    k,
                    { ...inst, assigned: [], backups: [] },
                  ])
                ),
              }
            : null,
        })),
      clearGroups: () =>
        set((s) => ({
          groups: [],
          people: s.people.map((p) => (p.groupId ? { ...p, groupId: undefined } : p)),
          periods: [],
          plan: s.plan ? { ...s.plan, turns: [] } : null,
        })),
      clearRules: () => set({ rules: [] }),
      clearPeriods: () => set({ periods: [] }),
      clearPlan: () => set({ plan: null }),
      resetConfig: () => set({ config: defaultConfig(), schedule: null }),
      resetAll: () =>
        set({
          people: [],
          groups: [],
          periods: [],
          plan: null,
          rules: [],
          config: defaultConfig(),
          schedule: null,
        }),

      importAll: (data) =>
        set({
          lang: data.lang ?? get().lang,
          people: data.people ?? [],
          groups: data.groups ?? [],
          periods: data.periods ?? [],
          plan: data.plan ?? null,
          config: data.config ?? defaultConfig(),
          rules: data.rules ?? [],
          schedule: data.schedule ?? null,
        }),

      applyWizard: (w) => {
        const groups = get().groups.map((g) => ({ ...g }));
        const turns: RotationPlan["turns"] = [];
        for (const r of w.rotation) {
          const name = r.name.trim() || "Team";
          let gid = r.groupId;
          if (gid) {
            const g = groups.find((x) => x.id === gid);
            if (g) g.name = name;
            else gid = undefined;
          }
          if (!gid) {
            gid = uid();
            groups.push({ id: gid, name });
          }
          turns.push({ groupId: gid, days: Math.max(1, Math.floor(r.days || 1)) });
        }
        const plan: RotationPlan = { start: w.from, end: w.to, turns };
        set({
          config: {
            shifts: w.shifts,
            minRestHours: w.minRestHours,
            maxPerDay: w.maxPerDay,
            maxPerWeek: w.maxPerWeek,
            weekStart: w.weekStart,
          },
          groups,
          plan,
          periods: [],
        });
        get().applyPlan(w.from, 0);
        if (w.generateNow) get().generate(w.from, w.to);
      },

      loadSample: () => {
        const teamA = { id: "team-a", name: "Team A" };
        const teamB = { id: "team-b", name: "Team B" };
        const mk = (
          name: string,
          roles: Person["roles"],
          groupId: string,
          tags: string[] = []
        ): Person => ({
          id: uid(),
          name,
          roles,
          groupId,
          tags,
          unavailable: [],
          bannedShiftIds: [],
          active: true,
        });
        let ci = 0;
        const withColors = (ps: Person[]) => ps.map((p) => ({ ...p, color: paletteColor(ci++) }));
        const people: Person[] = [
          // Team A
          mk("Adi", ["officer"], teamA.id, ["female"]),
          mk("Noam", ["officer"], teamA.id, ["male"]),
          mk("Lior", ["officer"], teamA.id, ["male"]),
          mk("Tamar", ["soldier"], teamA.id, ["female", "medic"]),
          mk("Yossi", ["soldier"], teamA.id, ["male", "driver"]),
          mk("Dana", ["soldier"], teamA.id, ["female"]),
          mk("Omer", ["soldier"], teamA.id, ["male"]),
          mk("Shira", ["soldier"], teamA.id, ["female"]),
          mk("Eitan", ["soldier"], teamA.id, ["male", "medic"]),
          // Team B
          mk("Gal", ["officer"], teamB.id, ["female"]),
          mk("Rotem", ["officer", "soldier"], teamB.id, ["male"]),
          mk("Alon", ["officer"], teamB.id, ["male"]),
          mk("Maya", ["soldier"], teamB.id, ["female", "driver"]),
          mk("Roi", ["soldier"], teamB.id, ["male"]),
          mk("Yael", ["soldier"], teamB.id, ["female"]),
          mk("Nadav", ["soldier"], teamB.id, ["male"]),
          mk("Hila", ["soldier"], teamB.id, ["female"]),
          mk("Ben", ["soldier"], teamB.id, ["male", "medic"]),
        ];
        const colored = withColors(people);
        people.length = 0;
        people.push(...colored);
        people[4].bannedShiftIds = ["night"]; // Yossi never works nights
        people[7].unavailable = [
          { id: uid(), from: addDays(todayYmd(), 2), to: addDays(todayYmd(), 3), reason: "Leave" },
        ];
        // hour-level absence: leaves 10:00, back next morning 06:00
        people[5].unavailable = [
          {
            id: uid(),
            from: addDays(todayYmd(), 1),
            fromTime: "10:00",
            to: addDays(todayYmd(), 2),
            toTime: "06:00",
            reason: "Home",
          },
        ];
        const plan: RotationPlan = {
          start: todayYmd(),
          end: addDays(todayYmd(), 27),
          turns: [
            { groupId: teamA.id, days: 8 },
            { groupId: teamB.id, days: 6 },
          ],
        };
        set({
          people,
          groups: [teamA, teamB],
          periods: [],
          plan,
          config: defaultConfig(),
          rules: [],
          schedule: null,
        });
        get().applyPlan(plan.start, 0);
        get().generate(todayYmd(), addDays(todayYmd(), 13));
      },
    })
);

/** Pages wait for the battalion row before rendering, so the DOM never shows an empty store first. */
export function useMounted() {
  return useApp((s) => s.hydrated);
}

/** The persisted part of the store, as saved per battalion. */
export function pickData(s: AppState): DataSlice {
  const { lang, people, groups, periods, plan, config, rules, schedule } = s;
  return { lang, people, groups, periods, plan, config, rules, schedule };
}
