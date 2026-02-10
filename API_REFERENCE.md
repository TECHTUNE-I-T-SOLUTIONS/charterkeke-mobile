# Charter Keke Mobile App - API Reference

Complete reference of all backend API endpoints available for the mobile app.

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.charter.test/api
Staging: https://staging-api.charter.test/api
```

Configure in `.env.local`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## Authentication

### Headers

All authenticated requests must include:

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
X-Device-ID: {device-id}        # Optional, recommended for tracking
```

### Token Refresh

Tokens expire after 24 hours. The API service automatically refreshes tokens:

```javascript
// Automatic in apiService.ts - No manual handling needed
// Old token → 401 Response → Refresh token → Retry request
```

## Endpoints Reference

### Authentication Endpoints

#### 1. Login
```
POST /auth/login
```

**Request:**
```json
{
  "email": "rider@charter.test",
  "password": "Charter123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "rider@charter.test",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+2348012345678",
      "userType": "rider",
      "profileImage": "url",
      "isVerified": true,
      "rating": 4.8,
      "totalRides": 42,
      "walletBalance": 5000
    },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 86400
  }
}
```

**Errors:**
- `401`: Invalid credentials
- `404`: User not found
- `429`: Too many attempts (rate limited)

---

#### 2. Signup
```
POST /auth/signup
```

**Request:**
```json
{
  "email": "newuser@charter.test",
  "password": "Charter123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+2348012345679",
  "userType": "rider"  // or "driver"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "User created successfully"
}
```

**Errors:**
- `400`: Validation error (invalid email, weak password, etc.)
- `409`: Email already exists
- `422`: Invalid request data

---

#### 3. Verify OTP
```
POST /auth/verify-otp
```

**Request:**
```json
{
  "email": "newuser@charter.test",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isVerified": true,
    "token": "eyJhbGc..."
  }
}
```

---

#### 4. Resend OTP
```
POST /auth/resend-otp
```

