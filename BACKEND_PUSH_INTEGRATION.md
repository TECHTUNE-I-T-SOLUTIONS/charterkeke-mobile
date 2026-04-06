# Backend Integration Guide - Push Notifications with Placeholder Token Support

## Quick Summary for Backend Team

The mobile app now sends **two types of push tokens**:
1. **Real tokens** - `ExponentPushToken[...]` - can receive notifications immediately
2. **Placeholder tokens** - `placeholder_TIMESTAMP` - permission granted but Firebase unavailable

Your job: **Track the status and only send push notifications to users with real tokens**.

---

## Database Changes

### Step 1: Add Status Columns

```sql
-- Push notifications table
ALTER TABLE push_subscriptions ADD COLUMN (
  status VARCHAR(50) DEFAULT 'unknown' COMMENT 'permission_granted_token_pending, token_ready, permission_denied',
  is_placeholder BOOLEAN DEFAULT false COMMENT 'true if using placeholder token',
  reason VARCHAR(255) COMMENT 'Why token is placeholder (e.g., Firebase unavailable)',
  token_updated_at TIMESTAMP DEFAULT NULL COMMENT 'When real token last obtained'
);

-- Index for finding users with real tokens (for broadcasting)
CREATE INDEX idx_real_tokens ON push_subscriptions(is_placeholder)
  WHERE is_placeholder = false;

-- Index for finding placeholder tokens (for monitoring)
CREATE INDEX idx_placeholder_tokens ON push_subscriptions(is_placeholder)
  WHERE is_placeholder = true;
```

### Table Schema (Updated)

```sql
CREATE TABLE push_subscriptions (
  id UU ID PRIMARY KEY,
  user_id UUID NOT NULL,
  push_token VARCHAR(500),  -- Now can be real or placeholder
  platform VARCHAR(20),      -- 'ios' or 'android'
  status VARCHAR(50),        -- NEW: Track token status
  is_placeholder BOOLEAN DEFAULT false,  -- NEW: Is token temporary?
  reason VARCHAR(255),       -- NEW: Why placeholder? (optional)
  subscribed_at TIMESTAMP DEFAULT NOW(),
  token_updated_at TIMESTAMP,  -- NEW: When switched from placeholder to real
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_platform (user_id, platform),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## API Endpoint: POST `/notifications/subscribe`

### Endpoint Update

```typescript
// Type definitions for new request format
interface PushSubscribeRequest {
  pushToken: string | null;      // Real token, placeholder, or null
  platform: 'ios' | 'android';   // Device platform
  status?: string;               // NEW: permission_granted_token_pending, token_ready, permission_denied
  reason?: string;               // NEW: Optional reason for status
}

// Handler logic
router.post('/notifications/subscribe', async (req, res) => {
  const { pushToken, platform, status = 'unknown', reason } = req.body;
  const userId = req.user.id;

  try {
    // Determine if using placeholder token
    const isPlaceholder = pushToken?.startsWith('placeholder_') || false;

    // Find or create subscription
    let subscription = await pushSubscriptions.findOne({
      where: { userId, platform }
    });

    if (subscription) {
      // Update existing subscription
      
      // If switching FROM placeholder TO real token
      if (subscription.is_placeholder && !isPlaceholder && pushToken) {
        console.log(`🔄 [NOTIFICATIONS] User ${userId} upgraded from placeholder to real token`);
      }

      await subscription.update({
        pushToken: pushToken || null,
        status,
        isPlaceholder,
        reason: reason || null,
        tokenUpdatedAt: !isPlaceholder && isPlaceholder ? new Date() : null,  // Track when we got real token
      });
    } else {
      // Create new subscription
      subscription = await pushSubscriptions.create({
        userId,
        pushToken: pushToken || null,
        platform,
        status,
        isPlaceholder,
        reason: reason || null,
        tokenUpdatedAt: null,  // Don't have real token yet if placeholder
      });
    }

    // Log subscription for monitoring
    console.log(`✅ [PUSH] Subscription updated for user ${userId}:`, {
      platform,
      hasToken: !!pushToken,
      isPlaceholder,
      status,
    });

    return res.json({
      success: true,
      message: `Subscription updated`,
      subscription: {
        userId,
        platform,
        status,
        hasToken: !!pushToken,
      },
    });
  } catch (error) {
    console.error('❌ [PUSH] Subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error.message,
    });
  }
});
```

---

## Sending Push Notifications

### Important: Filter Out Placeholder Tokens

```typescript
// WRONG - will send to unready users
async function sendPushNotification(userId: string, message: string) {
  const subscription = await pushSubscriptions.findOne({ where: { userId } });
  await sendToExpo(subscription.pushToken, message);  // ❌ WRONG
}

