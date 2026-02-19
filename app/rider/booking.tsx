
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { sendLocalNotification } from '@/services/notificationService';
import { BRAND, COLORS } from '@/utils/colors';
import { ErrorDialog } from '@/components/ErrorDialog';
import { SuccessDialog } from '@/components/SuccessDialog';

// Fare calculation constants
const BASE_FARE_PER_KM = 600;
// const PLATFORM_FEE_PERCENTAGE = 0.15;
// const DRIVER_COMMISSION_PERCENTAGE = 0.85;

// Storage keys
const RECENT_SEARCHES_KEY = '@charter_keke_recent_searches';
const RECENT_LOCATIONS_KEY = '@charter_keke_recent_locations';
const MAX_RECENT_ITEMS = 5;

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
  lat: number;
  lng: number;
  isRecent?: boolean;
}

interface RecentLocation {
  address: string;
  lat: number;
  lng: number;
  timestamp: number;
}

// Utility function to sanitize addresses
const sanitizeAddress = (address: string): string => {
  if (!address) return '';
  return address.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
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
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);

  const scoredResults = locations.map(loc => {
    const addressLower = loc.address.toLowerCase();
    let score = 0;
    if (addressLower === queryLower) score += 10000;
    if (addressLower.startsWith(queryLower)) score += 5000;
    const levenDistance = levenshteinDistance(addressLower, queryLower);
    score += Math.max(0, 1000 - levenDistance * 50);
    for (const word of queryWords) {
      if (addressLower.includes(word)) score += 500;
    }
    return { ...loc, _score: score };
  });

  return scoredResults.filter(r => r._score > 100).sort((a, b) => b._score - a._score).slice(0, 8).map(({ _score, ...rest }) => rest);
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

