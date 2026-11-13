# YALI AMS Migration Audit (Phase 0)

Status: **read-only audit complete, awaiting approval before Phase 1**.
Scope: migrate the two-codebase YALI Rwanda Chapter Alumni Management System
(`YALI-AMS-FE` Next.js + `YALI-AMS-BE` Express/Prisma/MySQL) to a single
Next.js app backed by Supabase (Postgres, Auth, Storage, Realtime, Edge
Functions, pgvector).

---

## 1. Executive summary

| Area | Today | Target |
|---|---|---|
| Frontend | Next.js 15 App Router, React 19, Tailwind 4, Redux Toolkit + RTK Query, socket.io-client | Same UI, Server Components for reads, TanStack Query for client interactivity, no Redux |
| Backend | Express 5, ~80 REST endpoints, JWT + bcrypt, Socket.IO, BullMQ + Redis, node-cron | No Express. Supabase Auth + Postgres RLS + RPCs + Edge Functions |
| Database | MySQL/MariaDB via Prisma | Supabase Postgres, SQL migrations in `supabase/migrations` |
| Auth | Custom JWT (24 h), Redis blocklist, `/auth/me/extend` | Supabase Auth (email/password, invite/recovery), `@supabase/ssr`, middleware refresh |
| Authorization | `requireAuth` / `requireAdmin` | RLS on every table, `is_admin()` `SECURITY DEFINER` helper |
| Realtime | Socket.IO rooms (`user-*`, `public`, `group-*`) | Supabase Realtime Postgres Changes (RLS-filtered) + optional Broadcast/Presence |
| Queues | BullMQ + Redis (AI matchmaking, email, user import) | Edge Functions + `pgmq`/status-column + `pg_cron` |
| Files | Cloudinary + `Image` table | Supabase Storage `avatars` bucket + `profiles.avatar_path` |
| AI | Gemini 2.5 Flash over **all** members (PII leak, does not scale) | pgvector embeddings + SQL top-N, LLM re-ranks/explains only ~20 anonymised candidates |
| Email | Nodemailer + Redis queue | Supabase Auth custom SMTP (invite/reset) + Edge Function + Resend/SMTP (transactional) |
| API docs | Swagger | Dropped; document RPCs/Edge Functions in `docs/` |

**Headline risks:** password-hash compatibility, MySQL→Postgres type/reference
cleanup, Cloudinary→Storage image migration, RLS correctness for private/group
chat, Edge Function rate limiting (no built-in), and Realtime delivery of
membership/status changes.

---

## 2. Source inventory

### 2.1 Backend (`YALI-AMS-BE`)

- Entry: `src/index.ts` — Express app, Helmet, CORS, compression, `express-fileupload`,
  body parser, `/health`, Swagger at `/api/docs`, `/api` behind `apiLimiter`, Socket.IO
  on `/ws/socket.io/`, BullMQ workers, hourly `node-cron`.
- Routers: `src/Routers/{auth,user,ChatRouter,DataRouters,matchRouter,notificationRouter,orgRouter,statsRouter,uploadRouter,activityRouter}.ts`
- Controllers: `src/controllers/{Users,ChatControllers,DataControllers,Organization,AIMatchmaking,Upload,Admin}` + `authController.ts`, `notificationController.ts`, `dashboardStats.ts`
- Middleware: `auth.ts` (`requireAuth`, `requireAdmin`), `rateLimit.ts`, `log.ts` (Prisma extension activity log)
- Helpers: `auth.ts` (bcrypt/JWT), `tokenStore.ts` (Redis JWT blocklist), `cache.ts` (Redis cache), `queue.ts` (AI), `importQueue.ts`, `emailQueue.ts`, `mailer.ts`/`sendMail.ts` (Nodemailer), `cloudinary.ts`, `prismaClient.ts`, `matchmakingEvents.ts`, `socketRateLimit.ts`
- Sockets: `index.ts`, `chat.socket.ts`, `group.sockets.ts`, `notificationEmitter.ts`
- Prisma: `prisma/schema.prisma` (MySQL), `prisma/migrations/*`, `prisma/seeders/*`
- Deploy: `Dockerfile`, `docker-compose.yml`, root `nginx.conf` (TLS reverse proxy for FE + BE + Socket.IO)

### 2.2 Frontend (`YALI-AMS-FE`)

- App Router pages:
  - `/` login, `/forgot-password`, `/reset-password/[token]`
  - `/dashboard` (admin stats), `/dashboard/profile` (+ `/update`), `/dashboard/members` (+ `/new`, `/match`), `/dashboard/chat` (+ `/groups`), `/dashboard/organizations`, `/dashboard/notifications`, `/dashboard/data`, `/dashboard/settings`, `/dashboard/change-password`, `/dashboard/matching` (placeholder page; real UI at `/members/match`)
