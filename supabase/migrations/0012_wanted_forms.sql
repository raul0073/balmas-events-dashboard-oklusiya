-- Forms the admin is looking for, and offers from people who have them. No user uploads.

create table if not exists public.wanted_items (
  id          uuid primary key default gen_random_uuid(),
  space       text not null check (space in ('orange', 'green')),
  title       text not null,
  description text not null default '',
  status      text not null default 'open' check (status in ('open', 'received')),
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.wanted_offers (
  id           uuid primary key default gen_random_uuid(),
  wanted_id    uuid not null references public.wanted_items (id) on delete cascade,
  battalion_id uuid references public.battalions (id) on delete set null,
  username     text,
  contact      text,
  note         text,
  status       text not null default 'new' check (status in ('new', 'handled')),
  created_at   timestamptz not null default now()
);

create index if not exists wanted_offers_wanted_idx on public.wanted_offers (wanted_id, created_at desc);

alter table public.wanted_items  enable row level security;
alter table public.wanted_offers enable row level security;

-- everyone may read the open wish list; offers are written through a server action and read by the admin only
drop policy if exists wanted_items_read on public.wanted_items;
create policy wanted_items_read on public.wanted_items
  for select to anon, authenticated using (true);
