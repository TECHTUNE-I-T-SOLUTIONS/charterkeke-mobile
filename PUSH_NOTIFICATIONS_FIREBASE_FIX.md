# Push Notifications - Firebase MISSING_INSTANCEID_SERVICE Fix

## Problem & Error

### Error Message
```
ERROR  ❌ [NOTIFICATIONS] Error requesting permissions: 
  [Error: Fetching the token failed: 
    java.util.concurrent.ExecutionException: 
    java.io.IOException: MISSING_INSTANCEID_SERVICE]
```

### Root Cause

This error occurs on **Android** when:
1. **Google Play Services** are not installed/available on the device
2. **Firebase Cloud Messaging (FCM)** cannot be initialized
3. The device is an **emulator without Google Play Services**
4. The backend Firebase project is not properly configured
5. The device returns temporarily unavailable tokens during initialization

The error was **blocking the entire notification permission system**, preventing users from:
- Accepting/declining ride requests
- Receiving important notifications
- Using critical app features

---

## Solution Implemented

### Architecture Changes

The fix separates the **permission request** from the **token retrieval**:

```typescript
// OLD (BROKEN): Both operations blocked together
const permissions = await requestPermissionsAsync();
const token = await getExpoPushTokenAsync();  // ❌ Fails if Firebase unavailable
// Permission never shown if Firebase fails

// NEW (FIXED): Separate operations
const permissions = await requestPermissionsAsync();  // ✅ Always shows
const token = await getExpoPushTokenAsync();          // ✅ Can fail gracefully
```

### Key Improvements

#### 1. **Graceful Error Handling** ✅
- Permission prompt shown **even if Firebase is unavailable**
- Token retrieval separated from permission request
- Placeholder tokens allow app to continue functioning
- User gets meaningful feedback instead of crash

#### 2. **Automatic Retry System** ✅
- Automatic retries with **exponential backoff**: 10s, 20s, 40s, 80s, 160s
- Up to **5 retry attempts** throughout app session
- Background retry doesn't interrupt user experience
- Switches from placeholder to real token when available

#### 3. **Database Status Tracking** ✅
Backend can now distinguish token states:
```json
{
  "status": "permission_granted_token_pending",
  "reason": "Firebase/Google Play Services not available",
  "pushToken": "placeholder_1234567890",
  "isPlaceholder": true
}
```

#### 4. **Manual Retry Endpoint** ✅
New function for settings screen or user-initiated retry:
```typescript
const result = await manuallyRetryPushToken(userId);
// Returns: { success: boolean, message: string, token?: string }
```

---

## Code Changes

### File: `services/notificationService.ts`

#### Change 1: Separate Permission From Token Retrieval
```typescript
// Step 1: Request permissions (independent)
const { status } = await Notifications.requestPermissionsAsync();

// Step 2: Try to get token (separate, with error handling)
try {
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });
  return token.data;
} catch (tokenError) {
  // Handle Firebase error gracefully
  if (tokenError.message.includes('MISSING_INSTANCEID_SERVICE')) {
    console.warn('Firebase unavailable, permissions still granted');
    return `placeholder_${Date.now()}`;  // Placeholder allows app to continue
  }
  // ...
}
```

#### Change 2: Placeholder Token System
```typescript
const isPlaceholder = pushToken.startsWith('placeholder_');

const subscription = {
  pushToken,
  isPlaceholder,        // Backend can see token is temporary
  subscribedAt: new Date().toISOString(),
  tokenUpdatedAt: new Date().toISOString(),
};

// Backend payload indicates token status
if (isPlaceholder) {
  payload.status = 'permission_granted_token_pending';
  payload.reason = 'Firebase/Google Play Services not available';
}
```

#### Change 3: Automatic Retry System
```typescript
if (isPlaceholder) {
  scheduleTokenRetry(userId);  // Automatic background retries
}

// Retries with exponential backoff
const delaySeconds = Math.min(10 * Math.pow(2, attempt - 1), 300);
```

#### Change 4: Manual Retry Function
```typescript
export const manuallyRetryPushToken = async (userId: string) => {
  // Try to get real token immediately
  // Accessible from settings screen or user action
  // Returns success/failure status with message
};
```

---

## How It Works Now

### On App Start (Before Fix)
```
1. User launches app
2. Request notification permissions ❌ FAILS due to Firebase
3. Permission dialog never shown
4. App can't receive notifications
5. Push subscription fails
```

