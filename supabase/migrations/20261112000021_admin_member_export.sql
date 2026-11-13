-- Admin-only member export.
--
-- The old backend's `POST /users/export/all` included phone/WhatsApp, bio and
-- organization links. `profiles` deliberately hides phone/WhatsApp behind
-- `get_profile_contact`, so a bulk export needs a definer function that checks
-- `is_admin()` and returns the contact fields explicitly.

create or replace function public.admin_export_members()
returns table (
  id uuid,
  first_name text,
  middle_name text,
  last_name text,
  email citext,
  phone text,
  whatsapp text,
  bio text,
  gender_name text,
  country_name text,
  state_name text,
  district_name text,
  sector_name text,
  cohort_name text,
  track_name text,
  nearest_landmark text,
  organization_names text,
  organization_relations text,
  organization_positions text,
  status public.profile_status,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.first_name,
    p.middle_name,
    p.last_name,
    p.email,
    p.phone,
    p.whatsapp,
    p.bio,
    g.name,
    c.name,
    s.name,
    d.name,
    sec.name,
    co.name,
    t.name,
    p.nearest_landmark,
    coalesce((
      select string_agg(o.name, '; ' order by o.name)
      from public.user_organizations uo
      join public.organizations o on o.id = uo.organization_id
      where uo.user_id = p.id
    ), ''),
    coalesce((
      select string_agg(uo.relation, '; ' order by o.name)
      from public.user_organizations uo
      join public.organizations o on o.id = uo.organization_id
      where uo.user_id = p.id
    ), ''),
    coalesce((
      select string_agg(coalesce(uo.position, ''), '; ' order by o.name)
      from public.user_organizations uo
      join public.organizations o on o.id = uo.organization_id
      where uo.user_id = p.id
    ), ''),
    p.status,
    p.created_at,
    p.updated_at
  from public.profiles p
  left join public.genders g on g.id = p.gender_id
  left join public.countries c on c.id = p.country_id
  left join public.states s on s.id = p.state_id
  left join public.districts d on d.id = p.district_id
  left join public.sectors sec on sec.id = p.sector_id
  left join public.cohorts co on co.id = p.cohort_id
  left join public.tracks t on t.id = p.track_id
  where p.status <> 'deleted'::public.profile_status
  order by p.created_at;
end;
$$;

revoke all on function public.admin_export_members() from public, anon;
grant execute on function public.admin_export_members() to authenticated;