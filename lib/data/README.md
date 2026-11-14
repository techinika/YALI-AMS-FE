# Data access layer

Typed Supabase access for the Next.js app.

- `client.ts` / `getSupabaseBrowserClient()`: browser (client components)
- `server.ts` / `getSupabaseServerClient()`: server components, route handlers, actions
- `auth.ts`: auth helpers (sign-in/out/session) built on the browser client
- `types.ts`: placeholder `Database` type; replace with generated Supabase types (`supabase gen types typescript`) when schema is available

Add domain modules here (e.g. `profiles.ts`, `notifications.ts`) instead of calling Supabase directly from UI components.
