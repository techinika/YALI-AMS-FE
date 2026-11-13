-- Conversation overview v2.
--
-- 1. Group discovery: list all groups so members can find and request to join
--    them (previously only groups the caller already belonged to were listed).
-- 2. Privacy: the `peer` profile is only resolved for 1:1 conversations. For
--    groups it is always null, so non-members never see a member's profile.
-- 3. Last message is only included for conversations the caller can read.

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
    where c.type in ('community'::public.conversation_type, 'group'::public.conversation_type)
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
    case
      when c.type = 'private'::public.conversation_type then (
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
      )
      else null
    end as peer,
    case
      when c.type = 'group'::public.conversation_type and mine.user_id is null then null
      else (
        select jsonb_build_object(
          'content', lm.content,
          'created_at', lm.created_at,
          'sender_id', lm.sender_id
        )
        from public.messages lm
        where lm.conversation_id = c.id
        order by lm.created_at desc
        limit 1
      )
    end as last_message
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

grant execute on function public.list_my_conversations() to authenticated;
revoke all on function public.list_my_conversations() from public, anon;