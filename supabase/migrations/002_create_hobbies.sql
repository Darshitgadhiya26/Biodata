-- ============================================================================
-- 002_create_hobbies.sql
-- Hobbies & interests, ordered and owned by a biodata row.
-- ============================================================================

create table if not exists public.hobbies (
  id uuid primary key default gen_random_uuid(),
  biodata_id uuid not null references public.biodata (id) on delete cascade,
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint hobbies_name_not_blank check (length(btrim(name)) > 0),
  constraint hobbies_name_length check (length(name) <= 80)
);

comment on table public.hobbies is 'Hobbies & interests shown on the public biodata, ordered by display_order.';

-- The public page always reads "hobbies of this biodata, in order".
create index if not exists hobbies_biodata_id_order_idx
  on public.hobbies (biodata_id, display_order, created_at);

-- The same hobby should not be listed twice on one profile.
create unique index if not exists hobbies_biodata_id_name_key
  on public.hobbies (biodata_id, lower(btrim(name)));

alter table public.hobbies enable row level security;
