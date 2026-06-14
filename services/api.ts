import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '@utils/constants';

class APIService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    onSuccess: (token: string) => void;
    onFailed: (error: AxiosError) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.url,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const skipAuth = (config as any).skipAuth || String(config.url || '').startsWith('/auth/') || String(config.url || '').startsWith('/otp/');
        const token = skipAuth ? null : await SecureStore.getItemAsync('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleError(error)
    );
  }

  private handleError = async (error: AxiosError): Promise<any> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _fallbackRetry?: boolean };

    // Handle network errors and timeouts (status 0)
    if (!error.response || error.response.status === 0) {
      const currentBaseUrl = String(originalRequest?.baseURL || this.api.defaults.baseURL || '').replace(/\/+$/, '');
      const fallbackBaseUrl = String(API_CONFIG.fallbackUrl || '').replace(/\/+$/, '');

      if (originalRequest && fallbackBaseUrl && fallbackBaseUrl !== currentBaseUrl && !originalRequest._fallbackRetry) {
        originalRequest._fallbackRetry = true;
        originalRequest.baseURL = fallbackBaseUrl;
        console.warn('[API] Primary API host unreachable, retrying with fallback host:', {
          primary: currentBaseUrl,
          fallback: fallbackBaseUrl,
          url: originalRequest.url,
          code: error.code,
        });
        return this.api(originalRequest);
      }

      console.error('[API] Network error or timeout:', {
        message: error.message,
        code: error.code,
        url: originalRequest?.url,
        baseURL: currentBaseUrl,
      });
      
      // Return a more informative error
      const networkError = new Error(
        error.code === 'ECONNABORTED' 
          ? 'Request timeout. Please check your network connection.'
          : 'Network error. Please check your connection and try again.'
      );
      return Promise.reject(networkError);
    }

    const isAuthRoute =
      String(originalRequest?.url || '').startsWith('/auth/') ||
      String(originalRequest?.url || '').startsWith('/otp/') ||
      (originalRequest as any)?.skipAuth;

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (this.isRefreshing) {
        return new Promise((resolve, reject) => {
          this.failedQueue.push({
            onSuccess: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(this.api(originalRequest));
            },
            onFailed: (error: AxiosError) => reject(error),
          });
        });
      }

      originalRequest._retry = true;
      this.isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) {
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('refreshToken');
          this.isRefreshing = false;
          return Promise.reject(error);
        }

        const response = await axios.post<{ token: string; refreshToken?: string }>(
          `${API_CONFIG.url}/auth/refresh`,
          { refreshToken }
        );

        const { token, refreshToken: nextRefreshToken } = response.data;
        const effectiveRefreshToken = nextRefreshToken || refreshToken;
        await SecureStore.setItemAsync('authToken', token);
        await SecureStore.setItemAsync('refreshToken', effectiveRefreshToken);
        await SecureStore.setItemAsync('tokens', JSON.stringify({ accessToken: token, refreshToken: effectiveRefreshToken }));
        this.api.defaults.headers.common.Authorization = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        this.failedQueue.forEach((prom) => prom.onSuccess(token));
        this.failedQueue = [];

        return this.api(originalRequest);
      } catch (err) {
        this.failedQueue.forEach((prom) => prom.onFailed(err as any));
        this.failedQueue = [];
        return Promise.reject(err);
      } finally {
        this.isRefreshing = false;
      }
    }

    const responseData: any = error.response?.data || {};
    const friendly = responseData.message || responseData.error || error.message || 'Request failed';
    const apiError: any = new Error(friendly);
    apiError.status = error.response?.status;
    apiError.code = responseData.code;
    apiError.details = responseData;
    return Promise.reject(apiError);
  };

  async get<T>(url: string, config?: any): Promise<T> {
    try {
      console.log(`[API] GET ${this.api.defaults.baseURL}${url}`);
      const response = await this.api.get<T>(url, config);
      return response.data;
    } catch (error: any) {
      console.error(`[API] GET failed at ${this.api.defaults.baseURL}${url}:`, error.message);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      console.log(`[API] POST ${this.api.defaults.baseURL}${url}`);
      const response = await this.api.post<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      console.error(`[API] POST failed at ${this.api.defaults.baseURL}${url}:`, error.message);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  // Auth endpoints
  async login(emailOrPhone: string, password: string): Promise<any> {
    // Support both email and phone login
    // Detect if it's a phone number using E.164 format or Nigerian format
    const isPhone = /^\+?[0-9]\d{1,14}$/.test(emailOrPhone.replace(/\s/g, ''));
    
    const payload = isPhone 
      ? { phone: emailOrPhone, password }
      : { email: emailOrPhone, password };
    
    return this.post('/auth/login', payload, { skipAuth: true });
  }

  async signup(data: any): Promise<any> {
    // Check if data is FormData
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    
    if (isFormData) {
      return this.post('/auth/signup', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    
    return this.post('/auth/signup', data);
  }

  async verifyOTP(phone: string, otp: string): Promise<{ verified: boolean }> {
    return this.post('/auth/verify-otp', { phone, otp });
  }

  async resetPassword(emailOrPhone: string): Promise<{ message: string }> {
    // Support both email and phone for password reset
    const isPhone = /^\+?[0-9]\d{1,14}$/.test(emailOrPhone.replace(/\s/g, ''));
    
    const payload = isPhone 
      ? { phone: emailOrPhone }
      : { email: emailOrPhone };
    
    return this.post('/auth/reset-password', payload);
  }

  async logout(): Promise<void> {
    try {
      // Send empty object as body to satisfy server requirements
      return await this.post('/auth/logout', {});
    } catch (error: any) {
      // Log but don't fail logout - user should be able to logout even if API fails
      console.warn('⚠️  [API] Logout API request failed:', error?.message);
      // Still resolve to allow local logout to proceed
      return;
    }
  }

  // Referral endpoints
  async getReferralCode(): Promise<any> {
    try {
      const res = await this.get('/user/referrals');
      console.log('🔍 [API] getReferralCode raw response:', JSON.stringify(res));
      return res;
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch referral code:', error?.message);
      // Return graceful default if endpoint doesn't exist yet
      return { referralCode: { referral_code: '' }, referral_code: '' };
    }
  }

  async getReferrals(): Promise<any> {
    try {
      return this.get('/user/referrals');
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch referrals:', error?.message);
      // Return graceful default if endpoint doesn't exist yet
      return { referrals: [], referralCode: '', referral_code: '' };
    }
  }

  async updateReferralCode(): Promise<any> {
    try {
      return this.post('/user/referral/generate');
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to generate new referral code:', error?.message);
      return { referralCode: '', referral_code: '' };
    }
  }

  // Rider endpoints
  async getRiderProfile(): Promise<any> {
    return this.get('/auth/me');
  }

  async updateRiderProfile(data: any): Promise<any> {
    return this.post('/riders/profile', data);
  }

  async getRiderRides(limit: number = 20): Promise<any> {
    return this.get('/rides', { params: { limit } });
  }

  // Ride endpoints
  async createRide(rideData: any): Promise<any> {
    console.log('📤 [API] Create ride payload:', rideData);
    const response = await this.post('/user/book-ride', rideData);
    console.log('📥 [API] Create ride response:', response);
    return response;
  }

  async updateRide(rideId: string, updates: any): Promise<any> {
    return this.put(`/rides/${rideId}`, updates);
  }

  async cancelRide(rideId: string, reason?: string): Promise<any> {
    return this.put(`/rides/${rideId}`, {
      status: 'cancelled',
      cancellationReason: reason,
    });
  }

  async getRideHistory(limit: number = 20): Promise<any> {
    return this.get('/user/ride-history', { params: { limit } });
  }

  async getWalletBalance(): Promise<any> {
    return this.get('/user/wallet');
  }

  async submitRating(rideId: string, rating: number, review?: string): Promise<any> {
    return this.post(`/rides/${rideId}/rating`, { rating, review });
  }

  // Notifications endpoints
  async getNotifications(page: number = 1, limit: number = 20): Promise<any> {
    try {
      return this.get('/user/notifications', { params: { page, limit } });
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch notifications:', error?.message);
      // Return graceful default if endpoint doesn't exist yet
      return { notifications: [] };
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    return this.patch('/user/notifications', { notificationId });
  }

  // Driver endpoints
  async getDriverDetails(): Promise<any> {
    try {
      return this.get('/driver/details');
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch driver details:', error?.message);
      return { driver: {} };
    }
  }

  async getDriverStatus(): Promise<any> {
    try {
      return this.get('/driver/status');
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch driver status:', error?.message);
      return { status: 'offline' };
    }
  }

  async setDriverStatus(status: 'online' | 'offline'): Promise<any> {
    try {
      return this.put('/driver/status', { status });
    } catch (error: any) {
      console.error('❌ [API] Failed to set driver status:', error?.message);
      throw error;
    }
  }

  async getActiveRides(): Promise<any> {
    try {
      return this.get('/driver/active-rides');
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch active rides:', error?.message);
      return { rides: [] };
    }
  }

  async getAvailableRides(latitude?: number, longitude?: number, radius?: number): Promise<any> {
    try {
      const params: any = {};
      if (latitude) params.latitude = latitude;
      if (longitude) params.longitude = longitude;
      if (radius) params.radius = radius;
      
      return this.get('/driver/available-rides', { params });
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch available rides:', error?.message);
      return { rides: [] };
    }
  }

  async getDriverSettlementStatus(): Promise<any> {
    try {
      return this.get('/driver/settlement/status');
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch settlement status:', error?.message);
      return { blocked: false, totalOutstanding: 0 };
    }
  }

  async getDriverDailySettlement(): Promise<any> {
    try {
      return this.get('/driver/settlement/daily');
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch daily settlement:', error?.message);
      return { settlement: { totalDriverEarnings: 0 }, totals: { netDriverEarnings: 0 } };
    }
  }

  async getDriverProfile(driverId?: string): Promise<any> {
    try {
      if (driverId) {
        // Get a specific driver's profile by ID
        return this.get(`/users/${driverId}`);
      }
      // Get current user's driver profile
      return this.get('/driver/details');
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch driver profile:', error?.message);
      return {};
    }
  }

  async updateDriverProfile(data: any): Promise<any> {
    try {
      return this.post('/driver/details', data);
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to update driver profile:', error?.message);
      return {};
    }
  }

  async getEarnings(timeframe: string = 'day'): Promise<any> {
    try {
      // Normalize timeframe parameter to match backend expectations
      const validTimeframe = ['day', 'week', 'month', 'year', 'all'].includes(timeframe) ? timeframe : 'day';
      return this.get('/driver/earnings', { params: { timeframe: validTimeframe } });
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch earnings:', error?.message);
      return { earnings: { total_ride_earnings: 0 } };
    }
  }

  async getDriverEarningsStats(): Promise<any> {
    try {
      return this.get('/driver/earnings-stats');
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch driver earnings stats:', error?.message);
      return { stats: { totalRides: 0, averageRating: 0 } };
    }
  }

  async verifyAllPendingPayments(driverId?: string): Promise<any> {
    try {
      // Try GET first, fall back to other endpoints if needed
      const url = driverId ? `/driver/payment-status?driver_id=${driverId}` : '/driver/payment-status';
      return this.get(url);
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to verify pending payments:', error?.message);
      return { verified: [], updated: 0 };
    }
  }

  async getTransactions(page: number = 1): Promise<any> {
    try {
      return this.get('/driver/ride-history', { params: { page } });
    } catch (error: any) {
      console.warn('⚠️  [API] Failed to fetch transactions:', error?.message);
      return { transactions: [], rides: [] };
    }
  }

  // Driver endpoints - missing methods
  async acceptRide(rideId: string, etaMinutes?: number): Promise<any> {
    return this.post('/driver/accept-ride', {
      rideId,
      ...(Number.isFinite(Number(etaMinutes)) && Number(etaMinutes) > 0 ? { eta_minutes: Math.round(Number(etaMinutes)) } : {}),
    });
  }

  async updateRideStatus(rideId: string, status: 'in_progress' | 'completed', etaMinutes?: number): Promise<any> {
    return this.post('/driver/update-ride-status', {
      rideId,
      status,
      ...(Number.isFinite(Number(etaMinutes)) && Number(etaMinutes) > 0 ? { eta_minutes: Math.round(Number(etaMinutes)) } : {}),
    });
  }

  async verifyDriverSettlementPayment(reference: string): Promise<any> {
    return this.post('/driver/payment-callback', { reference });
  }

  async initiateDriverSettlementPayment(payload?: { returnUrl?: string; includeToday?: boolean; date?: string; rideId?: string }): Promise<any> {
    return this.post('/driver/settlement/initiate', payload || {});
  }

  // Chat endpoints
  async getChat(rideId: string): Promise<any> {
    return this.get('/chat', { params: { rideId } });
  }

  async getChatById(chatId: string): Promise<any> {
    return this.get('/chat', { params: { chatId } });
  }

  async createChat(rideId: string): Promise<any> {
    return this.post('/chat', { rideId });
  }

  async getMessages(chatId: string, limit: number = 50, offset: number = 0): Promise<any> {
    return this.get('/chat/messages', { params: { chatId, limit, offset } });
  }

  async sendMessage(chatId: string, content: string, messageType: 'text' | 'location' = 'text', locationData?: any): Promise<any> {
    return this.post('/chat/messages', { chatId, content, messageType, locationData });
  }

  async getUserChats(): Promise<any> {
    return this.get('/chat/user');
  }

  async getRiderChats(riderId: string): Promise<any> {
    return this.get(`/chat/rider/${riderId}`);
  }

  async getDriverChats(driverId: string): Promise<any> {
    return this.get(`/chat/driver/${driverId}`);
  }

  async getRide(rideId: string): Promise<any> {
    return this.get(`/rides/${rideId}`);
  }

  async getChatDriverProfile(driverId: string): Promise<any> {
    return this.get(`/chat/driver/${driverId}`);
  }

  async getChatRiderProfile(riderId: string): Promise<any> {
    return this.get(`/chat/rider/${riderId}`);
  }

  // Ride Review and Rating endpoints
  async getRideDetails(rideId: string): Promise<any> {
    return this.get(`/rides/${rideId}`);
  }

  async submitRideReview(reviewData: {
    ride_id: string;
    reviewer_id: string;
    rated_user_id: string;
    rating: number;
    review_text: string;
    categories: any;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await this.post('/ride-reviews', reviewData);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error('[API] Failed to submit ride review:', error.message);
      return {
        success: false,
        message: error.message || 'Failed to submit review',
      };
    }
  }

  async setAuthToken(token: string, refreshToken?: string): Promise<void> {
    if (token) {
      await SecureStore.setItemAsync('authToken', token);
      this.api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
    if (refreshToken) {
      await SecureStore.setItemAsync('refreshToken', refreshToken);
    }
  }
}

export const apiService = new APIService();
