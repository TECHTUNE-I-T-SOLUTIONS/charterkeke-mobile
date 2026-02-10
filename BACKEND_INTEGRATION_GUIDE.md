# Charter Keke Mobile App - Backend Integration Guide

## API Endpoint Expectations

### Registration Endpoint
**URL**: `POST /api/auth/register`  
**Content-Type**: `multipart/form-data`

## Request Payload

### Common Fields (All Roles)
```
firstName: string (required)
lastName: string (required)
email: string (required, valid email format)
phone: string (required, 11+ digits with +234 prefix)
dob: string (required, format: DD/MM/YYYY)
gender: string (required, values: "male" | "female" | "other")
password: string (required, minimum 8 characters)
role: string (required, values: "rider" | "driver")
profileImage: File (required, image file)
```

### Rider-Specific Fields
```
emergencyContactName: string (required)
emergencyContactPhone: string (required, 11+ digits)
referralCode: string (optional)
```

### Driver-Specific Fields
```
bankName: string (required)
bankAccountNumber: string (required, 10+ digits)
vehicleType: string (required, e.g., "Keke NAPEP", "Marwa")
plateNumber: string (required, e.g., "ABC123")
unionName: string (required, union/cooperative name)
vehicleImage: File (required, image file)
licenseImage: File (required, image file)
```

## Example CURL Request (Rider)

```bash
curl -X POST https://charterkeke.vercel.app/api/auth/register \
  -F "firstName=John" \
  -F "lastName=Doe" \
  -F "email=john@example.com" \
  -F "phone=+2348012345678" \
  -F "dob=15/01/1990" \
  -F "gender=male" \
  -F "password=SecurePass123!" \
  -F "role=rider" \
  -F "profileImage=@/path/to/profile.jpg" \
  -F "emergencyContactName=Jane Doe" \
  -F "emergencyContactPhone=+2348087654321" \
  -F "referralCode=REF123ABC"
```

## Example CURL Request (Driver)

```bash
curl -X POST https://charterkeke.vercel.app/api/auth/register \
  -F "firstName=Ahmed" \
  -F "lastName=Mohammed" \
  -F "email=ahmed@example.com" \
  -F "phone=+2349012345678" \
  -F "dob=20/03/1985" \
  -F "gender=male" \
  -F "password=SecurePass456!" \
  -F "role=driver" \
  -F "profileImage=@/path/to/profile.jpg" \
  -F "bankName=GTBank" \
  -F "bankAccountNumber=0123456789" \
  -F "vehicleType=Keke NAPEP" \
  -F "plateNumber=ABC123XY" \
  -F "unionName=Lagos Keke Union" \
  -F "vehicleImage=@/path/to/vehicle.jpg" \
  -F "licenseImage=@/path/to/license.jpg"
```

## Expected Response

### Success (Status 200/201)
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "phone": "+2348012345678",
    "firstName": "John",
    "lastName": "Doe",
    "role": "rider",
    "profilePictureUrl": "https://...",
    "verified": false
  },
  "token": "jwt-token-here",
  "message": "Account created successfully"
}
```

### Error Response (Status 400/422)
```json
{
  "success": false,
  "error": "Email already exists",
  "message": "User registration failed"
}
```

## Implementation Checklist

### Backend Requirements

- [ ] Accept FormData with multipart/form-data content type
- [ ] Validate all required fields are present
- [ ] Validate email format and uniqueness
- [ ] Validate phone format (11+ digits)
- [ ] Validate password strength (8+ characters)
- [ ] Hash password before storing
- [ ] Store profile image to storage service
- [ ] For drivers:
  - [ ] Store vehicle image to storage service
  - [ ] Store license image to storage service
  - [ ] Create driver record linked to user_id
  - [ ] Set driver.verified = false initially (admin verifies)
  - [ ] Validate vehicle plate number format
- [ ] For riders:
  - [ ] Store emergency contact info in user table
  - [ ] If referral code provided, validate and apply rewards
- [ ] Create auth token/session
- [ ] Return user object and token

### Validation Rules

```
firstName/lastName:
- Minimum 2 characters
- Maximum 50 characters
- No special characters

Email:
- Must be valid format
- Must be unique in users table

Phone:
- 11-15 digits
- With +234 prefix for Nigeria

Password:
- Minimum 8 characters
- Should contain uppercase, number, special character

Date of Birth:
- Must be valid date
- User must be 18+

Bank Account Number:
- 10+ digits
- Numeric only

Vehicle Plate Plate:
- Alphanumeric
- 6-10 characters

