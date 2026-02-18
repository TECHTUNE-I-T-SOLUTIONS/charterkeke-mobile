# Rides History - Quick Reference & Troubleshooting Guide

## Quick Start for Developers

### Getting Started in 5 Minutes

1. **Import the hook:**
```typescript
import { useRidesHistory } from './lib/hooks/useRidesHistory';
```

2. **Use in component:**
```typescript
const {
  rides,
  loading,
  selectedTab,
  setSelectedTab,
  refreshRides,
  cancelRide
} = useRidesHistory();
```

3. **Display rides:**
```typescript
{rides.map(ride => (
  <RideCard 
    key={ride.id} 
    ride={ride}
    onCancel={() => cancelRide(ride.id)}
  />
))}
```

## Common Tasks

### Task: Fetch Rides with Filters
```typescript
const rides = await ridesHistoryService.fetchRidesHistory({
  status: 'completed',
  limit: 20,
  offset: 0
});
```

### Task: Cancel a Ride
```typescript
try {
  await handleCancelRide(rideId);
  // Show success message
} catch (error) {
  console.error('Failed to cancel ride:', error);
}
```

### Task: Subscribe to Real-time Updates
```typescript
useEffect(() => {
  const unsubscribe = ridesHistoryService.subscribeToRideUpdates((ride) => {
    console.log('Ride updated:', ride);
  });
  
  return () => unsubscribe();
}, []);
```

### Task: Rate a Ride
```typescript
await ridesHistoryService.rateRide(rideId, 5, 'Great driver!');
```

## Configuration

### API Endpoints
Configure these in your `.env`:
```env
REACT_APP_API_URL=https://api.charterkkeasely.com
REACT_APP_WS_URL=wss://api.charterkkeasely.com/ws
```

### Timeouts
- Fetch timeout: 10 seconds
- Cancel timeout: 5 seconds
- Rate timeout: 5 seconds

### Rate Limiting
- Max 10 requests per 10 seconds
- Automatic retry with exponential backoff

## Status Colors Quick Reference

| Status | Color | Hex Code | Use Case |
|--------|-------|----------|----------|
| Completed | Green | #10B981 | Finished ride |
| Pending | Blue | #3B82F6 | Awaiting driver |
| In Progress | Orange | #F59E0B | Active ride |
| Cancelled | Red | #EF4444 | Cancelled by rider/driver |
| No Show | Gray | #6B7280 | Rider didn't show |

## Troubleshooting Guide

### Issue: Rides Not Loading

**Solution:**
1. Check internet connection
2. Verify API endpoint is correct
3. Check error logs: `console.log(error)`
4. Ensure authentication token is present

```typescript
// Debug
console.log('Auth token:', localStorage.getItem('auth_token'));
console.log('API endpoint:', process.env.REACT_APP_API_URL);
```

### Issue: Cancel Button Not Showing

**Causes & Fixes:**
```typescript
// Problem: canCancelRide returning false

// Check 1: Verify ride status
if (ride.status !== 'pending') {
  console.log('Can only cancel pending rides');
}

// Check 2: Verify time window (must be < 5 minutes)
const timeDiff = Date.now() - new Date(ride.created_at).getTime();
const minutesElapsed = timeDiff / (1000 * 60);
console.log('Minutes elapsed:', minutesElapsed);

// Check 3: Verify cancellation is enabled in API response
const response = await api.get(`/rides/${rideId}`);
console.log('Cancellation allowed:', response.data.can_cancel);
```

### Issue: Real-time Updates Not Working

**Solution:**
1. Check WebSocket connection:
```typescript
// Add in useRidesHistory hook
console.log('WS Status:', ws.readyState); 
// 0 = connecting, 1 = open, 2 = closing, 3 = closed
```

2. Verify WebSocket URL is correct
3. Ensure proper authentication in WebSocket handshake
4. Check browser console for connection errors

### Issue: Rides List Not Refreshing

**Solution:**
```typescript
// Force refresh
await refreshRides();

// Or reset cache
localStorage.removeItem('ridesHistoryCache');

// Or clear state
setRides([]);
fetchRides();
```

### Issue: Date/Time Formatting Wrong

**Check:**
```typescript
// Verify timezone
console.log('Browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

// Verify date format
const date = new Date(ride.created_at);
console.log('ISO:', date.toISOString());
console.log('Local:', date.toLocaleString());
```

