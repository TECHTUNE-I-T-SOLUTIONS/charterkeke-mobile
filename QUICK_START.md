# Charter Keke Mobile App - Quick Start Guide

## Prerequisites

- ✅ Node.js 16+ installed
- ✅ npm or yarn package manager
- ✅ Expo Go app on your Android/iOS device ([download here](https://expo.dev/expo-go))
- ✅ Access to Charter Keke backend API

## Installation (Choose One)

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your backend URL
# EXPO_PUBLIC_API_URL=http://your-api-url:3000
```

## Configuration

Edit `.env.local` with your backend details:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000  # Your backend URL
EXPO_PUBLIC_API_TIMEOUT=10000                 # Request timeout in ms

# Maps Configuration
EXPO_PUBLIC_MAP_DEFAULT_ZOOM=14
EXPO_PUBLIC_OSM_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png

# Notifications (optional)
EXPO_PUBLIC_ONE_SIGNAL_APP_ID=your-app-id
```

## Running the App

### Start Development Server

```bash
npm start
```

### Connect via Expo Go

1. **Launch Expo Server:** The above command will show a QR code
2. **On Android Phone:** 
   - Open Expo Go app
   - Tap "Scan QR code"
   - Point camera at QR code
3. **On iOS Phone:**
   - Open Camera app
   - Point at QR code
   - Tap notification to open in Expo Go

### Hot Reload

- **Fast Refresh:** Press `r` in terminal to reload
- **Full Reload:** Press `R` in terminal
- **Device Menu:** Shake device or press `m` in terminal

## Testing Credentials

### Rider Account
```
Email: rider@charter.test
Password: Charter123!
```

### Driver Account
```
Email: driver@charter.test
Password: Charter123!
```

### Admin Account
```
Email: admin@charter.test
Password: Admin123!
```

## Building for Production

### Android APK

```bash
# Build and download
eas build --platform android

# Or use local build
npx expo prebuild --clean
npx react-native run-android
```

### iOS (macOS required)

```bash
eas build --platform ios
```

## Debugging

### View Logs

```bash
# In terminal where you ran npm start
# Logs appear automatically
```

### Network Requests

- Enable network tab in browser dev tools
- Connect via: `npx expo start --web`
- View API calls in Network tab

### React DevTools

```bash
npx react-devtools
```

Then shake device and tap "Show React DevTools"

## Troubleshooting

### "Cannot find module" errors

```bash
# Clear cache and reinstall
npm install
npm start -- --clear
```

### "Metro bundler error"

```bash
# Kill all node processes and restart
npm start -- --reset-cache
```

### Network connection issues

- Ensure phone and computer on same WiFi network
- Update IP in `.env.local` if needed
- Check firewall isn't blocking port 8081

### Maps not loading

- Verify OpenStreetMap tile URL is correct in `.env.local`
- Check network connectivity
- Clear Expo cache: `expo start --clear`

## Key Files

| File | Purpose |
|------|---------|
| `app.json` | Expo configuration |
| `package.json` | Dependencies and scripts |
| `.env.local` | Environment variables (create from `.env.example`) |
| `services/` | API, Auth, Location, Cache, Sync services |
| `context/` | React Context providers |
| `components/` | Reusable UI components |
| `app/` | Screen layouts and navigators |

## Architecture Overview

```
Mobile App (React Native/Expo)
    ├── Services Layer (API, Auth, Location, Cache, Sync)
    ├── React Context (Auth, Location, Ride)
    ├── Navigation (Auth → Rider/Driver)
    ├── Screens (Login, Home, Booking, Tracking, etc.)
    └── UI Components (Button, Input, Card, etc.)
         ↓
    Charter Keke Backend API
         ↓
    Supabase PostgreSQL Database
```

## Features Implemented ✅

- ✅ User Authentication (JWT-based)
- ✅ Location Services (Foreground & Background)
- ✅ Offline-First Caching (AsyncStorage)
- ✅ Auto-Sync on Network Reconnect
- ✅ Rider Dashboard (Home Screen)
- ✅ Driver Dashboard (Home Screen)
- ✅ API Service with Auto-Retry
- ✅ State Management (Contexts)
- ✅ Type Safety (TypeScript)
- ✅ Dark/Light Mode Support

## Next Steps

1. **Test Login Screen**
   - Run app
   - Try logging in with test credentials
   - Verify auth token stored securely

2. **Explore Services**
   - Check `services/api.ts` for available endpoints
   - Review `services/cache.ts` for offline support
   - Test location tracking with `services/location.ts`

3. **Build Remaining Screens**
   - See `README.md` for complete 50+ item checklist
   - Use `IMPLEMENTATION_GUIDE.md` for code examples
   - Refer to `PROJECT_PLAN.md` for architecture

## Support & Documentation

- **README.md** - Complete implementation checklist (1000+ lines)
- **IMPLEMENTATION_GUIDE.md** - Code examples and patterns (400+ lines)
- **PROJECT_PLAN.md** - Feature roadmap and architecture (600+ lines)
- **types/index.ts** - TypeScript interfaces (400+ lines)

## Performance Tips

- ✅ Use React.memo for expensive components
- ✅ Implement proper list virtualization (FlatList)
- ✅ Cache API responses with timestamp
- ✅ Clean up listeners in useEffect cleanup
- ✅ Use AsyncStorage for data persistence
- ✅ Test on real device (not just simulator)

## Monitoring & Analytics

The app includes:
- ✅ Automatic error tracking via API errors
- ✅ Cache hit/miss monitoring
- ✅ Network state tracking (via NetInfo)
- ✅ Location permission tracking
- ✅ Auth state debugging methods

Access via: `DebugService.getCacheDebugInfo()`, `DebugService.getNetworkStatus()`

---

**Happy coding! 🚀**

For issues or questions, refer to the IMPLEMENTATION_GUIDE.md or README.md in the root directory.
