-- Information sources already exhausted for an event (keys from lib/events/sources.ts).
alter table public.events
  add column if not exists sources_done text[] not null default '{}';
