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
  Vibration,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import { RideMapFullscreenModal } from '@/components/RideMapFullscreenModal';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';
import { fetchMapboxRoute } from '@/utils/mapboxDirections';
import { apiService } from '@/services/api';
import { supabaseService } from '@/services/supabase';

const { width, height } = Dimensions.get('window');

// ─── Cancellation policy ──────────────────────────────────────────────────────
// Free-cancel window: 10 min from booking OR 5 min after driver accepts
const FREE_CANCEL_AFTER_BOOKING_MS   = 10 * 60 * 1000; // 10 min
const FREE_CANCEL_AFTER_ACCEPTED_MS  =  5 * 60 * 1000; // 5 min
const CANCELLATION_PENALTY_AMOUNT    = 200;             // ₦200 penalty

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
    if (activeRideStatus === 'completed' || activeRideStatus === 'cancelled') return 'not_allowed';

    const bookedAt = activeRide.created_at ? new Date(activeRide.created_at).getTime() : null;
    const acceptedAt = activeRide.accepted_at ? new Date(activeRide.accepted_at).getTime() : null;

    // Still within 10 min of booking
    if (bookedAt && (now - bookedAt) < FREE_CANCEL_AFTER_BOOKING_MS) return 'free';

    // Driver just accepted — within 5 min grace
    if (acceptedAt && (now - acceptedAt) < FREE_CANCEL_AFTER_ACCEPTED_MS) return 'free';

    // Outside all free windows
    if (activeRideStatus === 'pending' || activeRideStatus === 'dispatched') {
      // No driver yet but booking window expired
      return 'penalty';
    }
    return 'penalty';
  }, [activeRide, activeRideStatus, now]);

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
        setActiveRide(normalizeRide(ride));
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
            Vibration.vibrate(400);
            Alert.alert('Driver Found! 🎉', 'A driver has accepted your ride and is on the way.');
          } else if (newStatus === 'in_progress') {
            Vibration.vibrate(200);
            Alert.alert('Ride Started 🚗', 'Your ride has started. Enjoy your trip!');
          } else if (newStatus === 'completed') {
            Vibration.vibrate([0, 200, 100, 200]);
            Alert.alert('Ride Completed ✅', 'Your ride is complete. Rate your driver!', [
              { text: 'Rate Now', onPress: () => router.replace(`/rider/rating?rideId=${resolvedRideId}`) },
              { text: 'Later', style: 'cancel' },
            ]);
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
    if (currentLocation) {
      markers.push({
        id: 'pickup',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        title: 'Your Location',
        type: 'pickup',
      });
    }
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
  }, [currentLocation, driverLocation]);

  // Route (driver → pickup, or just straight line)
  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      if (!currentLocation || !driverLocation) return;

      setRouteLoading(true);
      try {
        const route = await fetchMapboxRoute(
          [currentLocation.longitude, currentLocation.latitude],
          [driverLocation.longitude, driverLocation.latitude],
          { profile: 'driving-traffic' }
        );
        if (cancelled) return;
        if (route) {
          setRouteCoordinates(route.coordinates);
          setRouteDistanceKm(parseFloat(route.distanceKm.toFixed(2)));
          setRouteDurationMin(Math.max(1, Math.round(route.durationMin)));
        } else {
          setRouteCoordinates([
            [currentLocation.longitude, currentLocation.latitude],
            [driverLocation.longitude, driverLocation.latitude],
          ]);
        }
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };

    loadRoute();
    return () => { cancelled = true; };
  }, [currentLocation, driverLocation]);

  const mapFocusCoordinates = useMemo<[number, number][]>(() => {
    const coords: [number, number][] = [];
    if (currentLocation) coords.push([currentLocation.longitude, currentLocation.latitude]);
    if (driverLocation) coords.push([driverLocation.longitude, driverLocation.latitude]);
    return coords;
  }, [currentLocation, driverLocation]);

  const handleMapTap = () => {
    const t = Date.now();
    if (t - lastMapTap < 300) setShowFullMap(true);
    setLastMapTap(t);
  };

  // ─── Cancellation ───────────────────────────────────────────────────────────
  const handleCancelRide = () => {
    if (!activeRide) return;

    const isFree = cancelStatus === 'free';
    const penaltyText = `A cancellation penalty of ₦${CANCELLATION_PENALTY_AMOUNT.toLocaleString()} will be added to your next booking.`;

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
      await apiService.post(`/rides/${activeRide.id}/cancel`, {
        reason: 'User cancelled',
        penalty_amount: isFree ? 0 : CANCELLATION_PENALTY_AMOUNT,
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
            onPressCoordinate={handleMapTap}
          >
            {mapMarkers.map((marker) => (
              <MapboxMarker
                key={marker.id}
                id={marker.id}
                coordinate={[marker.longitude, marker.latitude]}
                title={marker.title}
                color={marker.type === 'driver' ? colors.primary : '#ef4444'}
              />
            ))}
          </MapboxMap>

          {/* Double-tap hint */}
          <View
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              backgroundColor: 'rgba(0,0,0,0.45)',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10 }}>Double-tap for full map</Text>
          </View>
        </View>

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
        {(isPending || isAccepted) && cancelStatus === 'penalty' && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 10,
              borderRadius: 12,
              backgroundColor: '#fef2f2',
              borderWidth: 1,
              borderColor: '#fecaca',
              padding: 12,
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <MaterialCommunityIcons name="alert-circle" size={18} color="#ef4444" />
            <Text style={{ color: '#b91c1c', fontSize: 12, flex: 1, lineHeight: 17 }}>
              The free cancellation window has closed. Cancelling now will incur a{' '}
              <Text style={{ fontWeight: '800' }}>₦{CANCELLATION_PENALTY_AMOUNT.toLocaleString()} penalty</Text>{' '}
              added to your next booking.
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
          {(isPending || isAccepted) && (
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
                  : cancelStatus === 'free'
                  ? 'Cancel Ride (Free)'
                  : `Cancel Ride — ₦${CANCELLATION_PENALTY_AMOUNT.toLocaleString()} penalty`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

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