export default function BookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { currentLocation } = useLocation();
  const mapRef = useRef<any>(null);

  // State
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [activeLocationPicker, setActiveLocationPicker] = useState<'pickup' | 'dropoff' | null>(null);
  const [pickupSearchResults, setPickupSearchResults] = useState<SearchResult[]>([]);
  const [dropoffSearchResults, setDropoffSearchResults] = useState<SearchResult[]>([]);
  const [showPickupResults, setShowPickupResults] = useState(false);
  const [showDropoffResults, setShowDropoffResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccessVisible, setBookingSuccessVisible] = useState(false);
  const [lastBookedRideId, setLastBookedRideId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isLight = theme.mode === 'light';

  useEffect(() => { loadRecentData(); loadUserName(); }, []);

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
      const [searches, locations] = await Promise.all([getRecentSearches(), getRecentLocations()]);
      setRecentSearches(searches);
      setRecentLocations(locations);
    } catch (error) { console.error('Error loading recent data:', error); }
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
    if (pickupLocation && dropoffLocation) {
      const distance = calculateDistance(pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng);
      const displayDistance = distance < 1 ? 1 : parseFloat(distance.toFixed(2));
      const rawFare = (distance < 1 ? 1 : distance) * BASE_FARE_PER_KM;
      const roundedFare = rawFare < 600 ? Math.ceil(rawFare / 100) * 100 : Math.ceil(rawFare / 10) * 10;
      
      setEstimatedDistance(displayDistance);
      setEstimatedFare(roundedFare);
    }
  }, [pickupLocation, dropoffLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (pickupLocation && dropoffLocation) {
      mapRef.current.fitToCoordinates(
        [{ latitude: pickupLocation.lat, longitude: pickupLocation.lng }, { latitude: dropoffLocation.lat, longitude: dropoffLocation.lng }],
        { animated: true, edgePadding: { top: 100, right: 50, left: 50, bottom: 350 } }
      );
    } else if (pickupLocation) {
      mapRef.current.animateToRegion({ latitude: pickupLocation.lat, longitude: pickupLocation.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 }, 500);
    } else if (dropoffLocation) {
      mapRef.current.animateToRegion({ latitude: dropoffLocation.lat, longitude: dropoffLocation.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 }, 500);
    } else if (currentLocation) {
      mapRef.current.animateToRegion({ latitude: currentLocation.latitude, longitude: currentLocation.longitude, latitudeDelta: 0.15, longitudeDelta: 0.15 }, 500);
    }
  }, [pickupLocation, dropoffLocation, currentLocation]);

  const handleSearch = async (query: string, type: 'pickup' | 'dropoff') => {
    if (!query || query.length < 1) {
      if (type === 'pickup') { setPickupSearchResults([]); setShowPickupResults(true); }
      else { setDropoffSearchResults([]); setShowDropoffResults(true); }
      return;
    }
    const results = searchLocations(query, MOCK_LOCATIONS, recentLocations);
    if (type === 'pickup') { setPickupSearchResults(results); setShowPickupResults(true); }
    else { setDropoffSearchResults(results); setShowDropoffResults(true); }
    await saveRecentSearch(query);
  };

  const selectSearchResult = async (result: SearchResult, type: 'pickup' | 'dropoff') => {
    const location: Location = { lat: result.lat, lng: result.lng, address: sanitizeAddress(result.address) };
    if (type === 'pickup') {
      setPickupLocation(location);
      setPickupSearch('');
      setPickupSearchResults([]);
      setShowPickupResults(false);
      setActiveLocationPicker(null);
    } else {
      setDropoffLocation(location);
      setDropoffSearch('');
      setDropoffSearchResults([]);
      setShowDropoffResults(false);
      setActiveLocationPicker(null);
    }
    await saveRecentLocation(location);
    setRecentLocations(await getRecentLocations());
  };

  const handleBookRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      setErrorMessage('Please select both pickup and dropoff locations');
      setErrorDialogVisible(true);
      return;
    }
    setIsBooking(true);
    try {
      const rideData = {
        pickup_location: {
          lat: pickupLocation.lat,
          lng: pickupLocation.lng,
          address: pickupLocation.address,
        },
        dropoff_location: {
          lat: dropoffLocation.lat,
          lng: dropoffLocation.lng,
          address: dropoffLocation.address,
        },
        estimated_distance: Number.isFinite(estimatedDistance) ? estimatedDistance : 0,
        number_of_seats: 1,
        pickup_time: new Date().toISOString(),
        fare_amount: Number.isFinite(estimatedFare) ? estimatedFare : 0,
        platform_fee: 0,
        driver_earnings: Number.isFinite(estimatedFare) ? estimatedFare : 0,
        seats_available: 4,
      };
      const response = await apiService.createRide(rideData);
      const rideId = response?.ride?.id || null;

      setLastBookedRideId(rideId);
      setPickupLocation(null);
      setDropoffLocation(null);
      setEstimatedFare(0);
      setEstimatedDistance(0);
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
    } finally { setIsBooking(false); }
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


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />

      {/* Map */}
      <MapboxMap
        ref={mapRef}
        style={styles.map}
        latitude={currentLocation?.latitude || 6.5}
        longitude={currentLocation?.longitude || 3.3}
        zoom={12}
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

      {/* Header */}
      <View style={[styles.header, { top: insets.top + 10 }]}>
        {/* <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: theme.colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity> */}
        
        {pickupLocation && dropoffLocation && (
          <View style={[styles.pillBadge, { backgroundColor: BRAND.primary }]}>
            <Text style={styles.pillText}>₦{estimatedFare.toLocaleString()}</Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.handleIndicator} />
        {/* <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}> */}
          {/* Greeting / Prompt */}
          {!pickupLocation && !dropoffLocation && !activeLocationPicker && (
            <View style={styles.greetingSection}>
              <Text style={[styles.greetingText, { color: theme.colors.textSecondary }]}>{getGreeting()}</Text>
              <Text style={[styles.promptText, { color: theme.colors.textPrimary }]}>Select your pickup and destination</Text>
            </View>
          )}


        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Pickup Input */}
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color={BRAND.primary} style={styles.inputIcon} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Pickup Location</Text>
              {pickupLocation ? (
                <View style={styles.selectedRow}>
                   <Text numberOfLines={2} style={[styles.selectedText, { color: theme.colors.textPrimary }]}>{sanitizeAddress(pickupLocation.address)}</Text>
                   <TouchableOpacity onPress={() => setPickupLocation(null)}>
                     <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textSecondary} />
                   </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                  placeholder="Where are you?"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={pickupSearch}
                  onChangeText={(t) => { setPickupSearch(t); handleSearch(t, 'pickup'); }}
                  onFocus={() => setShowPickupResults(true)}
                />
              )}
            </View>
            <TouchableOpacity onPress={() => setActiveLocationPicker('pickup')} style={styles.mapIconBtn}>
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color={activeLocationPicker === 'pickup' ? BRAND.primary : theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {showPickupResults && !pickupLocation && (
             <SearchResultsList results={pickupSearch ? pickupSearchResults : recentLocations} onSelect={(r: SearchResult) => selectSearchResult(r, 'pickup')} theme={theme} title={pickupSearch ? "Search Results" : "Recent Locations"} />
          )}

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Dropoff Input */}
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="map-marker-check" size={20} color={theme.colors.textPrimary} style={styles.inputIcon} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Destination</Text>
              {dropoffLocation ? (
                <View style={styles.selectedRow}>
                   <Text numberOfLines={2} style={[styles.selectedText, { color: theme.colors.textPrimary }]}>{sanitizeAddress(dropoffLocation.address)}</Text>
                   <TouchableOpacity onPress={() => setDropoffLocation(null)}>
                     <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textSecondary} />
                   </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                  placeholder="Where to?"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={dropoffSearch}
                  onChangeText={(t) => { setDropoffSearch(t); handleSearch(t, 'dropoff'); }}
                  onFocus={() => setShowDropoffResults(true)}
                />
              )}
            </View>
            <TouchableOpacity onPress={() => setActiveLocationPicker('dropoff')} style={styles.mapIconBtn}>
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color={activeLocationPicker === 'dropoff' ? BRAND.primary : theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {showDropoffResults && !dropoffLocation && (
             <SearchResultsList results={dropoffSearch ? dropoffSearchResults : recentLocations} onSelect={(r: SearchResult) => selectSearchResult(r, 'dropoff')} theme={theme} title={dropoffSearch ? "Search Results" : "Recent Locations"} />
          )}

          {/* Fare Card */}
          {pickupLocation && dropoffLocation && (
            <View style={[styles.fareCard, { backgroundColor: isLight ? '#FFF5E5' : '#2A1800', borderColor: BRAND.primary }]}>
              <View style={styles.fareRow}>
                 <View>
                   <Text style={[styles.fareLabel, { color: theme.colors.textSecondary }]}>Estimated Fare</Text>
                   <Text style={[styles.fareValue, { color: BRAND.primary }]}>₦{estimatedFare.toLocaleString()}</Text>
                 </View>
                 <View style={{ alignItems: 'flex-end' }}>
                   <Text style={[styles.fareLabel, { color: theme.colors.textSecondary }]}>Distance</Text>
                   <Text style={[styles.fareValueSmall, { color: theme.colors.textPrimary }]}>{estimatedDistance} km</Text>
                 </View>
              </View>
            </View>
          )}
                <View style={[styles.guideBox, { backgroundColor: theme.colors.inputBackground }]}>
                   <MaterialCommunityIcons name="gesture-tap" size={20} color={BRAND.primary} />
                   <Text style={[styles.guideText, { color: theme.colors.textSecondary }]}>Tip: You can tap the map icon to directly set a location on the map.</Text>
                </View>


          {/* Action Button */}
          <TouchableOpacity
            style={[styles.bookBtn, { backgroundColor: (!pickupLocation || !dropoffLocation || isBooking) ? theme.colors.border : BRAND.primary }]}
            disabled={!pickupLocation || !dropoffLocation || isBooking}
            onPress={handleBookRide}
            activeOpacity={0.9}
          >
            {isBooking ? <ActivityIndicator color="#000" /> : <Text style={styles.bookBtnText}>Book Ride Now</Text>}
          </TouchableOpacity>

        </ScrollView>
      </View>

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
    </View>
  );
}

