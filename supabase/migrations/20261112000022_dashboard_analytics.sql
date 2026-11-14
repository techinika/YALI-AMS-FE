-- Dashboard analytics.
--
-- Row Level Security restricts `profiles`, `messages`, `notifications` and
-- `activity_logs` to the caller's own rows, so counting them from the browser
-- under-reports (and `activity_logs` is admin-only). These definer functions
-- return the same global aggregates the old `/stats` and `/chat/top` endpoints
-- produced, without exposing rows the caller may not read.

create or replace function public.dashboard_stats()
returns table (
  users bigint,
  messages bigint,
  notifications_unopened bigint,
  sent_notifications bigint
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    (select count(*)::bigint from public.profiles p where p.status <> 'deleted'::public.profile_status),
    (select count(*)::bigint from public.messages m),
    (select count(*)::bigint from public.notifications n where n.opened = false),
    (select count(*)::bigint from public.notifications n);
$$;

create or replace function public.dashboard_activity_trend(p_days int default 7)
returns table (day date, message_count bigint)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with params as (
    select least(30, greatest(1, coalesce(p_days, 7)))::int as days
  ),
  days as (
    select generate_series(
      current_date - ((select days from params) - 1),
      current_date,
      interval '1 day'
    )::date as day
  )
  select d.day, count(m.id)::bigint as message_count
  from days d
  left join public.messages m on m.created_at::date = d.day
  group by d.day
  order by d.day;
$$;

create or replace function public.dashboard_top_members(p_limit int default 3)
returns table (
  id uuid,
  first_name text,
  last_name text,
  avatar_path text,
  message_count bigint
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p.id, p.first_name, p.last_name, p.avatar_path, count(m.id)::bigint as message_count
  from public.profiles p
  join public.messages m on m.sender_id = p.id
  where p.status <> 'deleted'::public.profile_status
  group by p.id
  order by message_count desc, p.last_name, p.first_name
  limit least(20, greatest(1, coalesce(p_limit, 3)));
$$;

revoke all on function public.dashboard_stats() from public, anon;
revoke all on function public.dashboard_activity_trend(int) from public, anon;
revoke all on function public.dashboard_top_members(int) from public, anon;

grant execute on function public.dashboard_stats() to authenticated;
grant execute on function public.dashboard_activity_trend(int) to authenticated;
grant execute on function public.dashboard_top_members(int) to authenticated;