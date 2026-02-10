import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import NetInfo from '@react-native-community/netinfo';
import { Location as LocationType, LocationUpdate } from '@types/index';
import { LOCATION_CONFIG } from '@utils/constants';
import { apiService } from './api';
import { cacheService } from './cache';

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';

class LocationService {
  private isTracking = false;
  private updateInterval: NodeJS.Timer | null = null;
  private currentLocation: LocationType | null = null;

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      return backgroundStatus === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Get current location once
   */
  async getCurrentLocation(): Promise<LocationType | null> {
    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        mayShowUserSettingsDialog: true,
      });

      const locationData: LocationType = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude || 0,
        heading: location.coords.heading || 0,
        speed: location.coords.speed || 0,
        timestamp: location.timestamp,
      };

      this.currentLocation = locationData;
      await cacheService.saveLastLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Start background location updates
   */
  async startLocationTracking(rideId: string): Promise<void> {
    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      // Define the background task
      TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
        if (error) {
          console.error('Location task error:', error);
          return;
        }

        if (data) {
          const { locations } = data as any;
          for (const location of locations) {
            const locationUpdate: LocationUpdate = {
              rideId,
              location: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy || 0,
                altitude: location.coords.altitude || 0,
                heading: location.coords.heading || 0,
                speed: location.coords.speed || 0,
                timestamp: location.timestamp,
              },
            };

            // Try to sync with backend
            const netInfo = await NetInfo.fetch();
            if (netInfo.isConnected) {
              try {
                await apiService.postLocation(rideId, locationUpdate.location);
              } catch (error) {
                // Add to sync queue if failed
                await cacheService.addToSyncQueue({
                  id: `location_${Date.now()}`,
                  type: 'create',
                  endpoint: '/api/ride-location',
                  payload: locationUpdate,
                  timestamp: Date.now(),
                });
              }
            } else {
              // Add to sync queue if offline
              await cacheService.addToSyncQueue({
                id: `location_${Date.now()}`,
                type: 'create',
                endpoint: '/api/ride-location',
                payload: locationUpdate,
                timestamp: Date.now(),
              });
            }
          }
        }
      });

      // Start background updates
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: LOCATION_CONFIG.accuracy,
        timeInterval: LOCATION_CONFIG.updateInterval,
        distanceInterval: 10, // meters
        foregroundService: {
          notificationTitle: 'Charter Keke',
          notificationBody: 'Tracking your location',
          notificationColor: '#1a1a1a',
        },
      });

      this.isTracking = true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  /**
   * Stop background location tracking
   */
  async stopLocationTracking(): Promise<void> {
    try {
      const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (isTaskDefined) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      this.isTracking = false;
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  /**
   * Start foreground location updates (more frequent)
   */
  async startForegroundTracking(callback: (location: LocationType) => void): Promise<void> {
    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      this.updateInterval = setInterval(async () => {
        const location = await this.getCurrentLocation();
        if (location) {
          callback(location);
        }
      }, LOCATION_CONFIG.updateInterval);

      this.isTracking = true;
    } catch (error) {
      console.error('Error starting foreground tracking:', error);
      throw error;
    }
  }

  /**
   * Stop foreground location tracking
   */
  stopForegroundTracking(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isTracking = false;
  }

  /**
   * Check if location permission is granted
   */
  async hasLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * Watch location changes (for live tracking)
   */
  async watchLocation(callback: (location: LocationType) => void): Promise<() => void> {
    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_CONFIG.updateInterval,
          distanceInterval: 10, // meters
        },
        (location) => {
          const locationData: LocationType = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            altitude: location.coords.altitude || 0,
            heading: location.coords.heading || 0,
            speed: location.coords.speed || 0,
            timestamp: location.timestamp,
          };
          callback(locationData);
        }
      );

      // Return unsubscribe function
      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('Error watching location:', error);
      throw error;
    }
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<LocationType | null> {
    try {
      const results = await Location.geocodeAsync(address);
      if (results.length === 0) {
        return null;
      }

      const firstResult = results[0];
      return {
        latitude: firstResult.latitude,
        longitude: firstResult.longitude,
        accuracy: 0,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocodeLocation(location: LocationType): Promise<string | null> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      if (results.length === 0) {
        return null;
      }

      const result = results[0];
      const addressParts = [
        result.name,
        result.street,
        result.postalCode,
        result.city,
        result.region,
      ];

      return addressParts.filter(Boolean).join(', ');
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Get last known location
   */
  async getLastKnownLocation(): Promise<LocationType | null> {
    try {
      const location = await Location.getLastKnownPositionAsync();
      if (!location) {
        return null;
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude || 0,
        heading: location.coords.heading || 0,
        speed: location.coords.speed || 0,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting last known location:', error);
      return null;
    }
  }

  /**
   * Check if tracking is active
   */
  isLocationTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Get current cached location
   */
  getLastLocation(): LocationType | null {
    return this.currentLocation;
  }
}

export const locationService = new LocationService();
