# UI/UX Audit - YALI AMS (Phase 0)

**Date:** 2026-11-12  
**Repo:** `YALI-AMS-FE` (Next.js 15.3.3, React 19, TypeScript 6, Tailwind CSS v4, `@supabase/ssr`, TanStack Query)  
**Scope:** Phase 0 audit (no code changes). Supabase migration is in progress: `lib/supabase/`, `lib/data/*`, QueryProvider exist; many pages still depend on RTK stubs/legacy helpers.

## 1. Key Findings (verified)

### 1.1 Login & auth screens
- `app/page.tsx` renders a fully client `components/Home/LoginPage.tsx`; `components/Home/Header.tsx` uses raw `<img src="/yali.png" width={200} />` (no `alt`, no height/aspect ratio, not optimized).
- Form issues: no `autoComplete` (`email`, `current-password`), no `inputMode`/`enterKeyHint`, no `aria-invalid`/`aria-describedby`, no `aria-live` error region, no show/hide password, no caps-lock hint, errors not announced.
- `Forgot password?` is `<a href="/forgot-password">` (full reload) instead of `next/link`.
- Primary button: `bg-primary hover:bg-primary` (no visual change), disabled via opacity only; no `aria-busy`/loading semantics.
- General error rendered conditionally but not persisted accessibly; no focus management on submit failure. No copy for invited users/session-expired/password-reset-success states in login flow.
- Forgot/reset pages (`components/Home/ForgotPassword.tsx`, `ResetPassword.tsx`) still use RTK Query hooks (`@/lib/features/authSlice`), hard-coded colors, `<a>`/`Link` mix, auto-dismiss API errors (5s), client-only shells.

### 1.2 Dashboard shell
- `app/dashboard/layout.tsx` is a server wrapper returning client `components/Other/Layout.tsx`.
- `Layout.tsx`: client component fetches display name via Supabase `getUser()` in effect; sidebar open by default (`true`); content pushed with fixed margins `ml-60`/`ml-20`. No mobile drawer/off-canvas, no overlay, no focus trap, no Escape/route-close handling, no scroll lock.
- `components/parts/DashboardSidebar.tsx`: fixed `w-64/w-20`, `left-0 top-0 z-30`, `shadow-xl`; collapsed labels only on hover (`group-hover:opacity-100`)—no keyboard focus/touch support. Logo raw `<img>`.
- `components/Other/Sidebar.tsx`: navigation data mixes `react-icons/md` and `lucide-react`; hard-coded colors (`text-gray-*`, `bg-gray-100`, `bg-blue-100`).
- Header: menu toggle + notification bell + welcome text; not responsive; no skip-to-content, no landmarks beyond basic tags, no breadcrumb/page-header pattern enforced.

### 1.3 Dashboard home
- `components/DashboardPages/DashboardHome.tsx` is fully client (`"use client"`), fetches stats via React Query on client; request waterfall/skeleton-after-JS.
- Cards: hard-coded palette (`blue/amber/green/red`), `shadow-xl/2xl`, `hover:-translate-y-0.5`, fixed/min heights implied; inconsistent spacing/typography.
- Activity trend placeholder ("migration pending"); Top Members placeholder; no accessible chart/summary/empty states.

### 1.4 Design system, tokens, typography
- `app/globals.css`: render-blocking `@import url("https://fonts.googleapis.com/css2?family=Stack+Sans+Text...")` and global `* { font-family }` instead of `next/font`.
- `--primary: #67bed9` (brand). **Contrast:** white on `#67bed9` ≈ **2.11:1** (fails WCAG AA for normal text 4.5:1 and UI/component text 3:1 in button contexts). Current active nav/buttons/links rely on this pairing.
- Dual token systems: shadcn-like CSS vars (`--background`, `--card`, `--ring`, `.dark`) and pervasive hard-coded classes (`bg-white`, `text-gray-*`, `bg-gray-100`, `border-blue-200`). `.dark` exists but components ignore semantic vars; dark `--primary` becomes near-white—dark mode is effectively broken/incomplete.
- Global chat styles `.message { width: 50% }`, `.sent/.received` fixed behaviors break on small screens.
- Tailwind v4 present (`@tailwindcss/postcss`, `@theme inline`), but components still use v3-ish patterns in places (`focus:ring-opacity-50` in Button).

