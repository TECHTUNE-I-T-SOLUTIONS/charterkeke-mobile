// API Configuration
const normalizeApiUrl = (url: string): string => {
  const trimmed = url.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) {
    return trimmed;
  }
  return `${trimmed}/api`;
};

const getApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    const normalized = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
    console.log('Using API URL from env:', normalized);
    return normalized;
  }
  const hostedApiUrl = 'https://charterkeke.vercel.app/api';
  console.log('Using hosted API URL:', hostedApiUrl);
  return hostedApiUrl;
};

export const API_CONFIG = {
  url: getApiUrl(),
  timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
  retryAttempts: 3,
  retryDelay: 1000,
};

// Cache Configuration
export const CACHE_CONFIG = {
  expiryMinutes: parseInt(process.env.EXPO_PUBLIC_CACHE_EXPIRY_MINUTES || '30'),
  syncIntervalSeconds: parseInt(process.env.EXPO_PUBLIC_SYNC_INTERVAL_SECONDS || '300'),
};

// Location Configuration
export const LOCATION_CONFIG = {
  accuracy: 100,
  updateInterval: 10000,
  fastestInterval: 5000,
  timeout: 30000,
  maximumAge: 5000,
};

// Map Configuration
export const MAP_CONFIG = {
  defaultZoom: 14,
  minZoom: 10,
  maxZoom: 18,
  animationDuration: 250,
  tileUrl: process.env.EXPO_PUBLIC_OSM_TILE_URL || 'https://tile.openstreetmap.org',
};

// Ride Configuration
export const RIDE_CONFIG = {
  baseFare: 500,
  perKmRate: 150,
  averageSpeed: 30,
  searchRadiusKm: 15,
  acceptanceTimeoutSeconds: 60,
};

// Zone Configuration with Geofencing Boundaries
export const ZONES = {
  DEBARI: { name: 'Debari', code: 'DBR', center: [9.081999, 8.675277] },
  SHOMOLU: { name: 'Shomolu', code: 'SHO', center: [6.5400, 3.3800] },
  YABA: { name: 'Yaba', code: 'YAB', center: [6.5176, 3.3869] },
  IKOYI: { name: 'Ikoyi', code: 'IKO', center: [6.4541, 3.4360] },
  VI: { name: 'Victoria Island', code: 'VI', center: [6.4281, 3.4216] },
  LEKKI: { name: 'Lekki', code: 'LEK', center: [6.4590, 3.6015] },
  IKEJA: { name: 'Ikeja', code: 'IKE', center: [6.5965, 3.3421] },
  SURULERE: { name: 'Surulere', code: 'SUR', center: [6.5000, 3.3500] },
};

