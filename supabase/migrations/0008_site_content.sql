-- Editable site content (the checklist today, more later). One row per key.
-- Everyone can read; only the service role (admin panel) writes.

create table if not exists public.site_content (
  key        text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists site_content_read on public.site_content;
create policy site_content_read on public.site_content
  for select to anon, authenticated using (true);

insert into public.site_content (key, data) values ('checklist', $json$
{
  "title": "סד\"פ למש\"ק אוכלוסייה",
  "subtitle": "בחפ\"ק אלפא",
  "intro": "גיבוש תמונת מצב ראשונית של האירוע",
  "sections": [
    { "id": "s1", "label": "קבלת מידע בדרך לאירוע", "items": [
      { "id": "s1i1", "text": "צור/י קשר עם הק\"א / חוליית אוכלוסיה גדודית וברר/י פרטים מדויקים אודות כתובת היעד והערכת המצב הראשונית." }
    ]},
    { "id": "s2", "label": "פעולות לגיבוש תמונת מצב ראשונית", "items": [
      { "id": "s2i1", "text": "בדוק/י מול נציגי כב\"ה, מד\"א והמשטרה את מספר האזרחים שפונו מהזירה טרם הגעתך." },
      { "id": "s2i2", "text": "פעל/י להערכת מספר הלכודים המשוער באמצעות סריקת תיבות דואר, רכבים חונים בסמיכות וסימנים נוספים המעידים על נוכחות אזרחים." },
      { "id": "s2i3", "text": "אתר/י את נציג הרשות הרלוונטי: מנהל רובע, יו\"ר צח\"י, רכז ביטחון או ועד הבית." },
      { "id": "s2i4", "text": "בקש/י מנציג הרשות את מצבת האוכלוסייה (מצ\"א) המעודכנת של אתר ההרס." },
      { "id": "s2i5", "text": "בקש/י להתחבר לקבוצת וואטסאפ הקשורה לאתר" }
    ]},
    { "id": "s3", "label": "תשאול בשטח (עוברי אורח, שכנים ומפונים)", "items": [
      { "id": "s3i1", "text": "בצע/י תשאול להרחבת תמונת המצב של האוכלוסייה בזירת האירוע." },
      { "id": "s3i2", "text": "רכז/י מידע מפורט ככל הניתן על נעדרים או לכודים פוטנציאליים." }
    ]},
    { "id": "s4", "label": "מיפוי ותרשים זירת ההרס", "items": [
      { "id": "s4i1", "text": "פעל/י בשיתוף מהנדס או נציג הרשות ליצירת תרשים מדויק של זירת ההרס וסביבתה הקרובה." }
    ]}
  ]
}
$json$::jsonb)
on conflict (key) do nothing;