const SearchResultsList = ({ results, onSelect, theme, title }: any) => (
  <View style={[styles.resultsList, { backgroundColor: theme.colors.inputBackground }]}>
    <Text style={[styles.resultsTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
    <ScrollView 
      style={styles.resultsScrollView}
      nestedScrollEnabled={true}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ paddingBottom: 8 }}
    >
      {results.map((item: any, idx: number) => (
        <TouchableOpacity 
          key={idx} 
          style={[
            styles.resultItem, 
            { 
              borderBottomColor: theme.colors.border, 
              borderBottomWidth: idx < results.length - 1 ? 1 : 0 
            }
          ]} 
          onPress={() => onSelect(item)}
        >
          <MaterialCommunityIcons name="map-marker" size={18} color={BRAND.primary} />
          <Text numberOfLines={2} style={[styles.resultText, { color: theme.colors.textPrimary }]}>
            {sanitizeAddress(item.address)}
          </Text>
        </TouchableOpacity>
      ))}
      {results.length === 0 && (
        <View style={styles.emptyResults}>
          <MaterialCommunityIcons name="map-search" size={32} color={theme.colors.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>No locations found</Text>
        </View>
      )}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  header: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pillBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pillText: { color: '#000', fontWeight: '700', fontSize: 16 },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  scrollContent: { padding: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  inputIcon: { marginTop: 4 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  input: {
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
    height: 24,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 2 },
  selectedText: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8, lineHeight: 20 },
  mapIconBtn: { padding: 8 },
  divider: { height: 1, marginVertical: 12, marginLeft: 32 },
  resultsList: {
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    maxHeight: 280,
  },
  resultsScrollView: {
    maxHeight: 220,
  },
  resultsTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  resultItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, paddingHorizontal: 4 },
  resultText: { fontSize: 14, flex: 1, lineHeight: 20 },
  emptyResults: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 13, marginTop: 8 },
  fareCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fareLabel: { fontSize: 12, fontWeight: '500' },
  fareValue: { fontSize: 24, fontWeight: '700', marginTop: 2 },
  fareValueSmall: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  bookBtn: {
    marginTop: 24,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  successTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  successMessage: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  successBtn: {
    marginTop: 18,
    backgroundColor: BRAND.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
  },
  successBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  guideBox: { marginTop: 20, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  guideText: { fontSize: 12, flex: 1, lineHeight: 18 },
  greetingSection: { marginBottom: 20 },
  greetingText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 10 },
  promptText: { fontSize: 24, fontWeight: '700', marginTop: 4, marginLeft: 10},});

const mapDarkStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#2f3948" }] },
  { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