**Request:**
```json
{
  "email": "newuser@charter.test"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

---

#### 5. Reset Password
```
POST /auth/reset-password
```

**Request:**
```json
{
  "email": "rider@charter.test",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

#### 6. Logout
```
POST /auth/logout
```

**Headers:** Include Authorization token

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### User Endpoints

#### 7. Get Current User
```
GET /users/me
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* user object */ }
}
```

---

#### 8. Update User Profile
```
PUT /users/profile
```

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+2348012345678",
  "profileImage": "base64 or url",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "address": "123 Main St, Lagos"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated user object */ }
}
```

---

#### 9. Upload Profile Image
```
POST /users/profile-image
Content-Type: multipart/form-data
```

**Request:**
```
File: profile-image.jpg (max 5MB)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://cdn.charter.test/images/user-id/profile.jpg"
  }
}
```

---

### Ride Endpoints

#### 10. Create Ride Request
```
POST /rides
```

**Request:**
```json
{
  "pickupLocation": {
    "latitude": 6.6271,
    "longitude": 3.0829,
    "address": "Ikoyi, Lagos",
    "placeId": "ChIJQbL..."
  },
  "dropoffLocation": {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "address": "VI, Lagos",
    "placeId": "ChIJQbL..."
  },
  "rideType": "keke",      // "keke", "bike", "car"
  "scheduledTime": null,    // null for immediate, or timestamp for scheduled
  "estimatedFare": 2500,
  "estimatedDistance": 12.5,
  "estimatedDuration": 25,
  "notes": "Please ring bell"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "ride-uuid",
    "rider": { /* rider object */ },
    "pickupLocation": { /* location */ },
    "dropoffLocation": { /* location */ },
    "status": "pending",      // pending → accepted → active → completed
    "rideType": "keke",
    "estimatedFare": 2500,
    "createdAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-01-15T10:35:00Z"
  }
}
```

**Errors:**
- `400`: Invalid locations or ride type
- `422`: Locations too close (minimum distance required)

---

#### 11. Cancel Ride
```
POST /rides/{rideId}/cancel
```

**Request:**
```json
{
  "reason": "Driver not coming",  // user-facing reason
  "cancellationReason": "no_driver_accepted"  // internal code
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ride-uuid",
    "status": "cancelled",
    "cancelledAt": "2024-01-15T10:31:00Z",
    "cancellationFee": 0
  }
}
```

---

#### 12. Get Ride Details
```
GET /rides/{rideId}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* ride object with all details */ }
}
```

---

#### 13. Get Ride History
```
GET /rides/history?status=completed&limit=20&offset=0
```

**Query Parameters:**
- `status`: pending, accepted, active, completed, cancelled (optional)
- `limit`: max results (default: 20, max: 100)
- `offset`: pagination offset (default: 0)
- `dateFrom`: YYYY-MM-DD (optional)
- `dateTo`: YYYY-MM-DD (optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rides": [ /* array of ride objects */ ],
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### 14. Get Active Ride
```
GET /rides/active
```

**Response (200) - Ride in progress:**
```json
{
  "success": true,
  "data": { /* active ride object */ }
}
```

**Response (204) - No active ride:**
```
(Empty response)
```

---

#### 15. Rate Ride
```
POST /rides/{rideId}/rating
```

**Request:**
```json
{
  "rating": 5,                           // 1-5 stars
  "review": "Great driver, clean car",   // optional
  "tags": ["clean", "professional"]      // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rideId": "ride-uuid",
    "rating": 5,
    "review": "Great driver",
    "createdAt": "2024-01-15T11:15:00Z"
  }
}
```

---

### Driver Endpoints

#### 16. Accept Ride
```
POST /rides/{rideId}/accept
```

**Request:**
```json
{
  "driverId": "driver-uuid"  // optional, current user if not provided
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ride-uuid",
    "status": "accepted",
    "driver": { /* driver object */ },
    "acceptedAt": "2024-01-15T10:32:00Z"
  }
}
```

**Errors:**
- `409`: Already accepted by another driver
- `410`: Ride expired/cancelled

---

#### 17. Start Ride
```
POST /rides/{rideId}/start
```

**Request:**
```json
{
  "currentLocation": {
    "latitude": 6.6271,
    "longitude": 3.0829,
    "accuracy": 10
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ride-uuid",
    "status": "active",
    "startedAt": "2024-01-15T10:35:00Z"
  }
}
```

---

#### 18. Update Driver Location
```
POST /rides/{rideId}/location
```

**Request (sent every 10 seconds):**
```json
{
  "latitude": 6.6271,
  "longitude": 3.0829,
  "accuracy": 10,
  "speed": 45,
  "heading": 180
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "locationUpdated": true,
    "distanceToPickup": 2.5,  // km
    "estimatedArrival": 8     // seconds
  }
}
```

---

#### 19. Complete Ride
```
POST /rides/{rideId}/complete
```

**Request:**
```json
{
  "finalDistance": 12.5,     // actual km traveled
  "finalFare": 2750,         // actual fare charged
  "paymentMethod": "wallet", // "wallet", "cash", "card"
  "currentLocation": {
    "latitude": 6.5244,
    "longitude": 3.3792
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ride-uuid",
    "status": "completed",
    "finalFare": 2750,
    "driverEarnings": 2200,    // 20% commission
    "completedAt": "2024-01-15T11:05:00Z",
    "paymentId": "txn-uuid"
  }
}
```

---

#### 20. Get Available Rides
```
GET /rides/available?latitude=6.6271&longitude=3.0829&radiusKm=5
```

**Query Parameters:**
- `latitude`: Driver current latitude (required)
- `longitude`: Driver current longitude (required)
- `radiusKm`: Search radius in kilometers (default: 5, max: 15)
- `rideType`: Filter by type - "keke", "bike", "car" (optional)
- `limit`: max results (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rides": [
      {
        "id": "ride-uuid",
        "rider": { /* rider preview */ },
        "pickupLocation": { /* location */ },
        "dropoffLocation": { /* location */ },
        "estimatedFare": 2500,
        "distanceFromYou": 1.2,  // km
        "estimatedPickupTime": 5 // minutes
      }
    ],
    "total": 3
  }
}
```

---

#### 21. Go Online
```
POST /drivers/online
```

**Request:**
```json
{
  "currentLocation": {
    "latitude": 6.6271,
    "longitude": 3.0829
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isOnline": true,
    "onlineAt": "2024-01-15T10:00:00Z"
  }
}
```

---

#### 22. Go Offline
```
POST /drivers/offline
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isOnline": false,
    "offlineAt": "2024-01-15T11:30:00Z"
  }
}
```

---

#### 23. Get Driver Stats
```
GET /drivers/stats/today
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "onlineHours": 3.5,
    "completedRides": 5,
    "totalEarnings": 11000,
    "averageRating": 4.7,
    "totalRatings": 42,
    "cancellationRate": 0.02
  }
}
```

---

#### 24. Get Driver Earnings
```
GET /drivers/earnings?dateFrom=2024-01-01&dateTo=2024-01-31
```

