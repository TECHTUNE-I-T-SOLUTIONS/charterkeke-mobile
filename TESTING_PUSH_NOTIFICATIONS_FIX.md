# Push Notifications Fix - Quick Testing Guide

## Test This Now! 🚀

### What Was Fixed
❌ **Before:** App crashed or hung when requesting notification permissions (Firebase/Google Play Services error)  
✅ **After:** App gracefully handles permission requests even if Firebase unavailable, with automatic recovery

---

## Quick Test (5 minutes)

### Step 1: Start the App
```bash
cd d:\Codes\ck
pnpm start
```

### Step 2: Open in Expo Go
- Scan QR code with Expo Go
- Wait for app to load
- Watch the console for notification logs

### Step 3: Expected Console Output

**If Google Play Services Available (Real Device):**
```
LOG  🔔 [NOTIFICATIONS] Requesting permissions...
LOG  ✅ [NOTIFICATIONS] Permissions granted, token: ExponentPushToken[abc123...]
LOG  ✅ [NOTIFICATIONS] Push token synced to backend
LOG  ✅ [NOTIFICATIONS] Subscribed to push notifications
```

**If Google Play Services Unavailable (Emulator):**
```
LOG  🔔 [NOTIFICATIONS] Requesting permissions...
LOG  ✅ [NOTIFICATIONS] Permissions granted
WARN ⚠️ [NOTIFICATIONS] Firebase/Google Play Services unavailable on this device
LOG  ⏳ [NOTIFICATIONS] Using temporary placeholder token (Firebase not ready)
LOG  ✅ [NOTIFICATIONS] Subscribed to push notifications
LOG  🔄 [NOTIFICATIONS] Retry attempt 1/5 to get real push token
```

### Step 4: Check Behavior

✅ **Permission dialog should appear** (if not previously granted)  
✅ **User can grant or deny** (dialog fully functional)  
✅ **No crash, no hang** (app continues even if Firebase fails)  
✅ **Console shows "Subscribed to push"** (subscription succeeds)  
✅ **Automatic retries** (if placeholder, app retries in background)

---

## Detailed Testing

### Test Scenario 1: Grant Permission (Optimal Path)
```
1. Launch app
2. Permission dialog appears
3. Tap "Allow" to grant permission
4. Console shows: "Permissions granted, token: ExponentPushToken[...]"
5. Firebase token obtained immediately
6. Notifications available immediately
```

**Check:** No retries needed, token shows `ExponentPushToken[...]`

---

### Test Scenario 2: Grant Permission but Firebase Unavailable (Emulator)
```
1. Launch app on Android Emulator (without Google Play Services)
2. Permission dialog appears
3. Tap "Allow" to grant permission
4. Console shows: "Permissions granted" then "Firebase unavailable"
5. Placeholder token shown: "placeholder_1712282400000"
6. No crash, app continues normally
7. Background retries scheduled
```

**Check:** 
- ✅ No error/crash
- ✅ Placeholder token created
- ✅ Console messages explain situation
- ✅ Retries shown in logs

---

### Test Scenario 3: Deny Permission
```
1. Launch app
2. Permission dialog appears
3. Tap "Deny"
4. Console shows: "Permission denied by user"
5. No subscription attempted
6. App continues normally
```

**Check:** Graceful handling of denial

---

### Test Scenario 4: Automatic Retry (Emulator)
```
1. Start with placeholder token (from Scenario 2)
2. Watch console logs for:
   
   After ~10 seconds:
   🔄 Retry attempt 1/5 to get real push token
   ⏳ Firebase still unavailable (retry 1/5)
   
   After ~20 seconds:
   🔄 Retry attempt 2/5...
   
   After ~40 seconds:
   🔄 Retry attempt 3/5...
   
   etc.
```

**Check:**
- ✅ Retries happen in background without interrupting user
- ✅ Exponential backoff visible (10s, 20s, 40s...)
- ✅ Up to 5 attempts shown

---

