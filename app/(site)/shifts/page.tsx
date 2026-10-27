"use client";
import { confirmDialog, alertDialog } from "@/lib/dialog";
import { useRef } from "react";
import Link from "next/link";
import { useApp, useMounted } from "@/lib/shifts/store";
import { PersonStats, computeStats } from "@/lib/shifts/stats";
import { Button, Card, ColorDot, EmptyState, RoleBadge, SectionTitle, cls } from "@/components/shifts/ui";
import { Wizard } from "@/components/shifts/wizard";
import { useState } from "react";
import { fmtDay, weekdayIndex } from "@/lib/shifts/time";
import { exportScheduleXlsx } from "@/lib/shifts/excel";
import { useT } from "@/lib/shifts/i18n";

type SortKey = "name" | "role" | "shifts" | "hours" | "nights" | "weekend" | "backups" | "load";

function sortValue(s: PersonStats, k: SortKey): string | number {
  if (k === "name") return s.person.name;
  if (k === "role")
    return s.person.roles.length > 1 ? "O+S" : s.person.roles.includes("officer") ? "OFC" : "SOL";
  if (k === "load") return s.loadPct ?? -1;
  return s[k];
}

export default function Dashboard() {
  const mounted = useMounted();
  const { people, groups, periods, config, rules, schedule, importAll, loadSample, resetAll } = useApp();
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [sort, setSort] = useState<{ k: SortKey; d: 1 | -1 }>({ k: "hours", d: -1 });
  if (!mounted) return null;

  const { personStats, byShift, byWeekday, coverage, filled, required } = computeStats(
    schedule,
    people,
    config
  );

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ people, groups, periods, config, rules, schedule }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `shift-creator-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = async (f: File) => {
    try {
      importAll(JSON.parse(await f.text()));
    } catch {
      void alertDialog(t("dash.importErr"));
    }
  };

  const empty = people.length === 0 && !schedule;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dash.title")}</h1>
          {schedule && (
            <p className="font-mono text-xs text-faint" dir="ltr">
              {schedule.from} → {schedule.to}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setWizardOpen(true)}>{t("wiz.open")}</Button>
          <Button kind="ghost" onClick={() => fileRef.current?.click()}>{t("dash.importBtn")}</Button>
          <Button kind="ghost" onClick={exportJson}>{t("dash.exportJson")}</Button>
          <Button
            kind="ghost"
            disabled={!schedule}
            title={schedule ? undefined : t("dash.genFirst")}
            onClick={() =>
              schedule && exportScheduleXlsx({ schedule, people, config, groups, personStats, t })
            }
          >
            {t("dash.exportExcel")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
          />
        </div>
      </header>

      {empty ? (
        <EmptyState title={t("dash.emptyTitle")}>
          <p className="mb-4">{t("dash.emptyBody")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => setWizardOpen(true)}>{t("wiz.open")}</Button>
            <Button kind="ghost" onClick={loadSample}>{t("dash.loadSample")}</Button>
            <Link href="/shifts/people"><Button kind="ghost">{t("dash.addPeople")}</Button></Link>
          </div>
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <div className="text-xs text-faint">{t("dash.coverage")}</div>
              <div className="font-mono text-2xl font-semibold">
                {required ? Math.round((filled / required) * 100) : 0}%
              </div>
              <div className="font-mono text-xs text-faint">{t("dash.slots", { f: filled, r: required })}</div>
            </Card>
            <Card>
              <div className="text-xs text-faint">{t("dash.activePeople")}</div>
              <div className="font-mono text-2xl font-semibold">{personStats.length}</div>
              <div className="font-mono text-xs text-faint">
                {t("dash.capable", {
                  o: personStats.filter((p) => p.person.roles.includes("officer")).length,
                  s: personStats.filter((p) => p.person.roles.includes("soldier")).length,
                })}
              </div>
            </Card>
            <Card>
              <div className="text-xs text-faint">{t("dash.unfilled")}</div>
              <div className={cls("font-mono text-2xl font-semibold", (schedule?.issues.length ?? 0) > 0 && "text-danger")}>
                {schedule?.issues.reduce((n, i) => n + i.missing, 0) ?? 0}
              </div>
              <div className="font-mono text-xs text-faint">
                {schedule ? t("dash.afterGen") : t("dash.noSchedule")}
              </div>
            </Card>
            <Card>
              <div className="text-xs text-faint">{t("dash.rulesActive")}</div>
              <div className="font-mono text-2xl font-semibold">{rules.filter((r) => r.enabled).length}</div>
              <div className="font-mono text-xs text-faint">{t("dash.shiftsPerDay", { n: config.shifts.length })}</div>
            </Card>
          </div>

          {schedule && coverage.length > 0 && (
            <Card className="mb-4">
              <SectionTitle>{t("dash.coverageByDay")}</SectionTitle>
              <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
                {coverage.map((c) => {
                  const pct = c.required ? c.filled / c.required : 0;
                  return (
                    <div key={c.date} className="flex min-w-9 flex-col items-center gap-1">
                      <div className="flex h-16 w-6 items-end rounded bg-paper">
                        <div
                          className={cls("w-full rounded", pct >= 1 ? "bg-green-600" : pct >= 0.7 ? "bg-samber" : "bg-danger")}
                          style={{ height: `${Math.max(pct * 100, 4)}%` }}
                          title={`${c.filled}/${c.required}`}
                        />
                      </div>
                      <div className="font-mono text-[10px] text-faint" dir="ltr">{fmtDay(c.date)}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionTitle>{t("dash.byShift")}</SectionTitle>
              {config.shifts.map((s) => {
                const n = byShift.get(s.id) ?? 0;
                const max = Math.max(1, ...config.shifts.map((x) => byShift.get(x.id) ?? 0));
                return (
                  <div key={s.id} className="mb-2 flex items-center gap-2 text-sm">
                    <span className="w-20 truncate">{s.name}</span>
                    <div className="h-3 flex-1 rounded bg-paper">
                      <div
                        className={cls("h-3 rounded", s.isNight ? "bg-night" : "bg-pikud-orange")}
                        style={{ width: `${(n / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-end font-mono text-xs">{n}</span>
                  </div>
                );
              })}
            </Card>
            <Card>
              <SectionTitle>{t("dash.byWeekday")}</SectionTitle>
              <div className="flex items-end justify-between gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const max = Math.max(1, ...byWeekday);
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-20 w-full items-end rounded bg-paper">
                        <div className="w-full rounded bg-officer" style={{ height: `${(byWeekday[i] / max) * 100}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-faint">{t(`wd.${i}`)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card className="mb-4">
            <SectionTitle right={<span className="font-mono text-[10px] text-faint">{t("dash.restHint")}</span>}>
              {t("dash.loadTitle")}
            </SectionTitle>
            {personStats.length === 0 ? (
              <p className="text-sm text-faint">{t("dash.noActive")}</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-faint">
                    {(
                      [
                        ["name", t("dash.colName"), "text-start"],
                        ["role", t("dash.colRole"), "text-start"],
                        ["shifts", t("dash.colShifts"), "text-end"],
                        ["hours", t("dash.colHours"), "text-end"],
                        ["nights", t("dash.colNights"), "text-end"],
                        ["weekend", t("dash.colWeekend"), "text-end"],
                        ["backups", t("dash.colBackups"), "text-end"],
                        ["load", t("dash.colLoad"), "text-end"],
                      ] as [SortKey, string, string][]
                    ).map(([k, label, align]) => (
                      <th key={k} className={cls("py-1.5 font-medium", align)}>
                        <button
                          onClick={() =>
                            setSort((s) =>
                              s.k === k ? { k, d: (s.d * -1) as 1 | -1 } : { k, d: k === "name" || k === "role" ? 1 : -1 }
                            )
                          }
                          className="hover:text-ink"
                        >
                          {label}
                          {sort.k === k && <span className="font-mono">{sort.d === -1 ? " ↓" : " ↑"}</span>}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...personStats]
                    .sort((a, b) => {
                      const va = sortValue(a, sort.k);
                      const vb = sortValue(b, sort.k);
                      const c =
                        typeof va === "string"
                          ? va.localeCompare(vb as string)
                          : (va as number) - (vb as number);
                      return c * sort.d || a.person.name.localeCompare(b.person.name);
                    })
                    .map((s) => (
                    <tr key={s.person.id} className="border-b border-line/60 last:border-0">
                      <td className="py-1.5">
                        <span className="inline-flex items-center gap-2">
                          <ColorDot color={s.person.color} />
                          {s.person.name}
                        </span>
                      </td>
                      <td><RoleBadge roles={s.person.roles} /></td>
                      <td className="text-end font-mono">{s.shifts}</td>
                      <td className="text-end font-mono">{s.hours}</td>
                      <td className="text-end font-mono">{s.nights}</td>
                      <td className="text-end font-mono">{s.weekend}</td>
                      <td className="text-end font-mono">{s.backups}</td>
                      <td
                        className={cls(
                          "text-end font-mono",
                          s.loadPct !== null && s.loadPct > 33 && "font-semibold text-danger"
                        )}
                        dir="ltr"
                      >
                        {s.loadPct === null ? "—" : `${Math.round(s.loadPct)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </Card>

          {schedule && schedule.issues.length > 0 && (
            <Card>
              <SectionTitle>{t("dash.unfilledTitle")}</SectionTitle>
              <ul className="space-y-1 text-sm">
                {schedule.issues.map((i) => {
                  const shift = config.shifts.find((s) => s.id === schedule.instances[i.key]?.shiftId);
                  const top = Object.entries(i.blockers).sort((a, b) => b[1] - a[1]).slice(0, 3);
                  return (
                    <li key={`${i.key}-${i.role}`} className="rounded bg-danger-pale/60 px-2 py-1.5">
                      <span className="font-mono text-xs" dir="ltr">{schedule.instances[i.key]?.date}</span>{" "}
                      <span className="font-medium">{shift?.name}</span> —{" "}
                      {t("dash.missing", { n: i.missing, role: t(`dash.role${i.role}`) })}
                      {top.length > 0 && (
                        <span className="text-faint">
                          {" "}· {t("dash.blockedBy")}: {top.map(([c, n]) => `${t(`viol.${c}`)} (${n})`).join(", ")}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </>
      )}
      {!empty && (
        <Card className="mt-4 border-danger/30">
          <SectionTitle>{t("del.zone")}</SectionTitle>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-faint">{t("del.zoneHelp")}</p>
            <Button
              kind="danger"
              onClick={async () => {
                if ((await confirmDialog(t("del.everythingConfirm"))) && (await confirmDialog(t("del.everythingConfirm2")))) resetAll();
              }}
            >
              {t("del.everything")}
            </Button>
          </div>
        </Card>
      )}

      {wizardOpen && <Wizard onClose={() => setWizardOpen(false)} />}
    </div>
  );
}