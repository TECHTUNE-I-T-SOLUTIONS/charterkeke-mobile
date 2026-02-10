# Charter Keke - Developer Quick Reference Guide

## Quick Start for Developers

### Initial Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm expo start

# Android development
pnpm android

# iOS development
pnpm ios
```

## Current Project Structure

```
charter-keke-mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx          # Email/password login
│   │   ├── signup.tsx         # New user registration
│   │   ├── onboarding.tsx     # First-time carousel (NEW)
│   │   ├── reset-password.tsx # 3-step password reset (NEW)
│   │   ├── otp-verification.tsx
│   │   ├── profile-completion.tsx
│   │   └── _layout.tsx        # Auth navigation
│   │
│   ├── (rider)/
│   │   ├── home.tsx
│   │   ├── booking.tsx
│   │   ├── active-ride.tsx
│   │   ├── history.tsx
│   │   ├── profile.tsx
│   │   └── _layout.tsx
│   │
│   ├── (driver)/
│   │   ├── home.tsx
│   │   ├── earnings.tsx
│   │   ├── documents.tsx
│   │   ├── rating.tsx
│   │   ├── profile.tsx
│   │   └── _layout.tsx
│   │
│   ├── splash.tsx             # Splash screen
│   └── _layout.tsx            # Root navigation (UPDATED)
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── OTPVerification.tsx
│   │
│   ├── media/
│   │   └── VideoPlayer.tsx    # NEW: Video playback
│   │
│   ├── maps/
│   │   └── MapComponent.tsx
│   │
│   ├── ride/
│   │   ├── RideRequest.tsx
│   │   ├── ActiveRide.tsx
│   │   └── RideHistory.tsx
│   │
│   └── common/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Modal.tsx
│
├── services/
│   ├── api/
│   │   ├── auth.ts
│   │   ├── rides.ts
│   │   ├── payments.ts
│   │   └── locations.ts
│   │
│   └── storage/
│       └── asyncStorage.ts
│
├── context/
│   ├── AuthContext.tsx
│   ├── RideContext.tsx
│   └── LocationContext.tsx
│
├── utils/
│   ├── colors.ts
│   ├── constants.ts
│   ├── validators.ts
│   └── formatting.ts
│
├── types/
│   ├── index.ts
│   ├── auth.ts
│   ├── ride.ts
│   └── user.ts
│
├── assets/
│   ├── charter keke.png           # Logo (USED in splash)
│   ├── video.mp4                  # Tutorial video (READY for VideoPlayer)
│   └── animations/
│
├── package.json
├── tsconfig.json
├── app.json
├── next.config.mjs
├── jest.config.js
└── README.md
```

## Current Features Status

### ✅ Completed
- [x] Splash screen with logo animation
- [x] Onboarding carousel (4 slides)
- [x] Login screen with validation
- [x] Sign up screen with validation
- [x] Reset password (3-step flow)
- [x] Root navigation with routing logic
- [x] Auth context management
- [x] Video player component
- [x] Dependency management

### 🚧 In Progress
- [ ] Device testing on Android
- [ ] Device testing on iOS
- [ ] Performance optimization
- [ ] OAuth integration (Google, Apple)

### ❌ Not Yet Started
- [ ] Payment system
- [ ] Advanced analytics
- [ ] Push notifications setup
- [ ] Map integration polish

## Key Commands

### Development
```bash
pnpm start              # Start expo
pnpm android            # Run on Android emulator
pnpm ios                # Run on iOS simulator
pnpm web                # Run on web
```

### Testing & Quality
```bash
pnpm test               # Run tests
pnpm test:watch        # Watch mode
pnpm lint              # ESLint check
pnpm type-check        # TypeScript check
```

### Building
```bash
pnpm build:android     # Build APK/AAB
pnpm build:ios         # Build IPA
pnpm preview:android   # Preview Android build
```

## Common Navigation Patterns

### Navigate to a Screen
```tsx
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate
router.push('/auth/login');

// Navigate and replace history
router.replace('/rider/home');

// Go back
router.back();
```

### Conditional Navigation (Already Implemented)
```tsx
// In root _layout.tsx - automatically handled
if (!isAuthenticated) {
  if (isFirstTime) {
    router.replace('/auth/onboarding');
  } else {
    router.replace('/auth/login');
  }
} else {
  if (userRole === 'rider') {
    router.replace('/rider/home');
  }
}
```

## Working with Components

### Using the Video Player
```tsx
import VideoPlayer from '@/components/media/VideoPlayer';

export default function Tutorial() {
  const [showVideo, setShowVideo] = useState(false);

  if (!showVideo) {
    return null;
  }

  return (
    <VideoPlayer
      source={require('@/assets/video.mp4')}
      title="Getting Started"
      description="Learn how to book your first ride"
      onClose={() => setShowVideo(false)}
      autoPlay={true}
      controls={true}
    />
  );
}
```

### Creating a New Screen
```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@/utils/colors';

export default function NewScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.background }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          Screen Title
        </Text>
        
        <TouchableOpacity onPress={() => router.back()}>
          <Text>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
```

## APIs & Services

### Authentication Service
```tsx
import { useAuthContext } from '@/context/auth';

