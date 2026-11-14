# YALI AMS

Next.js application for the YALI Rwanda Chapter Alumni Management System (AMS).
The app now runs as a single codebase backed by Supabase (Postgres, Auth,
Storage, Realtime, Edge Functions, pgvector). The former Express/MySQL backend,
Redis, BullMQ, Prisma, Redux/RTK Query and Socket.IO layers are retired.

## Current Migration Status

- **Complete:** every dashboard and feature page reads through `lib/data/*`;
  authentication, sessions, chat (incl. groups and Realtime), notifications,
  matchmaking, organizations, reference data, member administration and
  dashboards all run on Supabase. No legacy API/RTK/socket code remains.
- **Not yet applied to a hosted project:** migrations, seed and Edge Functions
  have been validated (Postgres grammar parse, `npm run db:test` against real
  PostgreSQL 18 in PGlite, `tsc`, `eslint`, Next.js build, `deno check`) but the
  target Supabase project credentials are not configured in this workspace, so
  `supabase db push` and function deploys still need to be run once.

## Prerequisites

- Node.js 20+
- npm
- Docker (local Supabase stack only)
- A Supabase project (URL, anon key, service-role key)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Service-role key (Edge Functions, admin imports) |
| `SUPABASE_DB_URL` | server | Postgres connection string (CLI/migration tooling) |
| `SUPABASE_ACCESS_TOKEN` | server | Supabase management token (`db push`, function deploys) |
| `EMBEDDING_*` / `LLM_*` | server | Optional AI provider settings for Edge Functions |
| `RESEND_API_KEY` / `EMAIL_FROM` | server | Resend invitation emails (Supabase Auth keeps its default mailer) |
| `APP_URL` | server | Public app origin used in invitation links |
| `MIGRATION_SOURCE_ENV` / `DATABASE_URL` | server | Read-only MySQL source for `npm run migrate:mysql` |

Never prefix a server-only variable with `NEXT_PUBLIC_`.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:start` / `db:stop` | Start/stop the local Supabase stack (Docker) |
| `npm run db:reset` | Apply migrations + seed to the local database |
| `npm run db:push` | Apply migrations to the linked hosted project |
| `npm run db:lint` / `db:diff` | Lint migrations / diff schema |
| `npm run types` | Regenerate `supabase/types/database.ts` |
| `npm run db:test` | Apply migrations + seed to in-memory Postgres and run RLS/function checks (no Docker) |
| `npm run seed:generate` | Rebuild `supabase/seed.sql` from reference data |
| `npm run migrate:mysql` | Dry-run/read-only import from the legacy MySQL database |
| `npm run admin:user -- <command> <email>` | Inspect/confirm/set-password/promote a user with the service-role key |
| `npm run email:test -- <email>` | Send a Resend test email using `.env` |

## Architecture

- `lib/supabase/{client,server,middleware}.ts` — browser, server and middleware
  Supabase clients (`@supabase/ssr`).
- `middleware.ts` — refreshes session cookies and protects `/dashboard`;
  authenticated users are redirected away from auth routes.
- `lib/data/*` — the only data-access layer (TanStack Query on the client,
  typed Supabase clients on the server). `lib/data/types.ts` re-exports the
  generated `supabase/types/database.ts`.
- `components/DashboardPages/*` — dashboard screens; `components/parts/*` —
  shared shell, chat and profile pieces.
- `supabase/migrations` — schema, RLS, functions, triggers, Realtime, pg_cron.
- `supabase/functions/{admin-members,matchmaking}` — service-role Edge
  Functions (JWT + `profiles.role` checks); `supabase/functions/_shared` holds
  the Resend client and email templates.
- `scripts/` — reference-seed generator and the read-only MySQL → Supabase
  migration tooling.

## Creating or fixing an admin user

There is deliberately no public "make me an admin" path: `handle_new_user`
always creates profiles with the `user` role, and `admin-members` requires an
existing admin. The first admin must be created with the Dashboard or the
service-role helper:

```bash
# Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
npm run admin:user -- inspect admin@example.com
npm run admin:user -- create admin@example.com 'a-strong-password' admin
# or, for an existing auth user:
npm run admin:user -- confirm admin@example.com
npm run admin:user -- set-password admin@example.com 'a-strong-password'
npm run admin:user -- promote admin@example.com
```

`inspect` prints whether the email is confirmed, whether an `auth.identities`
row exists, and the profile role. If a member cannot sign in, check in this
order: email confirmed → password reset → profile role.

Note: the hosted Auth settings may have "Confirm email" enabled even though
`supabase/config.toml` disables it locally. Users created in the Dashboard
without "Auto Confirm User" cannot sign in until they are confirmed.

## Email (Resend)

Supabase Auth keeps its **default mailer** for confirmation and password-reset
emails. Invitations are sent **outside Supabase** through the Resend API by the
`admin-members` Edge Function.

We do **not** use Supabase's invite feature (`inviteUserByEmail`): members are
provisioned with `email_confirm: true`, so Supabase has no invite email to send.
Instead, the function sends a branded set-password email containing a one-time
`token_hash` link to `/reset-password/recover`, which the PKCE browser client
verifies with `verifyOtp`.

### 1. Verify the sending domain

Add the sending domain in [Resend → Domains](https://resend.com/domains) and
create the DNS records. `EMAIL_FROM` must use a verified domain, e.g.
`YALI AMS <no-reply@yalirwandachapter.org>`. While testing you can use
`onboarding@resend.dev`, but Resend only delivers that to the account owner's
address.

### 2. Edge Function secrets

```bash
npx supabase secrets set \
  RESEND_API_KEY=re_... \
  EMAIL_FROM="YALI AMS <no-reply@yalirwandachapter.org>" \
  APP_URL="https://your-app.example"
npx supabase functions deploy admin-members
```

`APP_URL` is used to build the `/reset-password/recover` link; it falls back to
the request `Origin` header. Invitation links do not depend on Supabase's
redirect allow-list because they carry the one-time token hash directly.

### 3. Test

```bash
# Direct Resend test (reads .env)
npm run email:test -- you@example.com

# Or through the deployed Edge Function (admin access token required)
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/functions/v1/admin-members" \
  -H "Authorization: Bearer <admin-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"action":"send-test-email","email":"you@example.com"}'
```

Invites from "Add new member" and "Invite" send email automatically, and bulk
import has a **Send invitation emails** toggle. If Resend is not configured, the
UI still shows/copies the set-password link for manual sharing.

### Optional: move Supabase Auth to Resend later

Configure custom SMTP in **Dashboard → Authentication → Emails → SMTP
Settings**: host `smtp.resend.com`, port `587`, user `resend`, password = API
key. Also update the Site URL and add `/auth/callback` plus
`/reset-password/recover` to the redirect allow-list. The commented
`[auth.email.smtp]` block in `supabase/config.toml` can be used with
`npx supabase config push`, but change `auth.site_url` to the deployed origin
first.

## Supabase Notes

- Migrations are applied in filename order; never edit an applied migration.
- RLS is default-deny; see `docs/rls.md` for the policy matrix.
- Avatars and member documents live in the public `avatars` and
  `member-documents` storage buckets.
- Reference seed data is generated by `npm run seed:generate` and loaded by
  `supabase db reset` via `supabase/seed.sql`.

## License

Private - YALI Rwanda Chapter