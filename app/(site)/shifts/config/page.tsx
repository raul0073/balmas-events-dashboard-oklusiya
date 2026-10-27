"use client";
import { confirmDialog, alertDialog } from "@/lib/dialog";
import { useState } from "react";
import { uid, useApp, useMounted } from "@/lib/shifts/store";
import { ShiftTemplate } from "@/lib/shifts/types";
import { Button, Card, Field, SectionTitle, Toggle, cls, inputCls } from "@/components/shifts/ui";
import { shiftHours } from "@/lib/shifts/time";
import { useT } from "@/lib/shifts/i18n";

export default function ConfigPage() {
  const mounted = useMounted();
  const {
    config,
    setConfig,
    schedule,
    groups,
    periods,
    addPeriod,
    updatePeriod,
    removePeriod,
    plan,
    setPlan,
    applyPlan,
    clearPlan,
    clearPeriods,
    resetConfig,
  } = useApp();
  const [applyFrom, setApplyFrom] = useState("");
  const [firstTurn, setFirstTurn] = useState(0);
  const { t } = useT();
  if (!mounted) return null;

  const patchShift = (id: string, patch: Partial<ShiftTemplate>) =>
    setConfig({
      ...config,
      shifts: config.shifts.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  const sortedPeriods = [...periods].sort((a, b) => (a.from < b.from ? -1 : 1));

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("config.title")}</h1>
        {schedule && (
          <p className="mt-1 text-sm text-samber">
            {t("config.existsWarn")}
          </p>
        )}
      </header>

      <Card className="mb-4">
        <SectionTitle>{t("config.planTitle")}</SectionTitle>
        <p className="mb-3 text-xs text-faint">{t("config.planHelp")}</p>
        <div className="mb-3 grid grid-cols-2 gap-3 md:max-w-md">
          <Field label={t("config.projStart")}>
            <input
              type="date"
              className={inputCls}
              value={plan?.start ?? ""}
              onChange={(e) =>
                setPlan({ start: e.target.value, end: plan?.end ?? e.target.value, turns: plan?.turns ?? [] })
              }
            />
          </Field>
          <Field label={t("config.projEnd")}>
            <input
              type="date"
              className={inputCls}
              value={plan?.end ?? ""}
              onChange={(e) =>
                setPlan({ start: plan?.start ?? e.target.value, end: e.target.value, turns: plan?.turns ?? [] })
              }
            />
          </Field>
        </div>
        <div className="mb-1 text-sm font-medium">{t("config.turns")}</div>
        {(!plan || plan.turns.length === 0) && <p className="mb-2 text-xs text-faint">{t("config.noPlan")}</p>}
        <div className="grid gap-2 overflow-x-auto">
          {plan?.turns.map((turn, i) => {
            const move = (dir: -1 | 1) => {
              const turns = [...plan.turns];
              const j = i + dir;
              if (j < 0 || j >= turns.length) return;
              [turns[i], turns[j]] = [turns[j], turns[i]];
              setPlan({ ...plan, turns });
            };
            return (
              <div key={i} className="grid min-w-[420px] grid-cols-[auto_auto_1.2fr_0.6fr_auto_auto] items-center gap-2">
                <button onClick={() => move(-1)} className="rounded px-1.5 text-faint hover:text-ink" disabled={i === 0}>↑</button>
                <button onClick={() => move(1)} className="rounded px-1.5 text-faint hover:text-ink" disabled={i === plan.turns.length - 1}>↓</button>
                <select
                  className={inputCls}
                  value={turn.groupId}
                  onChange={(e) =>
                    setPlan({
                      ...plan,
                      turns: plan.turns.map((x, k) => (k === i ? { ...x, groupId: e.target.value } : x)),
                    })
                  }
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={turn.days}
                  onChange={(e) =>
                    setPlan({
                      ...plan,
                      turns: plan.turns.map((x, k) => (k === i ? { ...x, days: Number(e.target.value) } : x)),
                    })
                  }
                />
                <span className="text-xs text-faint">{t("config.daysOn")}</span>
                <Button
                  kind="danger"
                  onClick={() => setPlan({ ...plan, turns: plan.turns.filter((_, k) => k !== i) })}
                >
                  ×
                </Button>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Button
            kind="ghost"
            disabled={groups.length === 0}
            title={groups.length === 0 ? t("config.needGroup") : undefined}
            onClick={() =>
              setPlan({
                start: plan?.start ?? "",
                end: plan?.end ?? "",
                turns: [...(plan?.turns ?? []), { groupId: groups[0].id, days: 8 }],
              })
            }
          >
            {t("config.addTurn")}
          </Button>
          <Field label={t("config.applyFrom")}>
            <input
              type="date"
              className={inputCls}
              value={applyFrom || plan?.start || ""}
              onChange={(e) => setApplyFrom(e.target.value)}
            />
          </Field>
          <Field label={t("config.firstGroup")}>
            <select
              className={inputCls}
              value={firstTurn}
              onChange={(e) => setFirstTurn(Number(e.target.value))}
            >
              {plan?.turns.map((turn, i) => (
                <option key={i} value={i}>
                  {groups.find((g) => g.id === turn.groupId)?.name ?? "?"} · {turn.days}
                </option>
              ))}
            </select>
          </Field>
          <Button
            disabled={!plan || plan.turns.length === 0 || !plan.start || !plan.end}
            onClick={async () => {
              if (await confirmDialog(t("config.applyWarn"))) applyPlan(applyFrom || plan!.start, firstTurn);
            }}
          >
            {t("config.applyPlan")}
          </Button>
          {plan && (
            <Button kind="danger" onClick={async () => { if (await confirmDialog(t("del.planConfirm"))) clearPlan(); }}>
              {t("del.plan")}
            </Button>
          )}
        </div>
      </Card>

      <Card className="mb-4">
        <SectionTitle>{t("config.periodsTitle")}</SectionTitle>
        <p className="mb-3 text-xs text-faint">
          {t("config.periodsHelp")}
        </p>
        {sortedPeriods.length === 0 && (
          <p className="mb-2 text-sm text-faint">{t("config.noPeriods")}</p>
        )}
        <div className="grid gap-2 overflow-x-auto">
          {sortedPeriods.map((p) => (
            <div key={p.id} className="grid min-w-[420px] grid-cols-[1fr_1fr_1.2fr_auto] items-center gap-2">
              <input
                type="date"
                className={inputCls}
                value={p.from}
                onChange={(e) => updatePeriod({ ...p, from: e.target.value, to: p.to || e.target.value })}
                
              />
              <input
                type="date"
                className={inputCls}
                value={p.to}
                onChange={(e) => updatePeriod({ ...p, to: e.target.value })}
                
              />
              <select
                className={inputCls}
                value={p.groupId}
                onChange={(e) => updatePeriod({ ...p, groupId: e.target.value })}
                
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <Button kind="danger" onClick={() => removePeriod(p.id)}>×</Button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            kind="ghost"
            disabled={groups.length === 0}
            title={groups.length === 0 ? t("config.needGroup") : undefined}
            onClick={() => addPeriod({ id: uid(), from: "", to: "", groupId: groups[0].id })}
          >
            {t("config.addPeriod")}
          </Button>
          {sortedPeriods.length > 0 && (
            <Button kind="danger" onClick={async () => { if (await confirmDialog(t("del.periodsConfirm"))) clearPeriods(); }}>
              {t("del.periods")}
            </Button>
          )}
        </div>
      </Card>

      <Card className="mb-4">
        <SectionTitle>{t("config.limitsTitle")}</SectionTitle>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Field label={t("config.minRestLabel")} hint={t("config.minRestHint")}>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={config.minRestHours}
              onChange={(e) => setConfig({ ...config, minRestHours: Number(e.target.value) })}
            />
          </Field>
          <Field label={t("config.maxDayLabel")}>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={config.maxPerDay}
              onChange={(e) => setConfig({ ...config, maxPerDay: Number(e.target.value) })}
            />
          </Field>
          <Field label={t("config.maxWeekLabel")}>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={config.maxPerWeek}
              onChange={(e) => setConfig({ ...config, maxPerWeek: Number(e.target.value) })}
            />
          </Field>
          <Field label={t("config.weekStartLabel")}>
            <select
              className={inputCls}
              value={config.weekStart}
              onChange={(e) => setConfig({ ...config, weekStart: Number(e.target.value) as 0 | 1 })}
            >
              <option value={0}>{t("config.sunday")}</option>
              <option value={1}>{t("config.monday")}</option>
            </select>
          </Field>
        </div>
        <p className="mt-2 text-xs text-faint">
          {t("config.limitsHelp")}
        </p>
      </Card>

      <Card>
        <SectionTitle
          right={
            <Button
              kind="ghost"
              onClick={() =>
                setConfig({
                  ...config,
                  shifts: [
                    ...config.shifts,
                    {
                      id: uid(),
                      name: t("config.newShift", { n: config.shifts.length + 1 }),
                      start: "08:00",
                      end: "16:00",
                      soldiers: 2,
                      officers: 1,
                      backups: 0,
                      isNight: false,
                    },
                  ],
                })
              }
            >
              {t("config.addShift")}
            </Button>
          }
        >
          {t("config.shiftsTitle")}
        </SectionTitle>

        <div className="overflow-x-auto">
        <div className="grid min-w-[780px] gap-2.5">
          {/* header and rows share one template; the switch, hours and delete columns are fixed so labels sit over their cells */}
          <div className="grid grid-cols-[1.3fr_1fr_1fr_4.5rem_4.5rem_4.5rem_4rem_3.5rem_2.5rem] items-center gap-3 text-xs text-faint">
            <span className="px-3">{t("config.colName")}</span><span className="text-center">{t("config.colStart")}</span><span className="text-center">{t("config.colEnd")}</span><span className="text-center">{t("config.colSoldiers")}</span><span className="text-center">{t("config.colOfficers")}</span>
            <span className="text-center">{t("config.colBackups")}</span><span className="text-center">{t("config.colNight")}</span><span className="text-center">{t("config.colLength")}</span><span />
          </div>
          {config.shifts.map((s) => (
            <div key={s.id} className="grid grid-cols-[1.3fr_1fr_1fr_4.5rem_4.5rem_4.5rem_4rem_3.5rem_2.5rem] items-center gap-3 [&>*:nth-child(n+7)]:justify-self-center">
              <input className={inputCls} value={s.name} onChange={(e) => patchShift(s.id, { name: e.target.value })} />
              <input type="time" className={inputCls} value={s.start} onChange={(e) => patchShift(s.id, { start: e.target.value })} />
              <input type="time" className={inputCls} value={s.end} onChange={(e) => patchShift(s.id, { end: e.target.value })} />
              <input type="number" min={0} className={cls(inputCls, "text-center")} value={s.soldiers} onChange={(e) => patchShift(s.id, { soldiers: Number(e.target.value) })} />
              <input type="number" min={0} className={cls(inputCls, "text-center")} value={s.officers} onChange={(e) => patchShift(s.id, { officers: Number(e.target.value) })} />
              <input type="number" min={0} className={cls(inputCls, "text-center")} value={s.backups} onChange={(e) => patchShift(s.id, { backups: Number(e.target.value) })} />
              <Toggle on={s.isNight} onChange={(isNight) => patchShift(s.id, { isNight })} />
              <span className="font-mono text-xs text-faint" dir="ltr">{shiftHours(s)}h</span>
              <Button
                kind="danger"
                onClick={async () => {
                  if (await confirmDialog(t("config.delShiftConfirm", { name: s.name })))
                    setConfig({ ...config, shifts: config.shifts.filter((x) => x.id !== s.id) });
                }}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
        </div>
        <p className="mt-3 text-xs text-faint">
          {t("config.shiftsHelp")}
        </p>
      </Card>

      <div className="mt-6 border-t border-line pt-4">
        <Button kind="danger" onClick={async () => { if (await confirmDialog(t("del.resetConfigConfirm"))) resetConfig(); }}>
          {t("del.resetConfig")}
        </Button>
      </div>
    </div>
  );
}
