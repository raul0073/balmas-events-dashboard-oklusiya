-- The shifts organizer's whole working set (people, groups, rotation, config, rules, schedule)
-- as one document per battalion, so it carries over between sessions and screens.

create table if not exists public.shifts_state (
  battalion_id uuid primary key references public.battalions (id) on delete cascade,
  data         jsonb not null default '{}'::jsonb,
  client_id    text,
  updated_at   timestamptz not null default now()
);

alter table public.shifts_state enable row level security;

drop policy if exists shifts_state_all on public.shifts_state;
create policy shifts_state_all on public.shifts_state
  for all to authenticated
  using (battalion_id = public.current_battalion_id() or public.is_admin())
  with check (battalion_id = public.current_battalion_id());

alter table public.shifts_state replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shifts_state'
  ) then
    alter publication supabase_realtime add table public.shifts_state;
  end if;
end $$;
