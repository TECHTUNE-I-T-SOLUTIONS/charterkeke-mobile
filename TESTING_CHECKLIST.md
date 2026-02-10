# Charter Keke Mobile App - Testing Checklist

## Pre-Launch Validation Checklist

### Environment Setup ✅
- [x] `.env.local` has `EXPO_PUBLIC_API_URL=https://charterkeke.vercel.app/api`
- [x] Backend is running and accessible at `https://charterkeke.vercel.app/api`
- [x] Mobile app built successfully with no errors
- [x] `ThemeProvider` wrapped at root (`app/_layout.tsx`)

---

## 1. Theme System Testing

### 1.1 Theme Toggle Visibility
**Steps**:
1. Start the app (any screen - try welcome, login, or signup)
2. Look for a **button in the top-right corner** (toggle icon)
3. Should show:
   - **Light mode**: Moon icon ☾
   - **Dark mode**: Sun icon ☀️

**Expected Result**: Button visible and clickable ✅  
**Failure**: Button not visible → Check if ThemeToggle imported in screens

---

### 1.2 Light Mode Colors
**Steps**:
1. Ensure app is in **Light Mode** (tap toggle if needed)
2. Navigate to signup screen
3. Check the following colors:

**Expected Colors (Light Mode)**:
| Element | Expected Color | Format |
|---------|---|---|
| Text (titles, labels) | Black | #000000 |
| Background | White | #FFFFFF |
| Input field borders | Light gray | #CCCCCC |
| Input field text | Black | #000000 |
| Role cards background | Light gray | #F5F5F5 |
| Role card icons | Black | #000000 |
| Buttons (selected) | Black background | #000000 |
| Error text | Red | #F44336 |
| Success indicators | Green | #10B981 |

**Expected Result**: All text and borders are BLACK on WHITE ✅  
**Failure**: Colors still blue or inconsistent → Colors not updating

---

### 1.3 Dark Mode Colors
**Steps**:
1. Tap theme toggle to switch to **Dark Mode**
2. Navigate to signup screen
3. Check the following colors:

**Expected Colors (Dark Mode)**:
| Element | Expected Color | Format |
|---------|---|---|
| Text (titles, labels) | White | #FFFFFF |
| Background | Dark gray/black | #121212 |
| Input field borders | Dark gray | #333333 |
| Input field text | White | #FFFFFF |
| Role cards background | Darker gray | #1E1E1E |
| Role card icons | White | #FFFFFF |
| Buttons (selected) | White background | #FFFFFF |
| Error text | Light red | #EF5350 |
| Success indicators | Light green | #66BB6A |

**Expected Result**: All text WHITE on DARK background ✅  
**Failure**: Colors inverted wrong or still blue → Theme not applying correctly

---

### 1.4 Theme Persistence
**Steps**:
1. Set app to **Dark Mode**
2. Close the app completely
3. Reopen the app
4. Check the theme

**Expected Result**: App opens in **Dark Mode** ✅  
**Failure**: Reverts to Light Mode → AsyncStorage not working

---

### 1.5 Theme Persistence After Restart
**Steps**:
1. Set app to **Light Mode**
2. **Force restart** the entire device/emulator
3. Reopen the app
4. Check the theme

**Expected Result**: App still in **Light Mode** ✅  
**Failure**: Reverts to default → Theme not properly persisted

---

## 2. Form Fields Testing

### 2.1 Role Selection (Step 1)
**Steps**:
1. Open signup screen
2. **Step 1**: You should see two role cards:
   - **Rider** (left) - with icon
   - **Driver** (right) - with icon
3. Tap **Rider**
4. Verify it's selected (button should show selected state)
5. Tap **Driver**
6. Verify it's now selected

**Expected Result**: Can toggle between roles ✅  
**Failure**: Can't select driver role → Role selection broken

---

### 2.2 Basic Information (Step 2 - Rider)
**Steps**:
1. Select **Rider** role
2. Proceed to **Step 2**
3. Fill in fields:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john@example.com"
   - Phone: "+2348012345678"
   - Gender: "Male" (select)
   - Date of Birth: "15/01/1990" (date picker)
   - Profile Photo: (tap to select from gallery)
4. Tap "Next"

**Expected Result**: Accepts all inputs and proceeds ✅  
**Failure**: Validation error or screen freezes → Fields not validating

---

### 2.3 Basic Information (Step 2 - Driver)
**Steps**:
1. Go back and restart signup
2. Select **Driver** role
3. Proceed to **Step 2**
4. Fill same fields as above (Step 2 is identical for both)
5. Tap "Next"

**Expected Result**: Same fields work for driver ✅  
**Failure**: Different fields or validation error → Step 2 not role-agnostic

---

