# Rides History Feature - File Reference and Implementation Details

## File Structure

### Core Feature Files
```
app/rider/
├── rides-history.tsx                 [Main rides history screen]
├── ride-details.tsx                  [Detailed ride information screen]
└── lib/
    ├── services/
    │   └── ridesHistoryService.ts    [API service layer]
    ├── hooks/
    │   └── useRidesHistory.ts        [Custom React hook]
    └── database/
        └── db.ts                      [Database schema]
```

## Implementation Details

### 1. rides-history.tsx - Main Component

**Location:** `app/rider/rides-history.tsx`

**Imports:**
```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useRidesHistory } from './lib/hooks/useRidesHistory';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
```

**Key Functions:**
- `getStatusColor(status)` - Returns color for status badge
- `getStatusIcon(status)` - Returns icon for status indicator
- `getStatusLabel(status)` - Returns readable status label
- `canCancelRide(ride)` - Checks if ride can be cancelled
- `getTimeRemainingToCancel(ride)` - Calculates and displays cancellation window
- `handleCancelRide(rideId)` - Handles ride cancellation with UI feedback
- `formatDate(dateString)` - Formats timestamps
- `renderEmptyState()` - Displays empty state message
- `renderTabButton(tab)` - Renders tab navigation buttons

**Tab Navigation:**
- All Rides
- Completed
- Cancelled
- No Shows

**Ride Card Components:**
- Header with driver info and fare
- Status badge with icon and label
- Route information (pickup → destination)
- Distance, duration, and rating metrics
- Action buttons (View Details, Cancel)

### 2. ride-details.tsx - Details Screen

**Location:** `app/rider/ride-details.tsx`

**Features:**
- Full ride information display
- Driver profile section
- Real-time map integration
- Route visualization
- Fare breakdown
- Event timeline
- Rating and feedback system
- Share ride option

**Key Sections:**
1. **Header Stack** - Back button and options menu
2. **Driver Card** - Profile picture, name, rating, vehicle info
3. **Map Section** - Real-time location tracking
4. **Route Information** - Pickup, destination, distance
5. **Fare Breakdown** - Base fare, taxes, total
6. **Timeline** - Pick-up time, start time, completion time
7. **Rating Section** - Star rating and comment input
8. **Action Buttons** - Share, help, report

### 3. ridesHistoryService.ts - API Layer

**Location:** `app/rider/lib/services/ridesHistoryService.ts`

**Methods:**

#### fetchRidesHistory(filters)
```typescript
fetchRidesHistory(filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{
  rides: Ride[];
  total: number;
  hasMore: boolean;
}>
```

#### getRideDetails(rideId)
```typescript
getRideDetails(rideId: string): Promise<RideDetails>
```

#### cancelRide(rideId)
```typescript
cancelRide(rideId: string, reason?: string): Promise<{
  success: boolean;
  message: string;
}>
```

#### rateRide(rideId, rating, comment)
```typescript
rateRide(
  rideId: string,
  rating: number,
  comment?: string
): Promise<{ success: boolean }>
```

#### subscribeToRideUpdates(callback)
```typescript
subscribeToRideUpdates(callback: (ride: Ride) => void): () => void
```

### 4. useRidesHistory.ts - Custom Hook

**Location:** `app/rider/lib/hooks/useRidesHistory.ts`

**Hook Returns:**
```typescript
{
  rides: Ride[];
  loading: boolean;
  error: string | null;
  selectedTab: 'all' | 'completed' | 'cancelled' | 'no_show';
  setSelectedTab: (tab) => void;
  refreshRides: () => Promise<void>;
  cancelRide: (rideId: string) => Promise<void>;
  rateRide: (rideId: string, rating: number, comment?: string) => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}
```

**Features:**
- Automatic data fetching on mount
- Tab-based filtering
- Pagination support
- Refresh functionality
- Real-time updates
- Proper cleanup

### 5. Database Schema (db.ts)

**Location:** `app/rider/lib/database/db.ts`

**Table: rides_history**
```sql
CREATE TABLE rides_history (
  id UUID PRIMARY KEY,
  rider_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  status ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'no_show'),
  pickup_location POINT,
  destination_location POINT,
  pickup_zone VARCHAR(255),
  destination_zone VARCHAR(255),
  fare_amount DECIMAL(10, 2),
  distance_km DECIMAL(10, 2),
  duration_minutes INT,
  estimated_arrival_time TIMESTAMP,
  actual_arrival_time TIMESTAMP,
  pickup_time TIMESTAMP,
  completion_time TIMESTAMP,
  cancellation_reason VARCHAR(255),
  rating INT (1-5),
  review_comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_rider_id (rider_id),
  INDEX idx_driver_id (driver_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

## Integration Guide

### Step 1: Set up the Service
```typescript
import { ridesHistoryService } from './lib/services/ridesHistoryService';

