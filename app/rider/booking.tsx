import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { BRAND, COLORS } from '@/utils/colors';
import { locationService } from '@/services/location';
import { geocodeMapboxLocations } from '@/utils/mapboxGeocoding';
import {
  searchGoogleAutocomplete,
  getGooglePlaceDetails,
} from '@/utils/googlePlacesSearch';
import { fetchMapboxRoute } from '@/utils/mapboxDirections';
import { apiService } from '@/services/api';
import { calculateRideFare, getBookingPricingConfig, roundDistanceKm } from '@/services/bookingService';
import { createRideBooking } from '@/services/ridesService';
import { getWeatherImpact } from '@/services/weatherService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import bookingStyles, { mapDarkStyle } from './booking.styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  distance?: string;
  lat?: number | null;
  lng?: number | null;
  placeId?: string;
}

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface WeatherData {
  status: string;
  label: string;
  detail: string;
  multiplier: number;
  surchargeRate: number;
  precipitationMm: number;
  icon: string;
}

type BookingStep = 'pickup' | 'destination' | 'time' | 'review';

const RECENT_LOCATIONS_KEY = '@charter_keke_recent_locations';
const MAX_RECENT_ITEMS = 5;

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLight = theme.mode === 'light';

  // Location states
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [activeLocationPicker, setActiveLocationPicker] = useState<'pickup' | 'destination' | null>(null);

  // UI states
  const [currentStep, setCurrentStep] = useState<BookingStep>('pickup');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isPrewarmingLocation, setIsPrewarmingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerType, setMapPickerType] = useState<'pickup' | 'destination' | null>(null);
  const [showInlineMapPicker, setShowInlineMapPicker] = useState(false);
  const [cameraCenter, setCameraCenter] = useState<[number, number]>([3.3792, 6.5244]); // Lagos center
  const [cameraZoom, setCameraZoom] = useState(12);
  const [showCashback, setShowCashback] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [discountedFare, setDiscountedFare] = useState<number | null>(null);

  // Feature states
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [cashbackRewards, setCashbackRewards] = useState<any[]>([]);
  const [selectedCashback, setSelectedCashback] = useState<any | null>(null);
  const [pricingConfig, setPricingConfig] = useState<any>(null);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);
  const [recentLocations, setRecentLocations] = useState<Location[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);

  // Error states
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Refs
  const pickupInputRef = useRef<TextInput>(null);
  const destinationInputRef = useRef<TextInput>(null);
  const pickupBlurTimer = useRef<number | null>(null);
  const destinationBlurTimer = useRef<number | null>(null);
  const locationCardRef = useRef<View>(null);
  const [suggestionsTop, setSuggestionsTop] = useState(300);
  // Google Places session token (reset per session to save API costs)
  const placesSessionToken = useRef<string>(`session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const resetSessionToken = () => {
    placesSessionToken.current = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  };

  // Keyboard handling
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounced search
  const pickupSearchTimer = useRef<number | null>(null);
  const destinationSearchTimer = useRef<number | null>(null);

  // Helper to get street-level address
  const getStreetAddress = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await apiService.get(`/location/reverse-geocode?lat=${lat}&lon=${lng}`);
      if (response && (response as any).address) {
        return (response as any).address;
      }
      return null;
    } catch (error) {
      console.error('Error getting street address:', error);
      return null;
    }
  };

  // Sanitize address to ensure it's street-level
  const sanitizeAddress = (address: string): string => {
    if (!address) return 'Unknown location';

    // Remove overly generic addresses
    const genericPatterns = [
      /^(Unnamed )?Road/i,
      /^(Unnamed )?Street/i,
      /^Road \d+/i,
      /^Street \d+/i,
      /^Way \d+/i,
      /^Avenue \d+/i,
    ];

    for (const pattern of genericPatterns) {
      if (pattern.test(address)) {
        // Try to extract more specific parts
        const parts = address.split(',').filter(p => p.trim());
        if (parts.length > 1) {
          return parts.slice(0, 2).join(', ').trim();
        }
      }
    }

    return address;
  };

  // Handle URL params
  useEffect(() => {
    const pickup = typeof params.pickup === 'string' ? params.pickup.trim() : '';
    const destination = typeof params.destination === 'string' ? params.destination.trim() : '';

    if (pickup) {
      setPickupLocation({ lat: 0, lng: 0, address: pickup });
      setPickupSearch(pickup);
    }
    if (destination) {
      setDestinationLocation({ lat: 0, lng: 0, address: destination });
      setDestinationSearch(destination);
    }
  }, [params]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pickupSearchTimer.current) {
        clearTimeout(pickupSearchTimer.current);
      }
      if (destinationSearchTimer.current) {
        clearTimeout(destinationSearchTimer.current);
      }
    };
  }, []);

  const loadInitialData = async () => {
    try {
      // Load pricing config
      const config = await getBookingPricingConfig();
      setPricingConfig(config);

      // Load recent locations
      const recent = await getRecentLocations();
      setRecentLocations(recent);

      // Load cashback rewards
      const cashbackResponse = await apiService.get('/user/cashback');
      if (cashbackResponse && (cashbackResponse as any).availableRewards) {
        setCashbackRewards((cashbackResponse as any).availableRewards);
      }

      // Don't auto-trigger current location - only when user clicks the button
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const getRecentLocations = async (): Promise<Location[]> => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
      if (stored) {
        const locations = JSON.parse(stored);
        return locations.slice(0, MAX_RECENT_ITEMS);
      }
    } catch (error) {
      console.error('Error loading recent locations:', error);
    }
    return [];
  };

  const saveRecentLocation = async (location: Location) => {
    try {
      const recent = await getRecentLocations();
      const updated = [location, ...recent.filter(l => l.address !== location.address)].slice(0, MAX_RECENT_ITEMS);
      await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
      setRecentLocations(updated);
    } catch (error) {
      console.error('Error saving recent location:', error);
    }
  };

  const prewarmCurrentLocation = async () => {
    try {
      setIsPrewarmingLocation(true);
      const location = await locationService.getCurrentLocation();
      if (location) {
        // Reverse geocode using backend API
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.198.143:3000';
        const cleanApiUrl = apiUrl.replace(/\/api$/, '');
        const response = await fetch(
          `${cleanApiUrl}/api/location/reverse-geocode?lat=${location.latitude}&lon=${location.longitude}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.address && data.success) {
            setPickupLocation({
              lat: location.latitude,
              lng: location.longitude,
              address: sanitizeAddress(data.address),
            });
            setPickupSearch(sanitizeAddress(data.address));
          }
        }
      }
    } catch (error) {
      console.error('Error prewarming location:', error);
    } finally {
      setIsPrewarmingLocation(false);
    }
  };

  const loadWeather = async (location: Location) => {
    try {
      const impact = await getWeatherImpact(location.lat, location.lng);
      if (impact) {
        setWeather(impact);
      }
    } catch (error) {
      console.error('Error loading weather:', error);
    }
  };

  // Unified location search: Google Places → Mapbox fallback
  const searchLocations = async (text: string): Promise<LocationSuggestion[]> => {
    // 1. Try Google Places Autocomplete (street-level, best quality)
    try {
      const googleResults = await searchGoogleAutocomplete(text, placesSessionToken.current, {
        preferPreciseAddresses: true,
      });
      if (googleResults.length > 0) {
        return googleResults.map((r, i) => ({
          id: r.placeId || `google-${i}`,
          name: r.name || r.address.split(',')[0],
          address: r.address,
          lat: r.lat ?? undefined,
          lng: r.lng ?? undefined,
          placeId: r.placeId,
        }));
      }
    } catch (e) {
      console.log('[Search] Google Places failed, falling back to Mapbox:', e);
    }

    // 2. Mapbox Geocoding fallback
    try {
      const mapboxResults = await geocodeMapboxLocations(text);
      return mapboxResults.map((r, i) => ({
        id: `mapbox-${i}`,
        name: r.placeName.split(',')[0] || r.placeName,
        address: r.placeName,
        lat: r.coordinate[1],
        lng: r.coordinate[0],
        placeId: undefined,
      }));
    } catch (e) {
      console.log('[Search] Mapbox fallback also failed:', e);
    }

    return [];
  };

  const handlePickupChange = (text: string) => {
    setPickupSearch(text);

    if (pickupSearchTimer.current) clearTimeout(pickupSearchTimer.current);

    if (text.length > 2) {
      setIsSearching(true);
      pickupSearchTimer.current = setTimeout(async () => {
        try {
          const suggestions = await searchLocations(text);
          setPickupSuggestions(suggestions);
          setShowPickupSuggestions(true);
        } catch (error) {
          console.error('Error searching pickup:', error);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    } else {
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
      setIsSearching(false);
    }
  };

  const handleDestinationChange = (text: string) => {
    setDestinationSearch(text);

    if (destinationSearchTimer.current) clearTimeout(destinationSearchTimer.current);

    if (text.length > 2) {
      setIsSearching(true);
      destinationSearchTimer.current = setTimeout(async () => {
        try {
          const suggestions = await searchLocations(text);
          setDestinationSuggestions(suggestions);
          setShowDestinationSuggestions(true);
        } catch (error) {
          console.error('Error searching destination:', error);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    } else {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      setIsSearching(false);
    }
  };

  const handlePickupSelect = async (suggestion: LocationSuggestion) => {
    setIsLoading(true);
    try {
      let lat = suggestion.lat;
      let lng = suggestion.lng;
      let address = suggestion.address;

      // If we have a placeId but no coords (Google Places autocomplete), resolve them
      if (suggestion.placeId && (!lat || !lng)) {
        try {
          const details = await getGooglePlaceDetails(suggestion.placeId, placesSessionToken.current);
          if (details) {
            lat = details.lat ?? lat;
            lng = details.lng ?? lng;
            address = details.address || address;
          }
          resetSessionToken(); // New session after a place is selected
        } catch (e) {
          console.log('[Pickup] Place details failed, using coords from suggestion:', e);
        }
      }

      if (!lat || !lng) {
        setErrorMessage('Could not get coordinates for this location. Please try another.');
        setShowErrorDialog(true);
        return;
      }

      const location: Location = {
        lat,
        lng,
        address: sanitizeAddress(address),
      };

      setPickupLocation(location);
      setPickupSearch(location.address);
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
      setActiveLocationPicker(null);
      setDiscountedFare(null);
      // Pan background map to pickup
      setCameraCenter([location.lng, location.lat]);
      setCameraZoom(15);

      await saveRecentLocation(location);
      await loadWeather(location);

      Keyboard.dismiss();
      setCurrentStep('destination');
      destinationInputRef.current?.focus();
    } catch (error) {
      console.error('Error selecting pickup:', error);
      setErrorMessage('Failed to select pickup location. Please try again.');
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDestinationSelect = async (suggestion: LocationSuggestion) => {
    setIsLoading(true);
    try {
      let lat = suggestion.lat;
      let lng = suggestion.lng;
      let address = suggestion.address;

      // Resolve placeId → coords if needed (Google Places autocomplete)
      if (suggestion.placeId && (!lat || !lng)) {
        try {
          const details = await getGooglePlaceDetails(suggestion.placeId, placesSessionToken.current);
          if (details) {
            lat = details.lat ?? lat;
            lng = details.lng ?? lng;
            address = details.address || address;
          }
          resetSessionToken();
        } catch (e) {
          console.log('[Destination] Place details failed, using coords from suggestion:', e);
        }
      }

      if (!lat || !lng) {
        setErrorMessage('Could not get coordinates for this location. Please try another.');
        setShowErrorDialog(true);
        return;
      }

      // Only reverse-geocode when we DON'T have a good address (e.g. from map tap)
      // If we came from Google Places, the address is already precise — don't override it
      const finalAddress = suggestion.placeId
        ? sanitizeAddress(address)
        : (await getStreetAddress(lat, lng)) || sanitizeAddress(address);

      const location: Location = {
        lat,
        lng,
        address: finalAddress,
      };

      setDestinationLocation(location);
      setDestinationSearch(location.address);
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      setActiveLocationPicker(null);
      setDiscountedFare(null);
      // Pan background map to show both points
      setCameraCenter([location.lng, location.lat]);
      setCameraZoom(13);

      await saveRecentLocation(location);

      Keyboard.dismiss();
      await calculateEstimate();
      setCurrentStep('time');
    } catch (error) {
      console.error('Error selecting destination:', error);
      setErrorMessage('Failed to select destination. Please try again.');
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEstimate = async () => {
    if (!pickupLocation || !destinationLocation) return;

    try {
      console.log('Calculating estimate with config:', pricingConfig);

      const distanceKm = calculateDistance(pickupLocation.lat, pickupLocation.lng, destinationLocation.lat, destinationLocation.lng);
      const roundedDistance = roundDistanceKm(distanceKm);
      const fare = calculateRideFare(roundedDistance, pricingConfig || {});
      const estimatedMinutes = Math.round(roundedDistance * 3);

      setEstimatedDistance(roundedDistance);
      setEstimatedFare(fare);
      setEstimatedTime(estimatedMinutes);

      // Fetch actual route for map display
      try {
        const route = await fetchMapboxRoute(
          [pickupLocation.lng, pickupLocation.lat],
          [destinationLocation.lng, destinationLocation.lat],
          { profile: 'driving' }
        );
        if (route && route.coordinates.length >= 2) {
          setRouteCoordinates(route.coordinates);
          // Use actual route distance if available
          if (route.distanceKm > 0) {
            const actualRounded = roundDistanceKm(route.distanceKm);
            setEstimatedDistance(actualRounded);
            setEstimatedFare(calculateRideFare(actualRounded, pricingConfig || {}));
            setEstimatedTime(Math.round(route.durationMin));
          }
        }
      } catch (routeErr) {
        console.log('Route fetch failed, using haversine distance:', routeErr);
      }
    } catch (error) {
      console.error('Error calculating estimate:', error);
      const distanceKm = calculateDistance(pickupLocation.lat, pickupLocation.lng, destinationLocation.lat, destinationLocation.lng);
      const roundedDistance = roundDistanceKm(distanceKm);
      setEstimatedDistance(roundedDistance);
      setEstimatedFare(roundedDistance * 100);
      setEstimatedTime(Math.round(roundedDistance * 3));
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    try {
      await prewarmCurrentLocation();
    } catch (error) {
      setErrorMessage('Could not get your current location. Please check your GPS settings.');
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRecentLocation = (location: Location, type: 'pickup' | 'destination') => {
    // Dismiss keyboard
    Keyboard.dismiss();

    if (type === 'pickup') {
      setPickupLocation(location);
      setPickupSearch(location.address);
      setShowPickupSuggestions(false);
      loadWeather(location);
      setCurrentStep('destination');
      destinationInputRef.current?.focus();
    } else {
      setDestinationLocation(location);
      setDestinationSearch(location.address);
      setShowDestinationSuggestions(false);
      calculateEstimate();
      setCurrentStep('time');
    }
  };

  const handleCashbackSelect = (reward: any) => {
    setSelectedCashback(reward);
    // Calculate discounted fare
    if (estimatedFare) {
      const discount = Math.round(estimatedFare * (reward.discount_percentage / 100));
      setDiscountedFare(Math.max(0, estimatedFare - discount));
    }
  };

  const handleCashbackRemove = () => {
    setSelectedCashback(null);
    setDiscountedFare(null);
  };

  const handleBookRide = () => {
    if (!pickupLocation || !destinationLocation) {
      setErrorMessage('Please select both pickup and destination locations.');
      setShowErrorDialog(true);
      return;
    }

    // Open time selection modal
    setShowTimePicker(true);
  };

  const handleCustomTimeSelect = () => {
    setPickerMode('date');
    setShowCustomDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCustomDatePicker(false);
    }

    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'ios') {
        setPickerMode('time');
      } else {
        // Android - show time picker next
        setTimeout(() => {
          setPickerMode('time');
          setShowCustomDatePicker(true);
        }, 100);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowCustomDatePicker(false);
    }

    if (selectedTime) {
      const combinedDate = new Date(tempDate);
      combinedDate.setHours(selectedTime.getHours());
      combinedDate.setMinutes(selectedTime.getMinutes());
      setTempDate(combinedDate);

      if (Platform.OS === 'ios') {
        // iOS - user can still adjust, confirm manually
      } else {
        // Android - automatically confirm after time selection
        handleCustomTimeConfirm();
      }
    }
  };

  const handleCustomTimeConfirm = () => {
    handleTimeSelect(tempDate.toISOString());
    setShowCustomDatePicker(false);
    setPickerMode('date');
  };

  const handleTimeSelect = async (time: string | null) => {
    setPickupTime(time);
    setShowTimePicker(false);

    // Ensure fare is calculated before showing review
    if (pickupLocation && destinationLocation && !estimatedFare) {
      await calculateEstimate();
    }

    // After time selection, show review modal
    setShowReviewModal(true);
  };

  const handleConfirmBooking = async () => {
    setIsLoading(true);
    try {
      const bookingData = {
        pickup: {
          lat: pickupLocation!.lat,
          lng: pickupLocation!.lng,
          address: pickupLocation!.address,
        },
        dropoff: {
          lat: destinationLocation!.lat,
          lng: destinationLocation!.lng,
          address: destinationLocation!.address,
        },
        distanceKm: estimatedDistance || 0,
        durationMinutes: estimatedTime || 0,
        pickupTime: pickupTime || new Date().toISOString(),
        // Always send the ORIGINAL fare — server applies cashback discount itself
        // via cashback_reward_id. Sending pre-discounted fare causes double-discount.
        fare: estimatedFare || 0,
        pricingConfig: pricingConfig,
        weatherImpact: weather || null,
        cashback_reward_id: selectedCashback?.id,
      };

      const response = await createRideBooking(bookingData);

      if (response) {
        setShowReviewModal(false);
        const rideId = response.ride?.id || response.id;
        router.push({
          pathname: '/rider/active-ride',
          params: { rideId },
        });
      }
    } catch (error) {
      console.error('Error booking ride:', error);
      setErrorMessage('Failed to book ride. Please try again.');
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickupFocus = () => {
    setActiveLocationPicker('pickup');
    setShowPickupSuggestions(true);
    setShowDestinationSuggestions(false);
  };

  const handleOpenMapPicker = (type: 'pickup' | 'destination') => {
    setMapPickerType(type);
    setShowInlineMapPicker(true);
    setShowMapPicker(false);
    Keyboard.dismiss();
  };

  const handleCloseInlineMapPicker = () => {
    setShowInlineMapPicker(false);
    setMapPickerType(null);
  };

  const handleConfirmInlineMapPicker = async () => {
    if (cameraCenter) {
      await handleMapLocationSelect({
        latitude: cameraCenter[1],
        longitude: cameraCenter[0],
      });
    }
    setShowInlineMapPicker(false);
  };

  const handleMapLocationSelect = async (coordinates: { latitude: number; longitude: number }) => {
    try {
      // Get street-level address for the selected coordinates
      const address = await getStreetAddress(coordinates.latitude, coordinates.longitude);

      const location: Location = {
        lat: coordinates.latitude,
        lng: coordinates.longitude,
        address: address || `Selected location (${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)})`,
      };

      if (mapPickerType === 'pickup') {
        setPickupLocation(location);
        setPickupSearch(location.address);
        loadWeather(location);
        setDiscountedFare(null); // Reset discounted fare when location changes
        setCurrentStep('destination');
        destinationInputRef.current?.focus();
      } else {
        setDestinationLocation(location);
        setDestinationSearch(location.address);
        setDiscountedFare(null); // Reset discounted fare when location changes
        calculateEstimate();
        setCurrentStep('time');
      }

      setShowMapPicker(false);
      setMapPickerType(null);
    } catch (error) {
      console.error('Error getting street address:', error);
    }
  };

  const handleDestinationFocus = () => {
    setActiveLocationPicker('destination');
    setShowDestinationSuggestions(true);
    setShowPickupSuggestions(false);
  };

  const handlePickupBlur = () => {
    if (pickupBlurTimer.current) clearTimeout(pickupBlurTimer.current);
    pickupBlurTimer.current = setTimeout(() => {
      setShowPickupSuggestions(false);
    }, 200);
  };

  const handleDestinationBlur = () => {
    if (destinationBlurTimer.current) clearTimeout(destinationBlurTimer.current);
    destinationBlurTimer.current = setTimeout(() => {
      setShowDestinationSuggestions(false);
    }, 200);
  };

  const formatPickupTimeLabel = (time: string): string => {
    const date = new Date(time);
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

  const renderSuggestionItem = (suggestion: LocationSuggestion, onSelect: () => void) => (
    <TouchableOpacity
      key={suggestion.id}
      style={[styles.suggestionItem, { backgroundColor: cardBg }]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIcon}>
        <MaterialCommunityIcons name="map-marker" size={20} color={BRAND.primary} />
      </View>
      <View style={styles.suggestionContent}>
        <Text style={[styles.suggestionName, { color: textColor }]} numberOfLines={1}>
          {suggestion.name}
        </Text>
        <Text style={[styles.suggestionAddress, { color: isLight ? '#555' : '#aaa' }]} numberOfLines={2}>
          {suggestion.address}
        </Text>
      </View>
      {suggestion.distance && (
        <Text style={[styles.suggestionDistance, { color: isLight ? '#555' : '#aaa' }]}>{suggestion.distance}</Text>
      )}
    </TouchableOpacity>
  );

  const bgColor = isLight ? '#FFFFFF' : '#000000';
  const textColor = isLight ? '#000000' : '#FFFFFF';
  const cardBg = isLight ? '#F5F5F5' : '#1A1A1A';
  const borderColor = isLight ? '#E0E0E0' : '#333333';
  const inputBg = isLight ? '#FFFFFF' : '#1A1A1A';

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} backgroundColor="transparent" translucent />

      {/* Full-screen interactive map */}
      <MapboxMap
        style={StyleSheet.absoluteFill}
        cameraCenterCoordinate={cameraCenter}
        cameraZoom={showInlineMapPicker ? 15 : cameraZoom}
        cameraAnimationDuration={600}
        autoCenter={showInlineMapPicker}
        fitCoordinates={
          pickupLocation && destinationLocation
            ? [
              [pickupLocation.lng, pickupLocation.lat],
              [destinationLocation.lng, destinationLocation.lat],
            ]
            : undefined
        }
        routeCoordinates={routeCoordinates || undefined}
        routeColor={BRAND.primary}
        routeWidth={4}
        onRegionChange={(region) => {
          if (showInlineMapPicker) {
            setCameraCenter([region.longitude, region.latitude]);
          }
        }}
        mapStyle={isLight ? 'light' : 'dark'}
        showUserLocation={showInlineMapPicker}
        showCompass={showInlineMapPicker}
        showScaleBar={false}
        showAttribution={false}
        showLogo={false}
        onPressCoordinate={showInlineMapPicker ? async (coordinate) => {
          await handleMapLocationSelect(coordinate);
          setShowInlineMapPicker(false);
        } : undefined}
      >
        {pickupLocation && (
          <MapboxMarker
            id="pickup-marker"
            coordinate={[pickupLocation.lng, pickupLocation.lat]}
            title="Pickup"
            color={BRAND.primary}
          />
        )}
        {destinationLocation && (
          <MapboxMarker
            id="destination-marker"
            coordinate={[destinationLocation.lng, destinationLocation.lat]}
            title="Destination"
            color={'#FF3B30'}
          />
        )}
      </MapboxMap>

      {/* Inline Map Picker Crosshair */}
      {showInlineMapPicker && (
        <View style={styles.crosshairContainer} pointerEvents="none">
          <View style={[styles.crosshairRing, { borderColor: BRAND.primary }]} />
          <View style={[styles.crosshairDot, { backgroundColor: BRAND.primary }]} />
          <View style={[styles.crosshairStem, { backgroundColor: BRAND.primary }]} />
        </View>
      )}

      {/* Top booking card – header + form sit at the top, map interactive below */}
      {!showInlineMapPicker && (
        <View
          style={[styles.topCard, { backgroundColor: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(12,12,12,0.97)' }]}
        >
          {/* Header baked into the card */}
          <View style={[styles.header, { paddingTop: insets.top, backgroundColor: 'transparent' }]}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Book a Ride</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Support headset icon */}
              <TouchableOpacity
                onPress={() => router.push('/rider/help-and-support')}
                style={[
                  bookingStyles.iconButton,
                  { backgroundColor: isLight ? 'rgba(245,130,11,0.12)' : 'rgba(245,130,11,0.18)' },
                ]}
                accessibilityLabel="Contact Support"
              >
                <MaterialCommunityIcons name="headset" size={20} color={BRAND.primary} />
              </TouchableOpacity>
              {/* Avatar / profile */}
              <TouchableOpacity style={styles.avatarButton} onPress={() => router.push('/rider/profile')}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: BRAND.primary }]}>
                    <Text style={styles.avatarPlaceholderText}>
                      {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.topScroll}
            contentContainerStyle={styles.topScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Weather Display */}
            {weather && (
              <View style={[styles.weatherCard, { backgroundColor: cardBg, borderColor }]}>
                <MaterialCommunityIcons
                  name={weather.icon.includes('sunny') ? 'weather-sunny' : 'weather-cloudy'}
                  size={24}
                  color={BRAND.primary}
                />
                <View style={styles.weatherInfo}>
                  <Text style={[styles.weatherCondition, { color: textColor }]}>
                    {weather.label}
                  </Text>
                </View>
                {weather.multiplier > 1 && (
                  <Text style={[styles.weatherImpact, { color: textColor }]}>
                    {weather.detail}
                  </Text>
                )}
              </View>
            )}

            {/* Location Inputs */}
            <View style={styles.locationSection}>
              <View
                ref={locationCardRef}
                style={[styles.locationInputCard, { backgroundColor: cardBg, borderColor }]}
                onLayout={() => {
                  // Measure absolute screen position to float suggestions below this card
                  locationCardRef.current?.measure((_x, _y, _w, h, _px, py) => {
                    setSuggestionsTop(py + h + 6);
                  });
                }}
              >
                {/* Pickup Input */}
                <View style={styles.locationRow}>
                  <View style={[styles.locationDot, { backgroundColor: BRAND.primary }]} />
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Pickup</Text>
                    <TextInput
                      ref={pickupInputRef}
                      style={[styles.input, { color: textColor, backgroundColor: inputBg }]}
                      placeholder="Enter pickup location"
                      placeholderTextColor={isLight ? '#999' : '#666'}
                      value={pickupSearch}
                      onChangeText={handlePickupChange}
                      onFocus={handlePickupFocus}
                      onBlur={handlePickupBlur}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => destinationInputRef.current?.focus()}
                    />
                  </View>
                  <View style={styles.locationActions}>
                    <TouchableOpacity
                      style={styles.locationActionButton}
                      onPress={handleUseCurrentLocation}
                    >
                      {isPrewarmingLocation ? (
                        <ActivityIndicator size="small" color={BRAND.primary} />
                      ) : (
                        <MaterialCommunityIcons name="crosshairs-gps" size={20} color={BRAND.primary} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.locationActionButton}
                      onPress={() => handleOpenMapPicker('pickup')}
                    >
                      <MaterialCommunityIcons name="map-marker" size={20} color={BRAND.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Destination Input */}
                <View style={styles.locationRow}>
                  <View style={[styles.locationDot, { backgroundColor: BRAND.accent }]} />
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Destination</Text>
                    <TextInput
                      ref={destinationInputRef}
                      style={[styles.input, { color: textColor, backgroundColor: inputBg }]}
                      placeholder="Enter destination"
                      placeholderTextColor={isLight ? '#999' : '#666'}
                      value={destinationSearch}
                      onChangeText={handleDestinationChange}
                      onFocus={handleDestinationFocus}
                      onBlur={handleDestinationBlur}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="done"
                      blurOnSubmit={true}
                    />
                  </View>
                  <View style={styles.locationActions}>
                    {destinationSearch ? (
                      <TouchableOpacity
                        style={styles.locationActionButton}
                        onPress={() => {
                          setDestinationSearch('');
                          setDestinationLocation(null);
                        }}
                      >
                        <MaterialCommunityIcons name="close-circle" size={20} color={isLight ? '#999' : '#666'} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.locationActionButton}
                        onPress={() => handleOpenMapPicker('destination')}
                      >
                        <MaterialCommunityIcons name="map-marker" size={20} color={BRAND.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Suggestions are rendered as a floating dropdown outside topCard – see below */}

              {/* Recent Locations */}
              {recentLocations.length > 0 && activeLocationPicker && (
                <View style={styles.recentSection}>
                  <Text style={[styles.recentTitle, { color: textColor }]}>Recent Locations</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentList}>
                    {recentLocations.map((location, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.recentChip, { backgroundColor: cardBg, borderColor }]}
                        onPress={() => handleSelectRecentLocation(location, activeLocationPicker)}
                      >
                        <MaterialCommunityIcons name="history" size={16} color={BRAND.primary} />
                        <Text style={[styles.recentText, { color: textColor }]} numberOfLines={1}>
                          {location.address}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Loading Indicator */}
              {isSearching && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={BRAND.primary} />
                  <Text style={[styles.loadingText, { color: textColor }]}>Searching...</Text>
                </View>
              )}
            </View>

            {/* Book Button */}
            <TouchableOpacity
              style={[styles.bookButton, { backgroundColor: BRAND.primary, opacity: (!pickupLocation || !destinationLocation) ? 0.5 : 1 }]}
              onPress={handleBookRide}
              disabled={!pickupLocation || !destinationLocation || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.bookButtonText}>
                  {estimatedFare ? `Book Ride - ₦${estimatedFare.toLocaleString()}` : 'Book Ride'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
          {/* Drag handle at the bottom of the top card */}
          <View style={styles.topCardHandle} />
        </View>
      )}

      {/* Floating suggestions dropdown – absolute, outside topCard, has its own ScrollView */}
      {!showInlineMapPicker && showPickupSuggestions && pickupSuggestions.length > 0 && (
        <View style={[
          styles.suggestionsFloat,
          { top: suggestionsTop, backgroundColor: isLight ? '#fff' : '#1e1e1e', borderColor }
        ]}>
          <ScrollView
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 260 }}
          >
            {pickupSuggestions.map((s) => renderSuggestionItem(s, () => handlePickupSelect(s)))}
          </ScrollView>
        </View>
      )}

      {!showInlineMapPicker && showDestinationSuggestions && destinationSuggestions.length > 0 && (
        <View style={[
          styles.suggestionsFloat,
          { top: suggestionsTop, backgroundColor: isLight ? '#fff' : '#1e1e1e', borderColor }
        ]}>
          <ScrollView
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 260 }}
          >
            {destinationSuggestions.map((s) => renderSuggestionItem(s, () => handleDestinationSelect(s)))}
          </ScrollView>
        </View>
      )}

      {/* Inline map picker header */}
      {showInlineMapPicker && (
        <View style={[styles.mapPickerInlineHeader, { paddingTop: insets.top, backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(0,0,0,0.92)', borderBottomColor: borderColor }]}>
          <TouchableOpacity style={styles.mapPickerInlineBack} onPress={handleCloseInlineMapPicker}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.mapPickerInlineTitle, { color: textColor }]}>
            Select {mapPickerType === 'pickup' ? 'Pickup' : 'Destination'}
          </Text>
          <TouchableOpacity
            style={[styles.mapPickerInlineConfirm, { backgroundColor: BRAND.primary }]}
            onPress={handleConfirmInlineMapPicker}
          >
            <MaterialCommunityIcons name="check" size={20} color="#000" />
            <Text style={styles.mapPickerInlineConfirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Inline map picker tip at bottom */}
      {showInlineMapPicker && (
        <View style={[styles.mapPickerInlineTip, { backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)' }]}>
          <MaterialCommunityIcons name="gesture-tap" size={18} color={BRAND.primary} />
          <Text style={[styles.mapPickerInlineTipText, { color: textColor }]}>
            Tap on map to pin a location, then tap Confirm
          </Text>
        </View>
      )}

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Schedule Ride</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {/* Quick Actions */}
              <Text style={[styles.modalSectionTitle, { color: isLight ? '#666' : '#999', marginTop: 0 }]}>Quick Actions</Text>
              <TouchableOpacity
                style={[styles.scheduleOption, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleTimeSelect(null)}
              >
                <MaterialCommunityIcons name="flash" size={20} color={BRAND.primary} />
                <Text style={[styles.scheduleOptionText, { color: textColor }]}>Book Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scheduleOption, { backgroundColor: cardBg, borderColor }]}
                onPress={() => {
                  const scheduledTime = new Date(Date.now() + 30 * 60 * 1000);
                  handleTimeSelect(scheduledTime.toISOString());
                }}
              >
                <MaterialCommunityIcons name="clock-fast" size={20} color={BRAND.primary} />
                <Text style={[styles.scheduleOptionText, { color: textColor }]}>In 30 minutes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scheduleOption, { backgroundColor: cardBg, borderColor }]}
                onPress={() => {
                  const scheduledTime = new Date(Date.now() + 60 * 60 * 1000);
                  handleTimeSelect(scheduledTime.toISOString());
                }}
              >
                <MaterialCommunityIcons name="clock" size={20} color={BRAND.primary} />
                <Text style={[styles.scheduleOptionText, { color: textColor }]}>In 1 hour</Text>
              </TouchableOpacity>

              {/* Custom Date/Time Selection */}
              <Text style={[styles.modalSectionTitle, { color: isLight ? '#666' : '#999' }]}>Custom Schedule</Text>
              <TouchableOpacity
                style={[styles.scheduleOption, { backgroundColor: cardBg, borderColor }]}
                onPress={handleCustomTimeSelect}
              >
                <MaterialCommunityIcons name="calendar-clock" size={20} color={BRAND.primary} />
                <Text style={[styles.scheduleOptionText, { color: textColor }]}>Choose Custom Time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scheduleOption, { backgroundColor: cardBg, borderColor }]}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  handleTimeSelect(tomorrow.toISOString());
                }}
              >
                <MaterialCommunityIcons name="calendar-today" size={20} color={BRAND.primary} />
                <Text style={[styles.scheduleOptionText, { color: textColor }]}>Tomorrow Morning</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scheduleOption, { backgroundColor: cardBg, borderColor }]}
                onPress={() => {
                  const evening = new Date();
                  evening.setHours(18, 0, 0, 0);
                  handleTimeSelect(evening.toISOString());
                }}
              >
                <MaterialCommunityIcons name="weather-night" size={20} color={BRAND.primary} />
                <Text style={[styles.scheduleOptionText, { color: textColor }]}>This Evening</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Review Booking</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={[styles.reviewSection, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.reviewLabel, { color: textColor }]}>Pickup</Text>
                <Text style={[styles.reviewValue, { color: textColor }]} numberOfLines={2}>{pickupLocation?.address}</Text>
              </View>
              <View style={[styles.reviewSection, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.reviewLabel, { color: textColor }]}>Destination</Text>
                <Text style={[styles.reviewValue, { color: textColor }]} numberOfLines={2}>{destinationLocation?.address}</Text>
              </View>
              <View style={[styles.reviewSection, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.reviewLabel, { color: textColor }]}>Distance</Text>
                <Text style={[styles.reviewValue, { color: textColor }]}>{estimatedDistance} km</Text>
              </View>
              <View style={[styles.reviewSection, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.reviewLabel, { color: textColor }]}>Duration</Text>
                <Text style={[styles.reviewValue, { color: textColor }]}>{estimatedTime} min</Text>
              </View>
              <View style={[styles.reviewSection, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.reviewLabel, { color: textColor }]}>Fare</Text>
                <Text style={[styles.reviewValue, { color: BRAND.primary }]}>
                  {discountedFare !== null ? `₦${discountedFare.toLocaleString()}` : estimatedFare ? `₦${estimatedFare.toLocaleString()}` : 'Calculating...'}
                </Text>
              </View>
              {selectedCashback && estimatedFare && (
                <View style={[styles.reviewSection, { backgroundColor: cardBg, borderColor }]}>
                  <Text style={[styles.reviewLabel, { color: textColor }]}>Cashback Discount</Text>
                  <Text style={[styles.reviewValue, { color: '#22c55e' }]}>
                    -₦{Math.round(estimatedFare * (selectedCashback.discount_percentage / 100)).toLocaleString()}
                  </Text>
                </View>
              )}
              {pickupTime && (
                <View style={[styles.reviewSection, { backgroundColor: cardBg, borderColor }]}>
                  <Text style={[styles.reviewLabel, { color: textColor }]}>Pickup Time</Text>
                  <Text style={[styles.reviewValue, { color: textColor }]}>{formatPickupTimeLabel(pickupTime)}</Text>
                </View>
              )}

              {/* Cashback Selection in Review */}
              {cashbackRewards.length > 0 && selectedCashback === null && (
                <View style={styles.cashbackSection}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Apply Cashback</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cashbackList}>
                    {cashbackRewards.map((reward) => (
                      <TouchableOpacity
                        key={reward.id}
                        style={[
                          styles.cashbackChip,
                          {
                            backgroundColor: selectedCashback?.id === reward.id ? `${BRAND.primary}20` : cardBg,
                            borderColor: selectedCashback?.id === reward.id ? BRAND.primary : borderColor,
                          }
                        ]}
                        onPress={() => handleCashbackSelect(reward)}
                      >
                        <MaterialCommunityIcons name="gift" size={16} color={BRAND.primary} />
                        <Text style={[styles.cashbackText, { color: textColor }]}>
                          {reward.discount_percentage}% off
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {selectedCashback && (
                <View style={[styles.selectedCashback, { backgroundColor: cardBg, borderColor }]}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={BRAND.primary} />
                  <Text style={[styles.selectedCashbackText, { color: textColor }]}>
                    {selectedCashback.discount_percentage}% cashback applied
                  </Text>
                  <TouchableOpacity onPress={handleCashbackRemove}>
                    <MaterialCommunityIcons name="close" size={20} color={textColor} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: BRAND.primary }]}
                onPress={handleConfirmBooking}
                disabled={isLoading || !estimatedFare}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    Confirm Booking - ₦{discountedFare !== null ? discountedFare.toLocaleString() : estimatedFare?.toLocaleString() || 'Calculating...'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Date/Time Picker */}
      {showCustomDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode={pickerMode}
          onChange={pickerMode === 'date' ? handleDateChange : handleTimeChange}
          minimumDate={new Date()}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        />
      )}

      {/* iOS DateTime Confirm Button */}
      {Platform.OS === 'ios' && showCustomDatePicker && pickerMode === 'time' && (
        <Modal
          visible={showCustomDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCustomDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowCustomDatePicker(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <DateTimePicker
                  value={tempDate}
                  mode="time"
                  onChange={handleTimeChange}
                  display="spinner"
                />
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: BRAND.primary }]}
                  onPress={handleCustomTimeConfirm}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Error Dialog */}
      <Modal
        visible={showErrorDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.errorDialog, { backgroundColor: bgColor, borderColor }]}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#FF5252" />
            <Text style={[styles.errorTitle, { color: textColor }]}>Error</Text>
            <Text style={[styles.errorMessage, { color: textColor }]}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.errorButton, { backgroundColor: BRAND.primary }]}
              onPress={() => setShowErrorDialog(false)}
            >
              <Text style={styles.errorButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Map Picker Modal removed – using inline map picker instead */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Top card (booking form)
  topCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.46,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 10,
  },
  topCardHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.35)',
    alignSelf: 'center',
    marginVertical: 10,
  },
  topScroll: {
    flex: 1,
  },
  topScrollContent: {
    paddingBottom: 4,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  weatherInfo: {
    marginLeft: 12,
    flex: 1,
  },
  weatherCondition: {
    fontSize: 14,
    fontWeight: '600',
  },
  weatherImpact: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  locationSection: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  locationInputCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    padding: 10,
    borderRadius: 8,
  },
  currentLocationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  locationActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Floating suggestions dropdown (outside topCard to avoid nested ScrollView)
  suggestionsFloat: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 200,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  suggestionsCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionAddress: {
    fontSize: 12,
    color: '#666',
  },
  suggestionDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  recentSection: {
    marginTop: 16,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  recentList: {
    flexDirection: 'row',
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  recentText: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 150,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  scheduleContent: {
    flex: 1,
    marginLeft: 12,
  },
  scheduleLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  scheduleValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  cashbackSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  cashbackList: {
    flexDirection: 'row',
  },
  cashbackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  cashbackText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fareCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  fareValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  fareDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  fareDetailItem: {
    alignItems: 'center',
  },
  fareDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  fareDetailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  cashbackDiscount: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cashbackDiscountText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.primary,
  },
  bookButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginLeft: 20,
    marginRight: 20,
  },
  bookButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    gap: 12,
  },
  scheduleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  scheduleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 0,
    marginBottom: 12,
  },
  errorDialog: {
    width: '80%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorButton: {
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  errorButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  mapPickerModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  mapPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  mapPickerContent: {
    flex: 1,
  },
  mapPickerMap: {
    flex: 1,
  },
  mapPickerInstructions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  mapPickerInstructionsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Inline map picker styles
  scrollViewHidden: {
    opacity: 0,
    height: 0,
    overflow: 'hidden',
  },
  crosshairContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'transparent',
    position: 'absolute',
  },
  crosshairDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
  },
  crosshairStem: {
    width: 2,
    height: 20,
    position: 'absolute',
    marginTop: 40, // below crosshair center (half of ring height)
  },
  mapPickerInlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  mapPickerInlineBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPickerInlineTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  mapPickerInlineConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  mapPickerInlineConfirmText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  mapPickerInlineTip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    borderRadius: 24,
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapPickerInlineTipText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  reviewSection: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  confirmButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  selectedCashback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  selectedCashbackText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
});
