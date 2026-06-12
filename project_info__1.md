# Charter Keke — Codebase Overview

## Summary
Charter Keke is a Nigerian ride-hailing platform with three interconnected projects: a **React Native (Expo) mobile app** for riders, a **Next.js admin dashboard** for operations and CRM, and a **Node.js API backend** (not in this workspace). The system recently introduced the **RAIL (Route Adaptive Intelligence Layer)** pricing model — a deterministic, database-driven fare system that replaces legacy hardcoded pricing. The mobile app's booking screen is in the middle of a refactor to extract its 1000+ lines into focused components, while the admin console gives operations staff and super admins control over fare parameters with read-only route analytics.

## Architecture

### Primary Pattern
**Hybrid layered + event-driven.** The mobile app follows a screen/context/service pattern common in Expo apps. The admin is a server-rendered Next.js app with client-side interactivity. Both communicate with a shared Supabase backend and a custom Node.js API.

### System Boundaries
```
[Expo Mobile App] ──REST/WS──→ [Next.js Admin] ──REST──→ [Supabase DB]
         │                                │
         └────────── REST ────────────────┘
                          │
                    [Backend API server]
                    (Node.js, not in workspace)
```

### Technology Stack
| Layer | Tech |
|-------|------|
| Mobile | Expo SDK 54, React Native 0.81.5, TypeScript, React Navigation |
| Admin | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, shadcn/ui |
| Database | Supabase (PostgreSQL with realtime publication) |
| Maps | Mapbox GL (mobile), Leaflet (admin) |
| Location Services | Google Places API (autocomplete, details, reverse geocode), Mapbox Directions |
| Auth | Supabase Auth + NextAuth.js (admin) |
| Push Notifications | Expo Push Notifications + custom push service |
| State Management | React Context (AuthContext, LocationContext, RideContext, ThemeContext) + zustand (not heavily used) |

## Directory Structure (Mobile App — `d:/Codes/ck/`)

```
ck/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout (providers, navigation wrappers)
│   ├── index.tsx                 # Entry redirect screen
│   ├── splash.tsx                # Splash screen
│   ├── auth/                     # Auth screens
│   ├── rider/                    # Rider-facing screens
│   │   ├── booking.tsx           # ★ Main booking flow (very large, being refactored)
│   │   ├── home.tsx              # Rider home screen
│   │   ├── rides-history.tsx     # Ride history list + details
│   │   ├── rating.tsx            # Post-ride rating screen
│   │   └── ...                   # Settings, privacy, about, etc.
│   └── driver/                   # Driver-facing screens
├── components/
│   ├── booking/                  # Booking sub-components (new, being created during refactor)
│   │   ├── BookingPreviousChoice.tsx
│   │   └── BookingRecentRoutes.tsx
│   ├── MapboxMap.tsx             # Mapbox GL map component
│   ├── MapboxMapView.tsx         # Alternative map view wrapper
│   ├── ErrorDialog.tsx
│   ├── SuccessDialog.tsx
│   ├── RideMapFullscreenModal.tsx
│   └── ...                       # Many other UI components
├── context/                      # React Context providers
│   ├── AuthContext.tsx
│   ├── LocationContext.tsx       # Wraps locationService tracking, geocoding
│   ├── RideContext.tsx           # Wraps ride CRUD + apiService calls
│   ├── ThemeContext.tsx
│   └── ...
├── services/                     # API + service layer
│   ├── api.ts                    # Axios-based REST client
│   ├── bookingService.ts         # ★ RAIL pricing config, fare calculation, payload building
│   ├── ridesService.ts           # createRideBooking, getRideDetails, history
│   ├── auth.ts
│   ├── supabase.ts
│   └── ...
├── utils/
│   ├── googlePlacesSearch.ts     # Google Places autocomplete, details, reverse geocode
│   ├── mapboxDirections.ts       # Mapbox Directions API (driving-traffic profile)
│   ├── geofencing.ts             # Point-in-polygon, operational area validation
│   └── ...
├── types/index.ts                # Shared TypeScript types (Ride, User, Location, etc.)
└── package.json
```

