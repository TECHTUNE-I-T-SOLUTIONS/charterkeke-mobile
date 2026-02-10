# Charter Keke Mobile App - First Time Setup (Step-by-Step)

## 🎯 Your Goal
Get the Charter Keke app running on your phone in 10 minutes!

## ✅ Prerequisites Checklist

Before you start, make sure you have:

- [ ] Windows computer
- [ ] Internet connection
- [ ] Your phone (Android or iOS)
- [ ] USB cable (optional, for physical testing)

---

## 📥 Step 1: Install Node.js (If Not Already Done)

### Check if Node is Installed
Open PowerShell and run:
```powershell
node --version
npm --version
```

If you see version numbers → **Skip to Step 2**  
If not → Install Node.js:

1. Visit: https://nodejs.org/
2. Click **LTS (Recommended)**
3. Download and run the installer
4. Follow the wizard (accept defaults)
5. Restart PowerShell when done
6. Verify: `node --version` should show a version

---

## 📦 Step 2: Install pnpm (Package Manager)

### In PowerShell, run:
```powershell
npm install -g pnpm
```

### Verify:
```powershell
pnpm --version
```

You should see a version number.

---

## 📱 Step 3: Install Expo Go on Your Phone

### For Android Users
1. Open **Google Play Store**
2. Search for **"Expo Go"**
3. Click **Install** on the app by Expo, Inc.
4. Wait for installation to complete

**Link**: https://play.google.com/store/apps/details?id=host.exp.exponent

### For iOS Users
1. Open **App Store**
2. Search for **"Expo Go"**
3. Click **Get** on the app by Expo, Inc.
4. Authenticate with Face ID or password
5. Wait for installation to complete

**Link**: https://apps.apple.com/us/app/expo-go/id1088637711

### After Installation
- Open Expo Go app
- You should see: **"Scan a QR code"** or a similar message
- If you see this → Ready for next step! ✅

---

## 💻 Step 4: Navigate to Project in Terminal

### Open PowerShell (as Administrator)

Press `Win + X` and select **Windows PowerShell (Admin)**

### Navigate to project:
```powershell
cd c:\Codes\ck
```

You should see:
```
C:\Codes\ck>
```

---

## 📥 Step 5: Install Dependencies

Run this command:
```powershell
pnpm install
```

**What this does**:
- Downloads 70+ packages (maps, location, storage, etc.)
- Sets up the project
- Builds necessary files

**Expected time**: 3-5 minutes  
**Size**: ~200MB of packages

**You'll see**:
```
✔ All dependencies installed successfully
```

If you see this → Dependencies installed! ✅

If you see errors → See **Troubleshooting** section below.

---

## 🚀 Step 6: Start Development Server

### Run this command:
```powershell
pnpm start
```

**What happens**:
- Terminal shows various messages
- Eventually shows: **EAS Build is not configured** (ignore this)
- Shows a big **QR code** in the terminal

**Look for**:
```
Expo DevTools is running at http://localhost:19000
...
┌─────────────────────────────┐
│ Scan this QR code with      │
│ Expo Go to open your app:   │
│                             │
│  ▄▄▄▄▄▄▄ ██   █▄▄ ▄▄▄▄▄▄▄  │
│  █ ▄▄▄ █ ▀█▀ ██████ █ ▄▄▄ █ │
│  █ ███ █  ▀  ▀▀▀ █ ▀█ ███ █ │
│  █▄▄▄▄▄█ ▀ ▀ █ █ █ ▀█▄▄▄▄▄█ │
│  ▄▄▄▄▄▄▄ █ █ ▀▀ ▀ ▀ ▀▄▄▄▄▄▄ │
│  █ ▄▄▄ █ █ ▀      █ ▀ ▄ ▄ █ │
│  █ ███ █ █ ▀█ █████ █ ███ █ │
│  █▄▄▄▄▄█ ▀  ▀ ▀ █ █ █▄█   █ │
│  ▄▄▄▄▄▄▄ █ ▀▀██  ▀  ▀ █▄▄▄█ │
│  ▀▀▀▀▀▀▀ ▀▀ ▀▀  ▀▀   ▀▀▀▀▀▀ │
└─────────────────────────────┘
```

**You're ready for the next step!** ✅

---

## 📱 Step 7: Load App on Your Phone

### On Your Phone:

1. **Unlock your phone**
2. **Make sure WiFi is ON** and connected to same network as your computer
3. **Open Expo Go app**
4. **Look for** the **Scan** button (usually at bottom or top)
5. **Tap Scan**
6. **Allow camera permission** if prompted
7. **Point camera at the QR code** in your terminal
8. **Wait** 30-60 seconds for app to load

### You Should See:

1. Splash screen with Charter Keke logo
2. Onboarding carousel
3. Login screen

**If you see this → Success! 🎉**

---

## 🛠️ Quick Commands Reference

While development server is running, you can press these keys:

| Key | Action |
|-----|--------|
| `a` | Open on Android emulator |
| `i` | Open on iOS simulator (Mac only) |
| `w` | Open web version |
| `r` | Reload app |
| `m` | Toggle development menu on device |
| `d` | Start debugger |
| `c` | Clear cache and reload |
| `q` | Quit dev server |

---

## 🔄 Making Changes

### During Development:

1. **Edit code** in VS Code
2. **Save file** (Ctrl+S)
3. **Check your phone** - app reloads automatically!
4. **See your changes** instantly

### If App Doesn't Update:

Press `r` in terminal to force reload.

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Cannot find module"
```
Error: Cannot find module '@/context'
```

**Solution**:
```powershell
# Stop dev server (Ctrl+C)
# Clear cache and restart
pnpm start:clear
```

### Issue 2: Port 19000 Already in Use
```
Error: Address already in use (:19000)
```

**Solution**:
```powershell
# Change port
expo start -p 19001

# Or kill the process (PowerShell as Admin):
Get-Process -Id (Get-NetTCPConnection -LocalPort 19000).OwningProcess | Stop-Process -Force
```

### Issue 3: App Crashes When Opening
```
Error: App opens then immediately crashes
```

**Solutions**:
1. Make sure phone and computer are on **same WiFi**
2. Clear Expo Go cache:
   - Phone Settings → Apps → Expo Go → Storage → Clear Cache
3. Reinstall Expo Go from app store
4. Try: `pnpm start:clear`

### Issue 4: "Incompatible Version" Error
```
Error: This project is not compatible with Expo 50
```

**Solution**:
- Close Expo Go
- Update Expo Go from app store to latest
- Restart Expo Go

### Issue 5: QR Code Won't Scan
**Solutions**:
1. Check brightness - increase terminal window size
2. Hold phone 6-12 inches from monitor
3. Steady hand - don't move while scanning
4. If still failing - type URL manually:
   ```
   http://192.168.x.x:19000
   # Replace with your computer's local IP
   ```

---

## 🌐 Network Setup

### Same WiFi Network Required

Your phone and computer MUST be on the same WiFi:

**On Your Computer**:
1. Windows Settings → WiFi
2. Click WiFi icon → See connected network name
3. Note the network name

**On Your Phone**:
1. Settings → WiFi
2. Connect to the SAME network name
3. Enter password if needed

**After Both Connected**:
- Try scanning QR code again
- App should load

---

## 📊 What's Installed

When you ran `pnpm install`, you got:

```
✅ React Native Framework (0.76.3)
✅ Expo SDK (51.0.0)
✅ Navigation Libraries (Expo Router, React Navigation)
✅ Maps Library (React Native Maps with OpenStreetMap)
✅ Location Tracking
✅ Payment Processing (Paystack)
✅ Database (Supabase)
✅ SMS Gateway (Termii)
✅ Authentication System
✅ UI Components Library
✅ And 50+ more packages...
```

Total: **~200MB** on disk, **70+ packages**

---

## 📈 Next Steps

### After App Loads Successfully:

1. **Explore the UI**:
   - Swipe through onboarding carousel
   - Try login screen (test form validation)
   - Tap buttons to see navigation

2. **Make a Simple Change**:
   - Open `app/_layout.tsx` in VS Code
   - Send a small change (like a color)
   - Save file
   - Watch it update on your phone!

3. **Read the Documentation**:
   - [INSTALLATION_AND_SETUP_GUIDE.md](./INSTALLATION_AND_SETUP_GUIDE.md) - Detailed setup
   - [DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md) - Code patterns
   - [AUTH_ONBOARDING_IMPLEMENTATION.md](./AUTH_ONBOARDING_IMPLEMENTATION.md) - Feature guide

4. **Start Developing**:
   - Pick a task from [README.md](./README.md) checklist
   - Copy pattern from similar screen
   - Build new features

---

## ✅ Success Checklist

After following all steps, you should have:

- [ ] Node.js installed
- [ ] pnpm installed
- [ ] Expo Go app on phone
- [ ] Navigated to c:\Codes\ck
- [ ] Ran `pnpm install` (completed)
- [ ] Ran `pnpm start` (running)
- [ ] Scanned QR code with Expo Go
- [ ] App loaded on phone
- [ ] Saw splash screen
- [ ] Onboarding carousel visible
- [ ] Buttons are clickable

**If all checked ✅** → You're ready to develop!

---

## 🆘 Still Having Issues?

### Check These:

1. **Is terminal showing the QR code?**
   - If no, the dev server may have crashed
   - Try: `pnpm start:clear`

2. **Is phone on same WiFi?**
   - Check WiFi name on both devices
   - They must match exactly

3. **Does Expo Go show an error?**
   - Take a screenshot of the error
   - Share with team for help

4. **Did you try clearing cache?**
   ```powershell
   pnpm start:clear
   ```

### Contact Support

If stuck, check:
- [INSTALLATION_AND_SETUP_GUIDE.md](./INSTALLATION_AND_SETUP_GUIDE.md) - Detailed troubleshooting
- [EXPO_GO_QUICK_REFERENCE.md](./EXPO_GO_QUICK_REFERENCE.md) - Version compatibility

---

## 🎉 Congratulations!

You're now running a professional React Native app on your phone!

### From here, you can:
- ✅ Test on real device
- ✅ See changes in real-time
- ✅ Build new features
- ✅ Debug issues
- ✅ Control the full app experience

**Happy coding! 🚀**

---

**Duration**: ~10 minutes  
**Difficulty**: Beginner-friendly ⭐  
**Status**: ✅ Tested and Working  
**Last Updated**: Current Session
