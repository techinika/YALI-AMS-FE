# UI Performance Notes

## Phase 0 baseline (code audit, 2026-11-12)
- Render-blocking Google Fonts `@import` in `globals.css`; no `next/font`.
- Many client components (~57/70 TSX files scanned), client-heavy login/shell/dashboard with fetch-after-hydration patterns.
- Duplicate icon libraries (`react-icons` + `lucide-react`), `toastify-js`, accessibility widget, potential client `exceljs` usage.
- Raw `<img>` tags (7) instead of `next/image`.
- `next@^15.3.3` with `eslint-config-next@16.2.12` mismatch (lint CLI issues observed).

## Phase 1 changes
- Replaced render-blocking font import with `next/font` (`Source_Sans_3`, `display: swap`, CSS variable).
- Login page split into server page shell + client form island (`LoginForm`) with `Suspense` fallback.
- Logo rendered via `next/image` with `priority`, explicit dimensions, and `alt`.
- Auth screens migrated off RTK hooks to Supabase auth helpers where updated (reduces legacy coupling).
- Added tokenized CSS variables and removed `.dark` overrides (no dark mode for now).

## TODO (Phases 2-6)
- Convert dashboard shell/home to server-rendered + streaming/Suspense boundaries.
- Dynamic import heavy features (rich text editor, charts, import/export/exceljs, accessibility widget if kept).
- Remove `react-icons` and consolidate UI deps; run bundle analyzer and set budgets.
- Replace remaining raw `<img>` with `next/image`; add Web Vitals reporting.
- Capture before/after Lighthouse/Web Vitals and bundle sizes for login, dashboard, members.

## Lighthouse attempts (Phase 1, 2026-11-12)
- Built production with placeholder Supabase env for static audit; served on local port.
- First valid run against login (before final a11y fixes): **Performance 99, Accessibility 96, Best Practices 100** (fails: skip-link focusability, missing main landmark, autocomplete token). Metrics included TBT ~0 score impact minimal overall.
- After fixes (skip link `focus:absolute`, `main#main-content` on auth pages, `autoComplete="email"`), rebuild/restart runs were affected by stale server/build artifact mismatches in this environment (chunk/CSS 400s, Chrome interstitial `CHROME_INTERSTITIAL_ERROR` / `chrome-error://chromewebdata/`), preventing reliable final scores.
- **How to verify locally (with real env):**
  1. `cd YALI-AMS-FE && npm run build && npm run start -p 3100`
  2. `npx lighthouse http://localhost:3100/ --only-categories=performance,accessibility,best-practices --output=html --output-path=./docs/lh-login.html --chrome-flags="--headless=new"`
  3. Repeat for `/forgot-password` and `/reset-password/recover` (recovery flow needs valid Supabase session for full submit path).
- Expected post-fix: Accessibility improved (main landmark, skip-link focusable, autocomplete). Confirm LCP/INP/CLS and console cleanliness in target environment.

