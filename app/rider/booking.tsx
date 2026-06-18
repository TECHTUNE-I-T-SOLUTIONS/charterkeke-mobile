
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Voice from '@react-native-voice/voice';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { sendLocalNotification } from '@/services/notificationService';
import {
  BOOKING_PRICING,
  BookingPricingConfig,
  calculateKekeDurationMinutes,
  calculateRideFare,
  getBookingPricingConfig,
  roundDistanceKm,
} from '@/services/bookingService';
import { createRideBooking } from '@/services/ridesService';
import { BRAND, COLORS } from '@/utils/colors';
import { bookingStyles, mapDarkStyle } from './booking.styles';
import { ErrorDialog } from '@/components/ErrorDialog';
import { SuccessDialog } from '@/components/SuccessDialog';
import { OperationalAreasModal } from '@/components/OperationalAreasModal';
import { OutOfServiceAreaModal } from '@/components/OutOfServiceAreaModal';
import { PickupTimeModal } from '@/components/PickupTimeModal';
import AlertDialog from '@/components/ui/AlertDialog';
import { TourTarget, useGuidedTour } from '@/components/GuidedTour';
import { BookingLocationField } from '@/components/booking/BookingLocationField';
import { BookingStepPanel } from '@/components/booking/BookingStepPanel';
import { BookingFareSummary } from '@/components/booking/BookingFareSummary';
import { BookingReviewCard } from '@/components/booking/BookingReviewCard';
import { BookingSearchResultsList } from '@/components/booking/BookingSearchResultsList';
import { WidgetStorage, WIDGET_STORAGE_KEYS } from '@/services/widgetStorage';
import {
  validateLocationInOperationalArea,
  getNearbyOperationalAreas,
  getOperationalAreaByLocation,
} from '@/utils/geofencing';
import { fetchMapboxRoute } from '@/utils/mapboxDirections';
import {
  getGooglePlaceDetails,
  LocationSearchResult,
  markSearchLocationUsed,
  reverseGeocodeWithGooglePlaces,
  saveSearchLocationsToCache,
  searchLagosPlaces,
} from '@/utils/googlePlacesSearch';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// const DRIVER_COMMISSION_PERCENTAGE = 0.85;

// Storage keys
const RECENT_SEARCHES_KEY = '@charter_keke_recent_searches';
const RECENT_LOCATIONS_KEY = '@charter_keke_recent_locations';
const RECENT_ROUTES_KEY = '@charter_keke_recent_routes';
const MAX_RECENT_ITEMS = 5;
const PREWARMED_LOCATION_MAX_AGE_MS = 2 * 60 * 1000;
type BookingStep = 'pickup' | 'destination' | 'time' | 'review';

// Expanded Lagos locations database with diverse areas
const MOCK_LOCATIONS = [
  // Island Areas
  { address: 'Victoria Island, Lagos', lat: 6.4344, lng: 3.4277 },
  { address: 'Bar Beach, Victoria Island', lat: 6.4281, lng: 3.4219 },
  { address: 'Ikoyi, Lagos', lat: 6.4432, lng: 3.4233 },
  { address: 'Lekki Phase 1, Lagos', lat: 6.4474, lng: 3.4746 },
  { address: 'Lekki Phase 2, Lagos', lat: 6.4474, lng: 3.5308 },
  { address: 'Ajah, Lagos', lat: 6.4674, lng: 3.5642 },
  { address: 'Eko Atlantic City, Lagos', lat: 6.4131, lng: 3.4060 },
  { address: 'Falomo, Ikoyi', lat: 6.4518, lng: 3.4325 },
  { address: 'Banana Island, Lagos', lat: 6.4281, lng: 3.4336 },
  { address: 'Oniru, Lekki', lat: 6.4448, lng: 3.4324 },
  { address: 'Ikate, Lekki', lat: 6.4422, lng: 3.4832 },
  { address: 'Elegushi Beach, Lekki', lat: 6.4479, lng: 3.5046 },
  { address: 'Abraham Adesanya, Ajah', lat: 6.4692, lng: 3.5760 },
  { address: 'Sangotedo, Ajah', lat: 6.4618, lng: 3.6134 },
  
  // Mainland - Central
  { address: 'Yaba, Lagos', lat: 6.5047, lng: 3.3779 },
  { address: 'Ebute Metta, Lagos', lat: 6.4889, lng: 3.3715 },
  { address: 'Surulere, Lagos', lat: 6.4989, lng: 3.3532 },
  { address: 'Ojuelegba, Surulere', lat: 6.5057, lng: 3.3640 },
  { address: 'Shitta, Surulere', lat: 6.4943, lng: 3.3522 },
  { address: 'Debari, Lagos', lat: 6.543230934056443, lng: 3.370394035179976 },
  { address: 'Debari Junction, Lagos', lat: 6.5441, lng: 3.3698 },
  { address: 'Debari Street, Lagos', lat: 6.5425, lng: 3.3712 },
  { address: 'Debari Axis, Lagos', lat: 6.5452, lng: 3.3721 },
  { address: 'Debari Market, Lagos', lat: 6.5419, lng: 3.3692 },
  { address: 'Debari Surroundings, Lagos', lat: 6.5438, lng: 3.3679 },
  { address: 'Mushin, Lagos', lat: 6.5291, lng: 3.3433 },
  { address: 'Idi Araba, Mushin', lat: 6.5366, lng: 3.3494 },
  { address: 'Oshodi, Lagos', lat: 6.5485, lng: 3.3293 },
  { address: 'Isolo, Lagos', lat: 6.5370, lng: 3.3438 },
  { address: 'Ojota, Lagos', lat: 6.5704, lng: 3.3780 },
  { address: 'Maryland, Lagos', lat: 6.5679, lng: 3.3672 },
  { address: 'Anthony Village, Lagos', lat: 6.5522, lng: 3.3628 },
  { address: 'Gbagada, Lagos', lat: 6.5599, lng: 3.3895 },
  { address: 'Shomolu, Lagos', lat: 6.5391, lng: 3.3844 },
  { address: 'Bariga, Lagos', lat: 6.5378, lng: 3.3899 },
  { address: 'Akoka, Lagos', lat: 6.5241, lng: 3.3913 },
  
  // Mainland - West
  { address: 'Ikeja, Lagos', lat: 6.5964, lng: 3.3421 },
  { address: 'Allen Avenue, Ikeja', lat: 6.6006, lng: 3.3545 },
  { address: 'Computer Village, Ikeja', lat: 6.5986, lng: 3.3472 },
  { address: 'Omole Phase 1, Lagos', lat: 6.6392, lng: 3.3232 },
  { address: 'Omole Phase 2, Lagos', lat: 6.6472, lng: 3.3121 },
  { address: 'Ogba, Lagos', lat: 6.6264, lng: 3.3421 },
  { address: 'Agege, Lagos', lat: 6.6158, lng: 3.3152 },
  { address: 'Dopemu, Agege', lat: 6.6256, lng: 3.3062 },
  { address: 'Abule Egba, Lagos', lat: 6.6502, lng: 3.2698 },
  { address: 'Iyana Ipaja, Lagos', lat: 6.6188, lng: 3.2586 },
  { address: 'Egbeda, Lagos', lat: 6.5715, lng: 3.2793 },
  { address: 'Ikotun, Lagos', lat: 6.5488, lng: 3.2681 },
  { address: 'Ejigbo, Lagos', lat: 6.5559, lng: 3.3069 },
  { address: 'Idimu, Lagos', lat: 6.6000, lng: 3.2584 },
  
  // Mainland - North
  { address: 'Alimosho, Lagos', lat: 6.6029, lng: 3.2619 },
  { address: 'Ayobo, Lagos', lat: 6.6115, lng: 3.2186 },
  { address: 'Ipaja, Lagos', lat: 6.5733, lng: 3.2579 },
  { address: 'Command, Ipaja', lat: 6.5890, lng: 3.2463 },
  
  // Mainland - South
  { address: 'Kosofe, Lagos', lat: 6.6042, lng: 3.4969 },
  { address: 'Ketu, Lagos', lat: 6.5958, lng: 3.3878 },
  { address: 'Mile 12, Lagos', lat: 6.6158, lng: 3.3869 },
  { address: 'Ikorodu, Lagos', lat: 6.6195, lng: 3.5070 },
  { address: 'Ikorodu Garage, Lagos', lat: 6.6147, lng: 3.5120 },
  { address: 'Owutu, Ikorodu', lat: 6.6397, lng: 3.4728 },
  
  // Mainland - East
  { address: 'Festac Town, Lagos', lat: 6.4648, lng: 3.2808 },
  { address: 'Amuwo Odofin, Lagos', lat: 6.4486, lng: 3.2811 },
  { address: 'Mile 2, Lagos', lat: 6.4583, lng: 3.3188 },
  { address: 'Orile, Lagos', lat: 6.4836, lng: 3.3299 },
  { address: 'Ijesha, Surulere', lat: 6.5096, lng: 3.3414 },
  { address: 'Apapa, Lagos', lat: 6.4493, lng: 3.3594 },
  { address: 'Tin Can Island, Lagos', lat: 6.4538, lng: 3.3463 },
  
  // Outside Lagos Mainland
  { address: 'Epe, Lagos', lat: 6.5847, lng: 3.9942 },
  { address: 'Badagry, Lagos', lat: 6.4219, lng: 2.8992 },
  
  // Key Landmarks & Transportation
  { address: 'Murtala Muhammed Airport, Lagos', lat: 6.5769, lng: 3.3215 },
  { address: 'Lagos Airport Departure, MMIA', lat: 6.5783, lng: 3.3215 },
  { address: 'Tafawa Balewa Square, Lagos Island', lat: 6.4474, lng: 3.3963 },
  { address: 'National Theatre, Iganmu', lat: 6.4824, lng: 3.3575 },
  { address: 'Eko Bridge, Lagos', lat: 6.4642, lng: 3.3768 },
  { address: 'Third Mainland Bridge, Lagos', lat: 6.5129, lng: 3.3992 },
  { address: 'Lagos Lagoon Front', lat: 6.4474, lng: 3.4234 },
  { address: 'University of Lagos (UNILAG)', lat: 6.5158, lng: 3.3894 },
  { address: 'Lekki Conservation Centre', lat: 6.4424, lng: 3.5178 },
  { address: 'Nike Art Gallery, Lekki', lat: 6.4462, lng: 3.5322 },
];

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface SearchResult {
  address: string;
  lat: number | null;
  lng: number | null;
  placeId?: string;
  name?: string;
  source?: 'cache' | 'google' | 'local' | 'recent';
  isRecent?: boolean;
}

