import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import { DriverLocationMarker } from '@/components/DriverLocationMarker';
import { RideMapFullscreenModal } from '@/components/RideMapFullscreenModal';
import { RideRoadProgressCard } from '@/components/RideRoadProgressCard';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';
import { fetchMapboxRoute } from '@/utils/mapboxDirections';
import { apiService } from '@/services/api';
import { supabaseService } from '@/services/supabase';
import { sendLiveTrackingNotification } from '@/services/liveTrackingNotification';

const { width, height } = Dimensions.get('window');

// ─── Cancellation policy ──────────────────────────────────────────────────────
// Free-cancel window: Always free if no driver accepted, OR 5 min after driver accepts
const FREE_CANCEL_AFTER_ACCEPTED_MS  =  5 * 60 * 1000; // 5 min
const CANCELLATION_PENALTY_PERCENT   = 0.30;            // 30% of fare

interface ActiveRide {
  id: string;
  pickup_zone: string;
  destination_zone: string;
  fare_amount: number;
  status: string;
  duration_minutes?: number;
  eta_minutes?: number;
  distance_km?: number;
  created_at?: string;       // when ride was booked
  accepted_at?: string;      // when driver accepted (may come from ride or metadata)
  pickup_latitude?: number;
  pickup_longitude?: number;
  destination_latitude?: number;
  destination_longitude?: number;
  pickup_description?: string;
  destination_description?: string;
  driver?: {
    users: {
      first_name: string;
      last_name: string;
      profile_picture_url?: string;
    };
    average_rating: number;
    vehicle_type?: string;
    plate_number?: string;
    phone?: string;
  };
  driver_id?: string;
}

type CancelStatus = 'free' | 'penalty' | 'not_allowed';

