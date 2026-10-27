// Seeds the knowledge library from a folder of files into one space.
//   node scripts/seed-library.mjs <folder> <orange|green>
// Titles/descriptions come from the SEED map below (by file name); anything else gets the file name.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { need } from "./env.mjs";

const [folder, space] = process.argv.slice(2);
if (!folder || !["orange", "green"].includes(space)) {
  console.error("usage: node scripts/seed-library.mjs <folder> <orange|green>");
  process.exit(1);
}

const SEED = {
  "טבלת_ריכוז_נעדרים.png":       { category: "forms",  sort: 1, title: "טבלת ריכוז לכודים ונעדרים / עוגן",      description: "רשימת העוגן של האתר: שם, גיל, מיקום, תיאור, סטטוס (נעדר / פונה / אותר / חולץ / לכוד סמוי / לכוד גלוי), טלפון, מי דיווח וקרבה." },
  "טבלת_תיעוד_ממצאים.png":       { category: "forms",  sort: 2, title: "טבלת תיעוד ממצאים וחפצים באתר",         description: "תיעוד ממצאים באתר ההרס: סוג, תיאור, מיקום, תאריך ושעה, למי שויך, סטטוס הלכוד, מי דיווח ותפקידו." },
  "ניהול_אוכלוסיה_בזירת_הרס.png": { category: "forms",  sort: 3, title: "טבלת ניהול אוכלוסייה בזירת פינוי",      description: "מעקב אחרי כל אדם בזירה: שם, ת\"ז, טלפון, שייכות, ודאי בבניין / לכוד פוטנציאלי, גורם מדווח, פונה או לא." },
  "רשימת_מפונים.png":             { category: "forms",  sort: 4, title: "רשימת מפונים בתי אב / משרדים בבניין",   description: "רישום המפונים לפי דירה או משרד: שם, ת\"ז, טלפון, שייכות ארגונית, ודאי בבניין / לכוד פוטנציאלי, גורם מדווח." },
  "צקליסט_מקורות_המידעpng.png":   { category: "forms",  sort: 5, title: "צ'קליסט מקורות מידע ופערים",           description: "מעקב מיצוי מקורות המידע: נפה, גופי הצלה (כב\"ה, מד\"א, מ\"י, זק\"א), רשות מקומית, מחלצים, בתי חולים, ניצולים, משפחה, סיגנט ורשתות. מה נדרש, מה נמסר, איש קשר." },
  "הכנה_לתשאול_ראשוני.png":       { category: "guides", sort: 1, title: "הכנה למשימת תשאול ראשוני",             description: "לפני התשאול: הכנה מנטלית, מאפיינים תרבותיים של האוכלוסייה, רישום ותיעוד, שפה ותרגום." },
  "שאלות.png":                    { category: "guides", sort: 2, title: "שאלות מנחות לתשאול ראשוני",             description: "עשר שאלות לתשאול עובר אורח, שכן או מפונה: היכן שהה, מי היה במבנה, אורחים, גרים ועובדים, אירועים מיוחדים, שרטוט, צילומים." },
  "שיחה_עם_לכוד.png":             { category: "guides", sort: 3, title: "הכוונה לשיחה עם לכוד באתר הרס",       description: "ניהול שיחה עם לכוד: אמפתיה, ארגון קוגניטיבי, פשטות, מסרי הרגעה, סיוע עצמי וחיצוני." },
};

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".pdf": "application/pdf", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation" };

const admin = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const files = readdirSync(folder).filter((f) => statSync(join(folder, f)).isFile());
let n = 0;
for (const name of files) {
  const ext  = extname(name).toLowerCase();
  const mime = MIME[ext] ?? "application/octet-stream";
  const meta = SEED[name] ?? { category: "other", sort: 99, title: name.replace(/\.[^.]+$/, "").replace(/_/g, " "), description: "" };
  const buf  = readFileSync(join(folder, name));
  // ascii object path (storage keys dislike unicode); original name stays on the row
  const key  = `${space}/${Date.now().toString(36)}-${n}${ext}`;

  const { error: upErr } = await admin.storage.from("library").upload(key, buf, { contentType: mime, upsert: false });
  if (upErr) { console.error(`upload failed for ${name}: ${upErr.message}`); continue; }

  const { error } = await admin.from("library_items").insert({
    space, category: meta.category, title: meta.title, description: meta.description,
    file_path: key, file_name: name, mime, size_bytes: buf.length, sort: meta.sort,
  });
  if (error) { console.error(`row failed for ${name}: ${error.message}`); continue; }
  console.log(`seeded ${meta.title}`);
  n++;
}
console.log(`${n} of ${files.length} files seeded into ${space}`);