### 1.5 Components & duplication
- `components/ui/`: `Button.tsx`, `input.tsx`, `TailInput.tsx`, `select.tsx`, `tail-select.tsx`, `textarea.tsx`, `tail-phone.tsx`, `combobox.tsx`, `multi-select-search.tsx`, `filter-dropdown.tsx`, `modal-button.tsx`, `skeleton.tsx`, `chip.tsx`, `role-chip.tsx`, `toggle-switch.tsx`, `rich-text-editor.tsx`, `DisplayField.tsx`, `input-error.tsx`, `tail0alert.tsx` (plus modals in `components/parts/models/`).
- Multiple overlapping form/input primitives and alert patterns; `PageHeader` depends on `react-icons` types and `GoBlocked`.
- Raw `<img>` usages (7): `components/Home/Header.tsx`, `components/parts/DashboardSidebar.tsx`, `components/parts/ChatInput.tsx`, `components/DashboardPages/ProfilePage.tsx`, `components/DashboardPages/UpdateProfilepage.tsx`, `components/DashboardPages/IndividualChatPage.tsx`, `components/parts/insertUser/AddPersonalInfo.tsx`.
- Client components: ~57 files marked `"use client"` out of ~70 component/app TSX files scanned (many candidates for server/layout/island split).
- Icon libs duplicated: `lucide-react` and `react-icons` (many `react-icons` imports across app/components/helpers).
- Other deps: `toastify-js`, `accessibility` widget (`AccessibilityLoader`), `exceljs` (risk of client bundle weight), `next` `^15.3.3` vs `eslint-config-next` `16.2.12` mismatch.

### 1.6 Tables/lists
- `MembersPage.tsx`: client-side table with `whitespace-nowrap` columns, icon-only actions without accessible names, status conveyed partly by color/title; horizontal scroll on small screens, not a mobile card/list pattern. Server/client pagination & filters partially migrated but UX not mobile-first.

### 1.7 Other pages (spot-check)
- Chat/group pages use legacy/global message styles and likely client-heavy implementations.
- Profile/update, organizations, notifications, settings, data, matching need consistent PageHeader, responsive layouts, loading/empty/error states, accessible controls (to be confirmed per-page in Phase 5).

## 2. Viewport observations (code-based, to validate visually in implementation)
- **360px:** sidebar margin/persistent nav will constrain content; tables overflow horizontally; login card generally fits but spacing/brand panel N/A; chat bubbles at 50% width problematic.
- **768px:** mixed density; sidebar behavior ambiguous without drawer/collapse rules; tables usable with scroll but actions cramped.
- **1280px:** desktop layout works structurally but visual consistency, contrast, and hierarchy need systemization.

## 3. Proposed token & contrast scale (brand-derived)

Brand base: `#67bed9` (kept for highlights/background accents). **Accessible primary for text-on-solid and white-on-solid UI:** use darker steps for buttons, links, active nav, focus-critical fills.

| Token | Hex | Contrast on white | White on token | Intended use |
|---|---:|---:|---:|---|
| `--brand-50` | `#eff9fc` | 1.07:1 | 1.07:1 | subtle bg/tint only |
| `--brand-100` | `#d9f0f7` | 1.18:1 | 1.18:1 | subtle bg/tint |
| `--brand-200` | `#b6e1f0` | 1.40:1 | 1.40:1 | borders/illustration accents |
| `--brand-300` | `#84cce4` | 1.79:1 | 1.79:1 | decorative accents |
| `--brand-400` (logo/base) | `#67bed9` | 2.11:1 | 2.11:1 | brand highlight, non-text fills on dark surfaces only with care |
| `--brand-500` | `#3aa5c7` | 2.84:1 | 2.84:1 | large/non-critical accents (not body text on white) |
| `--brand-600` | `#1f86a8` | 4.17:1 | 4.17:1 | **primary buttons/active states (large/bold text) & icons >=3:1; borderline for small white text** |
| `--brand-700` | `#186d89` | 5.85:1 | 5.85:1 | **preferred primary (white text >=4.5:1), links on white, active nav** |
| `--brand-800` | `#185a71` | 7.66:1 | 7.66:1 | hover/pressed primary, high-contrast accents |
| `--brand-900` | `#184b5d` | 9.53:1 | 9.53:1 | headings/emphasis on light |
| `--brand-950` | `#0c3140` | 13.73:1 | 13.73:1 | dark brand surfaces/text |

