import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Animated,
  PanResponder,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';
// import RiderBottomNavigation from '@/components/RiderBottomNavigation';

const { width, height } = Dimensions.get('window');

// Fare calculation constants (matching web app)
const BASE_FARE_PER_KM = 600;
const PLATFORM_FEE_PERCENTAGE = 0.15;
const DRIVER_COMMISSION_PERCENTAGE = 0.85;

// Mock locations database for search (to avoid rate limiting)
const MOCK_LOCATIONS = [
  { address: 'Victoria Island, Lagos', lat: 6.4344, lng: 3.4277 },
  { address: 'Ikoyi, Lagos', lat: 6.4432, lng: 3.4233 },
  { address: 'Lekki, Lagos', lat: 6.4269, lng: 3.5701 },
  { address: 'Mainland, Lagos', lat: 6.5244, lng: 3.3792 },
  { address: 'Surulere, Lagos', lat: 6.4944, lng: 3.3425 },
  { address: 'Yaba, Lagos', lat: 6.5047, lng: 3.3542 },
  { address: 'Mushin, Lagos', lat: 6.5244, lng: 3.3842 },
  { address: 'Gbagada, Lagos', lat: 6.5803, lng: 3.4039 },
  { address: 'Shomolu, Lagos', lat: 6.5505, lng: 3.4152 },
  { address: 'Kosofe, Lagos', lat: 6.6042, lng: 3.4969 },
  { address: 'Ajah, Lagos', lat: 6.5871, lng: 3.5476 },
  { address: 'Epe, Lagos', lat: 6.5847, lng: 3.9942 },
  { address: 'Ikorodu, Lagos', lat: 6.5574, lng: 3.5033 },
  { address: 'Badagry, Lagos', lat: 6.4219, lng: 2.8992 },
  { address: 'Lagos Airport (Murtala), Lagos', lat: 6.5769, lng: 3.3215 },
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
}

