import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LOCATION_CONFIG } from '@utils/constants';
import { cacheService } from './cache';

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';

class LocationService {
  private isTracking = false;
  private currentLocation: any = null;

  private normalizeLocation(location: Location.LocationObject) {
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || 0,
      altitude: location.coords.altitude || 0,
      timestamp: location.timestamp,
    };
  }

  private chooseBestLocation(locations: Location.LocationObject[]) {
    return locations
      .filter(Boolean)
      .sort((a, b) => {
        const accuracyA = a.coords.accuracy ?? Number.MAX_SAFE_INTEGER;
        const accuracyB = b.coords.accuracy ?? Number.MAX_SAFE_INTEGER;
        if (accuracyA !== accuracyB) return accuracyA - accuracyB;
        return b.timestamp - a.timestamp;
      })[0] || null;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        return false;
      }

      // Background access is only needed for ride tracking, not basic app location reads.
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<any> {
    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      let location: Location.LocationObject | null = null;
      let bestAccuracy = Infinity;
      let bestLocation: Location.LocationObject | null = null;

      // Try multiple approaches to get the best accuracy
      try {
        // Approach 1: Use watchPosition to sample multiple fixes and choose the best
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 500, // Sample every 500ms for faster convergence
            distanceInterval: 0,
          },
          (loc) => {
            const currentAccuracy = loc.coords.accuracy ?? Infinity;
            if (currentAccuracy < bestAccuracy) {
              bestAccuracy = currentAccuracy;
              bestLocation = loc;
              console.log('New best location found with accuracy:', currentAccuracy, 'meters');
              
              // If we get a very accurate reading, stop watching
              if (currentAccuracy <= 15) {
                subscription.remove();
              }
            }
          }
        );

        // Wait for at most 8 seconds to get a good fix (longer for better accuracy)
        await new Promise((resolve) => setTimeout(() => resolve(undefined), 8000));
        subscription.remove();

        if (bestLocation && bestAccuracy <= 50) {
          location = bestLocation;
          console.log('Using best sampled location with accuracy:', bestAccuracy, 'meters');
        }
      } catch (watchError) {
        console.warn('Watch position failed, falling back to single fetch:', watchError);
      }

      // Approach 2: Single high-accuracy fetch if watch didn't work well
      if (!location || bestAccuracy > 50) {
        try {
          const samples = await Promise.allSettled([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.BestForNavigation,
              mayShowUserSettingsDialog: true,
            }),
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Highest,
              mayShowUserSettingsDialog: true,
            }),
          ]);
          location = this.chooseBestLocation(
            samples
              .filter((sample): sample is PromiseFulfilledResult<Location.LocationObject> => sample.status === 'fulfilled')
              .map((sample) => sample.value)
          );
          
          if (location) {
            console.log('Using single fetch location with accuracy:', location.coords.accuracy, 'meters');
          }
        } catch (primaryError) {
          console.warn('High accuracy location fetch failed, trying balanced accuracy:', primaryError);
          try {
            location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
              mayShowUserSettingsDialog: true,
            });
          } catch (secondaryError) {
            console.warn('Balanced location fetch failed, falling back to recent last known position:', secondaryError);
            location = await Location.getLastKnownPositionAsync({
              maxAge: 15_000,
              requiredAccuracy: 100,
            });
          }
        }
      }

      if (!location) {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          throw new Error('Location services are disabled on this device.');
        }
        return null;
      }

      const locationData = this.normalizeLocation(location);
      
      // Check if accuracy is acceptable
      const accuracy = location.coords.accuracy ?? 0;
      if (accuracy > 100) {
        console.warn('Location accuracy is poor:', accuracy, 'meters. This may affect address resolution.');
      }

      this.currentLocation = locationData;
      await cacheService.saveLastLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startLocationTracking(rideId?: string): Promise<void> {
    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      this.isTracking = true;

      if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
        TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
          if (error) {
            console.error('Location task error:', error);
            return;
          }

          if (data) {
            const { locations } = data as any;
            for (const location of locations) {
              const locationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy || 0,
                timestamp: location.timestamp,
              };
              this.currentLocation = locationData;
            }
          }
        });
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: LOCATION_CONFIG.updateInterval,
        distanceInterval: 10,
      });

      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.isTracking = false;
    }
  }

  async stopLocationTracking(): Promise<void> {
    try {
      if (TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      this.isTracking = false;
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  private async hasLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  getCurrentLocationData(): any {
    return this.currentLocation;
  }

  isLocationTracking(): boolean {
    return this.isTracking;
  }

  // Public method to check permission
  async checkLocationPermission(): Promise<boolean> {
    return this.hasLocationPermission();
  }

  async geocodeAddress(address: string): Promise<any> {
    try {
      const result = await Location.geocodeAsync(address);
      if (result.length > 0) {
        return {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
          address,
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async reverseGeocodeLocation(location: { latitude: number; longitude: number }): Promise<string | null> {
    try {
      // Try backend API first (uses LocationIQ for better addresses)
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.198.143:3000';
      // Remove /api from the end if it exists to avoid double /api
      const cleanApiUrl = apiUrl.replace(/\/api$/, '');
      const response = await fetch(
        `${cleanApiUrl}/api/location/reverse-geocode?lat=${location.latitude}&lon=${location.longitude}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.address && data.success) {
          console.log('Using backend reverse geocoding result:', data.address);
          return data.address;
        }
      } else {
        console.warn('Backend reverse geocoding returned non-OK status:', response.status);
      }
    } catch (apiError) {
      console.warn('Backend reverse geocoding failed, using fallback:', apiError);
    }

    // Fallback to Expo's reverse geocoding
    try {
      const result = await Location.reverseGeocodeAsync(location);
      if (result.length > 0) {
        const addr = result[0];
        const parts = [
          addr.name,
          addr.street,
          addr.district,
          addr.city,
          addr.region,
          addr.postalCode,
          addr.country,
        ]
          .map((part) => String(part || '').trim())
          .filter(Boolean);
        const fallbackAddress = parts.join(', ');
        console.log('Using fallback reverse geocoding result:', fallbackAddress);
        return fallbackAddress;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  async watchLocation(callback: (location: any) => void): Promise<() => void> {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (location) => {
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            altitude: location.coords.altitude || 0,
            timestamp: location.timestamp,
          };
          callback(locationData);
        }
      );

      // Return unwatch function
      return () => subscription.remove();
    } catch (error) {
      console.error('Watch location error:', error);
      return () => {};
    }
  }
}

export const locationService = new LocationService();
