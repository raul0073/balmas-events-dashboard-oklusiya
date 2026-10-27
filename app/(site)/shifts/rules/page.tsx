"use client";
import { useMemo, useState } from "react";
import { uid, useApp, useMounted } from "@/lib/shifts/store";
import { Rule, RuleType } from "@/lib/shifts/types";
import { useT } from "@/lib/shifts/i18n";
import { Button, Card, EmptyState, Field, Modal, Toggle, cls, inputCls } from "@/components/shifts/ui";

export default function RulesPage() {
  const mounted = useMounted();
  const { rules, people, config, addRule, updateRule, removeRule, clearRules } = useApp();
  const { t } = useT();
  const typeLabel = (ty: RuleType) => t(`rules.t.${ty}`);
  const [draft, setDraft] = useState<Rule | null>(null);
  const allTags = useMemo(() => Array.from(new Set(people.flatMap((p) => p.tags))).sort(), [people]);
  if (!mounted) return null;

  const newRule = (type: RuleType): Rule => {
    const base = { id: uid(), enabled: true, hard: true };
    if (type === "incompatible_tags") return { ...base, type, tagA: "", tagB: "" };
    if (type === "pin")
      return { ...base, type, personId: people[0]?.id ?? "", date: "", shiftId: config.shifts[0]?.id ?? "" };
    return { ...base, type, max: 2 };
  };

  const describe = (r: Rule): string => {
    if (r.type === "incompatible_tags") return t("rules.d.incompat", { a: r.tagA, b: r.tagB });
    if (r.type === "pin") {
      const p = people.find((x) => x.id === r.personId)?.name ?? "?";
      const s = config.shifts.find((x) => x.id === r.shiftId)?.name ?? "?";
      return t("rules.d.pin", { p, s, d: r.date || "?" });
    }
    const who = r.personId ? people.find((x) => x.id === r.personId)?.name ?? "?" : t("rules.everyone");
    return t("rules.d.maxNights", { n: r.max, who });
  };

  const valid = (r: Rule): boolean => {
    if (r.type === "incompatible_tags") return !!r.tagA && !!r.tagB;
    if (r.type === "pin") return !!r.personId && !!r.date && !!r.shiftId;
    return r.max > 0;
  };

  const save = () => {
    if (!draft || !valid(draft)) return;
    if (rules.some((r) => r.id === draft.id)) updateRule(draft);
    else addRule(draft);
    setDraft(null);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("rules.title")}</h1>
        <div className="flex flex-wrap gap-2">
          {(["incompatible_tags", "pin", "max_nights_per_week"] as RuleType[]).map((ty) => (
            <Button key={ty} kind="ghost" onClick={() => setDraft(newRule(ty))}>
              + {typeLabel(ty)}
            </Button>
          ))}
        </div>
      </header>

      <p className="mb-4 text-sm text-faint">
{t("rules.help")}
      </p>

      {rules.length === 0 ? (
        <EmptyState title={t("rules.emptyTitle")}>
{t("rules.emptyBody")}
        </EmptyState>
      ) : (
        <div className="grid gap-2">
          {rules.map((r) => (
            <Card key={r.id} className={cls("flex items-center gap-3 py-3", !r.enabled && "opacity-50")}>
              <Toggle on={r.enabled} onChange={(enabled) => updateRule({ ...r, enabled })} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{describe(r)}</div>
                <div className="text-xs text-faint">{typeLabel(r.type)}</div>
              </div>
              <button
                onClick={() => updateRule({ ...r, hard: !r.hard })}
                className={cls(
                  "rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase",
                  r.hard ? "bg-danger-pale text-danger" : "bg-samber-pale text-samber"
                )}
                title={t("rules.hardToggle")}
              >
                {r.hard ? t("rules.hard") : t("rules.soft")}
              </button>
              <Button kind="ghost" onClick={() => setDraft(structuredClone(r))}>{t("c.edit")}</Button>
              <Button kind="danger" onClick={() => removeRule(r.id)}>{t("c.remove")}</Button>
            </Card>
          ))}
        </div>
      )}

      {rules.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <Button kind="danger" onClick={() => confirm(t("del.rulesConfirm")) && clearRules()}>
            {t("del.rules")}
          </Button>
        </div>
      )}

      {draft && (
        <Modal title={typeLabel(draft.type)} onClose={() => setDraft(null)}>
          <div className="grid gap-4">
            {draft.type === "incompatible_tags" && (
              <>
                <p className="text-sm text-faint">
{t("rules.incompatHelp")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("rules.tagA")}>
                    <input list="rule-tags" className={inputCls} value={draft.tagA}
                      onChange={(e) => setDraft({ ...draft, tagA: e.target.value.trim().toLowerCase() })} />
                  </Field>
                  <Field label={t("rules.tagB")}>
                    <input list="rule-tags" className={inputCls} value={draft.tagB}
                      onChange={(e) => setDraft({ ...draft, tagB: e.target.value.trim().toLowerCase() })} />
                  </Field>
                </div>
                <datalist id="rule-tags">
                  {allTags.map((t) => <option key={t} value={t} />)}
                </datalist>
              </>
            )}

            {draft.type === "pin" && (
              <>
                <Field label={t("rules.person")}>
                  <select className={inputCls} value={draft.personId}
                    onChange={(e) => setDraft({ ...draft, personId: e.target.value })}>
                    {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("rules.date")}>
                    <input type="date" className={inputCls} value={draft.date}
                      onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                  </Field>
                  <Field label={t("rules.shift")}>
                    <select className={inputCls} value={draft.shiftId}
                      onChange={(e) => setDraft({ ...draft, shiftId: e.target.value })}>
                      {config.shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                </div>
              </>
            )}

            {draft.type === "max_nights_per_week" && (
              <>
                <Field label={t("rules.maxNightsLabel")}>
                  <input type="number" min={0} className={inputCls} value={draft.max}
                    onChange={(e) => setDraft({ ...draft, max: Number(e.target.value) })} />
                </Field>
                <Field label={t("rules.appliesTo")} hint={t("rules.appliesHint")}>
                  <select className={inputCls} value={draft.personId ?? ""}
                    onChange={(e) => setDraft({ ...draft, personId: e.target.value || undefined })}>
                    <option value="">{t("rules.everyone")}</option>
                    {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
              </>
            )}

            <div className="flex items-center justify-between border-t border-line pt-4">
              <Toggle on={draft.hard} onChange={(hard) => setDraft({ ...draft, hard })} label={t("rules.hardLabel")} />
              <div className="flex gap-2">
                <Button kind="ghost" onClick={() => setDraft(null)}>{t("c.cancel")}</Button>
                <Button onClick={save} disabled={!valid(draft)}>{t("rules.saveRule")}</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
