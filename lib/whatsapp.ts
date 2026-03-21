import { CrisisEvent, PLUGAH_LABELS, INFRASTRUCTURE_LABELS } from "@/types";

function fmt(val: number | null | undefined): string {
  return val !== null && val !== undefined ? String(val) : "—";
}

function calcNedarim(e: CrisisEvent): number | null {
  if (e.resheimEogen === null) return null;
  return e.resheimEogen -
    (e.lekudimGluyim ?? 0) - (e.lekudimSmuim ?? 0) -
    (e.hulitzu ?? 0) - (e.meautarim ?? 0) - (e.punu ?? 0);
}

export function formatEventForWhatsApp(event: CrisisEvent): string {
  const plugahLabel = event.plugah ? PLUGAH_LABELS[event.plugah] : "לא שויך";
  const infraLabel  = event.infrastructureType ? INFRASTRUCTURE_LABELS[event.infrastructureType] : "לא צוין";
  const nedarim     = calcNedarim(event);
  const isFinale    = nedarim === 0;
  const isNegative  = nedarim !== null && nedarim < 0;

  const nedarimLine = nedarim === null
    ? `• נעדרים: — (אין עוגן)`
    : isFinale
    ? `🎉 *נעדרים: 0 — כל האנשים ידועים!*`
    : isNegative
    ? `⚠️ *נעדרים: ${nedarim} — סכום עולה על העוגן!*`
    : `🔴 *נעדרים: ${nedarim}*`;

  const anchorLine = event.resheimEogen !== null
    ? `✅ *עוגן: ${event.resheimEogen}* | מסוכם: ${(event.lekudimGluyim ?? 0) + (event.lekudimSmuim ?? 0) + (event.hulitzu ?? 0) + (event.meautarim ?? 0) + (event.punu ?? 0)}`
    : `• עוגן: —`;

  return `🚨 *דיווח אירוע | פיקוד העורף*
━━━━━━━━━━━━━━━━━━━━
📍 *${event.address}*
🏗️ ${infraLabel} | ⚡ ${event.crisisType ?? "לא צוין"} | 🪖 ${plugahLabel}
🕐 ${new Date(event.createdAt).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
━━━━━━━━━━━━━━━━━━━━
${anchorLine}
• צפי: ${fmt(event.tzapi)}
━━━━━━━━━━━━━━━━━━━━
• לכודים גלויים: ${fmt(event.lekudimGluyim)}
• לכודים סמויים: ${fmt(event.lekudimSmuim)}
• חולצו: ${fmt(event.hulitzu)}
• מאותרים: ${fmt(event.meautarim)}
• פונו: ${fmt(event.punu)}
${nedarimLine}${event.hearot ? `\n━━━━━━━━━━━━━━━━━━━━\n📝 ${event.hearot}` : ""}
━━━━━━━━━━━━━━━━━━━━
עודכן: ${new Date(event.updatedAt).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
}

export function formatAllEventsForWhatsApp(events: CrisisEvent[]): string {
  const active       = events.filter((e) => e.status === "active");
  const totalAnchor  = active.reduce((s, e) => s + (e.resheimEogen ?? 0), 0);
  const totalMissing = active.reduce((s, e) => s + Math.max(calcNedarim(e) ?? 0, 0), 0);
  const totalTrapped = active.reduce((s, e) => s + (e.lekudimGluyim ?? 0) + (e.lekudimSmuim ?? 0), 0);
  const totalRescued = active.reduce((s, e) => s + (e.hulitzu ?? 0), 0);
  const errCount     = active.filter((e) => { const n = calcNedarim(e); return n !== null && n < 0; }).length;
  const finaleCount  = active.filter((e) => calcNedarim(e) === 0).length;

  const header = [
    `🚨 *סיכום מבצעי | פיקוד העורף*`,
    `📅 ${new Date().toLocaleString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `אירועים פעילים: *${active.length}*`,
    totalAnchor  ? `סה"כ אנשים (עוגן): *${totalAnchor}*` : null,
    totalMissing > 0 ? `🔴 נעדרים: *${totalMissing}*` : `✅ אין נעדרים`,
    totalTrapped > 0 ? `⚠️ לכודים: *${totalTrapped}*` : null,
    totalRescued > 0 ? `✅ חולצו: *${totalRescued}*` : null,
    finaleCount  > 0 ? `🎉 אירועים הושלמו: *${finaleCount}*` : null,
    errCount     > 0 ? `🚨 שגיאות נתונים: *${errCount}*` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
  ].filter(Boolean).join("\n");

  const body = active.map((e, i) => {
    const nedarim  = calcNedarim(e);
    const plugah   = e.plugah ? PLUGAH_LABELS[e.plugah] : "—";
    const nedarimStr = nedarim === null ? "—" : nedarim === 0 ? "0 🎉" : nedarim < 0 ? `${nedarim} ⚠️` : String(nedarim);

    return [
      `*${i + 1}. ${e.address}*`,
      `   🪖 ${plugah} | ⚡ ${e.crisisType ?? "—"} | עוגן: ${fmt(e.resheimEogen)}`,
      `   לכודים גלויים: ${fmt(e.lekudimGluyim)} | לכודים סמויים: ${fmt(e.lekudimSmuim)}`,
      `   חולצו: ${fmt(e.hulitzu)} | פונו: ${fmt(e.punu)} | מאותרים: ${fmt(e.meautarim)}`,
      `   🔴 נעדרים: ${nedarimStr}`,
      e.hearot ? `   📝 ${e.hearot}` : null,
    ].filter(Boolean).join("\n");
  }).join("\n\n");

  return header + "\n\n" + body;
}