**Proposal:** set semantic `--primary` (action fill) to `--brand-700` (or `--brand-600` only for large/bold with verified >=3:1 non-text where applicable; prefer 700 globally for safety), `--primary-foreground` to white, use `--brand-400` for highlights/charts backgrounds/badges-with-dark-text as appropriate. Keep neutrals via slate/gray semantic scale, success/warn/error with AA-compliant pairs.

## 4. Component inventory (consolidate/keep/delete)

| Component/file | Decision | Notes |
|---|---|---|
| `ui/Button.tsx` | **Consolidate/Rewrite** | Tailwind 4 focus-visible, variants (primary/secondary/ghost/destructive), sizes, loading+aria-busy, icon-only requires aria-label, `type="button"` default. |
| `ui/input.tsx` | **Consolidate** | Merge into canonical `Input` + `Field` wiring. |
| `ui/TailInput.tsx` | **Delete (migrate)** | Duplicate; replace usages with `Field`+`Input/Textarea`. |
| `ui/input-error.tsx` | **Consolidate** | Fold into `Field` error/hint pattern with `aria-describedby`. |
| `ui/tail0alert.tsx` | **Delete (migrate)** | Replace with inline `Alert`/toast patterns using tokens. |
| `ui/select.tsx`, `ui/tail-select.tsx` | **Consolidate** | One `Select` (Radix-based for a11y) + native fallback where needed. |
| `ui/textarea.tsx` | **Keep/Refactor** | Align with Field, auto-grow option for chat/composer. |
| `ui/combobox.tsx` | **Keep/Refactor** | Ensure keyboard, aria, mobile behavior. |
| `ui/multi-select-search.tsx` | **Keep/Refactor** | Accessible labels, chips, clear actions. |
| `ui/filter-dropdown.tsx` | **Consolidate** | Become filter menu/sheet primitive for tables. |
| `ui/tail-phone.tsx` | **Keep/Refactor** | Validate, format, accessible label/hint. |
| `ui/modal-button.tsx` | **Delete/Merge** | Use `Button` variants inside `Dialog`. |
| `ui/skeleton.tsx` | **Keep/Refactor** | Tokenized, dimension-matched variants. |
| `ui/DisplayField.tsx` | **Keep** | Useful read-only/profile display; tokenized. |
| `ui/chip.tsx`, `ui/role-chip.tsx` | **Consolidate** | `Badge/StatusChip` with semantic variants (not color-only). |
| `ui/toggle-switch.tsx` | **Keep/Refactor** | Accessible switch semantics. |
| `ui/rich-text-editor.tsx` | **Keep/Lazy-load** | Heavy; dynamic import, accessible toolbar/labels. |
| `parts/models/*` (Modal, confirmModal, etc.) | **Consolidate** | Shared `Dialog/Drawer` (focus trap, Escape, aria-modal, return focus, scroll lock). |
| `parts/PageHeader.tsx` | **Rewrite** | Remove `react-icons` dependency, responsive, slots for actions/breadcrumbs. |
| New primitives | **Add** | `Field`, `PasswordInput`, `Avatar`, `EmptyState`, `DataTable` helpers, `Toast` provider, `Dropdown/Menu`, `Tabs`, `Tooltip`, `Card` variants. |

## 5. Page-by-page plan (after approval)

