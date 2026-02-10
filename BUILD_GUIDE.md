# Charter Keke Mobile App - Build & Deployment Guide

## Overview

This guide covers building the Charter Keke mobile app for both Android and iOS, from development through production deployment.

## Prerequisites

### Required
- ✅ Node.js 16+ and npm/yarn
- ✅ Expo CLI: `npm install -g eas-cli`
- ✅ Android/iOS development environment configured

### For Android (Minimum)
- ✅ Android SDK Platform 33+
- ✅ Android Build Tools 33.0.0+
- ✅ Java Development Kit (JDK) 11+

### For iOS (macOS only)
- ✅ Xcode 13+
- ✅ iOS SDK 14+
- ✅ CocoaPods

## Development Build

### Local Development (Expo Go)

**Fastest for development - No build required!**

```bash
# Terminal 1: Start Expo server
npm start

# Terminal 2: On device
# Scan QR code with Expo Go app
# Or press 'a' (Android) or 'i' (iOS)
```

**Advantages:**
- ✅ Instant hot reload
- ✅ No build time
- ✅ Works on simulator/physical device

**Limitations:**
- ⚠️ Expo Go sandboxed environment
- ⚠️ Can't test native modules outside Expo scope

### Custom Development Build (Local)

For testing native modules:

```bash
# Prerequisites:
# - Android Studio/Xcode installed
# - Emulator/simulator running or device connected

# Android
npx expo prebuild --clean  # Generates android/ folder
npx react-native run-android

# iOS (macOS)
npx expo prebuild --clean  # Generates ios/ folder
npx react-native run-ios

# With custom device ID:
npx react-native run-android --deviceId <device-id>
npx react-native run-ios --udid <device-udid>
```

## Production Build

### Setup EAS CLI

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure

# This creates eas.json in project root
```

### Android Production Build

#### Option 1: EAS Build (Recommended - Cloud Build)

```bash
# Build APK (for testing on physical device)
eas build --platform android --local

# Build AAB (for Google Play Store)
eas build --platform android --local

# This generates a download link for the artifact
```

#### Option 2: Local Build

```bash
# Generate keystore first (one-time)
keytool -genkey -v -keystore my-release-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias

# Keep this keystore safe! Store in secure location.

# Update app.json with keystore info:
{
  "android": {
    "package": "com.charterkeke",
    "versionCode": 1,
    "permissions": ["INTERNET", "ACCESS_FINE_LOCATION", ...],
    "keystore": {
      "keystorePath": "path/to/my-release-key.keystore",
      "keystorePassword": "your-password",
      "keyAlias": "my-key-alias",
      "keyPassword": "your-key-password"
    }
  }
}

# Build APK
npx react-native run-android --variant=release

# Build AAB
cd android && ./gradlew bundleRelease
```

### iOS Production Build

#### Prerequisites (macOS only)

```bash
# Install Xcode command line tools
xcode-select --install

# Install dependencies
cd ios && pod install && cd ..
```

#### Option 1: EAS Build (Recommended)

```bash
# Build for iOS (requires iOS App Signing Certificates)
eas build --platform ios --local

# First time, you'll need to:
# 1. Create provisioning profile on Apple Developer
# 2. Download signing certificate
# 3. Upload to EAS via eas credentials
```

#### Option 2: Local Build via Xcode

```bash
# Open in Xcode
open ios/ChartterKeke.xcworkspace

# In Xcode:
# 1. Select "ChartterKeke" project
# 2. Select "Release" scheme and "Generic iOS Device"
# 3. Product → Archive
# 4. Distribute to App Store or Ad Hoc

# Or from terminal:
xcodebuild -workspace ios/CharterKeke.xcworkspace \
  -scheme CharterKeke \
  -configuration Release \
  -archivePath CharterKeke.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath CharterKeke.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath CharterKeke_Release
```

## Deployment to App Stores

### Google Play Store

#### Preparation

1. **Create Google Play Developer Account**
   - Go to [Google Play Console](https://play.google.com/console)
   - Pay $25 registration fee
   - Accept developer agreement

2. **Create Application Entry**
   - Create new app with Package Name: `com.charterkeke`
   - Fill in app category, content rating

3. **Prepare Signing Key**
   - Follow Android Production Build section above
   - Upload signing certificate to Google Play Console

#### Upload Build

```bash
# Generate signed AAB
cd android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab

# Upload to Google Play Console:
# 1. Go to "Release" → "Production"
# 2. Click "Create new release"
# 3. Upload AAB file
# 4. Review details and submit
```

#### Store Listing

- ✅ App Name: "Charter Keke"
- ✅ Short Description (50 chars): "Tricycle ride-sharing simplified"
- ✅ Full Description (4000 chars): Feature overview
- ✅ Screenshots: 2-5 screenshots per device size
- ✅ Feature Graphic (1024x500): App hero image
- ✅ Icon (512x512): App logo
- ✅ Video Link: Optional demo video

#### Release Process

1. Submit for internal testing
2. Get feedback from testers
3. Release to closed/open beta track
4. Monitor crash rates
5. Release to production when stable

### Apple App Store

#### Preparation

1. **Create Apple Developer Account**
   - Go to [Apple Developer Program](https://developer.apple.com/programs)
   - Pay $99/year membership
   - Accept agreements

2. **Create App in App Store Connect**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create new app with Bundle ID: `com.charterkeke.ios`
   - Select category, content rating

3. **Setup Code Signing**
   ```bash
   # Generate certificates (done in Xcode or manually)
   # Xcode → Preferences → Accounts → Manage Certificates
   
   # Create provisioning profiles for development and distribution
   # Store locally or upload to EAS
   ```

#### Upload Build

```bash
# Build and archive
xcodebuild -workspace ios/CharterKeke.xcworkspace \
  -scheme CharterKeke \
  -configuration Release \
  -archivePath CharterKeke.xcarchive \
  archive

# Export for App Store
xcodebuild -exportArchive \
  -archivePath CharterKeke.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath CharterKeke_Release

# Upload with Transporter (Apple's upload tool)
# Or use Xcode's native upload feature
```

#### Store Listing

- ✅ App Name: "Charter Keke"
- ✅ Subtitle (30 chars): "Ride-Sharing, Made Easy"
- ✅ Description: Feature overview
- ✅ Keywords: "tricycle, ride sharing, transportation"
- ✅ Support URL: https://charter.test/support
- ✅ Privacy Policy URL: https://charter.test/privacy
- ✅ Screenshots: 2-5 per device size
- ✅ Preview Video: Optional 30s demo
- ✅ Icon (1024x1024): App logo

#### App Review & Release

1. Fill in app information
2. Set age rating (questionnaire)
3. Configure pricing and availability
4. Add app review information (test account, demo video)
5. Submit for review (takes 1-3 days)
6. Once approved, schedule release

## Version Management

### Semantic Versioning

```json
{
  "expo": {
    "name": "Charter Keke",
    "version": "1.0.0",      // Semantic version
    "runtimeVersion": "1.0.0" // Expo runtime compatibility
  },
  "android": {
    "versionCode": 1,         // Must increment every build
    "versionName": "1.0.0"    // Matches expo.version
  },
  "ios": {
    "bundleVersion": "1",     // Match android.versionCode
    "bundleShortVersionString": "1.0.0"
  }
}
```

### Version Update Workflow

```bash
# Before each release:

# 1. Update version in app.json
#    and increment versionCode (android)

# 2. Update CHANGELOG
#    document features/fixes

# 3. Commit with tag
git add app.json CHANGELOG.md
git commit -m "Bump version to 1.0.1"
git tag -a v1.0.1 -m "Release version 1.0.1"
git push origin main --tags

# 4. Build for stores
eas build --platform android --local
eas build --platform ios --local
```

## Continuous Deployment (CD)

### GitHub Actions Setup

Create `.github/workflows/build-and-release.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm install
      
      - name: Build Android with EAS
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
        run: |
          npm install -g eas-cli
          eas build --platform android
      
      - name: Upload to Google Play
        uses: r0adkll/upload-google-play@v1
        with:
          packageName: com.charterkeke
          releaseFiles: app/build/outputs/bundle/release/app-release.aab
          serviceAccountJson: ${{ secrets.GOOGLE_PLAY_CREDENTIALS }}
