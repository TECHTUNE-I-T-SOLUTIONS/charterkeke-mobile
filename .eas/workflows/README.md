# EAS Workflows for Charter Keke Mobile

This directory contains EAS CLI workflows for building Charter Keke mobile app.

## Status

- **Android:** Building without signing credentials (debug APK)
- **iOS:** Coming soon (waiting for credentials)

## Available Workflows

### 1. Production Build (`build-android-release.yml`)
Builds both APK and Android App Bundle (AAB) for Play Store distribution.
*Note: Currently builds debug APK until credentials are added.*

**Run manually:**
```bash
pnpm eas workflow:run build-android-release.yml
```

### 2. Quick Development Build (`build-android-quick.yml`)
Builds a single APK for faster testing and development.

**Run manually:**
```bash
pnpm eas workflow:run build-android-quick.yml
```

## Automatic GitHub Integration (Manual Trigger Only)

### How to Trigger Builds
**Option 1: Via GitHub Actions**
1. Go to your repo → Actions tab
2. Select "EAS Build Android"
3. Click "Run workflow" button
4. Build starts on EAS

**Option 2: Via CLI**
```bash
pnpm eas workflow:run build-android-release.yml
```

**Option 3: Via EAS Dashboard**
1. Go to https://expo.dev/accounts/[your-account]/projects
2. Click "Start build"
3. Select Android platform
4. Click "Build"

## Prerequisites

### ✅ Required (Already Done)
- [x] Expo Token in GitHub Secrets (`EXPO_TOKEN`)
- [x] GitHub linked to EAS account

### ⏳ Coming Later
- [ ] Android signing credentials (keystore)
- [ ] iOS certificates & provisioning profiles
- [ ] Google Play Store account setup
- [ ] Apple Developer account setup

## Build Information

### Current Setup (No Signing)
- **Build Type:** Unsigned debug APK
- **Installation:** Direct APK install on test devices
- **Distribution:** Internal testing only
- **File Size:** ~80-100MB

### Once Credentials Added
- **Build Type:** Signed release APK + AAB
- **Installation:** Google Play Store
- **Distribution:** Production ready
- **File Size:** ~50-70MB (optimized)

## Using Unsigned APKs for Testing

### Installation Steps
```bash
# Connect device via USB
adb devices

# Install the unsigned APK
adb install path/to/app.apk

# Or enable Unknown Sources and transfer file directly
```

### Enable Unknown Sources
1. Settings → Apps & Notifications
2. Advanced → Install unknown apps
3. Enable for your file manager
4. Install the APK file

## View Build History

### EAS Dashboard
https://expo.dev/accounts/[your-account]/projects/[your-project]/builds

### GitHub Actions
Your repo → Actions → EAS Build Android logs

### CLI
```bash
eas build:list --platform android
eas build:view [build-id]
```

## Update Credentials Later

When you have Android/iOS signing credentials:

### Add Android Credentials
```bash
pnpm eas credentials
# or visit https://expo.dev → Build Credentials → Android
```

### Update Workflow
Once credentials are added, signed builds will be generated automatically.

## Next Steps

1. ✅ Expo Token added to GitHub Secrets
2. ✅ Workflow files created
3. ⏳ Trigger first manual build via GitHub Actions
4. ⏳ Test unsigned APK on device
5. ⏳ Add Android signing credentials when ready
6. ⏳ Set up iOS builds

## Resources

- [EAS Workflows Docs](https://docs.expo.dev/eas/workflows/)
- [EAS Build without Credentials](https://docs.expo.dev/build-reference/architecture/#build-without-credentials)
- [Installing Unsigned APKs](https://docs.expo.dev/build/apk/)
- [EAS Dashboard](https://expo.dev)