- **Phase 1 (Login/auth):** `/`, `/forgot-password`, `/reset-password/[token]`, `/dashboard/change-password`. Server shells + client form islands, `next/image` logo, `next/font`, Zod schemas, accessible fields/errors/loading, `next/link`, remove console leaks, migrate forgot/reset off RTK to Supabase-compatible flow where applicable.
- **Phase 2 (Shell):** server `dashboard/layout`, responsive grid shell, off-canvas drawer `<lg` + collapsible sidebar `lg+`, header/user menu/notification island, skip link/landmarks, `loading.tsx`/`error.tsx`, accessible `SessionExpired` handling.
- **Phase 3 (Home):** server data + Suspense per card, responsive stat grid, tokenized cards, accessible/lazy chart, empty/personal states (confirm product choice).
- **Phase 4 (Design system):** tokens in `@theme`, `cn`, consolidated UI primitives, `next/image` replacements, lucide-only icons, shared Dialog/Toast, docs.
- **Phase 5 (Pages):** Members (mobile cards/table), Profile/Update/Add member, Organizations, Chat/Groups, AI Matching, Notifications, Data/Settings/Change password.
- **Phase 6 (Performance):** budgets, RSC/streaming, dynamic imports (`exceljs`, editor, chart, accessibility widget), `@next/bundle-analyzer`, font/image optimization, Web Vitals reporting.
- **Phase 7 (A11y & QA):** WCAG 2.2 AA pass, axe/Playwright/Lighthouse CI, viewport/matrix tests, lint/type alignment.

## 6. Risks / dependencies
- Supabase migration in-progress: UI revamp must stay data-layer-agnostic where specified; avoid reintroducing Redux/token storage.
- Forgot/reset currently coupled to RTK/auth API slices; needs careful migration to Supabase auth flows without breaking behavior.
- Large number of `"use client"` components and duplicate primitives means migration must be incremental to keep app shippable.
- `eslint-config-next` (16.x) vs `next` (15.x) mismatch may affect lint reliability—align in Phase 7 or earlier if blocking.

## 7. Proposed execution discipline
- Work on `ui/revamp` branch, small commits per concern/phase step.
- Keep routes/contracts intact; no product behavior changes unless specified.
- Document before/after measurements and decisions in `docs/`.

## 8. Phase 1 execution notes (2026-11-12, branch `ui/revamp`)

### Decisions applied (per approval)
- No dark/light mode for now: removed `.dark` token overrides and set single semantic light token system.
- i18n scaffolding added now: `lib/i18n/en.ts`, `lib/i18n/index.ts` (translations deferred; components should avoid layout assumptions that break with longer strings).
- Logo kept as-is (`/public/yali.png`) and rendered via `next/image` with alt/dimensions/priority on auth screens.
- No PWA for now.
- Brand: accessible primary scale derived from `#67bed9` (see contrast table above); `--primary` set to `brand-700` (white-on-primary 5.85:1).

### Implemented (auth/UI foundation slice)
- `app/globals.css`: removed render-blocking Google Fonts `@import` and global `* { font-family }`; added brand/semantic tokens, `@theme` mappings, focus-visible and `prefers-reduced-motion` defaults; removed dead dark-mode block.
- `app/layout.tsx`: `next/font` (`Source_Sans_3`, swap, variable), skip-to-content link, semantic classes.
- `app/page.tsx` + `components/Home/LoginForm.tsx`: server page shell + client form island (Suspense). Accessible login form with Zod validation, focus-first-invalid, `autoComplete`/`inputMode`/`enterKeyHint`, `aria-invalid`/`aria-describedby`, live status/error regions, show/hide password (`aria-pressed`), caps-lock hint, loading/`aria-busy`, `next/link` forgot-password, invited-user helper copy, session-expired/reset-success notices via query params, safe same-origin `next` redirect handling, no credential/error logging. Responsive layout with `lg+` brand panel.
- `app/forgot-password/page.tsx` + `components/Home/ForgotPassword.tsx`: migrated from RTK slice to Supabase `resetPasswordForEmail`, accessible form, persistent success/error (no auto-dismiss), generic non-enumerating response.
- `app/reset-password/[token]/page.tsx` + `components/Home/ResetPassword.tsx`: Supabase recovery/update flow, accessible validation, password visibility toggles, sign-out after reset, clear expired-link handling.
- `app/dashboard/change-password/page.tsx` + `components/DashboardPages/ResetPassword.tsx`: Supabase re-auth + password update + sign-out, accessible fields/status.
- `lib/data/auth.ts`: added `requestPasswordReset`, `updatePassword` helpers.
- Docs added/updated: `docs/ui-audit.md`, `docs/ui-components.md`, `docs/ui-performance.md`.

