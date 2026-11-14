-- Organizations and their links to profiles.
-- `organizations` is the shared directory entry; `user_organizations` is the
-- profile's claim (relation + position). Working sectors can be curated per
-- organization and/or per user-organization link.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_id text references public.countries (id) on delete set null,
  state_id text references public.states (id) on delete set null,
  district_id text references public.districts (id) on delete set null,
  sector_id text references public.sectors (id) on delete set null,
  website text,
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  relation text not null default 'founded',
  position text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

create table public.organization_working_sectors (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  working_sector_id text not null references public.working_sectors (id) on delete cascade,
  primary key (organization_id, working_sector_id)
);

create table public.user_organization_working_sectors (
  user_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  working_sector_id text not null references public.working_sectors (id) on delete cascade,
  primary key (user_id, organization_id, working_sector_id)
);

create index organizations_added_by_idx on public.organizations (added_by);
create index organizations_country_id_idx on public.organizations (country_id);
create index organizations_district_id_idx on public.organizations (district_id);
create index user_organizations_user_id_idx on public.user_organizations (user_id);
create index user_organizations_organization_id_idx on public.user_organizations (organization_id);
create index user_organization_working_sectors_user_id_idx
  on public.user_organization_working_sectors (user_id);