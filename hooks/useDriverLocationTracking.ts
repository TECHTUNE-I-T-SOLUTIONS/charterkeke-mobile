import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import * as Location from 'expo-location';

interface UseDriverLocationTrackingProps {
  rideId?: string;
  enabled?: boolean;
  intervalMs?: number;
}

/**
 * Hook to track and send driver location updates periodically
 * Only sends location when a ride is active to reduce server costs
 */
export function useDriverLocationTracking({
  rideId,
  enabled = true,
  intervalMs = 30000, // Default: 30 seconds
}: UseDriverLocationTrackingProps) {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only track if user is a driver, ride is active, and tracking is enabled
    if (!enabled || !rideId || user?.role !== 'driver') {
      return;
    }

    const sendLocationUpdate = async () => {
      try {
        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Send to backend
        await apiService.post(`/driver/update-location`, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          rideId,
        });

        console.log('[DriverLocation] Location updated successfully');
      } catch (error) {
        console.error('[DriverLocation] Failed to update location:', error);
      }
    };

    // Send initial location
    sendLocationUpdate();

    // Set up periodic updates
    intervalRef.current = setInterval(sendLocationUpdate, intervalMs);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, rideId, user?.id, user?.role, intervalMs]);

  return {
    isTracking: enabled && !!rideId && user?.role === 'driver',
  };
}
