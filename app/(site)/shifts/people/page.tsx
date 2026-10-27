"use client";
import { useMemo, useState } from "react";
import { uid, useApp, useMounted } from "@/lib/shifts/store";
import { Person, Role } from "@/lib/shifts/types";
import { useT } from "@/lib/shifts/i18n";
import {
  Button,
  Card,
  ColorDot,
  EmptyState,
  Field,
  Modal,
  RoleBadge,
  SectionTitle,
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
  const [newGroup, setNewGroup] = useState("");

  const allTags = useMemo(() => Array.from(new Set(people.flatMap((p) => p.tags))).sort(), [people]);
  if (!mounted) return null;

  const shown = people.filter(
    (p) =>
      (filter === "all" || p.roles.includes(filter)) &&
      (groupFilter === "all" || (groupFilter === "none" ? !p.groupId : p.groupId === groupFilter))
  );
  const groupName = (id?: string) => groups.find((g) => g.id === id)?.name;

  const save = () => {
    if (!editing || !editing.name.trim() || editing.roles.length === 0) return;
    const p = { ...editing, name: editing.name.trim() };
    if (isNew) addPerson(p);
    else updatePerson(p);
    setEditing(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("people.title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className={cls(inputCls, "w-auto")}
          >
            <option value="all">{t("people.allGroups")}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
            <option value="none">{t("people.noGroup")}</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className={cls(inputCls, "w-auto")}
          >
            <option value="all">{t("people.allRoles")}</option>
            <option value="officer">{t("people.officers")}</option>
            <option value="soldier">{t("people.soldiers")}</option>
          </select>
          <Button
            onClick={() => {
              setEditing(blank());
              setIsNew(true);
            }}
          >
            {t("people.addPerson")}
          </Button>
        </div>
      </header>

      <Card className="mb-4">
        <SectionTitle>{t("people.groupsTitle")}</SectionTitle>
        <p className="mb-3 text-xs text-faint">{t("people.groupsHelp")}</p>
        <div className="flex flex-wrap items-center gap-2">
          {groups.map((g) => (
            <span key={g.id} className="inline-flex items-center gap-1 rounded-md border border-line bg-paper px-1 py-0.5">
              <input
                className="w-24 bg-transparent px-1 text-sm outline-none"
                value={g.name}
                onChange={(e) => renameGroup(g.id, e.target.value)}
              />
              <span className="font-mono text-[10px] text-faint" title={t("people.members")}>
                {people.filter((p) => p.groupId === g.id).length}
              </span>
              <button
                onClick={() => confirm(t("people.delGroupConfirm", { name: g.name })) && removeGroup(g.id)}
                className="rounded px-1 text-faint hover:text-danger"
              >
                ×
              </button>
            </span>
          ))}
          <input
            className={cls(inputCls, "w-36")}
            placeholder={t("people.newGroupPh")}
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newGroup.trim()) {
                addGroup(newGroup.trim());
                setNewGroup("");
              }
            }}
          />
          <Button
            kind="ghost"
            disabled={!newGroup.trim()}
            onClick={() => {
              addGroup(newGroup.trim());
              setNewGroup("");
            }}
          >
            {t("people.addGroup")}
          </Button>
        </div>
      </Card>

      {shown.length === 0 ? (
        <EmptyState title={t("people.emptyTitle")}>{t("people.emptyBody")}</EmptyState>
      ) : (
        <div className="grid gap-2">
          {shown.map((p) => (
            <Card key={p.id} className={cls("flex items-center gap-3 py-3", !p.active && "opacity-50")}>
              <ColorDot color={p.color} />
              <RoleBadge roles={p.roles} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-medium">
                  {p.name}
                  {groupName(p.groupId) && (
                    <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[10px] text-faint">
                      {groupName(p.groupId)}
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-faint">
                  {p.tags.length > 0 && <span>{p.tags.join(" · ")}</span>}
                  {p.bannedShiftIds.length > 0 && (
                    <span className="text-samber">
                      {p.tags.length > 0 && " — "}
                      {t("people.no")}{" "}
                      {p.bannedShiftIds
                        .map((id) => config.shifts.find((s) => s.id === id)?.name ?? id)
                        .join(", ")}
                    </span>
                  )}
                  {p.unavailable.length > 0 && (
                    <span> — {t("people.windows", { n: p.unavailable.length })}</span>
                  )}
                </div>
              </div>
              <Button
                kind="ghost"
                onClick={() => {
                  setEditing(structuredClone(p));
                  setIsNew(false);
                }}
              >
                {t("c.edit")}
              </Button>
              <Button
                kind="danger"
                onClick={() => confirm(t("people.removeConfirm", { name: p.name })) && removePerson(p.id)}
              >
                {t("c.remove")}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {(people.length > 0 || groups.length > 0) && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
          {people.length > 0 && (
            <Button kind="danger" onClick={() => confirm(t("del.peopleConfirm")) && clearPeople()}>
              {t("del.people")}
            </Button>
          )}
          {groups.length > 0 && (
            <Button kind="danger" onClick={() => confirm(t("del.groupsConfirm")) && clearGroups()}>
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
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr_auto]">
              <Field label={t("c.name")}>
                <input
                  className={inputCls}
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder={t("people.namePh")}
                  autoFocus
                />
              </Field>
              <Field label={t("c.group")}>
                <select
                  className={inputCls}
                  value={editing.groupId ?? ""}
                  onChange={(e) => setEditing({ ...editing, groupId: e.target.value || undefined })}
                >
                  <option value="">{t("people.noGroup")}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("people.colorLabel")}>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    className="h-8 w-10 cursor-pointer rounded-md border border-line bg-panel p-0.5"
                    value={editing.color ?? "#6B8E23"}
                    onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                  />
                  <Button
                    kind="ghost"
                    title={t("people.autoColorHint")}
                    onClick={() =>
                      setEditing({ ...editing, color: nextColor(people.map((x) => x.color)) })
                    }
                  >
                    {t("people.autoColor")}
                  </Button>
                </div>
              </Field>
            </div>

            <Field label={t("people.rolesLabel")} hint={t("people.rolesHint")}>
              <div className="flex gap-4 rounded-md border border-line p-2.5">
                {(["soldier", "officer"] as Role[]).map((r) => (
                  <label key={r} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={editing.roles.includes(r)}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          roles: e.target.checked
                            ? [...editing.roles, r]
                            : editing.roles.filter((x) => x !== r),
                        })
                      }
                    />
                    {r === "soldier" ? t("c.soldier") : t("c.officer")}
                  </label>
                ))}
                {editing.roles.length === 0 && <span className="text-xs text-danger">{t("people.pickOne")}</span>}
              </div>
            </Field>

            <Field label={t("people.tagsLabel")} hint={t("people.tagsHint")}>
              <TagInput
                tags={editing.tags}
                onChange={(tags) => setEditing({ ...editing, tags })}
                suggestions={allTags}
                placeholder={t("people.tagPh")}
              />
            </Field>

            <Field label={t("people.bansLabel")}>
              <div className="flex flex-wrap gap-3 rounded-md border border-line p-2.5">
                {config.shifts.map((s) => (
                  <label key={s.id} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={editing.bannedShiftIds.includes(s.id)}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          bannedShiftIds: e.target.checked
                            ? [...editing.bannedShiftIds, s.id]
                            : editing.bannedShiftIds.filter((x) => x !== s.id),
                        })
                      }
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label={t("people.maxDay")} hint={t("people.default", { n: config.maxPerDay })}>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={editing.maxPerDay ?? ""}
                  placeholder="—"
                  onChange={(e) =>
                    setEditing({ ...editing, maxPerDay: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </Field>
              <Field label={t("people.maxWeek")} hint={t("people.default", { n: config.maxPerWeek })}>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={editing.maxPerWeek ?? ""}
                  placeholder="—"
                  onChange={(e) =>
                    setEditing({ ...editing, maxPerWeek: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </Field>
              <Field label={t("people.minRest")} hint={t("people.default", { n: config.minRestHours })}>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={editing.minRestHours ?? ""}
                  placeholder="—"
                  onChange={(e) =>
                    setEditing({ ...editing, minRestHours: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </Field>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">{t("people.unavailTitle")}</span>
                <Button
                  kind="ghost"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      unavailable: [...editing.unavailable, { id: uid(), from: "", to: "", reason: "" }],
                    })
                  }
                >
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
                    setEditing({
                      ...editing,
                      unavailable: editing.unavailable.map((x) => (x.id === u.id ? { ...x, ...partial } : x)),
                    });
                  return (
                    <div key={u.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 sm:grid-cols-[1.1fr_0.8fr_1.1fr_0.8fr_1fr_auto]">
                      <input
                        type="date"
                        className={inputCls}
                        value={u.from}
                        onChange={(e) => patch({ from: e.target.value, to: u.to || e.target.value })}
                      />
                      <input
                        type="time"
                        className={inputCls}
                        value={u.fromTime ?? ""}
                        title={t("people.leaveAt")}
                        onChange={(e) => patch({ fromTime: e.target.value || undefined })}
                      />
                      <input
                        type="date"
                        className={inputCls}
                        value={u.to}
                        onChange={(e) => patch({ to: e.target.value })}
                      />
                      <input
                        type="time"
                        className={inputCls}
                        value={u.toTime ?? ""}
                        title={t("people.backAt")}
                        onChange={(e) => patch({ toTime: e.target.value || undefined })}
                      />
                      <input
                        className={inputCls}
                        placeholder={t("people.reasonPh")}
                        value={u.reason ?? ""}
                        onChange={(e) => patch({ reason: e.target.value })}
                      />
                      <Button
                        kind="danger"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            unavailable: editing.unavailable.filter((x) => x.id !== u.id),
                          })
                        }
                      >
                        ×
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <Toggle
                on={editing.active}
                onChange={(active) => setEditing({ ...editing, active })}
                label={t("people.activeLabel")}
              />
              <div className="flex gap-2">
                <Button kind="ghost" onClick={() => setEditing(null)}>{t("c.cancel")}</Button>
                <Button onClick={save} disabled={!editing.name.trim() || editing.roles.length === 0}>
                  {t("c.save")}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
