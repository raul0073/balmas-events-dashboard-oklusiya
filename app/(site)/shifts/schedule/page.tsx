"use client";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useApp, useMounted } from "@/lib/shifts/store";
import { GenContext, bucketAssigned, violationsFor } from "@/lib/shifts/generator";
import { Person, Role, SlotKind } from "@/lib/shifts/types";
import { addDays, eachDay, fmtDay, shiftHours, todayYmd, weekdayIndex } from "@/lib/shifts/time";
import { useT } from "@/lib/shifts/i18n";
import { Button, Card, EmptyState, Modal, PersonChip, RoleBadge, cls, inputCls } from "@/components/shifts/ui";

type SlotTarget = { key: string; role: Role | "backup" };

export default function SchedulePage() {
  const mounted = useMounted();
  const {
    people,
    groups,
    periods,
    plan,
    config,
    rules,
    schedule,
    generate,
    clearSchedule,
    assign,
    unassign,
    assignBackup,
    unassignBackup,
  } = useApp();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [slot, setSlot] = useState<SlotTarget | null>(null);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const [trayQ, setTrayQ] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const { t } = useT();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const rangeFrom = from || schedule?.from || todayYmd();
  const rangeTo = to || schedule?.to || addDays(todayYmd(), 6);

  const ctx: GenContext | null = useMemo(
    () => (schedule ? { people, config, rules, periods, instances: schedule.instances } : null),
    [schedule, people, config, rules, periods]
  );

  // week paging — the grid shows one week at a time
  const weeks = useMemo(() => {
    if (!schedule) return [] as string[][];
    const all = eachDay(schedule.from, schedule.to);
    const out: string[][] = [];
    let cur: string[] = [];
    for (const d of all) {
      if (cur.length > 0 && weekdayIndex(d) === config.weekStart) {
        out.push(cur);
        cur = [];
      }
      cur.push(d);
    }
    if (cur.length > 0) out.push(cur);
    return out;
  }, [schedule, config.weekStart]);

  const [weekIdx, setWeekIdx] = useState(0);
  useEffect(() => {
    if (weeks.length === 0) return;
    const today = todayYmd();
    const i = weeks.findIndex((w) => w.includes(today));
    setWeekIdx(i >= 0 ? i : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule?.from, schedule?.to, config.weekStart]);

  if (!mounted) return null;

  const wi = Math.max(0, Math.min(weekIdx, weeks.length - 1));
  const weekDays = weeks[wi] ?? [];
  const missing = new Set((schedule?.issues ?? []).map((i) => `${i.key}:${i.role}`));
  const byId = new Map(people.map((p) => [p.id, p]));

  const dayGroups = (d: string) =>
    periods
      .filter((p) => p.from <= d && d <= p.to)
      .map((p) => groups.find((g) => g.id === p.groupId)?.name)
      .filter(Boolean)
      .join(" · ");

  const runGenerate = () => {
    if (rangeTo < rangeFrom) return alert(t("sched.endBeforeStart"));
    if (schedule && !confirm(t("sched.regenConfirm"))) return;
    generate(rangeFrom, rangeTo);
  };

  const warningsOf = (key: string, personId: string, slotKind: SlotKind): string[] =>
    ctx
      ? violationsFor(ctx, personId, key, slotKind).filter(
          (c) => c !== "already-assigned" && !c.startsWith("soft:")
        )
      : [];

  const onDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id).split("|")[0]);
  const onDragEnd = (e: DragEndEvent) => {
    setDraggingId(null);
    if (!e.over || !schedule) return;
    const [pid, fromKey, fromSlot] = String(e.active.id).split("|");
    const [toKey, toSlot] = String(e.over.id).split("|");
    if (fromKey === toKey && fromSlot === toSlot) return;
    const target = schedule.instances[toKey];
    if (!target || target.assigned.includes(pid) || target.backups.includes(pid)) return;
    if (fromKey !== "tray") {
      if (fromSlot === "backup") unassignBackup(fromKey, pid);
      else unassign(fromKey, pid);
    }
    if (toSlot === "backup") assignBackup(toKey, pid);
    else assign(toKey, pid);
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={cls("mx-auto max-w-full", trayOpen && "pb-24")}>
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("sched.title")}</h1>
            {schedule?.generatedAt && (
              <p className="font-mono text-xs text-faint">
                {t("sched.generated")} <span dir="ltr">{new Date(schedule.generatedAt).toLocaleString()}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" className={cls(inputCls, "w-auto")} value={rangeFrom} onChange={(e) => setFrom(e.target.value)}  />
            <span className="text-faint">→</span>
            <input type="date" className={cls(inputCls, "w-auto")} value={rangeTo} onChange={(e) => setTo(e.target.value)}  />
            {plan && (
              <Button
                kind="ghost"
                title={`${plan.start} → ${plan.end}`}
                onClick={() => {
                  setFrom(plan.start);
                  setTo(plan.end);
                }}
              >
                {t("sched.fullProject")}
              </Button>
            )}
            <Button onClick={runGenerate}>{schedule ? t("sched.regenerate") : t("sched.generate")}</Button>
            {schedule && (
              <>
                <Button kind="ghost" onClick={() => generate(schedule.from, schedule.to, Math.floor(Math.random() * 1e9))} title={t("sched.rerollTitle")}>
                  {t("sched.reroll")}
                </Button>
                <Button kind="ghost" onClick={() => setTrayOpen(!trayOpen)}>
                  {trayOpen ? t("sched.hideTray") : t("sched.tray")}
                </Button>
                <Button kind="danger" onClick={() => confirm(t("sched.clearConfirm")) && clearSchedule()}>
                  {t("sched.clear")}
                </Button>
              </>
            )}
          </div>
        </header>

        {!schedule ? (
          <EmptyState title={t("sched.emptyTitle")}>
            {t("sched.emptyBody")} {people.length === 0 && t("sched.addPeopleFirst")}
          </EmptyState>
        ) : (
          <>
            {schedule.issues.length > 0 && (
              <Card className="mb-4 border-danger/40 bg-danger-pale/50">
                <p className="text-sm">
                  <span className="font-semibold text-danger">
                    {t("sched.issues", { n: schedule.issues.reduce((n, i) => n + i.missing, 0) })}
                  </span>{" "}
                  {t("sched.issuesBody")}
                </p>
              </Card>
            )}

            {weeks.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Button kind="ghost" onClick={() => setWeekIdx(wi - 1)} disabled={wi === 0}>
                  ‹
                </Button>
                <span className="font-mono text-sm">
                  {t("sched.week", { n: wi + 1, total: weeks.length })} ·{" "}
                  <span dir="ltr">
                    {fmtDay(weekDays[0])}–{fmtDay(weekDays[weekDays.length - 1])}
                  </span>
                </span>
                <Button kind="ghost" onClick={() => setWeekIdx(wi + 1)} disabled={wi >= weeks.length - 1}>
                  ›
                </Button>
                {weeks.some((w) => w.includes(todayYmd())) && (
                  <Button
                    kind="ghost"
                    onClick={() => setWeekIdx(weeks.findIndex((w) => w.includes(todayYmd())))}
                  >
                    {t("sched.today")}
                  </Button>
                )}
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-line bg-panel shadow-lift">
              <table className="border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="sticky start-0 z-10 border-b border-e border-line bg-panel px-3 py-2 text-start text-xs font-semibold text-faint">
                      {t("sched.shiftCol")}
                    </th>
                    {weekDays.map((d) => (
                      <th key={d} className="min-w-44 border-b border-line px-2 py-2 text-center">
                        <div className="text-xs font-semibold">{t(`wd.${weekdayIndex(d)}`)}</div>
                        <div className="font-mono text-[11px] text-faint" dir="ltr">{fmtDay(d)}</div>
                        {dayGroups(d) && (
                          <div className="mt-0.5 inline-block rounded bg-olive-pale px-1.5 font-mono text-[10px] text-olive-dark">
                            {dayGroups(d)}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.shifts.map((shift) => (
                    <tr key={shift.id}>
                      <td className="sticky start-0 z-10 border-b border-e border-line bg-panel px-3 py-2 align-top">
                        <div className="text-sm font-semibold">{shift.name}</div>
                        <div className="font-mono text-[11px] text-faint" dir="ltr">
                          {shift.start}–{shift.end}
                        </div>
                        <div className="font-mono text-[10px] text-faint">
                          {shift.officers} {t("sched.ofc")} · {shift.soldiers} {t("sched.sol")}
                          {shift.backups > 0 && ` · ${shift.backups} ${t("sched.bkp")}`}
                        </div>
                      </td>
                      {weekDays.map((d) => {
                        const key = `${d}_${shift.id}`;
                        const inst = schedule.instances[key];
                        if (!inst) return <td key={key} className="border-b border-line/60 bg-paper/50" />;
                        const assigned = inst.assigned
                          .map((id) => byId.get(id))
                          .filter((p): p is Person => !!p);
                        const buckets = bucketAssigned(assigned, shift);
                        const gapsOf = (role: Role) =>
                          Math.max(
                            (role === "officer" ? shift.officers : shift.soldiers) -
                              (role === "officer" ? buckets.officers : buckets.soldiers).length,
                            0
                          );
                        return (
                          <td
                            key={key}
                            className={cls(
                              "border-b border-line/60 px-1.5 py-1.5 align-top",
                              shift.isNight && "bg-night-pale/40"
                            )}
                          >
                            <DropZone id={`${key}|duty`}>
                              {(["officer", "soldier"] as Role[]).map((role) => {
                                const bucket = role === "officer" ? buckets.officers : buckets.soldiers;
                                const gaps = gapsOf(role);
                                if (bucket.length === 0 && gaps === 0) return null;
                                return (
                                  <div key={role} className="flex flex-wrap items-center gap-1">
                                    {bucket.map((p) => (
                                      <DraggableChip
                                        key={p.id}
                                        person={p}
                                        dragId={`${p.id}|${key}|duty`}
                                        as={role}
                                        warn={warningsOf(key, p.id, "duty").length > 0}
                                        hidden={draggingId === p.id}
                                        onOpen={() => setSummaryId(p.id)}
                                        onRemove={() => unassign(key, p.id)}
                                      />
                                    ))}
                                    {Array.from({ length: gaps }).map((_, i) => (
                                      <button
                                        key={i}
                                        onClick={() => setSlot({ key, role })}
                                        className={cls(
                                          "rounded-md border border-dashed px-1.5 py-0.5 text-xs transition-colors",
                                          missing.has(`${key}:${role}`)
                                            ? "border-danger/60 text-danger hover:bg-danger-pale"
                                            : "border-line text-faint hover:border-olive hover:text-olive"
                                        )}
                                      >
                                        + {role === "officer" ? t("sched.ofc") : t("sched.sol")}
                                      </button>
                                    ))}
                                  </div>
                                );
                              })}
                            </DropZone>
                            {shift.backups > 0 && (
                              <DropZone id={`${key}|backup`} className="mt-1 border-t border-dashed border-line/70 pt-1">
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="font-mono text-[10px] uppercase text-faint">{t("sched.bkp")}</span>
                                  {inst.backups
                                    .map((id) => byId.get(id))
                                    .filter((p): p is Person => !!p)
                                    .map((p) => (
                                      <DraggableChip
                                        key={p.id}
                                        person={p}
                                        dragId={`${p.id}|${key}|backup`}
                                        variant="backup"
                                        warn={warningsOf(key, p.id, "backup").length > 0}
                                        hidden={draggingId === p.id}
                                        onOpen={() => setSummaryId(p.id)}
                                        onRemove={() => unassignBackup(key, p.id)}
                                      />
                                    ))}
                                  {Array.from({
                                    length: Math.max(shift.backups - inst.backups.length, 0),
                                  }).map((_, i) => (
                                    <button
                                      key={i}
                                      onClick={() => setSlot({ key, role: "backup" })}
                                      className={cls(
                                        "rounded-md border border-dashed px-1.5 py-0.5 text-xs transition-colors",
                                        missing.has(`${key}:backup`)
                                          ? "border-danger/60 text-danger hover:bg-danger-pale"
                                          : "border-line text-faint hover:border-night hover:text-night"
                                      )}
                                    >
                                      + {t("sched.bkp")}
                                    </button>
                                  ))}
                                </div>
                              </DropZone>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-faint">
{t("sched.gridHelp")}
            </p>
          </>
        )}

        {trayOpen && schedule && (
          <div className="fixed bottom-0 start-0 end-0 z-20 border-t md:start-48 border-line bg-panel/95 px-4 py-3 shadow-lift backdrop-blur">
            <div className="flex items-center gap-3 overflow-x-auto">
              <input
                className={cls(inputCls, "w-44 shrink-0")}
                placeholder={t("sched.searchPeople")}
                value={trayQ}
                onChange={(e) => setTrayQ(e.target.value)}
              />
              {people
                .filter((p) => p.active && p.name.toLowerCase().includes(trayQ.toLowerCase()))
                .map((p) => (
                  <DraggableChip
                    key={p.id}
                    person={p}
                    dragId={`${p.id}|tray|tray`}
                    hidden={false}
                    onOpen={() => setSummaryId(p.id)}
                  />
                ))}
            </div>
          </div>
        )}

        {slot && ctx && (
          <AssignModal
            slotKey={slot.key}
            role={slot.role}
            ctx={ctx}
            onPick={(id) => {
              if (slot.role === "backup") assignBackup(slot.key, id);
              else assign(slot.key, id);
              setSlot(null);
            }}
            onClose={() => setSlot(null)}
          />
        )}

        {summaryId && ctx && schedule && (
          <PersonSummary
            personId={summaryId}
            ctx={ctx}
            groupsNames={groups}
            onClose={() => setSummaryId(null)}
          />
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingId && byId.get(draggingId) ? (
          <PersonChip person={byId.get(draggingId)!} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DropZone({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cls("min-h-6 rounded-md p-0.5 transition-colors", isOver && "bg-olive-pale/60 ring-2 ring-olive/50", className)}
    >
      {children}
    </div>
  );
}

function DraggableChip({
  person,
  dragId,
  as,
  variant,
  warn,
  hidden,
  onOpen,
  onRemove,
}: {
  person: Person;
  dragId: string;
  as?: Role;
  variant?: "backup";
  warn?: boolean;
  hidden: boolean;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  const { setNodeRef, listeners, attributes } = useDraggable({ id: dragId });
  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      className={cls("cursor-grab touch-none active:cursor-grabbing", hidden && "opacity-30")}
      role="button"
      tabIndex={0}
    >
      <PersonChip person={person} as={as} variant={variant} warn={warn} onRemove={onRemove} />
    </span>
  );
}

function AssignModal({
  slotKey,
  role,
  ctx,
  onPick,
  onClose,
}: {
  slotKey: string;
  role: Role | "backup";
  ctx: GenContext;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const { t } = useT();
  const [q, setQ] = useState("");
  const [anyRole, setAnyRole] = useState(false);
  const inst = ctx.instances[slotKey];
  const shift = ctx.config.shifts.find((s) => s.id === inst?.shiftId);
  const slotKind: SlotKind = role === "backup" ? "backup" : "duty";

  const rows = ctx.people
    .filter((p) => p.active && (role === "backup" || anyRole || p.roles.includes(role)))
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    .map((p) => ({ p, v: violationsFor(ctx, p.id, slotKey, slotKind) }))
    .sort((a, b) => a.v.length - b.v.length || a.p.name.localeCompare(b.p.name));

  return (
    <Modal
      title={t("sched.assignTitle", {
        role: role === "backup" ? t("sched.backup") : role === "officer" ? t("sched.ofc") : t("sched.sol"),
        shift: shift?.name ?? "",
        date: inst?.date ?? "",
      })}
      onClose={onClose}
    >
      <div className="mb-3 flex items-center gap-3">
        <input autoFocus className={inputCls} placeholder={t("c.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        {role !== "backup" && (
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-faint">
            <input type="checkbox" checked={anyRole} onChange={(e) => setAnyRole(e.target.checked)} />
            {t("sched.anyRole")}
          </label>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto rounded-md border border-line">
        {rows.length === 0 && <p className="p-3 text-sm text-faint">{t("sched.noMatch")}</p>}
        {rows.map(({ p, v }) => {
          const hard = v.filter((c) => !c.startsWith("soft:"));
          const soft = v.filter((c) => c.startsWith("soft:")).map((c) => c.slice(5));
          const disabled = hard.includes("already-assigned");
          return (
            <button
              key={p.id}
              disabled={disabled}
              onClick={() => onPick(p.id)}
              className="flex w-full items-center gap-2 border-b border-line/60 px-3 py-2 text-left last:border-0 hover:bg-paper disabled:opacity-40"
            >
              <RoleBadge roles={p.roles} />
              <span className="flex-1 text-sm font-medium">{p.name}</span>
              {hard.length === 0 && soft.length === 0 ? (
                <span className="font-mono text-[10px] font-semibold uppercase text-olive">{t("c.ok")}</span>
              ) : (
                <span className={cls("text-end text-[11px] leading-tight", hard.length ? "text-danger" : "text-samber")}>
                  {[...hard, ...soft].map((c) => t(`viol.${c}`)).join(", ")}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-faint">
{t("sched.overrideHint")}
      </p>
    </Modal>
  );
}

function PersonSummary({
  personId,
  ctx,
  groupsNames,
  onClose,
}: {
  personId: string;
  ctx: GenContext;
  groupsNames: { id: string; name: string }[];
  onClose: () => void;
}) {
  const { t } = useT();
  const person = ctx.people.find((p) => p.id === personId);
  if (!person) return null;

  const rows: { date: string; shift: string; time: string; kind: SlotKind; night: boolean }[] = [];
  let hours = 0;
  let nights = 0;
  let backups = 0;
  for (const inst of Object.values(ctx.instances)) {
    const shift = ctx.config.shifts.find((s) => s.id === inst.shiftId);
    if (!shift) continue;
    const duty = inst.assigned.includes(personId);
    const bkp = inst.backups.includes(personId);
    if (!duty && !bkp) continue;
    rows.push({
      date: inst.date,
      shift: shift.name,
      time: `${shift.start}–${shift.end}`,
      kind: duty ? "duty" : "backup",
      night: shift.isNight,
    });
    if (duty) {
      hours += shiftHours(shift);
      if (shift.isNight) nights++;
    } else backups++;
  }
  rows.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date < b.date ? -1 : 1));
  const dates = new Set(Object.values(ctx.instances).map((i) => i.date));
  const rangeHours = dates.size * 24;
  const loadPct = rangeHours > 0 ? (hours / rangeHours) * 100 : null;
  const groupName = groupsNames.find((g) => g.id === person.groupId)?.name;

  const stat = (label: string, value: string) => (
    <div className="rounded-md bg-paper px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-faint">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );

  return (
    <Modal title={person.name} onClose={onClose}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <RoleBadge roles={person.roles} />
        {groupName && (
          <span className="rounded bg-olive-pale px-1.5 py-0.5 font-mono text-[10px] text-olive-dark">{groupName}</span>
        )}
        {person.tags.map((t) => (
          <span key={t} className="rounded bg-paper px-1.5 py-0.5 text-[11px] text-faint">{t}</span>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-5 gap-1.5">
        {stat(t("sched.stShifts"), String(rows.filter((r) => r.kind === "duty").length))}
        {stat(t("sched.stHours"), String(hours))}
        {stat(t("sched.stNights"), String(nights))}
        {stat(t("sched.stBackups"), String(backups))}
        {stat(t("sched.stRatio"), loadPct === null ? "—" : `${Math.round(loadPct)}%`)}
      </div>
      {person.unavailable.length > 0 && (
        <p className="mb-2 text-xs text-samber">
          {t("sched.unavailPrefix")}:{" "}
          <span dir="ltr">
            {person.unavailable
              .map(
                (u) =>
                  `${u.from}${u.fromTime ? ` ${u.fromTime}` : ""} → ${u.to}${u.toTime ? ` ${u.toTime}` : ""}${u.reason ? ` (${u.reason})` : ""}`
              )
              .join(", ")}
          </span>
        </p>
      )}
      <div className="max-h-56 overflow-y-auto rounded-md border border-line">
        {rows.length === 0 && <p className="p-3 text-sm text-faint">{t("sched.nothingAssigned")}</p>}
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2 border-b border-line/60 px-3 py-1.5 text-sm last:border-0">
            <span className="font-mono text-xs text-faint" dir="ltr">{r.date}</span>
            <span className="flex-1">{r.shift}</span>
            <span className="font-mono text-xs text-faint" dir="ltr">{r.time}</span>
            {r.kind === "backup" && (
              <span className="rounded bg-night-pale px-1 font-mono text-[10px] uppercase text-night">{t("sched.bkp")}</span>
            )}
            {r.night && r.kind === "duty" && (
              <span className="rounded bg-night px-1 font-mono text-[10px] uppercase text-white">{t("sched.night")}</span>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