### 2.4 Emergency Contact (Step 3 - Rider)
**Steps**:
1. **Rider** workflow: Complete Steps 1-2
2. **Step 3** should show rider-specific fields:
   - Emergency Contact Name: "Jane Doe"
   - Emergency Contact Phone: "+2348087654321"
   - Referral Code: "REF123" (optional)
3. Should **NOT** see driver fields:
   - ❌ Bank Account
   - ❌ Vehicle Info
   - ❌ Photo uploads (vehicle/license)
4. Tap "Next"

**Expected Result**: Only rider fields visible, can proceed ✅  
**Failure**: 
- Driver fields mixed in → Role logic broken
- Fields not showing → Conditional rendering broken
- Error on validation → Validation logic broken

---

### 2.5 Driver Information (Step 3 - Driver)
**Steps**:
1. **Driver** workflow: Complete Steps 1-2
2. **Step 3** should show driver-specific fields:
   - Bank Name: "GTBank"
   - Bank Account Number: "0123456789"
   - Vehicle Type: "Keke NAPEP" (dropdown or select)
   - Plate Number: "ABC123XY"
   - Union Name: "Lagos Keke Union"
   - Vehicle Photo: (tap to upload from gallery)
   - License Photo: (tap to upload from gallery)
3. Should **NOT** see rider fields:
   - ❌ Emergency Contact
   - ❌ Referral Code
4. Tap "Next"

**Expected Result**: Only driver fields visible, can proceed ✅  
**Failure**: This is the CRITICAL TEST
- If rider fields showing instead → Role logic completely broken
- If no fields at all → Step 3 not rendering
- If mixed fields → Conditional rendering broken
- If photos don't upload → File handling broken

---

### 2.6 Password Setup (Step 4)
**Steps**:
1. **Step 4** should show password fields (same for both roles):
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
2. Should see password strength indicator
3. Fill in passwords matching
4. Tap "Sign Up"

**Expected Result**: Accepts passwords and proceeds to final submission ✅  
**Failure**: Validation error or password not matching → Password logic broken

---

## 3. Backend Communication Testing

### 3.1 API Endpoint Validation
**Steps**:
1. Complete signup form as **Rider**
2. Tap "Sign Up" button
3. **Monitor network traffic** (use device developer tools or network inspection)

**Expected Request**:
- **URL**: `https://charterkeke.vercel.app/api/auth/register`
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Fields**:
  - ✅ firstName, lastName, email, phone, dob, gender, password
  - ✅ role: "rider"
  - ✅ emergencyContactName, emergencyContactPhone
  - ❌ NOT driver fields (bank, vehicle, photos)

**Expected Result**: Request sent successfully ✅  
**Failure**: 
- Wrong URL → API not updated
- Not FormData → Data format wrong
- Missing fields → FormData construction broken
- Wrong role value → Role not sent correctly

---

### 3.2 Success Response (Rider)
**Steps**:
1. Complete from 3.1 above
2. **Wait for response** (may take 5-10 seconds)
3. Check for success message

**Expected**:
- User is created in backend
- Backend returns JWT token
- App redirects to `/rider/home` (or appropriate rider screen)
- No errors in console

**Success Indicators**:
- ✅ Success message: "Account created successfully"
- ✅ Smooth redirect to rider home
- ✅ Can see rider dashboard with welcome message

**Failure**:
- ❌ Error message: "Email already exists"
- ❌ Error: "Invalid request format"
- ❌ Timeout (network not reaching backend)
- ❌ 500 server error

---

### 3.3 Driver Signup with Photos
**Steps**:
1. Complete signup form as **Driver**
2. Upload both vehicle and license photos
3. Tap "Sign Up"
4. **Monitor network** and **wait for response**

**Expected**:
- Request includes photo files
- All driver fields in FormData:
  ```
  firstName, lastName, email, phone, dob, gender, password
  role: "driver"
  bankName, bankAccountNumber, vehicleType, plateNumber, unionName
  vehicleImage: (file)
  licenseImage: (file)
  profileImage: (file)
  ```
- Backend creates user + driver record
- App redirects to `/driver/home`

**Success Indicators**:
- ✅ Photos upload without hanging
- ✅ Request completes in <30 seconds
- ✅ App redirects to driver home
- ✅ No file upload errors

**Failure**:
- ❌ Request timeout (files too large or no compression)
- ❌ 413 error (payload too large)
- ❌ Files not uploading to backend
- ❌ Missing photo validation error

---

### 3.4 Error Handling (Duplicate Email)
**Steps**:
1. Complete signup **Rider** with test email
2. Submit successfully (wait for confirmation)
3. Return to signup and try same email again
4. Attempt to submit

**Expected**: Error response with message "Email already exists" ✅  
**Failure**: Allows duplicate or generic error → Backend validation not working