- Components: `components/DashboardPages/*`, `components/Other/*` (AuthGuard, Layout, NotificationBell, SessionExpiredModal), `components/Home/*`, `components/Data/*`, `components/parts/*`, `components/ui/*`
- State/data: `lib/features/*` (10 RTK Query slices + 1 Redux slice), `lib/fetchBaseQuery.ts`, `lib/store.ts`, `lib/sockets.ts`, `helpers/auth.ts`, `helpers/logout.ts`
- Types: `types/{api,user,message,cohort,track,company,feedback,log,sidebar}.ts`
- Styling: Tailwind 4, `components/ui` (shadcn-style), `accessibility` widget, DOMPurify for rich text

---

## 3. Feature inventory

| # | Feature | Current implementation | Must work at end |
|---|---|---|---|
| 1 | Alumni profile view/update | `GET /users/:id`, `PUT /users/:userId` (admin only in router), profile page + update page, org add/remove | Yes — self-service update |
| 2 | Profile photo | `POST /upload/image` → Cloudinary + `Image` row; `profileImageId` on user | Yes — Supabase Storage |
| 3 | Linked organizations | `User_Organization` (relation/position), `Organization_WorkingSector`, `GET/POST/PUT/DELETE /organizations/*` | Yes |
| 4 | Working sectors | `WorkingSector` reference + per-user org association | Yes |
| 5 | Community chat | `Message.public = true`; `GET/POST /chat`; Socket.IO `public` room | Yes — realtime |
| 6 | Private 1:1 chat | `Message.public = false` + sender/receiver; `GET /chat/:id/:oid`, `GET /chat/:id`; Socket.IO `user-*` rooms | Yes — realtime |
| 7 | Group chat | `Group`, `GroupMember`, `GroupMessage`; create/invite/join/approve/reject/leave/remove; Socket.IO `group-*` | Yes — full approval workflow |
| 8 | Notifications | `Notifications` table; unread bell; `notification:new` socket event; 30 s polling fallback | Yes — realtime + unread |
| 9 | AI matching | `POST /matchmaking/ai` loads all users+orgs and sends to Gemini; BullMQ worker; history/status endpoints; `matchmaking:status` socket event | Yes — embeddings + top-N + optional LLM rerank |
| 10 | Invite user | `POST /users/invite`, `PUT /users/invite/renew/:userId`; creates user + reset token + email | Yes |
| 11 | Bulk import | `POST /users/import` (max 500) → BullMQ worker; Excel/CSV rows | Yes — async with progress |
| 12 | Export members | `POST /users/export/all` → ExcelJS → Cloudinary raw upload → download URL | Yes — Excel download |
| 13 | Change role | `POST /users/role/:userId` toggles roleId `11`/`12` | Yes — admin only |
| 14 | Reference data admin | `DataRouters` (genders/tracks/working sectors/cohorts/locations) + `DataPage` | Yes |
| 15 | Notification templates | `NotificationSetup` CRUD (`/notification/update/setup`) | Yes |
| 16 | Activity log | `ActivityLog` via Prisma extension; `GET /activity/recent` (admin) | Yes — trigger/RPC written, admin read |
| 17 | Dashboard stats | `GET /stats` (counts) + `GET /stats/activity-trend` | Yes — SQL views/RPC |
| 18 | Top active members | `GET /chat/top` (top 3 by message count) | Yes |
| 19 | Auth | login, logout, change password, forgot/reset, session extension | Yes — Supabase Auth |
| 20 | Account lifecycle | `GET /users/me/data` (export), `DELETE /users/me` (self delete), `DELETE /users/:id` (admin) | Yes |
| 21 | Profile update reminder cron | hourly `node-cron` → `generateProfileUpdateNotifications` | Yes — `pg_cron` |
| 22 | Accessibility widget | `AccessibilityLoader` | Keep |

---

## 4. Express endpoint → Supabase replacement map

Legend: **SC** = Server Component/direct `supabase-js` query, **SA** = Server Action,
**RPC** = Postgres function, **EF** = Edge Function, **Q** = client query via TanStack Query.

### 4.1 Auth (`/api/auth`)

| Method | Endpoint | Current behaviour | Supabase replacement |
|---|---|---|---|
| POST | `/auth/login` | bcrypt compare, JWT, store token, status must be `active` | Supabase Auth `signInWithPassword` (SA/EF) + fetch `profiles` row; middleware session |
| POST | `/auth/me/extend` | Re-issue 24 h JWT, Redis blocklist check | Removed — `@supabase/ssr` auto-refresh in middleware |
| POST | `/auth/logout` | Revoke JWT, clear token | `supabase.auth.signOut()` (SA) |
| POST | `/auth/change-pass` | bcrypt verify old, hash new, revoke token | `supabase.auth.updateUser({ password })` (SA) |
| POST | `/auth/request-link` | Create 1 h reset JWT, email link | `supabase.auth.resetPasswordForEmail(email, { redirectTo })` (EF or SA) |
| POST | `/auth/reset-password` | Verify token, set password, activate | Recovery link → `/reset-password` page → `updateUser({ password })` (code exchange) |