### Issue: Performance Slow with Many Rides

**Optimization:**
```typescript
// Use pagination
const rides = await ridesHistoryService.fetchRidesHistory({
  limit: 10,  // Reduce from default
  offset: 0
});

// Or use virtualization in list
import { FlatList } from 'react-native';
<FlatList
  data={rides}
  renderItem={renderRide}
  keyExtractor={(item) => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
/>
```

## Debugging Tips

### Enable Debug Mode
```typescript
// In ridesHistoryService.ts
const DEBUG = true;

if (DEBUG) {
  console.log('[RidesHistory] Fetching rides...', filters);
  console.log('[RidesHistory] Response:', response);
}
```

### Log All Updates
```typescript
useEffect(() => {
  ridesHistoryService.subscribeToRideUpdates((ride) => {
    console.table({
      id: ride.id,
      status: ride.status,
      timestamp: new Date().toLocaleTimeString()
    });
  });
}, []);
```

### Monitor Network Requests
```typescript
// In browser DevTools Network tab
// Filter: XHR
// Look for: /api/rides/history, /api/rides/{id}, /api/rides/{id}/cancel
```

### Check Local Storage
```typescript
// View cached data
console.log('Cached rides:', localStorage.getItem('ridesHistory'));
console.log('Cache expiry:', localStorage.getItem('ridesHistoryExpiry'));
```

## Common Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 401 | Unauthorized | Re-authenticate user |
| 403 | Forbidden | User doesn't have permission |
| 404 | Ride not found | Ride ID is incorrect or ride was deleted |
| 400 | Bad request | Check request parameters |
| 500 | Server error | Retry after few seconds |
| NET_ERR | Network error | Check internet connection |

## Performance Metrics to Monitor

```typescript
// Time to fetch
console.time('fetchRides');
await ridesHistoryService.fetchRidesHistory();
console.timeEnd('fetchRides');

// Memory usage
console.memory; // Chrome DevTools

// Render count
console.log('Renders:', renderCount++);
```

## Testing Checklist

### Unit Tests
- [ ] Test fetchRidesHistory with various filters
- [ ] Test cancelRide validation
- [ ] Test rateRide validation
- [ ] Test date formatting
- [ ] Test status color mapping

### Integration Tests
- [ ] Test full ride flow (fetch → view → cancel)
- [ ] Test error handling and retry
- [ ] Test real-time updates
- [ ] Test pagination

### E2E Tests
- [ ] User views rides history
- [ ] User filters by status
- [ ] User cancels a ride (within window)
- [ ] User rates a completed ride
- [ ] User views ride details

## Sample Test Code

```typescript
// Test: Can cancel recent ride
test('should allow canceling ride within 5 minutes', async () => {
  const recentRide = {
    id: '123',
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
  };
  
  expect(canCancelRide(recentRide)).toBe(true);
});

// Test: Cannot cancel old ride
test('should not allow canceling ride after 5 minutes', async () => {
  const oldRide = {
    id: '123',
    status: 'pending',
    created_at: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
  };
  
  expect(canCancelRide(oldRide)).toBe(false);
});
```

## Required Environment Variables

```env
# API Configuration
REACT_APP_API_URL=https://api.charterkkeasely.com
REACT_APP_WS_URL=wss://api.charterkkeasely.com/ws

# Feature Flags
REACT_APP_ENABLE_RIDE_HISTORY=true
REACT_APP_ENABLE_RIDE_CANCELLATION=true
REACT_APP_ENABLE_RIDE_RATING=true

# Settings
REACT_APP_CANCELLATION_WINDOW_MINUTES=5
REACT_APP_RIDES_PER_PAGE=10
REACT_APP_CACHE_DURATION_MINUTES=5
```

## Related Documentation

- **Implementation Summary:** `RIDES_HISTORY_IMPLEMENTATION_SUMMARY.md`
- **Technical Reference:** `RIDES_HISTORY_TECHNICAL_REFERENCE.md`
- **API Documentation:** See backend API docs
- **Database Schema:** See `app/rider/lib/database/db.ts`

## Contact & Support

For issues or questions:
1. Check this troubleshooting guide
2. Review logs in `console`
3. Check Network tab in DevTools
4. Contact development team

## Version Info

- Created: 2024
- Last Updated: Current Session
- Compatible with: React Native 0.71+, Expo 49+
- TypeScript: 4.9+
