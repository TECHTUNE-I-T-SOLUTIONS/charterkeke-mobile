# Mobile App Notifications Toggle - Integration Guide

## 📱 What Changed in Your Profile Screen

Your profile screen toggle now **actually subscribes/unsubscribes** from push notifications instead of just changing local state.

### Before (❌ Didn't work)
```tsx
const [notifEnabled, setNotifEnabled] = useState(true);

<Switch 
  value={notifEnabled} 
  onValueChange={setNotifEnabled}  // ← Just local state, no API call!
/>
```

### After (✅ Works correctly)
```tsx
const { isSubscribed, isLoading, error, toggleSubscription } = usePushNotificationToggle();

<Switch 
  value={isSubscribed} 
  onValueChange={toggleSubscription}  // ← Calls API to save preference!
/>
```

---

## 🔧 How The Toggle Works Now

### When User Taps Toggle:

```
User taps toggle switch
        ↓
toggleSubscription() called
        ↓
Check if subscribed:
  - If YES → Call DELETE /api/notifications/subscribe
  - If NO → Call POST /api/notifications/subscribe
        ↓
Show loading state (spinning icon)
        ↓
Wait for API response
        ↓
If success:
  - Update isSubscribed state
  - Show success (no popup - silent update)
        ↓
If error:
  - Show error message under toggle
  - Revert state after error
```

---

## 🎨 User Interface

### Enabled State
```
🔔 Notifications       [● ON]
✓ Enabled
Get alerts for rides, messages, and updates
```

### Disabled State  
```
🔔 Notifications       [○ OFF]
✗ Disabled
Get alerts for rides, messages, and updates
```

### Loading State
```
🔔 Notifications       [⟲] (spinner)
Updating...
Get alerts for rides, messages, and updates
```

### Error State
```
🔔 Notifications       [● ON/OFF]
Error loading...
❌ Failed to update preference. Please try again.
Get alerts for rides, messages, and updates
```

---

## 📱 Files Involved

### 1. **usePushNotificationToggle.ts** (Hook)
**What it does:**
- Manages subscription state
- Makes API calls to subscribe/unsubscribe
- Handles loading and error states
- Checks current subscription status on mount

**Key functions:**
```tsx
// Exported:
const {
  isSubscribed,      // boolean - is user subscribed?
  isLoading,         // boolean - API call in progress?
  error,             // string | null - error message if failed
  toggleSubscription // function - call when user taps toggle
} = usePushNotificationToggle();
```

### 2. **driver/profile.tsx** (Screen)
**What it does:**
- Uses the hook
- Displays toggle UI
- Shows loading spinner when API call in progress
- Shows error message if something fails

**The toggle section:**
```tsx
<Switch 
  value={isSubscribed} 
  onValueChange={toggleSubscription} 
  disabled={notifLoading || Boolean(notifError)}  // Disable while loading/error
  trackColor={{ true: BRAND.primary, false: theme.colors.border }}
  thumbColor="#FFF"
/>
```

### 3. **API Route** (/api/notifications/subscribe)
**What it does:**
- POST: Save new subscription
  - Input: { push_token, platform }
  - Output: { success: true, subscription }

- DELETE: Remove subscription
  - Input: { push_token } (optional)
  - Output: { success: true }

- GET: Check subscription status
  - Output: { subscriptions: [...], isSubscribed: true/false }

**Handles custom auth:**
```tsx
const session = await getSessionFromRequest(request);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
// ✅ Works with your custom auth system
```

---

## 🔄 The Flow When User Subscribes

```
Profile screen loads
    ↓
usePushNotificationToggle hook initializes (on mount)
    ↓
1. Try to get stored token:
   AsyncStorage.getItem('expo_push_token')
    ↓
2. If token exists:
   Call GET /api/notifications/subscribe
    ↓
3. Your API returns:
   { subscriptions: [...], isSubscribed: true/false }
    ↓
4. Hook checks:
   "Is my token in the active subscriptions list?"
    ↓
5. Set isSubscribed = true/false
    ↓
6. Show toggle switch with correct state
    ↓
User sees toggle as ON if subscribed, OFF if not ✅
```

---

## 🔄 The Flow When User Toggles ON

```
User taps toggle → OFF to ON
    ↓
Hook calls toggleSubscription()
    ↓
Set isLoading = true (show spinner)
    ↓
Check if token exists:
  - If NO: Request permission, get new token
  - If YES: Use existing token
    ↓
POST /api/notifications/subscribe
{
  push_token: "ExponentPushToken[...]",
  platform: "android"
}
    ↓
Your API:
  1. Verify user auth (custom auth)
  2. INSERT/UPDATE push_subscriptions
     { user_id, push_token, is_active: true }
    ↓
Response: { success: true }
    ↓
Hook sets isSubscribed = true
Hook sets isLoading = false
    ↓
Toggle shows ON state ✅
Toggle stops spinning 🎉
```

---

## 🔄 The Flow When User Toggles OFF

