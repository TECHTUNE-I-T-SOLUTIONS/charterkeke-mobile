# API Endpoint Mapping Reference

## Mobile App → Backend Mapping

### Wallet & Payment Screen
```
Mobile Screen: wallet.tsx
├─ Function: fetchWalletData()
│
├─ OLD (❌ 404 Errors)
│  ├─ GET /driver/wallet
│  ├─ GET /driver/transactions
│  └─ GET /driver/bank-accounts
│
└─ NEW (✅ Correct)
   ├─ GET /api/driver/payment-status?driver_id={userId}
   │  └─ Returns: { settlements, totalPending, payments }
   │     └─ Maps to: walletData.balance, walletData.pendingWithdrawal
   │
   ├─ GET /api/driver/details
   │  └─ Returns: { data: { bank_account_number, bank_name, users: [...] } }
   │     └─ Maps to: bankAccounts array with bank info
   │
   └─ GET /api/driver/ride-history?page=1
      └─ Returns: { rides: [{ id, driver_earnings, completed_at, pickup_zone, destination_zone }] }
         └─ Maps to: transactions array
```

### Earnings Screen
```
Mobile Screen: earnings.tsx
├─ Function: fetchEarningsData()
│
├─ OLD (❌ Wrong parameter)
│  └─ GET /driver/earnings?period={today|week|month}
│
└─ NEW (✅ Correct)
   ├─ Parameter mapping:
   │  ├─ today → day
   │  ├─ week → week
   │  └─ month → month
   │
   └─ GET /api/driver/earnings?timeframe={day|week|month|year|all}
      └─ Returns: { earnings: { timeframe, total_rides_accepted, ... } }
```

### Rides Screen
```
Mobile Screen: rides.tsx (NEW - was rides details, now rides list)
├─ Tab: Active Rides
│  └─ GET /api/driver/active-rides
│     └─ Returns: { rides: [{ id, users, fare, distance, status }] }
│
└─ Tab: History
   └─ GET /api/driver/ride-history?page=1
      └─ Returns: { rides: [{ id, users, fare, status, completed_at }] }
```

### Ride Details Screen
```
Mobile Screen: ride-details.tsx
├─ OLD (❌ Broken)
│  └─ GET /rides/{rideId}  [Doesn't exist]
│
└─ NEW (✅ Correct - Uses navigation params)
   └─ Receives rideData via navigation from rides.tsx
      └─ router.push({
         pathname: '/driver/ride-details',
         params: { rideId, rideData: JSON.stringify(ride) }
      })
```

---

## API Response Structure Examples

### Payment Status Response
```javascript
// GET /api/driver/payment-status?driver_id=123
{
  totalPending: 25000,
  settlements: [
    {
      id: 1,
      total_platform_fees: 5000,
      settlement_status: "paid"
    }
  ],
  payments: [...]
}
```

### Driver Details Response
```javascript
// GET /api/driver/details
{
  data: {
    id: 123,
    bank_account_number: "1234567890",
    bank_name: "Guarantee Trust Bank",
    users: [
      {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone_number: "+234801234567"
      }
    ]
  }
}
```

### Ride History Response
```javascript
// GET /api/driver/ride-history?page=1
{
  rides: [
    {
      id: "ride-123",
      status: "completed",
      driver_earnings: 5000,
      completed_at: "2024-01-15T10:30:00Z",
      pickup_zone: "Ikoyi",
      destination_zone: "Lekki",
      distance: 15,
      estimated_time: 25,
      users: {
        first_name: "Jane",
        last_name: "Smith",
        rating: 4.8
      }
    }
  ]
}
```

### Earnings Response
```javascript
// GET /api/driver/earnings?timeframe=day
{
  earnings: {
    timeframe: "day",
    total_rides_accepted: 12,
    total_rides_completed: 11,
    total_earnings: 45000,
    average_rating: 4.7,
    peak_earning_hours: [14, 15, 16],
    estimated_next_payout: "2024-01-20T00:00:00Z"
  }
}
```

### Active Rides Response
```javascript
// GET /api/driver/active-rides
{
  rides: [
    {
      id: "ride-456",
      status: "accepted",
      estimated_fare: 3500,
      estimated_distance: 8,
      estimated_time: 15,
      pickup_zone: "VI, Lagos",
      destination_zone: "Ajah, Lagos",
      users: {
        first_name: "Ahmed",
        last_name: "Hassan",
        rating: 4.9,
        phone_number: "+234809876543"
      }
    }
  ]
}
```

---

## Implementation Details

