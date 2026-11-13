# UI Components (in progress)

Phase 1 introduced/updated foundational pieces; full consolidation continues in Phase 4.

## Auth & primitives (Phase 1)
- `app/layout.tsx`: `next/font` (Source Sans 3) via CSS variable, skip-to-content link, semantic body classes.
- `app/globals.css`: tokenized brand scale (`--brand-50..950`), accessible `--primary` (`brand-700`, white-on-primary 5.85:1), semantic color tokens, reduced-motion and focus-visible defaults. Dark mode tokens removed for now.
- `lib/i18n/en.ts`, `lib/i18n/index.ts`: initial i18n message scaffold (translations to be added later; avoid hard-coded layout assumptions).
- `components/Home/LoginForm.tsx`: accessible login form (server page shell + client island), Zod validation, focus-on-error, `aria-invalid`/`aria-describedby`/live regions, autocomplete/input hints, show/hide password with `aria-pressed`, caps-lock hint, `next/link`, safe `next` redirect handling, no credential/error logging.
- `components/Home/ForgotPassword.tsx`, `components/Home/ResetPassword.tsx`: Supabase auth flows (no RTK), accessible forms, persistent status/errors (no auto-dismiss).
- `components/DashboardPages/ResetPassword.tsx` (change password): Supabase re-auth + update + sign-out flow, accessible fields.

## Conventions
- Use semantic tokens (`bg-primary`, `text-foreground`, `border-border`, etc.) over raw palette classes for new work.
- Prefer `lucide-react` icons going forward.
- Keep interactive controls >=44px touch target, visible `:focus-visible`, and announce errors/status via `role="alert"` / `aria-live`.