---

### 3.5 Error Handling (Network Failure)
**Steps**:
1. Put app in **Airplane Mode**
2. Try to submit signup form
3. Wait for response

**Expected**: Network error message after ~5-10 seconds ✅  
**Failure**: Hangs indefinitely or crashes → No timeout handling

---

## 4. Integration Testing

### 4.1 Full Rider Flow
**Steps**:
1. **Step 1**: Select Rider ✅
2. **Step 2**: Fill basic info ✅
3. **Step 3**: Fill emergency contact ✅
4. **Step 4**: Set password ✅
5. Submit → Success ✅
6. Redirected to rider home ✅

**Expected Result**: All 5 steps work without errors ✅

---

### 4.2 Full Driver Flow
**Steps**:
1. **Step 1**: Select Driver ✅
2. **Step 2**: Fill basic info ✅
3. **Step 3**: Fill driver info + upload photos ✅
4. **Step 4**: Set password ✅
5. Submit → Success ✅
6. Redirected to driver home ✅

**Expected Result**: All 5 steps work, photos upload correctly ✅

---

## 5. Critical Tests Summary

| Test | Status | Notes |
|------|--------|-------|
| Theme toggle visible | ⬜ | Top-right corner button |
| Light mode colors correct | ⬜ | Black text on white |
| Dark mode colors correct | ⬜ | White text on black |
| Theme persists | ⬜ | After app close/restart |
| **Rider Step 3 shows emergency contact** | ⬜ | **CRITICAL** |
| **Driver Step 3 shows driver fields** | ⬜ | **CRITICAL** |
| **Driver photos upload** | ⬜ | **CRITICAL** |
| **No mixed fields** | ⬜ | **CRITICAL - No rider fields in driver signup** |
| API URL correct | ⬜ | Should be charterkeke.vercel.app/api |
| FormData format correct | ⬜ | Role-specific fields only |
| Backend receives signup | ⬜ | User created in database |
| Redirect to home works | ⬜ | After success |
| Error handling works | ⬜ | Shows error messages properly |

---

## Test Results

### Date: _______________

### Environment
- Mobile Platform: ☐ iOS  ☐ Android  ☐ Web
- Emulator/Device: _______________________
- OS Version: _______________________

### Theme System
- Theme toggle visible: ☐ Yes  ☐ No
- Light mode colors correct: ☐ Yes  ☐ No
- Dark mode colors correct: ☐ Yes  ☐ No
- Theme persistence working: ☐ Yes  ☐ No

### Form Fields (Rider)
- Rider role selection works: ☐ Yes  ☐ No
- Step 2 fields populate: ☐ Yes  ☐ No
- Emergency contact fields visible: ☐ Yes  ☐ No
- NO driver fields shown: ☐ Yes  ☐ No

### Form Fields (Driver)
- Driver role selection works: ☐ Yes  ☐ No
- Step 2 fields populate: ☐ Yes  ☐ No
- **Driver fields visible**: ☐ Yes  ☐ No **CRITICAL**
- Vehicle photo uploads: ☐ Yes  ☐ No
- License photo uploads: ☐ Yes  ☐ No
- NO rider fields shown: ☐ Yes  ☐ No

### Backend Integration
- API endpoint called: ☐ https://charterkeke.vercel.app/api/auth/register
- Request format: ☐ multipart/form-data
- Rider signup success: ☐ Yes  ☐ No
- Driver signup success: ☐ Yes  ☐ No
- Error handling works: ☐ Yes  ☐ No
- Redirects to home: ☐ Yes  ☐ No

---

## Issues Found

### Issue 1: ___________________________
- **Severity**: ☐ Critical  ☐ Major  ☐ Minor
- **Description**: 
- **Steps to Reproduce**: 
- **Environment**: Platform: _______, OS: _______

### Issue 2: ___________________________
- **Severity**: ☐ Critical  ☐ Major  ☐ Minor
- **Description**: 
- **Steps to Reproduce**: 
- **Environment**: Platform: _______, OS: _______

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | _____________ | _______ | _____ |
| QA/Tester | _____________ | _______ | _____ |
| Product | _____________ | _______ | _____ |

---

## Notes

- **If Theme Not Working**: Check if `ThemeProvider` wraps all screens in `app/_layout.tsx`
- **If Driver Fields Not Showing**: Check Step 3 conditional rendering in `app/auth/signup-new.tsx` (line ~450)
- **If Photos Not Uploading**: Check file permissions and size limits (max 10MB)
- **If API Calls Fail**: Verify backend is running and accessible; check CORS settings
- **For Debugging**: Enable console logs in `DEBUG=true` in `.env.local`

---

**Generated**: February 9, 2026  
**For**: Charter Keke Mobile App v1.0 Launch
