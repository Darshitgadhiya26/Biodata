-- ============================================================================
-- 003_create_maternal_relatives.sql
-- Maternal (mosal) relatives, ordered and owned by a biodata row.
-- ============================================================================

create table if not exists public.maternal_relatives (
  id uuid primary key default gen_random_uuid(),
  biodata_id uuid not null references public.biodata (id) on delete cascade,
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint maternal_relatives_name_not_blank check (length(btrim(name)) > 0),
  constraint maternal_relatives_name_length check (length(name) <= 120)
);

comment on table public.maternal_relatives is
  'Maternal-side relatives shown on the public biodata, ordered by display_order.';

create index if not exists maternal_relatives_biodata_id_order_idx
  on public.maternal_relatives (biodata_id, display_order, created_at);

create unique index if not exists maternal_relatives_biodata_id_name_key
  on public.maternal_relatives (biodata_id, lower(btrim(name)));

alter table public.maternal_relatives enable row level security;