### 4.2 Users (`/api/users`)

| Method | Endpoint | Auth | Current behaviour | Supabase replacement |
|---|---|---|---|---|
| GET | `/users/me/data` | user | Full user graph export | SA `exportMyData()` (queries own rows, returns JSON download) |
| DELETE | `/users/me` | user | Confirm email+name, delete user and related rows | EF `delete-my-account` (service role) or RPC `delete_own_account()` |
| GET | `/users` | user | Paginated users + full graph | SC/Q `listProfiles()` with column-limited select + keyset pagination |
| GET | `/users/:userId` | user | Single user + graph | SC `getProfile(id)` |
| POST | `/users/export/all` | admin | ExcelJS workbook → Cloudinary raw | SA/EF `export-members` → `exceljs` → Storage `exports/` or streamed download |
| POST | `/users/invite` | admin | Create user + reset token + email | EF `invite-user` → `auth.admin.inviteUserByEmail` + `profiles` row + Auth email |
| PUT | `/users/invite/renew/:userId` | admin | Resend invite | EF `invite-user` resend (`auth.admin.generateLink`) |
| POST | `/users/profile` | user | Create profile record (admin add-user page) | EF `admin-create-user` (service role) or admin RPC |
| POST | `/users/org/add` | user | Insert `User_Organization` | SA `addUserOrganization()` (identity from `auth.uid()`) |
| DELETE | `/users/org/remove` | user | Delete `User_Organization` | SA `removeUserOrganization()` |
| POST | `/users/import` | admin | Enqueue BullMQ import (max 500) | EF `import-users` → `import_jobs` row + status polling/Realtime |
| PUT | `/users/:userId` | admin | Update another user's profile | SA `adminUpdateProfile()` (RLS admin policy) |
| DELETE | `/users/:userId` | admin | Soft-delete user, transfer/delete groups | EF `admin-delete-user` or RPC |
| POST | `/users/role/:userId` | admin | Toggle roleId `11`/`12` | SA/RPC `setUserRole(userId, role)` (admin only) |

### 4.3 Chat (`/api/chat`)

Identity always from `auth.uid()`; no `userId` in URL/body.

| Method | Endpoint | Current behaviour | Supabase replacement |
|---|---|---|---|
| GET | `/chat/top` | Top 3 message senders | SQL view `top_active_members` / RPC |
| POST | `/chat` | Create public or private message, emit socket | RPC `send_message(conversation_id, content)` (or `send_private_message(receiver_id, content)`) |
| GET | `/chat` | Public messages, page/limit | SC/Q `listCommunityMessages(cursor)` |
| GET | `/chat/:id/:oid` | Private messages between two users | RPC/Q `listPrivateMessages(peer_id, cursor)` |
| GET | `/chat/:id` | All private messages for user (chat list) | RPC `list_private_conversations()` → partner + last message + unread |
| POST | `/chat/group/create` | Create group, creator approved, invitees pending, notifications+emails | RPC `create_group(name, description, interests, member_ids)` |
| POST | `/chat/group/add-member/:groupId` | Group admin invites member | RPC `invite_group_member(group_id, user_id)` |
| DELETE | `/chat/group/remove-member` | Group admin removes member | RPC `remove_group_member(group_id, user_id)` |
| GET | `/chat/group/get-members/:groupId` | Approved members | SC `listGroupMembers(group_id)` |
| GET | `/chat/group/messages/:groupId/:userId` | Membership check + messages | RPC/Q `listGroupMessages(group_id, cursor)` |
| POST | `/chat/group/messages/:groupId/:userId` | Membership check + create | RPC `send_group_message(group_id, content)` |
| GET | `/chat/group/all` | All groups + member count | SC `listGroups()` |
| GET | `/chat/group/my/:userId` | My groups + membership status | RPC `list_my_groups()` |
| GET | `/chat/group/to-invite/:currentUserId/:activeGroupId` | Users not in group | SC `listInviteCandidates(group_id)` |
| GET | `/chat/group/:groupId` | Group detail + members | SC `getGroup(id)` |
| POST | `/chat/group/join-request` | Request to join (admin approval) | RPC `request_group_join(group_id)` |
| POST | `/chat/group/approve-request/admin` | Admin approves | RPC `approve_group_join(group_id, user_id)` |
| POST | `/chat/group/approve-request/member` | Invitee accepts | RPC `accept_group_invite(group_id)` |
| POST | `/chat/group/reject-request/:groupId` | Admin rejects | RPC `reject_group_join(group_id, user_id)` |
| POST | `/chat/group/decline-request/:groupId` | Invitee declines | RPC `decline_group_invite(group_id)` |

