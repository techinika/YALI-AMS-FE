-- Helper functions and triggers.
-- SECURITY DEFINER helpers are used by RLS policies and RPCs; they are not
-- callable by clients except where explicitly granted.

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_genders
before update on public.genders
for each row execute function public.set_updated_at();

create trigger set_updated_at_cohorts
before update on public.cohorts
for each row execute function public.set_updated_at();

create trigger set_updated_at_tracks
before update on public.tracks
for each row execute function public.set_updated_at();

create trigger set_updated_at_working_sectors
before update on public.working_sectors
for each row execute function public.set_updated_at();

create trigger set_updated_at_countries
before update on public.countries
for each row execute function public.set_updated_at();

create trigger set_updated_at_states
before update on public.states
for each row execute function public.set_updated_at();

create trigger set_updated_at_districts
before update on public.districts
for each row execute function public.set_updated_at();

create trigger set_updated_at_sectors
before update on public.sectors
for each row execute function public.set_updated_at();

create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at_organizations
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_organizations
before update on public.user_organizations
for each row execute function public.set_updated_at();

create trigger set_updated_at_conversations
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger set_updated_at_conversation_members
before update on public.conversation_members
for each row execute function public.set_updated_at();

create trigger set_updated_at_notification_templates
before update on public.notification_templates
for each row execute function public.set_updated_at();

create trigger set_updated_at_matchmaking_requests
before update on public.matchmaking_requests
for each row execute function public.set_updated_at();

create trigger set_updated_at_import_jobs
before update on public.import_jobs
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- auth.users -> profiles
-- ---------------------------------------------------------------------------
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
    coalesce(
      nullif(lower(new.raw_user_meta_data ->> 'role'), '')::public.app_role,
      'user'::public.app_role
    ),
    case
      when new.email_confirmed_at is not null then 'active'::public.profile_status
      else 'invited'::public.profile_status
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Sync email / confirmation status without touching `updated_at` on every login.
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
  return new;
end;
$$;

create trigger on_auth_user_updated
after update on auth.users
for each row execute function public.handle_user_updated();

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'::public.app_role
      and p.status <> 'deleted'::public.profile_status
  );
$$;

create or replace function public.is_conversation_member(conv uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = conv
      and m.user_id = auth.uid()
      and m.status = 'approved'::public.membership_status
  );
$$;

create or replace function public.is_conversation_admin(conv uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = conv
      and m.user_id = auth.uid()
      and m.role = 'admin'::public.conversation_member_role
      and m.status = 'approved'::public.membership_status
  );
$$;

-- Any membership row (including pending/rejected/left) or creator. Used to let
-- users see groups they have requested/invited to, so the UI can show the
-- pending state. Message reads still require an approved membership.
create or replace function public.is_conversation_subscribed(conv uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = conv
      and m.user_id = auth.uid()
  ) or exists (
    select 1
    from public.conversations c
    where c.id = conv
      and c.created_by = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Contact details (phone / WhatsApp are hidden unless visible or self/admin)
-- ---------------------------------------------------------------------------
create or replace function public.get_profile_contact(p_user_id uuid)
returns table (phone text, whatsapp text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    case
      when p.phone_visible or p.id = auth.uid() or public.is_admin() then p.phone
    end as phone,
    case
      when p.whatsapp_visible or p.id = auth.uid() or public.is_admin() then p.whatsapp
    end as whatsapp
  from public.profiles p
  where p.id = p_user_id
    and p.status <> 'deleted'::public.profile_status;
$$;

-- ---------------------------------------------------------------------------
-- Notifications / audit (called by definer RPCs and edge functions)
-- ---------------------------------------------------------------------------
create or replace function public.notify_user(
  p_receiver_id uuid,
  p_title text,
  p_message text,
  p_link text default null
)
returns public.notifications
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.notifications;
begin
  insert into public.notifications (receiver_id, title, message, link)
  values (p_receiver_id, p_title, p_message, p_link)
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.log_activity(
  p_model text,
  p_action text,
  p_record_id text default null,
  p_user_id uuid default auth.uid(),
  p_details jsonb default '{}'::jsonb
)
returns public.activity_logs
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.activity_logs;
begin
  insert into public.activity_logs (model, action, record_id, user_id, details)
  values (p_model, p_action, p_record_id, p_user_id, p_details)
  returning * into v_row;
  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Hourly profile-update reminder (replaces the node-cron job in index.ts).
-- A user is reminded when their profile has not been updated for 6 months and
-- they have not received this notification in the last 24 hours.
-- ---------------------------------------------------------------------------
create or replace function public.generate_profile_update_notifications()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_template public.notification_templates%rowtype;
  v_count integer := 0;
begin
  select * into v_template
  from public.notification_templates
  where usage = 'update';

  if not found then
    return 0;
  end if;

  with candidates as (
    select p.id, p.first_name
    from public.profiles p
    where p.status in ('active'::public.profile_status, 'inactive'::public.profile_status)
      and p.updated_at < now() - interval '6 months'
      and not exists (
        select 1
        from public.notifications n
        where n.receiver_id = p.id
          and n.title = 'UPDATE: You need to update your profile'
          and n.created_at > now() - interval '1 day'
      )
  ), inserted as (
    insert into public.notifications (receiver_id, title, message, link)
    select
      c.id,
      'UPDATE: You need to update your profile',
      replace(v_template.message, '[name]', c.first_name),
      v_template.link
    from candidates c
    returning 1
  )
  select count(*) into v_count from inserted;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants for helper functions
-- ---------------------------------------------------------------------------
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;
grant execute on function public.is_conversation_admin(uuid) to authenticated;
grant execute on function public.is_conversation_subscribed(uuid) to authenticated;
grant execute on function public.get_profile_contact(uuid) to authenticated;

revoke all on function public.notify_user(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.log_activity(text, text, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.generate_profile_update_notifications() from public, anon, authenticated;