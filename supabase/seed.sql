-- ============================================================================
-- seed.sql
-- Initial biodata, taken verbatim from the source biodata PDF.
-- Nothing here is invented: fields absent from the PDF are left NULL.
--
-- Re-runnable: the profile uses a fixed UUID and every insert is guarded with
-- ON CONFLICT DO NOTHING, so running this twice will not duplicate rows.
-- ============================================================================

-- Fixed id so seeding, re-seeding and "Reset to default" all target one row.
insert into public.biodata (
  id,
  name,
  date_of_birth,
  caste,
  height,
  weight,
  blood_group,
  father_name,
  father_occupation,
  mother_name,
  maternal_address,
  degree,
  college,
  job_title,
  company,
  work_location,
  phone,
  address,
  profile_photo_url,
  is_published
)
values (
  '11111111-1111-4111-8111-111111111111',
  'Darshit Gadhiya',
  date '2001-11-26',                                    -- 26-11-2001
  'Leuva Patel',
  '5 feet 6 inches',
  '75 Kg',
  'B+',
  'Dilipbhai Manjibhai Gadhiya',
  'Agriculture (27 Vigha)',
  'Kanchanben',
  E'At. Bandharda\nTa. Gir Gadhada\nDist. Gir Somnath',
  'B.Tech in Computer',
  'Darshan University Rajkot',
  'Software Engineer',
  'Technomark Solutions',
  'Ahemedabad',
  '7069306559',
  E'Kanakiya\nTa. Gir Gadhada\nDist. Gir Somnath',
  -- Photo bundled with the app. As soon as an admin uploads a new one this is
  -- replaced with a Supabase Storage URL.
  '/profile-photo.jpg',
  true
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Maternal relatives (mosal)
-- ---------------------------------------------------------------------------
insert into public.maternal_relatives (biodata_id, name, display_order)
values
  ('11111111-1111-4111-8111-111111111111', 'Jaysukhbhai Nanubhai Borad', 0),
  ('11111111-1111-4111-8111-111111111111', 'Rasikbhai Nanubhai Borad', 1)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Hobbies & interests
-- ---------------------------------------------------------------------------
insert into public.hobbies (biodata_id, name, display_order)
values
  ('11111111-1111-4111-8111-111111111111', 'Movies', 0),
  ('11111111-1111-4111-8111-111111111111', 'Cricket', 1)
on conflict do nothing;
