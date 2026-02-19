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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import { BRAND, COLORS } from '@/utils/colors';

const { width } = Dimensions.get('window');

export default function RideDetailsScreen() {
  const router = useRouter();
  const { rideId, rideData } = useLocalSearchParams();
  const { theme, mode } = useTheme();
  const [ride, setRide] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const isLight = mode === 'light';

  useEffect(() => {
    if (rideData) {
      try {
        const parsedRide = typeof rideData === 'string' ? JSON.parse(rideData) : rideData;
        setRide(parsedRide);
      } catch (error) { setRide(null); }
    }
  }, [rideData]);

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      
      {/* Header Overlay on Map */}
      <View style={styles.mapWrapper}>
         <MapboxMap
           style={styles.map}
           latitude={6.5244}
           longitude={3.3792}
           zoom={12}
         >
            <MapboxMarker id="pickup" coordinate={[3.3792, 6.5244]} title="Pickup" color={BRAND.primary} />
            <MapboxMarker id="dropoff" coordinate={[3.4292, 6.5844]} title="Dropoff" color="black" />
         </MapboxMap>
         <SafeAreaView style={styles.headerSafe}>
            <View style={styles.headerRow}>
               <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
               </TouchableOpacity>
               <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{ride.status?.toUpperCase() || 'DETAILS'}</Text>
               </View>
            </View>
         </SafeAreaView>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
         
         {/* Rider Info */}
         <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>PASSENGER</Text>
            <View style={styles.riderRow}>
               <View style={styles.avatarPlaceholder}><Text style={{fontSize:20}}>👤</Text></View>
               <View style={{flex:1}}>
                  <Text style={[styles.riderName, { color: theme.colors.textPrimary }]}>{ride.users?.first_name || 'Passenger Name'}</Text>
                  <Text style={[styles.riderSub, { color: theme.colors.textSecondary }]}>Rating: {ride.users?.rating || '5.0'} ★</Text>
               </View>
               <TouchableOpacity onPress={() => Linking.openURL(`tel:${ride.users?.phone_number}`)} style={[styles.callBtn, { backgroundColor: theme.colors.inputBackground }]}>
                  <MaterialCommunityIcons name="phone" size={20} color={BRAND.primary} />
               </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrapper: { height: 250, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  headerSafe: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  statusPill: { backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, justifyContent: 'center', elevation: 4 },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
   contentContainer: { flex: 1, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingTop: 30, paddingBottom: 120, overflow: 'hidden', backgroundColor: 'transparent' }, 
  // Simple Hack: Content background is handled by container color, this is to overlap map. Actually simpler to set background on ScrollView but it covers map corners. 
  // Let's rely on View structure.
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  sectionHeader: { fontSize: 10, fontWeight: '700', marginBottom: 12, letterSpacing: 0.5 },
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  riderName: { fontSize: 16, fontWeight: '700' },
  riderSub: { fontSize: 12 },
  callBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  routeRow: { flexDirection: 'row' },
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
