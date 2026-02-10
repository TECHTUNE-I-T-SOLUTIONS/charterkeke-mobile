import React, { createContext, useContext, useState, ReactNode } from 'react';
import { apiService } from '@services/api';
import { cacheService } from '@services/cache';
import { syncService } from '@services/sync';
import { Ride, RideRequest, Review } from '@types/index';

interface RideContextType {
  currentRide: Ride | null;
  recentRides: Ride[];
  availableRides: Ride[];
  isLoading: boolean;
  error: string | null;
  createRide: (rideRequest: RideRequest) => Promise<Ride>;
  acceptRide: (rideId: string) => Promise<Ride>;
  cancelRide: (rideId: string, reason?: string) => Promise<void>;
  completeRide: (rideId: string) => Promise<Ride>;
  getRideDetails: (rideId: string) => Promise<Ride>;
  getAvailableRides: (latitude: number, longitude: number) => Promise<Ride[]>;
  getRideHistory: (page?: number) => Promise<Ride[]>;
  submitRating: (rideId: string, rating: number, review?: string) => Promise<void>;
  setCurrentRide: (ride: Ride | null) => void;
  clearError: () => void;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRide, setCurrentRideState] = useState<Ride | null>(null);
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRide = async (rideRequest: RideRequest): Promise<Ride> => {
    try {
      setError(null);
      setIsLoading(true);
      const ride = await apiService.createRide(rideRequest);
      await cacheService.saveRide(ride);
      setCurrentRideState(ride);
      return ride;
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to create ride';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRide = async (rideId: string): Promise<Ride> => {
    try {
      setError(null);
      setIsLoading(true);
      const ride = await apiService.acceptRide(rideId);
      await cacheService.saveRide(ride);
      setCurrentRideState(ride);
      return ride;
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to accept ride';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRide = async (rideId: string, reason?: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      await apiService.cancelRide(rideId, reason);
      await cacheService.remove(`ride_${rideId}`);
      if (currentRide?.id === rideId) {
        setCurrentRideState(null);
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to cancel ride';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRide = async (rideId: string): Promise<Ride> => {
    try {
      setError(null);
      setIsLoading(true);
      const updates = { status: 'completed', endTime: new Date().toISOString() };
      const ride = await apiService.updateRide(rideId, updates);
      await cacheService.saveRide(ride);
      if (currentRide?.id === rideId) {
        setCurrentRideState(ride);
      }
      return ride;
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to complete ride';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRideDetails = async (rideId: string): Promise<Ride> => {
    try {
      setError(null);
      setIsLoading(true);

      // Try cache first
      const cachedRide = await cacheService.getRideById(rideId);
      if (cachedRide) {
        return cachedRide;
      }

      // Fetch from API
      const ride = await apiService.getRide(rideId);
      await cacheService.saveRide(ride);
      return ride;
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to get ride details';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAvailableRides = async (
    latitude: number,
    longitude: number
  ): Promise<Ride[]> => {
    try {
      setError(null);
      setIsLoading(true);
      const rides = await apiService.getAvailableRides(latitude, longitude);
      setAvailableRides(rides);
      return rides;
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to get available rides';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRideHistory = async (page: number = 1): Promise<Ride[]> => {
    try {
      setError(null);
      setIsLoading(true);
      const rides = await apiService.getRiderRides(page);
      setRecentRides(rides);

      // Cache rides
      for (const ride of rides) {
        await cacheService.saveRide(ride);
      }

      return rides;
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to get ride history';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRating = async (
    rideId: string,
    rating: number,
    review?: string
  ): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      await apiService.submitRating(rideId, rating, review);

      // Update cached ride
      await cacheService.updateRide(rideId, { rating, review });
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to submit rating';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetCurrentRide = (ride: Ride | null) => {
    setCurrentRideState(ride);
  };

  const handleClearError = () => {
    setError(null);
  };

  const value: RideContextType = {
    currentRide,
    recentRides,
    availableRides,
    isLoading,
    error,
    createRide: handleCreateRide,
    acceptRide: handleAcceptRide,
    cancelRide: handleCancelRide,
    completeRide: handleCompleteRide,
    getRideDetails: handleGetRideDetails,
    getAvailableRides: handleGetAvailableRides,
    getRideHistory: handleGetRideHistory,
    submitRating: handleSubmitRating,
    setCurrentRide: handleSetCurrentRide,
    clearError: handleClearError,
  };

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within RideProvider');
  }
  return context;
};