// Fetch rides
const rides = await ridesHistoryService.fetchRidesHistory();

// Subscribe to updates
const unsubscribe = ridesHistoryService.subscribeToRideUpdates((ride) => {
  console.log('Ride updated:', ride);
});
```

### Step 2: Use the Hook
```typescript
import { useRidesHistory } from './lib/hooks/useRidesHistory';

function RidesHistoryScreen() {
  const {
    rides,
    loading,
    error,
    selectedTab,
    setSelectedTab,
    refreshRides,
    cancelRide,
  } = useRidesHistory();

  return (
    // Component JSX
  );
}
```

### Step 3: Display Rides
The rides-history.tsx component handles all UI and displays:
- Filtered rides based on selected tab
- Status-based color coding
- Action buttons for cancellation and details
- Loading and error states

## API Requirements

### Endpoints Needed:

1. **GET /api/rides/history**
   - Query params: status, startDate, endDate, limit, offset
   - Response: `{ rides: Ride[], total: number, hasMore: boolean }`

2. **GET /api/rides/{id}**
   - Response: `RideDetails`

3. **POST /api/rides/{id}/cancel**
   - Body: `{ reason?: string }`
   - Response: `{ success: boolean, message: string }`

4. **POST /api/rides/{id}/rate**
   - Body: `{ rating: number, comment?: string }`
   - Response: `{ success: boolean }`

5. **WS /api/rides/updates**
   - WebSocket for real-time updates
   - Emit: `{ type: 'ride_update', data: Ride }`

## Response Type Definitions

### Ride Type
```typescript
interface Ride {
  id: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  drivers: {
    users: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  };
  pickup_zone: string;
  destination_zone: string;
  pickup_location?: { lat: number; lng: number };
  destination_location?: { lat: number; lng: number };
  fare_amount: number;
  distance_km?: number;
  duration_minutes?: number;
  rating?: number;
  created_at: string;
  updated_at: string;
}
```

### RideDetails Type
```typescript
interface RideDetails extends Ride {
  driver_vehicle?: {
    make: string;
    model: string;
    color: string;
    plate_number: string;
  };
  payment_method: string;
  review_comment?: string;
  estimated_fare?: number;
  time_estimated?: number;
}
```

## Status Flow

```
request_placed
    ↓
pending (can cancel within 5 min)
    ↓
accepted (not cancellable)
    ↓
in_progress (not cancellable)
    ↓
completed or no_show or cancelled
```

## Color Coding

- **Green (#10B981)** - Completed
- **Blue (#3B82F6)** - Pending/Accepted  
- **Orange (#F59E0B)** - In Progress
- **Red (#EF4444)** - Cancelled
- **Gray (#6B7280)** - No Show

## Error Handling

All methods include proper error handling:
- Network errors → "Connection failed"
- Timeout errors → "Request timed out"
- Server errors → "Server error occurred"
- Validation errors → Specific error messages

## Performance Considerations

1. **Pagination** - Load 10 rides per page
2. **Caching** - Cache rides for 5 minutes
3. **Lazy Loading** - Load more on scroll
4. **Image Optimization** - Resize driver photos
5. **Debouncing** - Debounce refresh actions
6. **Memory Management** - Unsubscribe on unmount

## Testing Checklist

- [ ] Fetch rides with various filters
- [ ] Cancel ride within 5-minute window
- [ ] Verify cancellation button disabled after 5 minutes
- [ ] Rate completed rides
- [ ] Test real-time updates
- [ ] Handle network failures gracefully
- [ ] Test empty states
- [ ] Verify date/time formatting
- [ ] Test loading states
- [ ] Test tab switching

## Deployment Notes

1. Ensure backend APIs are implemented
2. Configure WebSocket connection
3. Set up proper error tracking
4. Configure logging for debugging
5. Test with real data
6. Monitor performance metrics

## Future Enhancements

- [ ] Export ride history as PDF/CSV
- [ ] Advanced filtering (price range, driver rating)
- [ ] Dispute/complaint system
- [ ] Favorite drivers list
- [ ] Recurring ride patterns
- [ ] Analytics dashboard
- [ ] Integration with other services
- [ ] Accessible alternative payment methods
