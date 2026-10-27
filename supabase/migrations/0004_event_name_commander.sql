-- An event can be opened by name or by address, and carries the battalion-level person in charge.
alter table public.events
  add column if not exists name      text not null default '',
  add column if not exists commander text not null default '';