**Query Parameters:**
- `dateFrom`: YYYY-MM-DD (required)
- `dateTo`: YYYY-MM-DD (required)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "periodEarnings": 55000,
    "breakdown": {
      "totalFares": 56000,
      "commission": -11200,        // 20% commission
      "bonuses": 5000,
      "penalties": -500
    },
    "dailyBreakdown": [
      {
        "date": "2024-01-15",
        "earning": 2750,
        "ridesCompleted": 5
      }
    ]
  }
}
```

---

### Location Endpoints

#### 25. Geocode Address
```
GET /location/geocode?address=Ikoyi,+Lagos
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "latitude": 6.6271,
    "longitude": 3.0829,
    "placeId": "ChIJQbL...",
    "formattedAddress": "Ikoyi, Lagos, Nigeria"
  }
}
```

---

#### 26. Reverse Geocode
```
GET /location/reverse?latitude=6.6271&longitude=3.0829
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "address": "15 Bourdillon Road, Ikoyi, Lagos",
    "placeId": "ChIJQbL...",
    "components": {
      "street": "15 Bourdillon Road",
      "neighborhood": "Ikoyi",
      "city": "Lagos",
      "state": "Lagos State",
      "country": "Nigeria"
    }
  }
}
```

---

#### 27. Get Route
```
GET /location/route?fromLat=6.6271&fromLon=3.0829&toLat=6.5244&toLon=3.3792
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "distance": 12.5,      // km
    "duration": 25,        // minutes at normal speed
    "polyline": "encoded-polyline-string",
    "waypoints": [
      { "latitude": 6.62, "longitude": 3.08 },
      { "latitude": 6.61, "longitude": 3.10 }
    ]
  }
}
```

---

### Wallet & Payment Endpoints

#### 28. Get Wallet Balance
```
GET /wallet/balance
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "balance": 15000,
    "currency": "NGN",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

---

#### 29. Get Transaction History
```
GET /wallet/transactions?limit=20&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn-uuid",
        "type": "ride_payment",    // ride_payment, topup, withdrawal, bonus
        "amount": -2500,
        "balance": 12500,
        "rideId": "ride-uuid",
        "description": "Ride to Ikoyi",
        "createdAt": "2024-01-15T11:05:00Z"
      }
    ],
    "total": 42,
    "limit": 20
  }
}
```

---

#### 30. Add Wallet Funds
```
POST /wallet/topup
```

**Request:**
```json
{
  "amount": 5000,
  "paymentMethod": "paystack",  // "paystack", "bank_transfer"
  "reference": "ref-123456"     // Paystack reference
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn-uuid",
    "amount": 5000,
    "newBalance": 20000,
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### 31. Request Withdrawal
```
POST /wallet/withdraw
```

**Request:**
```json
{
  "amount": 5000,
  "bankAccountId": "account-uuid"  // previously saved account
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "withdrawalId": "withdraw-uuid",
    "amount": 5000,
    "status": "pending",
    "estimatedTime": "24 hours",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### 32. Add Bank Account
```
POST /wallet/bank-accounts
```

**Request:**
```json
{
  "accountNumber": "1234567890",
  "bankCode": "007",        // CBN bank code
  "accountName": "John Doe",
  "isPrimary": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "accountId": "account-uuid",
    "lastDigits": "7890",
    "bankName": "Access Bank",
    "isPrimary": true
  }
}
```

---

### Notification Endpoints

#### 33. Register Device
```
POST /notifications/register-device
```

**Request:**
```json
{
  "deviceId": "device-uuid",
  "platform": "android",    // "android" or "ios"
  "token": "expo-push-token",
  "version": "1.0.0"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "registered": true
  }
}
```

---

#### 34. Unregister Device
```
POST /notifications/unregister-device
```

**Request:**
```json
{
  "deviceId": "device-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unregistered": true
  }
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "statusCode": 400,
    "details": {
      "field": "email",
      "reason": "Email must be valid"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| VALIDATION_ERROR | 400 | Invalid request data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| TOO_MANY_REQUESTS | 429 | Rate limited |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

- **Default:** 100 requests per minute per user
- **Auth Endpoints:** 5 attempts per 15 minutes (email)
- **Location Endpoints:** 1000 requests per hour

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705334400
```

---

## Pagination

All list endpoints support pagination:

```javascript
// Query parameters
?limit=20&offset=0

// Response includes:
{
  "data": [ /* items */ ],
  "total": 100,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

---

## Filtering & Search

Example with multiple filters:

```
GET /rides?status=completed&rideType=keke&dateFrom=2024-01-01&limit=50
```

---

## Caching Headers

Responses include caching hints:

```
Cache-Control: public, max-age=300          // Cache for 5 minutes
ETag: "33a64df551425fcc55e4d42a148795d9f"
Last-Modified: Mon, 15 Jan 2024 10:30:00 GMT
```

---

## Example Usage in Code

```typescript
// services/api.ts already handles all of this!

// Make authenticated request
const response = await apiService.post('/rides', {
  pickupLocation: { /* ... */ },
  dropoffLocation: { /* ... */ }
});

// Automatic token refresh on 401
// Automatic retry on network error
// Response normalized to APIResponse type
```

---

**Last Updated:** January 2024
**API Version:** v1
**Total Endpoints:** 34

For more details, see the Charter Keke backend repository documentation.
