import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { jwtDecode } from 'jwt-decode';
import { apiService } from './api';
import { cacheService } from './cache';
import { AuthResponse, UserRole, Rider, Driver } from '@/types';
import { AUTH_CONFIG, STORAGE_KEYS } from '@utils/constants';

interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

class AuthService {
  private currentUser: Rider | Driver | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiryTime: number | null = null;

  private isFormDataPayload = (data: any): boolean => {
    if (!data) return false;
    if (typeof FormData !== 'undefined' && data instanceof FormData) return true;
    return typeof data?.append === 'function' && typeof data?.getParts === 'function';
  };

  /**
   * Initialize auth service
   */
  async initialize(): Promise<void> {
    try {
      // Get stored tokens
      const storedTokens = await SecureStore.getItemAsync('tokens');
      if (storedTokens) {
        const { accessToken, refreshToken } = JSON.parse(storedTokens);
        await this.setTokens(accessToken, refreshToken);
      }

      // Get cached user
      const cachedUser = await cacheService.getUser();
      if (cachedUser) {
        this.currentUser = cachedUser;
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<Rider | Driver> {
    try {
      console.log('🚀 Attempting login with:', { email: email || 'N/A', usePhone: !email });
      const response = await apiService.login(email, password);
      console.log('✅ Login API response received:', { 
        hasUser: !!response.user,
        hasToken: !!response.token,
        hasRefreshToken: !!response.refreshToken,
        userRole: (response.user as any)?.role,
        userId: (response.user as any)?.id,
      });
      
      if (!response.user) {
        console.error('❌ [AUTH] No user in response');
        throw new Error('No user data in login response');
      }

      if ((response.user as any).role) {
        console.log('✅ [AUTH] User role confirmed:', (response.user as any).role);
      } else {
        console.warn('⚠️  [AUTH] User role is missing!');
      }

      await this.handleAuthResponse(response);
      console.log('✅ Login successful, user returned with role:', (response.user as any)?.role);
      console.log('🔍 [AUTH] Returning user with details:', {
        userExists: !!response.user,
        hasRole: !!(response.user as any)?.role,
        role: (response.user as any)?.role,
        id: (response.user as any)?.id,
        userKeys: response.user ? Object.keys(response.user) : []
      });
      return response.user;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  /**
   * Sign up user
   */
  async signup(payload: any): Promise<AuthResponse> {
    try {
      const deviceId = await this.getDeviceId();
      let signupPayload = payload;
      const isFormData = this.isFormDataPayload(payload);

      if (isFormData) {
        payload.append('deviceId', deviceId);
        signupPayload = payload;
      } else {
        signupPayload = {
          ...payload,
          deviceId,
        };
      }

      const signupResponse = await apiService.signup(signupPayload);

      const roleFromPayload = isFormData
        ? ((payload.get('role') as string) || '')
        : (payload?.role || '');
      const normalizedRole = roleFromPayload === 'rider' ? 'user' : roleFromPayload;

      const createdUserId = (signupResponse as any)?.user?.id || (signupResponse as any)?.userId;

      if (normalizedRole === 'driver' && isFormData && createdUserId) {
        const driverPayload = new FormData();
        const emergencyContactName = String(payload.get('emergencyContactName') || '').trim();
        const emergencyContactPhone = String(payload.get('emergencyContactPhone') || '').trim();
        const combinedEmergencyContact = [emergencyContactName, emergencyContactPhone].filter(Boolean).join(' - ');

        driverPayload.append('userId', String(createdUserId));
        driverPayload.append('vehicleType', String(payload.get('vehicleType') || 'keke'));
        driverPayload.append('plateNumber', String(payload.get('plateNumber') || ''));
        driverPayload.append('unionName', String(payload.get('unionName') || ''));
        driverPayload.append('operatingZones', String(payload.get('operatingZones') || '[]'));
        driverPayload.append('bankName', String(payload.get('bankName') || ''));
        driverPayload.append('bankAccountNumber', String(payload.get('bankAccountNumber') || ''));
        driverPayload.append('emergencyContact', combinedEmergencyContact || String(payload.get('emergencyContact') || ''));

        const vehiclePicture = payload.get('vehiclePicture') || payload.get('vehicleImage');
        const licensePicture = payload.get('licensePicture') || payload.get('licenseImage');

        if (vehiclePicture) {
          driverPayload.append('vehiclePicture', vehiclePicture as any);
        }

        if (licensePicture) {
          driverPayload.append('licensePicture', licensePicture as any);
        }

        await apiService.post('/drivers', driverPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if ((signupResponse as any)?.token && (signupResponse as any)?.refreshToken) {
        await this.handleAuthResponse(signupResponse as AuthResponse);
        return signupResponse as AuthResponse;
      }

      const email = isFormData ? String(payload.get('email') || '') : String(payload?.email || '');
      const phone = isFormData ? String(payload.get('phone') || '') : String(payload?.phone || '');
      const password = isFormData ? String(payload.get('password') || '') : String(payload?.password || '');
      const loginIdentifier = email || phone;

      if (!loginIdentifier || !password) {
        throw new Error('Signup succeeded but login credentials are missing. Please log in manually.');
      }

      const loginResponse = await apiService.login(loginIdentifier, password);
      await this.handleAuthResponse(loginResponse);
      return loginResponse;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, otp: string): Promise<{ verified: boolean }> {
    try {
      const result = await apiService.verifyOTP(phone, otp);
      return result;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(emailOrPhone: string): Promise<void> {
    try {
      // Support both email and phone for password reset
      const isPhone = /^\+?[0-9]\d{1,14}$/.test(emailOrPhone.replace(/\s/g, ''));
      const payload = isPhone 
        ? { phone: emailOrPhone }
        : { email: emailOrPhone };
      
      await apiService.resetPassword(emailOrPhone);
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Clear local data
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiryTime = null;

      // Clear secure storage
      await SecureStore.deleteItemAsync('tokens');
      await apiService.clearAuthToken();

      // Clear cache
      await cacheService.clearUser();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Handle auth response
   */
  private async handleAuthResponse(response: AuthResponse): Promise<void> {
    console.log('🔄 [AUTH] Handling auth response:', {
      hasToken: !!response.token,
      hasRefreshToken: !!response.refreshToken,
      hasUser: !!response.user,
      responseKeys: Object.keys(response)
    });
    console.log('🔍 [AUTH] User from response:', response.user ? {
      hasRole: !!(response.user as any)?.role,
      role: (response.user as any)?.role,
      id: (response.user as any)?.id,
      userKeys: Object.keys(response.user || {})
    } : 'NO USER OBJECT');

    const { token, refreshToken, user } = response;

    if (!token) {
      console.error('❌ [AUTH] Response missing token');
      throw new Error('No token in login response');
    }

    if (!refreshToken) {
      console.error('❌ [AUTH] Response missing refreshToken');
      throw new Error('No refresh token in login response');
    }

    // Store tokens
    console.log('💾 [AUTH] Storing tokens via setTokens...');
    await this.setTokens(token, refreshToken);
    console.log('✅ [AUTH] setTokens completed');

    // Set API token
    console.log('💾 [AUTH] Storing tokens via setAuthToken...');
    try {
      await apiService.setAuthToken(token, refreshToken);
      console.log('✅ [AUTH] setAuthToken completed');
    } catch (error) {
      console.error('❌ [AUTH] setAuthToken failed:', error);
      throw error;
    }

    // Cache user
    console.log('👤 [AUTH] Caching user data...', user ? {
      hasRole: !!(user as any)?.role,
      role: (user as any)?.role,
      id: (user as any)?.id
    } : 'NULL USER');
    this.currentUser = user;
    await cacheService.saveUser(user);
    console.log('🔍 [AUTH] After caching, currentUser:', this.currentUser ? {
      hasRole: !!(this.currentUser as any)?.role,
      role: (this.currentUser as any)?.role,
      id: (this.currentUser as any)?.id
    } : 'NULL');
    
    console.log('✅ [AUTH] Auth response handled successfully');
  }

  /**
   * Set tokens
   */
  private async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;

      // Store securely
      await SecureStore.setItemAsync(
        'tokens',
        JSON.stringify({ accessToken, refreshToken })
      );

      // Calculate expiry time - try to decode as JWT, otherwise use 24-hour default
      try {
        const decoded = jwtDecode<TokenPayload>(accessToken);
        this.tokenExpiryTime = decoded.exp * 1000;
      } catch (decodeError) {
        // Token is not JWT format (e.g., base64-encoded session token)
        // Set expiry to 24 hours from now
        this.tokenExpiryTime = Date.now() + (24 * 60 * 60 * 1000);
        console.log('Using 24-hour token expiry for non-JWT token');
      }
    } catch (error) {
      console.error('Error setting tokens:', error);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (!this.tokenExpiryTime) return true;
    return Date.now() >= this.tokenExpiryTime;
  }

  /**
   * Check if token should be refreshed
   */
  shouldRefreshToken(): boolean {
    if (!this.tokenExpiryTime) return true;
    const timeUntilExpiry = this.tokenExpiryTime - Date.now();
    return timeUntilExpiry < AUTH_CONFIG.refreshThresholdMs;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      if (!this.refreshToken) {
        return false;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        // Refresh failed, logout user
        await this.logout();
        return false;
      }

      const data = (await response.json()) as AuthResponse;
      await this.setTokens(data.token, data.refreshToken);
      await apiService.setAuthToken(data.token, data.refreshToken);

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): Rider | Driver | null {
    return this.currentUser;
  }

  /**
   * Update current user
   */
  async updateCurrentUser(updates: Partial<Rider | Driver>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    this.currentUser = { ...this.currentUser, ...updates } as Rider | Driver;
    await cacheService.saveUser(this.currentUser);
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && !this.isTokenExpired();
  }

  /**
   * Get user role
   */
  getUserRole(): UserRole | null {
    return this.currentUser?.role || null;
  }

  /**
   * Check if user is rider
   */
  isRider(): boolean {
    return this.currentUser?.role === 'rider';
  }

  /**
   * Check if user is driver
   */
  isDriver(): boolean {
    return this.currentUser?.role === 'driver';
  }

  /**
   * Get device ID
   */
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await cacheService.get(STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) {
        deviceId = (Device as any).deviceId || `device_${Date.now()}`;
        if (typeof deviceId !== 'string') {
          deviceId = `device_${Date.now()}`;
        }
        await cacheService.set(STORAGE_KEYS.DEVICE_ID, deviceId);
      }
      return typeof deviceId === 'string' ? deviceId : `device_${Date.now()}`;
    } catch (error) {
      return `device_${Date.now()}`;
    }
  }

  /**
   * Verify current session
   */
  async verifySession(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }

      if (this.shouldRefreshToken()) {
        return await this.refreshAccessToken();
      }

      return true;
    } catch (error) {
      console.error('Session verification error:', error);
      return false;
    }
  }

  /**
   * Get decoded token
   */
  getDecodedToken(): TokenPayload | null {
    if (!this.accessToken) return null;
    try {
      return jwtDecode<TokenPayload>(this.accessToken);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(): Date | null {
    if (!this.tokenExpiryTime) return null;
    return new Date(this.tokenExpiryTime);
  }

  /**
   * Validate user role
   */
  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Get time until token expires
   */
  getTimeUntilExpiry(): number {
    if (!this.tokenExpiryTime) return 0;
    return Math.max(0, this.tokenExpiryTime - Date.now());
  }
}

export const authService = new AuthService();