interface RecentLocation {
  address: string;
  lat: number;
  lng: number;
  timestamp: number;
}

interface RecentRoute {
  pickup: Location;
  dropoff: Location;
  distanceKm: number;
  durationMinutes: number;
  fare: number;
  timestamp: number;
  pickupTime?: string | null;
  source?: 'history' | 'cache';
}

type RideHistoryRouteSource = {
  id?: string;
  pickup_zone?: string;
  destination_zone?: string;
  fare_amount?: number | string | null;
  distance_km?: number | string | null;
  duration_minutes?: number | string | null;
  pickup_time?: string | null;
  created_at?: string | null;
  pickup_description?: string | null;
  destination_description?: string | null;
  pickup_latitude?: number | string | null;
  pickup_longitude?: number | string | null;
  destination_latitude?: number | string | null;
  destination_longitude?: number | string | null;
  dropoff_latitude?: number | string | null;
  dropoff_longitude?: number | string | null;
  pickup_location?: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null;
  destination_location?: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null;
  dropoff_location?: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null;
};

interface PrewarmedCurrentLocation {
  raw: { latitude: number; longitude: number };
  resolved: LocationSearchResult;
  location: Location;
  timestamp: number;
}

// Utility function to sanitize addresses
const sanitizeAddress = (address: string): string => {
  if (!address) return '';
  return address.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
};

const formatPickupTimeLabel = (pickupTime: string): string => {
  const normalized = pickupTime.includes('T') ? pickupTime : pickupTime.replace(' ', 'T');
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return pickupTime;
  }

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const dayLabel = date.toDateString() === today.toDateString()
    ? 'Today'
    : date.toDateString() === tomorrow.toDateString()
      ? 'Tomorrow'
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return `${dayLabel}, ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
};

// --- HELPER FUNCTIONS ---

function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
    }
  }
  return track[str2.length][str1.length];
}

function searchLocations(query: string, locations: typeof MOCK_LOCATIONS, recentLocations: RecentLocation[] = []): SearchResult[] {
  if (!query || query.length < 1) return [];
  const queryLower = query.toLowerCase().trim().replace(/[^\w\s]/g, '');
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);

  const scoredResults = locations.map(loc => {
    const addressLower = loc.address.toLowerCase().replace(/[^\w\s]/g, '');
    let score = 0;
    if (addressLower === queryLower) score += 10000;
    if (addressLower.startsWith(queryLower)) score += 5000;
    if (addressLower.includes(queryLower)) score += 2500;
    const levenDistance = levenshteinDistance(addressLower, queryLower);
    score += Math.max(0, 2000 - levenDistance * 45);
    for (const word of queryWords) {
      if (addressLower.includes(word)) score += 500;
    }
    if (queryWords.every((word) => addressLower.includes(word))) score += 800;
    return { ...loc, _score: score };
  });

  return scoredResults.filter(r => r._score > 50).sort((a, b) => b._score - a._score).slice(0, 12).map(({ _score, ...rest }) => rest);
}

function dedupeSearchResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((item) => {
    const key = item.placeId || `${item.address.toLowerCase()}-${item.lat?.toFixed(5) || 'pending'}-${item.lng?.toFixed(5) || 'pending'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rankPreciseAddressResults(results: SearchResult[]): SearchResult[] {
  const streetAddressPattern = /\b\d{1,5}\s+[a-z0-9.'-]+/i;
  const streetKeywordPattern = /\b(street|st\.?|road|rd\.?|avenue|ave\.?|close|crescent|drive|dr\.?|lane|way|estate|junction)\b/i;

  return [...results].sort((a, b) => {
    const score = (item: SearchResult) => {
      const address = item.address || '';
      let total = 0;
      if (streetAddressPattern.test(address)) total += 8;
      if (streetKeywordPattern.test(address)) total += 5;
      if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) total += 2;
      if (item.source === 'google') total += 2;
      if (item.source === 'recent') total += 1;
      return total;
    };

    return score(b) - score(a);
  });
}

async function saveRecentSearch(query: string): Promise<void> {
  try {
    if (!query || query.length < 2) return;
    const existing = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    let searches: string[] = existing ? JSON.parse(existing) : [];
    searches = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
    searches.unshift(query);
    searches = searches.slice(0, MAX_RECENT_ITEMS);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch (error) { console.error('Error saving recent search:', error); }
}

async function getRecentSearches(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) { return []; }
}

async function saveRecentLocation(location: Location): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
    let locations: RecentLocation[] = existing ? JSON.parse(existing) : [];
    locations = locations.filter(l => l.address !== location.address);
    locations.unshift({ ...location, timestamp: Date.now() });
    locations = locations.slice(0, MAX_RECENT_ITEMS);
    await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(locations));
  } catch (error) { console.error('Error saving recent location:', error); }
}

async function getRecentLocations(): Promise<RecentLocation[]> {
  try {
    const data = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) { return []; }
}

async function getRecentRoutes(): Promise<RecentRoute[]> {
  try {
    const data = await AsyncStorage.getItem(RECENT_ROUTES_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_ITEMS) : [];
  } catch (error) { return []; }
}

async function saveRecentRoute(route: RecentRoute): Promise<void> {
  try {
    const existing = await getRecentRoutes();
    const routeKey = `${sanitizeAddress(route.pickup.address).toLowerCase()}->${sanitizeAddress(route.dropoff.address).toLowerCase()}`;
    const filtered = existing.filter((item) => {
      const itemKey = `${sanitizeAddress(item.pickup.address).toLowerCase()}->${sanitizeAddress(item.dropoff.address).toLowerCase()}`;
      return itemKey !== routeKey;
    });
    await AsyncStorage.setItem(RECENT_ROUTES_KEY, JSON.stringify([route, ...filtered].slice(0, MAX_RECENT_ITEMS)));
  } catch (error) { console.error('Error saving recent route:', error); }
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : fallback;
}