// RIGHT - only send to users with real tokens
async function sendPushNotification(userId: string, message: string) {
  const subscription = await pushSubscriptions.findOne({
    where: {
      userId,
      is_placeholder: false,  // ✅ Only real tokens
      status: 'token_ready'   // ✅ Token is ready
    }
  });

  if (!subscription) {
    console.warn(`⚠️ No valid push token for user ${userId}`);
    return;  // Skip this user
  }

  await sendToExpo(subscription.pushToken, message);  // ✅ Send to real token only
}

// Broadcasting (send to all users in a group)
async function broadcastToDrivers(driverId: string, message: string) {
  const subscriptions = await pushSubscriptions.findAll({
    where: {
      userId: driverId,
      is_placeholder: false,        // ✅ Only real tokens
      status: 'token_ready',        // ✅ Token is confirmed ready
    }
  });

  for (const sub of subscriptions) {
    try {
      await sendToExpo(sub.pushToken, message);
    } catch (error) {
      console.error(`Failed to send to token: ${error.message}`);
    }
  }
}
```

### Health Check Query

```sql
-- Count users by token status
SELECT 
  status,
  is_placeholder,
  COUNT(*) as user_count,
  COUNT(CASE WHEN push_token IS NOT NULL THEN 1 END) as with_token,
  COUNT(CASE WHEN push_token IS NULL THEN 1 END) as without_token
FROM push_subscriptions
GROUP BY status, is_placeholder
ORDER BY user_count DESC;

-- Example output:
-- | status                          | is_placeholder | user_count | with_token | without_token |
-- |---|---|---|---|---|
-- | token_ready                     | 0              | 450        | 450        | 0             |
-- | permission_granted_token_pending| 1              | 12         | 12         | 0             |
-- | permission_denied               | 0              | 5          | 0          | 5             |

-- Find users stuck on placeholder tokens (older than 24 hours)
SELECT user_id, push_token, subscribed_at, status
FROM push_subscriptions
WHERE is_placeholder = true
  AND subscribed_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY subscribed_at DESC;

-- Cleanup old placeholder tokens (keep for 24 hours then clean)
DELETE FROM push_subscriptions
WHERE is_placeholder = true
  AND subscribed_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

---

## Monitoring & Debugging

### Log Examples

**User Login - Successful Token:**
```
✅ [NOTIFICATIONS] Permissions granted, token: ExponentPushToken[abc...]
✅ [NOTIFICATIONS] Push token synced to backend
```

**User Login - Firebase Unavailable:**
```
🔔 [NOTIFICATIONS] Requesting permissions...
✅ [NOTIFICATIONS] Permissions granted
⏳ [NOTIFICATIONS] Using temporary placeholder token (Firebase not ready)
🔄 [NOTIFICATIONS] Retry attempt 1/5 to get real push token
```

**Automatic Token Upgrade:**
```
🔄 [NOTIFICATIONS] Retry attempt 2/5 to get real push token
✅ [NOTIFICATIONS] Successfully obtained real push token on retry
✅ [NOTIFICATIONS] Real token synced to backend
```

### Monitoring Dashboard Queries

**Real-time Token Status:**
```sql
-- Percentage of users with valid tokens
SELECT 
  ROUND(
    SUM(CASE WHEN is_placeholder = 0 THEN 1 ELSE 0 END) * 100.0 / 
    COUNT(DISTINCT user_id), 
    2
  ) as ready_percentage,
  COUNT(DISTINCT user_id) as total_users,
  SUM(CASE WHEN is_placeholder = 0 THEN 1 ELSE 0 END) as ready_users,
  SUM(CASE WHEN is_placeholder = 1 THEN 1 ELSE 0 END) as pending_users
FROM push_subscriptions;
```

**Average Time from Placeholder to Real Token:**
```sql
-- How long does it take to get real token?
SELECT 
  AVG(TIMESTAMPDIFF(SECOND, subscribed_at, token_updated_at)) as avg_seconds,
  MIN(TIMESTAMPDIFF(SECOND, subscribed_at, token_updated_at)) as min_seconds,
  MAX(TIMESTAMPDIFF(SECOND, subscribed_at, token_updated_at)) as max_seconds
FROM push_subscriptions
WHERE token_updated_at IS NOT NULL
  AND is_placeholder = FALSE;
```