### On App Start (After Fix)
```
1. User launches app
2. Request notification permissions ✅ SUCCEEDS
   → Permission dialog shown
   → User grants permission
3. Try to get push token
   → Firebase unavailable → Use placeholder token
   → Firebase available → Use real token
4. Subscribe with token (real or placeholder)
5. Background retry scheduled (if placeholder)
   → App checks every 10, 20, 40, 80, 160 seconds
   → Switches to real token when available
   → No user interaction needed
```

### Database States

```
STATE 1: Permission Granted, No Token Yet
{
  "user_id": "123",
  "status": "permission_granted_token_pending",
  "push_token": "placeholder_1234567890",
  "is_placeholder": true,
  "subscribed_at": "2025-04-05T10:00:00Z"
}

STATE 2: Real Token Obtained (Automatic or Manual)
{
  "user_id": "123",
  "status": "token_ready",
  "push_token": "ExponentPushToken[abc123...]",
  "is_placeholder": false,
  "subscribed_at": "2025-04-05T10:00:00Z",
  "token_updated_at": "2025-04-05T10:05:30Z"
}

STATE 3: Permission Denied
{
  "user_id": "123",
  "status": "permission_denied",
  "push_token": null,
  "subscriber_at": "2025-04-05T10:00:00Z"
}
```

---

## Testing Scenarios

### Scenario 1: Real Device (Android with Google Play Services)
✅ **Expected:**
1. Notification permission request shown
2. Real token obtained immediately
3. No placeholder token needed
4. Instant notification delivery works

**Test Steps:**
```bash
# Build for real Android device with Google Play Services
eas build --platform android --profile preview
# Install APK from Google Play or sideload
# Open app, grant notification permission
# Check logs: Should see "Push token obtained"
```

### Scenario 2: Emulator (Android without Google Play Services)
⚠️ **Expected (Graceful Degradation):**
1. Notification permission request shown ✅
2. Firebase error caught ⚠️
3. Placeholder token created ✅
4. Permission system works normally ✅
5. Background retries scheduled ✅
6. When real device tested later, switches to real token ✅

**Test Steps:**
```bash
# Android Emulator without Google Play Services
expo start
# Scan QR with Expo Go (or use development build)
# Grant notification permission
# Check logs: Should see "Firebase unavailable, permissions still granted"
# Should see "Using temporary placeholder token"
# Should see "Retry attempt 1/5 to get real push token"
```

### Scenario 3: Manual Retry (Settings Screen)
**Expected:**
1. User sees notification status in settings
2. User clicks "Retry Push Token"
3. App attempts to get real token immediately
4. Shows success/failure message

**Test Function:**
```typescript
// In settings screen
const result = await manuallyRetryPushToken(userId);
Alert.alert(
  result.success ? '✅ Success' : '❌ Failed',
  result.message
);
```

### Scenario 4: Recovery After Firebase Becomes Available
**Expected:**
1. Firebase initially unavailable (placeholder token)
2. Automatic retry runs in background
3. Firebase becomes available (e.g., Play Services installed later)
4. Real token obtained automatically
5. Database updated with real token
6. Notifications start working

**Test Steps:**
1. Start app on emulator without Google Play Services
2. Grant permission (gets placeholder token)
3. Wait and watch logs for "Retry attempt 1/5..."
4. Use ADB to install Google Play Services
5. Wait for next retry attempt
6. Should see "Successfully obtained real push token on retry"

---

## Database Migration (Backend)

### Add Status Columns to `push_subscriptions` Table

```sql
-- Add new columns to track token status
ALTER TABLE push_subscriptions ADD COLUMN (
  status VARCHAR(50) DEFAULT 'unknown',
  is_placeholder BOOLEAN DEFAULT false,
  reason VARCHAR(255),
  token_updated_at TIMESTAMP DEFAULT NULL
);

-- Index for finding placeholder tokens
CREATE INDEX idx_placeholder_tokens ON push_subscriptions(is_placeholder, user_id);

-- Cleanup old placeholder tokens periodically
-- DELETE FROM push_subscriptions 
-- WHERE is_placeholder = true 
--   AND token_updated_at IS NULL 
--   AND subscribed_at < NOW() - INTERVAL '24 hours';
```

### Backend Logic Updates

**Update Endpoint: `/notifications/subscribe`**

