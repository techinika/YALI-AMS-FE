# YALI AMS FRONTEND

A comprehensive Alumni Management System (AMS) built with Next.js, React, and Redux Toolkit for the YALI Rwanda Chapter.

**Developed by:** Ubunnifu Labs - Techinika Limited

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Features](#features)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Security](#security)
- [Performance Optimizations](#performance-optimizations)
- [Coding Standards](#coding-standards)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| State Management | Redux Toolkit + React-Redux |
| API Client | RTK Query |
| Component Variants | class-variance-authority (CVA) |
| Icons | Lucide React, React Icons |
| Sanitization | DOMPurify |
| Utilities | clsx, tailwind-merge, dayjs |
| Real-time | Socket.IO Client |

---

## Project Structure

```
AMS/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Authenticated dashboard pages
│   │   ├── organizations/  # Organizations management
│   │   ├── members/        # Member listings & registration
│   │   ├── matching/       # Matchmaking features
│   │   ├── notifications/  # Notification center
│   │   ├── profile/        # User profile pages
│   │   ├── chat/           # Private & group messaging
│   │   └── settings/       # App settings
│   └── ...                 # Auth pages (login, forgot-password, reset-password)
├── components/             # Reusable React components
│   ├── ui/                 # Base UI components (Button, inputs, selects)
│   ├── DashboardPages/     # Page-specific components
│   ├── Home/               # Landing/auth page components
│   ├── Data/               # Data management components
│   ├── Other/              # Layout and infrastructure components
│   └── parts/              # Shared partial components
├── lib/                    # Core library code
│   ├── features/           # Redux slices & RTK Query API services
│   ├── store.ts            # Redux store configuration
│   ├── hooks.ts            # Typed Redux hooks
│   ├── fetchBaseQuery.ts   # Base API query with auth & 401 handling
│   ├── sockets.ts          # Socket.IO singleton
│   └── toast.ts            # Toast notification helpers
├── helpers/                # Utility functions (auth, logout)
├── types/                  # TypeScript type definitions
│   ├── api.ts              # API request/response types
│   ├── user.ts             # Member, Organization, Role types
│   ├── message.ts          # Message, Group, GroupMember types
│   └── ...
└── public/                 # Static assets
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/techinika/YALI-AMS-FE.git
cd YALI-AMS-FE

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Environment Variables

Create a `.env` file with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:9000/api
NEXT_PUBLIC_WS_URL=ws://localhost:9000
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL for real-time features (defaults to `NEXT_PUBLIC_API_URL` if unset) |

> **Production:** Socket.IO is served by the same backend process as the REST API (no separate socket port). Point `NEXT_PUBLIC_WS_URL` at the API origin (e.g. `wss://api.example.com`) — the socket path `/ws/socket.io/` is appended automatically. Use `wss://` on HTTPS to avoid mixed-content blocks, and never ship localhost values in a production build.

---

## Features

### Dashboard Pages
- **Organizations** - Manage organizations, working sectors, and associations
- **Members** - View, search, filter, and register new members with Excel import/export; the directory loads server-side pages (20/page) with numbered pagination and a live total count, and bulk import runs in the background
- **Matching** - AI-powered member matching by interests with background processing, live status polling, and past-request history
- **Notifications** - Notification center with read/unread tracking, per-notification action buttons, and setup configuration
- **Profile** - User profile viewing and updates
- **Settings** - Application and account settings
- **Chat** - Private and group messaging with real-time Socket.IO

### Core Components
- `Button` - Unified button component with CVA variants (primary/danger/ghost) and sizes (sm/md/lg)
- `TailwindInput` - Reusable text/textarea input with label, error, and helper text support
- `TailwindSelect` - Reusable dropdown select component
- `MultiSelectSearch` - Searchable multi-select with chips
- `Combobox` - Searchable combobox with keyboard navigation, outside-click dismiss, clearable (replaces native selects)
- `PageHeader` - Standardized page header with actions
- `Skeleton` - 7 skeleton variants for loading states
- `NotificationBell` - Header notification bell with unread badge, socket-driven refresh, and dropdown panel

---

## State Management

### Redux Toolkit Slices

All slices are located in `lib/features/`:

| Slice | Purpose |
|-------|---------|
| `auth.ts` | Local auth state (user, token, isAuthenticated) |
| `authSlice.ts` | Auth API (login, logout, extend session, reset/change password) |
| `userSlice.ts` | Users API (CRUD, invite, import, export) |
| `orgSlice.ts` | Organizations API |
| `otherSlice.ts` | Reference data API (countries, districts, cohorts, tracks, sectors) |
| `notificationSlice.ts` | Notifications API |
| `activitySlice.ts` | Activity logs API |
| `matchMakingSlice.ts` | AI matchmaking API (submit request, history, live status polling) |
| `statsSlice.ts` | Dashboard statistics API (aggregate counts + 7-day activity trend) |
| `chatSlice.ts` | Chat API (private + group messaging, 19 endpoints) |

### RTK Query APIs

All API definitions use RTK Query with automatic caching and refetching. Endpoints are fully typed with explicit response and argument types. Each slice typically exports:
- `useXxxQuery` - Fetch data hooks
- `useXxxMutation` - Write operation hooks

### Typed Hooks (`lib/hooks.ts`)
- `useAppDispatch` - Typed dispatch
- `useAppSelector` - Typed selector

---

## API Integration

The app uses RTK Query for all API calls. Base configuration in `lib/fetchBaseQuery.ts` handles:
- Authorization headers (Bearer token from cookies)
- 401 response handling (dispatches `markSessionExpired` so the UI can offer to extend the session or log out — no silent wipe/redirect)
- Content-Type headers

---

## Security

- **XSS Protection** - All user-generated HTML content (notifications, rich text editor) is sanitized with DOMPurify before rendering via `dangerouslySetInnerHTML`
- **Session Expiry** - On 401, `baseQueryWithAuth` sets a `sessionExpired` flag that shows `SessionExpiredModal` (no automatic logout). The user can extend the session via `POST /auth/me/extend` (re-issues a 24h JWT) or log out. The dashboards `AuthGuard` also seeds Redux credentials from the cached user/token on mount, preventing a blank welcome header after a refresh
- **Auth Guard** - `AuthGuard` component protects dashboard routes, redirecting unauthenticated users
- **Role-based Access** - `OnlyAdmin` component restricts admin-only pages

---

## UI Consistency

- All modals (confirm dialogs, bulk import, invite member, organization link, create group, session-expired, shared `Modal`) share one shell — a `bg-black/50` backdrop with click-outside-to-close and a centered `rounded-2xl bg-white shadow-2xl` card — using `stopPropagation` so clicks inside the card never dismiss it.

---

## Performance Optimizations

### Organizations Page (`/organizations`)
- Replaced redundant `useState` + `useEffect` chains with direct `useMemo` for derived data
- Optimized data flow from RTK Query hooks to reduce re-render cycles
- Wrapped organization cards with `React.memo` to prevent unnecessary re-renders

### MultiSelectSearch Component
- Memoized `selectedOptions` and `filteredOptions` with `useMemo`
- Wrapped event handlers with `useCallback` for referential equality

### Members Page (`/members`)
- Created `MemberRow` component wrapped with `React.memo`
- Added `useCallback` for action handlers
- Implemented skeleton loading state instead of full-page spinner

### Notifications Page (`/notifications`)
- Created `NotificationItemRow` component wrapped with `React.memo`
- Implemented skeleton loading state with `NotificationSkeleton` component

### Dashboard Home (`/dashboard`)
- Wrapped `StatCard`, `TopUsersCard`, and `ActivityTrendCard` components with `React.memo`
- Used static Tailwind class maps instead of dynamic string interpolation
- Implemented skeleton loading state for loading states
- **7-Day Activity Trend** rendered as a CSS bar chart fed by `GET /stats/activity-trend` (`useActivityTrendQuery`), with per-day message counts and weekday labels — no chart library dependency

### RTK Query Optimizations
- Added `invalidatesTags` to mutation endpoints for automatic cache invalidation
- Added `tagTypes` configuration for proper cache management
- All endpoints fully typed with explicit generics for better developer experience
- Split the shared `"Data"` tag into per-domain tags (`Countries`, `States`, `Districts`, `Sectors`, `Genders`, `Cohorts`, `Tracks`, `WorkingSectors`) so refetching one domain no longer invalidates all reference data
- Added `keepUnusedDataFor: 300` on reference-data endpoints to keep dropdown data cached in memory
- `statesByCountry` and `sectorsByDistrict` cache by tagged IDs to avoid redundant fetches

### Reference Data Prefetching
- Created `RefDataPrefetcher` (mounted in the dashboard `Layout`) that subscribes to countries, districts, genders, cohorts, tracks, and working sectors so dropdowns open instantly without per-page loading states

### Combobox Migration
- Created a shared searchable `Combobox` (`components/ui/combobox.tsx`) with typeahead search, keyboard navigation (Arrow/Enter/Escape), outside-click dismiss, and clearable selection
- Replaced large native `<select>` elements with `Combobox` in personal/employed/founded-info forms, profile update pages, and the organizations page
- Removed intermediate `useState`/`useEffect` state-sync pairs — RTK Query data is now consumed directly

### Members Page
- Removed the all-or-nothing `isAnyLoading` blocker; the table skeleton now only shows while members load and filters render immediately
- Removed native country FilterDropdown in favor of the shared Combobox
- **Server-side pagination:** the directory is fetched 20 rows at a time via `useLazyUsersQuery({ page, limit: 20 })`. Numbered page buttons (with ellipses for large page counts), plus Previous/Next links, drive page changes — replacing the old infinite-scroll loader. The footer shows "Page X of Y" and the summary line shows "Showing X of Y members" using the backend `total`. The shared `users` query defaults to `limit=500` / falls back to the backend default of 100 (max 1000)
- `ProfilePage` waits on the auth user / `getOneUser` result before rendering (via `getUserOrCache` in `helpers/auth.ts`), with a guard that skips the update submit until the target user has loaded — no more flash-of-empty screens or bogus empty submits

### Private Chat (`/chat`)
- The backend now returns private chats paginated (default 200, max 500, newest-first); `IndividualChatPage` re-sorts replies by `createdAt desc` so the conversation stays in the expected order regardless of page size
- The chat layout fills the viewport cleanly at `80vh` with its own internal scroll (sidebar, message list, and composer), so the page never overflows into the layout's footer
- Switching recipients clears the previous conversation's messages immediately (tracked via a ref), so opening a new chat — from the sidebar or the "Start new chat" user search — shows an empty conversation instead of stale messages below the new header
- The sidebar's user search and the member list share a single `useUsersQuery` instance (the duplicate query hook was removed), reducing API traffic and avoiding rate-limit (423) errors during quick chat switching

### AI Matchmaking Page (`/matching`)
- Interest dropdown now closes on outside click (container ref + `mousedown` listener)
- Past-requests section renders real data from `useGetMatchmakingHistoryQuery` instead of dummy entries, with an explicit empty state ("No matchmaking requests yet") when the user has no history
- Live status polling via `useGetMatchmakingStatusQuery` (polls every 3s while `pending`, stops on `completed`/`failed`) with socket-driven result refresh

### Notification Bell
- Added `NotificationBell` to the dashboard header with an unread count badge and dropdown panel
- Listens for `new-message`, `new-group-message`, and `notification:new` socket events to refresh the unread list in real time, with a 30s polling fallback
- Clicking an item marks it opened (via `openNotification`) and routes to the notifications page

### Notification Actions
- Notification templates (`/dashboard/data`) let admins attach actions (Confirm to update / Decline to update / Login); the selected action ids are stored on the template's `link`
- The profile-update cron stamps each notification with that `link`, and the notifications page renders a matching button in the detail view — Confirm routes to `/dashboard/profile/update`, Decline to `/dashboard/profile` (both mark the notification read first)

### Bulk Import
- Importing members is now fire-and-forget: `ImportMembersModal` submits the parsed rows and closes on a `202`, showing "Import started in the background...". The backend worker sends a success/failure notification when the job finishes

### Socket.IO
- Singleton pattern (`lib/sockets.ts`) with `hasListeners()` guard to prevent event handler duplication on reconnect
- Uses `["polling", "websocket"]` transports so real-time falls back to HTTP long-polling when a reverse proxy does not forward WebSocket upgrade headers
- JWT is passed via `socket.handshake.auth.token` (read from the auth cookie) and verified server-side
- **Single-writer messaging:** the REST endpoints persist messages; the backend broadcasts `new-message` / `new-group-message` events over the socket. The client subscribes with `socket.on(...)` and dedupes incoming messages by `id` — it does not re-emit `send-message` (which previously caused duplicate rows)
- **Group rooms:** the group chat page emits `join-group` when the active group changes so members receive `new-group-message` broadcasts for that group only

### Skeleton Components (`components/ui/skeleton.tsx`)
- `Skeleton` - Base skeleton component with animation
- `TableRowSkeleton` - Table row placeholder for lists
- `CardSkeleton` - Card placeholder for grid layouts
- `NotificationSkeleton` - Notification item placeholder
- `StatsCardSkeleton` - Statistics card placeholder
- `ListSkeleton` - Generic list placeholder
- `PageSkeleton` - Full page loading state

### Best Practices Applied
- Use `React.memo` for functional components to prevent unnecessary re-renders
- Use `useMemo` for expensive computations
- Use `useCallback` for callback functions passed to child components
- Avoid copying API data to local state when possible - derive directly from RTK Query
- Replace spinner loaders with skeleton UI for better perceived performance

---

## Coding Standards

### Component Structure
```tsx
"use client";

import React, { useState, useMemo, useCallback } from "react";

export const ComponentName = React.memo(({ prop1, prop2 }: Props) => {
  // Hooks first
  const [state, setState] = useState("");
  
  // Memoized values
  const derived = useMemo(() => compute(), [deps]);
  
  // Handlers
  const handleClick = useCallback(() => {}, [deps]);
  
  return <div>...</div>;
});
```

### UI Components
- All reusable UI components go in `components/ui/`
- Use PascalCase file naming (e.g., `Button.tsx`, `TailInput.tsx`)
- Use Tailwind CSS for styling
- Use CVA for variant-based components
- Define TypeScript interfaces for props (no `any`)

### State Management
- Use RTK Query for server state
- Use Redux (`auth.ts`) for client auth state
- Use `useAppSelector`/`useAppDispatch` instead of raw `useSelector`/`useDispatch`
- Prefer deriving state via `useMemo` over copying to new state

---

## License

Proprietary - Ubunnifu Labs-Techinika Limited