---

## Test Cases

### Test 1: Permission Denied
```
POST /notifications/subscribe
{
  "pushToken": null,
  "platform": "android",
  "status": "permission_denied"
}

Expected DB state:
- push_token: NULL
- is_placeholder: false
- status: "permission_denied"
- Result: User won't get notifications until they enable permissions
```

### Test 2: Firebase Unavailable (Placeholder Token)
```
POST /notifications/subscribe
{
  "pushToken": "placeholder_1712282400000",
  "platform": "android",
  "status": "permission_granted_token_pending",
  "reason": "Firebase/Google Play Services not available"
}

Expected DB state:
- push_token: "placeholder_1712282400000"
- is_placeholder: true
- status: "permission_granted_token_pending"
- Result: User doesn't get notifications yet, but app schedules automatic retry
```

### Test 3: Upgrade from Placeholder to Real Token
```
# Later, after Firebase becomes available...
POST /notifications/subscribe
{
  "pushToken": "ExponentPushToken[abc123xyz...]",
  "platform": "android",
  "status": "token_ready"
}

Expected DB state (update from previous):
- push_token: "ExponentPushToken[abc123xyz...]"  (CHANGED)
- is_placeholder: false                           (CHANGED: true -> false)
- status: "token_ready"                           (CHANGED)
- token_updated_at: NOW()                         (NEW: timestamp)
- Result: User now receives notifications
```

### Test 4: Real Token Available Immediately
```
POST /notifications/subscribe
{
  "pushToken": "ExponentPushToken[def456uvw...]",
  "platform": "android",
  "status": "token_ready"
}

Expected DB state:
- push_token: "ExponentPushToken[def456uvw...]"
- is_placeholder: false
- status: "token_ready"
- token_updated_at: NOW()
- Result: Instant notification availability
```

---

## Rollout Plan

### Phase 1: Database (Now)
1. Run migration to add `status`, `is_placeholder`, `reason`, `token_updated_at` columns
2. Set defaults for existing rows: `status = 'unknown'`, `is_placeholder = false`

### Phase 2: Backend API (During Deployment)
1. Update `/notifications/subscribe` endpoint to handle new fields
2. Update broadcast queries to filter: `WHERE is_placeholder = 0 AND status = 'token_ready'`
3. Add monitoring/logging for token status

### Phase 3: Mobile App (This Update)
1. Deploy updated app with placeholder token support
2. Monitor logs for successful permission grants

### Phase 4: Validation (Post-Deployment)
1. Check database: Run health check query
2. Should see some users with `permission_granted_token_pending` status initially
3. Monitor them transitioning to `token_ready` over 10-160 seconds
4. Verify no notifications sent to placeholder token users

---

## Rollback Plan

If issues arise:
1. Mobile app: Revert to previous version (users still can subscribe)
2. Backend: Ignore `status` and `is_placeholder` fields
3. Broadcast: Don't filter by status (may send to some dead tokens but won't break)
4. Database: Optional - migrate back (but probably not needed)

---

## Summary

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `push_token` | VARCHAR(500) | Token string (real or placeholder) | `ExponentPushToken[...] ` or `placeholder_1712282400000` |
| `status` | VARCHAR(50) | Subscription state | `token_ready`, `permission_granted_token_pending`, `permission_denied` |
| `is_placeholder` | BOOLEAN | Is token temporary? | `1` (yes) or `0` (no) |
| `reason` | VARCHAR(255) | Why placeholder? | `Firebase/Google Play Services not available` |
| `token_updated_at` | TIMESTAMP | When switched to real token | `2025-04-05 10:05:30` |

**Key Rule:** Only send notifications to users where `is_placeholder = 0 AND status = 'token_ready'`

---

## Questions?

- Q: Will placeholder tokens ever receive notifications? **A:** No, they're blocked at send time
- Q: What if a user reinstalls the app? **A:** New subscription with potentially new placeholder
- Q: Can we send to both real and placeholder? **A:** No, placeholder tokens won't actually deliver
- Q: How long do placeholder tokens last? **A:** Until success, up to 160 seconds
- Q: What if Firebase never becomes available? **A:** User sees "Enable Google Play Services" in-app

