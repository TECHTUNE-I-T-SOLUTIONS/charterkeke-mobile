# Push Notification Subscription Flow - Automatic & Engaging

## What Happens Automatically

### 1️⃣ App Starts (First Time)
```
User opens Charter Keke app
    ↓
app/_layout.tsx → RootLayoutContent useEffect
    ↓
configureNotifications() called
    ↓
✅ Permission dialog shown: "Allow charging app to send notifications?"
    ↓
User taps "Allow" (or "Don't Allow")
    ↓
Notification handlers set up
Background task registered
```

### 2️⃣ User Logs In
```
User enters email/password
    ↓
AuthContext.handleLogin()
    ↓
subscribeToPushNotifications(userId) called
    ↓
Platform.OS detected (iOS vs Android)
    ↓
Expo push token generated
    ↓
Backend registration: POST /api/push/subscribe
    ├─ userId: user.id
    ├─ pushToken: "ExponentPushToken[xxx]"
    └─ platform: "ios" | "android"
    ↓
✅ Backend confirms subscription
    ↓
Check: Has user seen welcome notification?
    ├─ NO → Send welcome notification
    └─ YES → Skip (user already got it)
```

### 3️⃣ Welcome Notification Shows (First Run Only)
```
subscribeToPushNotifications() completes
    ↓
hasSeenWelcomeNotification() → returns false
    ↓
sendWelcomeNotification() triggered
    ↓
After 2 seconds (time for app to fully load):
┌─────────────────────────────────────────┐
│ 🎉 Welcome to Charter Keke!             │
│ Get ₹50 off your first ride!           │
│ Use code: KEKE50                        │
└─────────────────────────────────────────┘
    ↓
User taps notification
    ↓
Navigation to booking screen
    ↓
"KEKE50" discount code pre-filled
    ↓
markWelcomeNotificationSeen() → saves to AsyncStorage
```

### 4️⃣ Subsequent Logins (No Welcome)
```
User logs in again
    ↓
subscribeToPushNotifications(userId)
    ↓
hasSeenWelcomeNotification() → returns true
    ↓
Skip welcome notification
    ↓
Ready for ride requests
```

---

## How It Works on Both iOS & Android

### iOS
- **Permission**: Native dialog shown once, system manages
- **Token**: Expo automatically gets APNS token
- **Delivery**: Via Apple Push Notification service
- **Background**: Notifications show in notification center

### Android
- **Permission**: Runtime permission on Android 13+
- **Token**: Expo automatically gets FCM token
- **Delivery**: Via Google Firebase Cloud Messaging
- **Background**: Notifications show in notification center
- **Background Task**: Automatically listened via registerBackgroundNotificationTask

---

## Automatic Permissions Flow

```
┌─────────────────────────────────────────────┐
│        iOS (All Versions)                   │
├─────────────────────────────────────────────┤
│ • Permission requested once by Expo         │
│ • User decision remembered by iOS           │
│ • Can change in Settings if denied          │
│ • No re-prompting                          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        Android 13+                          │
├─────────────────────────────────────────────┤
│ • Runtime permission requested by system    │
│ • Shown in first app use                    │
│ • Remembered by Android                     │
│ • Can change in Settings → Apps → Perms     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        Android 12 and Earlier                │
├─────────────────────────────────────────────┤
│ • No permission dialog needed                │
│ • Apps can show notifications by default     │
│ • User can disable in notification settings |
└─────────────────────────────────────────────┘
```

---

## State Management

### What We Store Locally (AsyncStorage)
```typescript
{
  "pushSubscription": {
    userId: "user-123",
    pushToken: "ExponentPushToken[aaa...zzz]",
    subscribedAt: "2026-02-16T10:30:00Z",
    platform: "ios" || "android"
  },
  
  "welcomeNotificationSeen": "true"  // Only after first welcome
}
```

### What Backend Stores
```typescript
{
  userId: "user-123",
  pushToken: "ExponentPushToken[aaa...zzz]",
  platform: "ios" || "android",
  subscribedAt: "2026-02-16T10:30:00Z"
  // In production: move to Supabase database
}
```

---

## Code Execution Order

### First App Launch
```
Time    Event                              Code Called
────────────────────────────────────────────────────────
 0ms   App starts                         app/_layout.tsx
 5ms   configureNotifications()           Request permissions
10ms   Permission dialog shown             User interaction
 ↓     User taps "Allow"
 ...   User fills login form
 ...   User taps Login button
 ↓     POST /api/auth/login
 ...   Backend validates credentials
100ms  Login succeeds                     authContext.handleLogin()
110ms  subscribeToPushNotifications()     Get token, register backend
150ms  Backend confirms registration
160ms  hasSeenWelcomeNotification()       Returns false
170ms  sendWelcomeNotification()          Show after 2 seconds
────
2170ms Welcome notification appears       ← USER SEES THIS
2180ms User taps notification             Open booking screen
```

