-- Feedback and feature requests, sent from the sidebar by anyone (signed in or not).
-- Only the service role (admin panel) reads them; inserts go through a server action.

create table if not exists public.feedback (
  id           uuid primary key default gen_random_uuid(),
  battalion_id uuid references public.battalions (id) on delete set null,
  username     text,
  kind         text not null check (kind in ('feature', 'bug', 'question', 'other')),
  subject      text not null,
  message      text not null,
  contact      text,
  page         text,
  status       text not null default 'new' check (status in ('new', 'seen', 'done')),
  created_at   timestamptz not null default now()
);

create index if not exists feedback_status_idx on public.feedback (status, created_at desc);

alter table public.feedback enable row level security;
-- no policies: anon/authenticated cannot read or write directly; the server inserts with the service role
