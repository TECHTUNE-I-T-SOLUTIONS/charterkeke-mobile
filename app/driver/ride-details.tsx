import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StyleSheet,
  StatusBar,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import { RideMapFullscreenModal } from '@/components/RideMapFullscreenModal';
import { useTheme } from '@/context/ThemeContext';
import { useAlert } from '@/context/AlertContext';
import { useLocation } from '@/context/LocationContext';
import { apiService } from '@/services/api';
import { supabaseService } from '@/services/supabase';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import { BRAND, COLORS } from '@/utils/colors';
import { verticalScale, scale } from 'react-native-size-matters';
import { fetchMapboxRoute } from '@/utils/mapboxDirections';
import { geocodeMapboxLocation } from '@/utils/mapboxGeocoding';
import { exportRideReceipt, saveCapturedRideReceiptImage, shareReceiptFile, shareRideReceipt, RideReceiptFormat } from '@/utils/rideReceipt';
import { RideReceiptExportModal } from '@/components/RideReceiptExportModal';
import { RideReceiptTemplate } from '@/components/RideReceiptTemplate';
import { captureRef } from 'react-native-view-shot';
import { useDriverLocationTracking } from '@/hooks/useDriverLocationTracking';
import { calculateDistance } from '@/utils/geofencing';
import { ProximityAlertModal } from '@/components/ProximityAlertModal';

const { width } = Dimensions.get('window');
const PLATFORM_FEE_PERCENTAGE = 0.15;