### Verification
- `cd YALI-AMS-FE && npx tsc --noEmit --pretty false` → **pass** (no errors).
- `npm run lint` → **blocked by existing tooling mismatch**: `next lint` deprecated path + invalid ESLint options with current setup (`eslint@10`, `eslint-config-next@16.2.12`, `next@15.3.3`). Not introduced by this change; to be aligned in Phase 7.
- Manual QA (Lighthouse/axe/viewport/screen-reader/device matrix) not run in this environment; required before phase sign-off.

### Known gaps / follow-ups
- Legacy login components (`components/Home/LoginPage.tsx`, `Header.tsx`) remain in repo but are no longer used by `/`; can be removed after confirming no other imports.
- Forgot/reset behavior depends on Supabase recovery redirect/session configuration (`/reset-password` handling, email templates) — must be validated against real env.
- Dashboard still uses old shell/tokens/components; Phase 2+ will address.
- `PageHeader` still typed around `react-icons` (used by change-password page) — to be refactored in Phase 4.

## 9. Phase 1 status (ready for review)

**Implemented & verified (local):**
- Supabase-only auth flows for login, forgot password, reset/recovery (`/auth/callback` exchange + `/reset-password/recover`), and dashboard change-password.
- Accessible auth UI: server shells + client islands, `next/image` logo, `next/font`, Zod validation, focus-on-error, labels/`aria-invalid`/`aria-describedby`/live regions, show/hide password, caps-lock hint, loading/`aria-busy`, `next/link`, safe `next` redirect, no auto-dismiss errors, no credential logging.
- Middleware guards missing Supabase env (prevents 500), protects `/dashboard`, allows recovery/reset routes, sets `session_expired` + `next` on redirect.
- Tokenized brand scale, `--primary` = `brand-700` (AA), semantic tokens, reduced-motion/focus-visible defaults, skip link (focusable), `main#main-content` on auth pages.
- Typecheck/build pass (`npx tsc --noEmit`, `next build`).

**Lighthouse:** attempted (see `docs/ui-performance.md`); environment had stale-build/chrome-interstitial issues after rebuilds, so final automated scores need rerun in a clean local/CI environment with real Supabase config. Earlier valid run: Perf 99 / A11y 96 / BP 100 before final landmark/skip/autocomplete fixes.

**Proceeding to Phase 2** (dashboard shell: server layout, responsive drawer/sidebar, header, landmarks, loading/error states) as requested.

## 10. Phase 2 progress (dashboard shell) - 2026-11-12

### Implemented
- `app/dashboard/layout.tsx`: switched to `DashboardShell`.
- `components/Other/DashboardShell.tsx` (new): responsive shell with landmarks (`header`, `main#main-content`, `footer`), mobile off-canvas drawer (`<lg`, overlay, Escape to close, scroll lock, `aria-modal`/labels, closes on route change), desktop persistent sidebar collapsible (`lg+`), CSS flex/grid layout (removed `ml-60/ml-20`), header with menu/collapse controls, notification bell, responsive welcome text.
- `components/parts/DashboardSidebar.tsx`: rewritten (lucide icons, `next/image` logo, tokenized styles, `aria-current="page"`, collapsed labels visible on hover and keyboard focus).
- `components/Other/Sidebar.tsx`: typed navigation config with lucide icon components (no JSX icons, no `react-icons`).
- `components/parts/SidebarFooter.tsx`, `components/Other/NotificationBell.tsx`: tokenized/accessible updates (lucide, focus/escape/aria improvements).
- `app/dashboard/loading.tsx`, `app/dashboard/error.tsx`: accessible loading/error states.
- Removed legacy `components/Other/Layout.tsx`.

### Verification
- `npx tsc --noEmit --pretty false`: pass.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key npm run build`: pass.
- Local prod (`:3104`): `/` 200, `/dashboard` 307 -> `/?error=session_expired&next=%2Fdashboard` (unauthenticated guard working).

### Pending / follow-ups
- Persist sidebar collapsed preference (cookie/localStorage) and add full focus trap in mobile drawer.
- Authenticated dashboard Lighthouse/axe/keyboard+SR QA requires real Supabase session/data.
- Many dashboard pages/components still use hard-coded colors, `react-icons`, and legacy `PageHeader` (Phases 3-5).
