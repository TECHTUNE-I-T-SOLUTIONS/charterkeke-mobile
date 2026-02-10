// API Configuration
// For Expo Go on real device: Use your computer's local IP
// Find your IP: Run `ipconfig` on Windows (look for IPv4 Address like 192.168.x.x or 10.x.x.x)
// Then update EXPO_PUBLIC_API_URL in your .env or change the URL below

const getApiUrl = (): string => {
  // Check for explicit environment override first (highest priority)
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('Using API URL from env:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Use the hosted backend on Vercel
  const hostedApiUrl = 'https://charterkeke.vercel.app/api';
  
  console.log('Using hosted API URL:', hostedApiUrl);
  return hostedApiUrl;
};

export const API_CONFIG = {
  url: getApiUrl(),
  timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
  retryAttempts: 3,
  retryDelay: 1000, // ms
};

// Cache Configuration
export const CACHE_CONFIG = {
  expiryMinutes: parseInt(process.env.EXPO_PUBLIC_CACHE_EXPIRY_MINUTES || '30'),
  syncIntervalSeconds: parseInt(process.env.EXPO_PUBLIC_SYNC_INTERVAL_SECONDS || '300'),
};

// Location Configuration
export const LOCATION_CONFIG = {
  accuracy: 100, // meters
  updateInterval: 10000, // 10 seconds while tracking
  fastestInterval: 5000, // 5 seconds
  timeout: 30000, // 30 seconds
  maximumAge: 5000, // 5 seconds
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
  baseFare: 500, // ₦500
  perKmRate: 150, // ₦150 per km
  averageSpeed: 30, // km/h
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
  tokenExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
  refreshThresholdMs: 5 * 60 * 1000, // 5 minutes before expiry
  maxLoginAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  channel: process.env.EXPO_PUBLIC_NOTIFICATION_CHANNEL || 'charter-keke-notifications',
  sounds: ['default'],
  badge: true,
  priority: 'high' as const,
};

// Async Storage Keys
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
};

// Screen Names
export const SCREEN_NAMES = {
  // Auth
  ONBOARDING: 'Onboarding',
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  OTP_VERIFICATION: 'OTPVerification',
  PROFILE_COMPLETION: 'ProfileCompletion',

  // Rider
  RIDER_HOME: 'RiderHome',
  RIDER_BOOKING: 'RiderBooking',
  RIDER_ACTIVE_RIDE: 'RiderActiveRide',
  RIDER_RIDES_HISTORY: 'RiderRidesHistory',
  RIDER_PROFILE: 'RiderProfile',
  RIDER_WALLET: 'RiderWallet',

  // Driver
  DRIVER_HOME: 'DriverHome',
  DRIVER_AVAILABLE_RIDES: 'DriverAvailableRides',
  DRIVER_ACTIVE_RIDE: 'DriverActiveRide',
  DRIVER_EARNINGS: 'DriverEarnings',
  DRIVER_PROFILE: 'DriverProfile',
  DRIVER_WALLET: 'DriverWallet',

  // Common
  SETTINGS: 'Settings',
  NOTIFICATIONS: 'Notifications',
  HELP: 'Help',
  ABOUT: 'About',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_EXISTS: 'Email already registered.',
  PHONE_EXISTS: 'Phone number already registered.',
  INVALID_EMAIL: 'Please enter a valid email.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_PASSWORD: 'Password must be at least 8 characters with upper, lower, and numbers.',
  LOCATION_PERMISSION_DENIED: 'Location permission denied.',
  CAMERA_PERMISSION_DENIED: 'Camera permission denied.',
  STORAGE_PERMISSION_DENIED: 'Storage permission denied.',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
  OTP_INVALID: 'Invalid OTP. Please try again.',
  RIDE_NOT_FOUND: 'Ride not found.',
  NO_DRIVERS_AVAILABLE: 'No drivers available in your area.',
  INSUFFICIENT_BALANCE: 'Insufficient wallet balance.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  SIGNUP_SUCCESSFUL: 'Account created successfully.',
  LOGIN_SUCCESSFUL: 'Logged in successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  RIDE_CREATED: 'Ride created successfully.',
  RIDE_ACCEPTED: 'Ride accepted.',
  RIDE_COMPLETED: 'Ride completed.',
  PAYMENT_SUCCESSFUL: 'Payment successful.',
  PROFILE_PICTURE_UPDATED: 'Profile picture updated.',
};

// Time Constants
export const TIME_CONFIG = {
  OTP_RESEND_DELAY: 60000, // 60 seconds
  RIDE_ACCEPTANCE_TIMEOUT: 60000, // 60 seconds
  LOCATION_UPDATE_INTERVAL: 10000, // 10 seconds
  SYNC_CHECK_INTERVAL: 300000, // 5 minutes
};

// Pagination
export const PAGINATION = {
  PAGE_SIZE: 20,
  INITIAL_PAGE: 1,
};

// Rating Configuration
export const RATING_CONFIG = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  STAR_SIZE: 20,
};

// Debug Configuration
export const DEBUG = {
  ENABLE_LOGS: process.env.NODE_ENV === 'development',
  ENABLE_NETWORK_LOGS: process.env.NODE_ENV === 'development',
};
