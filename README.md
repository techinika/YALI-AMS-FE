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
| Icons | Lucide React, React Icons |
| Utilities | clsx, tailwind-merge, dayjs |

---

## Project Structure

```
AMS/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Authenticated dashboard pages
│   │   ├── organizations/ # Organizations management
│   │   ├── members/        # Member listings & registration
│   │   ├── matching/       # Matchmaking features
│   │   ├── notifications/   # Notification center
│   │   ├── profile/        # User profile pages
│   │   └── settings/       # App settings
│   └── ...                 # Auth pages (login, forgot-password, etc.)
├── components/             # Reusable React components
│   ├── ui/                 # Base UI components (buttons, inputs, selects)
│   ├── DashboardPages/     # Page-specific components
│   ├── Home/               # Landing/auth page components
│   └── Data/               # Data management components
├── lib/                    # Core library code
│   ├── features/           # Redux slices & RTK Query API services
│   ├── store.ts            # Redux store configuration
│   └── fetchBaseQuery.ts   # Base API query configuration
├── helpers/                # Utility functions (auth, data, providers)
├── types/                  # TypeScript type definitions
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
NEXT_PUBLIC_API_URL=your_api_endpoint
NEXT_PUBLIC_SOCKET_URL=your_socket_endpoint
```

---

## Features

### Dashboard Pages
- **Organizations** - Manage organizations, working sectors, and associations
- **Members** - View, search, and register new members
- **Matching** - AI-powered member matching system
- **Notifications** - Real-time notification center
- **Profile** - User profile viewing and updates
- **Settings** - Application and account settings
- **Chat** - Real-time messaging system

### Core Components
- `TailwindInput` - Reusable text input with label support
- `TailwindSelect` - Reusable dropdown select component
- `MultiSelectSearch` - Searchable multi-select with chips
- `PageHeader` - Standardized page header with actions
- `ModalButton` - Button that opens modals

---

## State Management

### Redux Toolkit Slices

All slices are located in `lib/features/`:

| Slice | Purpose |
|-------|---------|
| `authSlice.ts` | Authentication state (user, token, login/logout) |
| `userSlice.ts` | User profile and associations |
| `orgSlice.ts` | Organizations CRUD operations |
| `otherSlice.ts` | Reference data (countries, districts, sectors) |
| `notificationSlice.ts` | Notifications management |
| `activitySlice.ts` | Activity tracking |
| `matchMakingSlice.ts` | Matching algorithm state |
| `statsSlice.ts` | Dashboard statistics |
| `chatSlice.ts` | Chat/messaging state |

### RTK Query APIs

All API definitions use RTK Query with automatic caching and refetching. Each slice typically exports:
- `useXxxQuery` - Fetch data hooks
- `useXxxMutation` - Write operation hooks

---

## API Integration

The app uses RTK Query for all API calls. Base configuration in `lib/fetchBaseQuery.ts` handles:
- Authorization headers
- Error handling
- Request/response interceptors

---

## Performance Optimizations

### Organizations Page (`/organizations`)
- Replaced redundant `useState` + `useEffect` chains with direct `useMemo` for derived data (sectors, states, districts, countries, workingSectors, organizations)
- Removed unnecessary loading state in onClick handler
- Optimized data flow from RTK Query hooks to reduce re-render cycles
- Wrapped organization cards with `React.memo` to prevent unnecessary re-renders

### MultiSelectSearch Component
- Memoized `selectedOptions` and `filteredOptions` with `useMemo` to prevent recalculation on every render
- Wrapped event handlers (`addValue`, `removeValue`, `handleInputChange`, `handleContainerClick`, `handleClickOutside`) with `useCallback` to maintain referential equality
- Optimized mousedown event handler cleanup with stable callback reference

### Members Page (`/members`)
- Created `MemberRow` component wrapped with `React.memo` to prevent re-rendering all rows when one row updates
- Added `useCallback` for action handlers (view, edit, delete, re-invite, message)
- Implemented skeleton loading state (`MembersTableSkeleton`) instead of full-page spinner
- Removed unused `Link` components in favor of button-based navigation

### Notifications Page (`/notifications`)
- Created `NotificationItemRow` component wrapped with `React.memo` for optimized list rendering
- Implemented skeleton loading state with `NotificationSkeleton` component
- Removed local `useOpenNotificationMutation` hook in favor of RTK Query mutation

### Dashboard Home (`/dashboard`)
- Wrapped `StatCard` and `TopUsersCard` components with `React.memo`
- Implemented skeleton loading state (`StatsCardSkeleton`) for loading states
- Extracted `TopUsersCard` as a separate component for better memoization

### RTK Query Optimizations
- Added `invalidatesTags` to mutation endpoints for automatic cache invalidation:
  - `userSlice.ts`: `change`, `deleteUser`, `updatedUser` mutations invalidate `["Users"]` tag
  - `otherSlice.ts`: `addWorkingSector`, `deleteWorkingSector`, `addCohort`, `deleteCohort`, `addTrack`, `deleteTrack` mutations invalidate `["Data"]` tag
  - `notificationSlice.ts`: `openNotification`, `updateSetup` mutations invalidate `["Notifications"]` tag
- Added `tagTypes` configuration for proper cache management
- Removed polling intervals (Socket.IO can be enabled for real-time updates)

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
- Use inline CSS spinner instead of Lucide `Loader2` icon to reduce bundle size

---

## Coding Standards

### Component Structure
```tsx
// Use "use client" for client-side components
"use client";

import React, { useState, useEffect, useMemo } from "react";

export const ComponentName = React.memo(({ prop1, prop2 }) => {
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
- Use Tailwind CSS for styling
- Export with `React.memo` wrapper
- Define TypeScript interfaces for props

### State Management
- Use RTK Query for server state
- Use local `useState` for UI state only
- Prefer deriving state via `useMemo` over copying to new state
- Avoid `useEffect` for simple data synchronization

---

## License

Proprietary - Ubunnifu Labs-Techinika Limited