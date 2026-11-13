-- Account self-service and the notification templates the cron job needs.

-- `generate_profile_update_notifications()` reads the `update` template; the
-- initial seed only shipped signup/login/confirm/decline, so reminders never
-- ran. Insert any missing templates without touching existing edits.
insert into public.notification_templates (usage, message, link, updated_by)
values
  ('update', 'Hi [name], it has been a while since you updated your profile. Please review your details and keep them current.', null, null),
  ('confirm', 'Hi [name], please confirm the changes to your profile.', null, null),
  ('decline', 'Hi [name], the requested profile changes were not applied. Please contact the administrator.', null, null),
  ('updated', 'Hi [name], your profile has been updated successfully.', null, null)
on conflict (usage) do nothing;

-- Self-service account deletion (soft delete, keeps audit history).
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  update public.profiles
  set status = 'deleted'::public.profile_status
  where id = v_me;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;