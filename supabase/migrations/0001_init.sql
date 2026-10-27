-- 0001_init: battalions, events, logs, row-level security, realtime.
-- One Supabase auth user = one battalion. Admins carry app_metadata.role = 'admin'
-- on their auth user and have no battalions row.

create extension if not exists pgcrypto;

-- ───────────────────────── tables ─────────────────────────

create table if not exists public.battalions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  username    text not null unique check (username ~ '^[a-z0-9_]{3,32}$'),
  name        text not null,
  logo_url    text,
  settings    jsonb not null default '{}'::jsonb,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.events (
  id                  uuid primary key default gen_random_uuid(),
  battalion_id        uuid not null references public.battalions (id) on delete cascade,
  address             text not null,
  crisis_type         text,
  infrastructure_type text,
  plugah              text,
  tzapi               integer,
  anchor              integer,
  lekudim_gluyim      integer,
  lekudim_smuim       integer,
  hulitzu             integer,
  meautarim           integer,
  punu                integer,
  hearot              text not null default '',
  status              text not null default 'active' check (status in ('active', 'closed')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists events_battalion_idx
  on public.events (battalion_id, status, created_at desc);

create table if not exists public.logs (
  id            uuid primary key default gen_random_uuid(),
  battalion_id  uuid not null references public.battalions (id) on delete cascade,
  event_id      uuid references public.events (id) on delete set null,
  event_address text not null,
  action        text not null,
  plugah        text,
  detail        text,
  created_at    timestamptz not null default now()
);

create index if not exists logs_battalion_idx
  on public.logs (battalion_id, created_at desc);

-- ───────────────────────── helpers ─────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists battalions_updated_at on public.battalions;
create trigger battalions_updated_at before update on public.battalions
  for each row execute function public.set_updated_at();

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- true when the calling JWT carries app_metadata.role = 'admin'
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- the active battalion row that belongs to the calling user, or null
create or replace function public.current_battalion_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.battalions where user_id = auth.uid() and active
$$;

-- ───────────────────────── row-level security ─────────────────────────

alter table public.battalions enable row level security;
alter table public.events     enable row level security;
alter table public.logs       enable row level security;

-- battalions: a battalion sees and edits only its own row; admins see all.
-- Username, active and user_id are admin-only columns (column grants below).
drop policy if exists battalions_select on public.battalions;
create policy battalions_select on public.battalions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists battalions_update on public.battalions;
create policy battalions_update on public.battalions
  for update to authenticated
  using (user_id = auth.uid() and active)
  with check (user_id = auth.uid() and active);

revoke update on public.battalions from authenticated;
grant  update (name, logo_url, settings) on public.battalions to authenticated;

-- events and logs: everything scoped to the caller's battalion.
drop policy if exists events_all on public.events;
create policy events_all on public.events
  for all to authenticated
  using (battalion_id = public.current_battalion_id() or public.is_admin())
  with check (battalion_id = public.current_battalion_id());

drop policy if exists logs_all on public.logs;
create policy logs_all on public.logs
  for all to authenticated
  using (battalion_id = public.current_battalion_id() or public.is_admin())
  with check (battalion_id = public.current_battalion_id());

-- ───────────────────────── realtime ─────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'logs'
  ) then
    alter publication supabase_realtime add table public.logs;
  end if;
end $$;