// Operational Area Boundaries - COMPREHENSIVE polygon coordinates (lat, lng) for geofencing
// Covers all sub-areas within each zone with proper geographic boundaries
export const OPERATIONAL_AREA_BOUNDARIES = {
  SHOMOLU: {
    name: 'Shomolu',
    zone: 'SHO',
    zoneName: 'Shomolu',
    areaNames: [
      "Shomolu Roundabout",
      "Palmgrove Bus Stop Axis",
      "Fola Agoro Junction",
      "Bajulaiye Road Area",
      "Pedro Bus Stop",
      "Onipanu Inward Streets",
      "Bariga Road (Shomolu Inward Axis)",
      "Akoka Road Stretch (toward UNILAG back gate)",
      "Lad-Lak Bus Stop Area",
      "Shomolu Local Government Area Axis",
      "Igbobi–Shomolu Link Roads",
      "Shomolu Market Vicinity",
      "Alade Street Cluster",
      "Abiodun Street Cluster",
      "Ilaje Road Extension",
    ],
    // Comprehensive polygon covering all Shomolu sub-areas
    polygon: [
      [6.5600, 3.3600], // Northwest
      [6.5600, 3.4000], // Northeast
      [6.5200, 3.4000], // Southeast
      [6.5200, 3.3600], // Southwest
    ],
    center: [6.5400, 3.3800],
    radius: 6, // km
  },
  IKEJA: {
    name: 'Ikeja',
    zone: 'IKE',
    zoneName: 'Ikeja',
    areaNames: [
      'Ikeja',
      'Allen Avenue',
      'Computer Village',
      'Omole Phase 1',
      'Omole Phase 2',
      'Ogba',
      'Agege',
      'Dopemu',
    ],
    // Comprehensive polygon covering all Ikeja sub-areas
    polygon: [
      [6.6150, 3.3000], // Northwest
      [6.6150, 3.3600], // Northeast
      [6.5750, 3.3600], // Southeast
      [6.5750, 3.3000], // Southwest
    ],
    center: [6.5965, 3.3421],
    radius: 6,
  },
  YABA: {
    name: 'Yaba',
    zone: 'YAB',
    zoneName: 'Yaba',
    areaNames: [
      'Yaba',
      'Ebute Metta',
      'Akoka',
      'University of Lagos',
    ],
    // Comprehensive polygon covering Yaba and surrounding areas
    polygon: [
      [6.5350, 3.3600], // Northwest
      [6.5350, 3.4050], // Northeast
      [6.5000, 3.4050], // Southeast
      [6.5000, 3.3600], // Southwest
    ],
    center: [6.5176, 3.3869],
    radius: 5,
  },
  IKOYI: {
    name: 'Ikoyi',
    zone: 'IKO',
    zoneName: 'Ikoyi',
    areaNames: [
      'Ikoyi',
      'Falomo',
      'Banana Island',
      'Ikoyi Road',
    ],
    // Comprehensive polygon covering Ikoyi
    polygon: [
      [6.4700, 3.4100], // Northwest
      [6.4700, 3.4550], // Northeast
      [6.4350, 3.4550], // Southeast
      [6.4350, 3.4100], // Southwest
    ],
    center: [6.4541, 3.4360],
    radius: 5,
  },
  VI: {
    name: 'Victoria Island',
    zone: 'VI',
    zoneName: 'Victoria Island',
    areaNames: [
      'Victoria Island',
      'Bar Beach',
      'Eko Atlantic',
      'Tafawa Balewa Square',
    ],
    // Comprehensive polygon covering Victoria Island
    polygon: [
      [6.4450, 3.4000], // Northwest
      [6.4450, 3.4450], // Northeast
      [6.4100, 3.4450], // Southeast
      [6.4100, 3.4000], // Southwest
    ],
    center: [6.4281, 3.4216],
    radius: 4,
  },
  LEKKI: {
    name: 'Lekki',
    zone: 'LEK',
    zoneName: 'Lekki',
    areaNames: [
      'Lekki Phase 1',
      'Lekki Phase 2',
      'Lekki Conservation Centre',
      'Ikate',
      'Oniru',
      'Elegushi',
      'Ajah',
      'Sangotedo',
      'Abraham Adesanya',
    ],
    // Comprehensive polygon covering all Lekki areas from Phase 1 to Ajah
    polygon: [
      [6.4750, 3.5800], // Northwest (Lekki Phase 1)
      [6.4750, 3.6300], // Northeast (Ajah)
      [6.4400, 3.6300], // Southeast (Sangotedo)
      [6.4400, 3.5800], // Southwest (Oniru)
    ],
    center: [6.4590, 3.6015],
    radius: 8,
  },
  SURULERE: {
    name: 'Surulere',
    zone: 'SUR',
    zoneName: 'Surulere',
    areaNames: [
      'Surulere',
      'Ojuelegba',
      'Shitta',
      'National Stadium',
      'Ijesha',
    ],
    // Comprehensive polygon covering Surulere
    polygon: [
      [6.5200, 3.3300], // Northwest
      [6.5200, 3.3700], // Northeast
      [6.4800, 3.3700], // Southeast
      [6.4800, 3.3300], // Southwest
    ],
    center: [6.5000, 3.3500],
    radius: 5,
  },
};

// Simplified list of operational areas for reference and UI
export const OPERATIONAL_AREAS = [
  "Shomolu Roundabout",
  "Palmgrove Bus Stop Axis",
  "Fola Agoro Junction",
  "Bajulaiye Road Area",
  "Pedro Bus Stop",
  "Onipanu Inward Streets",
  "Bariga Road (Shomolu Inward Axis)",
  "Akoka Road Stretch (toward UNILAG back gate)",
  "Lad-Lak Bus Stop Area",
  "Shomolu Local Government Area Axis",
  "Igbobi–Shomolu Link Roads",
  "Shomolu Market Vicinity",
  "Alade Street Cluster",
  "Abiodun Street Cluster",
  "Ilaje Road Extension",
];

// Vehicle Types
export const VEHICLE_TYPES = {
  KEKE: { name: 'Keke', code: 'keke', capacity: 3 },
  BIKE: { name: 'Okada', code: 'bike', capacity: 1 },
  CAR: { name: 'Car', code: 'car', capacity: 4 },
};

// Auth Configuration
export const AUTH_CONFIG = {
  tokenExpiryMs: 24 * 60 * 60 * 1000,
  refreshThresholdMs: 5 * 60 * 1000,
  maxLoginAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000,
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  channel: process.env.EXPO_PUBLIC_NOTIFICATION_CHANNEL || 'charter-keke-notifications',
  sounds: ['default'],
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  USER_TYPE: 'user_type',
  DEVICE_ID: 'device_id',
  FIRST_LAUNCH: 'first_launch',
  LAST_LOCATION: 'last_location',
  RECENT_RIDES: 'recent_rides',
  CACHED_ADDRESSES: 'cached_addresses',
  THEME_PREFERENCE: 'theme_preference',
  LANGUAGE: 'language',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
  SYNC_QUEUE: 'sync_queue',
  RIDER_HOME: 'rider_home',
  RIDER_WALLET: 'rider_wallet',
  RIDER_PROFILE: 'rider_profile',
  DRIVER_SETTLEMENT: 'driver_settlement',
  TOKENS: 'tokens',
  RIDES: 'rides',
  TRANSACTIONS: 'transactions',
  NOTIFICATIONS: 'notifications',
  LAST_LOCATION_UPDATE: 'lastLocation',
};