function extractRideCoordinate(
  ride: RideHistoryRouteSource,
  latKeys: Array<keyof RideHistoryRouteSource>,
  lngKeys: Array<keyof RideHistoryRouteSource>,
  objectKeys: Array<keyof RideHistoryRouteSource>
) {
  for (const key of objectKeys) {
    const value = ride[key] as RideHistoryRouteSource['pickup_location'];
    const lat = toFiniteNumber(value?.lat ?? value?.latitude, NaN);
    const lng = toFiniteNumber(value?.lng ?? value?.longitude, NaN);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  for (const latKey of latKeys) {
    for (const lngKey of lngKeys) {
      const lat = toFiniteNumber(ride[latKey], NaN);
      const lng = toFiniteNumber(ride[lngKey], NaN);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }

  return null;
}

function extractCoordinateFromDescription(description?: string | null) {
  if (!description) return null;
  const latMatch = description.match(/Lat:\s*(-?\d+(?:\.\d+)?)/i);
  const lngMatch = description.match(/Lng:\s*(-?\d+(?:\.\d+)?)/i);
  const pairMatch = description.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  const lat = toFiniteNumber(latMatch?.[1] ?? pairMatch?.[1], NaN);
  const lng = toFiniteNumber(lngMatch?.[1] ?? pairMatch?.[2], NaN);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

function routeFromRideHistory(ride: RideHistoryRouteSource): RecentRoute | null {
  const pickupAddress = sanitizeAddress(ride.pickup_zone || '');
  const dropoffAddress = sanitizeAddress(ride.destination_zone || '');
  if (!pickupAddress || !dropoffAddress) return null;

  const pickupCoordinate = extractRideCoordinate(
    ride,
    ['pickup_latitude'],
    ['pickup_longitude'],
    ['pickup_location']
  ) || extractCoordinateFromDescription(ride.pickup_description);
  const dropoffCoordinate = extractRideCoordinate(
    ride,
    ['destination_latitude', 'dropoff_latitude'],
    ['destination_longitude', 'dropoff_longitude'],
    ['destination_location', 'dropoff_location']
  ) || extractCoordinateFromDescription(ride.destination_description);

  if (!pickupCoordinate || !dropoffCoordinate) return null;

  return {
    pickup: { ...pickupCoordinate, address: pickupAddress },
    dropoff: { ...dropoffCoordinate, address: dropoffAddress },
    distanceKm: toFiniteNumber(ride.distance_km, 0),
    durationMinutes: toFiniteNumber(ride.duration_minutes, 0),
    fare: toFiniteNumber(ride.fare_amount, 0),
    pickupTime: null,
    source: 'history',
    timestamp: ride.created_at ? new Date(ride.created_at).getTime() || Date.now() : Date.now(),
  };
}

function dedupeRecentRoutes(routes: RecentRoute[]) {
  const seen = new Set<string>();
  return routes.filter((route) => {
    const key = `${sanitizeAddress(route.pickup.address).toLowerCase()}->${sanitizeAddress(route.dropoff.address).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Find nearest named location within 1km radius
function findNearestLocation(lat: number, lng: number): Location | null {
  const R = 6371; // Earth radius in km
  let nearest: Location | null = null;
  let minDistance = 1; // 1km threshold

  for (const loc of MOCK_LOCATIONS) {
    const dLat = ((loc.lat - lat) * Math.PI) / 180;
    const dLng = ((loc.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
      Math.cos((loc.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance < minDistance) {
      minDistance = distance;
      nearest = {
        lat,
        lng,
        address: sanitizeAddress(`${loc.address} (~${Math.round(distance * 1000)}m away)`)
      };
    }
  }

  return nearest;
}

const resolveCurrentLocationAddress = async (
  currentLocation: { latitude: number; longitude: number },
  fallbackReverseGeocode: (location: any) => Promise<string | null>
): Promise<LocationSearchResult> => {
  try {
    const googleResult = await reverseGeocodeWithGooglePlaces(
      currentLocation.latitude,
      currentLocation.longitude
    );

    if (googleResult?.address) {
      return googleResult;
    }
  } catch (error) {
    console.log('Google reverse geocoding failed for current location:', error);
  }

  const fallbackAddress = await fallbackReverseGeocode(currentLocation).catch(() => null);
  return {
    lat: currentLocation.latitude,
    lng: currentLocation.longitude,
    address: fallbackAddress || 'Current location',
    source: 'local',
  };
};

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pickup?: string; destination?: string; routeData?: string; mode?: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { startTour } = useGuidedTour();
  const { currentLocation, getCurrentLocation, reverseGeocodeLocation } = useLocation();
  // State
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const [bookingStep, setBookingStep] = useState<BookingStep>('pickup');
  const [cameraCenter, setCameraCenter] = useState<[number, number] | undefined>(undefined);
  const [cameraZoom, setCameraZoom] = useState<number>(12);
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [activeLocationPicker, setActiveLocationPicker] = useState<'pickup' | 'dropoff' | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [pickupSearchResults, setPickupSearchResults] = useState<SearchResult[]>([]);
  const [dropoffSearchResults, setDropoffSearchResults] = useState<SearchResult[]>([]);
  const [showPickupResults, setShowPickupResults] = useState(false);
  const [showDropoffResults, setShowDropoffResults] = useState(false);
  const pickupBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropoffBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickupSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropoffSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickupSearchRequest = useRef(0);
  const dropoffSearchRequest = useRef(0);
  const pickupGoogleSessionToken = useRef(`pickup-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const dropoffGoogleSessionToken = useRef(`dropoff-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [locationWarningVisible, setLocationWarningVisible] = useState(false);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);
  const [pricingConfig, setPricingConfig] = useState<BookingPricingConfig>(BOOKING_PRICING);
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | undefined>(undefined);
  const [routeLoading, setRouteLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccessVisible, setBookingSuccessVisible] = useState(false);
  const [lastBookedRideId, setLastBookedRideId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showOperationalAreasModal, setShowOperationalAreasModal] = useState(false);
  const [showOutOfServiceAreaModal, setShowOutOfServiceAreaModal] = useState(false);
  const [outOfServiceAreaInfo, setOutOfServiceAreaInfo] = useState<{
    closestArea?: string;
    distance?: number;
    locationType?: 'pickup' | 'dropoff';
  }>({});
  const [showPickupTimeModal, setShowPickupTimeModal] = useState(false);
  const [pendingPickupTime, setPendingPickupTime] = useState<string | null>(null);
  const [bookingConfirmationVisible, setBookingConfirmationVisible] = useState(false);
  const [currentLocationPrompt, setCurrentLocationPrompt] = useState<'pickup' | 'dropoff' | null>(null);
  const [resolvingCurrentLocation, setResolvingCurrentLocation] = useState<'pickup' | 'dropoff' | null>(null);
  const [prewarmingCurrentLocation, setPrewarmingCurrentLocation] = useState(false);
  const prewarmedCurrentLocationRef = useRef<PrewarmedCurrentLocation | null>(null);
  const prewarmCurrentLocationPromise = useRef<Promise<PrewarmedCurrentLocation | null> | null>(null);
  const [currentLocationUnavailableVisible, setCurrentLocationUnavailableVisible] = useState(false);
  const [voiceLocationTarget, setVoiceLocationTarget] = useState<'pickup' | 'dropoff' | null>(null);
  const [voiceLocationText, setVoiceLocationText] = useState('');
  const [voiceLocationError, setVoiceLocationError] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(true);
  const isLight = theme.mode === 'light';
  const styles = bookingStyles;

  useEffect(() => {
    loadRecentData();
    loadUserName();
    getBookingPricingConfig()
      .then(setPricingConfig)
      .catch((error) => console.warn('[Booking] Pricing config load failed:', error));
  }, []);

  useEffect(() => {
    const maybeShowBookingTour = async () => {
      const seen = await AsyncStorage.getItem('@charter_keke_tour_rider_booking_seen');
      if (seen) return;
      startTour([
        {
          id: 'booking-pickup',
          title: 'Choose pickup',
          body: 'Search, speak, tap the map, or use your current location. CK warms location in the background so this feels faster.',
        },
        {
          id: 'booking-destination',
          title: 'Choose destination',
          body: 'Add where you are going. Once both points are set, the app shows the fare and trip distance.',
        },
        {
          id: 'booking-confirm',
          title: 'Confirm the ride',
          body: 'Tap Book Ride Now to send the request to nearby drivers. You will get updates when a driver accepts.',
        },
      ], () => {
        AsyncStorage.setItem('@charter_keke_tour_rider_booking_seen', 'true').catch(() => {});
      });
    };
    maybeShowBookingTour().catch(() => {});
  }, [startTour]);

  useEffect(() => {
    const pickup = typeof params.pickup === 'string' ? params.pickup.trim() : '';
    const destination = typeof params.destination === 'string' ? params.destination.trim() : '';
    const routeData = typeof params.routeData === 'string' ? params.routeData.trim() : '';

    if (!pickup && !destination && !routeData) return;

    try {
      if (routeData) {
        const parsed = JSON.parse(routeData);
        if (parsed?.pickup?.address) {
          setPickupLocation(parsed.pickup);
          setPickupSearch(parsed.pickup.address);
        }
        if (parsed?.dropoff?.address) {
          setDropoffLocation(parsed.dropoff);
          setDropoffSearch(parsed.dropoff.address);
        }
        if (parsed?.pickup?.address && parsed?.dropoff?.address) {
          setBookingStep('review');
        }
      } else {
        if (pickup) setPickupSearch(pickup);
        if (destination) setDropoffSearch(destination);
      }
    } catch (error) {
      console.log('[Booking] Failed to apply launch prefill:', error);
    }
  }, [params.pickup, params.destination, params.routeData]);

  useEffect(() => {
    return () => {
      [
        pickupBlurTimer.current,
        dropoffBlurTimer.current,
        pickupSearchTimer.current,
        dropoffSearchTimer.current,
      ].forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  useEffect(() => {
    Voice.onSpeechStart = () => {
      setVoiceLocationError('');
      setIsVoiceListening(true);
    };
    Voice.onSpeechEnd = () => {
      setIsVoiceListening(false);
    };
    Voice.onSpeechError = (event: any) => {
      setIsVoiceListening(false);
      setVoiceLocationError(
        event?.error?.message || 'We could not hear that clearly. Please try again or type the address.'
      );
    };
    Voice.onSpeechResults = (event: any) => {
      const spokenAddress = event?.value?.[0]?.trim();
      if (!spokenAddress) return;

      setVoiceLocationText(spokenAddress);
      if (voiceLocationTarget === 'pickup') {
        setPickupLocation(null);
        setPickupSearch(spokenAddress);
        scheduleSearch(spokenAddress, 'pickup');
        openPickupSearch();
      } else if (voiceLocationTarget === 'dropoff') {
        setDropoffLocation(null);
        setDropoffSearch(spokenAddress);
        scheduleSearch(spokenAddress, 'dropoff');
        openDropoffSearch();
      }
    };

    Voice.isAvailable()
      .then((available: 0 | 1) => setIsVoiceAvailable(Boolean(available)))
      .catch(() => setIsVoiceAvailable(false));

    return () => {
      Voice.destroy()
        .then(Voice.removeAllListeners)
        .catch(() => undefined);
    };
  }, [voiceLocationTarget]);

  const loadUserName = async () => {
    try {
      const stored = await AsyncStorage.getItem('userProfile');
      if (stored) {
        const profile = JSON.parse(stored);
        setUserName(profile.firstName || profile.name || '');
      }
    } catch (error) {
      console.log('Error loading user profile:', error);
    }
  };

  const loadRecentData = async () => {
    try {
      const [searches, locations, cachedRoutes, historyResponse] = await Promise.all([
        getRecentSearches(),
        getRecentLocations(),
        getRecentRoutes(),
        apiService.getRiderRides(20).catch((error) => {
          console.log('Ride history shortcuts unavailable:', error?.message || error);
          return { rides: [] };
        }),
      ]);
      const historyRoutes = ((historyResponse as any)?.rides || [])
        .map(routeFromRideHistory)
        .filter(Boolean) as RecentRoute[];
      const routes = dedupeRecentRoutes([...historyRoutes, ...cachedRoutes]).slice(0, MAX_RECENT_ITEMS);
      setRecentLocations(locations);
      setRecentRoutes(routes);
      WidgetStorage.setItem(WIDGET_STORAGE_KEYS.rider, {
        primaryAction: 'Book Ride',
        screen: '/rider/booking',
        recentRoutes: routes.slice(0, 4).map((route) => ({
          pickup: route.pickup.address,
          dropoff: route.dropoff.address,
          routeData: route,
        })),
      }).catch(() => undefined);
    } catch (error) { console.error('Error loading recent data:', error); }
  };

  const openPickupSearch = () => {
    setActiveLocationPicker('pickup');
    setShowDropoffResults(false);
    if (dropoffBlurTimer.current) clearTimeout(dropoffBlurTimer.current);
    setShowPickupResults(true);
  };

  const openDropoffSearch = () => {
    setActiveLocationPicker('dropoff');
    setShowPickupResults(false);
    if (pickupBlurTimer.current) clearTimeout(pickupBlurTimer.current);
    setShowDropoffResults(true);
  };

  const closeLocationSuggestions = (type?: 'pickup' | 'dropoff') => {
    if (!type || type === 'pickup') {
      setShowPickupResults(false);
    }
    if (!type || type === 'dropoff') {
      setShowDropoffResults(false);
    }
    setActiveLocationPicker(null);
    if (pickupBlurTimer.current) clearTimeout(pickupBlurTimer.current);
    if (dropoffBlurTimer.current) clearTimeout(dropoffBlurTimer.current);
    Keyboard.dismiss();
  };

  const openMapLocationPicker = (type: 'pickup' | 'dropoff') => {
    setActiveLocationPicker(type);
    setShowPickupResults(false);
    setShowDropoffResults(false);
    if (pickupBlurTimer.current) clearTimeout(pickupBlurTimer.current);
    if (dropoffBlurTimer.current) clearTimeout(dropoffBlurTimer.current);
    Keyboard.dismiss();
  };

  const buildCurrentLocationEntry = async (
    locationSource: { latitude: number; longitude: number }
  ): Promise<PrewarmedCurrentLocation> => {
    const resolvedLocation = await resolveCurrentLocationAddress(locationSource, reverseGeocodeLocation);
    const location: Location = {
      lat: Number(resolvedLocation.lat) || locationSource.latitude,
      lng: Number(resolvedLocation.lng) || locationSource.longitude,
      address: sanitizeAddress(resolvedLocation.address),
    };

    return {
      raw: locationSource,
      resolved: resolvedLocation,
      location,
      timestamp: Date.now(),
    };
  };

  const prewarmCurrentLocation = async (forceFresh = false): Promise<PrewarmedCurrentLocation | null> => {
    const cached = prewarmedCurrentLocationRef.current;
    if (
      !forceFresh &&
      cached &&
      Date.now() - cached.timestamp < PREWARMED_LOCATION_MAX_AGE_MS
    ) {
      return cached;
    }

    if (prewarmCurrentLocationPromise.current) {
      return prewarmCurrentLocationPromise.current;
    }

    setPrewarmingCurrentLocation(true);
    prewarmCurrentLocationPromise.current = (async () => {
      try {
        const freshLocation = await getCurrentLocation().catch(() => null);
        const locationSource = freshLocation || currentLocation;
        if (!locationSource) return null;

        const entry = await buildCurrentLocationEntry(locationSource);
        prewarmedCurrentLocationRef.current = entry;
        return entry;
      } catch (error) {
        console.log('Current location prewarm failed:', error);
        return null;
      } finally {
        prewarmCurrentLocationPromise.current = null;
        setPrewarmingCurrentLocation(false);
      }
    })();

    return prewarmCurrentLocationPromise.current;
  };

  const applyCurrentLocation = async (type: 'pickup' | 'dropoff', entry: PrewarmedCurrentLocation) => {
    const location = entry.location;

    if (type === 'pickup') {
      setPickupLocation(location);
      setPickupSearch(location.address);
      setShowPickupResults(false);
      setActiveLocationPicker('dropoff');
    } else {
      setDropoffLocation(location);
      setDropoffSearch(location.address);
      setShowDropoffResults(false);
    }
    setCameraCenter([location.lng, location.lat]);
    setCameraZoom(14);
    if (entry.resolved.placeId) {
      saveSearchLocationsToCache([entry.resolved]).catch(() => {});
      markSearchLocationUsed(entry.resolved).catch(() => {});
    }
    await saveRecentLocation(location);
    setRecentLocations(await getRecentLocations());
    setBookingStep(type === 'pickup' ? 'destination' : 'time');
  };

  useEffect(() => {
    prewarmCurrentLocation().catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentLocation) return;

    const cached = prewarmedCurrentLocationRef.current;
    const hasMoved =
      cached &&
      (Math.abs(cached.raw.latitude - currentLocation.latitude) > 0.0003 ||
        Math.abs(cached.raw.longitude - currentLocation.longitude) > 0.0003);

    if (!cached || hasMoved || Date.now() - cached.timestamp > PREWARMED_LOCATION_MAX_AGE_MS) {
      prewarmCurrentLocation().catch(() => {});
    }
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  const promptForCurrentLocation = (type: 'pickup' | 'dropoff') => {
    prewarmCurrentLocation().catch(() => {});
    setCurrentLocationPrompt(type);
  };

  const useCurrentLocationForPrompt = async () => {
    if (!currentLocationPrompt) return;

    const type = currentLocationPrompt;
    setCurrentLocationPrompt(null);
    setResolvingCurrentLocation(type);

    try {
      const cached = prewarmedCurrentLocationRef.current;
      const entry =
        cached && Date.now() - cached.timestamp < PREWARMED_LOCATION_MAX_AGE_MS
          ? cached
          : await prewarmCurrentLocation(true);

      if (!entry) {
        setCurrentLocationUnavailableVisible(true);
        return;
      }

      await applyCurrentLocation(type, entry);
    } finally {
      setResolvingCurrentLocation(null);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; 
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    let isCancelled = false;

    const loadRoute = async () => {
      if (!pickupLocation || !dropoffLocation) {
        setEstimatedDistance(0);
        setEstimatedDuration(0);
        setRouteCoordinates(undefined);
        return;
      }

      setRouteLoading(true);

      try {
        const route = await fetchMapboxRoute(
          [pickupLocation.lng, pickupLocation.lat],
          [dropoffLocation.lng, dropoffLocation.lat],
          { profile: 'driving-traffic' }
        );

        if (isCancelled) return;

        if (route) {
          const routeKm = roundDistanceKm(Math.max(1, route.distanceKm || 0));
          const kekeDurationMin = calculateKekeDurationMinutes(route.durationMin, routeKm, pricingConfig);
          const roundedFare = calculateRideFare(routeKm, pricingConfig);

          setRouteCoordinates(route.coordinates);
          setEstimatedDistance(parseFloat(routeKm.toFixed(2)));
          setEstimatedDuration(kekeDurationMin);
          return;
        }
      } catch (error) {
        console.log('Mapbox route fetch failed, falling back to straight-line estimate:', error);
      }

      const fallbackDistance = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        dropoffLocation.lat,
        dropoffLocation.lng
      );
      const displayDistance = fallbackDistance < 1 ? 1 : roundDistanceKm(fallbackDistance);
      const roadAdjustedDistance = roundDistanceKm(displayDistance * 1.28);
      const fallbackDuration = calculateKekeDurationMinutes((roadAdjustedDistance / 18) * 60, roadAdjustedDistance, pricingConfig);
      const roundedFare = calculateRideFare(roadAdjustedDistance, pricingConfig);

      if (!isCancelled) {
        setRouteCoordinates([
          [pickupLocation.lng, pickupLocation.lat],
          [dropoffLocation.lng, dropoffLocation.lat],
        ]);
        setEstimatedDistance(roadAdjustedDistance);
        setEstimatedDuration(fallbackDuration);
      }
    };

    loadRoute().finally(() => {
      if (!isCancelled) {
        setRouteLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [pickupLocation, dropoffLocation, pricingConfig]);

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      const centerLat = (pickupLocation.lat + dropoffLocation.lat) / 2;
      const centerLng = (pickupLocation.lng + dropoffLocation.lng) / 2;
      setCameraCenter([centerLng, centerLat]);
      setCameraZoom(11);
    } else if (pickupLocation) {
      setCameraCenter([pickupLocation.lng, pickupLocation.lat]);
      setCameraZoom(14);
    } else if (dropoffLocation) {
      setCameraCenter([dropoffLocation.lng, dropoffLocation.lat]);
      setCameraZoom(14);
    } else if (currentLocation) {
      setCameraCenter([currentLocation.longitude, currentLocation.latitude]);
      setCameraZoom(12);
    }
  }, [pickupLocation, dropoffLocation, currentLocation]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(Math.max(0, event.endCoordinates.height - insets.bottom));
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  const handleSearch = async (query: string, type: 'pickup' | 'dropoff') => {
    if (!query || query.length < 1) {
      if (type === 'pickup') { setPickupSearchResults([]); setShowPickupResults(false); }
      else { setDropoffSearchResults([]); setShowDropoffResults(false); }
      return;
    }
    const localResults = searchLocations(query, MOCK_LOCATIONS, recentLocations).map((item) => ({
      ...item,
      source: 'local' as const,
    }));
    const currentRequest =
      type === 'pickup' ? ++pickupSearchRequest.current : ++dropoffSearchRequest.current;
    const sessionToken =
      type === 'pickup' ? pickupGoogleSessionToken.current : dropoffGoogleSessionToken.current;

    let placeResults: SearchResult[] = [];

    if (query.trim().length >= 2) {
      try {
        placeResults = await searchLagosPlaces(query, sessionToken, {
          locationBias: currentLocation
            ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
            : undefined,
          preferPreciseAddresses: true,
        });
      } catch (error) {
        console.log('Google Places search failed for booking search:', error);
      }
    }

    if (
      (type === 'pickup' && currentRequest !== pickupSearchRequest.current) ||
      (type === 'dropoff' && currentRequest !== dropoffSearchRequest.current)
    ) {
      return;
    }

    const results = rankPreciseAddressResults(dedupeSearchResults([...placeResults, ...localResults]));
    if (type === 'pickup') {
      setDropoffSearchResults([]);
      setShowDropoffResults(false);
      setPickupSearchResults(results);
      setShowPickupResults(true);
      setActiveLocationPicker('pickup');
    } else {
      setPickupSearchResults([]);
      setShowPickupResults(false);
      setDropoffSearchResults(results);
      setShowDropoffResults(true);
      setActiveLocationPicker('dropoff');
    }
    await saveRecentSearch(query);
  };

  const scheduleSearch = (query: string, type: 'pickup' | 'dropoff') => {
    const timerRef = type === 'pickup' ? pickupSearchTimer : dropoffSearchTimer;
    if (timerRef.current) clearTimeout(timerRef.current);

    const localResults = searchLocations(query, MOCK_LOCATIONS, recentLocations).map((item) => ({
      ...item,
      source: 'local' as const,
    }));

    if (type === 'pickup') {
      setPickupSearchResults(localResults);
      setShowPickupResults(query.length > 0);
      setActiveLocationPicker('pickup');
    } else {
      setDropoffSearchResults(localResults);
      setShowDropoffResults(query.length > 0);
      setActiveLocationPicker('dropoff');
    }

    timerRef.current = setTimeout(() => {
      handleSearch(query, type);
    }, 350);
  };

  const openVoiceLocation = (type: 'pickup' | 'dropoff') => {
    setVoiceLocationError('');
    setIsVoiceListening(false);
    setVoiceLocationTarget(type);
    setVoiceLocationText(type === 'pickup' ? pickupSearch : dropoffSearch);
  };

  const closeVoiceLocation = async () => {
    try {
      await Voice.stop();
    } catch {}
    setIsVoiceListening(false);
    setVoiceLocationTarget(null);
    setVoiceLocationError('');
  };

  const startVoiceLocationListening = async () => {
    if (!voiceLocationTarget) return;
    if (!isVoiceAvailable) {
      setVoiceLocationError('Voice search is not available on this device. Please type the address.');
      return;
    }

    try {
      setVoiceLocationError('');
      setIsVoiceListening(true);
      await Voice.start('en-NG');
    } catch (error: any) {
      setIsVoiceListening(false);
      setVoiceLocationError(error?.message || 'Voice search could not start. Please try again or type the address.');
    }
  };

  const stopVoiceLocationListening = async () => {
    try {
      await Voice.stop();
    } catch {}
    setIsVoiceListening(false);
  };

  const applyVoiceLocationText = () => {
    const query = voiceLocationText.trim();
    if (!voiceLocationTarget || !query) return;
    if (voiceLocationTarget === 'pickup') {
      setPickupLocation(null);
      setPickupSearch(query);
      scheduleSearch(query, 'pickup');
      openPickupSearch();
    } else {
      setDropoffLocation(null);
      setDropoffSearch(query);
      scheduleSearch(query, 'dropoff');
      openDropoffSearch();
    }
    setVoiceLocationTarget(null);
  };

  const clearPickupSearch = () => {
    setPickupSearch('');
    setPickupSearchResults([]);
    setShowPickupResults(false);
    if (pickupBlurTimer.current) clearTimeout(pickupBlurTimer.current);
  };

  const clearDropoffSearch = () => {
    setDropoffSearch('');
    setDropoffSearchResults([]);
    setShowDropoffResults(false);
    if (dropoffBlurTimer.current) clearTimeout(dropoffBlurTimer.current);
  };

  const scheduleClosePickupResults = () => {
    if (pickupBlurTimer.current) clearTimeout(pickupBlurTimer.current);
    pickupBlurTimer.current = setTimeout(() => setShowPickupResults(true), 180);
  };

  const scheduleCloseDropoffResults = () => {
    if (dropoffBlurTimer.current) clearTimeout(dropoffBlurTimer.current);
    dropoffBlurTimer.current = setTimeout(() => setShowDropoffResults(true), 180);
  };

  const selectSearchResult = async (result: SearchResult, type: 'pickup' | 'dropoff') => {
    let resolvedResult: LocationSearchResult | SearchResult | null = result;
    const sessionToken =
      type === 'pickup' ? pickupGoogleSessionToken.current : dropoffGoogleSessionToken.current;

    if (result.placeId) {
      try {
        resolvedResult = await getGooglePlaceDetails(result.placeId, sessionToken) || result;
      } catch (error) {
        console.log('Google Place Details lookup failed:', error);
      }
    }

    if (!resolvedResult || !Number.isFinite(resolvedResult.lat) || !Number.isFinite(resolvedResult.lng)) {
      setErrorMessage('We could not get map coordinates for that location. Please choose another nearby result.');
      setErrorDialogVisible(true);
      return;
    }

    const location: Location = {
      lat: Number(resolvedResult.lat),
      lng: Number(resolvedResult.lng),
      address: sanitizeAddress(resolvedResult.address),
    };
    
    if (type === 'pickup') {
      setPickupLocation(location);
      setPickupSearch('');
      setPickupSearchResults([]);
      setShowPickupResults(false);
      setActiveLocationPicker(null);
      setDropoffSearchResults([]);
      setShowDropoffResults(false);
    } else {
      setDropoffLocation(location);
      setDropoffSearch('');
      setDropoffSearchResults([]);
      setShowDropoffResults(false);
      setActiveLocationPicker(null);
      setPickupSearchResults([]);
      setShowPickupResults(false);
    }
    setCameraCenter([location.lng, location.lat]);
    setCameraZoom(14);
    if (resolvedResult.placeId) {
      saveSearchLocationsToCache([resolvedResult]).catch(() => {});
      markSearchLocationUsed(resolvedResult).catch(() => {});
    }
    if (type === 'pickup') {
      pickupGoogleSessionToken.current = `pickup-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    } else {
      dropoffGoogleSessionToken.current = `dropoff-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    await saveRecentLocation(location);
    setRecentLocations(await getRecentLocations());
    setBookingStep(type === 'pickup' ? 'destination' : 'time');
  };

  const selectCurrentLocationOption = async (type: 'pickup' | 'dropoff') => {
    try {
      const cached = prewarmedCurrentLocationRef.current;
      let entry =
        cached && Date.now() - cached.timestamp < PREWARMED_LOCATION_MAX_AGE_MS
          ? cached
          : null;

      if (!entry && prewarmCurrentLocationPromise.current) {
        entry = await prewarmCurrentLocationPromise.current;
      }

    if (!entry && currentLocation) {
      entry = {
        raw: currentLocation,
        resolved: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          address: 'Current location',
          source: 'local',
        },
        location: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          address: 'Current location',
        },
        timestamp: Date.now(),
      };
      prewarmCurrentLocation().catch(() => {});
      }

      if (!entry) {
        setResolvingCurrentLocation(type);
        entry = await prewarmCurrentLocation(false);
      }

      if (!entry) {
        setCurrentLocationUnavailableVisible(true);
        return;
      }

      await applyCurrentLocation(type, entry);
    } finally {
      setResolvingCurrentLocation(null);
    }
  };

  const handleMapLocationPick = async (coordinate: { latitude: number; longitude: number }) => {
    if (!activeLocationPicker) return;

    let resolvedAddress = '';
    try {
      const placeResult = await reverseGeocodeWithGooglePlaces(coordinate.latitude, coordinate.longitude);
      resolvedAddress = sanitizeAddress(placeResult?.address || '');
    } catch (error) {
      console.log('Google Places reverse lookup failed for map pick:', error);
    }

    if (!resolvedAddress) {
      try {
        resolvedAddress = sanitizeAddress((await reverseGeocodeLocation({ ...coordinate, timestamp: Date.now() } as any)) || '');
      } catch (error) {
        console.log('Fallback reverse geocode failed for map pick:', error);
      }
    }

    const nearest = findNearestLocation(coordinate.latitude, coordinate.longitude);
    const location: Location = {
      lat: coordinate.latitude,
      lng: coordinate.longitude,
      address: sanitizeAddress(
        resolvedAddress ||
        nearest?.address ||
        `Pinned location (${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)})`
      ),
    };

    if (activeLocationPicker === 'pickup') {
      setPickupLocation(location);
      setPickupSearch('');
      setPickupSearchResults([]);
      setShowPickupResults(false);
      setDropoffSearchResults([]);
      setShowDropoffResults(false);
    } else {
      setDropoffLocation(location);
      setDropoffSearch('');
      setDropoffSearchResults([]);
      setShowDropoffResults(false);
      setPickupSearchResults([]);
      setShowPickupResults(false);
    }

    setActiveLocationPicker(null);
    setCameraCenter([coordinate.longitude, coordinate.latitude]);
    setCameraZoom(15);
    await saveRecentLocation(location);
    setRecentLocations(await getRecentLocations());
    setBookingStep(activeLocationPicker === 'pickup' ? 'destination' : 'time');
  };

  const handleAutoSelectNearestArea = async () => {
    if (!outOfServiceAreaInfo.closestArea) return;

    // Find the operational area by name
    const allAreas = getNearbyOperationalAreas(
      { latitude: 6.5, longitude: 3.35 }, // Use a Lagos center point to get all areas
      100 // Large radius to get all
    );

    const targetArea = allAreas.find(
      area => area.name === outOfServiceAreaInfo.closestArea
    );

    if (targetArea) {
      const location: Location = {
        lat: targetArea.center[0],
        lng: targetArea.center[1],
        address: `${targetArea.name} Service Area`,
      };

      if (outOfServiceAreaInfo.locationType === 'pickup') {
        setPickupLocation(location);
      } else {
        setDropoffLocation(location);
      }

      setCameraCenter([targetArea.center[1], targetArea.center[0]]);
      setCameraZoom(13);
      await saveRecentLocation(location);
      setRecentLocations(await getRecentLocations());
      setShowOutOfServiceAreaModal(false);
    }
  };

  const handleBookRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      setErrorMessage('Please select both pickup and dropoff locations');
      setErrorDialogVisible(true);
      return;
    }
    if (routeLoading) {
      setErrorMessage('Please wait while we finish calculating your route.');
      setErrorDialogVisible(true);
      return;
    }
    // Show pickup time modal instead of directly booking
    setShowPickupTimeModal(true);
  };

  const handlePickupTimeConfirmed = async (pickupTime: string) => {
    if (!pickupLocation || !dropoffLocation) return;

    setShowPickupTimeModal(false);
    setPendingPickupTime(pickupTime);
    setBookingStep('review');
  };

  const handleConfirmBooking = async () => {
    if (!pickupLocation || !dropoffLocation || !pendingPickupTime) return;
    if (routeLoading) {
      setErrorMessage('Please wait while we finish calculating your route.');
      setErrorDialogVisible(true);
      return;
    }

    setBookingConfirmationVisible(false);
    setIsBooking(true);

    try {
      const normalizedDistance = roundDistanceKm(estimatedDistance);
      const totalFare = calculateRideFare(normalizedDistance, pricingConfig);
      const response = await createRideBooking({
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        distanceKm: normalizedDistance,
        durationMinutes: Number.isFinite(estimatedDuration) ? estimatedDuration : 0,
        pickupTime: pendingPickupTime,
        fare: totalFare,
        pricingConfig,
      });
      const rideId = response?.ride?.id || null;

      const routeToSave: RecentRoute = {
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        distanceKm: normalizedDistance,
        durationMinutes: Number.isFinite(estimatedDuration) ? estimatedDuration : 0,
        fare: totalFare,
        pickupTime: pendingPickupTime,
        source: 'cache',
        timestamp: Date.now(),
      };
      await saveRecentRoute(routeToSave);
      setRecentRoutes((routes) => dedupeRecentRoutes([routeToSave, ...routes]).slice(0, MAX_RECENT_ITEMS));
      WidgetStorage.setItem(WIDGET_STORAGE_KEYS.rider, {
        primaryAction: 'Book Ride',
        screen: '/rider/booking',
        recentRoutes: dedupeRecentRoutes([routeToSave, ...recentRoutes]).slice(0, 4).map((route) => ({
          pickup: route.pickup.address,
          dropoff: route.dropoff.address,
          routeData: route,
        })),
      }).catch(() => undefined);

      setLastBookedRideId(rideId);
      setPickupLocation(null);
      setDropoffLocation(null);
      setEstimatedDistance(0);
      setPendingPickupTime(null);
      setBookingStep('pickup');
      setBookingSuccessVisible(true);

      await sendLocalNotification(
        '✅ Ride booked successfully',
        `Your ride request${rideId ? ` (#${rideId.slice(0, 8)})` : ''} is now being matched with nearby drivers.`,
        {
          type: 'ride_update',
          rideId: rideId || undefined,
          action: 'ride_booked_notification',
        }
      );
    } catch (error: any) {
      const message = error?.message || error?.details || 'Failed to book ride. Please try again.';
      setErrorMessage(message);
      setErrorDialogVisible(true);
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBookingConfirmation = () => {
    setBookingConfirmationVisible(false);
    setBookingStep('review');
  };

  const handleViewBookedRide = () => {
    setBookingSuccessVisible(false);
    router.push('/rider/rides-history');
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    const name = userName ? ', ' + userName : '';
    const greetings = [
      `Going somewhere${name}?`,
      `Heading out${name}?`,
      `Ready to go${name}?`,
      `Let's move${name}?`,
      hrs < 12 ? `Morning commute${name}?` : hrs < 18 ? `Afternoon trip${name}?` : `Evening ride${name}?`,
      `Got a place to be${name}?`,
      `Where to${name}?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const bookingMapFocusCoordinates = useMemo<[number, number][]>(() => {
    const coordinates: [number, number][] = [];

    if (currentLocation) {
      coordinates.push([currentLocation.longitude, currentLocation.latitude]);
    }
    if (pickupLocation) {
      coordinates.push([pickupLocation.lng, pickupLocation.lat]);
    }
    if (dropoffLocation) {
      coordinates.push([dropoffLocation.lng, dropoffLocation.lat]);
    }

    return coordinates;
  }, [currentLocation, pickupLocation, dropoffLocation]);

  const bookingDistanceKm = roundDistanceKm(estimatedDistance);
  const bookingTotalFare = calculateRideFare(bookingDistanceKm, pricingConfig);
  const bookingPlatformFee = Math.round(bookingTotalFare * pricingConfig.platformFeeRate);
  const bookingEstimatedDriverFare = Math.max(0, bookingTotalFare - bookingPlatformFee);
  const isLocationSearchExpanded =
    keyboardHeight > 0 &&
    (bookingStep === 'pickup' || bookingStep === 'destination') &&
    (showPickupResults || showDropoffResults || Boolean(pickupSearch || dropoffSearch));

  const renderStepSheet = () => {
    const isPickupStep = bookingStep === 'pickup';
    const isDestinationStep = bookingStep === 'destination';
    const isTimeStep = bookingStep === 'time';
    const isReviewStep = bookingStep === 'review';
    const locationType: 'pickup' | 'dropoff' = isPickupStep ? 'pickup' : 'dropoff';
    const selectedTimeLabel = pendingPickupTime
      ? formatPickupTimeLabel(pendingPickupTime)
      : 'Choose pickup time';

    const goBackStep = () => {
      if (isReviewStep) setBookingStep('time');
      else if (isTimeStep) setBookingStep('destination');
      else if (isDestinationStep) setBookingStep('pickup');
    };

    const locationResults = isPickupStep
      ? (pickupSearch ? pickupSearchResults : recentLocations)
      : (dropoffSearch ? dropoffSearchResults : recentLocations);
    const locationResultsTitle = isPickupStep ? 'Pickup suggestions' : 'Destination suggestions';
    const shouldShowLocationResults = isPickupStep
      ? (showPickupResults || Boolean(pickupSearch))
      : (showDropoffResults || Boolean(dropoffSearch));

    return (
      <BookingStepPanel
        theme={theme}
        styles={styles}
        insets={insets}
        currentStep={bookingStep}
        title={isPickupStep ? 'From where?' : isDestinationStep ? 'Where to?' : isTimeStep ? 'When?' : 'Review your ride'}
        stepLabel={`Step ${bookingStep === 'pickup' ? '1' : bookingStep === 'destination' ? '2' : bookingStep === 'time' ? '3' : '4'} of 4`}
        showBack={bookingStep !== 'pickup'}
        onBack={goBackStep}
      >
        {isPickupStep || isDestinationStep ? (
          <>
            <BookingLocationField
              label={isPickupStep ? 'Pickup location' : 'Where to?'}
              value={isPickupStep ? pickupSearch : dropoffSearch}
              placeholder={isPickupStep ? 'Search pickup location' : 'Search destination'}
              icon={isPickupStep ? 'map-marker' : 'map-marker-check'}
              theme={theme}
              styles={styles}
              onChangeText={(text) => {
                if (isPickupStep) setPickupSearch(text);
                else setDropoffSearch(text);
                scheduleSearch(text, locationType);
              }}
              onFocus={() => (isPickupStep ? openPickupSearch() : openDropoffSearch())}
              onClear={isPickupStep ? clearPickupSearch : clearDropoffSearch}
            />

            <View style={styles.locationActionsRow}>
              <TouchableOpacity
                style={[styles.locationActionButton, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
                onPress={() => selectCurrentLocationOption(locationType)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="crosshairs-gps" size={18} color={BRAND.primary} />
                <Text style={[styles.locationActionText, { color: theme.colors.textPrimary }]}>Use current location</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.locationActionButton, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
                onPress={() => openMapLocationPicker(locationType)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={18} color={BRAND.primary} />
                <Text style={[styles.locationActionText, { color: theme.colors.textPrimary }]}>Pick on map</Text>
              </TouchableOpacity>
            </View>

            {shouldShowLocationResults ? (
              <BookingSearchResultsList
                results={locationResults}
                onSelect={(result) => selectSearchResult(result, locationType)}
                onClose={() => closeLocationSuggestions(locationType)}
                theme={theme}
                styles={styles}
                title={locationResultsTitle}
                subtitle="Tap once or double tap to set the location"
              />
            ) : null}
          </>
        ) : null}

        {isTimeStep ? (
          <View style={[styles.whenPanel, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="calendar-clock" size={28} color={BRAND.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.whenSelectedLabel, { color: theme.colors.textSecondary }]}>Pickup time</Text>
              <Text style={[styles.whenSelectedValue, { color: theme.colors.textPrimary }]}>{selectedTimeLabel}</Text>
            </View>
            <TouchableOpacity style={[styles.whenButton, { backgroundColor: BRAND.primary }]} onPress={() => setShowPickupTimeModal(true)} activeOpacity={0.9}>
              <Text style={styles.whenButtonText}>Choose</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isReviewStep ? (
          <>
            <BookingFareSummary
              theme={theme}
              styles={styles}
              isLight={isLight}
              routeLoading={routeLoading}
              estimatedDistance={roundDistanceKm(estimatedDistance)}
              estimatedDuration={estimatedDuration}
              bookingTotalFare={bookingTotalFare}
              bookingPlatformFee={bookingPlatformFee}
              bookingEstimatedDriverFare={bookingEstimatedDriverFare}
            />
            <TourTarget id="booking-confirm">
              <BookingReviewCard
                theme={theme}
                styles={styles}
                pickupAddress={sanitizeAddress(pickupLocation?.address || '')}
                dropoffAddress={sanitizeAddress(dropoffLocation?.address || '')}
                bookingTotalFare={bookingTotalFare}
                isBooking={isBooking}
                onReview={() => setBookingConfirmationVisible(true)}
              />
            </TourTarget>
          </>
        ) : null}

        {activeLocationPicker && (isPickupStep || isDestinationStep) ? (
          <View style={[styles.guideBox, styles.guideBoxCompact, { backgroundColor: theme.colors.inputBackground }]}>
            <MaterialCommunityIcons name="gesture-tap" size={20} color={BRAND.primary} />
            <Text style={[styles.guideText, { color: theme.colors.textSecondary }]}>
              Tap the map to set {activeLocationPicker === 'pickup' ? 'pickup' : 'destination'}.
            </Text>
          </View>
        ) : null}
      </BookingStepPanel>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />

      {/* Map */}
      {!isLocationSearchExpanded ? (
      <MapboxMap
        style={styles.map}
        latitude={currentLocation?.latitude || 6.5}
        longitude={currentLocation?.longitude || 3.3}
        zoom={12}
        mapStyle="navigation-day"
        showUserLocation
        showCompass
        showScaleBar
        fitCoordinates={routeCoordinates || bookingMapFocusCoordinates}
        routeCoordinates={routeCoordinates}
        cameraCenterCoordinate={cameraCenter}
        cameraZoom={cameraZoom}
        onPressCoordinate={handleMapLocationPick}
      >
        {pickupLocation && (
          <MapboxMarker
            id="pickup"
            coordinate={[pickupLocation.lng, pickupLocation.lat]}
            title="Pickup"
            color={BRAND.primary}
          />
        )}
        {dropoffLocation && (
          <MapboxMarker
            id="dropoff"
            coordinate={[dropoffLocation.lng, dropoffLocation.lat]}
            title="Dropoff"
            color={isLight ? '#000' : '#FFF'}
          />
        )}
      </MapboxMap>
      ) : (
        <View style={[styles.searchExpandedBackground, { backgroundColor: theme.colors.background }]} />
      )}

      {/* Header */}
      {!isLocationSearchExpanded ? (
      <View style={[styles.header, { top: insets.top + 10 }]}>
        {/* <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: theme.colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity> */}
        
        {pickupLocation && dropoffLocation && (
          <View style={[styles.pillBadge, { backgroundColor: BRAND.primary }]}>
            <Text style={styles.pillText}>₦{bookingTotalFare.toLocaleString()}</Text>
          </View>
        )}

        {/* Operational Areas Info Button */}
        <TouchableOpacity
          onPress={() => setShowOperationalAreasModal(true)}
          style={[styles.iconButton, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]}
        >
          <MaterialCommunityIcons name="information" size={20} color={BRAND.primary} />
        </TouchableOpacity>
      </View>
      ) : null}

      {renderStepSheet()}
      {/* Success Dialog */}
      <SuccessDialog
        visible={bookingSuccessVisible}
        title="Ride Booked!"
        message={
          lastBookedRideId
            ? `Your ride #${lastBookedRideId.slice(0, 8)} is being matched with nearby drivers. We'll notify you once a driver accepts.`
            : 'Your ride is being matched with nearby drivers. We\'ll notify you once a driver accepts.'
        }
        primaryActionText="View Ride Details"
        onPrimaryAction={handleViewBookedRide}
        secondaryActionText="Book Another"
        onSecondaryAction={() => setBookingSuccessVisible(false)}
        onClose={() => setBookingSuccessVisible(false)}
      />

      {/* Error Dialog */}
      <ErrorDialog
        visible={errorDialogVisible}
        title="Booking Failed"
        message={errorMessage}
        actionText="Try Again"
        onClose={() => setErrorDialogVisible(false)}
      />

      <AlertDialog
        visible={currentLocationUnavailableVisible}
        type="warning"
        title="Location unavailable"
        message="We could not read your current location yet. Please check location permission or search for the address manually."
        onDismiss={() => setCurrentLocationUnavailableVisible(false)}
      />

      <AlertDialog
        visible={Boolean(currentLocationPrompt)}
        type="confirm"
        title="Use current location?"
        message={`Use your current location as ${currentLocationPrompt === 'pickup' ? 'pickup' : 'destination'}?`}
        buttons={[
          { text: 'Not now', style: 'cancel' },
          { text: 'Use location', style: 'default', onPress: useCurrentLocationForPrompt },
        ]}
        onDismiss={() => setCurrentLocationPrompt(null)}
      />

      <Modal visible={Boolean(resolvingCurrentLocation)} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.locationWaitOverlay}>
          <View style={[styles.locationWaitCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ActivityIndicator color={BRAND.primary} />
            <Text style={[styles.locationWaitTitle, { color: theme.colors.textPrimary }]}>Please wait</Text>
            <Text style={[styles.locationWaitText, { color: theme.colors.textSecondary }]}>
              Getting your current {resolvingCurrentLocation === 'pickup' ? 'pickup' : 'destination'} address...
            </Text>
          </View>
        </View>
      </Modal>

      {/* Operational Areas Modal */}
      <OperationalAreasModal
        visible={showOperationalAreasModal}
        onClose={() => setShowOperationalAreasModal(false)}
      />

      {/* Out of Service Area Modal */}
      <OutOfServiceAreaModal
        visible={showOutOfServiceAreaModal}
        onClose={() => setShowOutOfServiceAreaModal(false)}
        closestArea={outOfServiceAreaInfo.closestArea}
        distance={outOfServiceAreaInfo.distance}
        onNavigateToArea={() => {
          setShowOutOfServiceAreaModal(false);
          setShowOperationalAreasModal(true);
        }}
        onAutoSelectNearestArea={handleAutoSelectNearestArea}
      />

      <Modal
        visible={locationWarningVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationWarningVisible(false)}
      >
        <View style={styles.warningOverlay}>
          <View style={[styles.warningCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="information-outline" size={30} color={BRAND.primary} />
            <Text style={[styles.warningTitle, { color: theme.colors.textPrimary }]}>Location notice</Text>
            <Text style={[styles.warningText, { color: theme.colors.textSecondary }]}>
              If no driver accepts this location within about an hour, it may not be actively served yet.
              You can still try other nearby Lagos locations for faster matching.
            </Text>
            <TouchableOpacity onPress={() => setLocationWarningVisible(false)} style={[styles.warningButton, { backgroundColor: BRAND.primary }]}>
              <Text style={styles.warningButtonText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pickup Time Selection Modal */}
      <PickupTimeModal
        visible={showPickupTimeModal}
        theme={theme}
        isLoading={isBooking}
        onConfirm={handlePickupTimeConfirmed}
        onCancel={() => setShowPickupTimeModal(false)}
      />

      <Modal
        visible={bookingConfirmationVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelBookingConfirmation}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.confirmModal, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.confirmIcon, { backgroundColor: `${BRAND.primary}22` }]}>
              <MaterialCommunityIcons name="receipt-text-check-outline" size={30} color={BRAND.primary} />
            </View>
            <Text style={[styles.confirmTitle, { color: theme.colors.textPrimary }]}>Confirm your ride</Text>
            <Text style={[styles.confirmCopy, { color: theme.colors.textSecondary }]}>
              Review the fare breakdown before we send this request to nearby drivers.
            </Text>
            <View style={[styles.confirmRoute, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
              <Text numberOfLines={2} style={[styles.confirmAddress, { color: theme.colors.textPrimary }]}>{sanitizeAddress(pickupLocation?.address || '')}</Text>
              <MaterialCommunityIcons name="arrow-down" size={18} color={BRAND.primary} />
              <Text numberOfLines={2} style={[styles.confirmAddress, { color: theme.colors.textPrimary }]}>{sanitizeAddress(dropoffLocation?.address || '')}</Text>
            </View>
            <View style={styles.confirmRows}>
              <View style={[styles.confirmRow, styles.confirmTotalRow, { borderTopColor: theme.colors.border }]}>
                <Text style={[styles.confirmTotalLabel, { color: theme.colors.textPrimary }]}>Total payable fare</Text>
                <Text style={[styles.confirmTotalValue, { color: BRAND.primary }]}>₦{bookingTotalFare.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.confirmActions}>
              <TouchableOpacity onPress={handleCancelBookingConfirmation} style={[styles.confirmButton, { borderColor: theme.colors.border }]}>
                <Text style={[styles.confirmButtonText, { color: theme.colors.textPrimary }]}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmBooking} style={[styles.confirmButton, { backgroundColor: BRAND.primary, borderColor: BRAND.primary }]}>
                <Text style={[styles.confirmButtonText, { color: '#000' }]}>Confirm Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!voiceLocationTarget} transparent animationType="fade" onRequestClose={closeVoiceLocation}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.voiceModal, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.voiceIcon, { backgroundColor: isVoiceListening ? `${BRAND.primary}28` : `${BRAND.primary}18` }]}>
              <MaterialCommunityIcons name={isVoiceListening ? 'microphone' : 'microphone-outline'} size={28} color={BRAND.primary} />
            </View>
            <Text style={[styles.voiceTitle, { color: theme.colors.textPrimary }]}>
              Voice location search
            </Text>
            <Text style={[styles.voiceCopy, { color: theme.colors.textSecondary }]}>
              Tap the mic and say the {voiceLocationTarget === 'pickup' ? 'pickup' : 'destination'} address. We will search Google Places with the transcript.
            </Text>
            <TouchableOpacity
              onPress={isVoiceListening ? stopVoiceLocationListening : startVoiceLocationListening}
              style={[
                styles.voiceRecordButton,
                {
                  backgroundColor: isVoiceListening ? '#FFE8E3' : BRAND.primary,
                  borderColor: isVoiceListening ? '#FFB5A6' : BRAND.primary,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isVoiceListening ? 'stop-circle-outline' : 'microphone-outline'}
                size={19}
                color={isVoiceListening ? '#B3261E' : '#000'}
              />
              <Text style={[styles.voiceRecordText, { color: isVoiceListening ? '#B3261E' : '#000' }]}>
                {isVoiceListening ? 'Stop recording' : 'Start speaking'}
              </Text>
            </TouchableOpacity>
            {!!voiceLocationError && (
              <Text style={styles.voiceErrorText}>{voiceLocationError}</Text>
            )}
            <TextInput
              style={[styles.voiceInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
              placeholder="Example: University of Lagos, Akoka"
              placeholderTextColor={theme.colors.textTertiary}
              value={voiceLocationText}
              onChangeText={setVoiceLocationText}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={applyVoiceLocationText}
            />
            <View style={styles.voiceActions}>
              <TouchableOpacity onPress={closeVoiceLocation} style={[styles.voiceButton, { borderColor: theme.colors.border }]}>
                <Text style={[styles.voiceButtonText, { color: theme.colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyVoiceLocationText} style={[styles.voiceButton, { backgroundColor: BRAND.primary, borderColor: BRAND.primary }]}>
                <Text style={[styles.voiceButtonText, { color: '#000' }]}>Find Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
