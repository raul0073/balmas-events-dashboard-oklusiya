import { AppConfig, Group, Person, Schedule } from "./types";
import { TFn } from "./i18n";
import { PersonStats } from "./stats";
import { eachDay, fmtDay, weekdayIndex } from "./time";
import { bucketAssigned } from "./generator";

const FONT = { name: "Arial", size: 10 };
const thin = { style: "thin" as const, color: { argb: "FFD9DCD2" } };
const BORDER = { top: thin, left: thin, bottom: thin, right: thin };

export async function exportScheduleXlsx(opts: {
  schedule: Schedule;
  people: Person[];
  config: AppConfig;
  groups: Group[];
  personStats: PersonStats[];
  t: TFn;
}) {
  const { schedule, people, config, groups, personStats, t } = opts;
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Shift Creator";

  const days = eachDay(schedule.from, schedule.to);
  const byId = new Map(people.map((p) => [p.id, p]));
  const name = (id: string) => byId.get(id)?.name ?? "?";

  // ---- Roster sheet ----
  const ws = wb.addWorksheet(t("xl.roster"), { views: [{ state: "frozen", xSplit: 1, ySplit: 1 }] });
  ws.getColumn(1).width = 20;
  for (let i = 0; i < days.length; i++) ws.getColumn(i + 2).width = 18;

  const header = ws.getRow(1);
  header.getCell(1).value = t("xl.shift");
  days.forEach((d, i) => {
    header.getCell(i + 2).value = `${t(`wd.${weekdayIndex(d)}`)} ${fmtDay(d)}`;
  });
  header.eachCell((c) => {
    c.font = { ...FONT, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF55613D" } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = BORDER;
  });

  let r = 2;
  for (const shift of config.shifts) {
    const row = ws.getRow(r++);
    row.getCell(1).value = `${shift.name}\n${shift.start}–${shift.end}`;
    days.forEach((d, i) => {
      const inst = schedule.instances[`${d}_${shift.id}`];
      if (!inst) return;
      const assigned = inst.assigned
        .map((id) => byId.get(id))
        .filter((p): p is Person => !!p);
      const b = bucketAssigned(assigned, shift);
      const lines = [
        ...b.officers.map((p) => `${p.name} ${t("xl.officerMark")}`),
        ...b.soldiers.map((p) => p.name),
      ];
      row.getCell(i + 2).value = lines.join("\n");
    });
    styleBodyRow(row, days.length, shift.isNight, false);

    if (shift.backups > 0) {
      const brow = ws.getRow(r++);
      brow.getCell(1).value = `${shift.name} — ${t("xl.backupSuffix")}`;
      days.forEach((d, i) => {
        const inst = schedule.instances[`${d}_${shift.id}`];
        if (!inst) return;
        brow.getCell(i + 2).value = inst.backups.map(name).join("\n");
      });
      styleBodyRow(brow, days.length, shift.isNight, true);
    }
  }

  function styleBodyRow(row: import("exceljs").Row, nDays: number, night: boolean, backup: boolean) {
    for (let c = 1; c <= nDays + 1; c++) {
      const cell = row.getCell(c);
      cell.font = { ...FONT, italic: backup, bold: c === 1 && !backup };
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = BORDER;
      if (night) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E8F2" } };
      else if (backup) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F5F0" } };
    }
  }

  // ---- People sheet ----
  const ps = wb.addWorksheet(t("xl.people"));
  const cols = [
    t("xl.hName"), t("xl.hRoles"), t("xl.hGroup"), t("xl.hShifts"),
    t("xl.hHours"), t("xl.hNights"), t("xl.hWeekend"), t("xl.hBackups"), t("xl.hRatio"),
  ];
  ps.getRow(1).values = cols;
  ps.getRow(1).eachCell((c) => {
    c.font = { ...FONT, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF55613D" } };
    c.border = BORDER;
  });
  ps.columns = cols.map((_, i) => ({ width: i === 0 ? 18 : i === cols.length - 1 ? 12 : 10 }));
  const groupName = (id?: string) => groups.find((g) => g.id === id)?.name ?? "";
  personStats.forEach((s, i) => {
    const row = ps.getRow(i + 2);
    row.values = [
      s.person.name,
      s.person.roles.map((x) => (x === "officer" ? t("c.officer") : t("c.soldier"))).join(" + "),
      groupName(s.person.groupId),
      s.shifts,
      s.hours,
      s.nights,
      s.weekend,
      s.backups,
      s.loadPct === null ? "—" : `${Math.round(s.loadPct)}%`,
    ];
    row.eachCell((c) => {
      c.font = FONT;
      c.border = BORDER;
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `roster-${schedule.from}-to-${schedule.to}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}