### 4.4 Reference data (`/api/data`)

All reads: SC/Q directly from tables. Admin writes: SA/RPC with `is_admin()`.

| Method | Endpoint | Replacement |
|---|---|---|
| GET | `/data/genders` | `genders` table |
| GET | `/data/tracks` | `tracks` table |
| POST | `/data/tracks` | SA `addTrack` (admin) |
| DELETE | `/data/track/:id` | SA `deleteTrack` (admin) |
| GET | `/data/working-sectors` | `working_sectors` table |
| POST | `/data/working-sectors` | SA `addWorkingSector` (admin) |
| DELETE | `/data/working-sector/:id` | SA `deleteWorkingSector` (admin) |
| GET | `/data/countries` | `countries` table |
| GET | `/data/states` | `states` table |
| GET | `/data/states/:countryId` | `states` filtered by country |
| GET | `/data/districts` | `districts` table |
| GET | `/data/cohorts` | `cohorts` table |
| POST | `/data/cohort` | SA `addCohort` (admin) |
| DELETE | `/data/cohort/:id` | SA `deleteCohort` (admin) |
| GET | `/data/district/:districtId` | `districts` by id |
| GET | `/data/district/sector/:districtId` | `sectors` by district **id** (fix: FE currently passes name) |
| GET | `/data/sectors` | `sectors` table |
| GET | `/data/sector/:sectorId` | `sectors` + parent district |

### 4.5 Organizations (`/api/organizations`)

| Method | Endpoint | Replacement |
|---|---|---|
| GET | `/organizations` | SC `listOrganizations(page)` |
| GET | `/organizations/user/:id/:orgId` | SC `getUserOrganization(userId, orgId)` |
| GET | `/organizations/user/:id` | SC `listUserOrganizations(userId)` |
| GET | `/organizations/:id` | SC `getOrganization(id)` |
| POST | `/organizations/new` | SA `createOrganization` (admin) |
| PUT | `/organizations/update` | RPC `update_organization(...)` (admin, transactional) |
| POST | `/organizations/ws/add` | SA `addOrganizationWorkingSector` (admin) |
| DELETE | `/organizations/ws/remove` | SA `removeOrganizationWorkingSector` (admin) |

### 4.6 Stats / Activity / Upload / Notifications / Matchmaking

| Method | Endpoint | Replacement |
|---|---|---|
| GET | `/stats` | SQL view/RPC `dashboard_stats()` |
| GET | `/stats/activity-trend` | RPC `activity_trend(days)` |
| GET | `/activity/recent` | SC `listRecentActivity(limit)` (admin RLS) |
| POST | `/upload/image` | Client → Storage `avatars/{uid}/...` + update `profiles.avatar_path` (SA) |
| GET | `/notification/unopened/:userId` | SC/Q `listUnreadNotifications()` |
| GET | `/notification/update/setup/one/:usage` | SC `getNotificationTemplate(usage)` (fix FE `?id=` mismatch) |
| GET | `/notification/update/setup` | SC `listNotificationTemplates()` (admin) |
| PUT | `/notification/update/setup` | SA `updateNotificationTemplate` (admin) |
| GET | `/notification/:userId` | SC/Q `listNotifications(cursor)` |
| POST | `/notification` | SA/RPC `markNotificationRead(id)` |
| POST | `/matchmaking/ai` | EF `run-matchmaking` → embed request → RPC `match_candidates` → optional LLM rerank → status |
| GET | `/matchmaking/history` | SC/Q `listMatchmakingHistory(cursor)` |
| GET | `/matchmaking/status/:requestId` | SC + Realtime subscription on `matchmaking_requests` |

---

## 5. RTK Query slice → replacement map

| Slice | Endpoints | Replacement |
|---|---|---|
| `authSlice.ts` | login/logout/requestReset/resetPassword/changePassword/extendSession | Supabase Auth client/server helpers (`lib/auth/*`) + server actions; no RTK |
| `auth.ts` (Redux slice) | credentials/sessionExpired | Removed; Supabase session context + middleware |
| `userSlice.ts` | users, getOneUser, change role, delete, update, invite, reInvite, createProfile, upload, import, export, exportMyData, deleteMyAccount, associate/remove org | `lib/data/users.ts` (SC/SA) + TanStack Query hooks for client mutations |
| `otherSlice.ts` | genders, districts, countries, states, statesByCountry, cohorts, sectorsByDistrict, workingSector, add/delete working sector, tracks, add/delete cohort/track | `lib/data/reference.ts` (SC reads; SA admin writes) |
| `chatSlice.ts` | chats, topMembers, addMessage, privateChats, privateMessages, groups, members, join/approve/reject/decline, group messages | `lib/data/chat.ts` + RPCs + Realtime hooks |
| `notificationSlice.ts` | notifications, unopened, setups, open, update setup | `lib/data/notifications.ts` + Realtime |
| `statsSlice.ts` | stats, activityTrend | `lib/data/stats.ts` (SC) |
| `orgSlice.ts` | organizations, by id, for user, add/update, ws add/remove | `lib/data/organizations.ts` (SC/SA) |
| `activitySlice.ts` | recent logs | `lib/data/activity.ts` (SC) |
| `matchMakingSlice.ts` | aiMatchMaker, history, status | `lib/data/matchmaking.ts` + EF + Realtime |

