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

// Zone Configuration
export const ZONES = {
  DEBARI: { name: 'Debari', code: 'DBR' },
  SHOMOLU: { name: 'Shomolu', code: 'SHO' },
  YABA: { name: 'Yaba', code: 'YAB' },
  IKOYI: { name: 'Ikoyi', code: 'IKO' },
  VI: { name: 'Victoria Island', code: 'VI' },
  LEKKI: { name: 'Lekki', code: 'LEK' },
  IKEJA: { name: 'Ikeja', code: 'IKE' },
  SURULERE: { name: 'Surulere', code: 'SUR' },
};

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
