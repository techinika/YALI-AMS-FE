# YALI AMS

YALI Rwanda Chapter Alumni Management System — a single Next.js application backed
by Supabase (Postgres, Auth, Storage, Realtime, Edge Functions, pgvector).

This repository replaces the former two-codebase architecture
(`YALI-AMS-FE` Next.js + `YALI-AMS-BE` Express/Prisma/MySQL). The Express
backend, Redis, BullMQ, Prisma and Socket.IO are retired.

> Current status: **Single-repo migration complete.** The Next.js app, Supabase
> migrations, Edge Functions and the MySQL migration tooling now live in this
> repository; the Express/MySQL backend is retired. The database has not been
> applied to a hosted project yet, so run `npm run db:start && npm run db:reset`
> (Docker required) before pointing the app at it.

## Requirements

- Node.js 20+
- Docker (for the local Supabase stack)
- Supabase CLI (installed as a dev dependency)

## Setup

```bash
npm install
npm run db:start      # starts Supabase locally (Docker)
npm run db:reset      # applies migrations + seed
npm run types         # regenerates supabase/types/database.ts
```

The local stack exposes:

- API: http://127.0.0.1:54321
- Studio: http://127.0.0.1:54323
- Postgres: 127.0.0.1:54322

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values. Client-exposed
variables are prefixed `NEXT_PUBLIC_`; server-only secrets never are.

## Edge Functions

Both functions use the service-role key, verify the caller's JWT and require an
admin `profiles.role` for privileged actions.

```bash
npx supabase functions deploy admin-members
npx supabase functions deploy matchmaking
npx supabase functions logs admin-members
```

They are Deno/TypeScript and are excluded from the Next.js `tsconfig`; type-check
them with `deno check supabase/functions/*/index.ts` (requires Deno).

## Database migrations

Migrations live in `supabase/migrations/` and are applied in filename order.

```bash
npm run db:reset                # rebuild the local DB from scratch (applies migrations + seed)
npx supabase migration new <name>  # create a new migration
npx supabase db push            # apply migrations to the linked project
npx supabase functions deploy admin-members
npx supabase functions deploy matchmaking
```

Never edit an applied migration; create a new one instead.

## Layout

```
app/                 Next.js App Router
components/          UI components
lib/                 Supabase clients, data access, validations
supabase/
  config.toml        local Supabase config
  migrations/        SQL migrations
  seed.sql           reference data seed
  functions/         Edge Functions
  types/             generated database types
scripts/             one-off tooling
docs/                migration audit, RLS, cutover
```

## Documentation

- `docs/migration-audit.md` — Phase 0 audit and endpoint mapping
- `docs/phase-1.md` — foundation schema and verification steps
- `docs/rls.md` — Row Level Security policy matrix
- `docs/migration-rollback.md` — rollback/cutover procedure