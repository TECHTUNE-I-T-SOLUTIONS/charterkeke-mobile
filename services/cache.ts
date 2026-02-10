import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheableData, Ride, Transaction, Notification } from '@types/index';
import { STORAGE_KEYS, CACHE_CONFIG } from '@utils/constants';

class CacheService {
  /**
   * Save data with expiry time
   */
  async set<T>(
    key: string,
    data: T,
    expiryMinutes: number = CACHE_CONFIG.expiryMinutes
  ): Promise<void> {
    try {
      const cacheData: CacheableData = {
        data,
        timestamp: Date.now(),
        expiresIn: expiryMinutes * 60 * 1000,
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Get data and check expiry
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      if (!item) return null;

      const cacheData: CacheableData = JSON.parse(item);
      const now = Date.now();
      const isExpired = now - cacheData.timestamp > (cacheData.expiresIn || 0);

      if (isExpired) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return cacheData.data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Remove item from cache
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Merge data (for arrays)
   */
  async merge<T>(key: string, newData: T[], limit: number = 100): Promise<void> {
    try {
      const existing = await this.get<T[]>(key);
      const merged = existing ? [...newData, ...existing] : newData;
      const limited = merged.slice(0, limit);
      await this.set(key, limited);
    } catch (error) {
      console.error('Cache merge error:', error);
    }
  }

  // User Management
  async saveUser(user: any): Promise<void> {
    await this.set(STORAGE_KEYS.USER, user, 1440); // 24 hours
  }

  async getUser(): Promise<any> {
    return this.get(STORAGE_KEYS.USER);
  }

  async clearUser(): Promise<void> {
    await this.remove(STORAGE_KEYS.USER);
  }

  // Rides Management
  async saveRide(ride: Ride, expiryMinutes?: number): Promise<void> {
    const rides = (await this.get<Ride[]>(STORAGE_KEYS.RECENT_RIDES)) || [];
    const updated = [ride, ...rides.filter((r) => r.id !== ride.id)];
    await this.set(STORAGE_KEYS.RECENT_RIDES, updated, expiryMinutes);
  }

  async getRides(): Promise<Ride[]> {
    return (await this.get<Ride[]>(STORAGE_KEYS.RECENT_RIDES)) || [];
  }

  async getRideById(rideId: string): Promise<Ride | null> {
    const rides = await this.getRides();
    return rides.find((r) => r.id === rideId) || null;
  }

  async updateRide(rideId: string, updates: Partial<Ride>): Promise<void> {
    const rides = await this.getRides();
    const updated = rides.map((r) => (r.id === rideId ? { ...r, ...updates } : r));
    await this.set(STORAGE_KEYS.RECENT_RIDES, updated);
  }

  async clearRides(): Promise<void> {
    await this.remove(STORAGE_KEYS.RECENT_RIDES);
  }

  // Location Management
  async saveLastLocation(location: any): Promise<void> {
    await this.set(STORAGE_KEYS.LAST_LOCATION, location, 1440);
  }

  async getLastLocation(): Promise<any> {
    return this.get(STORAGE_KEYS.LAST_LOCATION);
  }

  // Address Caching
  async saveAddress(address: string, coordinates: any): Promise<void> {
    const addresses = (await this.get<any[]>(STORAGE_KEYS.CACHED_ADDRESSES)) || [];
    const exists = addresses.some((a) => a.address === address);
    if (!exists) {
      addresses.push({ address, coordinates, timestamp: Date.now() });
      const limited = addresses.slice(-50); // Keep last 50
      await this.set(STORAGE_KEYS.CACHED_ADDRESSES, limited, 1440);
    }
  }

  async getCachedAddresses(): Promise<any[]> {
    return (await this.get<any[]>(STORAGE_KEYS.CACHED_ADDRESSES)) || [];
  }

  async clearAddressCache(): Promise<void> {
    await this.remove(STORAGE_KEYS.CACHED_ADDRESSES);
  }

  // Sync Queue (for offline-first updates)
  async addToSyncQueue(operation: {
    id: string;
    type: 'create' | 'update' | 'delete';
    endpoint: string;
    payload: any;
    timestamp: number;
  }): Promise<void> {
    const queue = (await this.get<any[]>(STORAGE_KEYS.SYNC_QUEUE)) || [];
    queue.push(operation);
    await this.set(STORAGE_KEYS.SYNC_QUEUE, queue);
  }

  async getSyncQueue(): Promise<any[]> {
    return (await this.get<any[]>(STORAGE_KEYS.SYNC_QUEUE)) || [];
  }

  async removeFromSyncQueue(operationId: string): Promise<void> {
    const queue = (await this.get<any[]>(STORAGE_KEYS.SYNC_QUEUE)) || [];
    const filtered = queue.filter((op) => op.id !== operationId);
    await this.set(STORAGE_KEYS.SYNC_QUEUE, filtered);
  }

  async clearSyncQueue(): Promise<void> {
    await this.remove(STORAGE_KEYS.SYNC_QUEUE);
  }

  // Preferences
  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, theme);
  }

  async getTheme(): Promise<string> {
    return (await AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)) || 'system';
  }

  async setLanguage(language: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }

  async getLanguage(): Promise<string> {
    return (await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE)) || 'en';
  }

  // Device Management
  async setDeviceId(deviceId: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }

  async getDeviceId(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  }

  // Session Management
  async setFirstLaunch(value: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, JSON.stringify(value));
  }

  async isFirstLaunch(): Promise<boolean> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH);
    return value === null || JSON.parse(value);
  }

  // Auth Tokens
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.set(STORAGE_KEYS.AUTH_TOKEN, { accessToken, refreshToken }, 1440);
  }

  async getTokens(): Promise<any> {
    return this.get(STORAGE_KEYS.AUTH_TOKEN);
  }

  async clearTokens(): Promise<void> {
    await this.remove(STORAGE_KEYS.AUTH_TOKEN);
  }

  // Statistics (for analytics)
  async saveAnalytics(key: string, data: any): Promise<void> {
    await this.set(`analytics_${key}`, data);
  }

  async getAnalytics(key: string): Promise<any> {
    return this.get(`analytics_${key}`);
  }

  // Offline support
  async getStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let size = 0;
      for (const key of keys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          size += item.length;
        }
      }
      return size;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  // Debug
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  async getFullCache(): Promise<Record<string, any>> {
    try {
      const keys = await this.getAllKeys();
      const cache: Record<string, any> = {};
      for (const key of keys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          cache[key] = JSON.parse(item);
        }
      }
      return cache;
    } catch (error) {
      console.error('Error getting full cache:', error);
      return {};
    }
  }
}

export const cacheService = new CacheService();
