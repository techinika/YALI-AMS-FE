-- Enums used across the AMS schema.
-- Keep these in sync with the Zod schemas in `lib/validations`.

create type public.app_role as enum ('admin', 'user');

create type public.profile_status as enum (
  'invited',
  'active',
  'inactive',
  'deleted'
);

create type public.conversation_type as enum ('community', 'private', 'group');

create type public.conversation_member_role as enum ('member', 'admin');

create type public.membership_status as enum (
  'admin_approval_pending',
  'member_joining_pending',
  'approved',
  'admin_rejected',
  'member_rejected',
  'member_left'
);

create type public.match_status as enum ('pending', 'completed', 'failed');

create type public.match_type as enum ('user', 'group');

create type public.import_status as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);