**Client-state changes:** remove `lib/store.ts`, `lib/hooks.ts`, `lib/features/*`,
`lib/fetchBaseQuery.ts`, `cookies-next`, `socket.io-client`. Add
`@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query`, `zod`.

---

## 6. Realtime mapping

| Socket.IO event | Room | Supabase Realtime replacement |
|---|---|---|
| `new-message` | `public` | `postgres_changes` INSERT on `messages` where `conversation.type = 'community'` |
| `new-message` | `user-{id}` | `postgres_changes` INSERT on `messages` for conversations the user participates in (RLS filters) |
| `new-group-message` | `group-{id}` | `postgres_changes` INSERT on `messages` for group conversation (RLS) |
| `notification:new` | `user-{id}` | `postgres_changes` INSERT on `notifications` where `receiver_id = auth.uid()` |
| `matchmaking:status` | `user-{id}` | `postgres_changes` UPDATE on `matchmaking_requests` where `user_id = auth.uid()` |
| `join-room` / `join-group` | — | Not needed; RLS scopes changes automatically. Optional Broadcast for typing/presence |
| socket auth (`token`) | — | Supabase access token (RLS `auth.uid()`) |

Notes:
- Supabase Realtime `postgres_changes` respects RLS for the subscribing user.
- Group membership changes (approve/reject/remove) should trigger a refetch or a
  Broadcast event; they are not message rows.
- Presence (online indicators) is optional and can be added later.

---

## 7. Background jobs, queues and cron

### 7.1 The hourly `node-cron` job

`src/index.ts` runs `cron.schedule("0 * * * *", ...)` (top of every hour) and calls
`generateProfileUpdateNotifications()` (`notificationController.ts`):

- Reads the `NotificationSetup` template with `usage = "UPDATE"` (seed value is
  lowercase `update`; MySQL collation is case-insensitive, Postgres is not — normalize).
- Selects users whose `updatedAt` is older than **6 months**, status not `deleted`,
  and who have **no** notification titled `UPDATE: You need to update your profile`
  created in the last 24 hours.
- Creates one notification per user, replacing `[name]` with `firstName`.
- Emits `notification:new` to each user via Socket.IO.

**Purpose:** re-engage alumni who have not updated their profile in 6 months, at most
once per day. (The log message says "over a month"; the code uses 6 months.)

Target: `pg_cron` schedule `0 * * * *` calling SQL function
`public.generate_profile_update_notifications()`; notifications are delivered by
Realtime on insert. No Redis, no Node worker.

### 7.2 Queues

| Queue | Current | Target |
|---|---|---|
| `ai-matchmaking` | BullMQ + Redis, concurrency 5 | Edge Function `run-matchmaking` + `matchmaking_requests.status`; Supabase Queues (`pgmq`, verified available) or status-column + `pg_cron` retry |
| `emails` | BullMQ + Redis, Nodemailer | Supabase Auth SMTP for invite/reset; Edge Function + Resend for transactional |
| `user-imports` | BullMQ + Redis, batch 10 | Edge Function `import-users` + `import_jobs` table; client polls/Realtime |

---

## 8. Current Prisma schema → target Postgres model

### 8.1 Problems to fix (not copy)

- `User` mixes profile data with `password`, `token`, `refreshToken`.
- `middleName`, `phoneNumber`, `whatsappNumber` are **required**; many alumni have no middle name.
- `District` is referenced by `name` (not `id`) from `User`, `Sector`, `Organization`.
- `interests` is a comma-separated string (user + group).
- `Message` and `Notifications` have nullable sender/receiver.
- `Message.public` boolean mixes community and private chat.
- No FK `onDelete` rules.
- Role default is hard-coded `roleId = "12"`; role IDs are `"11"`/`"12"`; role names stored uppercase `ADMIN`/`USER`.
- `status` is a free string (`active|inactive|invited|deleted`).
- `Organization` has both a single `workingSectorId` relation and an `Organization_WorkingSector` array — redundant/confusing.
- `Sector.districtName` stores the district name rather than FK id.
- `Image` table is global and only stores Cloudinary URLs.
- `ActivityLog` is written by a Prisma extension (cannot be reused directly).

### 8.2 Target tables

