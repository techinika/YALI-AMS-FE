-- The community chat is a singleton conversation shared by every member.
-- It is normally created by `supabase/seed.sql`, but production databases that
-- only ran migrations (or were restored from the MySQL import) may not have it,
-- which makes the community tab unusable.

insert into public.conversations (id, type, name, description, interests, created_by)
values (
  '00000000-0000-0000-0000-000000000001',
  'community'::public.conversation_type,
  'Community',
  'Public community chat for all YALI alumni',
  '{}'::text[],
  null
)
on conflict (id) do nothing;