-- Library files are no longer publicly addressable: the app hands out short-lived signed links,
-- guides to everyone, forms and the rest to signed-in battalions only.
update storage.buckets set public = false where id = 'library';
drop policy if exists library_public_read on storage.objects;