Reference / lookup:
- `genders(id text pk, name text unique)` — or enum; seeded from `genders.ts`
- `cohorts(id int pk, name text, description text)` — keep int ids for compatibility
- `tracks(id text pk, name text unique)` — keep `unspecified|pm|cl|be`
- `working_sectors(id text pk, name text unique)` — keep existing ids
- `countries(id text pk, name text unique, c_id int)` — ISO2 ids
- `states(id uuid pk, name text, country_code text)` — or int
- `districts(id uuid pk, name text unique, province text)` — 5 provinces + `unspecified`
- `sectors(id uuid pk, name text, district_id uuid fk → districts)` — ~416 sectors

Core:
- `profiles(id uuid pk → auth.users.id on delete cascade, first_name, middle_name null, last_name, email citext unique, phone text null, whatsapp text null, bio, linkedin, instagram, facebook, twitter, gender_id, is_rwandan, country_id, state_id, district_id, sector_id, nearest_landmark, cohort_id, track_id, avatar_path, role app_role not null default 'user', status profile_status not null default 'invited', phone_visible bool not null default false, whatsapp_visible bool not null default false, search_text text, embedding vector(1536), created_at, updated_at)`
- `app_role` enum: `admin | user`
- `profile_status` enum: `invited | active | inactive | deleted`
- `organizations(id uuid pk, name text not null, country_id, state_id, district_id, sector_id, website, added_by uuid → profiles, created_at, updated_at)`
- `user_organizations(id uuid pk, user_id uuid fk, organization_id uuid fk, relation text, position text, created_at, unique(user_id, organization_id))`
- `organization_working_sectors(organization_id uuid fk, working_sector_id text fk, primary key(organization_id, working_sector_id))`
- `user_working_sectors(user_id uuid fk, working_sector_id text fk, primary key(user_id, working_sector_id))` — if per-user sectors are kept

Chat (recommended unified model — see §8.3):
- `conversations(id uuid pk, type conversation_type, name, description, interests text[], created_by uuid, created_at, updated_at)`
- `conversation_members(conversation_id uuid fk, user_id uuid fk, role member_role default 'member', status membership_status default 'approved', created_at, primary key(conversation_id, user_id))`
- `messages(id uuid pk, conversation_id uuid fk, sender_id uuid fk, content text not null, created_at, indexed (conversation_id, created_at desc))`

Notifications / matching / audit / jobs:
- `notifications(id uuid pk, receiver_id uuid fk, title, message, link, opened bool default false, created_at)`
- `notification_templates(id uuid pk, usage text unique, message text, link text, updated_by uuid, updated_at)`
- `matchmaking_requests(id uuid pk, user_id uuid fk, interests text not null, description text, status match_status default 'pending', ai_summary text, ai_notes text, ai_response text, created_at, updated_at)`
- `matchmaking_items(id uuid pk, request_id uuid fk, match_type match_type, matched_user_id uuid null, matched_group_id uuid null, score int, reason text, created_at)`
- `activity_logs(id uuid pk, model text, action text, record_id text, user_id uuid, timestamp timestamptz default now(), details jsonb)`
- `import_jobs(id uuid pk, requested_by uuid, status import_status, total_rows int, processed_rows int, errors jsonb, created_at, updated_at)`

### 8.3 Chat model decision

**Recommended: one `conversations` + `conversation_members` + `messages` model.**

Why:
- One RLS policy pattern for all chat: "user is a member of the conversation".
- One unread-count query and one Realtime stream.
- Private chat no longer needs `public` flags or `userId` in URLs; membership is derived from `conversation_members`.
- Group approval workflow maps cleanly to `conversation_members.status`.

Alternative (fallback if time-constrained): keep `messages` (community/private with
`conversation_id` or sender/receiver) + `groups` + `group_members` + `group_messages`.
This is closer to the current code but duplicates RLS and unread logic. **Decision
needed:** unified (recommended) vs split.

### 8.4 Seed data

Source: `prisma/seeders/*`. Port:
- genders: `Not Specified|Male|Female|Other`
- cohorts: `1 = Not Specified`, `2..56`
- roles → `app_role` enum (`ADMIN`/`USER` → `admin`/`user`)
- tracks: `unspecified|pm|cl|be`
- working sectors: from `organization.ts` (climate, communication, civic, sport, agri, fin, eship, sexed, tourism, waste, …)
- countries + states: from `countries-states-cities` (generate SQL or seed via script)
- districts + sectors: from `rwanda` package (5 provinces → districts → sectors) + `unspecified`
- notification templates: `signup`, `update`, `updated` (normalize usage lowercase)
- default image: `/placeholder.svg` → Storage or static asset

`supabase db reset` must reproduce all of the above.

---

## 9. Auth, session and password migration

- Supabase Auth email/password. `@supabase/ssr` sets/reads cookies; `middleware.ts`
  refreshes the session and protects `/dashboard/**` (and admin-only pages).
