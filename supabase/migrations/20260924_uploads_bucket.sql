-- ============================================================================
-- Storage: `uploads` bucket for pet photos (and other user uploads).
--
-- The app adapter (api/base44Client.js, Core.UploadFile) uploads to:
--     uploads/{auth.uid()}/{timestamp}-{filename}
-- and reads via getPublicUrl(), so the bucket must be PUBLIC (readable by URL).
--
-- Write/update/delete are scoped to each user's own folder (first path segment
-- must equal their auth.uid()), so anonymous users can't touch each other's files.
-- Anonymous sign-in sessions carry role = authenticated, so these policies apply.
-- ============================================================================

-- 1. Public bucket (10 MB limit, images only — pet photos).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads', 'uploads', true, 10485760,
  array['image/png','image/jpeg','image/jpg','image/webp','image/gif','image/heic']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Object-level RLS policies.
drop policy if exists "uploads_insert_own" on storage.objects;
create policy "uploads_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "uploads_update_own" on storage.objects;
create policy "uploads_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "uploads_delete_own" on storage.objects;
create policy "uploads_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- Public read (bucket is public; explicit policy keeps intent clear).
drop policy if exists "uploads_read_public" on storage.objects;
create policy "uploads_read_public" on storage.objects
  for select to public
  using (bucket_id = 'uploads');
