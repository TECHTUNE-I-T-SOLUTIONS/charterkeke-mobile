# Version Management Guide - Charter Keke Mobile

## 🔍 Problem Summary

The app was showing "Update Available" even after installing the latest version because:

1. **app.json version** wasn't being compiled into the APK manifest
2. **eas.json** had `"appVersionSource": "remote"` which prevented local version from being used
3. **No fallback mechanism** if manifest version wasn't readable
4. **No cache busting** when app version changed

This caused the loop:
- User installs 2.1.1 but manifest still shows 2.0.0
- Update check sees 2.0.0 < 2.1.1 and shows "Update available"
- Even after reinstalling, same version shown

---

## ✅ Fixes Applied

### 1. **eas.json Configuration** ✅
**File:** `/eas.json`

Changed:
```json
{
  "cli": {
    "appVersionSource": "remote"  ❌ Old
    "appVersionSource": "local"   ✅ New
  }
}
```

**Impact:** Forces EAS CLI to use local `app.json` version when building APK

### 2. **Enhanced Version Utils** ✅
**File:** `/utils/versionUtils.ts`

Added multi-source version detection:
```typescript
// Priority order:
1. Constants.manifest.version     (from compiled APK)
2. Constants.expoConfig.version   (from app.json)
3. AsyncStorage (cached)          (from previous run)
4. Fallback "2.0.0"              (final safety)
```

New functions:
- `getVersionInfoDetailed()` - Returns version + source + build info
- `cacheCurrentVersion()` - Saves version to AsyncStorage on startup
- `hasVersionChanged()` - Detects if app was updated

### 3. **UpdateService Initialization** ✅
**File:** `/services/updateService.ts`

Added:
```typescript
static async initializeVersionDetection(): Promise<void>
```

This function:
- Caches the current version on app startup
- Detects if app was updated
- Clears dismissed version on update (shows release notes again)
- Logs detailed debug info

### 4. **App Startup Hook** ✅
**File:** `/app.tsx`

Added initialization call:
```typescript
useEffect(() => {
  if (fontsLoaded || fontError) {
    SplashScreen.hideAsync();
    
    // ✅ Initialize version detection
    UpdateService.initializeVersionDetection();
  }
}, [fontsLoaded, fontError]);
```

---

## 📋 Version Update Workflow (Correct Way)

### Step 1: Update app.json
```bash
# Edit app.json and increment version
{
  "expo": {
    "version": "2.1.2"  ← Increment this
  }
}
```

### Step 2: Clear any old builds
```bash
# Clean build files
rm -rf .expo/
rm -rf build/
```

### Step 3: Build locally
```bash
# For Android APK
eas build --platform android --local

# The APK will include version 2.1.2 in manifest
```

### Step 4: Install and verify
```bash
# On device:
1. Uninstall old app
2. Install new APK
3. Open app
4. Check logs for:
   [VersionUtils] Got version from manifest: 2.1.2
   [UpdateService] Version info: { version: '2.1.2', source: 'manifest' }
```

### Step 5: Check for updates
```bash
# Should now show: "You are on the latest version (2.1.2)"
# No more false "update available" messages
```

---

## 🐛 Debugging Version Issues

### Check logs for these indicators:

**✓ Success:**
```
[VersionUtils] ✓ Got version from manifest: 2.1.2
[UpdateService] Version info: { version: '2.1.2', source: 'manifest', ... }
[UpdateService] 🔄 App updated! (previous: 2.0.0, current: 2.1.2)
```

**⚠ Fallback (not ideal):**
```
[VersionUtils] ⚠ Using stored version: 2.1.2
[VersionUtils] ⚠ (manifest was not available, using cache)
```

**✗ Error (investigate):**
```
[VersionUtils] ✗ No version sources available, using fallback
```

### If still seeing wrong version after uninstall:

1. **Clear app cache:**
   ```bash
   # Android device
   Settings → Apps → Charter Keke → Clear Cache / Clear Data
   ```

2. **Verify APK contains correct version:**
   ```bash
   # On your build machine
   aapt dump badging output.apk | grep versionName
   # Should show: versionName=2.1.2
   ```

3. **Check app.json before building:**
   ```bash
   cat app.json | grep '"version"'
   # Should show: "version": "2.1.2"
   ```

---

## 🔄 Version Lifecycle

```
1. App Startup
   ├─ App.tsx runs useEffect
   ├─ UpdateService.initializeVersionDetection() called
   ├─ Version read from manifest
   └─ Version cached to AsyncStorage

2. During Use
   ├─ Check for Updates button clicked
   ├─ fetchLatestRelease() gets latest from backend
   ├─ compareVersions() checks if update needed
   └─ Shows appropriate message

3. After Update
   ├─ App uninstalled & new APK installed
   ├─ App.tsx runs again with new manifest version
   ├─ hasVersionChanged() detects version change
   ├─ Dismissed version cleared (for new release notes)
   └─ Next check shows "You are on latest version"
```

---

## 📦 Files Modified

| File | Changes |
|------|---------|
| `app.json` | Version already correct (2.1.2) |
| `eas.json` | Changed `appVersionSource` from `remote` to `local` |
| `utils/versionUtils.ts` | Added multi-source detection, async functions, caching |
| `services/updateService.ts` | Added init function, improved logging |
| `app.tsx` | Added version initialization on startup |

---

## ⚠️ Important Notes

1. **Always build locally before testing:** Remote builds may have caching issues
2. **Increment version for every build:** Even test builds should have unique versions
3. **Check manifest, not GitHub:** The app reads from compiled APK manifest, not GitHub releases
4. **Full uninstall needed:** Don't just reinstall over old version
5. **Clear AsyncStorage if stuck:** Emergency reset in DevTools or by reinstalling

---

## 🚀 Next Steps

1. **Update to latest version (2.1.2):**
   - Verify app.json has `"version": "2.1.2"`
   - Clean build: `rm -rf build/ .expo/`
   - Build: `eas build --platform android --local`

2. **Uninstall old app from device completely**

3. **Install new APK and verify logs show 2.1.2**

4. **Test "Check for Updates" - should show "up to date"**