export default function ActiveRideScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { currentLocation } = useLocation();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | undefined>(undefined);
  const [routeDistanceKm, setRouteDistanceKm] = useState(0);
  const [routeDurationMin, setRouteDurationMin] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showFullMap, setShowFullMap] = useState(false);
  const [lastMapTap, setLastMapTap] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(Date.now());
  const driverArrivalCheckTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showDriverNoShowModal, setShowDriverNoShowModal] = useState(false);
  const [driverAcceptedAt, setDriverAcceptedAt] = useState<string | null>(null);
  const [showCompletionConfirmationModal, setShowCompletionConfirmationModal] = useState(false);
  const [verifyingCompletion, setVerifyingCompletion] = useState(false);
  const [trackingProgress, setTrackingProgress] = useState<'just-started' | 'started' | 'half-way' | 'very-close' | 'very-close-to-finish' | 'almost-finished' | 'ride-completed' | null>(null);

  // Hosted tracking banner URLs
  const trackingBannerUrls = {
    'just-started': 'https://ibb.co/TM76MTSP',
    'started': 'https://ibb.co/hkSWcW0',
    'half-way': 'https://ibb.co/nqGsN4Kg',
    'very-close': 'https://ibb.co/3mGk8Sj8',
    'very-close-to-finish': 'https://ibb.co/FbcTtdhm',
    'almost-finished': 'https://ibb.co/FbYQ9VvL',
    'ride-completed': 'https://ibb.co/67H9g755',
  };

  // Keep a live clock ticking for cancellation window countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const isDark = theme?.mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;
  const activeRideStatus = String(activeRide?.status || '').toLowerCase();
  const hasDriver = !!activeRide?.driver_id && !!activeRide?.driver;
  const isPending = activeRideStatus === 'pending' || activeRideStatus === 'dispatched';
  const isAccepted = activeRideStatus === 'accepted';
  const isInProgress = activeRideStatus === 'in_progress';
  const shouldShowEta = isPending || isAccepted;
  const displayEtaMin = routeDurationMin || activeRide?.eta_minutes || activeRide?.duration_minutes || 0;
  const displayDistanceKm = routeDistanceKm || activeRide?.distance_km || 0;

  // ─── Cancellation window logic ──────────────────────────────────────────────
  const cancelStatus = useMemo<CancelStatus>(() => {
    if (!activeRide) return 'not_allowed';
    if (activeRideStatus === 'completed' || activeRideStatus === 'cancelled' || activeRideStatus === 'in_progress') return 'not_allowed';

    const acceptedAt = activeRide.accepted_at ? new Date(activeRide.accepted_at).getTime() : null;

    // If no driver has accepted yet (pending or dispatched), always free to cancel
    if (activeRideStatus === 'pending' || activeRideStatus === 'dispatched') {
      return 'free';
    }

    // If driver has accepted, check the 5-minute window
    if (acceptedAt) {
      // Within 5 minutes of acceptance -> free
      if ((now - acceptedAt) < FREE_CANCEL_AFTER_ACCEPTED_MS) {
        return 'free';
      }
      // After 5 minutes of acceptance -> penalty
      return 'penalty';
    }

    // Default to free if no driver accepted
    return 'free';
  }, [activeRide, activeRideStatus, now]);

  // Calculate cancellation window countdown
  const cancellationCountdown = useMemo(() => {
    if (!activeRide) return null;
    if (activeRideStatus !== 'accepted') return null; // Only show countdown if driver accepted

    const acceptedAt = activeRide.accepted_at ? new Date(activeRide.accepted_at).getTime() : null;

    // Only show countdown if driver has accepted
    if (acceptedAt) {
      const elapsed = now - acceptedAt;
      const remaining = FREE_CANCEL_AFTER_ACCEPTED_MS - elapsed;
      if (remaining > 0) return Math.ceil(remaining / 1000); // Return seconds
    }

    return null;
  }, [activeRide, activeRideStatus, now]);

  // Calculate cancellation penalty percentage
  const cancellationPenaltyPercent = useMemo(() => {
    if (cancelStatus === 'penalty') {
      return Math.round(CANCELLATION_PENALTY_PERCENT * 100);
    }
    return 0;
  }, [cancelStatus]);

  // ─── Driver arrival check logic (15-minute window) ───────────────────────────
  const startDriverArrivalCheck = (rideId: string) => {
    // Clear any existing timer
    if (driverArrivalCheckTimer.current) {
      clearInterval(driverArrivalCheckTimer.current);
    }

    let elapsedMinutes = 0;
    const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    driverArrivalCheckTimer.current = setInterval(() => {
      elapsedMinutes += 5;

      // Check if ride status has changed to "arrived" or "in_progress"
      const currentStatus = String(activeRide?.status || '').toLowerCase();
      if (currentStatus === 'arrived' || currentStatus === 'in_progress' || currentStatus === 'completed' || currentStatus === 'cancelled') {
        if (driverArrivalCheckTimer.current) {
          clearInterval(driverArrivalCheckTimer.current);
          driverArrivalCheckTimer.current = null;
        }
        return;
      }

      // At 15 minutes, show the modal
      if (elapsedMinutes >= 15) {
        if (driverArrivalCheckTimer.current) {
          clearInterval(driverArrivalCheckTimer.current);
          driverArrivalCheckTimer.current = null;
        }
        setShowDriverNoShowModal(true);
      }
    }, CHECK_INTERVAL_MS);
  };

  const handleDriverNoShowResponse = async (driverCommunicated: boolean) => {
    const currentRideId = activeRide?.id || rideId;
    if (!currentRideId) return;

    setShowDriverNoShowModal(false);

    if (!driverCommunicated) {
      // Driver didn't communicate - revert ride to dispatched and penalize driver
      try {
        await apiService.post(`/rides/${currentRideId}/revert-to-dispatched`, {
          reason: 'Driver failed to arrive within 15 minutes without communication',
        });
        Alert.alert('Ride Re-dispatched', 'Your ride has been sent to other drivers. The previous driver has been penalized.');
        fetchActiveRide();
      } catch (error) {
        Alert.alert('Error', 'Failed to re-dispatch ride. Please contact support.');
      }
    } else {
      // Driver communicated - rider cancels without penalty
      try {
        await apiService.post(`/rides/${currentRideId}/cancel`, {
          reason: 'Driver communicated but rider cancelled',
          waiver: true, // Waive cancellation fee
        });
        Alert.alert('Ride Cancelled', 'Your ride has been cancelled without any fee.');
        router.replace('/rider/rides-history');
      } catch (error) {
        Alert.alert('Error', 'Failed to cancel ride. Please contact support.');
      }
    }
  };

  // Start arrival check when ride status changes to accepted
  useEffect(() => {
    if (isAccepted && activeRide?.id && !driverAcceptedAt) {
      setDriverAcceptedAt(new Date().toISOString());
      startDriverArrivalCheck(activeRide.id);
    }
    // Clear timer if ride is no longer accepted
    if (!isAccepted && driverArrivalCheckTimer.current) {
      clearInterval(driverArrivalCheckTimer.current);
      driverArrivalCheckTimer.current = null;
    }
  }, [isAccepted, activeRide?.id]);

  useEffect(() => {
    fetchActiveRide();
  }, [rideId]);

  const normalizeRide = (ride: any): ActiveRide => {
    if (!ride) return ride;
    const d = ride.drivers || ride.driver;
    return {
      ...ride,
      driver: d
        ? {
            ...d,
            vehicle_type: d.vehicle_type || ride.vehicle_type || 'Keke',
            plate_number: d.plate_number || ride.plate_number,
            average_rating: d.average_rating ?? d.users?.rating ?? 5,
          }
        : undefined,
    };
  };

  const fetchActiveRide = async () => {
    try {
      setLoading(true);
      const ride = rideId
        ? await apiService.getRiderActiveRide(rideId)
        : (await apiService.getRiderActiveRides())?.rides?.[0] || null;

      if (ride) {
        const normalized = normalizeRide(ride);
        setActiveRide(normalized);
        console.log('✅ [ACTIVE-RIDE] Fetched ride with fare:', normalized.fare_amount);
      }
    } catch (error) {
      console.error('Failed to fetch active ride:', error);
    } finally {
      setLoading(false);
    }
  };

  // Live driver location via Supabase Realtime
  const resolvedRideId = activeRide?.id || rideId;
  useEffect(() => {
    if (!resolvedRideId) return;

    let channel: any = null;
    let active = true;

    (async () => {
      try {
        channel = await supabaseService.subscribeToRideLocationUpdates(
          resolvedRideId,
          (payload: any) => {
            if (!active || !payload) return;
            if (payload.role && payload.role !== 'driver') return;
            if (
              typeof payload.latitude === 'number' &&
              typeof payload.longitude === 'number'
            ) {
              setDriverLocation({
                latitude: payload.latitude,
                longitude: payload.longitude,
              });
            }
          }
        );
      } catch (err) {
        console.log('Failed to subscribe to driver location:', err);
      }
    })();

    return () => {
      active = false;
      supabaseService.unsubscribeRideLocation(resolvedRideId).catch(() => {});
    };
  }, [resolvedRideId]);

  // Occasional location polling (every 30s) to reduce server load
  useEffect(() => {
    if (!resolvedRideId || !hasDriver) return;
    if (!isAccepted && !isInProgress) return;

    let mounted = true;
    const fetchDriverLoc = async () => {
      try {
        const res: any = await apiService.get(`/rides/${resolvedRideId}/driver-location`);
        const loc = res?.location || res?.driverLocation;
        if (mounted && loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
          setDriverLocation({
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
          });
        }
      } catch {
        /* best-effort polling */
      }
    };

    fetchDriverLoc();
    const timer = setInterval(fetchDriverLoc, 30000); // 30s polling
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [resolvedRideId, hasDriver, isAccepted, isInProgress]);

  // Calculate tracking progress based on distance
  useEffect(() => {
    if (!isAccepted && !isInProgress) {
      setTrackingProgress(null);
      return;
    }

    const distance = displayDistanceKm;
    if (!distance) return;

    // If accepted, driver is heading to pickup - use shorter thresholds
    // If in progress, driver is heading to destination - use normal thresholds
    const maxDistance = isAccepted ? 5 : 3;

    if (distance > maxDistance * 0.8) {
      setTrackingProgress('just-started');
    } else if (distance > maxDistance * 0.6) {
      setTrackingProgress('started');
    } else if (distance > maxDistance * 0.4) {
      setTrackingProgress('half-way');
    } else if (distance > maxDistance * 0.2) {
      setTrackingProgress('very-close');
    } else if (distance > 0.3) {
      setTrackingProgress('very-close-to-finish');
    } else if (distance > 0.1) {
      setTrackingProgress('almost-finished');
    } else {
      setTrackingProgress('ride-completed');
    }
  }, [displayDistanceKm, isAccepted, isInProgress]);

  // Live status notification (Expo local + native live activity / live update when available)
  const liveIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!resolvedRideId || !activeRide) return;
    const s = String(activeRide.status || '').toLowerCase();
    const progressMap: Record<string, { progress: number; stops: number; courier: string }> = {
      pending: { progress: 0.08, stops: 2, courier: 'Searching…' },
      dispatched: { progress: 0.12, stops: 2, courier: 'Searching…' },
      accepted: { progress: 0.45, stops: 1, courier: activeRide.driver ? `${activeRide.driver.users.first_name}` : 'Driver' },
      in_progress: { progress: 0.85, stops: 0, courier: activeRide.driver ? `${activeRide.driver.users.first_name}` : 'Driver' },
      completed: { progress: 1, stops: 0, courier: activeRide.driver ? `${activeRide.driver.users.first_name}` : 'Driver' },
    };
    const cfg = progressMap[s] || progressMap.pending;
    const titleByStatus: Record<string, string> = {
      pending: 'Looking for a driver… 🛺',
      dispatched: 'Looking for a driver… 🛺',
      accepted: 'Driver on the way 🟢',
      in_progress: 'Ride in progress 🚗',
      completed: 'Ride completed ✅',
      cancelled: 'Ride cancelled',
    };
    const title = titleByStatus[s] || `Ride ${s}`;
    const body = s === 'pending' || s === 'dispatched'
      ? `Broadcasting to nearby drivers • ${activeRide.pickup_zone} → ${activeRide.destination_zone}`
      : s === 'accepted'
        ? `${activeRide.driver ? activeRide.driver.users.first_name + ' ' + activeRide.driver.users.last_name : 'Driver'} is heading to pickup • ETA ${displayEtaMin || 8} min`
        : `${activeRide.pickup_zone} → ${activeRide.destination_zone}`;

    // Fallback local notification (works in Expo Go and production)
    sendLiveTrackingNotification({
      title,
      body,
      data: { type: 'live_tracking', rideId: resolvedRideId, status: s, pickup: activeRide.pickup_zone, destination: activeRide.destination_zone },
    }).catch(() => {});

    // Native path: ActivityKit / NotificationCompat live update (dev / production build only)
    (async () => {
      try {
        const dl: any = await import('@/modules/droptrack-live/src/index').catch(() => null);
        const mod = dl?.default ?? dl;
        if (!mod?.isSupported?.() || !resolvedRideId) return;
        const state = {
          status: s === 'pending' || s === 'dispatched' ? 'Broadcasting' : s === 'accepted' ? 'Driver on the way' : s === 'in_progress' ? 'En route' : s,
          progress: cfg.progress,
          etaEpochMillis: Date.now() + (displayEtaMin || 8) * 60 * 1000,
          stopsRemaining: cfg.stops,
          courierName: cfg.courier,
          riderReassigned: false,
        };
        if (s === 'completed' || s === 'cancelled') {
          if (liveIdRef.current) {
            await mod.endDelivery(liveIdRef.current, state, 6).catch(() => {});
            liveIdRef.current = null;
          }
          return;
        }
        if (!liveIdRef.current && (s === 'pending' || s === 'dispatched' || s === 'accepted')) {
          liveIdRef.current = await mod.startDelivery({ orderId: String(resolvedRideId) }, state).catch(() => null) as any;
          if (!liveIdRef.current) liveIdRef.current = String(resolvedRideId);
        } else if (liveIdRef.current) {
          await mod.updateDelivery(liveIdRef.current, state).catch(() => {});
        }
      } catch {}
    })();
  }, [resolvedRideId, activeRide?.status, activeRide?.driver?.users?.first_name, displayEtaMin]);

  // Postgres Realtime — instant status updates from rides table
  useEffect(() => {
    if (!resolvedRideId) return;
    let active = true;

    supabaseService.subscribeToRideUpdates(resolvedRideId, (updatedRide: any) => {
      if (!active) return;
      const newStatus = String(updatedRide?.status || '').toLowerCase();
      setActiveRide((prev) => {
        if (!prev) return prev;
        const changed = prev.status !== updatedRide.status;
        const next = { ...prev, ...updatedRide };
        // Alert rider on key status transitions
        if (changed) {
          if (newStatus === 'accepted') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Driver Found! 🎉', 'A driver has accepted your ride and is on the way.');
          } else if (newStatus === 'in_progress') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Ride Started 🚗', 'Your ride has started. Enjoy your trip!');
          } else if (newStatus === 'completed') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowCompletionConfirmationModal(true);
          } else if (newStatus === 'cancelled') {
            Alert.alert('Ride Cancelled', 'This ride has been cancelled.', [
              { text: 'Book Again', onPress: () => router.replace('/rider/booking') },
            ]);
          }
        }
        return next;
      });
    });

    return () => {
      active = false;
      supabaseService.unsubscribeRideUpdates(resolvedRideId).catch(() => {});
    };
  }, [resolvedRideId]);

  // Poll ride status every 15 s (fallback in case realtime misses an event)
  useEffect(() => {
    if (!resolvedRideId) return;
    const terminal = ['completed', 'cancelled'];
    if (terminal.includes(activeRideStatus)) return;

    const interval = setInterval(async () => {
      try {
        const fresh = await apiService.getRiderActiveRide(resolvedRideId);
        if (fresh) {
          const norm = normalizeRide(fresh);
          setActiveRide((prev) => (prev ? { ...prev, ...norm } : norm));
        }
      } catch { /* best-effort */ }
    }, 15000);

    return () => clearInterval(interval);
  }, [resolvedRideId, activeRideStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActiveRide();
    setRefreshing(false);
  };

  // Map markers
  const mapMarkers = useMemo(() => {
    const markers = [];
    // Add pickup marker (use ride pickup coordinates if available, otherwise current location)
    const pickupLat = activeRide?.pickup_latitude || currentLocation?.latitude;
    const pickupLng = activeRide?.pickup_longitude || currentLocation?.longitude;
    if (pickupLat && pickupLng) {
      markers.push({
        id: 'pickup',
        latitude: pickupLat,
        longitude: pickupLng,
        title: 'Pickup Location',
        type: 'pickup',
      });
    }
    // Add destination marker
    const destLat = activeRide?.destination_latitude;
    const destLng = activeRide?.destination_longitude;
    if (destLat && destLng) {
      markers.push({
        id: 'destination',
        latitude: destLat,
        longitude: destLng,
        title: 'Destination',
        type: 'destination',
      });
    }
    // Add driver marker with keke icon
    if (driverLocation) {
      markers.push({
        id: 'driver',
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        title: 'Driver',
        type: 'driver',
      });
    }
    return markers;
  }, [currentLocation, driverLocation, activeRide]);

  // Route (driver → pickup → destination)
  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      const pickupLat = activeRide?.pickup_latitude || currentLocation?.latitude;
      const pickupLng = activeRide?.pickup_longitude || currentLocation?.longitude;
      const destLat = activeRide?.destination_latitude;
      const destLng = activeRide?.destination_longitude;

      if (!pickupLat || !pickupLng || !destLat || !destLng) return;

      setRouteLoading(true);
      try {
        // If driver location is available, show route from driver to pickup
        // Otherwise show route from pickup to destination
        const startCoords: [number, number] = driverLocation
          ? [driverLocation.longitude, driverLocation.latitude]
          : [pickupLng, pickupLat];
        const endCoords: [number, number] = [destLng, destLat];

        const route = await fetchMapboxRoute(
          startCoords,
          endCoords,
          { profile: 'driving-traffic' }
        );
        if (cancelled) return;
        if (route) {
          setRouteCoordinates(route.coordinates);
          setRouteDistanceKm(parseFloat(route.distanceKm.toFixed(2)));
          setRouteDurationMin(Math.max(1, Math.round(route.durationMin)));
        } else {
          // Fallback to straight line
          setRouteCoordinates([startCoords, endCoords]);
        }
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };

    loadRoute();
    return () => { cancelled = true; };
  }, [currentLocation, driverLocation, activeRide]);

  const mapFocusCoordinates = useMemo<[number, number][]>(() => {
    const coords: [number, number][] = [];
    // Add pickup location
    const pickupLat = activeRide?.pickup_latitude || currentLocation?.latitude;
    const pickupLng = activeRide?.pickup_longitude || currentLocation?.longitude;
    if (pickupLat && pickupLng) {
      coords.push([pickupLng, pickupLat] as [number, number]);
    }
    // Add destination location
    const destLat = activeRide?.destination_latitude;
    const destLng = activeRide?.destination_longitude;
    if (destLat && destLng) {
      coords.push([destLng, destLat] as [number, number]);
    }
    // Add driver location
    if (driverLocation) {
      coords.push([driverLocation.longitude, driverLocation.latitude] as [number, number]);
    }
    return coords;
  }, [currentLocation, driverLocation, activeRide]);

  const handleMapTap = () => {
    const t = Date.now();
    if (t - lastMapTap < 300) setShowFullMap(true);
    setLastMapTap(t);
  };

  // ─── Cancellation ───────────────────────────────────────────────────────────
  const handleCancelRide = () => {
    if (!activeRide) return;

    const isFree = cancelStatus === 'free';
    const penaltyPercent = cancellationPenaltyPercent;
    const penaltyAmount = activeRide.fare_amount * CANCELLATION_PENALTY_PERCENT;
    const penaltyText = `A ${penaltyPercent}% cancellation fee (₦${penaltyAmount.toLocaleString()}) will be charged.`;

    Alert.alert(
      isFree ? 'Cancel Ride' : 'Cancel Ride — Penalty Applies',
      isFree
        ? 'Are you sure you want to cancel this ride? You are still within the free cancellation window.'
        : `The free cancellation window has closed.\n\n${penaltyText}\n\nDo you still want to cancel?`,
      [
        { text: 'Keep Ride', style: 'cancel' },
        {
          text: isFree ? 'Cancel Ride' : 'Cancel & Accept Penalty',
          style: 'destructive',
          onPress: () => confirmCancel(isFree),
        },
      ]
    );
  };

  const confirmCancel = async (isFree: boolean) => {
    if (!activeRide) return;
    setCancelling(true);
    try {
      const penaltyAmount = isFree ? 0 : activeRide.fare_amount * CANCELLATION_PENALTY_PERCENT;
      const waiveFee = isPending || isFree; // Waive fee if no driver accepted or within free window
      await apiService.post(`/rides/${activeRide.id}/cancel`, {
        reason: 'User cancelled',
        penalty_amount: penaltyAmount,
        waiver: waiveFee,
      });
      router.replace('/rider/booking');
    } catch (err: any) {
      Alert.alert('Cancellation Failed', err?.message || 'Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 16 }}>Loading ride...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeRide) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <MaterialCommunityIcons name="car-off" size={48} color={colors.textSecondary} />
          <Text style={{ color: colors.text, marginTop: 16, fontSize: 16, fontWeight: '600' }}>
            No Active Ride
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            You don't have any active rides. Book a ride to get started.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/rider/booking')}
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: colors.primary,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: isDark ? '#000000' : '#FFFFFF', fontWeight: '600' }}>
              Book a Ride
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const driver = activeRide.driver?.users;
  const driverRating = activeRide.driver?.average_rating || 5;

  // Status label and colour
  const statusLabel = (() => {
    switch (activeRideStatus) {
      case 'pending':     return 'Looking for driver…';
      case 'dispatched':  return 'Finding driver…';
      case 'accepted':    return 'Driver on the way';
      case 'in_progress': return 'Ride in progress';
      case 'completed':   return 'Completed';
      case 'cancelled':   return 'Cancelled';
      default:            return activeRide.status;
    }
  })();

  const statusColor = (() => {
    switch (activeRideStatus) {
      case 'pending':
      case 'dispatched': return '#f59e0b';
      case 'accepted':   return '#10b981';
      case 'in_progress': return colors.primary;
      case 'cancelled':  return '#ef4444';
      default:           return colors.primary;
    }
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: isDark ? '#1a1a1a' : '#f5820b',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          {/* Top row: back + title + status pill */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <Text
              style={{
                flex: 1,
                fontSize: 19,
                fontWeight: '800',
                color: '#FFFFFF',
                marginLeft: 12,
              }}
            >
              Active Ride
            </Text>

            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                backgroundColor: 'rgba(255,255,255,0.25)',
                borderRadius: 20,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
                {activeRide.status?.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Route row with icons instead of emoji arrow */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="map-marker" size={14} color="rgba(255,255,255,0.85)" />
            <Text
              numberOfLines={1}
              style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, flex: 1 }}
            >
              {activeRide.pickup_zone}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={14} color="rgba(255,255,255,0.7)" />
            <MaterialCommunityIcons name="map-marker-check" size={14} color="rgba(255,255,255,0.85)" />
            <Text
              numberOfLines={1}
              style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, flex: 1 }}
            >
              {activeRide.destination_zone}
            </Text>
          </View>
        </View>

        {/* ── "Waiting for driver" banner (pending/dispatched) ─────────────────── */}
        {isPending && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              borderRadius: 16,
              backgroundColor: isDark ? '#292510' : '#fffbeb',
              borderWidth: 1,
              borderColor: '#f59e0b',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <ActivityIndicator size="small" color="#f59e0b" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#b45309', fontWeight: '800', fontSize: 14, marginBottom: 3 }}>
                Looking for a driver…
              </Text>
              <Text style={{ color: '#92400e', fontSize: 12, lineHeight: 17 }}>
                We're matching you with a nearby driver. This usually takes 1–3 minutes.
              </Text>
            </View>
          </View>
        )}

        {/* ── "Driver on the way" banner (accepted) ─────────────────────────── */}
        {isAccepted && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              borderRadius: 16,
              backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
              borderWidth: 1,
              borderColor: '#10b981',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#10b981',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons name="navigation-variant" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: isDark ? '#34d399' : '#065f46', fontWeight: '800', fontSize: 14, marginBottom: 2 }}>
                Driver is on the way 🛺
              </Text>
              <Text style={{ color: isDark ? '#a7f3d0' : '#047857', fontSize: 12, lineHeight: 16 }}>
                Your driver has accepted the ride and is heading to your pickup location.
              </Text>
            </View>
          </View>
        )}

        {/* ── Map ─────────────────────────────────────────────────────────────── */}
        <View
          style={{
            height: 300,
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MapboxMap
            style={{ flex: 1 }}
            latitude={currentLocation?.latitude || 6.5244}
            longitude={currentLocation?.longitude || 3.3792}
            zoom={14}
            mapStyle={isDark ? 'navigation-night' : 'navigation-day'}
            showUserLocation
            showCompass
            showScaleBar
            fitCoordinates={routeCoordinates || mapFocusCoordinates}
            routeCoordinates={routeCoordinates}
            routeColor={colors.primary}
            routeWidth={4}
            onPressCoordinate={handleMapTap}
          >
            {/* Show markers */}
            {mapMarkers.map((marker) => (
              <MapboxMarker
                key={marker.id}
                id={marker.id}
                coordinate={[marker.longitude, marker.latitude]}
                title={marker.title}
                color={
                  marker.type === 'driver' ? colors.primary :
                  marker.type === 'pickup' ? '#10B981' :
                  marker.type === 'destination' ? '#EF4444' :
                  '#ef4444'
                }
              >
                {marker.type === 'driver' ? <DriverLocationMarker size={32} /> : null}
              </MapboxMarker>
            ))}
          </MapboxMap>

          {/* Live Tracking Progress Banner */}
          {trackingProgress && (
            <View
              style={{
                position: 'absolute',
                bottom: 60,
                left: 16,
                right: 16,
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Image
                source={{ uri: trackingBannerUrls[trackingProgress] }}
                style={{ width: 50, height: 50, borderRadius: 8 }}
                resizeMode="contain"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14, marginBottom: 2 }}>
                  {trackingProgress === 'just-started'
                    ? 'Driver Just Started'
                    : trackingProgress === 'started'
                    ? 'Driver is on the way'
                    : trackingProgress === 'half-way'
                    ? 'Halfway There'
                    : trackingProgress === 'very-close'
                    ? 'Very Close'
                    : trackingProgress === 'very-close-to-finish'
                    ? 'Very Close to Finish'
                    : trackingProgress === 'almost-finished'
                    ? 'Almost There'
                    : 'Arrived!'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  {displayDistanceKm.toFixed(1)} km away • ETA: {displayEtaMin} min
                </Text>
              </View>
            </View>
          )}

          {/* Full screen map button */}
          <TouchableOpacity
            onPress={() => setShowFullMap(true)}
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MaterialCommunityIcons name="fullscreen" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Full Map</Text>
          </TouchableOpacity>
        </View>

        {/* ── Live Road Progress Bar (Commented out as requested) ─────────────────── */}
        {/* {(isAccepted || isInProgress) && (
          <RideRoadProgressCard
            status={activeRideStatus}
            distanceKm={displayDistanceKm}
            etaMinutes={displayEtaMin}
            pickupZone={activeRide.pickup_zone}
            destinationZone={activeRide.destination_zone}
            driverName={driver ? `${driver.first_name} ${driver.last_name}` : 'Driver'}
          />
        )} */}

        {/* ── Distance / ETA row ───────────────────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 3 }}>Distance</Text>
            <Text style={{ fontSize: 18, color: colors.text, fontWeight: '800' }}>
              {routeLoading ? '—' : displayDistanceKm > 0 ? `${displayDistanceKm} km` : '—'}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 3 }}>Fare</Text>
            <Text style={{ fontSize: 18, color: colors.primary, fontWeight: '800' }}>
              ₦{activeRide.fare_amount?.toLocaleString() || '0'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 3 }}>
              {shouldShowEta ? 'ETA' : 'Duration'}
            </Text>
            <Text style={{ fontSize: 18, color: colors.text, fontWeight: '800' }}>
              {routeLoading && shouldShowEta
                ? '—'
                : `${shouldShowEta ? displayEtaMin || '—' : activeRide.duration_minutes || '—'} min`}
            </Text>
          </View>
        </View>

        {/* ── Driver Info Card ─────────────────────────────────────────────────── */}
        {hasDriver ? (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.textSecondary,
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Your Driver
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 22, color: '#fff', fontWeight: '800' }}>
                  {driver?.first_name?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                  {driver?.first_name} {driver?.last_name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  <MaterialCommunityIcons name="star" size={13} color={colors.primary} />
                  <Text style={{ color: colors.text, marginLeft: 3, fontWeight: '700', fontSize: 12 }}>
                    {driverRating.toFixed(1)}
                  </Text>
                  <Text style={{ color: colors.textSecondary, marginLeft: 4, fontSize: 11 }}>
                    · Excellent driver
                  </Text>
                </View>
              </View>
              {/* Call button placeholder */}
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons name="phone" size={19} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Vehicle info */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 3 }}>Vehicle</Text>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                  {activeRide.driver?.vehicle_type || 'Keke'}
                </Text>
              </View>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 3 }}>Plate</Text>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                  {activeRide.driver?.plate_number || 'N/A'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 3 }}>Status</Text>
                <Text style={{ color: statusColor, fontWeight: '700', fontSize: 13 }}>
                  {statusLabel}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* No driver yet — placeholder card */
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
            }}
          >
            <MaterialCommunityIcons name="account-search" size={40} color={colors.textSecondary} />
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 10 }}>
              No driver assigned yet
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
              We're dispatching nearby drivers. You'll see driver details here once someone accepts.
            </Text>
          </View>
        )}

        {/* ── Route card ───────────────────────────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* Pickup */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: '#ef444420',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
              }}
            >
              <MaterialCommunityIcons name="map-marker" size={16} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, marginBottom: 1 }}>Pickup</Text>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                {activeRide.pickup_zone}
              </Text>
            </View>
          </View>

          {/* Connector line */}
          <View
            style={{
              marginLeft: 14,
              width: 2,
              height: 18,
              backgroundColor: colors.border,
              marginBottom: 8,
            }}
          />

          {/* Destination */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
              }}
            >
              <MaterialCommunityIcons name="map-marker-check" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, marginBottom: 1 }}>Destination</Text>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                {activeRide.destination_zone}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Cancellation policy notice ───────────────────────────────────────── */}
        {(isPending || isAccepted) && cancelStatus !== 'not_allowed' && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 10,
              borderRadius: 12,
              backgroundColor: cancelStatus === 'free' ? '#f0fdf4' : '#fef2f2',
              borderWidth: 1,
              borderColor: cancelStatus === 'free' ? '#bbf7d0' : '#fecaca',
              padding: 12,
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <MaterialCommunityIcons
              name={cancelStatus === 'free' ? 'clock-outline' : 'alert-circle'}
              size={18}
              color={cancelStatus === 'free' ? '#16a34a' : '#ef4444'}
            />
            <Text style={{ color: cancelStatus === 'free' ? '#15803d' : '#b91c1c', fontSize: 12, flex: 1, lineHeight: 17 }}>
              {isPending
                ? 'Free cancellation available while waiting for driver'
                : isAccepted && cancelStatus === 'free' && cancellationCountdown !== null
                  ? `Free cancellation window: ${Math.floor(cancellationCountdown / 60)}:${(cancellationCountdown % 60).toString().padStart(2, '0')} remaining`
                  : isAccepted && cancelStatus === 'penalty'
                    ? `Free cancellation window closed. Cancelling now incurs a ${cancellationPenaltyPercent}% fee`
                    : 'Free cancellation window active'}
            </Text>
          </View>
        )}

        {/* ── Action Buttons ───────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 10 }}>
          <TouchableOpacity
            style={{
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: colors.primary,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <MaterialCommunityIcons name="share-variant" size={18} color={isDark ? '#000' : '#fff'} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#000000' : '#FFFFFF' }}>
              Share Live Location
            </Text>
          </TouchableOpacity>

          {/* Cancel button — only show if ride is still cancellable */}
          {(isPending || isAccepted) && cancelStatus !== 'not_allowed' && (
            <TouchableOpacity
              onPress={handleCancelRide}
              disabled={cancelling}
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: colors.card,
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: cancelStatus === 'free' ? colors.border : '#ef4444',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={18}
                  color={cancelStatus === 'free' ? colors.text : '#ef4444'}
                />
              )}
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: cancelStatus === 'free' ? colors.text : '#ef4444',
                }}
              >
                {cancelling
                  ? 'Cancelling…'
                  : isPending
                  ? 'Cancel Ride (Free)'
                  : cancelStatus === 'free'
                  ? 'Cancel Ride (Free)'
                  : `Cancel Ride — ${cancellationPenaltyPercent}% fee`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Driver No-Show Modal */}
      <Modal
        visible={showDriverNoShowModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDriverNoShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons name="clock-alert" size={56} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Driver Not Arrived</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              It has been 15 minutes since your driver accepted the ride. Did the driver communicate with you about any delays?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={() => handleDriverNoShowResponse(true)}
              >
                <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
                <Text style={styles.modalButtonText}>Yes, Driver Communicated</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => handleDriverNoShowResponse(false)}
              >
                <MaterialCommunityIcons name="alert-circle" size={20} color={colors.text} />
                <Text style={[styles.modalButtonText, { color: colors.text }]}>No, No Communication</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowDriverNoShowModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Completion Confirmation Modal */}
      <Modal
        visible={showCompletionConfirmationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompletionConfirmationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons name="check-circle" size={56} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Ride Completion</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              Your driver has marked this ride as completed. Please confirm if you have arrived at your destination.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  setShowCompletionConfirmationModal(false);
                  setVerifyingCompletion(true);
                  try {
                    await apiService.post(`/rides/${resolvedRideId}/confirm-completion`, {
                      riderConfirmed: true,
                      confirmedAt: new Date().toISOString(),
                    });
                  } catch (e) {
                    // Endpoint may not exist on backend yet — fall back to a rating-based confirmation
                    console.log('[Completion] confirm-completion endpoint not available, using rating flow');
                  } finally {
                    setVerifyingCompletion(false);
                  }
                  Alert.alert('Ride Completed ✅', 'Your ride is complete. Rate your driver!', [
                    { text: 'Rate Now', onPress: () => router.replace(`/rider/rating?rideId=${resolvedRideId}`) },
                    { text: 'Later', style: 'cancel' },
                  ]);
                }}
              >
                <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                <Text style={styles.modalButtonText}>Confirm Completed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={async () => {
                  setShowCompletionConfirmationModal(false);
                  setVerifyingCompletion(true);
                  try {
                    await apiService.post(`/rides/${resolvedRideId}/dispute`, {
                      reason: 'rider_not_at_destination',
                      description: 'Driver marked the ride as completed but rider has not arrived at the destination.',
                      reportedAt: new Date().toISOString(),
                    });
                    Alert.alert('Issue Reported', 'Thank you. Our team will review this and contact you.');
                  } catch (e) {
                    // Fallback: open a support ticket so the rider is never stranded
                    try {
                      await apiService.post('/support/tickets', {
                        subject: 'Ride completion dispute',
                        description: `Ride ${resolvedRideId}: Driver marked ride completed but rider disputes it.`,
                        category: 'ride_dispute',
                        priority: 'high',
                        initialMessage: 'I dispute the completion of this ride.',
                      });
                      Alert.alert('Issue Reported', 'A support ticket has been created. Our team will contact you.');
                    } catch (err: any) {
                      Alert.alert('Could not report', err?.message || 'Please try again or contact support directly.');
                    }
                  } finally {
                    setVerifyingCompletion(false);
                  }
                }}
              >
                <MaterialCommunityIcons name="alert-circle" size={20} color={colors.text} />
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Not Completed</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCompletionConfirmationModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <RideMapFullscreenModal
        visible={showFullMap}
        title="Active Ride Map"
        routeCoordinates={routeCoordinates}
        focusCoordinates={routeCoordinates || mapFocusCoordinates}
        riderLocation={currentLocation ? [currentLocation.longitude, currentLocation.latitude] : null}
        driverLocation={driverLocation ? [driverLocation.longitude, driverLocation.latitude] : null}
        speedText={
          routeLoading && shouldShowEta
            ? 'Loading route…'
            : `${shouldShowEta ? 'ETA' : 'Duration'} ${shouldShowEta ? displayEtaMin || 0 : activeRide.duration_minutes || 0} min | ${displayDistanceKm || 0} km`
        }
        onClose={() => setShowFullMap(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 400, borderRadius: 20, padding: 24, borderWidth: 1, alignItems: 'center' },
  modalIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(245, 130, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  modalText: { fontSize: 14, lineHeight: 20, marginBottom: 24, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  modalButtonPrimary: {},
  modalButtonSecondary: { borderWidth: 1 },
  modalButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  modalCancelButton: { paddingVertical: 12, marginTop: 8 },
  modalCancelText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
