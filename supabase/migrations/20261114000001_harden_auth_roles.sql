-- Harden auth and contact-detail access.
--
-- 1. `handle_new_user` used to read `role` from `raw_user_meta_data`, which is
--    fully client-controlled. With public signups enabled anyone could POST a
--    signup with `data: { role: 'admin' }` and the trigger would create an
--    admin profile. Roles are now always created as `user`; the only ways to
--    promote someone are the service-role Edge Function or direct SQL.
-- 2. `get_profile_contact` was reachable by `anon` through its default PUBLIC
--    execute grant. Phone/WhatsApp must only be returned to signed-in users.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.profiles (
    id,
    first_name,
    middle_name,
    last_name,
    email,
    role,
    status
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'first_name', ''), ''),
    nullif(new.raw_user_meta_data ->> 'middle_name', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'last_name', ''), ''),
    new.email,
    'user'::public.app_role,
    case
      when new.email_confirmed_at is not null then 'active'::public.profile_status
      else 'invited'::public.profile_status
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.get_profile_contact(uuid) from public, anon;
grant execute on function public.get_profile_contact(uuid) to authenticated;
