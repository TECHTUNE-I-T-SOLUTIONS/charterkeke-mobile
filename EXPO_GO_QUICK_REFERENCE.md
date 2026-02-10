# Expo Go - Quick Reference Guide

## 📱 Version Information

### Current Exposed Go Version (Latest)
- **Version**: 51.x (latest)
- **Auto-updates**: Yes (enabled by default)
- **Compatibility**: Expo SDK 51.0.0 (your project)

### Minimum Device Requirements

| Platform | Minimum OS | Recommended OS | Recommended RAM |
|----------|-----------|----------------|-----------------|
| **Android** | 7.0 (API 24) | 10.0+ (API 29+) | 2GB+ |
| **iOS** | 12.0 | 15.0+ | 2GB+ |

## ✅ Installation Links

**For Android**:
https://play.google.com/store/apps/details?id=host.exp.exponent

**For iOS**:
https://apps.apple.com/us/app/expo-go/id1088637711

## 🎯 Quick Start (After Installation)

### On Your Phone
1. Install Expo Go from app store
2. Open the app
3. See "Scan a QR code" message
4. You're ready! ✅

### On Your Computer
```bash
cd c:\Codes\ck
pnpm install      # One-time setup
pnpm start        # Start development
```

### Connect Phone to App
1. Dev server will show a QR code in terminal
2. Open Expo Go on your phone
3. Tap **Scan** button
4. Point camera at QR code
5. App loads on your phone! 🎉

## 🔧 Troubleshooting Versions

### "Incompatible Versions" Error
If you see: "This project is not compatible with Expo SDK 51"

**Solution**: Update Expo Go to latest
- Android: Open Play Store → Expo Go → Update
- iOS: Open App Store → Expo Go → Update

### Check Your Expo SDK Version
```bash
# In terminal
expo --version

# Should show: 51.0.0 (or higher)
```

## 📊 Version Compatibility Matrix

| Expo SDK | Min Expo Go | Recommended | Status |
|----------|------------|------------|--------|
| 51.x | 51.0 | 51.x+ (latest) | ✅ Your Project |
| 50.x | 50.0 | 50.x+ | Older |
| 49.x | 49.0 | 49.x+ | Older |

## 💡 Pro Tips

### Faster App Loading
- Use physical phone (not emulator)
- Both on same WiFi network
- First load: 30-60 seconds
- Subsequent loads: 5-10 seconds

### Keep App Updated
- Expo Go auto-updates by default
- Check updates: Play Store/App Store
- Always use latest version

### If App Crashes
1. Clear Expo Go cache:
   - Settings → Apps → Expo Go → Storage → Clear Cache
2. Reinstall from app store
3. Restart your phone
4. Try again

## ❓ Quick FAQ

**Q: What version of Expo Go do I need?**  
A: Latest version (auto-updates). Just install and it handles compatibility.

**Q: Can I use an older version of Expo Go?**  
A: Not recommended. Always use the latest for best compatibility.

**Q: Does Expo Go update automatically?**  
A: Yes, Google Play and App Store auto-update apps by default.

**Q: What if I have Expo Go version 50?**  
A: Update to latest (51+) from app store. It's automatic if auto-update is enabled.

**Q: Do I need WiFi?**  
A: Yes, device and computer must be on the same WiFi network.

**Q: Can I use mobile data?**  
A: No, local WiFi required for dev server connection.

**Q: How do I know what version I have?**  
A: Open Expo Go → Settings → scroll down → App Version shown at bottom.

## 🚀 One-Line Quick Start

```bash
cd c:\Codes\ck && pnpm install && pnpm start
```

Then scan the QR code with Expo Go on your phone!

---

**Status**: ✅ All Systems Compatible  
**Project Expo Version**: 51.0.0  
**Recommended Expo Go**: Latest (51.x+)  
**Last Updated**: Current Session
