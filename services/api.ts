import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '@utils/constants';
import { APIError, AuthResponse } from '@types/index';

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
        const token = await SecureStore.getItemAsync('authToken');
        console.log('📤 [API] Request interceptor - authToken from store:', token ? '✓ found' : '✗ not found');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('📤 [API] Bearer token added to headers, length:', token.length);
        } else {
          console.warn('⚠️  [API] No authToken in SecureStore, request will be sent without auth');
        }
        console.log('📤 [API] Request URL:', config.url);
        console.log('📤 [API] Request headers:', Object.keys(config.headers));
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

  private handleError = async (error: AxiosError): Promise<never> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
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
          throw new Error('No refresh token');
        }

        const response = await axios.post<AuthResponse>(
          `${API_CONFIG.url}/auth/refresh`,
          { refreshToken }
        );

        const { token } = response.data;
        await SecureStore.setItemAsync('authToken', token);

        this.api.defaults.headers.common.Authorization = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        this.failedQueue.forEach((prom) => prom.onSuccess(token));
        this.failedQueue = [];

        return this.api(originalRequest);
      } catch (err) {
        this.failedQueue.forEach((prom) => prom.onFailed(err as AxiosError));
        this.failedQueue = [];
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('refreshToken');
        throw err;
      } finally {
        this.isRefreshing = false;
      }
    }

    return this.formatError(error);
  };

  private formatError = (error: AxiosError): Promise<never> => {
    let formattedError: APIError;

    if (error.response) {
      const data = error.response.data as any;
      console.log('📡 [API] Backend error response received:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: data
      });
      formattedError = {
        code: data?.code || 'UNKNOWN_ERROR',
        message: data?.message || data?.error || 'An error occurred',
        statusCode: error.response.status,
        details: data?.details || data?.error,
      };
      // Log full backend error for debugging
      console.error('📡 Backend detailed error:', JSON.stringify(data, null, 2));
    } else if (error.request) {
      console.error('📡 [API] Network error (no response):', error.request);
      formattedError = {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
        statusCode: 0,
      };
      console.error('📡 Network error:', error.request);
    } else {
      console.error('📡 [API] Client error:', error.message);
      formattedError = {
        code: 'CLIENT_ERROR',
        message: error.message || 'An unexpected error occurred',
        statusCode: 0,
      };
      console.error('📡 Client error:', error.message);
    }

    console.error('❌ [API] Formatted error to throw:', JSON.stringify(formattedError, null, 2));

    return Promise.reject(formattedError);
  };

  // Auth endpoints
  async login(emailOrPhone: string, password: string): Promise<AuthResponse> {
    // Support both email and phone login
    const isPhone = /^\+?[0-9]\d{1,14}$/.test(emailOrPhone.replace(/\s/g, ''));
    
    const payload = isPhone 
      ? { phone: emailOrPhone, password }
      : { email: emailOrPhone, password };
    
    console.log('📤 [API] Sending login request:', {
      endpoint: '/auth/login',
      payload: {
        ...payload,
        password: '***'
      },
      detectedType: isPhone ? 'phone' : 'email'
    });

    try {
      const response = await this.api.post<AuthResponse>('/auth/login', payload);
      console.log('✅ [API] Login response received:', {
        hasToken: !!response.data.token,
        hasRefreshToken: !!response.data.refreshToken,
        hasUser: !!response.data.user,
        status: response.status
      });
      console.log('🔍 [API] Response.data structure:', Object.keys(response.data));
      console.log('🔍 [API] User object:', response.data.user ? {
        hasRole: !!response.data.user.role,
        role: response.data.user.role,
        id: response.data.user.id,
        userKeys: Object.keys(response.data.user)
      } : 'NO USER');
      return response.data;
    } catch (error) {
      console.error('❌ [API] Login request failed:', error);
      throw error;
    }
  }

  async signup(payload: any): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', payload);
    return response.data;
  }

  async verifyOTP(phone: string, otp: string): Promise<{ verified: boolean }> {
    const response = await this.api.post('/auth/verify-otp', { phone, otp });
    return response.data;
  }

  async resetPassword(email: string): Promise<{ message: string }> {
    const response = await this.api.post('/auth/reset-password', { email });
    return response.data;
  }

  // Rider endpoints
  async getRiderProfile(): Promise<any> {
    const response = await this.api.get('/riders/profile');
    return response.data;
  }

  async updateRiderProfile(data: any): Promise<any> {
    const response = await this.api.post('/riders/profile', data);
    return response.data;
  }

  async getRiderRides(page: number = 1, limit: number = 20): Promise<any> {
    const response = await this.api.get('/user/ride-history', {
      params: { page, limit },
    });
    return response.data;
  }

  // Ride endpoints
  async createRide(rideData: any): Promise<any> {
    const response = await this.api.post('/rides', rideData);
    return response.data;
  }

  async getRide(rideId: string): Promise<any> {
    const response = await this.api.get(`/rides/${rideId}`);
    return response.data;
  }

  async updateRide(rideId: string, updates: any): Promise<any> {
    const response = await this.api.put(`/rides/${rideId}`, updates);
    return response.data;
  }

  async cancelRide(rideId: string, reason?: string): Promise<any> {
    const response = await this.api.put(`/rides/${rideId}`, {
      status: 'cancelled',
      cancellationReason: reason,
    });
    return response.data;
  }

  // Driver endpoints
  async getDriverProfile(): Promise<any> {
    const response = await this.api.get('/drivers/profile');
    return response.data;
  }

  async updateDriverProfile(data: any): Promise<any> {
    const response = await this.api.post('/drivers/profile', data);
    return response.data;
  }

  async getDriverDetails(): Promise<any> {
    const response = await this.api.get('/driver/details');
    return response.data;
  }

  async getDriverStatus(): Promise<any> {
    const response = await this.api.get('/driver/status');
    return response.data;
  }

  async setDriverStatus(status: 'online' | 'offline'): Promise<any> {
    const response = await this.api.put('/driver/status', { status });
    return response.data;
  }

  async getAvailableRides(latitude?: number, longitude?: number, radiusKm: number = 15): Promise<any> {
    const params: any = { radiusKm };
    if (latitude !== undefined && longitude !== undefined) {
      params.latitude = latitude;
      params.longitude = longitude;
    }
    const response = await this.api.get('/driver/available-rides', { params });
    return response.data;
  }

  async getActiveRides(): Promise<any> {
    const response = await this.api.get('/driver/active-rides');
    return response.data;
  }

  async acceptRide(rideId: string): Promise<any> {
    const response = await this.api.post('/driver/accept-ride', { rideId });
    return response.data;
  }

  async updateRideStatus(rideId: string, status: 'in_progress' | 'completed'): Promise<any> {
    const response = await this.api.post('/driver/update-ride-status', { rideId, status });
    return response.data;
  }

  // Location endpoints
  async postLocation(rideId: string, location: any): Promise<any> {
    const response = await this.api.post('/ride-location', {
      rideId,
      ...location,
    });
    return response.data;
  }

  async getLiveLocation(rideId: string): Promise<any> {
    const response = await this.api.get(`/ride-location/${rideId}`);
    return response.data;
  }

  // Wallet and Payment endpoints
  async getPaymentStatus(driverId: string): Promise<any> {
    const response = await this.api.get(`/driver/payment-status?driver_id=${driverId}`);
    return response.data;
  }

  async getWallet(): Promise<any> {
    // Deprecated: Use getPaymentStatus instead
    const response = await this.api.get('/driver/payment-status');
    return response.data;
  }

  async getTransactions(page: number = 1): Promise<any> {
    const response = await this.api.get('/driver/ride-history', {
      params: { page },
    });
    return response.data;
  }

  async getEarnings(timeframe: string = 'day'): Promise<any> {
    const response = await this.api.get('/driver/earnings', {
      params: { timeframe },
    });
    return response.data;
  }

  // Rating endpoints
  async submitRating(rideId: string, rating: number, review?: string): Promise<any> {
    const response = await this.api.post(`/rides/${rideId}/rating`, {
      rating,
      review,
    });
    return response.data;
  }

  // Notifications
  async getNotifications(page: number = 1, limit: number = 20): Promise<any> {
    const response = await this.api.get('/notifications', {
      params: { page, limit },
    });
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    const response = await this.api.put(`/notifications/${notificationId}`, {
      read: true,
    });
    return response.data;
  }

  // Generic methods
  async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  // Set auth token
  async setAuthToken(token: string, refreshToken: string): Promise<void> {
    try {
      console.log('💾 [API] Setting auth token, token length:', token.length);
      await SecureStore.setItemAsync('authToken', token);
      console.log('✅ [API] authToken stored in SecureStore');
      
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      console.log('✅ [API] refreshToken stored in SecureStore');
      
      this.api.defaults.headers.common.Authorization = `Bearer ${token}`;
      console.log('✅ [API] Bearer token set in axios defaults');
      
      // Verify it was stored
      const storedToken = await SecureStore.getItemAsync('authToken');
      console.log('🔍 [API] Verification - authToken in store:', storedToken ? '✓ yes' : '✗ NOT FOUND');
    } catch (error) {
      console.error('❌ [API] ERROR storing auth token:', error);
      throw error;
    }
  }

  // Clear auth token
  async clearAuthToken(): Promise<void> {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('refreshToken');
    delete this.api.defaults.headers.common.Authorization;
  }
}

export const apiService = new APIService();
