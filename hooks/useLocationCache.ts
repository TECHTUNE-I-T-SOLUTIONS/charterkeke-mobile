import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';

interface Ride {
  id: string;
  driver_id?: string;
  pickup_zone: string;
  destination_zone: string;
  fare_amount: number;
  status: string;
  created_at: string;
  completed_at?: string;
  rating?: number;
  drivers?: {
    users: {
      first_name: string;
      last_name: string;
      phone_number?: string;
    };
    average_rating?: number;
  };
  distance_km?: number;
  duration_minutes?: number;
}

interface Notification {
  id: string;
  message: string;
  type?: string;
  created_at: string;
  read: boolean;
  is_read?: boolean;
  title?: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

/**
 * Hook for caching and managing ride history with stale-while-revalidate pattern
 */
export function useRideHistory() {
  const queryClient = useQueryClient();

  return useQuery<Ride[], Error>({
    queryKey: ['rideHistory'],
    queryFn: async () => {
      console.log('🔃 Fetching fresh ride history');
      try {
        const data = await apiService.getRiderRides(50);
        console.log('✅ Ride history fetched:', data);
        return data.rides || [];
      } catch (error) {
        console.error('❌ Error fetching ride history:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: 'always',
  });
}

/**
 * Hook for caching notifications with background refresh
 */
export function useNotifications() {
  const queryClient = useQueryClient();

  return useQuery<Notification[], Error>({
    queryKey: ['notifications'],
    queryFn: async () => {
      console.log('🔃 Fetching fresh notifications');
      try {
        const data = await apiService.getNotifications();
        console.log('✅ Notifications fetched:', data);
        // Handle both direct array and object with notifications property
        return (data?.notifications || data) || [];
      } catch (error: any) {
        // Gracefully handle missing endpoint - return empty array instead of throwing
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          console.warn('⚠️ Notifications endpoint not available (404). Using empty data.');
          return [];
        }
        console.error('❌ Error fetching notifications:', error);
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds - stay fresh to avoid stale notifications
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    refetchInterval: 30000, // Refresh every 30 seconds only if stale
    networkMode: 'always',
    retry: 1, // Only retry once to avoid infinite loops
    retryDelay: 1000, // 1 second delay between retries
  });
}

/**
 * Hook for caching user profile with background refresh
 */
export function useUserProfile() {
  const queryClient = useQueryClient();

  return useQuery<UserProfile, Error>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      console.log('🔃 Fetching fresh user profile');
      try {
        const data = await apiService.getRiderProfile();
        console.log('✅ User profile fetched:', data);
        return data || {};
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: 'always',
  });
}


/**
 * Hook for prefetching data to improve perceived performance
 */
export function usePrefetchData() {
  const queryClient = useQueryClient();

  return {
    prefetchRideHistory: () => {
      queryClient.prefetchQuery<Ride[], Error>({
        queryKey: ['rideHistory'],
        queryFn: async () => {
          try {
            const data = await apiService.getRiderRides(50);
            return data.rides || [];
          } catch (error) {
            console.error('Error prefetching ride history:', error);
            return [];
          }
        },
        staleTime: 5 * 60 * 1000,
      });
    },
    prefetchNotifications: () => {
      queryClient.prefetchQuery<Notification[], Error>({
        queryKey: ['notifications'],
        queryFn: async () => {
          try {
            const data = await apiService.getNotifications();
            return data || [];
          } catch (error) {
            console.error('Error prefetching notifications:', error);
            return [];
          }
        },
        staleTime: 3 * 60 * 1000,
      });
    },
    prefetchUserProfile: () => {
      queryClient.prefetchQuery<UserProfile, Error>({
        queryKey: ['userProfile'],
        queryFn: async () => {
          try {
            const data = await apiService.getRiderProfile();
            return data || {};
          } catch (error) {
            console.error('Error prefetching user profile:', error);
            return {};
          }
        },
        staleTime: 10 * 60 * 1000,
      });
    },
  };
}

/**
 * Invalidate cache to force refresh
 */
export function useInvalidateCache() {
  const queryClient = useQueryClient();

  return {
    invalidateRideHistory: () => {
      queryClient.invalidateQueries({ queryKey: ['rideHistory'] });
    },
    invalidateNotifications: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    invalidateUserProfile: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
}
