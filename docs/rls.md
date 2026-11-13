# Row Level Security (RLS)

Every table in `public` has RLS enabled with explicit, default-deny policies.
Identity comes from `auth.uid()` only — never from client-supplied user ids.

## Policy matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `genders`, `cohorts`, `tracks`, `working_sectors`, `countries`, `states`, `districts`, `sectors` | any authenticated user | admin (`is_admin()`) | admin | admin |
| `profiles` | self, any `active` profile, or admin | auth trigger only (no client insert) | self (column-limited) or admin | service role only |
| `organizations` | any authenticated user | authenticated with `added_by = auth.uid()`, or admin | admin | admin |
| `user_organizations` | any authenticated user | self or admin | self or admin | self or admin |
| `organization_working_sectors` | any authenticated user | admin | admin | admin |
| `user_organization_working_sectors` | any authenticated user | self or admin | self or admin | self or admin |
| `conversations` | `community`, any membership/creator (`is_conversation_subscribed`), or admin | RPC only (`SECURITY DEFINER`) | creator or admin | admin |
| `conversation_members` | subscribed member or admin | RPC only | RPC only | RPC only |
| `messages` | community or approved conversation member, or admin | `sender_id = auth.uid()` and member of the conversation | no client update | own message |
| `notifications` | `receiver_id = auth.uid()` | `notify_user()` / service role | own (`opened` column only) | none |
| `notification_templates` | any authenticated user | admin | admin | admin |
| `matchmaking_requests` | own request or admin | service role / Edge Function | service role / Edge Function | service role / Edge Function |
| `matchmaking_items` | own request or admin | service role / Edge Function | service role / Edge Function | service role / Edge Function |
| `activity_logs` | admin | `log_activity()` / service role | none | none |
| `import_jobs` | requester or admin | admin | admin | admin |

## Column-level protections

`profiles`:

- `SELECT` is granted only on non-sensitive columns. `phone` and `whatsapp` are
  **not** selectable directly; use `get_profile_contact(user_id)` (SECURITY
  DEFINER), which returns them only when the owner opted in
  (`phone_visible` / `whatsapp_visible`), the caller is the owner, or the caller
  is an admin.
- `UPDATE` is granted only on profile fields. `role`, `status`, `email`,
  `embedding`, `search_text` and `id` cannot be changed by the client.
- `INSERT`/`DELETE` are not granted to `authenticated`; profile creation is done
  by the `on_auth_user_created` trigger and deletion by service-role code.

`notifications`:

- `SELECT` on all columns for the receiver; `UPDATE` only on `opened`.

## Storage

| Bucket | Read | Write |
|---|---|---|
| `avatars` | public | authenticated users to `{auth.uid()}/...` only |
| `exports` | admin only (signed URLs) | admin only |

## Helper functions

| Function | Purpose | Client-callable |
|---|---|---|
| `is_admin()` | True if `auth.uid()` is an active `admin` profile | yes (used by policies) |
| `is_conversation_member(conv)` | True if approved member | yes |
| `is_conversation_admin(conv)` | True if approved group admin | yes |
| `is_conversation_subscribed(conv)` | True if any membership row (incl. pending) or creator | yes |
| `get_profile_contact(user_id)` | Conditional phone/WhatsApp | yes |
| `admin_export_members()` | Admin-only member export incl. contacts and organizations | admins only |
| `dashboard_stats()` | Global member/message/notification counts | yes |
| `dashboard_activity_trend(days)` | Messages per day (1–30 days) | yes |
| `dashboard_top_members(limit)` | Most active members by message count | yes |
| `notify_user(...)` | Insert a notification | no (service/definer only) |
| `log_activity(...)` | Insert an activity log | no (service/definer only) |
| `generate_profile_update_notifications()` | Hourly reminder | no (pg_cron only) |

## Verification

A local SQL check was run against PostgreSQL 18 with the schema applied and
`auth.uid()` backed by a session variable. It confirmed:

- a user cannot read another user's `phone`/`whatsapp` directly (permission
  denied) and only sees them through `get_profile_contact` when opted in;
- a user cannot update another user's profile (0 rows) or change their own
  `role`/`status` (permission denied);
- a non-member cannot read a private conversation or its messages;
- a pending group member can see the group but not its messages;
- a user cannot insert a message into a conversation they are not a member of;
- a user can mark only their own notification as read;
- non-admins cannot read `activity_logs`, other users' matchmaking requests or
  import jobs;
- the profile-update reminder inserts once and is suppressed within 24 hours.

For pgTAP-based isolation tests, add `supabase/tests/rls/*.test.sql` and run them
with `supabase test db` (Phase 6).

## Supabase advisors

Run the security and performance advisors before cutover:

```sql
select * from supabase_advisor.security();
select * from supabase_advisor.performance();
```

There must be no `rls_disabled_in_public` or `security_definer_view` warnings.