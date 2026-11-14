-- Chat RPCs and Realtime wiring.
--
-- The unified conversation model needs a few privileged operations that cannot
-- be expressed with the table RLS policies alone:
--   * find-or-create the 1:1 conversation between two members
--   * create a group and invite members
--   * request to join / accept / decline / review memberships
--   * a single round-trip overview (last message + my membership) for the inbox
--
-- All functions are SECURITY DEFINER with an explicit search_path, validate the
-- caller, and are only executable by `authenticated`.

-- ---------------------------------------------------------------------------
-- Overview for the conversation list
-- ---------------------------------------------------------------------------
create or replace function public.list_my_conversations()
returns table (
  id uuid,
  type public.conversation_type,
  name text,
  description text,
  interests text[],
  created_at timestamptz,
  member_count integer,
  my_role public.conversation_member_role,
  my_status public.membership_status,
  peer jsonb,
  last_message jsonb
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with visible as (
    select c.*
    from public.conversations c
    where c.type = 'community'::public.conversation_type
       or public.is_conversation_subscribed(c.id)
  )
  select
    c.id,
    c.type,
    c.name,
    c.description,
    c.interests,
    c.created_at,
    (
      select count(*)::int
      from public.conversation_members m
      where m.conversation_id = c.id
        and m.status = 'approved'::public.membership_status
    ) as member_count,
    mine.role as my_role,
    mine.status as my_status,
    (
      select jsonb_build_object(
        'id', peer.id,
        'first_name', peer.first_name,
        'last_name', peer.last_name,
        'avatar_path', peer.avatar_path
      )
      from public.conversation_members pm
      join public.profiles peer on peer.id = pm.user_id
      where pm.conversation_id = c.id
        and pm.user_id <> auth.uid()
        and pm.status = 'approved'::public.membership_status
      order by peer.first_name
      limit 1
    ) as peer,
    (
      select jsonb_build_object(
        'content', lm.content,
        'created_at', lm.created_at,
        'sender_id', lm.sender_id
      )
      from public.messages lm
      where lm.conversation_id = c.id
      order by lm.created_at desc
      limit 1
    ) as last_message
  from visible c
  left join public.conversation_members mine
    on mine.conversation_id = c.id
   and mine.user_id = auth.uid()
  order by
    coalesce(
      (
        select lm.created_at
        from public.messages lm
        where lm.conversation_id = c.id
        order by lm.created_at desc
        limit 1
      ),
      c.created_at
    ) desc;
$$;

-- ---------------------------------------------------------------------------
-- Direct (1:1) conversations
-- ---------------------------------------------------------------------------
create or replace function public.get_or_create_direct_conversation(p_other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_me uuid := auth.uid();
  v_conv uuid;
begin
  if v_me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_other_user is null or p_other_user = v_me then
    raise exception 'invalid conversation target';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = p_other_user and p.status <> 'deleted'::public.profile_status
  ) then
    raise exception 'user not found';
  end if;

  select c.id into v_conv
  from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id and a.user_id = v_me
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = p_other_user
  where c.type = 'private'::public.conversation_type
    and a.status = 'approved'::public.membership_status
    and b.status = 'approved'::public.membership_status
  order by c.created_at
  limit 1;

  if v_conv is not null then
    return v_conv;
  end if;

  insert into public.conversations (type, created_by)
  values ('private'::public.conversation_type, v_me)
  returning id into v_conv;

  insert into public.conversation_members (conversation_id, user_id, role, status)
  values
    (v_conv, v_me, 'admin'::public.conversation_member_role, 'approved'::public.membership_status),
    (v_conv, p_other_user, 'member'::public.conversation_member_role, 'approved'::public.membership_status);

  return v_conv;
end;
$$;

-- ---------------------------------------------------------------------------
-- Groups
-- ---------------------------------------------------------------------------
create or replace function public.create_group_conversation(
  p_name text,
  p_description text default null,
  p_interests text[] default '{}'::text[],
  p_member_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_me uuid := auth.uid();
  v_conv uuid;
begin
  if v_me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception 'group name is required';
  end if;

  insert into public.conversations (type, name, description, interests, created_by)
  values (
    'group'::public.conversation_type,
    btrim(p_name),
    nullif(btrim(coalesce(p_description, '')), ''),
    coalesce(p_interests, '{}'::text[]),
    v_me
  )
  returning id into v_conv;

  insert into public.conversation_members (conversation_id, user_id, role, status)
  values (v_conv, v_me, 'admin'::public.conversation_member_role, 'approved'::public.membership_status);

  insert into public.conversation_members (conversation_id, user_id, role, status)
  select v_conv, m, 'member'::public.conversation_member_role, 'member_joining_pending'::public.membership_status
  from unnest(coalesce(p_member_ids, '{}'::uuid[])) as m
  where m <> v_me
    and exists (
      select 1 from public.profiles p
      where p.id = m and p.status <> 'deleted'::public.profile_status
    )
  on conflict (conversation_id, user_id) do nothing;

  return v_conv;
end;
$$;

create or replace function public.request_to_join_group(p_conversation uuid)
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
  if not exists (
    select 1 from public.conversations c
    where c.id = p_conversation and c.type = 'group'::public.conversation_type
  ) then
    raise exception 'group not found';
  end if;
  if exists (
    select 1 from public.conversation_members m
    where m.conversation_id = p_conversation and m.user_id = v_me
  ) then
    return;
  end if;

  insert into public.conversation_members (conversation_id, user_id, role, status)
  values (
    p_conversation, v_me, 'member'::public.conversation_member_role,
    'admin_approval_pending'::public.membership_status
  );
end;
$$;

create or replace function public.respond_to_group_invitation(
  p_conversation uuid,
  p_accept boolean
)
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

  update public.conversation_members
  set status = case
        when p_accept then 'approved'::public.membership_status
        else 'member_rejected'::public.membership_status
      end
  where conversation_id = p_conversation
    and user_id = v_me
    and status = 'member_joining_pending'::public.membership_status;

  if not found then
    raise exception 'no pending invitation';
  end if;
end;
$$;

create or replace function public.review_group_member(
  p_conversation uuid,
  p_user uuid,
  p_approve boolean
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_conversation_admin(p_conversation) then
    raise exception 'only group admins can review members' using errcode = '42501';
  end if;

  update public.conversation_members
  set status = case
        when p_approve then 'approved'::public.membership_status
        else 'admin_rejected'::public.membership_status
      end
  where conversation_id = p_conversation
    and user_id = p_user;
end;
$$;

create or replace function public.invite_group_member(
  p_conversation uuid,
  p_user uuid
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_conversation_admin(p_conversation) then
    raise exception 'only group admins can invite members' using errcode = '42501';
  end if;
  if p_user is null then
    raise exception 'member is required';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = p_user and p.status <> 'deleted'::public.profile_status
  ) then
    raise exception 'user not found';
  end if;

  insert into public.conversation_members (conversation_id, user_id, role, status)
  values (
    p_conversation, p_user, 'member'::public.conversation_member_role,
    'member_joining_pending'::public.membership_status
  )
  on conflict (conversation_id, user_id) do update
    set status = 'member_joining_pending'::public.membership_status,
        updated_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant execute on function public.list_my_conversations() to authenticated;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
grant execute on function public.create_group_conversation(text, text, text[], uuid[]) to authenticated;
grant execute on function public.request_to_join_group(uuid) to authenticated;
grant execute on function public.respond_to_group_invitation(uuid, boolean) to authenticated;
grant execute on function public.review_group_member(uuid, uuid, boolean) to authenticated;
grant execute on function public.invite_group_member(uuid, uuid) to authenticated;

revoke all on function public.list_my_conversations() from public, anon;
revoke all on function public.get_or_create_direct_conversation(uuid) from public, anon;
revoke all on function public.create_group_conversation(text, text, text[], uuid[]) from public, anon;
revoke all on function public.request_to_join_group(uuid) from public, anon;
revoke all on function public.respond_to_group_invitation(uuid, boolean) from public, anon;
revoke all on function public.review_group_member(uuid, uuid, boolean) from public, anon;
revoke all on function public.invite_group_member(uuid, uuid) from public, anon;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;