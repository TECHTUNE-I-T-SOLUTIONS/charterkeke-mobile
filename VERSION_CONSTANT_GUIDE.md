# Version Constant Guide - Charter Keke Mobile

## 🎯 Problem Solved

The manifest wasn't being read reliably, causing the app to always show "Update Available" even on the latest version.

**Solution:** Created `constants/version.json` as the **PRIMARY SOURCE OF TRUTH** for app version.

---

## 📁 New Single File to Update

**Location:** `/constants/version.json`

```json
{
  "version": "2.1.2",
  "buildNumber": 212,
  "releaseDate": "2026-04-15",
  "changelog": "Your release notes here..."
}
```

---

## 🚀 How to Use

### Update Version When Releasing

**Step 1:** Edit `/constants/version.json`
```json
{
  "version": "2.1.3",           ← Increment version
  "buildNumber": 213,            ← Increment build number
  "releaseDate": "2026-04-15",  ← Update date
  "changelog": "Fixed... Added..." ← Update notes
}
```

**Step 2:** Rebuild the app
```bash
eas build --platform android --local
```

**Step 3:** Install and test
- App now reads version "2.1.3" from JSON file
- Logs will show: `✓✓✓ Got version from constants/version.json: 2.1.3`

---

## 🔍 Version Detection Priority

The app now checks for version in this order:

1. **✓✓✓ `constants/version.json`** ← PRIMARY (always use this)
2. `Constants.manifest.version` (compiled APK manifest)
3. `Constants.expoConfig.version` (expo-constants)
4. AsyncStorage cache (from previous run)
5. Fallback "2.0.0"

Since you're importing from JSON, **option #1 always wins** 🎉

---

## 📊 Build Number Tracking

Use `buildNumber` to track builds independently:

```json
{
  "version": "2.1.2",    // Semantic version (user-visible)
  "buildNumber": 212,    // Internal build counter (always increment)
  "releaseDate": "2026-04-15"
}
```

Example progression:
```
Version 2.1.0 → buildNumber: 210
Version 2.1.1 → buildNumber: 211
Version 2.1.2 → buildNumber: 212
Version 2.1.2 → buildNumber: 213 (patch build)
```

---

## 📝 Changelog Best Practices

Keep changelog short and visible in the Update Modal:

```json
{
  "changelog": "Stable release with UI improvements, fixed message positioning, enhanced version detection."
}
```

For detailed notes, link to GitHub releases in the UI.

---

## 🔧 Accessing Version in Code

### Get version synchronously
```typescript
import { getConstantVersion, getVersionConfig } from '@/utils/versionUtils';

const version = getConstantVersion();  // "2.1.2"
const config = getVersionConfig();     // Full config object
```

### Get version asynchronously (with fallbacks)
```typescript
import { getCurrentAppVersion, getVersionInfoDetailed } from '@/utils/versionUtils';

const version = await getCurrentAppVersion();      // "2.1.2"
const detailed = await getVersionInfoDetailed();   // With source info
// Returns: { version, source: 'constant', buildInfo, timestamp }
```

---

## 📜 Logs to Expect

When app starts:

```
✓✓✓ [VersionUtils] Got version from constants/version.json: 2.1.2
✓ [VersionUtils] Build number: 212
✓ [VersionUtils] Release date: 2026-04-15
✓ [UpdateService] Version info: { version: '2.1.2', source: 'constant' ... }
```

---

## 🐛 Troubleshooting

### Version still shows as 2.0.0
1. Verify `/constants/version.json` exists and is readable
2. Check that version string is valid: `"X.X.X"` format
3. Make sure file isn't corrupted (valid JSON)
4. Rebuild: `eas build --platform android --local`

### Import error on version.json
- Ensure `tsconfig.json` has `"resolveJsonModule": true` ✓ (already set)
- File should be at exact path: `d:\Codes\ck\constants\version.json`

### JSON file in wrong folder
If you moved or renamed the constants folder:
```typescript
// Update the import path in versionUtils.ts
import versionConfig from '@/your-new-path/version.json';
```

---

## 📋 Checklist for Every Release

- [ ] Update `version` in `/constants/version.json` (use semver)
- [ ] Increment `buildNumber` by 1
- [ ] Update `releaseDate` to today
- [ ] Update `changelog` with user-facing notes
- [ ] Commit changes: `git add constants/version.json && git commit -m "Bump version to 2.1.3"`
- [ ] Build: `eas build --platform android --local`
- [ ] Test version shows correctly in logs and about screen
- [ ] Test "Check for Updates" shows "up to date"

---

## 🎉 Benefits of This Approach

✅ **Single source of truth** - One file to update  
✅ **No build cache issues** - Reads at runtime  
✅ **Easy to increment** - Just edit JSON  
✅ **Version metadata** - Includes build number, date, notes  
✅ **Instant changes** - No rebuild needed to update all references  
✅ **Reliable detection** - Never relies on flaky manifest unless JSON fails  
✅ **Easy debugging** - Can see exact version and source in logs  

---

## Example Version History

```json
// 2026-04-01: Initial launch
{ "version": "2.0.0", "buildNumber": 200, "releaseDate": "2026-04-01" }

// 2026-04-05: Bug fixes
{ "version": "2.0.1", "buildNumber": 201, "releaseDate": "2026-04-05" }

// 2026-04-10: Feature release
{ "version": "2.1.0", "buildNumber": 210, "releaseDate": "2026-04-10" }

// 2026-04-15: UI improvements (CURRENT)
{ "version": "2.1.2", "buildNumber": 212, "releaseDate": "2026-04-15" }

// Next release:
{ "version": "2.1.3", "buildNumber": 213, "releaseDate": "2026-04-XX" }
```
