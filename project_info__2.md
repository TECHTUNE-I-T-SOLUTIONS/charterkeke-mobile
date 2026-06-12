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
  - Route analytics table is **read-only**
  - On save, sends PUT to `/api/admin/pricing` which updates DB and records audit

### 4. `/api/admin/pricing` route (Admin Next.js)
- **File**: `../CharterKekeAdmin/app/api/admin/pricing/route.ts`
- **Responsibility**: Backend for pricing CRUD, gated by `canManagePricing()` which checks for `super_admin` role or `operations`/`ops` department.
- **GET**: Loads setting + distance bands + route metrics (top 50) + audit log (last 20)
- **PUT**: Validates all values, replaces distance_bands, records audit with before/after JSON snapshots

### 5. `/api/pricing/active` route (Admin Next.js, public)
- **File**: `../CharterKekeAdmin/app/api/pricing/active/route.ts`
- **Responsibility**: Public endpoint consumed by the mobile app with `skipAuth: true`. Falls back to hardcoded `FALLBACK_PRICING` if DB fails.
- **Response shape**: camelCase — matches `BookingPricingConfig` interface exactly.

### 6. `buildRideBookingPayload` (Mobile)
- **File**: `services/bookingService.ts`
- **Responsibility**: Produces the exact payload shape expected by `POST /user/book-ride`. Includes fare breakdown, `platform_fee`, `driver_earnings`, and full `pricing_breakdown` object.

### 7. RAIL Database Schema
- **SQL**: `../CharterKekeAdmin/supabase/2026-06-12-rail-pricing-settings.sql`
- **4 tables**: `pricing_settings` (active fare config), `distance_bands` (per-km rates by distance tier), `route_metrics` (per-route performance data), `ride_pricing_audit` (change log)
- **Realtime**: All 3 data tables added to `supabase_realtime` publication

## Data Flow — Booking a Ride with RAIL Pricing

1. **User opens BookingScreen** → `useEffect` calls `getBookingPricingConfig()`
2. **bookingService** checks in-memory → checks AsyncStorage (10-min TTL) → fetches `GET /pricing/active` from admin backend → normalizes and caches
3. **User searches/selects pickup** → Google Places autocomplete → user taps result → `selectSearchResult` resolves coordinates → saves to recent
4. **User selects dropoff** → same flow
5. **Both locations set** → `useEffect` triggers route calculation:
   - Primary: `fetchMapboxRoute()` with `driving-traffic` profile
   - Fallback: Haversine straight-line × 1.28 road factor
   - Duration: `calculateKekeDurationMinutes()` — max of Mapbox duration AND deterministic ETA
   - Fare: `calculateRideFare()` — `baseFare + distance × band.rate + duration × perMinute`
6. **User picks time** → `PickupTimeModal` → moves to review step
7. **Review step** → confirmation modal → "Confirm Booking"
8. **`handleConfirmBooking`** → `createRideBooking()` → `buildRideBookingPayload()` → `POST /user/book-ride`
9. **Admin** views route analytics in `AdminPricingConsole` — route_metrics auto-accumulates from completed rides

## Non-Obvious Behaviors & Design Decisions

### Hidden Invariants
1. **Only one active pricing setting at a time.** Filtered by `is_active = true` + `updated_at desc` limit 1.
2. **pricing_settings rows are never deleted.** Only updated or new rows created. Historical rows preserved for audit.
3. **route_metrics.route_key is unique.** Two identical routes always map to the same metric row — `ride_count` increments and averages recalculate.
4. **Mobile app always has a fallback fare.** `BOOKING_PRICING` compiled in — app never shows "no pricing available".
5. **Booking screen prewarms current location on mount.** 2-minute cache for near-instant "Use my current location".

### Why Things Are The Way They Are
1. **Two pricing API endpoints** — public `/pricing/active` (flat camelCase) vs admin `/admin/pricing` (full nested). Avoids exposing operational data to mobile.
2. **`max_km = null` = infinity** — cleaner than sentinel values, forces proper `find()` handling.
3. **`platform_fee_rate` is a decimal (0.15)** rather than a percentage — avoids hardcoding 15% in either app.
4. **ETA = max(Mapbox duration, deterministic ETA)** — prevents unrealistically fast estimates from Mapbox for keke speeds.
5. **Dead code block in booking.tsx** — the old `false ? (...)` wrapped bottom sheet from the previous non-step UI. Safe to delete after confirming new flow works.

