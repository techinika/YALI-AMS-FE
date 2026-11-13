# YALI AMS Frontend

Next.js frontend for the YALI Rwanda Chapter Alumni Management System (AMS). The app is being migrated from a separate Express/MySQL backend to a single Next.js + Supabase application (Postgres, Auth, Realtime, Storage).

## Current Migration Status

- **Phase 3 (in progress):** Supabase SSR client utilities, root middleware for session refresh/route protection, initial typed data-access layer (`lib/data/*`), Supabase-based login/sign-out/layout shell, and role-aware sidebar/admin guard using Supabase user metadata.
- **Legacy state still present:** many dashboard/feature pages still depend on retired RTK Query/socket/Express API integrations and are backed by temporary compatibility stubs until migrated to Supabase services and queries.

## Prerequisites

- Node.js 18+
- npm
- Supabase project (URL + anon key)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and set values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

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

## Supabase Foundation (Phase 3)

- `lib/supabase/{client.ts,server.ts,middleware.ts}`: browser/server/middleware Supabase clients (`@supabase/ssr`)
- `middleware.ts`: refreshes session cookies and protects `/dashboard` routes; redirects authenticated users away from auth routes
- `lib/data/*`: typed data-access entry points (`getSupabaseBrowserClient`, `getSupabaseServerClient`, auth helpers, `useCurrentUser`, placeholder `Database` type)
- Auth UI shell: login via `signInWithPassword`, sign-out via Supabase, role-aware navigation/admin access checks using Supabase user metadata

## Legacy Compatibility (temporary)

To keep the app compiling while migrating feature modules, compatibility stubs remain for removed Redux/RTK Query/socket helpers (`lib/hooks.ts`, `lib/sockets.ts`, `lib/features/*`, `helpers/auth.ts`, `helpers/logout.ts`, `components/Other/AccessDashboard.tsx` `AuthGuard`). Pages using these stubs may render empty/non-functional data until migrated to `lib/data/*` and Supabase services.

## Notes

- Replace `lib/data/types.ts` with generated Supabase types when schema is available (`supabase gen types typescript`).
- Do not commit secrets; use `.env.local` for local credentials.

## License

Private - YALI Rwanda Chapter
