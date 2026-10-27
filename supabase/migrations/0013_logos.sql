-- Battalion logos: a public bucket, written by the server (service role) only.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = true;

drop policy if exists logos_public_read on storage.objects;
create policy logos_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'logos');
