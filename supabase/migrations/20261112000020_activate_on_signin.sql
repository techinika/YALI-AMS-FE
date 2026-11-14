-- Activate invited accounts on first sign-in.
--
-- `handle_new_user` marks admin-created accounts as `invited`. Legacy AMS only
-- allowed ACTIVE members to sign in and directory visibility (profiles_read)
-- only exposes `active` profiles, so without this an invited member stayed
-- invisible forever. The auth trigger already sees `last_sign_in_at`, so flip
-- the profile to active the first time the user authenticates (including via a
-- password-recovery link).

create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.email is distinct from old.email
     or new.email_confirmed_at is distinct from old.email_confirmed_at then
    update public.profiles
    set email = new.email,
        status = case
          when new.email_confirmed_at is not null
               and public.profiles.status = 'invited'::public.profile_status
            then 'active'::public.profile_status
          else public.profiles.status
        end
    where public.profiles.id = new.id;
  end if;

  if new.last_sign_in_at is distinct from old.last_sign_in_at
     and new.last_sign_in_at is not null then
    update public.profiles
    set status = 'active'::public.profile_status
    where id = new.id
      and status = 'invited'::public.profile_status;
  end if;

  return new;
end;
$$;