export default function RideDetailsScreen() {
  const router = useRouter();
  const { rideId, rideData } = useLocalSearchParams();
  const { theme, mode } = useTheme();
  const { showError, showSuccess } = useAlert();
  const { currentLocation, watchLocation } = useLocation();
  const insets = useSafeAreaInsets();
  const isLight = mode === 'light';
  const [ride, setRide] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [proximityAlert, setProximityAlert] = useState<{ visible: boolean; distanceKm: number; type: 'pickup' | 'dropoff' }>({ visible: false, distanceKm: 0, type: 'pickup' });
  const [actionLabel, setActionLabel] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | undefined>(undefined);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeDistanceKm, setRouteDistanceKm] = useState(0);
  const [routeDurationMin, setRouteDurationMin] = useState(0);
  const [showFullMap, setShowFullMap] = useState(false);
  const [liveDriverLocation, setLiveDriverLocation] = useState<[number, number] | null>(null);
  const [liveRiderLocation, setLiveRiderLocation] = useState<[number, number] | null>(null);
  const [lastMapTap, setLastMapTap] = useState(0);
  const [hasNotifiedArrival, setHasNotifiedArrival] = useState(false);
  const [receiptModalMode, setReceiptModalMode] = useState<'share' | 'download' | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const receiptRef = useRef<View>(null);
  const etaPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistedEtaRef = useRef<number | null>(null);
  const parseDescriptionCoordinate = (description?: string | null) => {
    if (!description) return null;
    const latMatch = description.match(/Lat:\s*([-\d.]+)/i);
    const lngMatch = description.match(/Lng:\s*([-\d.]+)/i);
    if (!latMatch || !lngMatch) return null;
    const latitude = Number(latMatch[1]);
    const longitude = Number(lngMatch[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return [longitude, latitude] as [number, number];
  };
  const extractCoordinate = (source: any, latKeys: string[], lngKeys: string[]) => {
    if (!source) return null;
    const lat = latKeys.map((key) => Number(source[key])).find((value) => Number.isFinite(value));
    const lng = lngKeys.map((key) => Number(source[key])).find((value) => Number.isFinite(value));
    if (!Number.isFinite(lat as number) || !Number.isFinite(lng as number)) return null;
    return [lng as number, lat as number] as [number, number];
  };
  const safeRideStatus = String(ride?.status || '').trim().toUpperCase() || 'DETAILS';

  // Enable driver location tracking when ride is active
  const { isTracking } = useDriverLocationTracking({
    rideId: ride?.id,
    enabled: safeRideStatus === 'ACCEPTED' || safeRideStatus === 'IN_PROGRESS',
    intervalMs: 30000, // 30 seconds
  });

  useEffect(() => {
    if (rideData) {
      try {
        const parsedRide = typeof rideData === 'string' ? JSON.parse(rideData) : rideData;
        setRide(parsedRide);
      } catch (error) { setRide(null); }
    }
  }, [rideData]);

  useEffect(() => {
    let cancelled = false;

    const loadRideById = async () => {
      if (rideData || !rideId) return;

      try {
        const response = await apiService.getRide(String(rideId));
        const nextRide = (response as any)?.ride || response;
        if (!cancelled) {
          setRide(nextRide || null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load driver ride details from notification:', error);
          setRide(null);
        }
      }
    };

    loadRideById();

    return () => {
      cancelled = true;
    };
  }, [rideData, rideId]);

  // Realtime subscription on rides table for auto-refresh
  const activeRideId = ride?.id || rideId;
  useEffect(() => {
    if (!activeRideId) return;

    let active = true;
    supabaseService.subscribeToRideUpdates(String(activeRideId), (updatedRide: any) => {
      if (!active || !updatedRide) return;
      setRide((prev: any) => (prev ? { ...prev, ...updatedRide } : updatedRide));
    });

    return () => {
      active = false;
      supabaseService.unsubscribeRideUpdates(String(activeRideId)).catch(() => { });
    };
  }, [activeRideId]);

  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      if (!ride) {
        return;
      }

      setRouteLoading(true);

      try {
        const explicitPickup =
          parseDescriptionCoordinate(ride.pickup_description) ||
          extractCoordinate(ride, ['pickup_latitude', 'pickupLat', 'pickup_lat'], ['pickup_longitude', 'pickupLng', 'pickup_lon']);
        const explicitDestination =
          parseDescriptionCoordinate(ride.destination_description) ||
          extractCoordinate(ride, ['dropoff_latitude', 'dropoffLat', 'dropoff_lat'], ['dropoff_longitude', 'dropoffLng', 'dropoff_lon']);
        const pickupQuery = ride.pickup_zone || ride.pickup_description || '';
        const destinationQuery = ride.destination_zone || ride.destination_description || '';

        const [pickupResult, destinationResult] = await Promise.all([
          explicitPickup ? Promise.resolve({ coordinate: explicitPickup }) : pickupQuery ? geocodeMapboxLocation(pickupQuery) : null,
          explicitDestination ? Promise.resolve({ coordinate: explicitDestination }) : destinationQuery ? geocodeMapboxLocation(destinationQuery) : null,
        ]);

        if (cancelled || !pickupResult || !destinationResult) {
          return;
        }

        const route = await fetchMapboxRoute(pickupResult.coordinate, destinationResult.coordinate, {
          profile: 'driving-traffic',
        });

        if (cancelled) {
          return;
        }

        if (route) {
          setRouteCoordinates(route.coordinates);
          setRouteDistanceKm(parseFloat(route.distanceKm.toFixed(2)));
          setRouteDurationMin(Math.max(1, Math.round(route.durationMin)));
          return;
        }

        setRouteCoordinates([pickupResult.coordinate, destinationResult.coordinate]);
        setRouteDistanceKm(Number(ride.distance_km || 0));
        setRouteDurationMin(Number(ride.duration_minutes || 0));
      } catch (error) {
        console.log('Failed to load Mapbox route for driver ride details:', error);
        if (!cancelled) {
          const fallbackPickup =
            parseDescriptionCoordinate(ride.pickup_description) ||
            extractCoordinate(ride, ['pickup_latitude', 'pickupLat', 'pickup_lat'], ['pickup_longitude', 'pickupLng', 'pickup_lon']);
          const fallbackDestination =
            parseDescriptionCoordinate(ride.destination_description) ||
            extractCoordinate(ride, ['dropoff_latitude', 'dropoffLat', 'dropoff_lat'], ['dropoff_longitude', 'dropoffLng', 'dropoff_lon']);
          if (fallbackPickup && fallbackDestination) {
            setRouteCoordinates([fallbackPickup, fallbackDestination]);
          }
          setRouteDistanceKm(Number(ride.distance_km || 0));
          setRouteDurationMin(Number(ride.duration_minutes || 0));
        }
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    };

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [ride]);

  useEffect(() => {
    const targetRideId = String(rideId || ride?.id || '');
    const status = String(ride?.status || '').toLowerCase();
    const shouldTrack = !!targetRideId && (status === 'accepted' || status === 'in_progress');
    if (!shouldTrack) return;

    let mounted = true;
    let unwatch: undefined | (() => void);

    const startLiveTracking = async () => {
      await supabaseService.subscribeToRideLocationUpdates(targetRideId, (payload) => {
        if (!mounted || !payload) return;
        const coordinate: [number, number] | null =
          Number.isFinite(Number(payload.longitude)) && Number.isFinite(Number(payload.latitude))
            ? [Number(payload.longitude), Number(payload.latitude)]
            : null;
        if (!coordinate) return;

        if (payload.role === 'rider') {
          setLiveRiderLocation(coordinate);
        }
        if (payload.role === 'driver') {
          setLiveDriverLocation(coordinate);
        }
      });

      if (currentLocation) {
        const initial: [number, number] = [currentLocation.longitude, currentLocation.latitude];
        setLiveDriverLocation(initial);
        await supabaseService.broadcastRideLocation(targetRideId, {
          role: 'driver',
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: (currentLocation as any).accuracy,
          timestamp: Date.now(),
        });
      }

      unwatch = await watchLocation((location) => {
        if (!mounted) return;
        setLiveDriverLocation([location.longitude, location.latitude]);
        supabaseService.broadcastRideLocation(targetRideId, {
          role: 'driver',
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: (location as any).accuracy,
          timestamp: Date.now(),
        }).catch((error) => console.log('Failed to broadcast driver ride location:', error));
      });
    };

    startLiveTracking().catch((error) => console.log('Failed to start driver live tracking:', error));

    return () => {
      mounted = false;
      if (unwatch) unwatch();
      supabaseService.unsubscribeRideLocation(targetRideId).catch(() => undefined);
    };
  }, [ride?.id, ride?.status, rideId]);

  const handleAcceptRide = async () => {
    if (updating) return;

    const previousRide = ride;
    try {
      setUpdating(true);
      setActionLabel('Accepting ride...');
      const targetRideId = String(rideId || ride?.id || '');
      if (!targetRideId) {
        showError('Ride unavailable', 'We could not identify this ride yet. Please reopen the ride and try again.');
        return;
      }
      setRide((current: any) => current ? { ...current, status: 'accepted' } : current);
      const response = await apiService.acceptRide(targetRideId, displayEtaMin);
      const nextRide = response?.ride || response;
      setRide(nextRide || { ...ride, status: 'accepted' });
      showSuccess('Ride accepted', 'The ride has been assigned to you. You can now start the trip.');
    } catch (error: any) {
      console.error('❌ [RIDE] Accept failed:', error);
      setRide(previousRide);
      showError('Could not accept ride', error?.message || 'This ride may already have been accepted by another driver.');
    } finally {
      setActionLabel(null);
      setUpdating(false);
    }
  };

  const pickupCoordinate =
    extractCoordinate(ride, ['pickup_latitude', 'pickupLat', 'pickup_lat'], ['pickup_longitude', 'pickupLng', 'pickup_lon']) ||
    parseDescriptionCoordinate(ride?.pickup_description) ||
    routeCoordinates?.[0] ||
    [3.3792, 6.5244];

  const handleNotifyArrival = async () => {
    if (updating) return;
    const targetRideId = String(rideId || ride?.id || '');
    if (!targetRideId) {
      showError('Ride unavailable', 'We could not identify this ride yet. Please reopen the ride and try again.');
      return;
    }

    // Location guard: Verify driver is within 450 meters of the pickup point
    const driverLat = liveDriverLocation?.[1] ?? currentLocation?.latitude;
    const driverLng = liveDriverLocation?.[0] ?? currentLocation?.longitude;
    const pickupLat = pickupCoordinate?.[1];
    const pickupLng = pickupCoordinate?.[0];

    if (driverLat != null && driverLng != null && pickupLat != null && pickupLng != null) {
      const distToPickupKm = calculateDistance(driverLat, driverLng, pickupLat, pickupLng);
      // 0.45 km = 450 meters tolerance for GPS drift & street parking
      if (distToPickupKm > 0.45) {
        setProximityAlert({ visible: true, distanceKm: distToPickupKm, type: 'pickup' });
        return;
      }
    }

    try {
      setUpdating(true);
      setActionLabel('Notifying rider...');
      // Notification-only — does NOT change ride status (stays "accepted").
      await apiService.notifyArrival(targetRideId);
      setHasNotifiedArrival(true);
      showSuccess('Rider notified', 'We let the rider know you have arrived at the pickup point.');
    } catch (error: any) {
      console.error('❌ [RIDE] Notify arrival failed:', error);
      showError('Could not notify rider', error?.message || 'Failed to send arrival notification');
    } finally {
      setActionLabel(null);
      setUpdating(false);
    }
  };
  const dropoffCoordinate =
    extractCoordinate(ride, ['dropoff_latitude', 'dropoffLat', 'dropoff_lat'], ['dropoff_longitude', 'dropoffLng', 'dropoff_lon']) ||
    parseDescriptionCoordinate(ride?.destination_description) ||
    routeCoordinates?.[routeCoordinates.length - 1] ||
    [3.4292, 6.5844];
  const driverCoordinate =
    liveDriverLocation ||
    extractCoordinate(ride, ['driver_current_latitude', 'driverLatitude', 'driver_latitude'], ['driver_current_longitude', 'driverLongitude', 'driver_longitude']) ||
    null;
  const riderCoordinate =
    liveRiderLocation ||
    extractCoordinate(ride, ['rider_current_latitude', 'riderLatitude', 'rider_latitude'], ['rider_current_longitude', 'riderLongitude', 'rider_longitude']) ||
    null;
  const routeFitCoordinates = [
    ...(routeCoordinates || [pickupCoordinate, dropoffCoordinate]),
    ...(riderCoordinate ? [riderCoordinate] : []),
    ...(driverCoordinate ? [driverCoordinate] : []),
  ];
  const rideStatus = String(ride?.status || '').toLowerCase();
  const shouldShowEta = rideStatus === 'pending' || rideStatus === 'dispatched' || rideStatus === 'accepted';
  const shouldUseLiveRoute = rideStatus === 'accepted' || rideStatus === 'in_progress';
  const storedDistanceKm = Number(ride?.distance_km || 0);
  const storedEtaMin = Number(ride?.eta_minutes || ride?.duration_minutes || 0);
  const displayDistanceKm = shouldUseLiveRoute ? (routeDistanceKm || storedDistanceKm || 0) : (storedDistanceKm || routeDistanceKm || 0);
  const displayEtaMin = shouldUseLiveRoute ? (routeDurationMin || storedEtaMin || 0) : (storedEtaMin || routeDurationMin || 0);
  const displayDurationMin = Number(ride?.duration_minutes || 0) || routeDurationMin;
  const fareAmount = Number(ride?.fare_amount || ride?.fare || 0);
  const platformFee = Number(ride?.platform_fee ?? fareAmount * PLATFORM_FEE_PERCENTAGE);
  const driverEarnings = Number(ride?.driver_earnings ?? fareAmount - platformFee);
  const isAwaitingAcceptance = rideStatus === 'pending' || rideStatus === 'dispatched';
  const isCompleted = rideStatus === 'completed';
  const nextTripStatus = rideStatus === 'accepted' ? 'in_progress' : 'completed';
  const primaryActionLabel = isAwaitingAcceptance ? 'Accept Ride' : rideStatus === 'accepted' ? 'Start Trip' : 'Complete Trip';

  // Move handleUpdate here so it's accessible from modal
  const handleUpdate = async (status: string, bypassModal: boolean = false) => {
    if (updating) return;

    const previousRide = ride;
    try {
      setUpdating(true);
      setActionLabel(status === 'completed' ? 'Completing trip...' : 'Starting trip...');
      const targetRideId = String(rideId || ride?.id || '');
      if (!targetRideId) {
        showError('Ride unavailable', 'We could not identify this ride yet. Please reopen the ride and try again.');
        return;
      }

      // If starting trip, check proximity to pickup location first
      if (status === 'in_progress' && !bypassModal) {
        if (!currentLocation || !pickupCoordinate) {
          setProximityAlert({ visible: true, distanceKm: 0, type: 'pickup' });
          setUpdating(false);
          setActionLabel(null);
          return;
        }

        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          pickupCoordinate[1],
          pickupCoordinate[0]
        );

        // If driver is more than 200m away from pickup, show alert
        if (distance > 0.2) {
          setProximityAlert({ visible: true, distanceKm: distance, type: 'pickup' });
          setUpdating(false);
          setActionLabel(null);
          return;
        }
      }

      // If completing, show verification modal first (unless explicitly confirmed from modal)
      if (status === 'completed' && !bypassModal) {
        setShowCompletionModal(true);
        setUpdating(false);
        setActionLabel(null);
        return;
      }

      setRide((current: any) => current ? { ...current, status } : current);
      const response = await apiService.updateRideStatus(targetRideId, status as 'in_progress' | 'completed', displayEtaMin);

      if (response) {
        // Merge response data with previous ride so passenger, route details, and earnings breakdown are never lost!
        const updatedRideData = response?.ride || response;
        setRide((current: any) => ({
          ...(current || previousRide || {}),
          ...(updatedRideData || {}),
          status,
        }));

        if (status === 'completed') {
          showSuccess('Ride completed', 'The trip has been completed successfully.');
          router.back();
        } else {
          showSuccess('Trip started', 'The ride is now in progress.');
        }
      }
    } catch (error: any) {
      console.error('❌ [RIDE] Update failed:', error);
      const currentStatus = String(error?.details?.currentStatus || error?.details?.ride?.status || '').toLowerCase();
      if (
        (status === 'in_progress' && currentStatus === 'in_progress') ||
        (status === 'completed' && currentStatus === 'completed')
      ) {
        const resolvedRide = error?.details?.ride || previousRide;
        setRide((current: any) => ({ ...(current || resolvedRide || {}), ...(resolvedRide || {}), status }));
        showSuccess(
          status === 'completed' ? 'Ride completed' : 'Trip started',
          status === 'completed' ? 'The trip was already completed.' : 'The ride is already in progress.'
        );
        return;
      }
      setRide(previousRide);
      showError('Could not update ride', error?.message || 'Failed to update ride status');
    } finally {
      setActionLabel(null);
      setUpdating(false);
    }
  };

  const persistLiveEta = async (etaMinutes: number) => {
    const targetRideId = String(rideId || ride?.id || '');
    if (!targetRideId || !Number.isFinite(etaMinutes) || etaMinutes <= 0) return;
    if (lastPersistedEtaRef.current !== null && Math.abs(lastPersistedEtaRef.current - etaMinutes) < 1) return;
    lastPersistedEtaRef.current = etaMinutes;
    try {
      await supabaseService.updateRideEta(targetRideId, Math.round(etaMinutes));
    } catch {
      // ETA persist is non-critical, ignore silently
    }
  };
  const handleMapTap = () => {
    const now = Date.now();
    if (now - lastMapTap < 300) {
      setShowFullMap(true);
    }
    setLastMapTap(now);
  };

  useEffect(() => {
    const targetRideId = String(rideId || ride?.id || '');
    if (!targetRideId || rideStatus !== 'accepted' || !currentLocation || !pickupCoordinate) {
      return;
    }

    if (etaPersistTimer.current) clearTimeout(etaPersistTimer.current);
    etaPersistTimer.current = setTimeout(() => {
      fetchMapboxRoute(
        [currentLocation.longitude, currentLocation.latitude],
        pickupCoordinate,
        { profile: 'driving-traffic' }
      )
        .then((route) => {
          const eta = route ? Math.max(1, Math.round(route.durationMin)) : 0;
          if (!eta) return;
          setRouteDurationMin(eta);
          setRide((current: any) => current ? { ...current, eta_minutes: eta } : current);
          return persistLiveEta(eta);
        })
        .catch((error) => console.log('Failed to refresh live ETA from driver distance:', error));
    }, 12000);

    return () => {
      if (etaPersistTimer.current) clearTimeout(etaPersistTimer.current);
    };
  }, [currentLocation?.latitude, currentLocation?.longitude, rideStatus, rideId, ride?.id, pickupCoordinate?.[0], pickupCoordinate?.[1]]);

  const openReceiptModal = (action: 'share' | 'download') => {
    if (!ride) return;
    setReceiptModalMode(action);
  };

  const handleReceiptFormat = async (format: RideReceiptFormat) => {
    if (!ride || !receiptModalMode) return;
    const action = receiptModalMode;
    setReceiptModalMode(null);

    try {
      if (format === 'pdf') {
        const uri = action === 'share'
          ? await shareRideReceipt(ride, 'driver', 'pdf')
          : await exportRideReceipt(ride, 'driver', 'pdf');
        if (action === 'download') {
          showSuccess('Receipt saved', 'Your PDF ride sheet has been saved on this device.');
        }
        console.log('[RideReceipt] Generated:', uri);
        return;
      }

      if (!receiptRef.current) throw new Error('Receipt template is not ready yet.');
      const capturedUri = await captureRef(receiptRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const finalUri = await saveCapturedRideReceiptImage(capturedUri, ride);

      if (action === 'share') {
        await shareReceiptFile(finalUri, 'image');
      } else {
        showSuccess('Receipt image saved', 'Your PNG ride sheet has been saved on this device.');
      }
      console.log('[RideReceipt] Generated PNG:', finalUri);
    } catch (error: any) {
      showError('Receipt unavailable', error?.message || 'Could not generate this ride sheet.');
    }
  };

  if (!ride) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ListScreenSkeleton itemCount={3} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />

      {/* Header Overlay on Map */}
      <View style={styles.mapWrapper}>
        <MapboxMap
          style={StyleSheet.absoluteFill}
          latitude={6.5244}
          longitude={3.3792}
          zoom={12}
          mapStyle={isLight ? 'light' : 'dark'}
          showCompass
          showScaleBar
          fitCoordinates={routeFitCoordinates}
          routeCoordinates={routeCoordinates}
          autoCenter={Boolean(routeFitCoordinates?.length)}
          onPressCoordinate={handleMapTap}
        >
          <MapboxMarker
            id="pickup"
            coordinate={pickupCoordinate}
            title="Pickup"
            color={BRAND.primary}
          />
          <MapboxMarker
            id="dropoff"
            coordinate={dropoffCoordinate}
            title="Dropoff"
            color="black"
          />
          {riderCoordinate ? (
            <MapboxMarker id="rider-current" coordinate={riderCoordinate} title="Rider current location" color="#2563EB" />
          ) : null}
          {driverCoordinate ? (
            <MapboxMarker id="driver-current" coordinate={driverCoordinate} title="Tricycle current location" color="#10B981" />
          ) : null}
        </MapboxMap>
        <TouchableOpacity onPress={() => setShowFullMap(true)} style={styles.fullMapBtn}>
          <MaterialCommunityIcons name="fullscreen" size={18} color="#000" />
          <Text style={styles.fullMapBtnText}>Full Map</Text>
        </TouchableOpacity>
        <SafeAreaView pointerEvents="box-none" style={[styles.headerSafe, { paddingTop: Math.max(0, verticalScale(8)) }]}>
          <View pointerEvents="box-none" style={[styles.headerRow, { paddingHorizontal: scale(16), paddingVertical: verticalScale(8) }]}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backCircle, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={[styles.statusPill, { backgroundColor: BRAND.primary }]}>
              <Text style={[styles.statusText, { color: '#000' }]}>{safeRideStatus}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.receiptActions}>
          <TouchableOpacity onPress={() => openReceiptModal('share')} style={[styles.receiptBtn, { backgroundColor: BRAND.primary }]}>
            <MaterialCommunityIcons name="share-variant" size={18} color="#000" />
            <Text style={styles.receiptBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openReceiptModal('download')} style={[styles.receiptBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}>
            <MaterialCommunityIcons name="download" size={18} color={theme.colors.textPrimary} />
            <Text style={[styles.receiptBtnText, { color: theme.colors.textPrimary }]}>Download</Text>
          </TouchableOpacity>
        </View>

        {/* Rider Info */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>PASSENGER</Text>
          <View style={styles.riderRow}>
            {ride.users?.profile_picture_url ? (
              <Image
                source={{ uri: ride.users.profile_picture_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}><Text style={{ fontSize: 20 }}>👤</Text></View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.riderName, { color: theme.colors.textPrimary }]}>{ride.users?.first_name || 'Passenger Name'}</Text>
              <Text style={[styles.riderSub, { color: theme.colors.textSecondary }]}>Rating: {ride.users?.rating || '5.0'} ★</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => {
                  const phoneNumber = String(ride.users?.phone_number || '').trim();
                  if (!phoneNumber) return;
                  Linking.openURL(`tel:${phoneNumber.replace(/[\s\-\(\)]/g, '')}`).catch(() => undefined);
                }}
                style={[styles.callBtn, { backgroundColor: theme.colors.inputBackground }]}
              >
                <MaterialCommunityIcons name="phone" size={20} color={BRAND.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(`/driver/chat?rideId=${rideId}`)}
                style={[styles.chatBtn, { backgroundColor: theme.colors.primary }]}
              >
                <MaterialCommunityIcons name="message" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Route Info */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>ROUTE</Text>
          <View style={styles.routeRow}>
            <View style={{ alignItems: 'center', marginRight: 12 }}>
              <View style={[styles.dot, { backgroundColor: BRAND.primary }]} />
              <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
              <View style={[styles.square, { borderColor: theme.colors.textPrimary }]} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ height: 40, justifyContent: 'center' }}>
                <Text style={[styles.address, { color: theme.colors.textPrimary }]}>{ride.pickup_zone}</Text>
              </View>
              <View style={{ height: 20 }} />
              <View style={{ height: 40, justifyContent: 'center' }}>
                <Text style={[styles.address, { color: theme.colors.textPrimary }]}>{ride.destination_zone}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.routeSummary, { borderTopColor: theme.colors.border }]}>
            <View>
              <Text style={[styles.routeSummaryLabel, { color: theme.colors.textSecondary }]}>Distance</Text>
              <Text style={[styles.routeSummaryValue, { color: theme.colors.textPrimary }]}>{routeLoading ? 'Calculating...' : `${displayDistanceKm || 0} km`}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.routeSummaryLabel, { color: theme.colors.textSecondary }]}>{shouldShowEta ? 'ETA' : 'Duration'}</Text>
              <Text style={[styles.routeSummaryValue, { color: theme.colors.textPrimary }]}>
                {routeLoading ? 'Calculating...' : `${shouldShowEta ? displayEtaMin || 0 : displayDurationMin || 0} min`}
              </Text>
            </View>
          </View>
        </View>

        {/* Financials */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>EARNINGS BREAKDOWN</Text>
          <View style={styles.financeRow}>
            <Text style={[styles.finLabel, { color: theme.colors.textSecondary }]}>Base Fare</Text>
            <Text style={[styles.finValue, { color: theme.colors.textPrimary }]}>₦{fareAmount.toFixed(0)}</Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={[styles.finLabel, { color: theme.colors.textSecondary }]}>Platform Fee (15%)</Text>
            <Text style={[styles.finValue, { color: theme.colors.error }]}>- ₦{platformFee.toFixed(0)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.financeRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.textPrimary }]}>Your Earning</Text>
            <Text style={[styles.totalValue, { color: '#10B981' }]}>₦{driverEarnings.toFixed(0)}</Text>
          </View>
        </View>

        {/* Actions */}
        {!isCompleted && (
          <>
            {rideStatus === 'accepted' && (
              <TouchableOpacity
                style={[
                  styles.mainBtn,
                  {
                    backgroundColor: hasNotifiedArrival ? theme.colors.surface : theme.colors.surface,
                    borderColor: BRAND.primary,
                    borderWidth: 1.5,
                    marginBottom: 12,
                  },
                ]}
                onPress={handleNotifyArrival}
                disabled={updating || hasNotifiedArrival}
              >
                <Text style={[styles.btnText, { color: BRAND.primary }]}>
                  {hasNotifiedArrival ? '✓ Rider Notified — You’ve Arrived' : "I’ve Arrived"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: BRAND.primary }]}
              onPress={isAwaitingAcceptance ? handleAcceptRide : () => handleUpdate(nextTripStatus)}
              disabled={updating}
            >
              {updating ? (
                <View style={styles.busyAction}>
                  <ActivityIndicator color="#000" />
                  <Text style={styles.btnText}>{actionLabel || 'Working...'}</Text>
                </View>
              ) : (
                <Text style={styles.btnText}>{primaryActionLabel}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
      <RideMapFullscreenModal
        visible={showFullMap}
        title="Ride Map"
        routeCoordinates={routeCoordinates}
        focusCoordinates={routeFitCoordinates}
        pickup={pickupCoordinate}
        dropoff={dropoffCoordinate}
        riderLocation={riderCoordinate}
        driverLocation={driverCoordinate}
        speedText={routeLoading ? 'Loading route...' : `${shouldShowEta ? 'ETA' : 'Duration'} ${shouldShowEta ? displayEtaMin || 0 : displayDurationMin || 0} min | ${displayDistanceKm || 0} km`}
        onClose={() => setShowFullMap(false)}
      />
      <RideReceiptExportModal
        visible={!!receiptModalMode}
        mode={receiptModalMode || 'share'}
        onClose={() => setReceiptModalMode(null)}
        onSelect={handleReceiptFormat}
        colors={{
          surface: theme.colors.surface,
          background: theme.colors.background,
          border: theme.colors.border,
          textPrimary: theme.colors.textPrimary,
          textSecondary: theme.colors.textSecondary,
        }}
      />

      {/* Completion Verification Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Complete Trip Verification</Text>
              <TouchableOpacity onPress={() => setShowCompletionModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.modalText, { color: theme.colors.textSecondary, marginBottom: 16 }]}>
                Please confirm that you have arrived at the destination before completing the trip.
              </Text>

              <View style={[styles.locationCheck, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
                <MaterialCommunityIcons name="map-marker-check" size={32} color={locationVerified ? '#10B981' : verifyingLocation ? BRAND.primary : theme.colors.textSecondary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.checkLabel, { color: theme.colors.textPrimary }]}>
                    {locationVerified ? 'Location Verified' : verifyingLocation ? 'Verifying Location...' : 'Location Verification'}
                  </Text>
                  <Text style={[styles.checkSublabel, { color: theme.colors.textSecondary }]}>
                    {locationVerified ? 'You are at the destination' : verifyingLocation ? 'Checking GPS coordinates...' : 'Tap Verify Location below to confirm arrival'}
                  </Text>
                </View>
                {verifyingLocation && <ActivityIndicator size="small" color={BRAND.primary} />}
              </View>

              <TouchableOpacity
                style={[styles.verifyBtn, { backgroundColor: locationVerified ? '#10B981' : BRAND.primary }]}
                onPress={async () => {
                  setVerifyingLocation(true);

                  const driverLat = currentLocation?.latitude ?? driverCoordinate?.[1];
                  const driverLng = currentLocation?.longitude ?? driverCoordinate?.[0];
                  const dropoffLat = dropoffCoordinate?.[1];
                  const dropoffLng = dropoffCoordinate?.[0];

                  // 1. Check if driver has location available
                  if (!driverLat || !driverLng) {
                    setVerifyingLocation(false);
                    setProximityAlert({ visible: true, distanceKm: 0, type: 'dropoff' });
                    return;
                  }

                  // 2. Check distance between driver and dropoff destination
                  const distToDropoffKm = calculateDistance(driverLat, driverLng, dropoffLat, dropoffLng);

                  // 3. Check distance between driver and rider (if rider's live location is available)
                  let distToRiderKm: number | null = null;
                  if (riderCoordinate && riderCoordinate[0] && riderCoordinate[1]) {
                    distToRiderKm = calculateDistance(driverLat, driverLng, riderCoordinate[1], riderCoordinate[0]);
                  }

                  // Margin of error threshold for urban tricycle GPS (500m to account for multipath & dropoff zone boundaries)
                  const DROPOFF_THRESHOLD_KM = 0.5;
                  const RIDER_PROXIMITY_THRESHOLD_KM = 0.6;

                  if (distToDropoffKm > DROPOFF_THRESHOLD_KM) {
                    setVerifyingLocation(false);
                    setProximityAlert({ visible: true, distanceKm: distToDropoffKm, type: 'dropoff' });
                    return;
                  }

                  // If rider's live location is known and they are more than 600m away from the driver, warn
                  if (distToRiderKm !== null && distToRiderKm > RIDER_PROXIMITY_THRESHOLD_KM) {
                    setVerifyingLocation(false);
                    setProximityAlert({ visible: true, distanceKm: distToRiderKm, type: 'dropoff' });
                    return;
                  }

                  setVerifyingLocation(false);
                  setLocationVerified(true);
                }}
                disabled={verifyingLocation || locationVerified}
              >
                <Text style={[styles.verifyBtnText, { color: '#fff' }]}>
                  {verifyingLocation ? 'Verifying...' : 'Verify Location'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.completeBtn, { backgroundColor: locationVerified ? BRAND.primary : theme.colors.border }]}
                onPress={async () => {
                  if (!locationVerified) {
                    setProximityAlert({ visible: true, distanceKm: 0, type: 'dropoff' });
                    return;
                  }
                  setShowCompletionModal(false);
                  // Proceed with completion bypassing modal check
                  await handleUpdate('completed', true);
                }}
                disabled={!locationVerified}
              >
                <Text style={[styles.completeBtnText, { color: locationVerified ? '#fff' : theme.colors.textSecondary }]}>
                  Confirm Completion
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: 'transparent', borderColor: theme.colors.border }]}
                onPress={() => setShowCompletionModal(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View pointerEvents="none" style={styles.hiddenReceipt}>
        <View ref={receiptRef} collapsable={false}>
          <RideReceiptTemplate ride={ride} audience="driver" />
        </View>

      <ProximityAlertModal
        visible={proximityAlert.visible}
        distanceKm={proximityAlert.distanceKm}
        type={proximityAlert.type}
        onClose={() => setProximityAlert(prev => ({ ...prev, visible: false }))}
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrapper: { height: verticalScale(250), position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  headerSafe: { ...StyleSheet.absoluteFillObject },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: scale(12) },
  backCircle: { width: scale(44), height: scale(44), borderRadius: scale(22), justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 4 },
  statusPill: { paddingHorizontal: scale(12), paddingVertical: verticalScale(6), borderRadius: scale(16), justifyContent: 'center', elevation: 4 },
  statusText: { fontSize: scale(10), fontWeight: '800' },
  fullMapBtn: { position: 'absolute', right: 16, bottom: 16, zIndex: 20, backgroundColor: '#FFF', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 4 },
  fullMapBtnText: { fontSize: 12, fontWeight: '800', color: '#000' },
  contentContainer: { flex: 1, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingTop: 30, paddingBottom: 120, overflow: 'hidden', backgroundColor: 'transparent' },
  // Simple Hack: Content background is handled by container color, this is to overlap map. Actually simpler to set background on ScrollView but it covers map corners. 
  // Let's rely on View structure.
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  sectionHeader: { fontSize: 10, fontWeight: '700', marginBottom: 12, letterSpacing: 0.5 },
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
  riderName: { fontSize: 16, fontWeight: '700' },
  riderSub: { fontSize: 12 },
  callBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  chatBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 3 },
  routeRow: { flexDirection: 'row' },
  routeSummary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  routeSummaryLabel: { fontSize: 12, fontWeight: '600' },
  routeSummaryValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  square: { width: 10, height: 10, borderWidth: 2 },
  address: { fontSize: 14, fontWeight: '600' },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  finLabel: { fontSize: 13 },
  finValue: { fontSize: 13, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 14, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  mainBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 140 },
  busyAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  receiptActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  receiptBtn: { flex: 1, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  receiptBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  hiddenReceipt: { position: 'absolute', left: -1200, top: 0, opacity: 1 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalBody: { gap: 16 },
  modalText: { fontSize: 14, lineHeight: 20 },
  locationCheck: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
  checkLabel: { fontSize: 16, fontWeight: '600' },
  checkSublabel: { fontSize: 12, marginTop: 4 },
  verifyBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  verifyBtnText: { fontSize: 16, fontWeight: '700' },
  completeBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  completeBtnText: { fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  cancelBtnText: { fontSize: 16, fontWeight: '600' },
});
