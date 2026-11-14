-- Unified chat model: community, private 1:1 and group chats share
-- `conversations`, `conversation_members` and `messages`.
--
-- Why unified:
--   * one RLS pattern ("is the caller a member of the conversation?")
--   * one unread-count query and one Realtime stream
--   * private chats no longer need a `public` boolean or user ids in the URL
--   * the group approval workflow maps to `conversation_members.status`
--
-- Group metadata (name, description, interests, creator) lives on the
-- `conversations` row; `matchmaking_items.matched_group_id` references it.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null,
  name text,
  description text,
  interests text[] not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.conversation_member_role not null default 'member',
  status public.membership_status not null default 'approved',
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index conversations_type_idx on public.conversations (type);
create index conversations_created_by_idx on public.conversations (created_by);
create index conversation_members_user_id_idx on public.conversation_members (user_id);
create index conversation_members_conversation_status_idx
  on public.conversation_members (conversation_id, status);
create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);
create index messages_sender_created_idx on public.messages (sender_id, created_at desc);