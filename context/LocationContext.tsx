import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { locationService } from '@services/location';
import { syncService } from '@services/sync';
import { Location, NetworkState } from '@types/index';

interface LocationContextType {
  currentLocation: Location | null;
  lastLocation: Location | null;
  isTracking: boolean;
  networkState: NetworkState;
  error: string | null;
  startTracking: (rideId: string) => Promise<void>;
  stopTracking: () => Promise<void>;
  getCurrentLocation: () => Promise<Location | null>;
  geocodeAddress: (address: string) => Promise<Location | null>;
  reverseGeocodeLocation: (location: Location) => Promise<string | null>;
  watchLocation: (callback: (location: Location) => void) => Promise<() => void>;
  hasLocationPermission: () => Promise<boolean>;
  requestLocationPermission: () => Promise<boolean>;
  clearError: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [lastLocation, setLastLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });
  const [error, setError] = useState<string | null>(null);

  // Initialize location permissions and network state
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // Request location permissions first
        const hasPermission = await locationService.requestPermissions();
        
        if (!hasPermission) {
          // Silently fail if permissions are denied - user will be prompted again when needed
          console.warn('Location permissions denied by user');
          return;
        }

        // Get current location
        const location = await locationService.getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
          setLastLocation(location);
        }

        // Check network state
        const netInfo = await NetInfo.fetch();
        setNetworkState({
          isConnected: netInfo.isConnected || false,
          isInternetReachable: netInfo.isInternetReachable || false,
          type: netInfo.type || 'unknown',
        });
      } catch (err) {
        console.error('Location initialization error:', err);
        // Don't set error state here - location is optional
      }
    };

    initializeLocation();
  }, []);

  // Listen to network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: state.isConnected || false,
        isInternetReachable: state.isInternetReachable || false,
        type: state.type || 'unknown',
      });

      // Handle sync on network reconnection
      if (state.isConnected && !networkState.isConnected) {
        syncService.sync();
      }
    });

    return () => unsubscribe();
  }, [networkState.isConnected]);

  const handleStartTracking = async (rideId: string) => {
    try {
      setError(null);
      const hasPermission = await locationService.hasLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      await locationService.startLocationTracking(rideId);
      setIsTracking(true);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to start tracking';
      setError(errorMessage);
      throw err;
    }
  };

  const handleStopTracking = async () => {
    try {
      setError(null);
      await locationService.stopLocationTracking();
      setIsTracking(false);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to stop tracking';
      setError(errorMessage);
      throw err;
    }
  };

  const handleGetCurrentLocation = async (): Promise<Location | null> => {
    try {
      setError(null);
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
      }
      return location;
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to get location';
      setError(errorMessage);
      throw err;
    }
  };

  const handleGeocodeAddress = async (address: string): Promise<Location | null> => {
    try {
      setError(null);
      const location = await locationService.geocodeAddress(address);
      return location;
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to geocode address';
      setError(errorMessage);
      throw err;
    }
  };

  const handleReverseGeocodeLocation = async (location: Location): Promise<string | null> => {
    try {
      setError(null);
      const address = await locationService.reverseGeocodeLocation(location);
      return address;
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to reverse geocode';
      setError(errorMessage);
      throw err;
    }
  };

  const handleWatchLocation = async (
    callback: (location: Location) => void
  ): Promise<() => void> => {
    try {
      setError(null);
      const unwatch = await locationService.watchLocation((location) => {
        setCurrentLocation(location);
        callback(location);
      });
      return unwatch;
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to watch location';
      setError(errorMessage);
      throw err;
    }
  };

  const handleHasLocationPermission = async (): Promise<boolean> => {
    try {
      return await locationService.hasLocationPermission();
    } catch (err) {
      console.error('Error checking permission:', err);
      return false;
    }
  };

  const handleRequestLocationPermission = async (): Promise<boolean> => {
    try {
      setError(null);
      return await locationService.requestPermissions();
    } catch (err) {
      const errorMessage = (err as Error).message || 'Permission request failed';
      setError(errorMessage);
      return false;
    }
  };

  const handleClearError = () => {
    setError(null);
  };

  const value: LocationContextType = {
    currentLocation,
    lastLocation,
    isTracking,
    networkState,
    error,
    startTracking: handleStartTracking,
    stopTracking: handleStopTracking,
    getCurrentLocation: handleGetCurrentLocation,
    geocodeAddress: handleGeocodeAddress,
    reverseGeocodeLocation: handleReverseGeocodeLocation,
    watchLocation: handleWatchLocation,
    hasLocationPermission: handleHasLocationPermission,
    requestLocationPermission: handleRequestLocationPermission,
    clearError: handleClearError,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};
