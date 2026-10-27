-- Realtime DELETE events only carry the primary key unless the table has full replica identity,
-- which also lets the battalion_id filter apply to deletes.
alter table public.events replica identity full;
alter table public.logs   replica identity full;
