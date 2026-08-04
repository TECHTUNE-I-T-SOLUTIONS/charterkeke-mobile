# Charter Keke — Push Notifications & Live Tracking: Rebuild & Verification Runbook

_Last updated: 2026-08-04_

This runbook covers everything needed to ship the push-notification and live-tracking
fixes to Android **and** iOS, and to verify them end-to-end. Follow it top to bottom.

---

## 0. What was changed (context)

**Root cause of "push only worked in Expo Go":** FCM was never wired into the committed
Android native project. Expo Go ships its own Firebase sender, so tokens worked there, but
dev/production builds returned placeholder tokens (`MISSING_INSTANCEID_SERVICE`), which the
backend rejects — so nothing was ever delivered.

Mobile (`D:\Codes\ck`):
- `app.json` — added `googleServicesFile` for both `ios` and `android`.
- `android/build.gradle` — added `com.google.gms:google-services:4.4.2` classpath.
- `android/app/build.gradle` — applied `com.google.gms.google-services` plugin.
- `services/notificationService.ts` — Android notification channels (`ride-requests`,
  `ride-updates`, `chat`, `default`), a centralized `getExpoProjectId()` (fixes the
  broken manual token retry that read an undefined env var), and channel-aware local pushes.
- `services/api.ts` — added `notifyArrival()`, `getRiderActiveRides()`, `getRiderActiveRide()`.
- `services/websocketService.ts` — converted the dead socket.io client (pointed at a
  non-existent `localhost:3000` server) into a safe no-op. Realtime is Supabase; push is Expo/FCM.
- `app/rider/active-ride.tsx` — replaced relative `fetch('/api/...')` (never resolves on a
  device) with `apiService`, and replaced the `Math.random()` fake driver marker with a real
  Supabase Realtime subscription + 15s status polling.
- `app/driver/ride-details.tsx` (the screen drivers actually use) — added an **"I've Arrived"**
  button that fires the arrival push without changing ride status.
- `app/driver/active-ride.tsx` (previously an orphaned mock) — rewired to real ride data,
  live location broadcast, and the real status endpoints as a safe fallback.

Backend (`D:\Codes\charter-keke-web`):
- `app/api/driver/notify-arrival/route.ts` — **new** notification-only "driver arrived" endpoint.
- `app/api/driver/update-ride-status/route.ts` — fixed the arrival/trip-start conflation; the
  `in_progress` transition now sends a clean "Trip Started" to both parties.
- `lib/push-service.ts` — added `channelId` + `priority: 'high'` to the Expo push payload so
  Android shows heads-up notifications on the right channel.
- `app/api/user/ride-completed/route.ts` — fixed a latent bug where the ride lookup filtered
  `rides.driver_id` by `users.id` (it references `drivers.id`) and therefore always 404'd.

The four required events now map to:
| Event | Trigger | Push `type` | Recipient |
|---|---|---|---|
| Rider books a ride | `/api/user/book-ride` | `ride_request` | Driver(s) |
| Driver accepts | `/api/driver/accept-ride` | `ride_accepted` | Rider |
| Driver arrives | `/api/driver/notify-arrival` | `driver_arrived` | Rider |
| Trip started | `/api/driver/update-ride-status` (`in_progress`) | `trip_started` | Rider + Driver |
| Ride completed | `/api/driver/update-ride-status` (`completed`) | `ride_completed`/`ride_update` | Rider + Driver |

---

## 1. Pre-flight — commit the native wiring (CRITICAL)

Because `android/` is committed to git (only `ios/` is gitignored), **EAS builds from the
committed native project and skips Android prebuild.** The FCM config files are currently
**untracked**. If you don't commit them, the cloud build will not contain Firebase and the
fix will silently not apply.

```bash
cd D:\Codes\ck

# Confirm the FCM files are in place
dir android\app\google-services.json          # must exist
dir google-services.json                       # referenced by app.json (android)
dir GoogleService-Info.plist                   # referenced by app.json (ios)

# Stage the native wiring + config
git add app.json ^
        android/build.gradle ^
        android/app/build.gradle ^
        android/app/google-services.json ^
        google-services.json ^
        GoogleService-Info.plist ^
        services/notificationService.ts ^
        services/api.ts ^
        services/websocketService.ts ^
        app/rider/active-ride.tsx ^
        app/driver/ride-details.tsx ^
        app/driver/active-ride.tsx

git status          # verify google-services.json is staged, NOT ignored
git commit -m "Wire FCM into Android build + fix push events and live tracking"
```

> If `git status` shows `google-services.json` under "Untracked files" after `git add`,
> check `.gitignore` — it must NOT ignore these files. (Verified: currently not ignored.)

**Deploy the backend** (`D:\Codes\charter-keke-web`) — the new `notify-arrival` route and the
`update-ride-status` / `push-service` changes must be live before you test:

```bash
cd D:\Codes\charter-keke-web
git add app/api/driver/notify-arrival/route.ts ^
        app/api/driver/update-ride-status/route.ts ^
        app/api/user/ride-completed/route.ts ^
        lib/push-service.ts
git commit -m "Add driver-arrived push, fix arrival/trip-start conflation, add channelId+priority"
git push        # triggers your Vercel/host deploy
```

---

