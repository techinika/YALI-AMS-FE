# Migration rollback

## Before you migrate (preconditions)

1. Take a Supabase project backup/snapshot (or `pg_dump` of the target DB).
2. Take a MySQL dump of the legacy database.
3. Record the Cloudinary account/credentials (avatars source).
4. Stop writes to the legacy app (write freeze) and note the cutover timestamp.

## After a successful migration

The migration script is idempotent and only upserts; it does not delete target
data. If you need to undo a production migration:

### Option A — Restore snapshot (recommended)
Restore the pre-migration Supabase snapshot. This reverts Auth, Postgres and
Storage to their pre-migration state. Re-point DNS/env back to the legacy stack
if needed.

### Option B — Partial data removal (risky)
If only some steps ran and you want to remove just the migrated rows, delete by
the migration start timestamp or by the imported id ranges. Because user ids are
preserved from legacy UUIDs and profiles reference `auth.users`, deleting users
cascades to messages/notifications/etc. This is not recommended without careful
testing.

## Post-rollback verification

- Confirm legacy app is reachable and data intact.
- Confirm Supabase target is clean (or restored) before any retry.
- Re-run the migration only after fixing the issue that caused the rollback.

## Never

- Do not run the migration against production without an explicit go-ahead.
- Do not run without `MIGRATION_DRY_RUN=true` first.
- Do not edit an applied migration file; add a new migration instead.