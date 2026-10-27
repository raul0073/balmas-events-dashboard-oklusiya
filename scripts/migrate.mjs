// Applies supabase/migrations/*.sql in order, tracking them in public.schema_migrations.
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_PASSWORD (the database password) in .env.local.
// Optional: SUPABASE_DB_URL to override the connection string entirely.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { need, projectRef } from "./env.mjs";

const DIR = "supabase/migrations";

function candidates() {
  if (process.env.SUPABASE_DB_URL) return [process.env.SUPABASE_DB_URL];
  const ref = projectRef();
  const pw  = encodeURIComponent(need("SUPABASE_PASSWORD"));
  const regions = ["eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "eu-north-1", "us-east-1", "ap-southeast-1"];
  const list = [`postgresql://postgres:${pw}@db.${ref}.supabase.co:5432/postgres`];
  for (const r of regions) {
    for (const n of [0, 1]) {
      list.push(`postgresql://postgres.${ref}:${pw}@aws-${n}-${r}.pooler.supabase.com:5432/postgres`);
    }
  }
  return list;
}

async function connect() {
  let lastErr;
  for (const url of candidates()) {
    const sql = postgres(url, { ssl: "require", max: 1, connect_timeout: 8, prepare: false, onnotice: () => {} });
    try {
      await sql`select 1`;
      console.log(`connected via ${url.replace(/:[^:@]+@/, ":***@")}`);
      return sql;
    } catch (e) {
      lastErr = e;
      await sql.end({ timeout: 1 }).catch(() => {});
    }
  }
  throw lastErr;
}

const sql = await connect();
try {
  await sql`create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const applied = new Set((await sql`select name from public.schema_migrations`).map((r) => r.name));
  const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) { console.log(`skip    ${file}`); continue; }
    const body = readFileSync(join(DIR, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into public.schema_migrations (name) values (${file})`;
    });
    console.log(`applied ${file}`);
  }
} finally {
  await sql.end();
}
