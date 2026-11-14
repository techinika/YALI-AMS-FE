-- Profiles are keyed to auth.users.id. All profile fields live here; password
-- and tokens stay in auth.users. Phone/WhatsApp are stored but hidden from the
-- directory unless the owner opts in (see `get_profile_contact` in 0008).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  middle_name text,
  last_name text not null,
  email citext not null unique,
  phone text,
  whatsapp text,
  bio text,
  linkedin text,
  instagram text,
  facebook text,
  twitter text,
  gender_id int references public.genders (id) on delete set null,
  is_rwandan boolean,
  country_id text references public.countries (id) on delete set null,
  state_id text references public.states (id) on delete set null,
  district_id text references public.districts (id) on delete set null,
  sector_id text references public.sectors (id) on delete set null,
  nearest_landmark text,
  cohort_id int references public.cohorts (id) on delete set null,
  track_id text references public.tracks (id) on delete set null,
  avatar_path text,
  role public.app_role not null default 'user',
  status public.profile_status not null default 'invited',
  phone_visible boolean not null default false,
  whatsapp_visible boolean not null default false,
  search_text text,
  embedding vector(768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.embedding is
  'Gemini embedding (text-embedding-004, 768 dims) used for AI matching.';
comment on column public.profiles.search_text is
  'Denormalised text used for keyword search and embedding generation.';

create index profiles_status_idx on public.profiles (status);
create index profiles_role_idx on public.profiles (role);
create index profiles_cohort_id_idx on public.profiles (cohort_id);
create index profiles_track_id_idx on public.profiles (track_id);
create index profiles_district_id_idx on public.profiles (district_id);
create index profiles_country_id_idx on public.profiles (country_id);
create index profiles_created_at_idx on public.profiles (created_at desc);