```

## Testing Before Release

### Device Testing Checklist

- ✅ Test on minimum SDK version (Android 24+)
- ✅ Test on latest SDK version
- ✅ Test on various screen sizes (5", 6", 7", 10" tablets)
- ✅ Test location permissions granted/denied
- ✅ Test network offline/online transitions
- ✅ Test with slow 3G network
- ✅ Test with full device storage
- ✅ Test dark/light mode switching
- ✅ Test screen orientation changes
- ✅ Test app backgrounding/foregrounding

### Feature Testing

```bash
# Test location services
npm start
# In app: Grant location permission, verify tracking

# Test offline caching
# Start app, disable network, create ride
# Enable network, verify sync

# Test API errors
# Mock API error in services/api.ts
# Verify error handling in screens

# Test auth flow
# Test login, logout, token refresh
# Test invalid credentials
# Test session expiry
```

## Monitoring in Production

### Crash Reporting

Setup in `app.tsx`:

```typescript
import * as Sentry from "sentry-expo";

Sentry.init({
  dsn: "https://your-sentry-dsn@sentry.io/project-id",
  environment: "production",
});

// Crashes automatically reported to Sentry
```

### Analytics

Setup in `app.tsx`:

```typescript
import Analytics from '@react-native-firebase/analytics';

// Track screen views
useEffect(() => {
  Analytics().logScreenView({
    screen_name: route.name,
    screen_class: 'HomeScreen',
  });
}, [route]);

// Track events
Analytics().logEvent('ride_booked', {
  distance_km: 5.2,
  fare: 2500,
  pickup_location: 'Ikoyi',
});
```

## Rollback Procedure

If something breaks in production:

```bash
# Revert to previous version
git revert <commit-hash>

# Rebuild and redeploy
npm run build:android
npm run build:ios

# Push to app stores
# Tag as hotfix: v1.0.1-hotfix-1
```

## Production Checklist

Before releasing to production:

### Code Review
- ✅ All code reviewed by team lead
- ✅ Test coverage > 80%
- ✅ Zero console.error logs in production
- ✅ All TODOs resolved
- ✅ No hardcoded API keys/secrets

### Security
- ✅ API keys in .env.local (not committed)
- ✅ Passwords hashed and salted
- ✅ SSL/TLS enforced for all API calls
- ✅ No sensitive data logged
- ✅ Permissions only requested when needed

### Performance
- ✅ App bundle size < 50MB
- ✅ Startup time < 3 seconds
- ✅ Jank checker passes
- ✅ Memory leaks resolved
- ✅ Battery drain minimized

### Compatibility
- ✅ Tested on Android 24+
- ✅ Tested on iOS 12+
- ✅ Tested on RTL languages (if applicable)
- ✅ Tested with accessibility enabled
- ✅ Works on tablets

### Documentation
- ✅ README.md updated
- ✅ CHANGELOG.md updated
- ✅ API documentation current
- ✅ Code comments clear and helpful
- ✅ Build instructions documented

### App Store Compliance
- ✅ Privacy policy provided
- ✅ Terms of service provided
- ✅ Tested on latest OS versions
- ✅ All permissions justified
- ✅ No rejected API usage

## Support & Troubleshooting

### Build Fails with "Module not found"

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

### iOS Build Fails with Xcode Error

```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Update pods
cd ios && rm -rf Pods && pod install && cd ..

# Rebuild
npm run ios
```

### Android Build Fails with Gradle Error

```bash
# Clear gradle cache
cd android
./gradlew clean
./gradlew build
cd ..
```

### App Crashes on Startup

1. Check adb logcat for errors
2. Review recent code changes
3. Check .env.local configuration
4. Verify backend API is running/accessible

## Useful Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [EAS Build Docs](https://docs.expo.dev/build/introduction)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Sentry Error Tracking](https://sentry.io)

---

**Total Build Time:** 
- APK: ~15 minutes (local) / ~5 minutes (EAS cloud)
- AAB: ~20 minutes (local) / ~10 minutes (EAS cloud)
- iOS: ~25 minutes (local) / ~15 minutes (EAS cloud)

**Next:** Release v1.0.0 to beta testing! 🚀
