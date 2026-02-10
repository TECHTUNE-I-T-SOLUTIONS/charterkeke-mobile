# Charter Keke Mobile App - Implementation Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android testing) or Xcode (for iOS testing)

### Installation

```bash
# Install dependencies
npm install
# or
yarn install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your API URL and configuration

# Start Expo
npm start

# For Android
npm run android

# For iOS
npm run ios
```

## 📱 Project Structure

```
charter-keke-mobile/
├── app/                          # Screens and routing
│   ├── auth/                     # Authentication flows
│   │   ├── onboarding.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── rider/                    # Rider screens
│   │   ├── home.tsx
│   │   ├── booking.tsx
│   │   └── active-ride.tsx
│   ├── driver/                   # Driver screens
│   │   ├── home.tsx
│   │   └── available-rides.tsx
│   └── _layout.tsx             # Main layout/navigation
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── auth/                     # Auth-specific components
│   ├── map/                      # Map-related components
│   ├── ride/                     # Ride-specific components
│   └── common/                   # Common components
├── services/
│   ├── api.ts                    # API integration
│   ├── auth.ts                   # Authentication service
│   ├── location.ts               # Location tracking
│   ├── cache.ts                  # Local caching
│   └── sync.ts                   # Offline sync
├── context/
│   ├── AuthContext.tsx           # Auth state
│   ├── LocationContext.tsx       # Location state
│   └── RideContext.tsx           # Ride state
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types
├── utils/                        # Utility functions
├── assets/                       # Images, icons, logos
├── app.json                      # Expo configuration
├── app.tsx                       # App entry point
└── package.json
```

## 🎨 Color System

All colors are in `utils/colors.ts` and follow the same theme as the web app:

- **Primary**: #1a1a1a (Dark)
- **Secondary**: #f5f5f5 (Light)
- **Accent**: #f5f5f5
- **Destructive**: #ef4444 (Red)
- **Success**: #16a34a (Green)

Usage:
```typescript
import { COLORS } from '@utils/colors';

const backgroundColor = COLORS.light.primary; // Light mode
const backgroundColor = COLORS.dark.primary;  // Dark mode
```

## 🔐 Authentication Flow

### For Riders

1. **Onboarding** → Choose "Rider"
2. **Signup** → Enter email, phone, password
3. **OTP Verification** → Verify phone number
4. **Profile Setup** → Upload profile pic, add addresses
5. **Dashboard** → Ready to book rides

### For Drivers

1. **Onboarding** → Choose "Driver"
2. **Signup** → Enter email, phone, password
3. **OTP Verification** → Verify phone number
4. **KYC Upload** → License,  registration, insurance
5. **Bank Details** → Add bank account for payouts
6. **Dashboard** → Ready to accept rides

## 🗺️ Maps Integration

Uses `react-native-maps` with OpenStreetMap tiles:

```typescript
import MapView from 'react-native-maps';

<MapView
  style={{ flex: 1 }}
  initialRegion={{
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}
/>
```

## 📍 Location Tracking

### Foreground Tracking (Active Ride)
```typescript
const { startTracking, stopTracking } = useLocation();

// Start tracking when ride begins
await startTracking(rideId);

// Stop when ride ends
await stopTracking();
```

### Background Tracking
Uses Expo TaskManager for background location updates while app is minimized.

## 💾 Offline-First Architecture

### Caching Strategy

1. **Immediate**: Data stored in AsyncStorage
2. **Sync Queue**: Failed requests queued for retry
3. **Auto Sync**: Every 5 minutes or on network reconnection

### Usage

```typescript
import { cacheService } from '@services/cache';

// Save data
await cacheService.set('key', data, 30); // 30-minute expiry

// Get with auto-expiry check
const data = await cacheService.get('key');

// Add to sync queue
await cacheService.addToSyncQueue({
  id: 'op_123',
  type: 'create',
  endpoint: '/api/rides',
  payload: rideData,
  timestamp: Date.now(),
});
```

## 🔄 Synchronization

Auto-sync runs in the background:

```typescript
import { syncService } from '@services/sync';

// Start auto-sync (usually on app start)
syncService.startAutoSync();

// Manual sync
await syncService.sync();

// Check pending operations
const pending = await syncService.getPendingCount();
```

## 📡 API Integration

All requests go through the API service with automatic retry:

```typescript
import { apiService } from '@services/api';

// Login
const response = await apiService.login(email, password);

// Create ride
const ride = await apiService.createRide(rideData);

// Get live location
const location = await apiService.getLiveLocation(rideId);
```

## 🎯 Key Features Implementation

### 1. Real-Time Ride Tracking

```typescript
import { useLocation } from '@context/LocationContext';

const { watchLocation } = useLocation();

useEffect(() => {
  let unwatch: (() => void) | null = null;
  
  const startWatching = async () => {
    unwatch = await watchLocation((location) => {
      // Update map with live location
    });
  };
  
  startWatching();
  
  return () => {
    if (unwatch) unwatch();
  };
}, []);
```

### 2. User Rating

```typescript
import { useRide } from '@context/RideContext';

const { submitRating } = useRide();

await submitRating(rideId, 5, 'Great driver!');
```

### 3. Wallet/Transactions

```typescript
const wallet = await apiService.getWallet();
const transactions = await apiService.getTransactions();
```

### 4. Notifications

Uses Expo Notifications:

```typescript
import * as Notifications from 'expo-notifications';

// Request permission
const { status } = await Notifications.requestPermissionsAsync();

// Handle notification
useFocusEffect(
  useCallback(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // Handle notification tap
      }
    );
    
    return () => subscription.remove();
  }, [])
);
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
Test authentication, location, and API flows.

### Manual Testing with Expo
```bash
npm start

# Scan QR code with Expo Go app on your device
# Or press 'a' for Android emulator / 'i' for iOS simulator
```

## 📊 Performance Tips

1. **Memoize components**: Use `React.memo()` for frequently re-rendered components
2. **Optimize re-renders**: Use proper dependencies in `useEffect`
3. **Lazy load screens**: Use React Navigation's `screenOptions`
4. **Image optimization**: Use `expo-image` for better image loading
5. **Location updates**: Adjust frequency based on ride status

## 🔗 API Endpoints Reference

See the main project documentation for complete API reference. Key endpoints:

- **Auth**: `/api/auth/login`, `/api/auth/register`, `/api/auth/verify-otp`
- **Riders**: `/api/riders/profile`, `/api/rides`
- **Drivers**: `/api/drivers/profile`, `/api/drivers/rides`
- **Location**: `/api/ride-location`  
- **Wallet**: `/api/wallet`, `/api/wallet/transactions`

## 📱 Device Permissions

The app requires these permissions (handled in `app.json`):

- **Location**: For ride tracking and mapping
- **Camera**: For profile pictures and KYC
- **Photo Library**: For image selection
- **Internet**: For API communication

Users are prompted to grant permissions when needed.

## 🚨 Error Handling

All services include comprehensive error handling:

```typescript
try {
  const ride = await apiService.createRide(data);
} catch (error) {
  if (error.code === 'NO_DRIVERS_AVAILABLE') {
    // Show "No drivers" message
  } else if (error.code === 'NETWORK_ERROR') {
    // Will retry automatically or queue for sync
  }
}
```

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)

## 🤝 Contributing

Guidelines for adding new features:

1. Create feature branch: `git checkout -b feature/new-feature`
2. Follow the existing code structure
3. Add tests for new functionality
4. Submit pull request with description

## 📝 License

Part of the Charter Keke platform - All rights reserved

