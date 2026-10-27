"use client";
import { useState } from "react";
import { uid, useApp, WizardResult } from "@/lib/shifts/store";
import { ShiftTemplate } from "@/lib/shifts/types";
import { addDays, parseHm, todayYmd } from "@/lib/shifts/time";
import { useT } from "@/lib/shifts/i18n";
import { Button, Field, Modal, Toggle, cls, inputCls } from "@/components/shifts/ui";

function prefillShifts(count: number, t: (k: string, v?: Record<string, string | number>) => string): ShiftTemplate[] {
  const named: Record<number, string[]> = {
    1: [t("wiz.nDay")],
    2: [t("wiz.nDay"), t("wiz.nNight")],
    3: [t("wiz.nMorning"), t("wiz.nEvening"), t("wiz.nNight")],
    4: [t("wiz.nMorning"), t("wiz.nNoon"), t("wiz.nEvening"), t("wiz.nNight")],
  };
  const names = named[count] ?? Array.from({ length: count }, (_, i) => t("wiz.nShift", { n: i + 1 }));
  const len = Math.round((24 / count) * 12) / 12; // hours, keep to 5-min steps
  const out: ShiftTemplate[] = [];
  let startMin = 6 * 60; // day starts 06:00
  for (let i = 0; i < count; i++) {
    const endMin = Math.round(startMin + len * 60) % (24 * 60);
    const hm = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const start = hm(startMin);
    const end = hm(endMin);
    const crossesMidnight = parseHm(end) <= parseHm(start);
    const isNight = crossesMidnight || parseHm(start) >= 21 * 60;
    out.push({
      id: uid(),
      name: names[i],
      start,
      end,
      soldiers: 2,
      officers: 1,
      backups: isNight ? 1 : 0,
      isNight,
    });
    startMin = endMin;
  }
  return out;
}

