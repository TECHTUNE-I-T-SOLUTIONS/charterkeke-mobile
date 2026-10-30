# Charter Keke Mobile Changelog

## [2.2.6] - 2026-10-30

### 🚀 Performance Improvements
- **Faster Driver Home & Rides Loading**: Converted frequent read operations to use Supabase SDK directly instead of backend API calls, significantly reducing load times
- **Removed Heavy Caching**: Driver rides tabs now load fresh data on every tab switch, eliminating stale content and making the app feel lighter

### 🐛 Bug Fixes
- **Fixed Rider App Crash After Cancellation**: Properly cleaned up Realtime subscriptions and live tracking when rides are cancelled to prevent crashes
- **Fixed Driver Date Display**: Corrected date/time display in driver rides screen to show proper dates for both available and history rides
- **Fixed Available Rides Polling**: Improved error handling to prevent empty state on transient network errors
- **Fixed ETA Persist Error**: Added missing `updateRideEta` method to prevent errors when persisting live ETA
- **Fixed Cashback Reuse**: Cashback rewards now properly refresh after booking, preventing used rewards from showing again

### 🛡️ Safety & Validation
- **Driver Proximity Guards**: Added location verification before drivers can start trips (must be within 200m of pickup location)
- **Active Ride Prevention**: Drivers with active rides cannot accept new rides - UI shows "Complete current ride first" message
- **Branded Alert Modals**: Replaced native Alert calls with branded ProximityAlertModal for consistent UX across the app

### 🎨 UI/UX Improvements
- **Offline Driver Protection**: Available rides are hidden when driver is offline, with clear message to go online
- **Enhanced Proximity Alerts**: Improved modal to handle GPS unavailable cases with clear messaging
- **Consistent Error Messages**: All location and proximity errors now use branded modals

### 📱 Technical
- **Supabase SDK Integration**: Direct database reads for driver status, available rides, active rides, ride history, and earnings stats
- **Reduced API Calls**: Backend only handles POST/PUT/PATCH operations for security and business logic
- **Better Error Handling**: Improved error handling throughout the app with graceful fallbacks

---

## [2.2.5] - Previous Release
- Initial production release with core ride-hailing features
