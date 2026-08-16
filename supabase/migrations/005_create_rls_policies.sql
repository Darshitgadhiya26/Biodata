-- ============================================================================
-- 005_create_rls_policies.sql
-- Row Level Security for biodata, hobbies and maternal_relatives.
--
-- Threat model
-- ------------
-- The browser ships with the anon key. Anyone can read it out of the bundle and
-- talk to PostgREST directly, so hiding buttons in React proves nothing. These
-- policies are the actual authorisation boundary:
--
--   anon          → SELECT only, and only rows belonging to a published profile
--   authenticated → full read/write (the pre-created admin account)
--
-- There is no public sign-up UI, so "authenticated" == the admin account(s) that
-- were created by hand in the Supabase dashboard.
-- ============================================================================

alter table public.biodata            enable row level security;
alter table public.hobbies            enable row level security;
alter table public.maternal_relatives enable row level security;

-- ---------------------------------------------------------------------------
-- biodata
-- ---------------------------------------------------------------------------
drop policy if exists "biodata_public_read"      on public.biodata;
drop policy if exists "biodata_admin_read"       on public.biodata;
drop policy if exists "biodata_admin_insert"     on public.biodata;
drop policy if exists "biodata_admin_update"     on public.biodata;
drop policy if exists "biodata_admin_delete"     on public.biodata;

-- Anonymous visitors: read published profiles only.
create policy "biodata_public_read"
  on public.biodata
  for select
  to anon
  using (is_published = true);

-- Admin: read everything, including unpublished drafts.
create policy "biodata_admin_read"
  on public.biodata
  for select
  to authenticated
  using (true);

create policy "biodata_admin_insert"
  on public.biodata
  for insert
  to authenticated
  with check (true);

create policy "biodata_admin_update"
  on public.biodata
  for update
  to authenticated
  using (true)
  with check (true);

create policy "biodata_admin_delete"
  on public.biodata
  for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- hobbies
-- Child rows inherit visibility from their parent profile.
-- ---------------------------------------------------------------------------
drop policy if exists "hobbies_public_read"  on public.hobbies;
drop policy if exists "hobbies_admin_read"   on public.hobbies;
drop policy if exists "hobbies_admin_insert" on public.hobbies;
drop policy if exists "hobbies_admin_update" on public.hobbies;
drop policy if exists "hobbies_admin_delete" on public.hobbies;

create policy "hobbies_public_read"
  on public.hobbies
  for select
  to anon
  using (
    exists (
      select 1
      from public.biodata b
      where b.id = hobbies.biodata_id
        and b.is_published = true
    )
  );

create policy "hobbies_admin_read"
  on public.hobbies
  for select
  to authenticated
  using (true);

create policy "hobbies_admin_insert"
  on public.hobbies
  for insert
  to authenticated
  with check (true);

create policy "hobbies_admin_update"
  on public.hobbies
  for update
  to authenticated
  using (true)
  with check (true);

create policy "hobbies_admin_delete"
  on public.hobbies
  for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- maternal_relatives
-- ---------------------------------------------------------------------------
drop policy if exists "maternal_public_read"  on public.maternal_relatives;
drop policy if exists "maternal_admin_read"   on public.maternal_relatives;
drop policy if exists "maternal_admin_insert" on public.maternal_relatives;
drop policy if exists "maternal_admin_update" on public.maternal_relatives;
drop policy if exists "maternal_admin_delete" on public.maternal_relatives;

create policy "maternal_public_read"
  on public.maternal_relatives
  for select
  to anon
  using (
    exists (
      select 1
      from public.biodata b
      where b.id = maternal_relatives.biodata_id
        and b.is_published = true
    )
  );

create policy "maternal_admin_read"
  on public.maternal_relatives
  for select
  to authenticated
  using (true);

create policy "maternal_admin_insert"
  on public.maternal_relatives
  for insert
  to authenticated
  with check (true);

create policy "maternal_admin_update"
  on public.maternal_relatives
  for update
  to authenticated
  using (true)
  with check (true);

create policy "maternal_admin_delete"
  on public.maternal_relatives
  for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Realtime
-- Lets the public page live-update when the admin saves, without a redeploy.
-- Realtime still evaluates the RLS policies above per subscriber.
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.biodata;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.hobbies;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.maternal_relatives;
exception
  when duplicate_object then null;
end
$$;
