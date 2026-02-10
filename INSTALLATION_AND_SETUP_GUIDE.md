# Charter Keke Mobile App - Installation & Development Guide

## 📦 Prerequisites

Before you start, make sure you have these installed on your system:

### Required Software
- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node) OR **pnpm** (recommended for faster installs)
- **Git** - [Download](https://git-scm.com/)

### Optional but Recommended
- **Android Studio** - For Android emulator (if testing locally)
- **Xcode** - For iOS emulator (Mac only)
- **Expo GoApp** - On your physical phone (see below)

---

## 🚀 Installation Steps

### Step 1: Navigate to Project Directory

```bash
cd c:\Codes\ck
```

### Step 2: Install Dependencies

Choose one of these methods (pnpm is faster):

#### Using pnpm (Recommended)
```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install all dependencies
pnpm install
```

#### Using npm
```bash
# Install all dependencies
npm install
```

#### Using Yarn
```bash
# Install all dependencies
yarn install
```

**Expected time**: 3-5 minutes depending on internet speed

**What gets installed**:
- ✅ Expo SDK & CLI
- ✅ React Native framework
- ✅ React Navigation stack
- ✅ All 70+ dependencies (maps, location, storage, etc.)
- ✅ Development tools (TypeScript, ESLint, Jest)

### Step 3: Verify Installation

```bash
# Check if expo CLI is available
npx expo --version

# Should output something like: 51.0.0
```

### Step 4: Environment Setup (Already Done ✅)

The `.env.local` file has already been created with all credentials:

```bash
# Verify the file exists
dir .env.local

# Verify it contains the right values
type .env.local
```

The file includes:
- ✅ Paystack payment keys
- ✅ Termii SMS gateway credentials
- ✅ Supabase database credentials
- ✅ VAPID push notification keys
- ✅ OpenStreetMap configuration (not Google Maps)

---

## 📱 Expo Go Setup

### What is Expo Go?

Expo Go is a free mobile app that lets you test your React Native app on your phone without building it first. It's like a "preview" before production.

### Download Expo Go

Select your device type:

**For Android Users**:
- Open Google Play Store
- Search for **"Expo Go"**
- Install the app by Expo, Inc.
- Version: Latest (auto-updates)
- Link: https://play.google.com/store/apps/details?id=host.exp.exponent

**For iOS Users**:
- Open Apple App Store
- Search for **"Expo Go"**
- Install the app by Expo, Inc.
- Version: Latest (auto-updates)
- Link: https://apps.apple.com/us/app/expo-go/id1088637711

### Minimum Requirements

| Device | Minimum Version | Recommended Version |
|--------|-----------------|-------------------|
| Android | 7.0 (API 24) | 12.0+ |
| iOS | 12.0 | 15.0+ |

### Verify Installation

After installing Expo Go:
1. Open the app
2. You should see a blank home screen with "Scan a QR code" option
3. You're ready to go! ✅

---

## 🎯 Starting Development Server

### Method 1: Start Expo Development Server (Recommended for Testing)

Open terminal in the project directory and run:

```bash
# Start the development server
pnpm start

# Or with npm
npm start
```

**What you should see**:
```
Expo DevTools is running at http://localhost:19000

Press:
  a - Android (emulator or device)
  i - iOS (simulator or device)
  w - Web
  j - Debug
  r - Reload expo app
  s - Sign in
  c - Clear cache and reload
  q - Quit

```

### Method 2: For Specific Platform

```bash
# Run on Android emulator/device
pnpm run android

# Run on iOS simulator (Mac only)
pnpm run ios

# Run on web browser
pnpm run web
```

### Method 3: Testing on Physical Phone

#### Step 1: Start Dev Server
```bash
pnpm start
```

#### Step 2: Get QR Code
A QR code will appear in your terminal and the Expo CLI will show:
```
Scan this QR code with Expo Go to open your app:
┌─────────────────┐
│ [QR CODE IMAGE] │
└─────────────────┘
```

#### Step 3: Scan with Expo Go
1. Open **Expo Go** app on your phone
2. Tap the **Scan** button (usually at bottom)
3. Allow camera permissions if prompted
4. Scan the QR code shown in terminal
5. App will load on your phone! 🎉

**Expected load time**: 30-60 seconds (first time slower)

---

## 💻 Common Development Commands

```bash
# Start development server (primary command)
pnpm start

# Clear cache and rebuild
pnpm start:clear
# or
pnpm expo start --clear

# Run on specific platform
pnpm run android      # Android emulator/device
pnpm run ios          # iOS simulator
pnpm run web          # Web browser

# Type checking
pnpm type-check      # Check TypeScript errors

# Linting
pnpm lint            # Check code style

# Testing
pnpm test            # Run unit tests

# Building for production
pnpm build:android   # Build APK for Android
pnpm build:ios       # Build IPA for iOS

# Check expo version
expo --version
```

---

## 🔄 Typical Development Workflow

### First Time Setup (Step-by-Step)

```bash
# 1. Navigate to project
cd c:\Codes\ck

# 2. Install dependencies
pnpm install

# 3. Verify everything works
npm start

# 4. Scan QR code with Expo Go on your phone
# (or press 'a' for Android emulator if you have one)

# That's it! You're ready to develop 🚀
```

### Daily Development

```bash
# 1. Start dev server
pnpm start

# 2. Make code changes in your editor

# 3. Save file (auto-reload happens automatically)

# 4. View changes on phone/emulator

# 5. When ready, stop with Ctrl+C and commit changes
```

### When You Make Changes

React Native has **Fast Refresh** enabled, which means:
- ✅ Save your file
- ✅ App reloads automatically on phone
- ✅ Changes appear instantly (most of the time)

If it doesn't update:
```bash
# While dev server is running, press 'r' in terminal to reload
# Or shake your phone and tap "Reload"
```

---

## 🛠️ Troubleshooting

### Problem: Port 19000 Already in Use

**Error**: `Address already in use (:19000)`

**Solution**:
```bash
# Kill the process using the port
# On Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 19000).OwningProcess | Stop-Process -Force

# Or just change the port:
expo start -p 19001
```

### Problem: Dependencies Not Fully Installed

**Error**: `Cannot find module '@/context'`

**Solution**:
```bash
# Clear cache and reinstall
rm -r node_modules
rm pnpm-lock.yaml    # or package-lock.json if using npm
pnpm install         # or npm install
```

### Problem: Expo Go App Crashes Immediately

**Error**: App opens then crashes

**Solutions**:
1. Make sure your phone and computer are on **same WiFi network**
2. Clear Expo Go cache:
   - Go to phone Settings → Apps → Expo Go → Storage → Clear Cache
3. Reinstall Expo Go
4. Try the `.clear` variant:
   ```bash
   pnpm start:clear
   ```

### Problem: Changes Not Appearing on Phone

**Solution**:
1. In Expo Go app, tap your profile icon (top right)
2. Scroll down and find your app
3. Tap the app to reload it
4. Or press 'r' in your terminal while dev server is running

### Problem: TypeScript Errors in IDE

**Error**: Red squiggly lines but code works

**Solution**:
```bash
# Verify types are correct
pnpm type-check

# Restart your IDE (VS Code)
# Or reload TypeScript server: Ctrl+Shift+P → TypeScript: Restart TS Server
```

---

## 🌍 Network Configuration

### Testing Locally (Default Setup)

The `.env.local` is already configured for local development:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

This means:
- ✅ Your phone will connect to your computer's local API server
- ✅ Make sure your phone and computer are on **same WiFi network**

### Testing with Remote Server

To test with a production or staging server:

```bash
# Edit .env.local and change:
EXPO_PUBLIC_API_URL=https://your-backend-url.com

# Restart dev server
pnpm start:clear
```

---

## 📊 Environment Variables Explained

All important env vars are in `.env.local`:

| Variable | Purpose | Status |
|----------|---------|--------|
| `EXPO_PUBLIC_API_URL` | Backend API endpoint | Configured for local dev |
| `EXPO_PUBLIC_SUPABASE_URL` | Database connection | ✅ Active |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Database access key | ✅ Active |
| `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` | Payment processing | ✅ Active |
| `EXPO_PUBLIC_TERMII_API_KEY` | SMS gateway | ✅ Active |
| `EXPO_PUBLIC_OSM_TILE_URL` | Map tiles (OpenStreetMap) | ✅ Active |

**Important**: Never commit `.env.local` to Git. It's already in `.gitignore`.

---

## 🗺️ Maps Configuration

### Using OpenStreetMap (Not Google Maps ✅)

The app uses **React Native Maps** with **OpenStreetMap** tiles:

```javascript
// In your component:
import MapView from 'react-native-maps';

const OSM_TILE_URL = process.env.EXPO_PUBLIC_OSM_TILE_URL;

<MapView>
  {/* Map automatically uses OpenStreetMap tiles */}
</MapView>
```

**Why OpenStreetMap?**
- ✅ Free (no API key needed)
- ✅ No usage limits
- ✅ Open source
- ✅ Privacy-friendly

**Advantages**:
- Same coordinates as Google Maps
- Works offline with local tiles
- No API quota limits

---

## 🚀 Next Steps After Installation

### 1. Verify Setup Works
```bash
pnpm start
# Scan QR code, check if splash screen appears
```

### 2. Explore the App
- View onboarding carousel
- Try login screen
- Test form validation

### 3. Start Development
- Pick a feature from README.md checklist
- Copy pattern from existing screen
- Make changes and test on phone

### 4. Enable Debugging (Optional)
```bash
# In terminal while dev server runs, press:
# 'd' - Open debug menu
# Choose "JavaScript Debugger" to debug in browser
```

---

## 📱 Device-Specific Setup

### Android Phone Setup

1. **Install Expo Go** from Google Play Store
2. **Enable Developer Options**:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"
3. **Connect to WiFi** same as your computer
4. **Run**: `pnpm start` and scan QR code

### iOS Phone Setup

1. **Install Expo Go** from App Store
2. **Wi-Fi on same network** as your computer
3. **Run**: `pnpm start` and scan QR code
4. **Notification permissions** will be requested (allow them)

### Android Emulator Setup

1. **Install Android Studio** (if not already)
2. **Create AVD** (Android Virtual Device):
   - Android Studio → Tools → Virtual Device Manager → Create Device
3. **Start emulator** from Android Studio
4. **Run**: `pnpm run android`

### iOS Simulator Setup (Mac Only)

1. **Install Xcode** from App Store
2. **Run**: `pnpm run ios`
3. Simulator opens automatically

---

## 📈 Performance Tips

### For Faster Development

1. **Use physical phone instead of emulator**
   - Much faster than emulator
   - More realistic testing
   - Better battery usage

2. **Use same WiFi network**
   - Faster connection
   - Better debugging

3. **Clear cache periodically**
   ```bash
   pnpm start:clear
   ```

4. **Keep dependencies up to date**
   ```bash
   pnpm update
   ```

### For Faster App Loading

- First load: 30-60 seconds (downloads Expo runtime)
- Subsequent loads: 5-10 seconds
- Code changes: 2-5 seconds (with Fast Refresh)

---

## 📚 Useful Resources

- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **Expo Router Guide**: https://docs.expo.dev/router/
- **React Navigation**: https://reactnavigation.org/
- **OpenStreetMap**: https://www.openstreetmap.org/

---

## ✅ Verification Checklist

After installation, verify:

- [ ] Node.js installed: `node --version`
- [ ] pnpm installed: `pnpm --version`
- [ ] Expo CLI working: `expo --version`
- [ ] Dependencies installed: `pnpm install` completed
- [ ] .env.local file exists in `c:\Codes\ck`
- [ ] Expo Go installed on phone
- [ ] Can run: `pnpm start` (no errors)
- [ ] QR code appears in terminal
- [ ] Expo Go can scan and load app
- [ ] App shows splash screen
- [ ] Navigation works (go through onboarding)

---

## 🎉 You're Ready!

Once you see your app running on your phone, you're all set. Start with:

```bash
pnpm start
```

And begin developing! 🚀

---

**Last Updated**: Current Session  
**Version**: Expo 51.0.0, React Native 0.76.3  
**Status**: ✅ Ready for Development
