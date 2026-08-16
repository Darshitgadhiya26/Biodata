-- ============================================================================
-- 004_create_storage_policies.sql
-- Storage bucket for profile photos + its access policies.
--
-- Bucket: biodata-assets
--   * public read  → the <img> on the public page needs no signed URL
--   * writes restricted to authenticated (admin) users
--   * MIME allow-list and size cap enforced by storage itself, not just the UI
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Bucket (idempotent)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'biodata-assets',
  'biodata-assets',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Policies on storage.objects, scoped to this bucket only.
-- Dropped first so the migration can be re-run safely.
-- ---------------------------------------------------------------------------
drop policy if exists "biodata_assets_public_read"    on storage.objects;
drop policy if exists "biodata_assets_admin_insert"   on storage.objects;
drop policy if exists "biodata_assets_admin_update"   on storage.objects;
drop policy if exists "biodata_assets_admin_delete"   on storage.objects;

-- Anyone (including anonymous visitors) may read objects in this bucket.
create policy "biodata_assets_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'biodata-assets');

-- Only signed-in admins may upload.
create policy "biodata_assets_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'biodata-assets');

-- Only signed-in admins may overwrite/move.
create policy "biodata_assets_admin_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'biodata-assets')
  with check (bucket_id = 'biodata-assets');

-- Only signed-in admins may delete (used when replacing a photo).
create policy "biodata_assets_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'biodata-assets');