export function Wizard({ onClose }: { onClose: () => void }) {
  const { groups, config, applyWizard } = useApp();
  const { t } = useT();
  const [step, setStep] = useState(0);

  const [from, setFrom] = useState(todayYmd());
  const [to, setTo] = useState(addDays(todayYmd(), 60));
  const [count, setCount] = useState(3);
  const [shifts, setShifts] = useState<ShiftTemplate[]>(() => prefillShifts(3, t));
  const [rotation, setRotation] = useState<{ groupId?: string; name: string; days: number }[]>(() =>
    groups.length > 0
      ? groups.map((g) => ({ groupId: g.id, name: g.name, days: 8 }))
      : [
          { name: t("wiz.teamDefault", { n: "A" }), days: 8 },
          { name: t("wiz.teamDefault", { n: "B" }), days: 6 },
        ]
  );
  const [limits, setLimits] = useState({
    minRestHours: config.minRestHours,
    maxPerDay: config.maxPerDay,
    maxPerWeek: config.maxPerWeek,
    weekStart: config.weekStart as 0 | 1,
  });
  const [genNow, setGenNow] = useState(true);

  const total = 4;
  const datesOk = !!from && !!to && from <= to;
  const stepOk =
    step === 0 ? datesOk : step === 1 ? shifts.length > 0 : step === 2 ? rotation.length > 0 && rotation.every((r) => r.name.trim()) : true;

  const patchShift = (id: string, patch: Partial<ShiftTemplate>) =>
    setShifts(shifts.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const create = () => {
    const w: WizardResult = {
      from,
      to,
      shifts,
      ...limits,
      rotation,
      generateNow: genNow,
    };
    applyWizard(w);
    onClose();
  };

  const days = datesOk ? Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1 : 0;

  return (
    <Modal title={t("wiz.title")} onClose={onClose} wide>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs text-faint">{t("wiz.step", { n: step + 1, total })}</span>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cls("h-1.5 w-6 rounded-full", i <= step ? "bg-pikud-orange" : "bg-line")}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="grid gap-3">
          <p className="text-sm font-medium">{t("wiz.q1")}</p>
          <p className="text-xs text-faint">{t("wiz.q1Help")}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("config.projStart")}>
              <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label={t("config.projEnd")}>
              <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          {!datesOk && <p className="text-xs text-danger">{t("wiz.needTwoDates")}</p>}
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-3">
          <p className="text-sm font-medium">{t("wiz.q2")}</p>
          <p className="text-xs text-faint">{t("wiz.q2Help")}</p>
          <Field label={t("wiz.count")}>
            <input
              type="number"
              min={1}
              max={6}
              className={cls(inputCls, "w-24")}
              value={count}
              onChange={(e) => {
                const n = Math.max(1, Math.min(6, Number(e.target.value) || 1));
                setCount(n);
                setShifts(prefillShifts(n, t));
              }}
            />
          </Field>
          <div className="overflow-x-auto">
            <div className="grid min-w-[560px] gap-2">
              {/* header and rows share one template so the labels sit over their cells; the switch column is fixed */}
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

      {step === 2 && (
        <div className="grid gap-3">
          <p className="text-sm font-medium">{t("wiz.q3")}</p>
          <p className="text-xs text-faint">{t("wiz.q3Help")}</p>
          <div className="grid gap-2">
            {rotation.map((r, i) => (
              <div key={i} className="grid grid-cols-[1.4fr_0.6fr_auto_auto] items-center gap-2">
                <input
                  className={inputCls}
                  placeholder={t("wiz.groupName")}
                  value={r.name}
                  onChange={(e) =>
                    setRotation(rotation.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))
                  }
                />
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={r.days}
                  onChange={(e) =>
                    setRotation(rotation.map((x, k) => (k === i ? { ...x, days: Number(e.target.value) } : x)))
                  }
                />
                <span className="text-xs text-faint">{t("config.daysOn")}</span>
                <Button kind="danger" onClick={() => setRotation(rotation.filter((_, k) => k !== i))}>×</Button>
              </div>
            ))}
          </div>
          <div>
            <Button
              kind="ghost"
              onClick={() =>
                setRotation([
                  ...rotation,
                  { name: t("wiz.teamDefault", { n: String.fromCharCode(65 + rotation.length) }), days: 6 },
                ])
              }
            >
              {t("wiz.addGroupRow")}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-3">
          <p className="text-sm font-medium">{t("wiz.q4")}</p>
          <p className="text-xs text-faint">{t("wiz.q4Help")}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label={t("config.minRestLabel")}>
              <input type="number" min={0} className={inputCls} value={limits.minRestHours}
                onChange={(e) => setLimits({ ...limits, minRestHours: Number(e.target.value) })} />
            </Field>
            <Field label={t("config.maxDayLabel")}>
              <input type="number" min={1} className={inputCls} value={limits.maxPerDay}
                onChange={(e) => setLimits({ ...limits, maxPerDay: Number(e.target.value) })} />
            </Field>
            <Field label={t("config.maxWeekLabel")}>
              <input type="number" min={1} className={inputCls} value={limits.maxPerWeek}
                onChange={(e) => setLimits({ ...limits, maxPerWeek: Number(e.target.value) })} />
            </Field>
            <Field label={t("config.weekStartLabel")}>
              <select className={inputCls} value={limits.weekStart}
                onChange={(e) => setLimits({ ...limits, weekStart: Number(e.target.value) as 0 | 1 })}>
                <option value={0}>{t("config.sunday")}</option>
                <option value={1}>{t("config.monday")}</option>
              </select>
            </Field>
          </div>
          <div className="rounded-md bg-paper p-3 text-sm">
            <div className="mb-1 font-mono text-xs text-faint">
              {t("wiz.summary", { days, shifts: shifts.length, groups: rotation.length })}
            </div>
            <Toggle on={genNow} onChange={setGenNow} label={t("wiz.genNow")} />
          </div>
          <p className="text-xs text-samber">{t("wiz.replaceWarn")}</p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <Button kind="ghost" onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>
          {step === 0 ? t("c.cancel") : t("wiz.back")}
        </Button>
        {step < total - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!stepOk}>{t("wiz.next")}</Button>
        ) : (
          <Button onClick={create} disabled={!datesOk || shifts.length === 0 || rotation.length === 0}>
            {t("wiz.create")}
          </Button>
        )}
      </div>
    </Modal>
  );
}