### Admin Project (`../CharterKekeAdmin/`)

```
CharterKekeAdmin/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── admin/                    # Admin dashboard
│   │   ├── layout.tsx            # ★ ProtectedRoute wrapper, sidebar, bottom nav
│   │   ├── crm/                  # CRM pages
│   │   └── ... (pricing, rides, drivers, etc.)
│   ├── api/                      # Next.js API routes
│   │   ├── admin/pricing/route.ts  # ★ Admin PUT/GET pricing (ops + super_admin only)
│   │   ├── pricing/active/route.ts # ★ Public GET active pricing (used by mobile app)
│   │   └── ...
│   └── auth/
│       └── admin/login/
├── components/
│   ├── admin-pricing-console.tsx # ★ RAIL Pricing Console UI
│   ├── admin-operations-intelligence.tsx
│   └── ...
├── lib/
│   ├── admin-access.ts           # Role/department verification
│   ├── auth.ts                   # Auth helpers
│   └── supabase.ts               # Supabase admin client
└── supabase/                     # SQL migration files
    └── 2026-06-12-rail-pricing-settings.sql  # ★ RAIL base schema
```

## Key Abstractions

### 1. `BookingPricingConfig` (Mobile)
- **File**: `services/bookingService.ts`
- **Responsibility**: Central pricing configuration that drives all fare calculations. Loaded from the backend's `/pricing/active` endpoint with AsyncStorage caching (10-minute TTL). Includes base fare, distance bands, per-minute rate, ETA coefficients, and learning weight.
- **Interface**: `baseFare`, `minimumFare`, `perMinute`, `platformFeeRate`, `etaPerKm` (low/normal/heavy traffic), `learningWeight`, `distanceBands` (array of `{maxKm, rate}`)
- **Fallback**: If the API call fails, it falls back to a compiled constant `BOOKING_PRICING` matching "RAIL v1" defaults.
- **Lifecycle**: Loaded once on booking screen mount (`getBookingPricingConfig()`), kept in `inMemoryPricing` module-level variable. Only refreshed on explicit `forceRefresh` or when cache expires.

### 2. `BookingScreen` (Mobile)
- **File**: `app/rider/booking.tsx` (~1000+ lines)
- **Responsibility**: The main booking flow — 4-step wizard: pick pickup, pick destination, pick time, review + book. Integrates map, voice search, Google Places autocomplete, route estimation, and fare calculation.
- **Lifecycle**: Mount → load recent data + pricing config → prewarm current location → user navigates steps → book → success/error
- **Known issue**: This file is excessively large and is being refactored into sub-components in `components/booking/`. Currently `BookingPreviousChoice` and `BookingRecentRoutes` exist; more extraction needed.

### 3. `AdminPricingConsole` (Admin)
- **File**: `../CharterKekeAdmin/components/admin-pricing-console.tsx`
- **Responsibility**: Full pricing management UI for operations + super_admin. Loads current pricing data from `/api/admin/pricing`, renders fare controls + distance bands + route analytics table + sample fare preview.
- **Key behaviors**: 
  - Shows a live sample fare (Surulere to Yaba, 6km) as controls are adjusted
  - Route analytics table is **read-only** — only super_admin/ops can see it, cannot edit
  - On save, sends PUT to `/api/admin/pricing` which validates, updates pricing_settings, replaces distance_bands, and records audit entry

### 4. `/api/admin/pricing` route (Admin Next.js)
- **File**: `../CharterKekeAdmin/app/api/admin/pricing/route.ts`
- **Responsibility**: Backend for pricing CRUD, gated by `canManagePricing()` which checks for `super_admin` role or `operations`/`ops` department. 
- **GET**: Loads setting + distance bands + route metrics (top 50 by ride_count) + audit log (last 20 entries)
- **PUT**: Validates all values are positive finite numbers, requires at least one distance band, updates the setting, deletes old bands, inserts new bands, records a `ride_pricing_audit` row with before/after JSON snapshots