### Test Scenario 5: Token Upgrade When Firebase Becomes Available
```
1. Start with placeholder token on emulator
2. Install Google Play Services on emulator (advanced)
3. Watch for "Retry attempt X/5" logs
4. Within a few retries, should see:

   ✅ Successfully obtained real push token on retry
   ✅ Real token synced to backend
   
5. Console shows new token: "ExponentPushToken[...]"
6. Notifications now available
```

**Check:**
- ✅ Automatic upgrade from placeholder to real
- ✅ Token synced to backend
- ✅ No user action needed

---

## Console Log Patterns

### Pattern 1: Success (Real Token Immediately)
```
🔔 [NOTIFICATIONS] Requesting permissions...
✅ [NOTIFICATIONS] Permissions granted, token: ExponentPushToken[abc...
✅ [NOTIFICATIONS] Push token synced to backend
✅ [NOTIFICATIONS] Subscribed to push notifications
```
⏱️ Duration: < 1 second

---

### Pattern 2: Firebase Unavailable but Recoverable
```
🔔 [NOTIFICATIONS] Requesting permissions...
✅ [NOTIFICATIONS] Permissions granted
⚠️ [NOTIFICATIONS] Firebase/Google Play Services unavailable on this device
📱 This is normal on emulators without Google Play Services installed
⏳ [NOTIFICATIONS] Using temporary placeholder token (Firebase not ready)
✅ [NOTIFICATIONS] Push token synced to backend
✅ [NOTIFICATIONS] Subscribed to push notifications
🔄 [NOTIFICATIONS] Retry attempt 1/5 to get real push token
```
⏱️ Duration: < 2 seconds (retries in background)

---

### Pattern 3: Manual Retry Success
```
🔄 [NOTIFICATIONS] Manual push token retry initiated
✅ [NOTIFICATIONS] Real token obtained: ExponentPushToken[...
✅ [NOTIFICATIONS] Real token synced to backend
```
⏱️ Called when user clicks "Retry" in settings

---

### Pattern 4: Permission Denied
```
🔔 [NOTIFICATIONS] Requesting permissions...
⚠️ [NOTIFICATIONS] Permission denied by user
```
⏱️ User explicitly denied in system dialog

---

## Checking Logs in Expo Go

### Method 1: Console Output
```bash
# Terminal shows real-time logs
pnpm start
# Watch output in Terminal
```

### Method 2: Expo Dev Tools
```
Press 'j' in terminal after `pnpm start`
Shows collapsed log view with search
```

### Method 3: Device Console (iOS)
```
Expo Go > Menu > View Logs
Scroll to see notification-related entries
```

### Method 4: adb (Android Emulator)
```bash
# In another terminal:
adb logcat | grep -i notification
# Shows Android system logs + app logs
```

---

## Expected States by Device Type

### Real Android Device (with Google Play Services)
| State | Token Type | Status | Auto Retry |
|-------|-----------|--------|-----------|
| Initial | Real | token_ready | ❌ Not needed |
| Send ability | Immediate | Ready now | N/A |
| Time to ready | 0-1s | ASAP | N/A |

**Example:** Latest flagship, iOS device, recent Play Services

---

### Android Emulator (without Google Play Services)
| State | Token Type | Status | Auto Retry |
|-------|-----------|--------|-----------|
| Initial | Placeholder | permission_granted_token_pending | ✅ Yes (10s) |
| After 10s | Placeholder | permission_granted_token_pending | ✅ Yes (20s) |
| After 20s | Placeholder | permission_granted_token_pending | ✅ Yes (40s) |
| User installs GMS | Real | token_ready | ✅ Succeeds |
| Send ability | After upgrade | Follows upgrade | As it succeeds |

**Example:** Standard emulator without extras, older devices without Play Services

---

### Emulator with Google Play Services (Images)
| State | Token Type | Status | Auto Retry |
|-------|-----------|--------|-----------|
| Initial | Real | token_ready | ❌ Not needed |
| Time to ready | 0-1s | ASAP | N/A |
| Send ability | Immediate | Ready now | N/A |

**Note:** Use these emulator images for best testing:
- `system-images/android-31/google_apis/x86_64` (or higher)
- Google Play Services pre-installed = no placeholder needed

---

## Troubleshooting Test Issues

