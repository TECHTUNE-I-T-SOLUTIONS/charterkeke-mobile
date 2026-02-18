# 🔔 Notification System - Development Testing Guide

## Quick Start

The notification system includes development helpers for easy testing. Make sure `EXPO_PUBLIC_DEVELOPMENT_MODE=true` is set in `.env.local`.

## Development Helpers

All helpers are available from the notification service and are only active in development mode.

### 1. **Test Welcome Notification**
```javascript
import { devForceWelcome } from './services/notificationService';

// Trigger welcome notification immediately
await devForceWelcome();
```
✅ Shows: "Get ₹50 off your first ride! Use code: KEKE50"

### 2. **Reset Welcome State (Re-test)**
```javascript
import { devResetWelcome } from './services/notificationService';

// Clear the welcome notification flag
await devResetWelcome();
// On next login, welcome will appear again
```

### 3. **Send Test Ride Request**
```javascript
import { devSendTestRideRequest } from './services/notificationService';

// Schedule a fake ride request notification
await devSendTestRideRequest();
```
✅ Shows: "🚗 Test Ride Request - Test Location A → Test Location B (₹250)"

### 4. **Check Subscription Status**
```javascript
import { devGetSubscriptionStatus } from './services/notificationService';

// Log current permission & subscription state
const status = await devGetSubscriptionStatus();
console.log(status);
```

Output:
```
{
  subscription: { userId: 'xxx', token: 'token-xxx' },
  welcomeSeen: false,
  environment: 'development',
  platform: 'ios' | 'android',
  developmentMode: true
}
```

## Testing Scenarios

### Scenario 1: New User Flow
```javascript
// 1. Reset welcome state
await devResetWelcome();

// 2. Log out (if logged in)
// 3. Log in (welcome should appear automatically)
```

Expected: Welcome notification with ₹50 discount code appears in NotificationCenter/system tray

### Scenario 2: Permission Testing
1. **First Time:**
   - App should prompt for notification permission
   - Accept → Notifications enabled
   - Reject → Notifications silently disabled

2. **Change Permission Later:**
   - Settings → App → Permissions → Notifications
   - Enable/Disable permission
   - App detects next subscription attempt

### Scenario 3: Ride Request Notification
```javascript
// Simulate incoming ride request
await devSendTestRideRequest();

// Tap notification → Should navigate to booking screen
```

### Scenario 4: Connection Testing
```javascript
// Check if properly connected
const status = await devGetSubscriptionStatus();

if (status.subscription) {
  console.log('✅ Connected to backend push service');
} else {
  console.log('❌ Not connected - check backend server');
}
```

## Running in Different Environments

### 📱 Physical Device (iOS/Android)
```bash
# 1. Start dev server
pnpm dev

# 2. Open Expo Go app on device
# 3. Scan QR code from terminal

# 4. Test helpers (from browser DevTools or Expo DevTools)
```

**Permission Dialog:** Shows native system dialog (iOS/Android style)

### 🖥️ iOS Simulator
```bash
pnpm dev
# Press 'i' to open iOS Simulator

# Simulator shows macOS-style notifications
# Click notifications to test tap behavior
```

### 🖥️ Android Emulator
```bash
pnpm dev
# Press 'a' to open Android Emulator

# Android shows system notification tray
# Pull down notification shade to see notifications
```

## Debugging Tips

### Enable Verbose Logging
- Already enabled in `.env.local` with `EXPO_PUBLIC_DEVELOPMENT_MODE=true`
- Look for `[DEV]`, `[NOTIFICATIONS]`, `🧪`, `🔔` prefixes in console

### Common Issues

**Permission Dialog Not Showing**
```javascript
// Check permission status
const status = await devGetSubscriptionStatus();
// Should show permission state
```

**Welcome Notification Not Appearing**
```javascript
// Verify it hasn't been seen
const { welcomeSeen } = await devGetSubscriptionStatus();
if (welcomeSeen) {
  await devResetWelcome();
}
```

**WebSocket Not Connected**
```javascript
// Check AuthContext logs
// Should show: "✅ [WEBSOCKET] Connected to backend"
// If not, backend server may not be running
```

**Notification Not Received**
- Check permission is granted in phone settings
- Verify backend server is running
- Check backend logs for push send errors

## Browser Console Usage

You can also import and call helpers directly in console:

```javascript
// In any React component or browser console
const { devForceWelcome, devGetSubscriptionStatus } = await import('./services/notificationService');

await devForceWelcome();
const status = await devGetSubscriptionStatus();
```

## Production Readiness Checklist

- [ ] Remove `EXPO_PUBLIC_DEVELOPMENT_MODE=true` from `.env` (prod should not have it)
- [ ] Test permission flow on real device (don't use simulator)
- [ ] Verify welcome notification appears only once
- [ ] Test notification tap opens correct screen
- [ ] Verify WebSocket reconnection works after network loss
- [ ] Test with slow 3G network (DevTools Network Throttling)
- [ ] Verify notifications work when app is backgrounded/closed

## Next Steps

1. **Test locally** using the helpers above
2. **Build for TestFlight/Play Testing** - ask backend team for production push keys
3. **Monitor** backend logs for push delivery
4. **Collect feedback** from testers on permission dialog and notification UX

---

**Questions?** Check the notification service code comments or ask backend team about push service setup.