### 5. `/api/pricing/active` route (Admin Next.js, public)
- **File**: `../CharterKekeAdmin/app/api/pricing/active/route.ts`
- **Responsibility**: Public endpoint consumed by the mobile app. Returns the active pricing config (no auth required — `skipAuth: true` on the mobile side). Falls back to hardcoded `FALLBACK_PRICING` if the DB query fails or no active setting exists.
- **Response shape**: Normalized camelCase — matches `BookingPricingConfig` interface exactly.

### 6. `buildRideBookingPayload` (Mobile)
- **File**: `services/bookingService.ts`
- **Responsibility**: Takes raw booking input (pickup, dropoff, distance, duration, time, fare, pricingConfig) and produces the exact payload shape expected by the backend's `/user/book-ride` endpoint. Includes:
  - Both `estimated_distance` and `duration_minutes` / `estimated_duration_minutes`
  - `fare_amount`, `platform_fee`, `driver_earnings` (computed via `calculateDriverSettlement`)
  - `pricing_model: "RAIL v1"` 
  - Full `pricing_breakdown` object with all coefficients + band matched to distance
- **Used by**: `createRideBooking` in `ridesService.ts`

### 7. `pricing_settings` + `distance_bands` + `route_metrics` (Database)
- **SQL**: `../CharterKekeAdmin/supabase/2026-06-12-rail-pricing-settings.sql`
- **Structure**:
  - `pricing_settings`: One row per version; `is_active` flag; standard fare fields; `learning_weight` for RAIL; `created_by`/`updated_by` FK to users
  - `distance_bands`: Child rows; `max_km` (null = infinity); `rate` per km; `sort_order`; cascade delete
  - `route_metrics`: One row per unique route_key (concatenated pickup→dropoff); auto-updating `ride_count`, `avg_minutes_per_km`, time-of-day averages (`morning_avg`, `afternoon_avg`, `evening_avg`); manually updated when rides complete
  - `ride_pricing_audit`: Change log; `previous_values` and `next_values` as JSONB; tracks who changed what and when
- **Realtime**: All three tables are added to `supabase_realtime` publication for live updates

## Data Flow — Booking a Ride with RAIL Pricing

1. **User opens BookingScreen** → `useEffect` calls `getBookingPricingConfig()` from `bookingService.ts`
2. **bookingService** checks in-memory cache → checks AsyncStorage (10-min TTL) → otherwise fetches `GET /pricing/active` from the admin backend → normalizes and caches the result
3. **User searches/selects pickup** → Google Places autocomplete (falling back to local DB cache `search_locations`) → user taps result → `selectSearchResult` resolves coordinates via Place Details or uses local data → saves to recent locations
4. **User selects dropoff** → same flow as pickup
5. **Both locations set** → `useEffect` triggers route calculation:
   - Primary: calls `fetchMapboxRoute()` with `driving-traffic` profile
   - Fallback (Mapbox fails): uses Haversine straight-line distance × 1.28 road adjustment factor
   - Duration: `calculateKekeDurationMinutes()` — takes max of Mapbox duration AND deterministic ETA (distance × `etaPerKm[traffic]`)
   - Fare: `calculateRideFare()` — `baseFare + distance × band.rate + duration × perMinute`, floored at `minimumFare`
6. **User picks time** → `PickupTimeModal` → `handlePickupTimeConfirmed` → moves to review step
7. **Review step** shows fare breakdown → user taps "Review Ride" → confirmation modal → taps "Confirm Booking"
8. **`handleConfirmBooking`** → `createRideBooking()` → `buildRideBookingPayload()` → `POST /user/book-ride` → saves recent route → shows success notification
9. **Admin/Operations** can later view route analytics in `AdminPricingConsole` → route_metrics table auto-accumulates ride counts and averages per unique route as rides complete