### Issue: No permission dialog appears
**Cause:** Permission already granted in previous test  
**Solution:**
```
Expo Go > Settings > Granted Permissions > Notifications > Remove
# Or reinstall app, or use different device
```

### Issue: Logs not showing notification messages
**Cause:** Notification service not initialized  
**Solution:**
```
1. Check console.log statements are visible
2. Search terminal for "NOTIFICATIONS"
3. Verify app didn't error during init
4. Check AuthContext initialization
```

### Issue: Placeholder tokens appearing forever
**Cause:** Manual retry not working (could be network issue)  
**Solution:**
```
1. Check device/emulator has internet
2. Verify backend /notifications/subscribe endpoint is working
3. Try manual retry button (if added)
4. Restart app to restart retries
```

### Issue: "Method createDownloadResumable is deprecated" (different topic)
**Note:** This is about file downloads, not notifications  
**Solution:** Push notification fix is independent - shouldn't affect this

---

## Manual Retry Button (Optional Implementation)

Add to settings screen:

```typescript
import { manuallyRetryPushToken } from '@/services/notificationService';

export function NotificationSettingsScreen() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const result = await manuallyRetryPushToken(currentUser.id);
      Alert.alert(
        result.success ? '✅ Success' : '⚠️ Status',
        result.message
      );
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <TouchableOpacity
      disabled={isRetrying}
      onPress={handleRetry}
    >
      <Text>{isRetrying ? 'Retrying...' : 'Retry Push Token'}</Text>
    </TouchableOpacity>
  );
}
```

**Expected results:**
- ✅ Real token already obtained: "Push token updated successfully!"
- ⚠️ Still using placeholder: "Google Play Services still initializing"
- ❌ Firebase permanently unavailable: "MISSING_INSTANCEID_SERVICE" message

---

## Database Validation

After app syncs with backend, check database:

```sql
-- Find the user who just tested
SELECT 
  user_id,
  push_token,
  platform,
  status,
  is_placeholder,
  reason,
  subscribed_at,
  token_updated_at
FROM push_subscriptions
WHERE user_id = 'your-test-user-id'
ORDER BY subscribed_at DESC
LIMIT 1;

-- Expected states:
-- status='token_ready', is_placeholder=0, push_token='ExponentPushToken[...]'
-- OR
-- status='permission_granted_token_pending', is_placeholder=1, push_token='placeholder_...'
-- OR
-- status='permission_denied', is_placeholder=0, push_token=NULL
```

---

## Success Checklist ✅

- [ ] App launches without crashes
- [ ] Permission dialog appears (if not previously granted)
- [ ] User can grant or deny permission
- [ ] Console shows subscription success message
- [ ] Either real or placeholder token obtained
- [ ] No `MISSING_INSTANCEID_SERVICE` error crashes app
- [ ] Retries visible in logs (if using placeholder)
- [ ] App continues functioning normally
- [ ] Backend receives subscription with correct status
- [ ] Database updated with token status

---

## Next Steps

### If Running on Real Device
1. ✅ Test with this guide
2. ✅ Verify "Permission granted" shows
3. ✅ Verify real token obtained (no placeholder needed)
4. ✅ Verify notifications work (send test from backend)

### If Running on Emulator
1. ✅ Test with this guide
2. ✅ Verify placeholder token created (expected)
3. ✅ Watch automatic retries in logs (expected)
4. ✅ Note: Won't receive actual notifications on emulator

### Before Production
1. ✅ Test on real Android device with Google Play Services
2. ✅ Test on real iOS device
3. ✅ Verify backend database updated correctly
4. ✅ Check health metrics (% of users with real tokens)

---

## Support

**Still seeing `MISSING_INSTANCEID_SERVICE` crash?**
- ✅ This is now fixed - verify you have latest code
- Verify deployment pushed the latest `notificationService.ts`

**Placeholder tokens not upgrading to real?**
- Verify Google Play Services available on device
- Check device has internet for retry calls
- Verify backend `/notifications/subscribe` endpoint responds

**Notifications not working at all?**
- Verify token is real (not `placeholder_...`)
- Verify backend filters: `is_placeholder = 0 AND status = 'token_ready'`
- Verify Expo project ID in `app.json` matches backend

