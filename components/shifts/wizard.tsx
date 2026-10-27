"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { uid, useApp, WizardResult } from "@/lib/shifts/store";
import { ShiftTemplate } from "@/lib/shifts/types";
import { addDays, parseHm, todayYmd } from "@/lib/shifts/time";
import { useT } from "@/lib/shifts/i18n";
import { staffingNeeds } from "@/lib/shifts/needs";
import { computeStats } from "@/lib/shifts/stats";
import { Button, Field, Modal, Toggle, cls, inputCls } from "@/components/shifts/ui";

type TFn = (k: string, v?: Record<string, string | number>) => string;

function prefillShifts(count: number, t: TFn): ShiftTemplate[] {
  const named: Record<number, string[]> = {
    1: [t("wiz.nDay")],
    2: [t("wiz.nDay"), t("wiz.nNight")],
    3: [t("wiz.nMorning"), t("wiz.nEvening"), t("wiz.nNight")],
    4: [t("wiz.nMorning"), t("wiz.nNoon"), t("wiz.nEvening"), t("wiz.nNight")],
  };
  const names = named[count] ?? Array.from({ length: count }, (_, i) => t("wiz.nShift", { n: i + 1 }));
  const len = Math.round((24 / count) * 12) / 12;
  const out: ShiftTemplate[] = [];
  let startMin = 6 * 60;
  for (let i = 0; i < count; i++) {
    const endMin = Math.round(startMin + len * 60) % (24 * 60);
    const hm = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const start = hm(startMin), end = hm(endMin);
    const crossesMidnight = parseHm(end) <= parseHm(start);
    const isNight = crossesMidnight || parseHm(start) >= 21 * 60;
    out.push({ id: uid(), name: names[i], start, end, soldiers: 2, officers: 1, backups: isNight ? 1 : 0, isNight });
    startMin = endMin;
  }
  return out;
}

type GroupMode = "none" | "existing" | "new";
type RotationRow = { groupId?: string; name: string; days: number };

const STEPS = 4; // dates, shifts, groups, summary; the results screen comes after creation

/** A choice card used for "don't know" and the group modes. */
function Choice({ active, title, help, disabled, onClick }: { active: boolean; title: string; help: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={active}
      className={cls(
        "w-full rounded-xl border p-3 text-start transition-colors",
        active ? "border-pikud-orange bg-pikud-orange/10" : "border-line bg-surface hover:border-pikud-orange/60",
        disabled && "opacity-50 cursor-not-allowed hover:border-line"
      )}>
      <div className="font-semibold text-ink">{title}</div>
      <div className="mt-0.5 text-xs text-faint">{help}</div>
    </button>
  );
}

