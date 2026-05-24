// 'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
   ActivityIndicator,
  Linking,
  Alert,
  StyleSheet,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import { RideMapFullscreenModal } from '@/components/RideMapFullscreenModal';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import { BRAND, COLORS } from '@/utils/colors';
import { verticalScale, scale } from 'react-native-size-matters';
import { fetchMapboxRoute } from '@/utils/mapboxDirections';
import { geocodeMapboxLocation } from '@/utils/mapboxGeocoding';

const { width } = Dimensions.get('window');

export default function RideDetailsScreen() {
  const router = useRouter();
  const { rideId, rideData } = useLocalSearchParams();
  const { theme, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const isLight = mode === 'light';
  const [ride, setRide] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
   const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | undefined>(undefined);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeDistanceKm, setRouteDistanceKm] = useState(0);
  const [routeDurationMin, setRouteDurationMin] = useState(0);
  const [showFullMap, setShowFullMap] = useState(false);
  const [lastMapTap, setLastMapTap] = useState(0);

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

      const loadRoute = async () => {
         if (!ride) {
            return;
         }

         setRouteLoading(true);

         try {
            const pickupQuery = ride.pickup_description || ride.pickup_zone || '';
            const destinationQuery = ride.destination_description || ride.destination_zone || '';

            const [pickupResult, destinationResult] = await Promise.all([
               pickupQuery ? geocodeMapboxLocation(pickupQuery) : null,
               destinationQuery ? geocodeMapboxLocation(destinationQuery) : null,
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
         } catch (error) {
            console.log('Failed to load Mapbox route for driver ride details:', error);
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

  const handleUpdate = async (status: string) => {
    try {
      setUpdating(true);
      const response = await apiService.updateRideStatus(rideId as string, status as 'in_progress' | 'completed');
      
      if (response) {
        // Update local state with the response data
        setRide(response);
        
        if (status === 'completed') {
          Alert.alert('Success', 'Ride completed!');
          router.back();
        } else {
          Alert.alert('Success', 'Trip started!');
        }
      }
    } catch (error: any) {
      console.error('❌ [RIDE] Update failed:', error);
      Alert.alert('Error', error?.message || 'Failed to update ride status');
    } finally {
      setUpdating(false);
    }
  };

   if (!ride) {
      return (
         <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
            <ListScreenSkeleton itemCount={3} />
         </View>
      );
   }

  const routeFitCoordinates = routeCoordinates || [[3.3792, 6.5244], [3.4292, 6.5844]];
  const handleMapTap = () => {
    const now = Date.now();
    if (now - lastMapTap < 300) {
      setShowFullMap(true);
    }
    setLastMapTap(now);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      
      {/* Header Overlay on Map */}
      <View style={styles.mapWrapper}>
         <MapboxMap
           style={styles.map}
           latitude={6.5244}
           longitude={3.3792}
                mapStyle="navigation-day"
                showCompass
                showScaleBar
                fitCoordinates={routeFitCoordinates}
                routeCoordinates={routeCoordinates}
           zoom={12}
           onPressCoordinate={handleMapTap}
         >
                  <MapboxMarker
                     id="pickup"
                     coordinate={routeCoordinates?.[0] || [3.3792, 6.5244]}
                     title="Pickup"
                     color={BRAND.primary}
                  />
                  <MapboxMarker
                     id="dropoff"
                     coordinate={routeCoordinates?.[routeCoordinates.length - 1] || [3.4292, 6.5844]}
                     title="Dropoff"
                     color="black"
                  />
         </MapboxMap>
         <SafeAreaView style={[styles.headerSafe, { paddingTop: Math.max(0, verticalScale(8)) }]}>
            <View style={[styles.headerRow, { paddingHorizontal: scale(16), paddingVertical: verticalScale(8) }]}>
               <TouchableOpacity onPress={() => router.back()} style={[styles.backCircle, { backgroundColor: theme.colors.surface }]}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
               </TouchableOpacity>
               <View style={[styles.statusPill, { backgroundColor: BRAND.primary }]}>
                  <Text style={[styles.statusText, { color: '#000' }]}>{ride.status?.toUpperCase() || 'DETAILS'}</Text>
               </View>
            </View>
         </SafeAreaView>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
         
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
                  <View style={styles.avatarPlaceholder}><Text style={{fontSize:20}}>👤</Text></View>
               )}
               <View style={{flex:1}}>
                  <Text style={[styles.riderName, { color: theme.colors.textPrimary }]}>{ride.users?.first_name || 'Passenger Name'}</Text>
                  <Text style={[styles.riderSub, { color: theme.colors.textSecondary }]}>Rating: {ride.users?.rating || '5.0'} ★</Text>
               </View>
               <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${ride.users?.phone_number}`)} style={[styles.callBtn, { backgroundColor: theme.colors.inputBackground }]}>
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
                        <Text style={[styles.routeSummaryValue, { color: theme.colors.textPrimary }]}>{routeLoading ? 'Calculating...' : `${routeDistanceKm || 0} km`}</Text>
                     </View>
                     <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.routeSummaryLabel, { color: theme.colors.textSecondary }]}>ETA</Text>
                        <Text style={[styles.routeSummaryValue, { color: theme.colors.textPrimary }]}>{routeLoading ? 'Calculating...' : `${routeDurationMin || 0} min`}</Text>
                     </View>
                  </View>
         </View>

         {/* Financials */}
         <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>EARNINGS BREAKDOWN</Text>
            <View style={styles.financeRow}>
               <Text style={[styles.finLabel, { color: theme.colors.textSecondary }]}>Base Fare</Text>
               <Text style={[styles.finValue, { color: theme.colors.textPrimary }]}>₦{ride.fare_amount || 0}</Text>
            </View>
            <View style={styles.financeRow}>
               <Text style={[styles.finLabel, { color: theme.colors.textSecondary }]}>Platform Fee (20%)</Text>
               <Text style={[styles.finValue, { color: theme.colors.error }]}>- ₦{(ride.fare_amount * 0.2).toFixed(0)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.financeRow}>
               <Text style={[styles.totalLabel, { color: theme.colors.textPrimary }]}>Your Earning</Text>
               <Text style={[styles.totalValue, { color: '#10B981' }]}>₦{(ride.driver_earnings || (ride.fare_amount * 0.8)).toFixed(0)}</Text>
            </View>
         </View>

         {/* Actions */}
         {ride.status !== 'completed' && (
            <TouchableOpacity 
               style={[styles.mainBtn, { backgroundColor: BRAND.primary }]} 
               onPress={() => handleUpdate(ride.status === 'accepted' ? 'in_progress' : 'completed')}
               disabled={updating}
            >
               {updating ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>{ride.status === 'accepted' ? 'Start Trip' : 'Complete Trip'}</Text>}
            </TouchableOpacity>
         )}

      </ScrollView>
      <RideMapFullscreenModal
        visible={showFullMap}
        title="Ride Map"
        routeCoordinates={routeCoordinates}
        focusCoordinates={routeFitCoordinates}
        pickup={routeCoordinates?.[0] || [3.3792, 6.5244]}
        dropoff={routeCoordinates?.[routeCoordinates.length - 1] || [3.4292, 6.5844]}
        speedText={routeLoading ? 'Loading route...' : `ETA ${routeDurationMin || 0} min | ${routeDistanceKm || 0} km`}
        onClose={() => setShowFullMap(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrapper: { height: verticalScale(250), position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  headerSafe: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: scale(12) },
  backCircle: { width: scale(44), height: scale(44), borderRadius: scale(22), justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 4 },
  statusPill: { paddingHorizontal: scale(12), paddingVertical: verticalScale(6), borderRadius: scale(16), justifyContent: 'center', elevation: 4 },
  statusText: { fontSize: scale(10), fontWeight: '800' },
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
  chatBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, elevation: 3 },
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
  mainBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