```
User taps toggle → ON to OFF
    ↓
Hook calls toggleSubscription()
    ↓
Set isLoading = true (show spinner)
    ↓
Get stored token from AsyncStorage
    ↓
DELETE /api/notifications/subscribe
{
  push_token: "ExponentPushToken[...]"
}
    ↓
Your API:
  1. Verify user auth
  2. UPDATE push_subscriptions
     SET is_active = false
     WHERE push_token = ... AND user_id = ...
    ↓
Response: { success: true }
    ↓
Hook sets isSubscribed = false
Hook sets isLoading = false
    ↓
Toggle shows OFF state ✅
Toggle stops spinning 🎉

Now this user WON'T get notifications anymore!
```

---

## ⚠️ Error Handling

### If API Call Fails:

```
toggleSubscription() called
    ↓
API call fails (e.g., 401, 500, network error)
    ↓
Catch error
    ↓
Show error message:
  - "Please log in to manage notifications" (401/403)
  - "Error updating notification preference" (other)
    ↓
Display error under toggle
    ↓
Call checkSubscriptionStatus() to refresh
    ↓
Revert toggle to previous state
    ↓
User can try again
```

**Error messages shown:**
- "Please log in to manage notifications" → User not authenticated
- "Notification permission denied" → User denied permission request
- Network errors → API server down or no internet
- "Error checking subscription status" → Problem reading from API

---

## 📋 What Gets Stored

### In Phone (AsyncStorage):
```
Key: 'expo_push_token'
Value: "ExponentPushToken[WK47jNQM9WshB4YS1RnXg]"

This is stored when app first gets token
and reused for every subscription call
```

### In Database (push_subscriptions):
```
Row: {
  id: "uuid-1234",
  user_id: "user-id-here",
  push_token: "ExponentPushToken[...]",
  platform: "android",
  is_active: true/false,  ← ← ← Controlled by toggle!
  subscribed_at: "2024-04-05T10:30:00Z"
}
```

---

## 🧪 Testing the Toggle

### Test 1: Subscribe (Toggle ON)
```
1. Open app → Log in
2. Go to Profile screen
3. Toggle shows OFF initially
4. Tap toggle
5. Watch for:
   - Spinner appears
   - Toggle switches to ON
   - Spinner disappears
6. Check database:
   SELECT * FROM push_subscriptions WHERE user_id = 'xxx'
   → Should have 1 row with is_active = true
```

### Test 2: Unsubscribe (Toggle OFF)
```
1. Toggle currently ON
2. Tap toggle again
3. Watch for:
   - Spinner appears
   - Toggle switches to OFF
   - Spinner disappears
4. Check database:
   SELECT * FROM push_subscriptions WHERE user_id = 'xxx'
   → Row should have is_active = false
```

### Test 3: Multi-Device
```
1. Log in on Device A → Toggle ON
2. Log in on Device B (same account) → Toggle ON
3. Check database:
   SELECT COUNT(*) FROM push_subscriptions WHERE user_id = 'xxx' AND is_active = true
   → Should be 2 (one token per device)
4. Test sending notification → Should arrive on both
5. Toggle OFF on Device A
6. Database → Device A's row has is_active = false, Device B still true
```

### Test 4: Network Error
```
1. Put phone in airplane mode
2. Toggle the switch
3. Should show error: "Error updating notification preference"
4. Turn off airplane mode
5. Try again → Should work
```

---

## 🐛 Troubleshooting

### Toggle Shows Spinner Forever

**Cause**: API endpoint not responding or timeout

**Fix**:
1. Check API endpoint: `GET /api/notifications/subscribe`
2. Verify custom auth is working
3. Check server logs for errors
4. Make sure database connection works

### "Please log in to manage notifications"

**Cause**: User session not recognized

**Fix**:
1. User must log in first
2. Check `useAuth()` returns valid user ID
3. Verify custom auth implementation
4. Try logging out and back in

### Toggle Doesn't Save Preference

**Cause**: API returning success but database not updating

**Fix**:
1. Manually run: `SELECT * FROM push_subscriptions WHERE user_id = 'xxx'`
2. Verify row exists with correct push_token
3. Check if is_active column is being updated
4. Review server logs for successful updates

### Show Error After Changing Status

**Cause**: API call succeeded but re-checking status failed

**Fix**:
1. Close profile screen
2. Reopen profile screen
3. Hook will retry checking status

After reopenning, should show correct status.

---

## 💡 Quick Reference

| Question | Answer |
|----------|--------|
| Where is toggle UI? | `app/driver/profile.tsx`, lines 274-299 |
| Where is subscription logic? | `hooks/usePushNotificationToggle.ts` |
| What API does toggle call? | `POST/DELETE /api/notifications/subscribe` |
| Where does token come from? | Expo service when app requests permission |
| How long does token last? | Until user uninstalls app or revokes permission |
| Can one user have multiple tokens? | YES - one per device |
| What determines is_active? | The toggle switch (true = subscribed, false = not) |
| Can user toggle while logging out? | No - hook checks authentication first |
| What if user never permits notifications? | Token is null, can't subscribe |

---

## ✅ You're Done!

The toggle is now fully integrated. When users open their profile:

✅ They see notifications toggle
✅ Subscription status auto-loads
✅ Toggle works to turn on/off
✅ Status saves to database
✅ Server can use is_active flag to control delivery

All you need to do now is **test it** and make sure the API endpoint is deployed to your server.