export function Wizard({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { groups, people, config, applyWizard } = useApp();
  const { t } = useT();
  const [step, setStep] = useState(0);

  // 1 · dates
  const [from, setFrom] = useState(todayYmd());
  const [to, setTo] = useState(addDays(todayYmd(), 60));

  // 2 · shifts
  const [count, setCount] = useState<number | null>(3);     // null = "don't know" → default day
  const [shifts, setShifts] = useState<ShiftTemplate[]>(() => prefillShifts(3, t));

  // 3 · groups
  const hasPeople = people.some((p) => p.active);
  const [groupMode, setGroupMode] = useState<GroupMode>(groups.length > 0 ? "existing" : "none");
  const [picked, setPicked] = useState<Record<string, number>>(() => Object.fromEntries(groups.map((g) => [g.id, 7])));
  const [newRows, setNewRows] = useState<RotationRow[]>([
    { name: t("wiz.teamDefault", { n: "A" }), days: 8 },
    { name: t("wiz.teamDefault", { n: "B" }), days: 6 },
  ]);

  // 4 · limits
  const [limits, setLimits] = useState({
    minRestHours: config.minRestHours, maxPerDay: config.maxPerDay, maxPerWeek: config.maxPerWeek, weekStart: config.weekStart as 0 | 1,
  });

  // results
  const [result, setResult] = useState<{ generated: boolean; filled: number; required: number } | null>(null);

  const datesOk = !!from && !!to && from <= to;
  const days = datesOk ? Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1 : 0;

  const rotation: RotationRow[] = useMemo(() => {
    if (groupMode === "none") return [];
    if (groupMode === "existing") return groups.filter((g) => picked[g.id]).map((g) => ({ groupId: g.id, name: g.name, days: Math.max(1, picked[g.id]) }));
    return newRows.filter((r) => r.name.trim());
  }, [groupMode, groups, picked, newRows]);

  const needs = useMemo(() => staffingNeeds(shifts, rotation.length, people, limits.maxPerDay), [shifts, rotation.length, people, limits.maxPerDay]);
  const shortfall = needs.missing.soldiers + needs.missing.officers;

  const stepOk =
    step === 0 ? datesOk
    : step === 1 ? shifts.length > 0
    : step === 2 ? (groupMode === "none" || rotation.length > 0)
    : true;

  const patchShift = (id: string, patch: Partial<ShiftTemplate>) => setShifts(shifts.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const chooseCount = (n: number | null) => { setCount(n); setShifts(prefillShifts(n ?? 3, t)); };

  const create = () => {
    const generateNow = hasPeople;
    const w: WizardResult = { from, to, shifts, ...limits, rotation, generateNow };
    applyWizard(w);
    const { schedule, people: ppl, config: cfg } = useApp.getState();
    const stats = generateNow ? computeStats(schedule, ppl, cfg) : null;
    setResult({ generated: generateNow && !!schedule, filled: stats?.filled ?? 0, required: stats?.required ?? 0 });
  };

  const stepTitle = [t("wiz.q1"), t("wiz.q2"), t("wiz.q3Title"), t("wiz.q4Title")][step];

  return (
    <Modal title={result ? t("wiz.doneTitle") : t("wiz.title")} onClose={onClose} wide>
      {!result && (
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-xs text-faint">{t("wiz.step", { n: step + 1, total: STEPS })}</span>
          <div className="flex gap-1">
            {Array.from({ length: STEPS }).map((_, i) => (
              <span key={i} className={cls("h-1.5 w-6 rounded-full", i <= step ? "bg-pikud-orange" : "bg-line")} />
            ))}
          </div>
        </div>
      )}

      {/* ── results ── */}
      {result && (
        <div className="grid gap-4">
          <ul className="grid gap-2 text-sm">
            <li className="rounded-lg bg-surface-2 px-3 py-2">{t("wiz.doneShifts", { n: shifts.length, days })}</li>
            <li className="rounded-lg bg-surface-2 px-3 py-2">{rotation.length ? t("wiz.doneGroups", { n: rotation.length }) : t("wiz.doneNoGroups")}</li>
            <li className={cls("rounded-lg px-3 py-2", result.generated ? "bg-green-50 text-green-800" : "bg-samber-pale text-samber")}>
              {result.generated ? t("wiz.doneGenerated", { filled: result.filled, required: result.required }) : t("wiz.doneNotGenerated")}
            </li>
          </ul>
          <NeedsCard needs={needs} t={t} hasPeople={hasPeople} />
          <div className="rounded-xl border border-line p-3">
            <div className="mb-2 text-xs font-semibold text-faint">{t("wiz.doneNext")}</div>
            <div className="flex flex-wrap gap-2">
              {(shortfall > 0 || !hasPeople) && (
                <Button onClick={() => { onClose(); router.push("/shifts/people"); }}>{t("wiz.goPeople")}</Button>
              )}
              {result.generated && (
                <Button kind={shortfall > 0 ? "ghost" : "primary"} onClick={() => { onClose(); router.push("/shifts/schedule"); }}>{t("wiz.goSchedule")}</Button>
              )}
              <Button kind="ghost" onClick={onClose}>{t("wiz.done")}</Button>
            </div>
          </div>
        </div>
      )}

      {!result && <p className="mb-3 text-sm font-medium">{stepTitle}</p>}

      {/* ── 1 · dates ── */}
      {!result && step === 0 && (
        <div className="grid gap-3">
          <p className="text-xs text-faint">{t("wiz.q1Help")}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("config.projStart")}><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label={t("config.projEnd")}><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          </div>
          {!datesOk && <p className="text-xs text-danger">{t("wiz.needTwoDates")}</p>}
        </div>
      )}

      {/* ── 2 · shifts ── */}
      {!result && step === 1 && (
        <div className="grid gap-3">
          <p className="text-xs text-faint">{t("wiz.q2Help")}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("wiz.count")}>
            {[1, 2, 3, 4].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={count === n} onClick={() => chooseCount(n)}
                className={cls("rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                  count === n ? "border-pikud-orange bg-pikud-orange text-white" : "border-line-strong bg-surface text-ink hover:border-pikud-orange")}>
                {n === 1 ? t("wiz.countChip1") : t("wiz.countChip", { n })}
              </button>
            ))}
            <button type="button" role="radio" aria-checked={count === null} onClick={() => chooseCount(null)}
              className={cls("rounded-full border border-dashed px-3 py-1.5 text-sm font-semibold transition-colors",
                count === null ? "border-pikud-orange bg-pikud-orange/10 text-ink" : "border-line-strong bg-surface text-faint hover:border-pikud-orange")}>
              {t("wiz.dontKnow")}
            </button>
          </div>
          {count === null && <p className="rounded-lg bg-samber-pale px-3 py-2 text-xs text-samber">{t("wiz.dontKnowHelp")}</p>}
          <div className="overflow-x-auto">
            <div className="grid min-w-[560px] gap-2">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_0.7fr_0.7fr_0.7fr_3.5rem] items-center gap-2 text-xs text-faint">
                <span className="px-2.5">{t("config.colName")}</span>
                <span className="text-center">{t("config.colStart")}</span>
                <span className="text-center">{t("config.colEnd")}</span>
                <span className="text-center">{t("config.colSoldiers")}</span>
                <span className="text-center">{t("config.colOfficers")}</span>
                <span className="text-center">{t("config.colBackups")}</span>
                <span className="text-center">{t("config.colNight")}</span>
              </div>
              {shifts.map((s) => (
                <div key={s.id} className="grid grid-cols-[1.2fr_1fr_1fr_0.7fr_0.7fr_0.7fr_3.5rem] items-center gap-2 [&>*:last-child]:justify-self-center">
                  <input className={inputCls} value={s.name} onChange={(e) => patchShift(s.id, { name: e.target.value })} />
                  <input type="time" className={inputCls} value={s.start} onChange={(e) => patchShift(s.id, { start: e.target.value })} />
                  <input type="time" className={inputCls} value={s.end} onChange={(e) => patchShift(s.id, { end: e.target.value })} />
                  <input type="number" min={0} className={inputCls} value={s.soldiers} onChange={(e) => patchShift(s.id, { soldiers: Number(e.target.value) })} />
                  <input type="number" min={0} className={inputCls} value={s.officers} onChange={(e) => patchShift(s.id, { officers: Number(e.target.value) })} />
                  <input type="number" min={0} className={inputCls} value={s.backups} onChange={(e) => patchShift(s.id, { backups: Number(e.target.value) })} />
                  <Toggle on={s.isNight} onChange={(isNight) => patchShift(s.id, { isNight })} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 3 · groups ── */}
      {!result && step === 2 && (
        <div className="grid gap-3">
          <p className="text-xs text-faint">{t("wiz.q3Help2")}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Choice active={groupMode === "none"} title={t("wiz.noGroups")} help={t("wiz.noGroupsHelp")} onClick={() => setGroupMode("none")} />
            <Choice active={groupMode === "existing"} title={t("wiz.pickGroups")} help={t("wiz.pickGroupsHelp")} disabled={groups.length === 0}
              onClick={() => setGroupMode("existing")} />
            <Choice active={groupMode === "new"} title={t("wiz.newGroups")} help={t("wiz.newGroupsHelp")} onClick={() => setGroupMode("new")} />
          </div>
          {groups.length === 0 && (
            <p className="rounded-lg bg-samber-pale px-3 py-2 text-xs text-samber">{t("wiz.pickGroupsNeedPeople")}</p>
          )}

          {groupMode === "existing" && (
            <div className="grid gap-2">
              <div className="text-xs font-semibold text-faint">{t("wiz.existing")}</div>
              {groups.map((g) => {
                const on = Boolean(picked[g.id]);
                const members = people.filter((p) => p.active && p.groupId === g.id).length;
                return (
                  <div key={g.id} className="grid grid-cols-[auto_1fr_0.5fr_auto] items-center gap-2 rounded-lg border border-line px-3 py-2">
                    <input type="checkbox" checked={on} onChange={(e) => setPicked({ ...picked, [g.id]: e.target.checked ? (picked[g.id] || 7) : 0 })}
                      className="h-4 w-4 accent-[#F47920]" aria-label={g.name} />
                    <span className="text-sm">{g.name} <span className="text-xs text-faint">· {members}</span></span>
                    <input type="number" min={1} disabled={!on} className={inputCls} value={picked[g.id] || 7}
                      onChange={(e) => setPicked({ ...picked, [g.id]: Math.max(1, Number(e.target.value) || 1) })} />
                    <span className="text-xs text-faint">{t("config.daysOn")}</span>
                  </div>
                );
              })}
            </div>
          )}

          {groupMode === "new" && (
            <div className="grid gap-2">
              {newRows.map((r, i) => (
                <div key={i} className="grid grid-cols-[1.4fr_0.6fr_auto_auto] items-center gap-2">
                  <input className={inputCls} placeholder={t("wiz.groupName")} value={r.name}
                    onChange={(e) => setNewRows(newRows.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
                  <input type="number" min={1} className={inputCls} value={r.days}
                    onChange={(e) => setNewRows(newRows.map((x, k) => (k === i ? { ...x, days: Number(e.target.value) } : x)))} />
                  <span className="text-xs text-faint">{t("config.daysOn")}</span>
                  <Button kind="danger" onClick={() => setNewRows(newRows.filter((_, k) => k !== i))}>×</Button>
                </div>
              ))}
              <div>
                <Button kind="ghost" onClick={() => setNewRows([...newRows, { name: t("wiz.teamDefault", { n: String.fromCharCode(65 + newRows.length) }), days: 6 }])}>
                  {t("wiz.addGroupRow")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4 · summary ── */}
      {!result && step === 3 && (
        <div className="grid gap-3">
          <p className="text-xs text-faint">{t("wiz.q4Help")}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label={t("config.minRestLabel")}>
              <input type="number" min={0} className={inputCls} value={limits.minRestHours} onChange={(e) => setLimits({ ...limits, minRestHours: Number(e.target.value) })} />
            </Field>
            <Field label={t("config.maxDayLabel")}>
              <input type="number" min={1} className={inputCls} value={limits.maxPerDay} onChange={(e) => setLimits({ ...limits, maxPerDay: Number(e.target.value) })} />
            </Field>
            <Field label={t("config.maxWeekLabel")}>
              <input type="number" min={1} className={inputCls} value={limits.maxPerWeek} onChange={(e) => setLimits({ ...limits, maxPerWeek: Number(e.target.value) })} />
            </Field>
            <Field label={t("config.weekStartLabel")}>
              <select className={inputCls} value={limits.weekStart} onChange={(e) => setLimits({ ...limits, weekStart: Number(e.target.value) as 0 | 1 })}>
                <option value={0}>{t("config.sunday")}</option>
                <option value={1}>{t("config.monday")}</option>
              </select>
            </Field>
          </div>
          <div className="rounded-md bg-surface-2 px-3 py-2 font-mono text-xs text-faint">
            {t("wiz.summary", { days, shifts: shifts.length, groups: rotation.length })}
          </div>
          <NeedsCard needs={needs} t={t} hasPeople={hasPeople} />
          <p className="text-xs text-samber">{t("wiz.replaceWarn")}</p>
        </div>
      )}

      {!result && (
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <Button kind="ghost" onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>
            {step === 0 ? t("c.cancel") : t("wiz.back")}
          </Button>
          {step < STEPS - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!stepOk}>{t("wiz.next")}</Button>
          ) : (
            <Button onClick={create} disabled={!datesOk || shifts.length === 0}>{t("wiz.create")}</Button>
          )}
        </div>
      )}
    </Modal>
  );
}

function NeedsCard({ needs, t, hasPeople }: { needs: ReturnType<typeof staffingNeeds>; t: TFn; hasPeople: boolean }) {
  const shortfall = needs.missing.soldiers + needs.missing.officers;
  const missingList = [
    needs.missing.soldiers > 0 && t("wiz.nSoldiers", { n: needs.missing.soldiers }),
    needs.missing.officers > 0 && t("wiz.nOfficers", { n: needs.missing.officers }),
  ].filter(Boolean).join(t("wiz.and"));
  return (
    <div className="rounded-xl border border-line bg-surface p-3 text-sm">
      <div className="mb-1.5 text-xs font-semibold text-faint">{t("wiz.needsTitle")}</div>
      <ul className="grid gap-1">
        <li>{t("wiz.needsPerDay", { ...needs.perDay })}</li>
        {needs.groups > 1 && <li>{t("wiz.needsPerGroup", needs.perGroup)}</li>}
        <li className="font-semibold">{t("wiz.needsTotal", { groups: needs.groups, ...needs.total })}</li>
        <li className="text-faint">
          {t("wiz.haveNow", { soldiers: needs.have.soldiers, officers: needs.have.officers, total: needs.have.total,
            dual: needs.have.dual ? t("wiz.dualNote", { n: needs.have.dual }) : "" })}
        </li>
        {!hasPeople ? (
          <li className="rounded-md bg-samber-pale px-2 py-1 text-xs text-samber">{t("wiz.noPeopleYet")}</li>
        ) : shortfall > 0 ? (
          <li className="rounded-md bg-danger-pale px-2 py-1 font-semibold text-danger">{t("wiz.missing", { list: missingList })}</li>
        ) : (
          <li className="rounded-md bg-green-50 px-2 py-1 font-semibold text-green-700">{t("wiz.covered")}</li>
        )}
      </ul>
    </div>
  );
}
