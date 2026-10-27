"use client";
import { confirmDialog } from "@/lib/dialog";
import { useMemo, useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { uid, useApp, useMounted } from "@/lib/shifts/store";
import { Person, Role } from "@/lib/shifts/types";
import { useT } from "@/lib/shifts/i18n";
import {
  Button,
  ColorDot,
  EmptyState,
  Field,
  Modal,
  RoleBadge,
  TagInput,
  Toggle,
  cls,
  inputCls,
} from "@/components/shifts/ui";
import { nextColor } from "@/lib/shifts/colors";

const blank = (): Person => ({
  id: uid(),
  name: "",
  roles: ["soldier"],
  tags: [],
  unavailable: [],
  bannedShiftIds: [],
  active: true,
});

type RolePick = "soldier" | "officer" | "both";
const rolesOf = (pick: RolePick): Role[] => (pick === "both" ? ["soldier", "officer"] : [pick]);
const pickOf = (roles: Role[]): RolePick =>
  roles.includes("soldier") && roles.includes("officer") ? "both" : roles.includes("officer") ? "officer" : "soldier";

export default function PeoplePage() {
  const mounted = useMounted();
  const {
    people,
    groups,
    config,
    addPerson,
    updatePerson,
    removePerson,
    addGroup,
    renameGroup,
    removeGroup,
    clearPeople,
    clearGroups,
  } = useApp();
  const { t } = useT();
  const [editing, setEditing] = useState<Person | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filter, setFilter] = useState<"all" | Role>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [sort, setSort] = useState<"name" | "group">("name");
  const [newGroup, setNewGroup] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);

  const allTags = useMemo(() => Array.from(new Set(people.flatMap((p) => p.tags))).sort(), [people]);
  if (!mounted) return null;

  const groupName = (id?: string) => groups.find((g) => g.id === id)?.name;
  const shown = people
    .filter(
      (p) =>
        (filter === "all" || p.roles.includes(filter)) &&
        (groupFilter === "all" || (groupFilter === "none" ? !p.groupId : p.groupId === groupFilter))
    )
    .sort((a, b) =>
      sort === "group"
        ? (groupName(a.groupId) ?? "￿").localeCompare(groupName(b.groupId) ?? "￿") || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name)
    );

  const save = () => {
    if (!editing || !editing.name.trim() || editing.roles.length === 0) return;
    const p = { ...editing, name: editing.name.trim() };
    if (isNew) addPerson(p);
    else updatePerson(p);
    setEditing(null);
  };

  const openNew = () => { setEditing(blank()); setIsNew(true); };
  const limitsOf = (p: Person) => {
    const parts = [
      p.maxPerDay !== undefined && t("people.limitDay", { n: p.maxPerDay }),
      p.maxPerWeek !== undefined && t("people.limitWeek", { n: p.maxPerWeek }),
      p.minRestHours !== undefined && t("people.limitRest", { n: p.minRestHours }),
    ].filter(Boolean) as string[];
    return parts.length ? parts.join(" · ") : null;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("people.title")}</h1>
          <p className="text-xs text-faint">{t("people.count", { n: people.length })}</p>
        </div>
        <Button onClick={openNew}>
          <span className="inline-flex items-center gap-1.5"><UserPlus className="h-4 w-4" /> {t("people.addPerson")}</span>
        </Button>
      </header>

      {/* groups: one compact row */}
      <div className="mb-4 rounded-xl border border-line bg-surface px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold text-faint">{t("people.groupsTitle")}</span>
          {groups.map((g) => {
            const n = people.filter((p) => p.groupId === g.id).length;
            return (
              <span key={g.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 py-0.5 ps-3 pe-1 text-sm">
                {renaming === g.id ? (
                  <input
                    autoFocus
                    className="w-28 bg-transparent outline-none"
                    value={g.name}
                    onChange={(e) => renameGroup(g.id, e.target.value)}
                    onBlur={() => setRenaming(null)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setRenaming(null); }}
                  />
                ) : (
                  <button type="button" className="font-semibold hover:text-pikud-orange-dark" title={t("people.renameHint")} onClick={() => setRenaming(g.id)}>
                    {g.name}
                  </button>
                )}
                <span className="rounded-full bg-surface px-1.5 font-mono text-[11px] text-faint" title={t("people.members")}>{n}</span>
                <button
                  onClick={async () => { if (await confirmDialog(t("people.delGroupConfirm", { name: g.name }))) removeGroup(g.id); }}
                  className="rounded-full px-1.5 text-faint hover:text-danger" aria-label={`${t("c.remove")} ${g.name}`}
                >
                  ×
                </button>
              </span>
            );
          })}
          <input
            className={cls(inputCls, "w-36 rounded-full")}
            placeholder={t("people.newGroupPh")}
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newGroup.trim()) { addGroup(newGroup.trim()); setNewGroup(""); }
            }}
          />
          <Button kind="ghost" disabled={!newGroup.trim()} onClick={() => { addGroup(newGroup.trim()); setNewGroup(""); }}>
            {t("people.addGroup")}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-faint">{t("people.groupsHelp")}</p>
      </div>

      {/* filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className={cls(inputCls, "w-auto")}>
          <option value="all">{t("people.allGroups")}</option>
          {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
          <option value="none">{t("people.noGroup")}</option>
        </select>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className={cls(inputCls, "w-auto")}>
          <option value="all">{t("people.allRoles")}</option>
          <option value="officer">{t("people.officers")}</option>
          <option value="soldier">{t("people.soldiers")}</option>
        </select>
        <div className="ms-auto inline-flex items-center rounded-lg border border-line bg-surface-2 p-0.5" role="radiogroup">
          {(["name", "group"] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={sort === k} onClick={() => setSort(k)}
              className={cls("rounded-md px-2.5 py-1 text-xs font-semibold", sort === k ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink")}>
              {k === "name" ? t("people.sortName") : t("people.sortGroup")}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState title={t("people.emptyTitle")}>
          <p className="mb-3">{t("people.emptyBody")}</p>
          <Button onClick={openNew}>{t("people.addPerson")}</Button>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-panel shadow-lift">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-xs text-faint">
                <th className="border-b border-line px-3 py-2 text-start font-semibold">{t("c.name")}</th>
                <th className="border-b border-line px-3 py-2 text-start font-semibold">{t("people.colRole")}</th>
                <th className="border-b border-line px-3 py-2 text-start font-semibold">{t("c.group")}</th>
                <th className="border-b border-line px-3 py-2 text-start font-semibold">{t("people.colTags")}</th>
                <th className="border-b border-line px-3 py-2 text-start font-semibold">{t("people.colLimits")}</th>
                <th className="border-b border-line px-3 py-2 text-start font-semibold">{t("people.availability")}</th>
                <th className="border-b border-line px-3 py-2 text-center font-semibold">{t("people.colActive")}</th>
                <th className="border-b border-line px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => {
                const bans = p.bannedShiftIds.map((id) => config.shifts.find((s) => s.id === id)?.name ?? id);
                return (
                  <tr key={p.id} className={cls("group hover:bg-surface-2/60", !p.active && "opacity-50")}>
                    <td className="border-b border-line/60 px-3 py-2.5">
                      <button type="button" onClick={() => { setEditing(structuredClone(p)); setIsNew(false); }}
                        className="inline-flex items-center gap-2 font-semibold hover:text-pikud-orange-dark">
                        <ColorDot color={p.color} /> {p.name}
                      </button>
                    </td>
                    <td className="border-b border-line/60 px-3 py-2.5"><RoleBadge roles={p.roles} /></td>
                    <td className="border-b border-line/60 px-3 py-2.5">
                      {groupName(p.groupId) ? (
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">{groupName(p.groupId)}</span>
                      ) : (
                        <span className="text-xs text-faint">—</span>
                      )}
                    </td>
                    <td className="border-b border-line/60 px-3 py-2.5 text-xs text-ink-soft">{p.tags.length ? p.tags.join(" · ") : <span className="text-faint">—</span>}</td>
                    <td className="border-b border-line/60 px-3 py-2.5 font-mono text-xs text-ink-soft">{limitsOf(p) ?? <span className="text-faint">{t("people.limitsNone")}</span>}</td>
                    <td className="border-b border-line/60 px-3 py-2.5 text-xs">
                      {bans.length > 0 && <span className="text-samber">{t("people.no")} {bans.join(", ")}</span>}
                      {bans.length > 0 && p.unavailable.length > 0 && " · "}
                      {p.unavailable.length > 0 && <span className="text-ink-soft">{t("people.windows", { n: p.unavailable.length })}</span>}
                      {bans.length === 0 && p.unavailable.length === 0 && <span className="text-faint">{t("people.fullyAvail")}</span>}
                    </td>
                    <td className="border-b border-line/60 px-3 py-2.5 text-center">
                      <Toggle on={p.active} onChange={(active) => updatePerson({ ...p, active })} />
                    </td>
                    <td className="border-b border-line/60 px-2 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" aria-label={t("c.edit")} title={t("c.edit")} onClick={() => { setEditing(structuredClone(p)); setIsNew(false); }}
                          className="rounded-md p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"><Pencil className="h-4 w-4" /></button>
                        <button type="button" aria-label={t("c.remove")} title={t("c.remove")}
                          onClick={async () => { if (await confirmDialog(t("people.removeConfirm", { name: p.name }))) removePerson(p.id); }}
                          className="rounded-md p-1.5 text-ink-muted hover:bg-danger-pale hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(people.length > 0 || groups.length > 0) && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
          {people.length > 0 && (
            <Button kind="danger" onClick={async () => { if (await confirmDialog(t("del.peopleConfirm"))) clearPeople(); }}>
              {t("del.people")}
            </Button>
          )}
          {groups.length > 0 && (
            <Button kind="danger" onClick={async () => { if (await confirmDialog(t("del.groupsConfirm"))) clearGroups(); }}>
              {t("del.groups")}
            </Button>
          )}
        </div>
      )}

      {editing && (
        <Modal
          title={isNew ? t("people.addTitle") : t("people.editTitle", { name: editing.name || t("people.person") })}
          onClose={() => setEditing(null)}
          wide
        >
          <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
            {/* ── identity ── */}
            <section className="grid content-start gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-faint">{t("people.identity")}</h4>
              <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                <Field label={t("c.name")}>
                  <input
                    className={inputCls}
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder={t("people.namePh")}
                    autoFocus
                  />
                </Field>
                <div className="pb-1.5">
                  <Toggle on={editing.active} onChange={(active) => setEditing({ ...editing, active })} label={editing.active ? t("people.colActive") : t("people.inactive")} />
                </div>
              </div>

              <Field label={t("people.rolesLabel")} hint={t("people.rolesHint")}>
                <div className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5" role="radiogroup">
                  {(["soldier", "officer", "both"] as RolePick[]).map((r) => {
                    const on = pickOf(editing.roles) === r;
                    return (
                      <button key={r} type="button" role="radio" aria-checked={on} onClick={() => setEditing({ ...editing, roles: rolesOf(r) })}
                        className={cls("rounded-md px-3 py-1 text-sm font-semibold", on ? "bg-pikud-orange text-white shadow-sm" : "text-ink-muted hover:text-ink")}>
                        {r === "soldier" ? t("c.soldier") : r === "officer" ? t("c.officer") : t("people.both")}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Field label={t("c.group")}>
                  <select
                    className={inputCls}
                    value={editing.groupId ?? ""}
                    onChange={(e) => setEditing({ ...editing, groupId: e.target.value || undefined })}
                  >
                    <option value="">{t("people.noGroup")}</option>
                    {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                  </select>
                </Field>
                <Field label={t("people.colorLabel")}>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      className="h-[34px] w-11 cursor-pointer rounded-md border border-line bg-panel p-0.5"
                      value={editing.color ?? "#6B8E23"}
                      onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                    />
                    <Button kind="ghost" title={t("people.autoColorHint")}
                      onClick={() => setEditing({ ...editing, color: nextColor(people.map((x) => x.color)) })}>
                      {t("people.autoColor")}
                    </Button>
                  </div>
                </Field>
              </div>

              <Field label={t("people.tagsLabel")} hint={t("people.tagsHint")}>
                <TagInput
                  tags={editing.tags}
                  onChange={(tags) => setEditing({ ...editing, tags })}
                  suggestions={allTags}
                  placeholder={t("people.tagPh")}
                />
              </Field>
            </section>

            {/* ── availability and limits ── */}
            <section className="grid content-start gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-faint">{t("people.availability")}</h4>
              <Field label={t("people.bansLabel")}>
                <div className="flex flex-wrap gap-1.5">
                  {config.shifts.map((s) => {
                    const on = editing.bannedShiftIds.includes(s.id);
                    return (
                      <button key={s.id} type="button" aria-pressed={on}
                        onClick={() => setEditing({ ...editing, bannedShiftIds: on ? editing.bannedShiftIds.filter((x) => x !== s.id) : [...editing.bannedShiftIds, s.id] })}
                        className={cls("rounded-full border px-3 py-1 text-sm transition-colors",
                          on ? "border-samber bg-samber-pale text-samber line-through" : "border-line-strong bg-surface text-ink hover:border-pikud-orange")}>
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">{t("people.unavailTitle")}</span>
                  <Button kind="ghost"
                    onClick={() => setEditing({ ...editing, unavailable: [...editing.unavailable, { id: uid(), from: "", to: "", reason: "" }] })}>
                    {t("people.addWindow")}
                  </Button>
                </div>
                {editing.unavailable.length === 0 ? (
                  <p className="text-xs text-faint">{t("people.fullyAvail")}</p>
                ) : (
                  <p className="mb-2 text-xs text-faint">{t("people.timesHint")}</p>
                )}
                <div className="grid gap-2">
                  {editing.unavailable.map((u) => {
                    const patch = (partial: Partial<typeof u>) =>
                      setEditing({ ...editing, unavailable: editing.unavailable.map((x) => (x.id === u.id ? { ...x, ...partial } : x)) });
                    return (
                      <div key={u.id} className="grid gap-1.5 rounded-lg border border-line p-2">
                        <div className="grid grid-cols-[1fr_0.7fr_1fr_0.7fr] items-center gap-1.5" dir="ltr">
                          <input type="date" className={inputCls} value={u.from} onChange={(e) => patch({ from: e.target.value, to: u.to || e.target.value })} />
                          <input type="time" className={inputCls} value={u.fromTime ?? ""} title={t("people.leaveAt")} onChange={(e) => patch({ fromTime: e.target.value || undefined })} />
                          <input type="date" className={inputCls} value={u.to} onChange={(e) => patch({ to: e.target.value })} />
                          <input type="time" className={inputCls} value={u.toTime ?? ""} title={t("people.backAt")} onChange={(e) => patch({ toTime: e.target.value || undefined })} />
                        </div>
                        <div className="grid grid-cols-[1fr_auto] items-center gap-1.5">
                          <input className={inputCls} placeholder={t("people.reasonPh")} value={u.reason ?? ""} onChange={(e) => patch({ reason: e.target.value })} />
                          <Button kind="danger" onClick={() => setEditing({ ...editing, unavailable: editing.unavailable.filter((x) => x.id !== u.id) })}>×</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <h4 className="mt-1 text-xs font-semibold uppercase tracking-wide text-faint">{t("people.limitsTitle")}</h4>
              <div className="grid grid-cols-3 gap-2">
                <Field label={t("people.maxDay")}>
                  <input type="number" min={1} className={cls(inputCls, "text-center")} value={editing.maxPerDay ?? ""} placeholder={String(config.maxPerDay)}
                    onChange={(e) => setEditing({ ...editing, maxPerDay: e.target.value ? Number(e.target.value) : undefined })} />
                </Field>
                <Field label={t("people.maxWeek")}>
                  <input type="number" min={1} className={cls(inputCls, "text-center")} value={editing.maxPerWeek ?? ""} placeholder={String(config.maxPerWeek)}
                    onChange={(e) => setEditing({ ...editing, maxPerWeek: e.target.value ? Number(e.target.value) : undefined })} />
                </Field>
                <Field label={t("people.minRest")}>
                  <input type="number" min={0} className={cls(inputCls, "text-center")} value={editing.minRestHours ?? ""} placeholder={String(config.minRestHours)}
                    onChange={(e) => setEditing({ ...editing, minRestHours: e.target.value ? Number(e.target.value) : undefined })} />
                </Field>
              </div>
              <p className="-mt-1 text-xs text-faint">{t("people.limitsHint")}</p>
            </section>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-4">
            <Button kind="ghost" onClick={() => setEditing(null)}>{t("c.cancel")}</Button>
            <Button onClick={save} disabled={!editing.name.trim() || editing.roles.length === 0}>
              {t("c.save")}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