- Remove custom JWT, bcrypt login, Redis blocklist, `/auth/me/extend`, and the
  "session expired / extend session" modal (Supabase handles refresh).
- **Password preservation:** verified — Supabase Auth `admin.createUser`
  accepts `password_hash` and supports bcrypt, scrypt (Firebase) and Argon2.
  Existing bcrypt hashes can therefore be imported without forcing a reset.
  **Still verify on a test user first** (hash format/cost edge cases); fallback is
  a forced password-reset email on first login.
- Invites: `auth.admin.inviteUserByEmail` (service role in Edge Function). The
  invitee sets their password via the Supabase recovery/invite link.
- `profiles.id` must be created by a trigger on `auth.users` insert
  (`handle_new_user`), with role/status defaults and no client control.
- Privilege escalation guard: users cannot update `role`/`status`; use column-level
  privileges + a trigger/RPC. `is_admin()` is `SECURITY DEFINER` and used by policies.

---

## 10. Storage

- Bucket `avatars` (public read; write only to `auth.uid()`'s folder).
- `profiles.avatar_path` stores the object path, not a full URL.
- Migrate existing Cloudinary images: download each `Image.link`, upload to
  `avatars/legacy/{userId}/{imageId}`, update `profiles.avatar_path`.
- `next.config.mjs` remote patterns: remove `res.cloudinary.com`, add Supabase
  project host if using `next/image` with remote URLs (or use Storage public URLs).
- Export files (`members-export-*.xlsx`) → Storage `exports/` with a short-lived
  signed URL, or stream the workbook directly from a server action.

---

## 11. AI matching current flow and target

### 11.1 Current (do not copy)

`createMatchmakingRequest`:
- Loads the requesting user + organizations.
- Loads **every** non-deleted user with organizations.
- Loads **all** groups.
- Sends the full JSON (including emails, phone numbers, WhatsApp) to Gemini 2.5 Flash.
- Worker parses JSON, filters IDs, clamps scores, stores `MatchmakingItem`s.

Problems: PII leak, does not scale (all members per request), slow, no embeddings,
no history of candidate reasoning, no deduplication/caching.

### 11.2 Target

1. `profiles.search_text` = sector + organizations + positions + track + cohort + bio + interests.
2. Debounced embedding generation on profile change (Edge Function + `pgmq`/trigger);
   store in `profiles.embedding vector(N)`.
3. Matching RPC:
   - embed the request text (same provider/model),
   - cosine similarity top-N people and groups,
   - exclude self, existing conversation partners, inactive/deleted,
   - return candidate IDs + similarity.
4. Optional LLM rerank: send only top ~20 **anonymised** summaries (id, sector,
   interests, short bio) to the LLM; ask for 0–100 score + reason ≤ 200 chars;
   validate JSON with Zod; discard any ID not in the candidate set.
5. Status `pending → completed|failed`; client subscribes via Realtime; completion
   creates a notification.
6. Secrets only in Edge Function env; never ship the LLM key.

**Decision needed:** embedding provider/model (dimensions) and LLM provider/model.

---

## 12. Environment variables

### Current

Backend:
`PORT`, `HTTP_PORT`, `DATABASE_URL`, `DATABASE_HOST`, `DATABASE_USER`,
`DATABASE_PASSWORD`, `DATABASE_NAME`, `DATABASE_PORT`, `CONNECTION_LIMIT`,
`EMAIL_PORT`, `EMAIL_HOST`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `FRONTEND_URL`,
`SECRET_KEY`, `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`,
`GEMINI_KEY`, `REDIS_URL`, `TRUST_PROXY_HOPS`, `RATE_LIMIT_*`, `AUTH_RATE_LIMIT_*`,
`UPLOAD_RATE_LIMIT_*`, `ALLOWED_ORIGINS`.

Frontend:
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`.

### Target

```
# Supabase (client)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase (server only — never NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=

# AI (Edge Function secrets)
EMBEDDING_PROVIDER=
EMBEDDING_MODEL=
EMBEDDING_API_KEY=
LLM_PROVIDER=
LLM_MODEL=
LLM_API_KEY=

# Email (Edge Function / Supabase Auth custom SMTP)
RESEND_API_KEY=
EMAIL_FROM=

# App
NEXT_PUBLIC_SITE_URL=
```

`.env.example` with placeholders only; document each in `README.md`.

---

## 13. Proposed target repo shape

```
/ (repo root)
  app/                      # Next.js App Router (from YALI-AMS-FE, refactored)
  components/               # existing UI, refactored
  lib/
    supabase/{client,server,middleware}.ts
    data/*                  # typed data-access layer
    auth/*
    validations/*           # Zod schemas
  supabase/
    config.toml
    migrations/             # one file per logical change
    seed.sql
    functions/              # Edge Functions
      invite-user/
      import-users/
      export-members/
      delete-account/
      run-matchmaking/
      generate-embeddings/
      send-email/
    tests/                  # pgTAP / SQL RLS checks
  scripts/
    migrate-from-mysql/     # one-off, idempotent migration
  docs/
    migration-audit.md
    rls.md
    cutover.md
    rpc.md
    edge-functions.md
  tests/                    # Playwright smoke
  middleware.ts
  package.json
```

No `server/`, no Express, no Redis, no BullMQ, no Prisma, no Socket.IO.

**Decision needed:** create this as a new folder at the workspace root (recommended,
e.g. `YALI-AMS`) vs convert `YALI-AMS-FE` in place.

---

## 14. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Existing bcrypt hashes not accepted by Supabase Auth | Users cannot log in | Verify on a test user first; fallback to forced reset email; document in migration report |
| MySQL→Postgres type/reference cleanup (district by name, role IDs, required fields) | Data loss / broken profiles | Explicit mapping tables + dry-run + row/checksum verification |
| Cloudinary images unavailable after cutover | Broken avatars | Download/upload migration with per-image status report |
| RLS misconfiguration | Data leak (PII, private messages) | Default deny, policy table in `docs/rls.md`, pgTAP isolation tests, Supabase advisors |
| Realtime not delivering membership/status changes | Stale UI | Refetch on membership RPC; subscribe to `matchmaking_requests`/`notifications`; fallback polling |
| Edge Function rate limiting | Abuse/cost | DB-backed rate limiter or provider (Upstash) keyed by IP/user; document limits |
| Email deliverability (invite/reset) | Users cannot onboard | Custom SMTP (Resend) with SPF/DKIM; Supabase Auth email templates |
| LLM/embedding cost and latency | Slow matching | pgvector top-N first; LLM only top ~20; cache embeddings; debounce |
| `pgmq` extension availability | Job queue design | Verified: Supabase Queues supports `pgmq` (Postgres 15.6.1.143+), with `pgmq_public` wrappers; still confirm on the target project |
| Large import (500 rows) timeouts | Failed imports | Async Edge Function + `import_jobs` + Realtime/polling |
| Vercel/Supabase env drift | Runtime failures | `.env.example` + deployment checklist in `docs/cutover.md` |
| Accessibility regressions | Bad UX | Keep widget; keyboard/labels on all forms; Playwright smoke |

---

## 15. Open questions (blocking)

1. **Final repo location:** new folder at the workspace root (e.g. `YALI-AMS`) or
   convert `YALI-AMS-FE` in place?
2. **Images:** move to Supabase Storage (recommended) or keep Cloudinary?
3. **SMTP provider:** Resend (recommended), existing SMTP credentials, or Supabase
   default email?
4. **LLM provider/model for explanations:** keep Gemini, or use OpenAI/Anthropic?
5. **Embedding provider/model:** OpenAI `text-embedding-3-small` (1536), Supabase
   `gte-small` (768), Cohere, or other? (Drives `vector(N)` and cost.)
6. **Phone/WhatsApp visibility:** private by default (opt-in), or keep public as today?

Additional confirmations (non-blocking but useful):
- Unified chat model (`conversations` + `conversation_members` + `messages`) vs keep split?
- Production data volume (users, messages, groups) for migration sizing?
- Keep magic-link/invite auth, or email/password only?
- Is Docker available locally for `supabase start`?

---

## 16. Phase 0 checklist

- [x] Read `prisma/schema.prisma`, all routers/controllers/sockets/helpers, `index.ts` (cron)
- [x] Read FE `app/**`, `components/DashboardPages/**`, `lib/features/*`, `lib/sockets.ts`, `helpers/auth.ts`, `types/*`
- [x] Inventory all endpoints and map to Supabase
- [x] Inventory all RTK Query slices and map to replacements
- [x] Identify the cron job's purpose
- [x] Identify env vars and risks
- [x] Write `docs/migration-audit.md`
- [x] Get approval / answers to blocking questions
- [x] Proceed to Phase 1 (Supabase foundation) — see `docs/phase-1.md`

---

## 17. Approved decisions (Phase 0 sign-off)

The following decisions were confirmed before Phase 1:

| Topic | Decision |
|---|---|
| Final repo location | `YALI-AMS-FE/` (Supabase files under `supabase/`) |
| Profile photos | Move to Supabase Storage (`avatars` bucket) |
| SMTP | Resend for Auth + transactional email |
| LLM (rerank/explanations) | Keep Gemini (`gemini-2.5-flash`) |
| Embeddings | Gemini embeddings (768 dims, `text-embedding-004` / `gemini-embedding-001` with 768 output) |
| Phone/WhatsApp | Private by default (per-field opt-in) |
| Approval | Phase 1 approved |

---