```typescript
// Handle different status values
switch (payload.status) {
  case 'permission_granted_token_pending':
    // Permission granted but Firebase unavailable
    // Store with is_placeholder = true
    // App will retry automatically
    break;
    
  case 'token_ready':
    // Real token available
    // Update existing placeholder with real token
    // is_placeholder = false
    break;
    
  case 'permission_denied':
    // User denied permission
    // Don't retry for this user
    break;
}

// When upgrading row from placeholder to real token:
UPDATE push_subscriptions
SET 
  push_token = new_token,
  is_placeholder = false,
  status = 'token_ready',
  token_updated_at = NOW()
WHERE user_id = ? AND is_placeholder = true;
```

---

## API Contract

### POST `/notifications/subscribe`

**Request (with Real Token):**
```json
{
  "pushToken": "ExponentPushToken[abc123...]",
  "platform": "android",
  "status": "token_ready"
}
```

**Request (with Placeholder Token - Initial Login):**
```json
{
  "pushToken": "placeholder_1712282400000",
  "platform": "android",
  "status": "permission_granted_token_pending",
  "reason": "Firebase/Google Play Services not available"
}
```

**Request (Permission Denied):**
```json
{
  "pushToken": null,
  "platform": "android",
  "status": "permission_denied"
}
```

**Request (Manual Retry Success):**
```json
{
  "pushToken": "ExponentPushToken[abc123...]",
  "platform": "android",
  "status": "token_ready"
}
```

---

## Troubleshooting

### Issue 1: "Notifications working on some devices but not others"
**Cause:** Mix of placeholder and real tokens in database
**Solution:**
1. Check `is_placeholder` column in database
2. For each user, verify latest token is real (not placeholder)
3. Trigger manual retry for users with placeholders
4. Exclude placeholder tokens from push broadcast queries

### Issue 2: "Too many placeholder tokens in database"
**Cause:** Automatic retry timed out or failed
**Solution:**
1. Implement cleanup: delete placeholder tokens older than 24 hours
2. Check if Firebase project is properly configured
3. Verify Google Play Services available on target devices
4. Consider adding notification to user: "Enable Google Play Services for push notifications"

### Issue 3: "Real token obtained but notifications still not working"
**Cause:** Token registered but push service misconfigured
**Solution:**
1. Verify token format: `ExponentPushToken[...]`
2. Check Expo project ID in `app.json` matches token
3. Test with `expo push --token <token> --message "Test"`
4. Check backend send logic handles both real and placeholder tokens

---

## Configuration Checklist

- [ ] ✅ `app.json` has `expo-notifications` plugin configured
- [ ] ✅ `EXPO_PUBLIC_PROJECT_ID` environment variable set
- [ ] ✅ Firebase project created and configured
- [ ] ✅ Google Play Services available on real devices
- [ ] ✅ Backend has `/notifications/subscribe` endpoint
- [ ] ✅ Database can store `status` and `is_placeholder` columns
- [ ] ✅ App handles both real and placeholder tokens in broadcast queries
- [ ] ✅ Automatic retry scheduled on initial subscription
- [ ] ✅ Manual retry endpoint available for user action

---

## Summary of Changes

### What Was Fixed
1. ✅ Permission prompt now shown even if Firebase unavailable
2. ✅ App continues functioning with placeholder token
3. ✅ Automatic background retries without user action
4. ✅ Manual retry option for users/settings screen
5. ✅ Database tracks token status for backend intelligence
6. ✅ Graceful error messages instead of crashes

### User Impact
- **Before:** Notifications completely broken, app appears to crash at permission screen
- **After:** Notifications work reliably, graceful degradation if Firebase unavailable, automatic recovery

### Dev Impact
- Export new function: `manuallyRetryPushToken()` for settings screen
- Backend can now distinguish token states in `push_subscriptions` table
- Send broadcasts to users with confirmed real tokens only

### Deployment Steps
1. Update mobile app (this fix)
2. Deploy to Expo/EAS
3. Update database schema (add status columns)
4. Update backend subscription endpoint (handle status field)
5. Update push broadcast query (filter is_placeholder = false)
6. Monitor logs for placeholder token cleanup needs

---

## Related Documentation
- [Expo Notifications Documentation](https://docs.expo.dev/notifications/overview/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Google Play Services Setup](https://developers.google.com/android/guides/setup)
- [Emulator Setup with Google Play Services](https://developer.android.com/studio/run/emulator-install-gms)

