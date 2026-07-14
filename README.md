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
| Framework | Next.js 16 |
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
NEXT_PUBLIC_WS_URL=ws://localhost:4500
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL for real-time features |

---

## Features

### Dashboard Pages
- **Organizations** - Manage organizations, working sectors, and associations
- **Members** - View, search, filter, and register new members with Excel import/export
- **Matching** - AI-powered member matching by interests
- **Notifications** - Notification center with read/unread tracking and setup configuration
- **Profile** - User profile viewing and updates
- **Settings** - Application and account settings
- **Chat** - Private and group messaging with real-time Socket.IO

### Core Components
- `Button` - Unified button component with CVA variants (primary/danger/ghost) and sizes (sm/md/lg)
- `TailwindInput` - Reusable text/textarea input with label, error, and helper text support
- `TailwindSelect` - Reusable dropdown select component
- `MultiSelectSearch` - Searchable multi-select with chips
- `PageHeader` - Standardized page header with actions
- `Skeleton` - 7 skeleton variants for loading states

---

## State Management

### Redux Toolkit Slices

All slices are located in `lib/features/`:

| Slice | Purpose |
|-------|---------|
| `auth.ts` | Local auth state (user, token, isAuthenticated) |
| `authSlice.ts` | Auth API (login, logout, reset/change password) |
| `userSlice.ts` | Users API (CRUD, invite, import, export) |
| `orgSlice.ts` | Organizations API |
| `otherSlice.ts` | Reference data API (countries, districts, cohorts, tracks, sectors) |
| `notificationSlice.ts` | Notifications API |
| `activitySlice.ts` | Activity logs API |
| `matchMakingSlice.ts` | AI matchmaking API |
| `statsSlice.ts` | Dashboard statistics API |
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
- 401 response handling (auto-redirect to login on token expiry)
- Content-Type headers

---

## Security

- **XSS Protection** - All user-generated HTML content (notifications, rich text editor) is sanitized with DOMPurify before rendering via `dangerouslySetInnerHTML`
- **Token Expiry Handling** - `baseQueryWithAuthAndReauth` detects 401 responses and clears stored credentials before redirecting to login
- **Auth Guard** - `AuthGuard` component protects dashboard routes, redirecting unauthenticated users
- **Role-based Access** - `OnlyAdmin` component restricts admin-only pages

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
- Wrapped `StatCard` and `TopUsersCard` components with `React.memo`
- Used static Tailwind class maps instead of dynamic string interpolation
- Implemented skeleton loading state for loading states

### RTK Query Optimizations
- Added `invalidatesTags` to mutation endpoints for automatic cache invalidation
- Added `tagTypes` configuration for proper cache management
- All endpoints fully typed with explicit generics for better developer experience

### Socket.IO
- Singleton pattern with `hasListeners()` guard to prevent event handler duplication on reconnect

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
