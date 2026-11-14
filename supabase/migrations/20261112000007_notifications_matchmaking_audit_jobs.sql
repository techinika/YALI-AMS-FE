-- Notifications, notification templates, AI matching, audit log and import jobs.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  link text,
  opened boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  usage text not null unique,
  message text not null,
  link text,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matchmaking_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  interests text not null,
  description text,
  status public.match_status not null default 'pending',
  ai_summary text,
  ai_notes text,
  ai_response text,
  embedding vector(768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matchmaking_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.matchmaking_requests (id) on delete cascade,
  match_type public.match_type not null,
  matched_user_id uuid references public.profiles (id) on delete cascade,
  matched_group_id uuid references public.conversations (id) on delete cascade,
  score int check (score between 0 and 100),
  reason text check (reason is null or char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  constraint matchmaking_items_target_check check (
    (match_type = 'user' and matched_user_id is not null and matched_group_id is null)
    or
    (match_type = 'group' and matched_group_id is not null and matched_user_id is null)
  )
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  action text not null,
  record_id text,
  user_id uuid references public.profiles (id) on delete set null,
  timestamp timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid references public.profiles (id) on delete set null,
  status public.import_status not null default 'pending',
  total_rows int not null default 0,
  processed_rows int not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notifications_receiver_created_idx
  on public.notifications (receiver_id, created_at desc);
create index notifications_receiver_unopened_idx
  on public.notifications (receiver_id) where opened = false;
create index matchmaking_requests_user_created_idx
  on public.matchmaking_requests (user_id, created_at desc);
create index matchmaking_items_request_id_idx on public.matchmaking_items (request_id);
create index matchmaking_items_matched_user_idx on public.matchmaking_items (matched_user_id);
create index matchmaking_items_matched_group_idx on public.matchmaking_items (matched_group_id);
create index activity_logs_timestamp_idx on public.activity_logs (timestamp desc);
create index activity_logs_user_id_idx on public.activity_logs (user_id);
create index activity_logs_model_idx on public.activity_logs (model);
create index import_jobs_requested_by_idx
  on public.import_jobs (requested_by, created_at desc);