### Wallet Screen - Data Processing
```typescript
// Extract wallet balance from payment-status
walletData = {
  balance: paymentData.totalPending,           // Main balance
  pendingWithdrawal: paymentData.totalPending,  // Same as balance
  withdrawn: totalWithdrawn,                    // Sum of paid settlements
  minimumWithdrawal: 500                        // Fixed threshold
};

// Extract bank accounts from driver-details
bankAccounts = [{
  id: 1,
  name: driverDetails.data.bank_name,
  accountNumber: driverDetails.data.bank_account_number,
  accountName: `${userFirstName} ${userLastName}`
}];

// Extract transactions from ride-history
transactions = rides.map(ride => ({
  id: ride.id,
  type: 'earning',
  amount: ride.driver_earnings,
  date: ride.completed_at,
  status: ride.status === 'completed' ? 'completed' : 'pending',
  description: `${ride.pickup_zone} → ${ride.destination_zone}`
}));
```

### Earnings Screen - Period Mapping
```typescript
const timeframeMap = {
  'today': 'day',      // Frontend filter → Backend value
  'week': 'week',
  'month': 'month'
};

// Usage:
const timeframeValue = timeframeMap[selectedPeriod];
const response = await apiService.get(`/api/driver/earnings?timeframe=${timeframeValue}`);
```

### Rides Navigation - Data Passing
```typescript
// In rides.tsx - when user taps a ride
const handleRideTap = (ride) => {
  router.push({
    pathname: '/driver/ride-details',
    params: {
      rideId: ride.id,
      rideData: JSON.stringify(ride)  // Pass full ride object
    }
  });
};

// In ride-details.tsx - receive the data
const { rideData } = useLocalSearchParams();
const ride = JSON.parse(rideData);  // Parse and use
```

---

## Error Handling

### Before (Broken)
```typescript
// No fallback for 404 errors
const data = await apiService.get('/driver/wallet');  // ❌ 404
setWalletData(data);  // Data is undefined → UI breaks
```

### After (Robust)
```typescript
// With error handling and fallbacks
try {
  const paymentRes = await apiService.get(`/api/driver/payment-status?driver_id=${userId}`)
    .catch(() => ({}));  // Return empty object on error
  
  setWalletData({
    balance: paymentRes?.totalPending || 0,
    pendingWithdrawal: paymentRes?.totalPending || 0,
    withdrawn: 0,
    minimumWithdrawal: 500
  });
} catch (error) {
  console.error('Failed to fetch wallet:', error);
  setWalletData({ balance: 0, pendingWithdrawal: 0, withdrawn: 0, minimumWithdrawal: 500 });
}
```

---

## Cross-Component Data Flow

```
HomeScreen (dashboard)
  ↓
  ├─ Wallet Screen
  │  ├─ Fetches: /api/driver/payment-status
  │  ├─ Fetches: /api/driver/details
  │  └─ Fetches: /api/driver/ride-history
  │
  ├─ Earnings Screen
  │  └─ Fetches: /api/driver/earnings?timeframe=...
  │
  └─ Rides Screen (NEW)
     ├─ Tab: Active → /api/driver/active-rides
     ├─ Tab: History → /api/driver/ride-history
     └─ OnTap → Navigate to Ride Details with rideData
        └─ Ride Details Screen
           ├─ Displays: rideData from params
           └─ Can: Update status, call passenger
```

---

## Testing Queries

### Test Wallet Endpoints
```bash
# Check payment status
curl -H "Authorization: Bearer {token}" \
  "http://localhost:3000/api/driver/payment-status?driver_id=123"

# Check driver details
curl -H "Authorization: Bearer {token}" \
  "http://localhost:3000/api/driver/details"

# Check ride history
curl -H "Authorization: Bearer {token}" \
  "http://localhost:3000/api/driver/ride-history?page=1"
```

### Test Earnings Endpoint
```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:3000/api/driver/earnings?timeframe=day"
```

### Test Rides Endpoints
```bash
# Active rides
curl -H "Authorization: Bearer {token}" \
  "http://localhost:3000/api/driver/active-rides"

# History (same as ride-history)
curl -H "Authorization: Bearer {token}" \
  "http://localhost:3000/api/driver/ride-history?page=1"
```

---

## Debugging Checklist

- [ ] Verify authToken is being sent in all requests
- [ ] Check server logs for 404 errors (should see 0 on wallet/earnings now)
- [ ] Verify response structure matches expected fields
- [ ] Confirm navigation params are being passed correctly
- [ ] Check that ride list loads before details screen can be viewed
- [ ] Verify all color properties use correct theme color names
- [ ] Test theme switching (light/dark mode) works for all screens
