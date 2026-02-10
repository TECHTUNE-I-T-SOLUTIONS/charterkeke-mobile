# Token Decode Error Fix

## Problem
```
WARN  ⚠️ [WALLET] Could not decode token, trying alternative...
ERROR  ❌ [WALLET] Could not extract userId from token
```

The wallet.tsx was trying to decode the Bearer token as base64, assuming it had a `userId:timestamp` format. This assumption was wrong.

---

## Root Cause

The old code was attempting:
```typescript
const decoded = Buffer.from(token, 'base64').toString('utf-8');
userId = decoded.split(':')[0];
```

But the Bearer token stored in SecureStore is a JWT or similar token format, **not** a simple base64-encoded `userId:timestamp` string.

---

## Solution

Use the **AuthContext** to get the userId directly, instead of trying to decode the token.

### Changes Made

**File**: `c:\Codes\ck\app\driver\wallet.tsx`

#### 1. Added AuthContext import (Line 7)
```typescript
import { useAuth } from '@context/AuthContext';
```

#### 2. Extract user from AuthContext (Line 73)
```typescript
export default function DriverWalletScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();  // ← NEW: Get user from auth context
  // ... rest of code
```

#### 3. Get userId from user object (Line 95)
```typescript
const fetchWalletData = async () => {
  try {
    setLoading(true);
    console.log('👛 [WALLET] Fetching wallet data...');
    
    // Get userId from AuthContext
    if (!user?.id) {
      console.error('❌ [WALLET] No authenticated user found');
      setWalletData({ balance: 0, pendingWithdrawal: 0, withdrawn: 0, minimumWithdrawal: 500 });
      return;
    }

    const userId = user.id;  // ← NEW: Get directly from logged-in user
    console.log('✅ [WALLET] Got userId from AuthContext:', userId);
```

#### 4. Removed token decoding code
The old 15+ lines trying to decode the token are completely removed. No more:
- ❌ `Buffer.from(token, 'base64').toString('utf-8')`
- ❌ `decoded.split(':')`
- ❌ Try/catch for parsing

---

## Data Flow

### Before (Broken)
```
SecureStore (authToken)
    ↓
Try to decode as base64 "userId:timestamp"
    ↓
❌ Failed - token is JWT format, not base64
    ↓
Error: "Could not extract userId from token"
```

### After (Fixed)
```
AuthContext.user (logged-in user object)
    ↓
Access user.id directly
    ✅ Success: "6ae4e0fc-d4a8-4eb9-b3ae-d2d5a938575b"
    ↓
API Call: /driver/payment-status?driver_id={userId}
```

---

## Why This Works

1. **AuthContext stores the user object** - When you log in, the auth service stores the complete user object in AuthContext
2. **User object has ID** - The `user` object has an `id` field (from the backend API response)
3. **No token decoding needed** - We have direct access to the userId from the logged-in user
4. **Type-safe** - TypeScript knows the user object structure

---

## Related Code

**AuthContext** (`context/AuthContext.tsx`):
```typescript
interface AuthContextType {
  user: Rider | Driver | null;  // ← Contains user.id
  isAuthenticated: boolean;
  // ...
}
```

**API Service** (`services/api.ts`):
```typescript
async getPaymentStatus(driverId: string): Promise<any> {
  const response = await this.api.get(`/driver/payment-status?driver_id=${driverId}`);
  return response.data;
}
```

---

## Testing

After this fix:
1. ✅ No more "Could not decode token" warning
2. ✅ userId is extracted from AuthContext
3. ✅ Wallet data loads successfully
4. ✅ No 404 errors on payment-status endpoint

---

## Files Modified
- `c:\Codes\ck\app\driver\wallet.tsx`
  - Added `useAuth` import
  - Added `user` from AuthContext
  - Replaced token decoding with direct userId access
  - Added proper error check for missing user

