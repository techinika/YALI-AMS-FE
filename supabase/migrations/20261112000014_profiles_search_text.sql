-- Keep `profiles.search_text` in sync.
--
-- The column powers the directory search (GIN trigram index in
-- 20261112000010_indexes.sql) and interest matching. The MySQL import filled it
-- once, but new and edited profiles left it null, so search silently returned
-- nothing. This trigger rebuilds it from the profile's own fields plus the
-- referenced reference-data names.

create or replace function public.profiles_build_search_text()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  new.search_text := concat_ws(
    ' ',
    nullif(btrim(coalesce(new.first_name, '')), ''),
    nullif(btrim(coalesce(new.middle_name, '')), ''),
    nullif(btrim(coalesce(new.last_name, '')), ''),
    nullif(btrim(coalesce(new.bio, '')), ''),
    nullif(btrim(coalesce(new.nearest_landmark, '')), ''),
    (select t.name from public.tracks t where t.id = new.track_id),
    (select c.name from public.cohorts c where c.id = new.cohort_id),
    (select d.name from public.districts d where d.id = new.district_id),
    (select s.name from public.sectors s where s.id = new.sector_id)
  );
  return new;
end;
$$;

drop trigger if exists profiles_search_text on public.profiles;
create trigger profiles_search_text
before insert or update on public.profiles
for each row execute function public.profiles_build_search_text();

-- Backfill rows that were created or edited before the trigger existed.
update public.profiles p
set search_text = concat_ws(
  ' ',
  nullif(btrim(coalesce(p.first_name, '')), ''),
  nullif(btrim(coalesce(p.middle_name, '')), ''),
  nullif(btrim(coalesce(p.last_name, '')), ''),
  nullif(btrim(coalesce(p.bio, '')), ''),
  nullif(btrim(coalesce(p.nearest_landmark, '')), ''),
  (select t.name from public.tracks t where t.id = p.track_id),
  (select c.name from public.cohorts c where c.id = p.cohort_id),
  (select d.name from public.districts d where d.id = p.district_id),
  (select s.name from public.sectors s where s.id = p.sector_id)
)
where p.search_text is null;