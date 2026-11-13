# YALI AMS

YALI Rwanda Chapter Alumni Management System — a single Next.js application backed
by Supabase (Postgres, Auth, Storage, Realtime, Edge Functions, pgvector).

This repository replaces the former two-codebase architecture
(`YALI-AMS-FE` Next.js + `YALI-AMS-BE` Express/Prisma/MySQL). The Express
backend, Redis, BullMQ, Prisma and Socket.IO are retired.

> Current status: **Phase 1 — Supabase foundation.** The Next.js app is added in
> Phase 3; see `docs/phase-1.md` for what exists today and how to verify it.

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

## Database migrations

Migrations live in `supabase/migrations/` and are applied in filename order.

```bash
supabase migration new <name>   # create a new migration
supabase db reset               # rebuild the local DB from scratch
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
- `docs/rls.md` — Row Level Security policy matrix