### State Management
- **`inMemoryPricing`** is a module-level variable (not React state) — singleton across the app
- **`prewarmedCurrentLocationRef`** — `useRef` to avoid re-renders
- **Context state**: `LocationContext` (currentLocation, isTracking), `RideContext` (currentRide, recentRides)
- **AsyncStorage caches**: `@charter_keke_recent_searches`, `@charter_keke_recent_locations`, `@charter_keke_recent_routes`, `@charter_keke_rail_pricing`, `userProfile`

### Error Propagation
- Pricing fetch fails → silent fallback to cache → `console.warn` → stale data used
- Mapbox fails → fallback Haversine → `console.log` → fare still shown
- Google Places fails → fallback to Supabase `search_locations` cache or hardcoded `MOCK_LOCATIONS`
- Booking API fails → `ErrorDialog` shown to user
- Admin pricing save fails → toast banner error

### Performance-Sensitive Paths
- Route calculation cancels via `isCancelled` flag in cleanup
- Place Details is a second network call after autocomplete selection
- Search results debounced at 350ms with request ID cancellation to prevent stale responses

## Module Reference (Mobile App)

| File | Purpose |
|------|---------|
| `app/rider/booking.tsx` | Main booking flow screen (being refactored) |
| `services/bookingService.ts` | RAIL pricing config loader, fare/duration calculators, payload builder |
| `services/ridesService.ts` | HTTP calls for ride CRUD |
| `services/api.ts` | Axios-based API client with auth token injection |
| `context/RideContext.tsx` | Ride state management |
| `context/LocationContext.tsx` | Location state, tracking, geocoding |
| `utils/googlePlacesSearch.ts` | Google Places autocomplete, details, reverse geocode + Supabase cache |
| `utils/mapboxDirections.ts` | Mapbox Directions API wrapper |
| `utils/geofencing.ts` | Point-in-polygon operational area validation |
| `components/booking/BookingPreviousChoice.tsx` | Step summary display |
| `components/booking/BookingRecentRoutes.tsx` | Recent routes horizontal picker |
| `components/PickupTimeModal.tsx` | Time selection modal |
| `components/MapboxMap.tsx` | Mapbox GL wrapper |
| `types/index.ts` | Shared TypeScript interfaces |

### Admin Project Module Reference

| File | Purpose |
|------|---------|
| `supabase/2026-06-12-rail-pricing-settings.sql` | RAIL schema + realtime publication |
| `components/admin-pricing-console.tsx` | Pricing management UI |
| `app/api/admin/pricing/route.ts` | Admin pricing CRUD API (ops + super_admin) |
| `app/api/pricing/active/route.ts` | Public active pricing endpoint |
| `lib/admin-access.ts` | Role/department authorization |
| `app/admin/layout.tsx` | Admin layout with ProtectedRoute |

## Suggested Reading Order

For a developer joining this codebase and needing to understand the RAIL pricing system end-to-end:

1. **`../CharterKekeAdmin/supabase/2026-06-12-rail-pricing-settings.sql`** — Start here. Source of truth for the data model.
2. **`d:/Codes/ck/services/bookingService.ts`** — Mobile-side pricing engine. See how DB schema maps to `BookingPricingConfig`.
3. **`../CharterKekeAdmin/app/api/pricing/active/route.ts`** — Public API endpoint bridging DB and mobile app.
4. **`../CharterKekeAdmin/app/api/admin/pricing/route.ts`** — Admin CRUD endpoint with validation and audit.
5. **`../CharterKekeAdmin/components/admin-pricing-console.tsx`** — Admin UI with live preview and analytics.
6. **`d:/Codes/ck/app/rider/booking.tsx`** — Mobile booking screen (the full flow end-to-end).
7. **`d:/Codes/ck/context/RideContext.tsx`** + **`d:/Codes/ck/services/ridesService.ts`** — Ride creation path on mobile side.

---

The full report has been saved to `project_info__1.md` in the project root. This covers the complete RAIL pricing architecture across all three project boundaries — the Supabase schema, the admin API routes, the admin console, the mobile booking service, and the booking screen itself. Let me know what area you'd like to dive deeper into!