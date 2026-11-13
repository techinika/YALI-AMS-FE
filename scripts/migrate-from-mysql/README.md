# MySQL → Supabase migration tooling

One-off, idempotent script that migrates the legacy YALI-AMS Express/MySQL data
into the single Supabase codebase. It never writes to MySQL; it only reads from
MySQL and upserts into Supabase (Auth, Postgres, Storage).

Location: `scripts/migrate-from-mysql/`

```
index.mjs          CLI + orchestration
config.mjs         env/arg parsing, safety guards
source.mjs         read-only MySQL client + legacy queries
target.mjs         Supabase writes (Auth admin, Data API, Storage)
target-helpers.mjs Data API upsert wrappers
reference.mjs      legacy→target reference id maps + ensure seed gaps
steps.mjs          migration steps (users, orgs, chat, notifications, ...)
verify.mjs         row-count + checksum verification
report.mjs         JSON + Markdown report
uuid.mjs           deterministic UUID v5
transform.mjs      pure mapping helpers
README.md          this file
```

## Prerequisites

- Node 20+ (global `fetch` for avatar downloads)
- Read access to the legacy MySQL/MariaDB database
- Supabase service role key + URL for the target project
- The Supabase schema already applied (`supabase db reset`)
- The `avatars` Storage bucket created (migration 0009 creates it)

## Environment variables

Copy `.env.example` to a working file (e.g. `.migrate.env`) and fill it. Do not
commit secrets.

```
DATABASE_URL=mysql://user:pass@host:3306/db   # or DATABASE_HOST/USER/PASSWORD/NAME/PORT
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
SUPABASE_ANON_KEY=<anon key>                  # optional, for password-hash verification
SUPABASE_DB_URL=postgresql://...              # optional, direct PG (unused; Data API used)
SUPABASE_AVATARS_BUCKET=avatars
MIGRATION_SOURCE_ENV=.migrate.env
MIGRATION_BATCH_SIZE=500
MIGRATION_DRY_RUN=true
MIGRATION_STEPS=users,organizations,chat,notifications,matchmaking,activity,avatars
MIGRATION_CONFIRM_PRODUCTION=false
MIGRATION_SKIP_CHECKSUM=false
MIGRATION_REPORT_DIR=scripts/migrate-from-mysql/reports
```

## Safety

- The script connects to MySQL read-only and issues only `SELECT` statements.
- Target writes are upserts keyed by id, so re-running is idempotent.
- A non-localhost target **requires** `MIGRATION_CONFIRM_PRODUCTION=true`.
- Always take a Supabase DB backup/snapshot and a MySQL dump before running
  against production. Never run against production without an explicit go-ahead.
- Run during a write freeze; the legacy app should be stopped while migrating.

## Usage

```bash
# Dry run: read MySQL, transform, print counts, write nothing
MIGRATION_DRY_RUN=true npm run migrate:mysql

# Run all steps against localhost target
npm run migrate:mysql

# Run only a subset
MIGRATION_STEPS=users,organizations npm run migrate:mysql

# Limit rows (testing)
MIGRATION_LIMIT=50 npm run migrate:mysql

# Verify password-hash import on a known test user
MIGRATION_SOURCE_ENV=.migrate.env \
  npm run migrate:mysql -- --verify-password-email admin@example.com --verify-password 'CorrectHorseBatteryStaple'
```

Password hashes are imported via Supabase Auth `admin.createUser({ password_hash })`
so existing users can keep their passwords. Supabase supports bcrypt. The script
verifies hash compatibility on a test user (if `--verify-password-*` given); if
verification fails it skips password import for all users and reports it, so the
operator can fall back to forced password resets.

## Steps (in order)

1. `users` — auth.users + profiles (role/status/map, search_text)
2. `organizations` — organizations, user_organizations, working-sector links
3. `chat` — conversations/group messages/private conversations/messages
4. `notifications` — notifications + notification templates
5. `matchmaking` — matchmaking requests + items
6. `activity` — activity logs
7. `avatars` — download Cloudinary images → Storage `avatars/` → `profiles.avatar_path`

## Verification

After the run, `scripts/migrate-from-mysql/reports/<ts>/migration-report.json`
and `.md` contain per-table source/target counts and SHA-256 checksums for
direct-mapped tables (profiles, notifications, matchmaking requests/items,
activity logs). Review mismatches before cutover.

## Rollback

See `docs/migration-rollback.md`. The safest rollback is to restore the
Supabase snapshot taken before the migration; the script does not delete data.