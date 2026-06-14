# EAS OTA Publish Commands

I read your `eas.json`. Important clarification first:

**`eas update` doesn't require manually building a `dist/` folder** — it handles JS bundling and asset uploads automatically in one step. The `dist/` folder is only relevant for `expo export` (self-hosting) or `eas build` (native binary builds).

Here's exactly what you need. Your channels map as follows:
- `staging` channel → **Android** (your `preview` build profile)
- `production` channel → **iOS** (your `production` build profile)

Run these **one at a time**:

---

## Step 1 — Publish OTA to Android (staging channel)
```bash
npx eas update --branch staging --message "RAIL pricing integration + booking refactor"
```

- This pushes JS bundle + assets to EAS
- Only Android devices on the `staging` channel will download the update
- No native binary rebuild needed

---

## Step 2 — Publish OTA to iOS (production channel)
```bash
npx eas update --branch production --message "RAIL pricing integration + booking refactor"
```

- This pushes the exact same JS bundle + assets to EAS
- Only iOS devices on the `production` channel will download the update
- Again — no native rebuild needed

---

## ⚠️ Important Notes

1. **Both commands push the same code** to different channels. There's no need to "rebuild" between them — `eas update` creates a fresh bundle each time automatically.

2. **If you truly wanted native builds** (APK/IPA), the commands would be:
   ```bash
   # Android APK (staging)
   npx eas build --platform android --profile preview
   
   # iOS IPA (production)
   npx eas build --platform ios --profile production
   ```

3. **If you wanted a self-hosted `dist/` export** (rare for EAS), you'd run:
   ```bash
   npx expo export --platform android
   npx expo export --platform ios
   ```
   But this is **not needed** for `eas update`.

4. **The `--message` flag is optional** but recommended — it shows in the EAS dashboard so you can track what each update contained.

---

## Summary — Just run these two commands:

```bash
# ✅ Android staging
npx eas update --branch staging --message "RAIL pricing + booking refactor"

# ✅ iOS production
npx eas update --branch production --message "RAIL pricing + booking refactor"
```

After both complete, users on each channel will get the update silently the next time they open the app (or immediately if you set `expo-updates` to fetch on foreground).