## Non-Obvious Behaviors & Design Decisions

### Hidden Invariants
1. **Only one active pricing setting at a time.** The system enforces this by filtering `is_active = true` and ordering by `updated_at desc` with limit 1. The SQL migration inserts a single seed row only if none exists.
2. **pricing_settings rows are never deleted.** Changes create a new row or update the active one. Historical rows are preserved for audit/reference.
3. **route_metrics route_key uniqueness.** The `route_key` column is `text not null unique` — it's the concatenated pickup→dropoff identifier. Two identical routes will always map to the same metric row, which increments `ride_count` and recalculates averages.
4. **Mobile app always has a fallback fare.** Even if the backend is down, `BOOKING_PRICING` in `bookingService.ts` is compiled in. This means the app never shows "no pricing available" — it shows a potentially stale fare.
5. **The booking screen prewarms the current location address.** On mount, `prewarmCurrentLocation()` fetches and reverse-geocodes the user's location, caching it for 2 minutes so "Use my current location" is nearly instant.

### Why Things Are The Way They Are
1. **Two pricing API endpoints** (`/api/pricing/active` is public, `/api/admin/pricing` requires ops/super_admin). The public one returns a flat camelCase object; the admin one returns nested payload with metrics and audit. This avoids exposing operational data to mobile clients while giving the admin console full context.
2. **distance_bands uses `max_km = null` for "infinity"** rather than a sentinel value like 999999. The null pattern is cleaner in SQL and forces proper handling in client code (which it does — `find()` with `item.maxKm === null` as the catch-all).
3. **`platform_fee_rate` is a decimal (0.15 = 15%)** stored in the DB and passed through to the mobile app. The admin console formats it as a percentage for display. This avoids hardcoding the 15% fee in either app.
4. **ETA calculation uses `max(Mapbox duration, deterministic ETA)`** in `calculateKekeDurationMinutes`. This means keke-specific speed limits (4/6/8 min per km depending on traffic) always set a floor on the ETA, preventing unrealistically fast estimates from Mapbox.
5. **The booking screen has a dead code block** (the old `false ? (...)` wrapped bottom sheet). This is the original non-step-based UI that's been replaced by the step-based flow but not yet removed. It's safe to delete after confirming the new flow works.

### State Management
- **Mutable state**: `inMemoryPricing` in `bookingService.ts` is a module-level variable, not React state. This means the pricing config is a singleton across the app — any component importing `getCurrentBookingPricingConfig()` gets the same object.
- **Prewarmed location**: `prewarmedCurrentLocationRef.current` keeps a `useRef` that persists across renders without causing re-renders. It's used to make "Use current location" feel instant.
- **Context state**: `LocationContext` tracks `currentLocation`, `lastLocation`, `isTracking`; `RideContext` tracks `currentRide`, `recentRides`, `availableRides`. These are the primary state containers for ride flow.
- **AsyncStorage caches**: Recent searches, recent locations, recent routes, pricing config, and user profile are all persisted in AsyncStorage with key patterns `@charter_keke_*`.

### Error Propagation
- **Pricing fetch failure**: Caught silently → fallback to in-memory/cache → `console.warn` → app continues with stale data
- **Mapbox route failure**: Caught → falls back to Haversine straight-line with 1.28× road adjustment → `console.log` → fare still shown
- **Google Places failure**: Caught → falls back to local DB cache (`search_locations`) or hardcoded MOCK_LOCATIONS
- **Booking API failure**: Propagated to user via `ErrorDialog` with `errorMessage`
- **Pricing save failure (admin)**: Shows error message in the toast banner at the top of the console

### Performance-Sensitive Paths
- **Route calculation**: Runs asynchronously whenever pickup or dropoff changes, with cancellation via `isCancelled` flag in the `useEffect` cleanup. The Mapbox call is the bottleneck (network-dependent).
- **Google Place Details**: Called after user selects a place ID. This is a second network call (autocomplete → details). The `getGooglePlaceDetails` result is used to get precise coordinates.
- **Search results rendering**: Debounced at 350ms (`scheduleSearch`), with request cancellation via incrementing `pickupSearchRequest.current` / `dropoffSearchRequest.current`. This prevents stale responses from overwriting newer results.