### Second App Launch (Same User)
```
Time    Event
────────────────────────────────────────────────────────
 0ms   App starts
 5ms   configureNotifications()           Permissions already granted
 ...   User fills login
100ms  Login succeeds
110ms  subscribeToPushNotifications()     Skip welcome this time
150ms  hasSeenWelcomeNotification()       Returns true
160ms  Ready for ride requests
```

---

## User Experience

### 1️⃣ First Ever User
```
1. Open app
2. See permission request 👉 tap "Allow"
3. Fill login
4. Tap Login
5. See welcome notification with ₹50 discount 🎉
6. Tap notification → booking screen opens
7. Enter discount code
8. Ready to book first ride
```

### 2️⃣ Returning User
```
1. Open app
2. Fill login
3. Tap Login
4. No welcome notification (already seen)
5. Ready to use app normally
6. Get notifications for ride requests, driver acceptance, etc.
```

### 3️⃣ User Denied Permissions
```
1. Open app
2. See permission request 👉 tap "Don't Allow"
3. App still works normally
4. Register subscription (but token will be null)
5. No notifications will be delivered
6. User can enable in Settings → Notifications
```

---

## Backend Integration

### API Route: POST /api/push/subscribe
```typescript
{
  userId: "user-123",
  pushToken: "ExponentPushToken[...]",
  platform: "ios" | "android"
}
```

**Response**: `{ success: true, subscription: {...} }`

**Automatically Called When**: User logs in

**Called From**: `subscribeToPushNotifications()` in AuthContext

---

## Testing the Auto Behavior

### Test Welcome Notification
```bash
# Clear app data to reset the state
# Or remove from AsyncStorage:
AsyncStorage.removeItem('welcomeNotificationSeen')

# Then login again - welcome should appear
```

### Test Permissions
```bash
# iOS: Settings → Charter Keke → Notifications
# Android: Settings → Apps → Charter Keke → Notifications
# Toggle on/off to test
```

### Test Different Platforms
```bash
# Since we detect Platform.OS, it automatically works for:
iOS:     Push via APNS          ✅
Android: Push via FCM           ✅
Web:     Push via web-push      ✅
```

---

## Summary: What's Automatic Now

| Feature | Automatic? | When? |
|---------|-----------|-------|
| Request permissions | ✅ Yes | App startup |
| Get push token | ✅ Yes | After permissions granted |
| Register with backend | ✅ Yes | On login |
| Send welcome notification | ✅ Yes | First login only |
| Detect platform (iOS/Android) | ✅ Yes | Automatically |
| Request permission retry | ✅ Yes | If denied once |
| Store subscription locally | ✅ Yes | On successful subscribe |
| Handle background notifications | ✅ Yes | Always listening |
| Clean up on logout | ✅ Yes | On logout |

---

## What Users Will See

### iOS User Timeline
```
1. Open app
   ↓
2. "Charter Keke" Would Like to Send You Notifications
   [Don't Allow] [Allow]
   
3. Tap [Allow]
   ↓
   
4. Login to app
   ↓
   
5. 🎉 Notification appears:
   "Welcome to Charter Keke!
    Get ₹50 off your first ride!
    Use code: KEKE50"
   
6. Tap notification
   ↓
   
7. Opens booking screen with KEKE50 pre-filled
```

### Android User Timeline
```
1. Open app
   ↓
   
2. If first use:
   Android system shows notification permission
   (Usually in a status bar or permission dialog)
   
3. Login to app
   ↓
   
4. 🎉 Notification appears at top of screen:
   "Welcome to Charter Keke!"
   
5. Swipe down to see full notification:
   "Get ₹50 off your first ride! Use code: KEKE50"
   
6. Tap notification
   ↓
   
7. Open booking screen with KEKE50 code ready
```

---

## Important Notes

1. **Permission only asked once** - Apple/Google requirement
2. **Welcome only shown once** - Tracked in AsyncStorage
3. **Works offline** - Tokens stored locally
4. **No user action required** - Fully automatic
5. **Engagement boost** - Users see value immediately (₹50 discount)
6. **Cross-platform** - Same experience on iOS & Android

---

**Status**: ✅ Fully Automatic & Engaging  
**No User Action Needed**: Just open app and login  
**First-Timer Engagement**: Welcome notification with discount code