export default function BookingScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const { currentLocation } = useLocation();
  const { user, token } = useAuth();
  const mapRef = useRef<MapView>(null);

  // State for locations
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');

  // State for location picker
  const [activeLocationPicker, setActiveLocationPicker] = useState<'pickup' | 'dropoff' | null>(null);
  const [pickupSearchResults, setPickupSearchResults] = useState<SearchResult[]>([]);
  const [dropoffSearchResults, setDropoffSearchResults] = useState<SearchResult[]>([]);
  const [showPickupResults, setShowPickupResults] = useState(false);
  const [showDropoffResults, setShowDropoffResults] = useState(false);

  // State for fare and booking
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [driverEarnings, setDriverEarnings] = useState(0);
  const [pickupTime, setPickupTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [seatsAvailable] = useState(4);
  const [isBooking, setIsBooking] = useState(false);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDropoff, setSearchingDropoff] = useState(false);

  const isDark = mode === 'dark';
  const colors = theme?.colors || {};

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
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
  };

  // Update fare when locations change
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      const distance = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        dropoffLocation.lat,
        dropoffLocation.lng
      );

      let rawFare: number;
      let displayDistance: number;

      if (distance < 1) {
        displayDistance = 1;
        rawFare = 1 * BASE_FARE_PER_KM;
      } else {
        displayDistance = parseFloat(distance.toFixed(2));
        rawFare = distance * BASE_FARE_PER_KM;
      }

      let roundedFare: number;
      if (rawFare < 600) {
        roundedFare = Math.ceil(rawFare / 100) * 100;
      } else {
        roundedFare = Math.ceil(rawFare / 10) * 10;
      }

      const platformFeeAmount = roundedFare * PLATFORM_FEE_PERCENTAGE;
      const driverEarningsAmount = roundedFare * DRIVER_COMMISSION_PERCENTAGE;

      setEstimatedDistance(displayDistance);
      setEstimatedFare(roundedFare);
      setPlatformFee(platformFeeAmount);
      setDriverEarnings(driverEarningsAmount);
    }
  }, [pickupLocation, dropoffLocation]);

  // Search locations (using mock database to avoid rate limiting)
  const handleSearch = (query: string, type: 'pickup' | 'dropoff') => {
    if (!query || query.length < 2) {
      if (type === 'pickup') {
        setPickupSearchResults([]);
      } else {
        setDropoffSearchResults([]);
      }
      return;
    }

    const queryLower = query.toLowerCase();
    const results = MOCK_LOCATIONS.filter((loc) =>
      loc.address.toLowerCase().includes(queryLower)
    ).slice(0, 5);

    if (type === 'pickup') {
      setPickupSearchResults(results);
      setShowPickupResults(true);
    } else {
      setDropoffSearchResults(results);
      setShowDropoffResults(true);
    }
  };

  // Select search result
  const selectSearchResult = (result: SearchResult, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') {
      setPickupLocation(result);
      setPickupSearch('');
      setPickupSearchResults([]);
      setShowPickupResults(false);
      setActiveLocationPicker(null);
    } else {
      setDropoffLocation(result);
      setDropoffSearch('');
      setDropoffSearchResults([]);
      setShowDropoffResults(false);
      setActiveLocationPicker(null);
    }
  };

  // Book ride
  const handleBookRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Error', 'Please select both pickup and dropoff locations');
      return;
    }

    setIsBooking(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Pass auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://192.168.196.143:3000/api/user/book-ride', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          estimated_distance: estimatedDistance,
          number_of_seats: 1,
          pickup_time: pickupTime,
          fare_amount: estimatedFare,
          platform_fee: platformFee,
          driver_earnings: driverEarnings,
          seats_available: seatsAvailable,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || `Error ${response.status}`;
        throw new Error(errorMsg);
      }

      Alert.alert('Success', 'Ride booked successfully! Finding drivers...', [
        {
          text: 'OK',
          onPress: () => {
            setPickupLocation(null);
            setDropoffLocation(null);
            setEstimatedFare(0);
            setEstimatedDistance(0);
            setPlatformFee(0);
            setDriverEarnings(0);
            router.push('/rider/active-ride');
          },
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to book ride';
      Alert.alert('Error', errorMessage);
      console.error('Booking error:', error);
    } finally {
      setIsBooking(false);
    }
  };

  const gradientColors = useMemo(() => {
    return isDark ? ['#797979', '#383838'] : ['#5F5F5F', '#BBBBBB'];
  }, [isDark]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Full-Screen Map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: currentLocation?.latitude || 6.5,
          longitude: currentLocation?.longitude || 3.3,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
        onPress={(event) => {
          if (activeLocationPicker) {
            const { coordinate } = event.nativeEvent;
            const newLocation = {
              lat: coordinate.latitude,
              lng: coordinate.longitude,
              address: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
            };
            if (activeLocationPicker === 'pickup') {
              setPickupLocation(newLocation);
              setActiveLocationPicker(null);
            } else {
              setDropoffLocation(newLocation);
              setActiveLocationPicker(null);
            }
          }
        }}
      >
        {pickupLocation && (
          <Marker
            coordinate={{ latitude: pickupLocation.lat, longitude: pickupLocation.lng }}
            title="Pickup Location"
            pinColor="#4CAF50"
          />
        )}
        {dropoffLocation && (
          <Marker
            coordinate={{ latitude: dropoffLocation.lat, longitude: dropoffLocation.lng }}
            title="Dropoff Location"
            pinColor="#F44336"
          />
        )}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
            pinColor="#2196F3"
          />
        )}
      </MapView>

      {/* Header Bar */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerBarTitle, { color: colors.textPrimary }]}>
          Book a Ride
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Bottom Sheet Overlay */}
      <View style={[styles.bottomSheet, { backgroundColor: colors.background }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.textSecondary }]} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Map Instruction */}
          {activeLocationPicker && (
            <View
              style={[
                styles.instruction,
                {
                  backgroundColor: colors.primary + '15',
                  borderColor: colors.primary,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.instructionText, { color: colors.primary }]}>
                Tap on map to set {activeLocationPicker === 'pickup' ? 'pickup' : 'dropoff'} location
              </Text>
            </View>
          )}

          {/* Pickup Location */}
          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <View
                style={[
                  styles.locationIcon,
                  { backgroundColor: '#4CAF50' + '20' },
                ]}
              >
                <MaterialCommunityIcons
                  name="map-marker"
                  size={18}
                  color="#4CAF50"
                />
              </View>
              <Text
                style={[
                  styles.locationLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Pickup Location
              </Text>
            </View>

            {!pickupLocation ? (
              <View style={styles.locationInputWrapper}>
                <TextInput
                  placeholder="Search or pick on map..."
                  placeholderTextColor={colors.textSecondary}
                  value={pickupSearch}
                  onChangeText={(text) => {
                    setPickupSearch(text);
                    handleSearch(text, 'pickup');
                  }}
                  onFocus={() => setShowPickupResults(true)}
                  style={[
                    styles.locationInput,
                    {
                      color: colors.textPrimary,
                      borderColor: colors.primary,
                      backgroundColor: colors.surfaceLight,
                    },
                  ]}
                />
                {searchingPickup && (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={styles.searchSpinner}
                  />
                )}

                {/* Search Results */}
                {showPickupResults && pickupSearchResults.length > 0 && (
                  <View
                    style={[
                      styles.searchResultsContainer,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {pickupSearchResults.map((result, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => selectSearchResult(result, 'pickup')}
                        style={[
                          styles.searchResult,
                          idx < pickupSearchResults.length - 1 && {
                            borderBottomColor: colors.border,
                            borderBottomWidth: 1,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={16}
                          color={colors.primary}
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.resultAddress,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {result.address}
                          </Text>
                          <Text
                            style={[
                              styles.resultCoords,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Pick on Map Button */}
                <TouchableOpacity
                  onPress={() => setActiveLocationPicker('pickup')}
                  style={[
                    styles.pickOnMapButton,
                    {
                      backgroundColor:
                        activeLocationPicker === 'pickup'
                          ? colors.primary + '25'
                          : colors.surfaceLight,
                      borderColor:
                        activeLocationPicker === 'pickup'
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      activeLocationPicker === 'pickup'
                        ? 'crosshairs-gps'
                        : 'map-marker-plus'
                    }
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.pickOnMapText,
                      {
                        color:
                          activeLocationPicker === 'pickup'
                            ? colors.primary
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {activeLocationPicker === 'pickup'
                      ? 'Tap on map...'
                      : 'Pick on map'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={[
                  styles.selectedLocation,
                  {
                    backgroundColor: '#4CAF50' + '15',
                    borderColor: '#4CAF50',
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={[styles.selectedAddress, { color: '#4CAF50' }]}
                  >
                    {pickupLocation.address}
                  </Text>
                  <Text
                    style={[
                      styles.selectedCoords,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {pickupLocation.lat.toFixed(4)},{' '}
                    {pickupLocation.lng.toFixed(4)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPickupLocation(null)}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color="#4CAF50"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Divider */}
          <View
            style={[styles.divider, { backgroundColor: colors.border }]}
          />

          {/* Dropoff Location */}
          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <View
                style={[
                  styles.locationIcon,
                  { backgroundColor: '#F44336' + '20' },
                ]}
              >
                <MaterialCommunityIcons
                  name="map-marker-check"
                  size={18}
                  color="#F44336"
                />
              </View>
              <Text
                style={[
                  styles.locationLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Dropoff Location
              </Text>
            </View>

            {!dropoffLocation ? (
              <View style={styles.locationInputWrapper}>
                <TextInput
                  placeholder="Search or pick on map..."
                  placeholderTextColor={colors.textSecondary}
                  value={dropoffSearch}
                  onChangeText={(text) => {
                    setDropoffSearch(text);
                    handleSearch(text, 'dropoff');
                  }}
                  onFocus={() => setShowDropoffResults(true)}
                  style={[
                    styles.locationInput,
                    {
                      color: colors.textPrimary,
                      borderColor: colors.primary,
                      backgroundColor: colors.surfaceLight,
                    },
                  ]}
                />
                {searchingDropoff && (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={styles.searchSpinner}
                  />
                )}

                {/* Search Results */}
                {showDropoffResults && dropoffSearchResults.length > 0 && (
                  <View
                    style={[
                      styles.searchResultsContainer,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {dropoffSearchResults.map((result, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => selectSearchResult(result, 'dropoff')}
                        style={[
                          styles.searchResult,
                          idx < dropoffSearchResults.length - 1 && {
                            borderBottomColor: colors.border,
                            borderBottomWidth: 1,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={16}
                          color={colors.primary}
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.resultAddress,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {result.address}
                          </Text>
                          <Text
                            style={[
                              styles.resultCoords,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Pick on Map Button */}
                <TouchableOpacity
                  onPress={() => setActiveLocationPicker('dropoff')}
                  style={[
                    styles.pickOnMapButton,
                    {
                      backgroundColor:
                        activeLocationPicker === 'dropoff'
                          ? colors.primary + '25'
                          : colors.surfaceLight,
                      borderColor:
                        activeLocationPicker === 'dropoff'
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      activeLocationPicker === 'dropoff'
                        ? 'crosshairs-gps'
                        : 'map-marker-plus'
                    }
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.pickOnMapText,
                      {
                        color:
                          activeLocationPicker === 'dropoff'
                            ? colors.primary
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {activeLocationPicker === 'dropoff'
                      ? 'Tap on map...'
                      : 'Pick on map'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={[
                  styles.selectedLocation,
                  {
                    backgroundColor: '#F44336' + '15',
                    borderColor: '#F44336',
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={[styles.selectedAddress, { color: '#F44336' }]}
                  >
                    {dropoffLocation.address}
                  </Text>
                  <Text
                    style={[
                      styles.selectedCoords,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {dropoffLocation.lat.toFixed(4)},{' '}
                    {dropoffLocation.lng.toFixed(4)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setDropoffLocation(null)}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color="#F44336"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Divider */}
          <View
            style={[styles.divider, { backgroundColor: colors.border }]}
          />

          {/* Fare Estimate */}
          {pickupLocation && dropoffLocation && (
            <View
              style={[
                styles.fareEstimate,
                {
                  backgroundColor: colors.primary + '15',
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[styles.fareTitle, { color: colors.textPrimary }]}
              >
                Fare Estimate
              </Text>

              <View style={styles.fareRow}>
                <Text
                  style={[styles.fareLabel, { color: colors.textSecondary }]}
                >
                  Distance
                </Text>
                <Text
                  style={[styles.fareValue, { color: colors.textPrimary }]}
                >
                  {estimatedDistance.toFixed(2)} km
                </Text>
              </View>

              <View style={styles.fareRow}>
                <Text
                  style={[styles.fareLabel, { color: colors.textSecondary }]}
                >
                  Rate/km
                </Text>
                <Text
                  style={[styles.fareValue, { color: colors.textPrimary }]}
                >
                  ₦{BASE_FARE_PER_KM}
                </Text>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.border, marginVertical: 8 },
                ]}
              />

              <View style={styles.fareRow}>
                <Text
                  style={[
                    styles.fareTotalLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Total Fare
                </Text>
                <Text
                  style={[
                    styles.fareTotalValue,
                    { color: colors.primary },
                  ]}
                >
                  ₦{estimatedFare.toLocaleString()}
                </Text>
              </View>

              <Text
                style={[styles.fareNote, { color: colors.textSecondary }]}
              >
                Pay directly to driver after ride
              </Text>
            </View>
          )}

          {/* Book Button */}
          <TouchableOpacity
            onPress={handleBookRide}
            disabled={!pickupLocation || !dropoffLocation || isBooking}
            activeOpacity={0.85}
            style={{ marginTop: 12 }}
          >
            <LinearGradient
              colors={
                !pickupLocation || !dropoffLocation || isBooking
                  ? [
                      colors.textSecondary || '#999999',
                      colors.textSecondary || '#999999',
                    ]
                  : [colors.primary || '#000000', (colors.primary || '#000000') + 'DD']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bookButton}
            >
              <View style={styles.bookButtonContent}>
                <MaterialCommunityIcons
                  name="car-side"
                  size={20}
                  color={isDark ? '#000000' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.bookButtonText,
                    { color: isDark ? '#000000' : '#FFFFFF' },
                  ]}
                >
                  {isBooking ? 'Booking...' : 'Book Ride'}
                </Text>
                {estimatedFare > 0 && (
                  <Text
                    style={[
                      styles.bookButtonPrice,
                      { color: isDark ? '#000000' : '#FFFFFF' },
                    ]}
                  >
                    ₦{estimatedFare.toLocaleString()}
                  </Text>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom Navigation - Positioned at the very bottom */}
      {/* <RiderBottomNavigation /> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    position: 'absolute',
    top: 38,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBarTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
    opacity: 0.4,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  instructionText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  locationSection: {
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationInputWrapper: {
    position: 'relative',
  },
  locationInput: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  searchSpinner: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  searchResultsContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  resultAddress: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultCoords: {
    fontSize: 10,
    marginTop: 2,
  },
  pickOnMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 8,
    gap: 6,
  },
  pickOnMapText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  selectedAddress: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedCoords: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  fareEstimate: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginVertical: 12,
  },
  fareTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fareLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  fareValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  fareTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fareTotalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  fareNote: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 8,
  },
  bookButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  bookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  bookButtonPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// export default function BookingScreen() {
//   const router = useRouter();
//   const { theme } = useTheme();
//   const { currentLocation } = useLocation();
//   const { createRide, isLoading } = useRide();
//   const [pickupAddress, setPickupAddress] = useState('Current Location');
//   const [destinationAddress, setDestinationAddress] = useState('');
//   const [rideType, setRideType] = useState('standard');
//   const [notes, setNotes] = useState('');
//   const [showRideOptions, setShowRideOptions] = useState(false);
//   const [showRecentLocations, setShowRecentLocations] = useState(false);
//   const [distance, setDistance] = useState(0);
//   const [estimatedFare, setEstimatedFare] = useState(0);

//   const isDark = theme?.mode === 'dark';
//   const colors = isDark ? COLORS.dark : COLORS.light;

//   // Memoized recent locations
//   const recentLocations = useMemo(
//     () => [
//       { icon: 'briefcase', label: 'Office', address: 'VI, Lagos' },
//       { icon: 'home', label: 'Home', address: 'Ikoyi, Lagos' },
//       { icon: 'shopping', label: 'Shopping', address: 'Lekki, Lagos' },
//     ],
//     []
//   );

//   // Memoized ride options
//   const rideOptions: RideOption[] = useMemo(
//     () => [
//       {
//         type: 'standard',
//         name: 'Standard',
//         label: 'Budget-friendly',
//         icon: 'car',
//         capacity: 4,
//         priceMultiplier: 1,
//       },
//       {
//         type: 'comfort',
//         name: 'Comfort',
//         label: 'Spacious & comfy',
//         icon: 'car-multiple',
//         capacity: 4,
//         priceMultiplier: 1.3,
//       },
//       {
//         type: 'premium',
//         name: 'Premium',
//         label: 'Luxury experience',
//         icon: 'star-circle',
//         capacity: 4,
//         priceMultiplier: 1.8,
//       },
//     ],
//     []
//   );

//   // Memoized header gradient
//   const HeaderGradient = useMemo(
//     () => (
//       <LinearGradient
//         colors={
//           isDark
//             ? ['#FFFFFF', '#F0F0F0']
//             : ['#000000', '#333333']
//         }
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         style={{
//           paddingHorizontal: 16,
//           paddingTop: 16,
//           paddingBottom: 20,
//         }}
//       >
//         <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
//           <TouchableOpacity
//             onPress={() => router.back()}
//             activeOpacity={0.7}
//           >
//             <MaterialCommunityIcons
//               name="arrow-left"
//               size={28}
//               color={isDark ? '#000000' : '#FFFFFF'}
//             />
//           </TouchableOpacity>
//           <Text
//             style={{
//               fontSize: 20,
//               fontWeight: '700',
//               color: isDark ? '#000000' : '#FFFFFF',
//               marginLeft: 12,
//               flex: 1,
//             }}
//           >
//             Book Ride
//           </Text>
//         </View>
//         <Text
//           style={{
//             fontSize: 13,
//             color: isDark ? '#666666' : '#CCCCCC',
//             fontWeight: '500',
//           }}
//         >
//           Where are you going?
//         </Text>
//       </LinearGradient>
//     ),
//     [isDark]
//   );

//   // Calculate fare
//   useEffect(() => {
//     if (destinationAddress) {
//       const mockDistance = Math.random() * 15 + 2;
//       setDistance(mockDistance);
//       const baseFare = Math.round(500 + mockDistance * 100);
//       const selectedRide = rideOptions.find((r) => r.type === rideType);
//       setEstimatedFare(
//         Math.round(baseFare * (selectedRide?.priceMultiplier || 1))
//       );
//     } else {
//       setDistance(0);
//       setEstimatedFare(0);
//     }
//   }, [destinationAddress, rideType, rideOptions]);

//   const handleSelectRide = (type: string) => {
//     setRideType(type);
//     setShowRideOptions(false);
//   };

//   const handleSelectLocation = (address: string) => {
//     setDestinationAddress(address);
//     setShowRecentLocations(false);
//   };

//   const handleBook = async () => {
//     if (!destinationAddress) {
//       alert('Please enter a destination');
//       return;
//     }

//     try {
//       const result = await createRide?.({
//         pickupLocation: pickupAddress,
//         dropoffLocation: destinationAddress,
//         rideType,
//         estimatedFare,
//         distance,
//         notes,
//       });

//       if (result?.success) {
//         router.push('/rider/active-ride');
//       }
//     } catch (error) {
//       console.error('Booking error:', error);
//     }
//   };

//   const currentRide = rideOptions.find((r) => r.type === rideType);

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         scrollEventThrottle={16}
//         contentContainerStyle={{ paddingBottom: 100 }}
//       >
//         {/* Header */}
//         {HeaderGradient}

//         {/* Location Cards */}
//         <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
//           {/* Pickup */}
//           <View style={{ marginBottom: 12 }}>
//             <Text
//               style={{
//                 fontSize: 12,
//                 fontWeight: '600',
//                 color: colors.textSecondary,
//                 marginBottom: 8,
//                 textTransform: 'uppercase',
//                 letterSpacing: 0.5,
//               }}
//             >
//               Pickup
//             </Text>
//             <View
//               style={{
//                 flexDirection: 'row',
//                 alignItems: 'center',
//                 paddingHorizontal: 12,
//                 paddingVertical: 12,
//                 borderRadius: 12,
//                 backgroundColor: colors.card,
//                 borderWidth: 1,
//                 borderColor: colors.border,
//               }}
//             >
//               <MaterialCommunityIcons
//                 name="map-marker"
//                 size={20}
//                 color={colors.primary}
//               />
//               <Text
//                 style={{
//                   fontSize: 14,
//                   fontWeight: '500',
//                   color: colors.text,
//                   marginLeft: 10,
//                   flex: 1,
//                 }}
//               >
//                 {pickupAddress}
//               </Text>
//             </View>
//           </View>

//           {/* Destination */}
//           <View style={{ marginBottom: 16 }}>
//             <Text
//               style={{
//                 fontSize: 12,
//                 fontWeight: '600',
//                 color: colors.textSecondary,
//                 marginBottom: 8,
//                 textTransform: 'uppercase',
//                 letterSpacing: 0.5,
//               }}
//             >
//               Destination
//             </Text>
//             <View
//               style={{
//                 flexDirection: 'row',
//                 alignItems: 'center',
//                 paddingHorizontal: 12,
//                 paddingVertical: 12,
//                 borderRadius: 12,
//                 backgroundColor: colors.card,
//                 borderWidth: 2,
//                 borderColor: colors.primary,
//               }}
//             >
//               <MaterialCommunityIcons
//                 name="map-search"
//                 size={20}
//                 color={colors.primary}
//               />
//               <TextInput
//                 placeholder="Search destination..."
//                 placeholderTextColor={colors.textSecondary}
//                 value={destinationAddress}
//                 onChangeText={setDestinationAddress}
//                 onFocus={() => setShowRecentLocations(destinationAddress === '')}
//                 style={{
//                   fontSize: 14,
//                   fontWeight: '500',
//                   color: colors.text,
//                   marginLeft: 10,
//                   flex: 1,
//                   paddingVertical: 0,
//                 }}
//               />
//               {destinationAddress ? (
//                 <TouchableOpacity onPress={() => setDestinationAddress('')}>
//                   <MaterialCommunityIcons
//                     name="close-circle"
//                     size={20}
//                     color={colors.textSecondary}
//                   />
//                 </TouchableOpacity>
//               ) : null}
//             </View>

//             {/* Recent Locations */}
//             {showRecentLocations && (
//               <View style={{ marginTop: 12 }}>
//                 <Text
//                   style={{
//                     fontSize: 12,
//                     fontWeight: '600',
//                     color: colors.textSecondary,
//                     marginBottom: 8,
//                   }}
//                 >
//                   Recent
//                 </Text>
//                 {recentLocations.map((loc, idx) => (
//                   <TouchableOpacity
//                     key={idx}
//                     onPress={() => handleSelectLocation(loc.address)}
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       paddingHorizontal: 12,
//                       paddingVertical: 10,
//                       marginBottom: 8,
//                       borderRadius: 10,
//                       backgroundColor: colors.card,
//                       borderWidth: 1,
//                       borderColor: colors.border,
//                     }}
//                   >
//                     <View
//                       style={{
//                         width: 36,
//                         height: 36,
//                         borderRadius: 8,
//                         backgroundColor: colors.primary + '15',
//                         justifyContent: 'center',
//                         alignItems: 'center',
//                       }}
//                     >
//                       <MaterialCommunityIcons
//                         name={loc.icon}
//                         size={18}
//                         color={colors.primary}
//                       />
//                     </View>
//                     <View style={{ marginLeft: 10, flex: 1 }}>
//                       <Text
//                         style={{
//                           fontSize: 13,
//                           fontWeight: '600',
//                           color: colors.text,
//                         }}
//                       >
//                         {loc.label}
//                       </Text>
//                       <Text
//                         style={{
//                           fontSize: 11,
//                           color: colors.textSecondary,
//                         }}
//                       >
//                         {loc.address}
//                       </Text>
//                     </View>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             )}
//           </View>

//           {/* Ride Type Selection */}
//           <View style={{ marginBottom: 16 }}>
//             <Text
//               style={{
//                 fontSize: 12,
//                 fontWeight: '600',
//                 color: colors.textSecondary,
//                 marginBottom: 8,
//                 textTransform: 'uppercase',
//                 letterSpacing: 0.5,
//               }}
//             >
//               Ride Type
//             </Text>
//             <TouchableOpacity
//               onPress={() => setShowRideOptions(!showRideOptions)}
//               style={{
//                 flexDirection: 'row',
//                 alignItems: 'center',
//                 justifyContent: 'space-between',
//                 paddingHorizontal: 12,
//                 paddingVertical: 12,
//                 borderRadius: 12,
//                 backgroundColor: colors.card,
//                 borderWidth: 2,
//                 borderColor: colors.primary,
//               }}
//             >
//               <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
//                 <MaterialCommunityIcons
//                   name={currentRide?.icon || 'car'}
//                   size={20}
//                   color={colors.primary}
//                 />
//                 <View style={{ marginLeft: 10, flex: 1 }}>
//                   <Text
//                     style={{
//                       fontSize: 13,
//                       fontWeight: '600',
//                       color: colors.text,
//                     }}
//                   >
//                     {currentRide?.name}
//                   </Text>
//                   <Text
//                     style={{
//                       fontSize: 11,
//                       color: colors.textSecondary,
//                     }}
//                   >
//                     {currentRide?.label}
//                   </Text>
//                 </View>
//               </View>
//               <MaterialCommunityIcons
//                 name={showRideOptions ? 'chevron-up' : 'chevron-down'}
//                 size={20}
//                 color={colors.primary}
//               />
//             </TouchableOpacity>

//             {showRideOptions && (
//               <View style={{ marginTop: 12 }}>
//                 {rideOptions.map((option) => (
//                   <TouchableOpacity
//                     key={option.type}
//                     onPress={() => handleSelectRide(option.type)}
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       paddingHorizontal: 12,
//                       paddingVertical: 12,
//                       marginBottom: 8,
//                       borderRadius: 10,
//                       backgroundColor:
//                         rideType === option.type
//                           ? colors.primary + '15'
//                           : colors.card,
//                       borderWidth: 1,
//                       borderColor:
//                         rideType === option.type ? colors.primary : colors.border,
//                     }}
//                   >
//                     <View
//                       style={{
//                         width: 40,
//                         height: 40,
//                         borderRadius: 8,
//                         backgroundColor:
//                           rideType === option.type
//                             ? colors.primary + '25'
//                             : colors.background,
//                         justifyContent: 'center',
//                         alignItems: 'center',
//                       }}
//                     >
//                       <MaterialCommunityIcons
//                         name={option.icon}
//                         size={22}
//                         color={
//                           rideType === option.type
//                             ? colors.primary
//                             : colors.textSecondary
//                         }
//                       />
//                     </View>
//                     <View style={{ marginLeft: 12, flex: 1 }}>
//                       <Text
//                         style={{
//                           fontSize: 13,
//                           fontWeight: '600',
//                           color: colors.text,
//                         }}
//                       >
//                         {option.name}
//                       </Text>
//                       <Text
//                         style={{
//                           fontSize: 11,
//                           color: colors.textSecondary,
//                         }}
//                       >
//                         {option.capacity} passengers • {option.label}
//                       </Text>
//                     </View>
//                     <Text
//                       style={{
//                         fontSize: 13,
//                         fontWeight: '700',
//                         color: colors.primary,
//                       }}
//                     >
//                       {Math.round(500 * option.priceMultiplier)}+
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             )}
//           </View>

//           {/* Notes */}
//           <View style={{ marginBottom: 16 }}>
//             <Text
//               style={{
//                 fontSize: 12,
//                 fontWeight: '600',
//                 color: colors.textSecondary,
//                 marginBottom: 8,
//                 textTransform: 'uppercase',
//                 letterSpacing: 0.5,
//               }}
//             >
//               Special Instructions
//             </Text>
//             <TextInput
//               placeholder="Add notes for driver..."
//               placeholderTextColor={colors.textSecondary}
//               value={notes}
//               onChangeText={setNotes}
//               multiline
//               numberOfLines={3}
//               style={{
//                 paddingHorizontal: 12,
//                 paddingVertical: 10,
//                 borderRadius: 10,
//                 backgroundColor: colors.card,
//                 borderWidth: 1,
//                 borderColor: colors.border,
//                 color: colors.text,
//                 fontWeight: '500',
//                 maxHeight: 100,
//               }}
//             />
//           </View>

//           {/* Fare Breakdown */}
//           {distance > 0 && (
//             <View
//               style={{
//                 paddingHorizontal: 12,
//                 paddingVertical: 14,
//                 borderRadius: 12,
//                 backgroundColor: colors.primary + '10',
//                 borderWidth: 1.5,
//                 borderColor: colors.primary,
//                 marginBottom: 16,
//               }}
//             >
//               <View
//                 style={{
//                   flexDirection: 'row',
//                   justifyContent: 'space-between',
//                   alignItems: 'center',
//                   marginBottom: 10,
//                 }}
//               >
//                 <Text
//                   style={{
//                     fontSize: 13,
//                     fontWeight: '500',
//                     color: colors.textSecondary,
//                   }}
//                 >
//                   Distance
//                 </Text>
//                 <Text
//                   style={{
//                     fontSize: 13,
//                     fontWeight: '600',
//                     color: colors.text,
//                   }}
//                 >
//                   {distance.toFixed(1)} km
//                 </Text>
//               </View>
//               <View
//                 style={{
//                   flexDirection: 'row',
//                   justifyContent: 'space-between',
//                   alignItems: 'center',
//                 }}
//               >
//                 <Text
//                   style={{
//                     fontSize: 13,
//                     fontWeight: '500',
//                     color: colors.textSecondary,
//                   }}
//                 >
//                   Estimated Fare
//                 </Text>
//                 <Text
//                   style={{
//                     fontSize: 16,
//                     fontWeight: '700',
//                     color: colors.primary,
//                   }}
//                 >
//                   ₦{estimatedFare?.toLocaleString()}
//                 </Text>
//               </View>
//             </View>
//           )}

//           {/* Book Button */}
//           <TouchableOpacity
//             onPress={handleBook}
//             disabled={!destinationAddress || isLoading}
//             activeOpacity={0.85}
//           >
//             <LinearGradient
//               colors={
//                 !destinationAddress || isLoading
//                   ? [colors.textSecondary || '#999999', colors.textSecondary || '#999999']
//                   : [colors.primary || '#00CCFF', (colors.primary || '#00CCFF') + 'DD']
//               }
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//               style={{
//                 paddingVertical: 14,
//                 borderRadius: 12,
//                 alignItems: 'center',
//               }}
//             >
//               <Text
//                 style={{
//                   fontSize: 16,
//                   fontWeight: '700',
//                   color: isDark ? '#000000' : '#FFFFFF',
//                 }}
//               >
//                 {isLoading
//                   ? 'Confirming...'
//                   : `Confirm Ride • ₦${estimatedFare?.toLocaleString() || '0'}`}
//               </Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>

//       {/* Bottom Navigation */}
//       <RiderBottomNavigation />
//     </SafeAreaView>
//   );
// }

