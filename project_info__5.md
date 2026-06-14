# OTA Publish Commands — Building `dist/` First (Workaround for the Path Bug)

The error `d:\D:\Codes\ck\node_modules\...` is a **Windows pnpm path concatenation bug** — the path gets doubled with `d:\D:\` instead of `D:\`. Building to `dist/` first and pointing `eas update` at it bypasses this Metro bundle race condition.

Here are the exact commands to run **one by one**:

---

## Step 1 — Export Android bundle to dist-android/
```bash
npx expo export --platform android --output-dir dist-android
```

- This builds **only** the Android JS bundle + assets into `dist-android/`
- Should complete quickly (no iOS bundling happening)

---

## Step 2 — Publish Android OTA to staging branch
```bash
npx eas update --branch staging --input-dir dist-android --message "RAIL pricing + booking refactor"
```

- Uses the pre-built `dist-android/` folder — no Metro bundling needed
- Only Android devices on `staging` channel will get the update

---

## Step 3 — Export iOS bundle to dist-ios/
```bash
npx expo export --platform ios --output-dir dist-ios
```

- Builds **only** the iOS JS bundle + assets into `dist-ios/`
- Separate directory so the Android dist is untouched

---

## Step 4 — Publish iOS OTA to production branch
```bash
npx eas update --branch production --input-dir dist-ios --message "RAIL pricing + booking refactor"
```

- Uses the pre-built `dist-ios/` folder
- Only iOS devices on `production` channel will get the update

---

## Important Notes

1. **`--input-dir` requires Expo SDK 50+** (you're on SDK 54, so it's supported)
2. **Clean up the dist folders after** (optional):
   ```bash
   rm -rf dist-android dist-ios
   ```
3. **If Step 1 still fails** with the same path error, run it without the pnpm trampoline:
   ```bash
   npx --no-install expo export --platform android --output-dir dist-android
   ```

4. **If `--input-dir` isn't recognized** by your `eas` version, update it first:
   ```bash
   npm install -g eas-cli
   ```
   Then retry Steps 2 and 4.

---

## Quick Copy/Paste Block

Run these in order, waiting for each to finish:

```bash
# 1. Build Android dist
npx expo export --platform android --output-dir dist-android

# 2. Publish Android to staging
npx eas update --branch staging --input-dir dist-android --message "RAIL pricing + booking refactor"

# 3. Build iOS dist
npx expo export --platform ios --output-dir dist-ios

# 4. Publish iOS to production
npx eas update --branch production --input-dir dist-ios --message "RAIL pricing + booking refactor"
```

Let me know which step succeeds or fails — if Step 1 still hits the path issue, there's a deeper pnpm + Windows fix needed.