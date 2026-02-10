# Charter Keke Mobile App - Project Plan

## 🎯 Project Overview
Professional mobile application for the Charter Keke tricycle ride-sharing platform using React Native & Expo.

### Tech Stack
- **Framework**: React Native + Expo
- **Styling**: Native Wind (Tailwind for React Native)
- **Maps**: react-native-maps with OpenStreetMap tiles
- **State Management**: React Context + AsyncStorage
- **Storage**: AsyncStorage for caching, sync to backend
- **Authentication**: JWT with secure token storage
- **API**: Axios with interceptors
- **Push Notifications**: Expo Notifications
- **Location**: Expo Location + background tracking
- **UI Icons**: React Native Vector Icons

---

## 📱 Screen Architecture

### Authentication Flows
```
├── Onboarding
│   ├── Welcome Screen
│   ├── User Type Selection (Rider/Driver)
│   └── Signup/Login
├── Rider Auth
│   ├── Signup
│   ├── Phone Verification (OTP)
│   ├── Profile Completion
│   └── Login
└── Driver Auth
    ├── Signup
    ├── Phone Verification (OTP)
    ├── KYC/Document Upload
    ├── Profile Completion
    └── Login
```

### Rider Screens
```
├── Home (Booking)
├── Map View
├── Booking Details
├── Active Ride
├── Ride History
├── Profile
├── Wallet
├── Reviews & Ratings
└── Settings
```

### Driver Screens
```
├── Home (Availability)
├── Map View
├── Available Rides
├── Active Ride
├── Earnings
├── Profile
├── Wallet
├── Ratings
└── Settings
```

### Admin Screen (Basic)
```
└── Dashboard Stats
```

---

## 🎨 Design System

### Color Palette
(From Charter Keke Web App)
**Light Mode:**
- Primary: #1a1a1a (oklch(0.205 0 0))
- Secondary: #f5f5f5 (oklch(0.97 0 0))
- Accent: #f5f5f5 
- Destructive: Red
- Background: #ffffff
- Foreground: #1a1a1a
- Border: #ededf0

**Dark Mode:**
- Primary: #ffffff
- Secondary: #262626 (oklch(0.269 0 0))
- Accent: #262626
- Background: #1a1a1a
- Foreground: #ffffff
- Border: #262626

### Typography
- Font: Inter (system default)
- Sizes: 12, 14, 16, 18, 20, 24, 28, 32px
- Weights: 400, 500, 600, 700

### Spacing System
- Base: 4px
- 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px

---

## 🔄 Data Flow & Caching Strategy

### Cache Storage Priorities
1. **Immediate Cache**: AsyncStorage
   - Auth tokens
   - User profile
   - Recent rides
   - Location history

2. **Sync Strategy**:
   - Automatic sync on app open
   - Sync on active ride changes
   - Periodic sync every 5 minutes
   - Sync when device comes online

3. **Conflict Resolution**:
   - Server data takes precedence
   - Local changes merged with timestamps
   - Retry queue for failed requests

---

## 🗂️ Folder Structure

```
charter-keke-mobile/
├── app/
│   ├── auth/
│   │   ├── onboarding/
│   │   ├── login/
│   │   └── signup/
│   ├── rider/
│   │   ├── home/
│   │   ├── booking/
│   │   ├── active-ride/
│   │   ├── history/
│   │   └── profile/
│   ├── driver/
│   │   ├── home/
│   │   ├── available-rides/
│   │   ├── active-ride/
│   │   └── earnings/
│   └── _layout.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── auth/
│   ├── map/
│   ├── ride/
│   └── common/
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── location.ts
│   ├── cache.ts
│   └── sync.ts
├── hooks/
│   ├── useLocation.ts
│   ├── useAuth.ts
│   ├── useRide.ts
│   └── useCache.ts
├── context/
│   ├── AuthContext.tsx
│   ├── LocationContext.tsx
│   └── RideContext.tsx
├── types/
│   ├── index.ts
│   ├── api.ts
│   ├── ride.ts
│   └── user.ts
├── utils/
│   ├── colors.ts
│   ├── formatting.ts
│   ├── validation.ts
│   └── constants.ts
├── assets/
│   ├── images/
│   ├── logos/
│   └── icons/
├── app.json
├── eas.json
├── app.tsx
├── package.json
└── tsconfig.json
```

---

## 📡 API Endpoints Required

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Riders
- `GET /api/riders/profile` - Get rider profile
- `POST /api/riders/profile` - Update profile
- `GET /api/riders/rides` - Get ride history
- `POST /api/rides` - Create booking
- `GET /api/rides/:id` - Get ride details
- `PUT /api/rides/:id` - Update ride status

### Drivers
- `GET /api/drivers/profile` - Get driver profile
- `POST /api/drivers/profile` - Update profile
- `GET /api/drivers/availability` - Get availability
- `PUT /api/drivers/availability` - Update availability
- `GET /api/drivers/rides` - Get available rides
- `PUT /api/drivers/rides/:id` - Accept ride

### Location
- `POST /api/ride-location` - Post location update
- `GET /api/ride-location/:id` - Get live location

### Wallet
- `GET /api/wallet` - Get wallet balance
- `GET /api/wallet/transactions` - Get transactions

---

## 🚀 Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Project setup
- [ ] Design system & UI components
- [ ] Authentication flow
- [ ] Local storage setup

### Phase 2: Core Features (Week 2-3)
- [ ] Maps integration
- [ ] Rider booking flow
- [ ] Driver acceptance flow
- [ ] Live ride tracking

### Phase 3: Advanced (Week 4)
- [ ] Location caching & sync
- [ ] Notifications
- [ ] Wallet & payments
- [ ] Ratings & reviews

### Phase 4: QA & Polish (Week 5)
- [ ] Testing on various devices
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Final deployment

---

## 📝 Notes

- All API endpoints will use the existing backend from the web app
- Logos and assets will be copied from the web app
- Same database and API authentication
- Professional animations and transitions
- Full offline support with cache-first strategy
- Responsive designs for all phone sizes (4.5" - 6.7"+)

