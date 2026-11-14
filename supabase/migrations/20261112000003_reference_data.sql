-- Reference / lookup tables.
-- IDs are stable and human-readable where the legacy app already used strings
-- (tracks, working sectors, districts, sectors). Countries use ISO 3166-1 alpha-2.
-- `states` uses a generated text id; the migration script maps by name + country.

create table public.genders (
  id int primary key,
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cohorts (
  id int primary key,
  name text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tracks (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.working_sectors (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.countries (
  id text primary key,
  name text not null unique,
  c_id int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.states (
  id text primary key,
  name text not null,
  country_code text not null references public.countries (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, name)
);

create table public.districts (
  id text primary key,
  name text not null unique,
  province text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sectors (
  id text primary key,
  name text not null,
  district_id text not null references public.districts (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (district_id, name)
);

create index states_country_code_idx on public.states (country_code);
create index sectors_district_id_idx on public.sectors (district_id);