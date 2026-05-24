import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAlert } from '@/context/AlertContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import { RideMapFullscreenModal } from '@/components/RideMapFullscreenModal';
import { apiService } from '@/services/api';
import { BRAND } from '@/utils/colors';
import { verticalScale, scale } from 'react-native-size-matters';
import { fetchMapboxRoute } from '@/utils/mapboxDirections';
import { geocodeMapboxLocation } from '@/utils/mapboxGeocoding';

interface RideData {
  id: string;
  pickup_zone: string;
  destination_zone: string;
  pickup_description?: string;
  destination_description?: string;
  fare_amount: number | null;
  status: string;
  created_at: string;
  completed_at?: string;
  rating?: number;
  distance_km?: number;
  duration_minutes?: number;
  platform_fee?: number | null;
  payment_method?: string;
  driver_id?: string;
  assigned_driver_id?: string;
  drivers?: {
    id: string;
    user_id: string;
    vehicle_type?: string;
    plate_number?: string;
    vehicle_picture_url?: string;
    average_rating?: number;
    users?: {
      first_name: string;
      last_name: string;
      phone_number?: string;
      profile_picture_url?: string;
    };
  };
}

interface DriverDetails {
  first_name: string;
  last_name: string;
  phone_number?: string;
  avatar_url?: string;
  vehicle_type?: string;
  plate_number?: string;
  vehicle_picture_url?: string;
  average_rating?: number;
}

function parseCoordinates(description: string) {
  if (!description) return null;
  const latMatch = description.match(/Lat:\s*([-\d.]+)/);
  const lngMatch = description.match(/Lng:\s*([-\d.]+)/);
  if (latMatch && lngMatch) return { latitude: parseFloat(latMatch[1]), longitude: parseFloat(lngMatch[1]) };
  return null;
}

function formatCurrency(value?: number | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '0';
  return amount.toLocaleString();
}

