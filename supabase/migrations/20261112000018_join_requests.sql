-- Allow members to request to join a group again after a previous request was
-- declined or after they left. Previously any existing membership row (including
-- `admin_rejected`) blocked new requests.

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
    where m.conversation_id = p_conversation
      and m.user_id = v_me
      and m.status in ('approved'::public.membership_status, 'admin_approval_pending'::public.membership_status)
  ) then
    return;
  end if;

  update public.conversation_members
  set status = 'admin_approval_pending'::public.membership_status
  where conversation_id = p_conversation
    and user_id = v_me
    and status in ('admin_rejected'::public.membership_status, 'member_rejected'::public.membership_status, 'member_left'::public.membership_status);

  if found then
    return;
  end if;

  insert into public.conversation_members (conversation_id, user_id, role, status)
  values (
    p_conversation, v_me, 'member'::public.conversation_member_role,
    'admin_approval_pending'::public.membership_status
  );
end;
$$;

grant execute on function public.request_to_join_group(uuid) to authenticated;
revoke all on function public.request_to_join_group(uuid) from public, anon;