File Uploads:
- profileImage: JPEG, PNG, WebP (max 5MB)
- vehicleImage: JPEG, PNG (max 10MB)
- licenseImage: JPEG, PNG (max 10MB)
```

## Flow After Successful Registration

### Rider Flow
1. User created in `users` table
2. User record includes emergency contact info
3. Referral code validated (if provided)
4. Auth token generated
5. Mobile app redirects to `/rider/home`

### Driver Flow
1. User created in `users` table with role='driver'
2. Driver record created in `drivers` table:
   - Links to user_id
   - Stores vehicle_type, plate_number, union_name
   - Stores vehicle_picture_url, license_picture_url
   - Sets verified=false (awaiting admin approval)
   - Sets total_rides_completed=0
   - Sets average_rating=0
3. Banking info stored in drivers table
4. Photos uploaded to storage
5. Auth token generated
6. Mobile app redirects to `/driver/home`
7. Driver sees pending verification message

## Mobile App Side

### What the app sends:
- ✅ Role detection (rider/driver) based on user selection
- ✅ Conditional fields based on role
- ✅ FormData with proper field names
- ✅ File uploads with correct MIME types
- ✅ Phone number with +234 prefix
- ✅ All required validations before submission

### What the app expects:
- ✅ Success response with user object
- ✅ JWT token for future authenticated requests
- ✅ Correct status codes (201 for create, 400 for errors)
- ✅ Meaningful error messages

## Testing Guide

### Test Rider Registration
1. Fill form with rider role
2. No driver fields should appear
3. Submit with test data
4. Verify `users` table has new record
5. Verify `role='rider'` in users table
6. Verify emergency contact info present
7. Verify phone and email accessible

### Test Driver Registration
1. Fill form with driver role
2. Driver fields mandatory
3. Upload both vehicle and license photos
4. Submit with test data
5. Verify `users` table created
6. Verify `drivers` table linked to user_id
7. Verify photos uploaded to storage
8. Verify vehicle_type, plate_number, union_name, bank_name, bank_account stored
9. Verify verified=false initially
10. Verify admin can approve in admin panel

### Test Error Scenarios
1. Duplicate email → error response
2. Invalid phone → error response
3. Missing required fields → error response
4. Weak password → error response
5. Driver without photos → error response
6. File upload failure → error response

## Database Schema Alignment

### Users Table (CREATE USER)
```sql
CREATE users AS (
  id: UUID PRIMARY KEY,
  first_name: VARCHAR,
  last_name: VARCHAR,
  email: VARCHAR UNIQUE,
  phone_number: VARCHAR,
  password_hash: VARCHAR,
  dob: DATE,
  gender: VARCHAR,
  profile_picture_url: VARCHAR,
  role: ENUM('rider', 'driver', 'admin'),
  emergency_contact: VARCHAR,  -- Rider only
  emergency_phone: VARCHAR,     -- Rider only
  status: VARCHAR,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### Drivers Table (CREATE DRIVER-specific)
```sql
CREATE drivers AS (
  id: UUID PRIMARY KEY,
  user_id: UUID FOREIGN KEY,
  vehicle_type: VARCHAR,
  plate_number: VARCHAR,
  union_name: VARCHAR,
  bank_name: VARCHAR,
  bank_account_number: VARCHAR,
  vehicle_picture_url: VARCHAR,
  license_picture_url: VARCHAR,
  verified: BOOLEAN DEFAULT false,
  total_rides_completed: INTEGER DEFAULT 0,
  average_rating: DECIMAL DEFAULT 0,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

## Common Issues & Solutions

### Issue: FormData fields not received
**Solution**: Ensure Content-Type header is NOT set explicitly (let browser/client set it)

### Issue: File uploads fail
**Solution**: 
- Check file size limits
- Verify MIME type matching
- Check storage service permissions
- Verify file path is accessible

### Issue: Driver record not created
**Solution**:
- Verify user_id foreign key constraint
- Check drivers table has correct columns
- Verify transaction commits properly

### Issue: Phone number validation fails
**Solution**:
- Ensure +234 prefix included
- Accept 11+ digit format
- Strip spaces/dashes before validation

## Performance Considerations

1. **ProfileImage**: 5MB max - compress before sending
2. **VehicleImage**: 10MB max - compress before sending  
3. **LicenseImage**: 10MB max - compress before sending
4. **Total upload**: ~25MB per registration
5. Recommend: Chunked upload for slow connections
6. Timeout: 30-60 seconds for file uploads

## Security Considerations

1. ✅ Use HTTPS only
2. ✅ Validate file types (whitelist extensions)
3. ✅ Scan uploaded files for malware
4. ✅ Hash password with bcryptstrong algorithm
5. ✅ Rate limit registration endpoint
6. ✅ Store photos in secure bucket (not public)
7. ✅ Generate unique filenames (don't use user input)
8. ✅ Validate all inputs server-side

---

**Last Updated**: February 9, 2026  
**Mobile App Version**: 1.0 with Theme Support