## 2. Verify EAS push credentials (FCM v1 + APNs)

You said the FCM v1 key is already uploaded. Confirm it, and confirm APNs for iOS:

```bash
cd D:\Codes\ck
npx eas-cli@latest whoami                      # ensure you're logged in
npx eas credentials                            # interactive
#   → Android → production → "Push Notifications: FCM V1"  should show a service account key
#   → iOS     → production → "Push Notifications (APNs)"    should show a push key
```

What "good" looks like:
- **Android:** an FCM V1 service account JSON is attached (NOT the legacy server key).
- **iOS:** an APNs key (.p8) is attached for bundle id `com.charterkeke.mobile`.

The Expo project id is already pinned in `app.json`
(`extra.eas.projectId = 9966caa5-2d6e-4192-a97c-0eb0f3108fa0`), so `getExpoProjectId()`
resolves a real token even though `EXPO_PUBLIC_PROJECT_ID` is not set in `.env.local`.

---

## 3. Rebuild (native change → full build, NOT an OTA update)

These changes are native (Gradle plugin + config). `eas update` (OTA) **cannot** ship them —
you must produce new binaries.

```bash
cd D:\Codes\ck

# Android — internal test build (APK per eas.json "preview")
npx eas-cli@latest build --platform android --profile preview

# iOS — internal build (needs a registered device / ad-hoc or TestFlight)
npx eas-cli@latest build --platform ios --profile preview
```

For store releases use `--profile production` (Android `versionCode` auto-increments;
bump iOS `buildNumber` if your submit flow needs it).

Install the resulting build on a **physical device** (push does not work on simulators/emulators
reliably; iOS push requires a real device).

---

## 4. Verify the push token is real (not a placeholder)

On first launch after install, grant the notification permission prompt, then check logs:

```bash
# Android device logs (USB debugging on)
adb logcat | findstr /C:"NOTIFICATIONS" /C:"ExponentPushToken" /C:"push"
```

Expected: a token that looks like `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`.

- If you instead see `placeholder_...` or `MISSING_INSTANCEID_SERVICE`, the FCM wiring did
  not make it into the build → re-check Step 1 (files committed) and that
  `android/app/google-services.json` matches package `com.charterkeke.mobile`.
- Confirm the token reached the backend:
  `GET /api/notifications/subscribe` (with the user's Bearer token) should list an active
  subscription whose `push_token` starts with `ExponentPushToken`.

---

## 5. End-to-end test (two devices, or two accounts)

Use one **rider** device/account and one **driver** device/account.

1. **Book a ride (rider).** → Driver device gets **"New Ride Request"** (channel: ride-requests,
   heads-up + sound).
2. **Accept (driver, from Ride Details).** → Rider gets **"✅ Driver Accepted"**. Rider's
   Active Ride screen opens/updates and the driver marker starts moving on the map as the
   driver's real GPS is broadcast over Supabase Realtime.
3. **Tap "I've Arrived" (driver).** → Rider gets **"📍 Driver Arrived"**. Ride status stays
   `accepted` (arrival is notification-only). Button shows "✓ Rider Notified".
4. **Tap "Start Trip" (driver).** → Both get **"🚕 Trip Started"**; status → `in_progress`.
5. **Tap "Complete Trip" (driver).** → Both get **"✅ Ride Completed"**; status → `completed`;
   location broadcast stops.

Live map check: while in states 2–4, move the driver device — the rider's map driver marker
should track it within a few seconds. (Both screens broadcast their own position and subscribe
to the other's on channel `ride-location-<rideId>`.)

---

## 6. Quick manual push smoke test (optional)

Send a test push straight to the Expo service using a token from Step 4:

```bash
curl -X POST https://exp.host/--/api/v2/push/send ^
  -H "Content-Type: application/json" ^
  -d "{\"to\":\"ExponentPushToken[PUT_TOKEN_HERE]\",\"title\":\"Test\",\"body\":\"Hello from Expo\",\"channelId\":\"ride-updates\",\"priority\":\"high\"}"
```

A `{"data":{"status":"ok"}}` response + a heads-up notification on the device confirms the
whole delivery path (token → Expo → FCM/APNs → device) is healthy.

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Works in Expo Go, not in build | FCM not committed into `android/` | Step 1 — commit google-services.json + Gradle edits |
| `placeholder_...` token | google-services.json missing/mismatched in build | Ensure `android/app/google-services.json`, package `com.charterkeke.mobile` |
| Android push arrives, no sound/heads-up | Channel importance | Channels are created in `setupAndroidChannels()`; reinstall after first run |
| iOS: nothing | APNs key missing, or testing on simulator | Step 2 (APNs), test on real device |
| Rider map shows no driver | Supabase Realtime blocked, or driver screen not open | Check `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY`; driver must be on Ride Details |
| Duplicate "arrived/on the way" text | Old backend deployed | Redeploy backend (Step 1) — conflation fix |

---

## 8. Housekeeping (non-blocking)

- `socket.io-client` in `package.json` is now unused (service is a no-op). You can remove it
  with `npm remove socket.io-client` at your convenience; leaving it is harmless.
- The runtimeVersion is `"2"`; remember native changes require a new build, while pure JS
  changes can later ship via `eas update --channel <production|staging>`.
