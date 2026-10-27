-- Who reported an update, through which channel, and why the data changed.
alter table public.logs
  add column if not exists reported_by text,
  add column if not exists channel     text,
  add column if not exists reason      text;