export default function RideDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { showError, showSuccess } = useAlert();
  const insets = useSafeAreaInsets();
  const isLight = theme.mode === 'light';
  
  const rideDataParam = Array.isArray(params.rideData) ? params.rideData[0] : params.rideData || '';
  const [rideDetails, setRideDetails] = useState<RideData | null>(null);
  const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(null);
  const [pickupCoords, setPickupCoords] = useState<any>(null);
  const [destCoords, setDestCoords] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | undefined>(undefined);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeDistanceKm, setRouteDistanceKm] = useState(0);
  const [routeDurationMin, setRouteDurationMin] = useState(0);
  const [showFullMap, setShowFullMap] = useState(false);
  const parseMapCoordinate = (value: any): [number, number] | null => {
    if (Array.isArray(value) && value.length === 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))) {
      return [Number(value[0]), Number(value[1])];
    }
    if (value && Number.isFinite(Number(value.longitude)) && Number.isFinite(Number(value.latitude))) {
      return [Number(value.longitude), Number(value.latitude)];
    }
    return null;
  };

  useEffect(() => {
    if (rideDataParam) {
      try {
        const parsed = JSON.parse(rideDataParam);
        setRideDetails(parsed);
        setPickupCoords(parseCoordinates(parsed.pickup_description || ''));
        setDestCoords(parseCoordinates(parsed.destination_description || ''));

        // Map driver details from the ride data structure
        if (parsed.drivers?.users) {
          setDriverDetails({
            first_name: parsed.drivers.users.first_name,
            last_name: parsed.drivers.users.last_name,
            phone_number: parsed.drivers.users.phone_number,
            avatar_url: parsed.drivers.users.profile_picture_url,
            vehicle_type: parsed.drivers.vehicle_type,
            plate_number: parsed.drivers.plate_number,
            vehicle_picture_url: parsed.drivers.vehicle_picture_url,
            average_rating: parsed.drivers.average_rating,
          });
        }
      } catch (e) { console.error(e); }
    }
  }, [rideDataParam]);

  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      if (!rideDetails) {
        return;
      }

      setRouteLoading(true);

      try {
        const resolvedPickup = pickupCoords
          ? { coordinate: [pickupCoords.longitude, pickupCoords.latitude] as [number, number] }
          : rideDetails.pickup_zone
            ? await geocodeMapboxLocation(rideDetails.pickup_zone)
            : null;
        const resolvedDestination = destCoords
          ? { coordinate: [destCoords.longitude, destCoords.latitude] as [number, number] }
          : rideDetails.destination_zone
            ? await geocodeMapboxLocation(rideDetails.destination_zone)
            : null;

        if (cancelled || !resolvedPickup || !resolvedDestination) {
          return;
        }

        const route = await fetchMapboxRoute(resolvedPickup.coordinate, resolvedDestination.coordinate, {
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

        setRouteCoordinates([resolvedPickup.coordinate, resolvedDestination.coordinate]);
      } catch (error) {
        console.log('Failed to load Mapbox route for rider ride details:', error);
        if (pickupCoords && destCoords) {
          setRouteCoordinates([
            [pickupCoords.longitude, pickupCoords.latitude],
            [destCoords.longitude, destCoords.latitude],
          ]);
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
  }, [rideDetails, pickupCoords, destCoords]);

  const routeFitCoordinates = routeCoordinates || (pickupCoords && destCoords
    ? [
        [pickupCoords.longitude, pickupCoords.latitude] as [number, number],
        [destCoords.longitude, destCoords.latitude] as [number, number],
      ]
    : undefined);

  const rideAny = rideDetails as any;
  const riderCurrentLocation =
    parseMapCoordinate(rideAny?.rider_current_location) ||
    parseMapCoordinate(rideAny?.rider_location) ||
    parseMapCoordinate(rideAny?.current_location) ||
    null;
  const driverCurrentLocation =
    parseMapCoordinate(rideAny?.driver_current_location) ||
    parseMapCoordinate(rideAny?.driver_location) ||
    null;

  const displayDistanceKm = routeDistanceKm || rideDetails?.distance_km || 0;
  const displayDurationMin = routeDurationMin || rideDetails?.duration_minutes || 0;

  const handleCallDriver = async () => {
    const phoneNumber = driverDetails?.phone_number || rideDetails?.drivers?.users?.phone_number;
    console.log('📞 Attempting to call driver. Phone number:', phoneNumber);
    
    if (!phoneNumber) {
      showError('Unavailable', 'Driver phone number is not available.');
      return;
    }
    
    // Clean phone number - remove spaces, dashes, and parentheses
    const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    console.log('📞 Cleaned phone number:', cleanedNumber);
    
    const url = `tel:${cleanedNumber}`;
    console.log('📞 Attempting to open URL:', url);
    
    try {
      const supported = await Linking.canOpenURL(url);
      console.log('📞 URL supported:', supported);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('📞 Phone dialer not supported');
        showError('Error', 'Unable to open phone dialer on this device.');
      }
    } catch (err) {
      console.error('📞 Error calling driver:', err);
      showError('Error', `An error occurred while trying to call: ${err}`);
    }
  };

  const handleGoToRatingScreen = () => {
    if (!rideDetails?.id) {
      showError('Error', 'Ride details are unavailable.');
      return;
    }

    const resolvedDriverId =
      rideDetails.driver_id ||
      rideDetails.assigned_driver_id ||
      rideDetails.drivers?.id ||
      '';

    router.push({
      pathname: '/rider/rating',
      params: {
        rideId: rideDetails.id,
        driverId: resolvedDriverId,
        rideData: JSON.stringify({
          ...rideDetails,
          driver_id: resolvedDriverId,
        }),
      },
    } as any);
  };

  if (!rideDetails) return <View style={[styles.container, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={BRAND.primary} style={{marginTop: 50}} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      
      {/* Map Header */}
      <View style={styles.mapContainer}>
        <MapboxMap
          style={styles.map}
          latitude={pickupCoords?.latitude || 6.5244}
          longitude={pickupCoords?.longitude || 3.3792}
          mapStyle="navigation-day"
          showCompass
          showScaleBar
          fitCoordinates={routeFitCoordinates}
          routeCoordinates={routeCoordinates}
          zoom={12}
        >
          {pickupCoords && (
            <MapboxMarker
              id="pickup"
              coordinate={[pickupCoords.longitude, pickupCoords.latitude]}
              title="Pickup"
              color={BRAND.primary}
            />
          )}
          {destCoords && (
            <MapboxMarker
              id="destination"
              coordinate={[destCoords.longitude, destCoords.latitude]}
              title="Destination"
              color={isLight ? 'black' : 'white'}
            />
          )}
        </MapboxMap>
        <TouchableOpacity onPress={() => setShowFullMap(true)} style={styles.fullMapBtn}>
          <MaterialCommunityIcons name="fullscreen" size={18} color="#000" />
          <Text style={styles.fullMapBtnText}>Full Map</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.surface, top: Math.max(insets.top, verticalScale(12)) + verticalScale(8), left: scale(16) }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.statusTag, { backgroundColor: theme.colors.surface, top: Math.max(insets.top, verticalScale(12)) + verticalScale(8) + 52, right: scale(16) }]}>
          <View style={[styles.statusDot, { backgroundColor: rideDetails.status === 'completed' ? '#10B981' : BRAND.primary }]} />
          <Text style={[styles.statusText, { color: theme.colors.textPrimary }]}>{rideDetails.status.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Driver Card */}
        {(driverDetails || rideDetails.drivers) ? (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.driverRow}>
              <View style={styles.driverImageContainer}>
                <Image 
                  source={{ uri: driverDetails?.avatar_url || rideDetails.drivers?.users?.profile_picture_url || `https://ui-avatars.com/api/?name=${driverDetails?.first_name || rideDetails.drivers?.users?.first_name}&background=FF9101&color=fff` }} 
                  style={styles.avatar} 
                />
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={14} color={BRAND.primary} />
                </View>
              </View>
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={[styles.driverLabel, { color: theme.colors.textSecondary }]}>Your Driver</Text>
                <Text style={[styles.driverName, { color: theme.colors.textPrimary }]}>
                  {driverDetails ? `${driverDetails.first_name} ${driverDetails.last_name}` : `${rideDetails.drivers?.users?.first_name} ${rideDetails.drivers?.users?.last_name}`}
                </Text>
                {(driverDetails?.plate_number || rideDetails.drivers?.plate_number) && (
                  <Text style={[styles.carInfo, { color: theme.colors.textSecondary }]}>
                    {driverDetails?.vehicle_type || rideDetails.drivers?.vehicle_type || 'Keke'} • {driverDetails?.plate_number || rideDetails.drivers?.plate_number}
                  </Text>
                )}
              </View>
              {(driverDetails?.phone_number || rideDetails.drivers?.users?.phone_number) && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={handleCallDriver} style={styles.callBtn}>
                    <MaterialCommunityIcons name="phone" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push(`/rider/chat?rideId=${rideDetails.id}`)}
                    style={[styles.chatBtn, { backgroundColor: theme.colors.primary }]}
                  >
                    <MaterialCommunityIcons name="message" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, alignItems: 'center', paddingVertical: 24 }]}>
            <Text style={{color: theme.colors.textSecondary}}>Driver not assigned yet</Text>
          </View>
        )}

        {/* Route Info */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>TRIP DETAILS</Text>
          <View style={styles.routeContainer}>
            <View style={styles.timeline}>
               <View style={[styles.dot, { backgroundColor: BRAND.primary }]} />
               <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
               <View style={[styles.square, { borderColor: theme.colors.textPrimary }]} />
            </View>
            <View style={styles.addresses}>
               <View style={styles.addressBlock}>
                 <Text style={[styles.addressLabel, { color: theme.colors.textSecondary }]}>Pickup</Text>
                 <Text style={[styles.addressText, { color: theme.colors.textPrimary }]}>{rideDetails.pickup_zone}</Text>
                 <Text style={[styles.timeText, { color: theme.colors.textTertiary }]}>
                    {new Date(rideDetails.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </Text>
               </View>
               <View style={{ height: 24 }} />
               <View style={styles.addressBlock}>
                 <Text style={[styles.addressLabel, { color: theme.colors.textSecondary }]}>Dropoff</Text>
                 <Text style={[styles.addressText, { color: theme.colors.textPrimary }]}>{rideDetails.destination_zone}</Text>
               </View>
            </View>
          </View>
        </View>

        {/* Trip Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="map-marker-distance" size={20} color={BRAND.primary} style={{marginBottom: 4}} />
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{routeLoading ? 'Calculating...' : (displayDistanceKm ? `${displayDistanceKm.toFixed(1)} km` : '-')}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Distance</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={BRAND.primary} style={{marginBottom: 4}} />
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{routeLoading ? 'Calculating...' : (displayDurationMin ? `${Math.round(displayDurationMin)} min` : '-')}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Duration</Text>
          </View>
        </View>

        {/* Fare Breakdown */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>PAYMENT</Text>
          
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>Ride Fare</Text>
            <Text style={[styles.rowValue, { color: theme.colors.textPrimary }]}>₦{formatCurrency(rideDetails.fare_amount)}</Text>
          </View>
          
          {rideDetails.platform_fee && (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>Platform & Booking Fee</Text>
              <Text style={[styles.rowValue, { color: theme.colors.textPrimary }]}>₦{formatCurrency(rideDetails.platform_fee)}</Text>
            </View>
          )}
          
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          
          <View style={styles.row}>
            <View>
              <Text style={[styles.totalLabel, { color: theme.colors.textPrimary }]}>Total Amount</Text>
              <View style={[styles.paymentMethod, { backgroundColor: theme.colors.inputBackground }]}>
                 <MaterialCommunityIcons name={rideDetails.payment_method === 'cash' ? 'cash' : 'wallet'} size={14} color={theme.colors.textSecondary} />
                 <Text style={[styles.methodText, { color: theme.colors.textSecondary }]}>{rideDetails.payment_method || 'Wallet'}</Text>
              </View>
            </View>
            <Text style={[styles.totalValue, { color: BRAND.primary }]}>
              ₦{formatCurrency((rideDetails.fare_amount || 0) + (rideDetails.platform_fee || 0))}
            </Text>
          </View>
        </View>

        {/* Rating */}
        {rideDetails.status === 'completed' && (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, marginBottom: 8 }]}>RATE YOUR EXPERIENCE</Text>
            {Number(rideDetails.rating || 0) > 0 ? (
              <>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialCommunityIcons
                      key={star}
                      name={star <= Number(rideDetails.rating || 0) ? 'star' : 'star-outline'}
                      size={32}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <Text style={[styles.ratingSubmittedText, { color: theme.colors.textSecondary }]}>
                  You already submitted {Number(rideDetails.rating || 0)} star{Number(rideDetails.rating || 0) > 1 ? 's' : ''} for this ride.
                </Text>
                <TouchableOpacity onPress={handleGoToRatingScreen} style={[styles.rateBtn, styles.rateBtnDisabled]}>
                  <Text style={styles.rateBtnText}>Rating Submitted</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.ratingPendingText, { color: theme.colors.textSecondary }]}>
                  You have not rated this ride yet. Tap below to continue to the rating screen.
                </Text>
                <TouchableOpacity onPress={handleGoToRatingScreen} style={styles.rateBtn}>
                  <Text style={styles.rateBtnText}>Go To Rating Screen</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

      </ScrollView>
      <RideMapFullscreenModal
        visible={showFullMap}
        title="Ride Map"
        routeCoordinates={routeCoordinates}
        focusCoordinates={routeFitCoordinates}
        pickup={pickupCoords ? [pickupCoords.longitude, pickupCoords.latitude] : [3.3792, 6.5244]}
        dropoff={destCoords ? [destCoords.longitude, destCoords.latitude] : [3.4292, 6.5844]}
        riderLocation={riderCurrentLocation}
        driverLocation={driverCurrentLocation}
        speedText={routeLoading ? 'Loading route...' : `${displayDistanceKm || 0} km • ${displayDurationMin || 0} min`}
        onClose={() => setShowFullMap(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { height: 480, width: '100%', position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  headerOverlay: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, position: 'absolute', top: 0, left: 0, right: 0 },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 4, position: 'absolute', top: scale(16), left: scale(16), zIndex: 10 },
  statusTag: { paddingHorizontal: scale(14), paddingVertical: verticalScale(8), borderRadius: scale(30), flexDirection: 'row', alignItems: 'center', gap: scale(8), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 4, position: 'absolute', zIndex: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  fullMapBtn: { position: 'absolute', right: 16, bottom: 16, zIndex: 20, backgroundColor: '#FFF', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 4 },
  fullMapBtnText: { fontSize: 12, fontWeight: '800', color: '#000' },
  content: { flex: 1, padding: 20, marginTop: -40, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  card: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, elevation: 2 },
  driverRow: { flexDirection: 'row', alignItems: 'center' },
  driverImageContainer: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#eee' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFF', borderRadius: 10 },
  driverLabel: { fontSize: 10, textTransform: 'uppercase', fontWeight: '700', marginBottom: 2 },
  driverName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  carInfo: { fontSize: 13 },
  callBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: BRAND.primary, justifyContent: 'center', alignItems: 'center', shadowColor: BRAND.primary, shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, elevation: 5 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  chatBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, elevation: 3 },
  sectionTitle: { fontSize: 11, fontWeight: '700', marginBottom: 16, letterSpacing: 0.5 },
  routeContainer: { flexDirection: 'row' },
  timeline: { alignItems: 'center', marginRight: 16, paddingTop: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  square: { width: 10, height: 10, borderWidth: 2 },
  addresses: { flex: 1 },
  addressBlock: { justifyContent: 'center' },
  addressLabel: { fontSize: 11, marginBottom: 2 },
  addressText: { fontSize: 15, fontWeight: '600' },
  timeText: { fontSize: 11, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statItem: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 12 },
  totalLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  totalValue: { fontSize: 24, fontWeight: '800' },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  methodText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 8 },
  ratingSubmittedText: { textAlign: 'center', fontSize: 13, marginBottom: 8 },
  ratingPendingText: { textAlign: 'center', fontSize: 13, marginBottom: 12 },
  rateBtn: { backgroundColor: BRAND.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 12 },
  rateBtnDisabled: { opacity: 0.75 },
  rateBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
});

const mapDarkStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
];
