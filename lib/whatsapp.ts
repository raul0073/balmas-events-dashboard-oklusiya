import { CrisisEvent, INFRASTRUCTURE_LABELS, eventTitle, plugahLabel } from "@/types";
import { accountedFor, anchorInfo, calcMissing } from "@/lib/events/math";

function fmt(val: number | null | undefined): string {
  return val !== null && val !== undefined ? String(val) : "—";
}

const LINE = "━━━━━━━━━━━━━━━━━━━━";

function stamp(iso: string): string {
  return new Date(iso).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function formatEventForWhatsApp(event: CrisisEvent, header = "פיקוד העורף"): string {
  const infraLabel = event.infrastructureType ? INFRASTRUCTURE_LABELS[event.infrastructureType] : "לא צוין";
  const missing    = calcMissing(event);
  const isFinale   = missing === 0;
  const isNegative = missing !== null && missing < 0;

  const missingLine = missing === null
    ? `• נעדרים: — (אין עוגן)`
    : isFinale
    ? `🎉 *נעדרים: 0 — כל האנשים ידועים!*`
    : isNegative
    ? `⚠️ *נעדרים: ${missing} — סכום עולה על העוגן!*`
    : `🔴 *נעדרים: ${missing}*`;

  const anchor = anchorInfo(event);
  const anchorLine = anchor.value === null
    ? `• עוגן: —`
    : anchor.assumed
    ? `⚠️ *עוגן משוער לפי צפי: ${anchor.value}* | מסוכם: ${accountedFor(event)}`
    : `✅ *עוגן: ${anchor.value}* | מסוכם: ${accountedFor(event)}`;

  return `🚨 *דיווח אירוע | ${header}*
${LINE}
📍 *${eventTitle(event)}*${event.name.trim() && event.address.trim() ? `
${event.address}` : ""}${event.commander.trim() ? `
👤 אחראי: ${event.commander}` : ""}
🏗️ ${infraLabel} | ⚡ ${event.crisisType ?? "לא צוין"} | 🪖 ${plugahLabel(event.plugah, "לא שויך")}
🕐 ${stamp(event.createdAt)}
${LINE}
${anchorLine}
• צפי: ${fmt(event.tzapi)}
${LINE}
• לכודים גלויים: ${fmt(event.lekudimGluyim)}
• לכודים סמויים: ${fmt(event.lekudimSmuim)}
• חולצו: ${fmt(event.hulitzu)}
• מאותרים: ${fmt(event.meautarim)}
• פונו: ${fmt(event.punu)}
${missingLine}${event.hearot ? `\n${LINE}\n📝 ${event.hearot}` : ""}
${LINE}
עודכן: ${stamp(event.updatedAt)}`;
}

export function formatAllEventsForWhatsApp(events: CrisisEvent[], header = "פיקוד העורף"): string {
  const active       = events.filter((e) => e.status === "active");
  const totalAnchor  = active.reduce((s, e) => s + (anchorInfo(e).value ?? 0), 0);
  const assumedCount = active.filter((e) => anchorInfo(e).assumed).length;
  const totalMissing = active.reduce((s, e) => s + Math.max(calcMissing(e) ?? 0, 0), 0);
  const totalTrapped = active.reduce((s, e) => s + (e.lekudimGluyim ?? 0) + (e.lekudimSmuim ?? 0), 0);
  const totalRescued = active.reduce((s, e) => s + (e.hulitzu ?? 0), 0);
  const errCount     = active.filter((e) => { const n = calcMissing(e); return n !== null && n < 0; }).length;
  const finaleCount  = active.filter((e) => calcMissing(e) === 0).length;

  const head = [
    `🚨 *סיכום מבצעי | ${header}*`,
    `📅 ${new Date().toLocaleString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
    LINE,
    `אירועים פעילים: *${active.length}*`,
    totalAnchor  ? `סה"כ אנשים (עוגן): *${totalAnchor}*` : null,
    totalMissing > 0 ? `🔴 נעדרים: *${totalMissing}*` : `✅ אין נעדרים`,
    totalTrapped > 0 ? `⚠️ לכודים: *${totalTrapped}*` : null,
    totalRescued > 0 ? `✅ חולצו: *${totalRescued}*` : null,
    finaleCount  > 0 ? `🎉 אירועים הושלמו: *${finaleCount}*` : null,
    errCount     > 0 ? `🚨 שגיאות נתונים: *${errCount}*` : null,
    assumedCount > 0 ? `⚠️ עוגן משוער לפי צפי: *${assumedCount}* אירועים` : null,
    LINE,
  ].filter(Boolean).join("\n");

  const body = active.map((e, i) => {
    const missing    = calcMissing(e);
    const missingStr = missing === null ? "—" : missing === 0 ? "0 🎉" : missing < 0 ? `${missing} ⚠️` : String(missing);
    return [
      `*${i + 1}. ${eventTitle(e)}*${e.name.trim() && e.address.trim() ? ` — ${e.address}` : ""}`,
      e.commander.trim() ? `   👤 ${e.commander}` : null,
      `   🪖 ${plugahLabel(e.plugah, "—")} | ⚡ ${e.crisisType ?? "—"} | עוגן: ${anchorInfo(e).value === null ? "—" : anchorInfo(e).assumed ? `${anchorInfo(e).value} (משוער)` : anchorInfo(e).value}`,
      `   לכודים גלויים: ${fmt(e.lekudimGluyim)} | לכודים סמויים: ${fmt(e.lekudimSmuim)}`,
      `   חולצו: ${fmt(e.hulitzu)} | פונו: ${fmt(e.punu)} | מאותרים: ${fmt(e.meautarim)}`,
      `   🔴 נעדרים: ${missingStr}`,
      e.hearot ? `   📝 ${e.hearot}` : null,
    ].filter(Boolean).join("\n");
  }).join("\n\n");

  return head + "\n\n" + body;
}
