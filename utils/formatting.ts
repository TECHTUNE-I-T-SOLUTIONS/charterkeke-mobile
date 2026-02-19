import { Location } from '@/types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate estimated fare based on distance
 * Base fare + (distance * per km rate)
 */
export const calculateEstimatedFare = (
  distanceInKm: number,
  baseFare: number = 500, // ₦500
  perKmRate: number = 150 // ₦150 per km
): number => {
  return Math.ceil(baseFare + distanceInKm * perKmRate);
};

/**
 * Estimate ride duration in minutes
 * Average speed: 30 km/h in traffic
 */
export const estimateDuration = (distanceInKm: number, avgSpeed: number = 30): number => {
  return Math.ceil((distanceInKm / avgSpeed) * 60);
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceInKm: number): string => {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)}m`;
  }
  return `${distanceInKm.toFixed(1)}km`;
};

/**
 * Format duration for display
 */
export const formatDuration = (durationInMinutes: number): string => {
  if (durationInMinutes < 60) {
    return `${Math.round(durationInMinutes)}min`;
  }
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  return `${hours}h ${minutes}min`;
};

/**
 * Format currency (Nigerian Naira)
 */
export const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString()}`;
};

/**
 * Format date time
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-NG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format time only
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date only
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-NG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Check if coordinate is valid
 */
export const isValidCoordinate = (location: Location): boolean => {
  return (
    location &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
};

/**
 * Get bearing between two points
 */
export const getBearing = (from: Location, to: Location): number => {
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (Math.atan2(y, x) * 180) / Math.PI;
};

/**
 * Add buffer to bounding box
 */
export const addBufferToRegion = (region: any, bufferPercent: number = 0.1) => {
  const latDelta = region.latitudeDelta * (1 + bufferPercent);
  const lonDelta = region.longitudeDelta * (1 + bufferPercent);

  return {
    ...region,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
};

/**
 * Get bounding box from coordinates
 */
export const getBoundingBox = (coords: Location[]) => {
  if (coords.length === 0) return null;

  const lats = coords.map((c) => c.latitude);
  const lons = coords.map((c) => c.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: maxLat - minLat,
    longitudeDelta: maxLon - minLon,
  };
};
