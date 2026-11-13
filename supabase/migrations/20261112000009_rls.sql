-- Row Level Security: default deny, explicit policies per table.
-- Policy summary is documented in `docs/rls.md`.

-- ---------------------------------------------------------------------------
-- Reference / lookup tables: readable by any authenticated user, writable by admins.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'genders', 'cohorts', 'tracks', 'working_sectors',
    'countries', 'states', 'districts', 'sectors'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists reference_read on public.%I;', t);
    execute format('drop policy if exists reference_write on public.%I;', t);
    execute format(
      'create policy reference_read on public.%I for select to authenticated using (true);', t
    );
    execute format(
      'create policy reference_write on public.%I for all to authenticated
       using (public.is_admin()) with check (public.is_admin());', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;

create policy profiles_read on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or status = 'active'::public.profile_status
  or public.is_admin()
);

create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy profiles_admin_all on public.profiles
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Column-level privileges: hide phone/WhatsApp from direct reads (see
-- `get_profile_contact`) and prevent role/status/embedding changes.
revoke all on public.profiles from anon, authenticated;

grant select (
  id, first_name, middle_name, last_name, email,
  bio, linkedin, instagram, facebook, twitter,
  gender_id, is_rwandan, country_id, state_id, district_id, sector_id,
  nearest_landmark, cohort_id, track_id, avatar_path,
  role, status, phone_visible, whatsapp_visible,
  search_text, created_at, updated_at
) on public.profiles to authenticated;

grant update (
  first_name, middle_name, last_name,
  phone, whatsapp, bio, linkedin, instagram, facebook, twitter,
  gender_id, is_rwandan, country_id, state_id, district_id, sector_id,
  nearest_landmark, cohort_id, track_id, avatar_path,
  phone_visible, whatsapp_visible
) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- organizations and links
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;

drop policy if exists organizations_read on public.organizations;
drop policy if exists organizations_insert on public.organizations;
drop policy if exists organizations_update on public.organizations;
drop policy if exists organizations_delete on public.organizations;

create policy organizations_read on public.organizations
for select to authenticated using (true);

create policy organizations_insert on public.organizations
for insert to authenticated
with check (added_by = auth.uid() or public.is_admin());

create policy organizations_update on public.organizations
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy organizations_delete on public.organizations
for delete to authenticated
using (public.is_admin());

alter table public.user_organizations enable row level security;

drop policy if exists user_organizations_all on public.user_organizations;

create policy user_organizations_all on public.user_organizations
for all to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

alter table public.organization_working_sectors enable row level security;

drop policy if exists organization_working_sectors_read on public.organization_working_sectors;
drop policy if exists organization_working_sectors_write on public.organization_working_sectors;

create policy organization_working_sectors_read on public.organization_working_sectors
for select to authenticated using (true);

create policy organization_working_sectors_write on public.organization_working_sectors
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.user_organization_working_sectors enable row level security;

drop policy if exists user_organization_working_sectors_read on public.user_organization_working_sectors;
drop policy if exists user_organization_working_sectors_write on public.user_organization_working_sectors;

create policy user_organization_working_sectors_read on public.user_organization_working_sectors
for select to authenticated using (true);

create policy user_organization_working_sectors_write on public.user_organization_working_sectors
for all to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- conversations / members / messages
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;

drop policy if exists conversations_read on public.conversations;
drop policy if exists conversations_update on public.conversations;
drop policy if exists conversations_delete on public.conversations;

create policy conversations_read on public.conversations
for select to authenticated
using (
  type = 'community'::public.conversation_type
  or public.is_conversation_subscribed(id)
  or public.is_admin()
);

create policy conversations_update on public.conversations
for update to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

create policy conversations_delete on public.conversations
for delete to authenticated
using (public.is_admin());

alter table public.conversation_members enable row level security;

drop policy if exists conversation_members_read on public.conversation_members;

create policy conversation_members_read on public.conversation_members
for select to authenticated
using (public.is_conversation_subscribed(conversation_id) or public.is_admin());

alter table public.messages enable row level security;

drop policy if exists messages_read on public.messages;
drop policy if exists messages_insert on public.messages;
drop policy if exists messages_delete on public.messages;

create policy messages_read on public.messages
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (
        c.type = 'community'::public.conversation_type
        or public.is_conversation_member(c.id)
      )
  )
);

create policy messages_insert on public.messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (
        c.type = 'community'::public.conversation_type
        or public.is_conversation_member(c.id)
      )
  )
);

create policy messages_delete on public.messages
for delete to authenticated
using (sender_id = auth.uid());

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists notifications_read on public.notifications;
drop policy if exists notifications_update on public.notifications;

create policy notifications_read on public.notifications
for select to authenticated
using (receiver_id = auth.uid());

create policy notifications_update on public.notifications
for update to authenticated
using (receiver_id = auth.uid())
with check (receiver_id = auth.uid());

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (opened) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- notification templates
-- ---------------------------------------------------------------------------
alter table public.notification_templates enable row level security;

drop policy if exists notification_templates_read on public.notification_templates;
drop policy if exists notification_templates_write on public.notification_templates;

create policy notification_templates_read on public.notification_templates
for select to authenticated using (true);

create policy notification_templates_write on public.notification_templates
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- matchmaking
-- ---------------------------------------------------------------------------
alter table public.matchmaking_requests enable row level security;

drop policy if exists matchmaking_requests_read on public.matchmaking_requests;

create policy matchmaking_requests_read on public.matchmaking_requests
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

alter table public.matchmaking_items enable row level security;

drop policy if exists matchmaking_items_read on public.matchmaking_items;

create policy matchmaking_items_read on public.matchmaking_items
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.matchmaking_requests r
    where r.id = matchmaking_items.request_id
      and r.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- activity log / import jobs
-- ---------------------------------------------------------------------------
alter table public.activity_logs enable row level security;

drop policy if exists activity_logs_read on public.activity_logs;

create policy activity_logs_read on public.activity_logs
for select to authenticated
using (public.is_admin());

alter table public.import_jobs enable row level security;

drop policy if exists import_jobs_read on public.import_jobs;
drop policy if exists import_jobs_write on public.import_jobs;

create policy import_jobs_read on public.import_jobs
for select to authenticated
using (requested_by = auth.uid() or public.is_admin());

create policy import_jobs_write on public.import_jobs
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
drop policy if exists "avatars owner upload" on storage.objects;
drop policy if exists "avatars owner update" on storage.objects;
drop policy if exists "avatars owner delete" on storage.objects;
drop policy if exists "exports admin manage" on storage.objects;

create policy "avatars public read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'avatars');

create policy "avatars owner upload" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars owner update" on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars owner delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "exports admin manage" on storage.objects
for all to authenticated
using (bucket_id = 'exports' and public.is_admin())
with check (bucket_id = 'exports' and public.is_admin());