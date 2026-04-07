/**
 * Geofencing utilities for Charter Keke operational areas
 * Uses point-in-polygon algorithm to validate ride locations
 */

import { OPERATIONAL_AREA_BOUNDARIES } from './constants';
import { Vibration } from 'react-native';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface GeoArea {
  name: string;
  polygon: [number, number][];
  center: [number, number];
  radius: number;
  areaNames: string[];
  zone?: string;
  zoneName?: string;
}

/**
 * Trigger haptic feedback when location is outside service area
 * Provides tactile feedback to user via vibration
 */
export async function triggerOutOfAreaVibration(): Promise<void> {
  try {
    // Pattern: double tap vibration to alert user
    // First vibration for 150ms
    Vibration.vibrate(150);
    // Wait a bit then second vibration
    await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
    Vibration.vibrate(150);
  } catch (error) {
    console.log('Vibration not available or error:', error);
  }
}

/**
 * Point-in-polygon algorithm using ray casting
 * Determines if a point is inside a polygon defined by vertices
 * @param point - [latitude, longitude] to test
 * @param polygon - Array of [latitude, longitude] points forming polygon
 * @returns true if point is inside polygon
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [lat, lng] = point;
  let isInside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[j];

    const isConditionMet =
      lng > Math.min(lng1, lng2) &&
      lng <= Math.max(lng1, lng2) &&
      lat <= Math.max(lat1, lat2) &&
      lng1 !== lng2;

    if (isConditionMet) {
      const slope = ((lng - lng1) * (lat2 - lat1)) / (lng2 - lng1) + lat1;
      if (lat < slope) {
        isInside = !isInside;
      }
    }
  }

  return isInside;
}

/**
 * Calculate distance between two coordinates in kilometers
 * Uses Haversine formula for great-circle distance
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if location is within any operational area
 * @param location - {latitude, longitude} to check
 * @returns Object with isValid, areaName, and areaNames if valid
 */
export function validateLocationInOperationalArea(
  location: Location
): {
  isValid: boolean;
  areaName?: string;
  areaNames?: string[];
  distance?: number;
} {
  const point: [number, number] = [location.latitude, location.longitude];

  // Check each operational area
  for (const [areaKey, area] of Object.entries(OPERATIONAL_AREA_BOUNDARIES)) {
    const polygon = area.polygon as [number, number][];
    if (isPointInPolygon(point, polygon)) {
      return {
        isValid: true,
        areaName: area.name,
        areaNames: area.areaNames,
      };
    }
  }

  // Find closest area for error message
  let closestArea: any = null;
  let minDistance = Infinity;

  for (const area of Object.values(OPERATIONAL_AREA_BOUNDARIES)) {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      area.center[0],
      area.center[1]
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestArea = area;
    }
  }

  // Trigger vibration when out of service
  triggerOutOfAreaVibration();

  return {
    isValid: false,
    areaName: closestArea?.name,
    distance: Math.round(minDistance * 100) / 100, // Round to 2 decimal places
  };
}

/**
 * Get all operational areas with their names
 * @returns Array of area objects with names
 */
export function getAllOperationalAreas() {
  return Object.entries(OPERATIONAL_AREA_BOUNDARIES).map(([key, area]) => ({
    key,
    name: area.name,
    zone: area.zone,
    zoneName: area.zoneName,
    areaNames: area.areaNames,
    center: area.center,
  }));
}

/**
 * Get operational area by coordinate
 * @param location - {latitude, longitude}
 * @returns Area object if found, null otherwise
 */
export function getOperationalAreaByLocation(location: Location): any {
  const point: [number, number] = [location.latitude, location.longitude];

  for (const area of Object.values(OPERATIONAL_AREA_BOUNDARIES)) {
    const polygon = area.polygon as [number, number][];
    if (isPointInPolygon(point, polygon)) {
      return area;
    }
  }

  return null;
}

/**
 * Get all areas within a certain radius of a location (for suggestions)
 * @param location - {latitude, longitude}
 * @param radiusKm - Search radius in kilometers
 * @returns Array of nearby areas
 */
export function getNearbyOperationalAreas(
  location: Location,
  radiusKm: number = 10
) {
  const nearby = [];

  for (const area of Object.values(OPERATIONAL_AREA_BOUNDARIES)) {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      area.center[0],
      area.center[1]
    );

    if (distance <= radiusKm) {
      nearby.push({
        ...area,
        distance: Math.round(distance * 100) / 100,
      });
    }
  }

  // Sort by distance
  return nearby.sort((a, b) => a.distance - b.distance);
}
