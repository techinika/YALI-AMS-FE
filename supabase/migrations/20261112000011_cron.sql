-- Schedule the hourly profile-update reminder with pg_cron.
-- Kept tolerant so `supabase db reset` still works on local stacks where the
-- extension is unavailable; hosted Supabase has pg_cron.

do $do$
begin
  create extension if not exists pg_cron;
exception when others then
  raise notice 'pg_cron is not available: %', sqlerrm;
end $do$;

do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (
      select 1 from cron.job
      where jobname = 'generate-profile-update-notifications'
    ) then
      perform cron.unschedule('generate-profile-update-notifications');
    end if;

    perform cron.schedule(
      'generate-profile-update-notifications',
      '0 * * * *',
      $cron$select public.generate_profile_update_notifications()$cron$
    );
  end if;
exception when others then
  raise notice 'could not schedule profile-update reminder: %', sqlerrm;
end $do$;