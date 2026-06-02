import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { apiService } from './api';
import { cacheService } from './cache';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

const NON_JWT_TOKEN_LIFESPAN_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // Refresh during the final week

class AuthService {
  private currentUser: any = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiryTime: number | null = null;

  async initialize(): Promise<void> {
    try {
      const storedTokens = await SecureStore.getItemAsync('tokens');
      if (storedTokens) {
        const { accessToken, refreshToken } = JSON.parse(storedTokens);
        await this.setTokens(accessToken, refreshToken);
      }

      const cachedUser = await cacheService.getUser();
      if (cachedUser) {
        this.currentUser = cachedUser;
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  async login(emailOrPhone: string, password: string): Promise<any> {
    try {
      const response = await apiService.login(emailOrPhone, password);
      await this.handleAuthResponse(response);
      return response.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async signup(payload: any): Promise<any> {
    try {
      const response = await apiService.signup(payload);
      await this.handleAuthResponse(response);
      return response.user;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  }

  private async handleAuthResponse(response: any): Promise<void> {
    if (response.token && response.refreshToken) {
      await this.setTokens(response.token, response.refreshToken);
    }
    if (response.user) {
      this.currentUser = response.user;
      await cacheService.saveUser(response.user);
    }
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    await SecureStore.setItemAsync('tokens', JSON.stringify({ accessToken, refreshToken }));
    await SecureStore.setItemAsync('authToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    // Try to decode JWT to get expiry time
    try {
      const decoded = jwtDecode<TokenPayload>(accessToken);
      this.tokenExpiryTime = decoded.exp * 1000;
    } catch (decodeError) {
      // The backend mobile token is an opaque base64 token. Keep it long-lived locally;
      // the server still validates the user account on every request.
      this.tokenExpiryTime = Date.now() + NON_JWT_TOKEN_LIFESPAN_MS;
      console.log('Using 90-day token expiry for non-JWT token');
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.logout();
      console.log('✅ [AUTH-SERVICE] Logout API call successful');
    } catch (error) {
      console.warn('⚠️  [AUTH-SERVICE] Logout API error (continuing with local logout):', error);
      // Don't re-throw - let local logout proceed
    } finally {
      // Always clear local state, regardless of API success/failure
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
      await SecureStore.deleteItemAsync('tokens');
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await cacheService.clearUser();
      console.log('✅ [AUTH-SERVICE] Local user data cleared');
    }
  }

  getCurrentUser(): any {
    return this.currentUser;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !this.isTokenExpired();
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
    return timeUntilExpiry < REFRESH_WINDOW_MS;
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
        await this.logout();
        return false;
      }

      const data = await response.json();
      await this.setTokens(data.token, data.refreshToken);
      await apiService.setAuthToken(data.token, data.refreshToken);

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Update current user
   */
  async updateCurrentUser(updates: Partial<any>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    this.currentUser = { ...this.currentUser, ...updates };
    await cacheService.saveUser(this.currentUser);
  }

  /**
   * Get user role
   */
  getUserRole(): string | null {
    return this.currentUser?.role || null;
  }

  /**
   * Check if user is rider
   */
  isRider(): boolean {
    return this.currentUser?.role === 'rider' || this.currentUser?.role === 'user';
  }

  /**
   * Check if user is driver
   */
  isDriver(): boolean {
    return this.currentUser?.role === 'driver';
  }

  /**
   * Verify OTP sent to phone
   */
  async verifyOTP(phone: string, otp: string): Promise<boolean> {
    try {
      const response = await apiService.verifyOTP(phone, otp);
      return response.verified || false;
    } catch (error) {
      console.error('OTP verification error:', error);
      return false;
    }
  }

  /**
   * Request password reset via email or phone
   */
  async requestPasswordReset(emailOrPhone: string): Promise<boolean> {
    try {
      const response = await apiService.resetPassword(emailOrPhone);
      return !!response.message;
    } catch (error) {
      console.error('Password reset request error:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
