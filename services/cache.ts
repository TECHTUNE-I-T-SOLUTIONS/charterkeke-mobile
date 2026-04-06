import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_CONFIG } from '@utils/constants';

interface CacheableData {
  data: any;
  timestamp: number;
  expiresIn: number;
}

class CacheService {
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

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // User Management
  async saveUser(user: any): Promise<void> {
    await this.set('user', user, 1440);
  }

  async getUser(): Promise<any> {
    return this.get('user');
  }

  async clearUser(): Promise<void> {
    await this.remove('user');
  }

  // Last Location
  async saveLastLocation(location: any): Promise<void> {
    await this.set('lastLocation', location, 24 * 60);
  }

  async getLastLocation(): Promise<any> {
    return this.get('lastLocation');
  }

  // Sync Queue
  async addToSyncQueue(operation: any): Promise<void> {
    const queue = (await this.get<any[]>('syncQueue')) || [];
    queue.push({ ...operation, id: Date.now().toString() });
    await this.set('syncQueue', queue, 24 * 60);
  }

  async getSyncQueue(): Promise<any[]> {
    return (await this.get('syncQueue')) || [];
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const queue = (await this.get<any[]>('syncQueue')) || [];
    const filtered = queue.filter((item) => item.id !== id);
    await this.set('syncQueue', filtered, 24 * 60);
  }

  // Ride Management
  async saveRide(ride: any): Promise<void> {
    await this.set(`ride:${ride.id}`, ride, 24 * 60);
    // Also update rides list
    const ridesList = (await this.get<any[]>('ridesList')) || [];
    const existingIndex = ridesList.findIndex(r => r.id === ride.id);
    if (existingIndex >= 0) {
      ridesList[existingIndex] = ride;
    } else {
      ridesList.push(ride);
    }
    await this.set('ridesList', ridesList, 24 * 60);
  }

  async getRideById(rideId: string): Promise<any> {
    return this.get(`ride:${rideId}`);
  }

  async updateRide(rideId: string, updates: any): Promise<void> {
    const ride = await this.getRideById(rideId);
    if (ride) {
      const updated = { ...ride, ...updates };
      await this.saveRide(updated);
    }
  }

  async getRidesList(): Promise<any[]> {
    return (await this.get('ridesList')) || [];
  }
}

export const cacheService = new CacheService();
