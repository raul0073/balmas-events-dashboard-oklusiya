-- Knowledge library: downloadable aids per color space. Files live in the "library" storage bucket.

create table if not exists public.library_items (
  id          uuid primary key default gen_random_uuid(),
  space       text not null check (space in ('orange', 'green')),
  category    text not null check (category in ('forms', 'guides', 'other')),
  title       text not null,
  description text not null default '',
  file_path   text not null,          -- object path inside the "library" bucket
  file_name   text not null,          -- original name, used for download
  mime        text not null,
  size_bytes  integer not null default 0,
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists library_items_space_idx on public.library_items (space, category, sort);

alter table public.library_items enable row level security;

drop policy if exists library_items_read on public.library_items;
create policy library_items_read on public.library_items
  for select to anon, authenticated using (true);
-- writes: service role only (admin panel)

drop trigger if exists library_items_updated_at on public.library_items;
create trigger library_items_updated_at before update on public.library_items
  for each row execute function public.set_updated_at();

-- public bucket for the files themselves
insert into storage.buckets (id, name, public)
values ('library', 'library', true)
on conflict (id) do update set public = true;

drop policy if exists library_public_read on storage.objects;
create policy library_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'library');
-- uploads/deletes: service role only (admin panel)
