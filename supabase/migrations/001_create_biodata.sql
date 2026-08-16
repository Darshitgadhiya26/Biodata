-- ============================================================================
-- 001_create_biodata.sql
-- Core biodata table + shared helpers (updated_at trigger).
-- Safe to re-run: every statement is guarded.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared trigger function: keeps updated_at honest even if a client forgets it.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger helper that stamps updated_at = now() on every UPDATE.';

-- ---------------------------------------------------------------------------
-- biodata
-- Holds the single published marriage biodata profile. Modelled as a table
-- (not a key/value store) so columns stay typed and queryable.
-- ---------------------------------------------------------------------------
create table if not exists public.biodata (
  id uuid primary key default gen_random_uuid(),

  -- Personal
  name              text not null,
  date_of_birth     date,
  caste             text,
  height            text,
  weight            text,
  blood_group       text,

  -- Family
  father_name       text,
  father_occupation text,
  mother_name       text,

  -- Maternal (individual relatives live in public.maternal_relatives)
  maternal_address  text,

  -- Education
  degree            text,
  college           text,

  -- Career
  job_title         text,
  company           text,
  work_location     text,

  -- Contact
  phone             text,
  address           text,

  -- Media
  profile_photo_url  text,
  profile_photo_path text,

  -- Publication flag: only published rows are visible to anonymous visitors.
  is_published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint biodata_name_not_blank check (length(btrim(name)) > 0),
  constraint biodata_phone_length check (phone is null or length(btrim(phone)) between 6 and 20)
);

comment on table public.biodata is 'Marriage biodata profile. Public read (published only), admin write.';
comment on column public.biodata.profile_photo_path is
  'Object path inside the biodata-assets storage bucket, used to delete the previous photo on replace.';

-- Anonymous visitors filter on is_published; keep that path indexed.
create index if not exists biodata_is_published_idx on public.biodata (is_published);
create index if not exists biodata_updated_at_idx on public.biodata (updated_at desc);

drop trigger if exists biodata_set_updated_at on public.biodata;
create trigger biodata_set_updated_at
  before update on public.biodata
  for each row
  execute function public.set_updated_at();

-- RLS is enabled here so the table is never readable/writable between
-- migrations. The policies themselves are created in 005_create_rls_policies.sql;
-- until then Postgres denies everything by default.
alter table public.biodata enable row level security;