## Module Reference (Mobile App)

| File | Purpose |
|------|---------|
| `app/rider/booking.tsx` | Main booking flow screen (being refactored to components) |
| `services/bookingService.ts` | RAIL pricing config loader, fare/duration calculators, payload builder |
| `services/ridesService.ts` | HTTP calls for ride CRUD (create, get, history) |
| `services/api.ts` | Axios-based API client with auth token injection |
| `context/RideContext.tsx` | Ride state management (current ride, history, available) |
| `context/LocationContext.tsx` | Location state, tracking, geocoding |
| `utils/googlePlacesSearch.ts` | Google Places autocomplete, details, reverse geocode + Supabase cache |
| `utils/mapboxDirections.ts` | Mapbox Directions API wrapper (driving-traffic profile) |
| `utils/geofencing.ts` | Point-in-polygon operational area validation |
| `components/booking/BookingPreviousChoice.tsx` | Step summary display (shows prev step's chosen value) |
| `components/booking/BookingRecentRoutes.tsx` | Recent routes horizontal picker |
| `components/PickupTimeModal.tsx` | Time selection modal for scheduled rides |
| `components/MapboxMap.tsx` | Mapbox GL wrapper with markers, routes, camera controls |
| `types/index.ts` | Shared TypeScript interfaces (Ride, User, Location, etc.) |

### Admin Project Module Reference

| File | Purpose |
|------|---------|
| `supabase/2026-06-12-rail-pricing-settings.sql` | RAIL schema: pricing_settings, distance_bands, route_metrics, audit, realtime |
| `components/admin-pricing-console.tsx` | Pricing management UI with live preview and read-only analytics |
| `app/api/admin/pricing/route.ts` | Admin pricing CRUD API (ops + super_admin only) |
| `app/api/pricing/active/route.ts` | Public active pricing endpoint (consumed by mobile app) |
| `lib/admin-access.ts` | Role/department authorization helpers (`isSuperAdminUser`, `requireAdminSession`) |
| `app/admin/layout.tsx` | Admin layout with ProtectedRoute, sidebar (hidden on CRM), bottom nav, push bell |

## Suggested Reading Order

For a developer joining this codebase and needing to understand the RAIL pricing system end-to-end:

1. **`../CharterKekeAdmin/supabase/2026-06-12-rail-pricing-settings.sql`** — Start here. This is the source of truth for the data model. Understand the four tables and their relationships before reading any code.

2. **`d:/Codes/ck/services/bookingService.ts`** — The mobile-side pricing engine. See how the DB schema maps to the `BookingPricingConfig` interface, how fallbacks work, and how fares are calculated.

3. **`../CharterKekeAdmin/app/api/pricing/active/route.ts`** — The public API endpoint that bridges DB and mobile app. Simple, but shows the camelCase normalization that makes the mobile contract explicit.

4. **`../CharterKekeAdmin/app/api/admin/pricing/route.ts`** — The admin CRUD endpoint. Shows the full write path including validation, distance_band replacement, and audit logging.

5. **`../CharterKekeAdmin/components/admin-pricing-console.tsx`** — The admin UI. See how live preview works, how the analytics table is rendered read-only, and how it calls the admin API.

6. **`d:/Codes/ck/app/rider/booking.tsx`** — The mobile booking screen. Large but critical — see how pricing config is loaded, how fare estimates are computed from route data, and how the booking payload is assembled on confirm.

7. **`d:/Codes/ck/context/RideContext.tsx`** + **`d:/Codes/ck/services/ridesService.ts`** — The ride creation path on the mobile side. Shows how `createRideBooking` calls `buildRideBookingPayload` and sends it to the backend.