const { login, signup, logout, isAuthenticated, userRole } = useAuthContext();

// Login
await login({ email: 'user@example.com', password: 'pass123' });

// Sign up
await signup({
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  password: 'pass123'
});

// Logout
await logout();
```

### AsyncStorage for Persistence
```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save
await AsyncStorage.setItem('key', 'value');

// Get
const value = await AsyncStorage.getItem('key');

// Remove
await AsyncStorage.removeItem('key');

// Clear all
await AsyncStorage.clear();
```

### First-Time User Check
```tsx
// Check if first time
const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

// Mark as seen
await AsyncStorage.setItem('hasSeenOnboarding', 'true');
```

## Styling & Theme

### Using COLORS
```tsx
import { COLORS } from '@/utils/colors';

<View style={{
  backgroundColor: COLORS.light.background,
  padding: 16
}}>
  <Text style={{ color: COLORS.light.text }}>
    Main text
  </Text>
  <Text style={{ color: COLORS.light.textSecondary }}>
    Secondary text
  </Text>
</View>
```

### Available Colors
```
COLORS.light.primary          // Brand color (orange)
COLORS.light.background       // Background
COLORS.light.text            // Main text
COLORS.light.textSecondary   // Muted text
COLORS.light.border          // Borders/dividers
COLORS.light.success         // Success states
COLORS.light.warning         // Warning states
COLORS.light.error           // Error states
```

## Form Validation Patterns

### Email Validation
```tsx
const validateEmail = (email: string) => {
  return email.includes('@') && email.includes('.');
};
```

### Password Validation
```tsx
const validatePassword = (password: string) => {
  return password.length >= 6;
};
```

### Phone Validation
```tsx
const validatePhone = (phone: string) => {
  return phone.replace(/\D/g, '').length >= 10;
};
```

## Error Handling

### Try-Catch Pattern
```tsx
try {
  await login(credentials);
} catch (error) {
  const message = error instanceof Error ? error.message : 'An error occurred';
  Alert.alert('Error', message);
}
```

### Form Error Display
```tsx
{errors.email && (
  <Text style={{ color: '#EF4444', fontSize: 12 }}>
    {errors.email}
  </Text>
)}
```

## Performance Tips

### Memoization
```tsx
import React, { memo } from 'react';

const MyComponent = memo(({ data }) => {
  return <View>{data}</View>;
});
```

### useCallback for Event Handlers
```tsx
import { useCallback } from 'react';

const handlePress = useCallback(() => {
  // Handler logic
}, []);

<TouchableOpacity onPress={handlePress} />
```

### useMemo for Expensive Computations
```tsx
import { useMemo } from 'react';

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

## Testing

### Basic Unit Test
```tsx
import { render, screen } from '@testing-library/react-native';
import LoginScreen from '@/app/auth/login';

describe('LoginScreen', () => {
  it('renders email input', () => {
    render(<LoginScreen />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeDefined();
  });
});
```

## Debugging

### Enable Debug Mode
```tsx
// In app.tsx
console.log = (message) => {
  if (__DEV__) {
    console.warn('DEBUG:', message);
  }
};
```

### React Navigation Debugging
```tsx
// In _layout.tsx
const linking = {
  prefixes: [deepLinkingURL],
  config: {
    screens: {
      'auth/login': 'login',
      'rider/home': 'home',
    },
  },
};
```

## Frequently Used Imports

```tsx
// Navigation
import { useRouter } from 'expo-router';

// React
import React, { useState, useEffect, useCallback } from 'react';

// React Native
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';

// Safe Area
import { SafeAreaView } from 'react-native-safe-area-context';

// Storage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Utils
import { COLORS } from '@/utils/colors';

// Context
import { useAuthContext } from '@/context/auth';
```

## Common Issues & Solutions

### Issue: "Module not found"
**Solution**: Check path aliases in `tsconfig.json`
- `@/*` should map to root directory
- Use absolute imports like `@/components/MyComponent`

### Issue: "Type 'undefined' is not assignable"
**Solution**: Add proper TypeScript types
- Import types from `@/types`
- Use interfaces for complex objects
- Ensure all props are typed

### Issue: "Navigation not working"
**Solution**: Verify file structure
- Screens should be in `app/` directory
- Use folder structure for grouping: `app/(auth)/login.tsx`
- Check `_layout.tsx` files for proper navigation setup

### Issue: "Video not playing"
**Solution**: Check VideoPlayer props
- Ensure source is correct path or URI
- Verify source file exists in assets
- Check permissions for file access

## Useful Resources

- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **Expo Router**: https://docs.expo.dev/routing/create-routes/
- **React Navigation**: https://reactnavigation.org/
- **TypeScript**: https://www.typescriptlang.org/

## Important Notes

⚠️ **React 19.0.0-rc**: Currently using prerelease version
- Consider React 18.2.x for production stability
- Test thoroughly before release

✅ **All dependencies compatible**: See DEPENDENCY_COMPATIBILITY_REPORT.md

✅ **TypeScript strict mode**: Ensure all types are defined

✅ **SafeAreaView required**: Always use for proper device handling

---

**Last Updated**: Current Session  
**Maintained By**: GitHub Copilot  
**Questions?**: Check documentation files or error messages
