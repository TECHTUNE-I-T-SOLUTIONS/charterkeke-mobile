
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  StatusBar,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAlert } from '@/context/AlertContext';
import { apiService } from '@/services/api';
import { cacheService } from '@/services/cache';
import { formatCurrency } from '@/utils/formatting';
import { BRAND, COLORS } from '@/utils/colors';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';

const { width } = Dimensions.get('window');
const DRIVER_RIDE_TABS = ['available', 'active', 'history'] as const;
type DriverRideTab = typeof DRIVER_RIDE_TABS[number];

interface RideItem {
  id: string;
  users?: { first_name?: string; rating?: number; };
  pickup_zone?: string;
  destination_zone?: string;
  driver_earnings?: number;
  fare_amount?: number;
  distance_km?: number;
  duration_minutes?: number;
  status?: string;
  created_at?: string;
}

export default function RidesListScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showError, showSuccess } = useAlert();
  const [rides, setRides] = useState<RideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<DriverRideTab>('available');
  const [hasCached, setHasCached] = useState(false);
  const [acceptingRideId, setAcceptingRideId] = useState<string | null>(null);

  const isLight = theme.mode === 'light';
  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 36 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) < 70) return;
          const currentIndex = DRIVER_RIDE_TABS.indexOf(activeTab);
          const nextIndex = gesture.dx < 0 ? currentIndex + 1 : currentIndex - 1;
          if (nextIndex >= 0 && nextIndex < DRIVER_RIDE_TABS.length) {
            setActiveTab(DRIVER_RIDE_TABS[nextIndex]);
          }
        },
      }),
    [activeTab]
  );

  useFocusEffect(
    React.useCallback(() => {
      loadRides();
    }, [activeTab])
  );

  const loadRides = async () => {
    const cacheKey = `driver_rides_${activeTab}`;
    const cached = await cacheService.get<RideItem[]>(cacheKey);
    if (cached) {
      setRides(cached);
      setHasCached(true);
      setLoading(false);
    }

    await fetchRides(!cached, cacheKey);
  };

  const fetchRides = async (showLoader: boolean = true, cacheKey?: string) => {
    try {
      if (showLoader) setLoading(true);
      let data;
      if (activeTab === 'active') {
        const response = (await apiService.getActiveRides()) as any;
        data = response?.rides || [];
      } else if (activeTab === 'available') {
        const response = (await apiService.get('/driver/available-rides?radiusKm=10').catch(() => ({ rides: [] }))) as any;
        data = response?.rides || [];
      } else {
        const response = (await apiService.getTransactions(1)) as any; // Assuming this returns history
        data = response?.rides || [];
      }
      const nextRides = Array.isArray(data) ? data : [];
      setRides(nextRides);
      if (cacheKey) {
        await cacheService.set(cacheKey, nextRides);
      }
    } catch (error) {
      setRides([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRides(!hasCached, `driver_rides_${activeTab}`);
    setRefreshing(false);
  };

  const handleAcceptRide = async (ride: RideItem) => {
    if (acceptingRideId) return;

    try {
      setAcceptingRideId(ride.id);
      await apiService.acceptRide(ride.id);
      showSuccess('Ride accepted', 'The ride has been assigned to you. You can now start the trip from your active rides.');
      setRides((current) => current.filter((item) => item.id !== ride.id));
      await fetchRides(false, `driver_rides_${activeTab}`);
    } catch (error: any) {
      showError('Could not accept ride', error?.message || 'This ride may already have been accepted by another driver.');
    } finally {
      setAcceptingRideId(null);
    }
  };

  const renderRideCard = ({ item }: { item: RideItem }) => {
    const fare = item.driver_earnings || item.fare_amount || 0;
    const isAvailable = activeTab === 'available';
    const isAccepting = acceptingRideId === item.id;

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/driver/ride-details', params: { rideId: item.id, rideData: JSON.stringify(item) } } as any)}
        style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.riderInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.inputBackground }]}>
               <Text style={{fontSize: 16}}>👤</Text>
            </View>
            <View>
               <Text style={[styles.riderName, { color: theme.colors.textPrimary }]}>{item.users?.first_name || 'Rider'}</Text>
               <View style={styles.ratingRow}>
                 <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
                 <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>{item.users?.rating?.toFixed(1) || '5.0'}</Text>
               </View>
            </View>
          </View>
          <View style={styles.fareContainer}>
             <Text style={[styles.fareText, { color: BRAND.primary }]}>{formatCurrency(fare)}</Text>
             {!isAvailable && (
               <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#10B98120' : '#3B82F620' }]}>
                  <Text style={[styles.statusText, { color: item.status === 'completed' ? '#10B981' : '#3B82F6' }]}>{item.status}</Text>
               </View>
             )}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.routeContainer}>
            <View style={styles.timeline}>
               <View style={[styles.dot, { backgroundColor: BRAND.primary }]} />
               <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
               <View style={[styles.square, { borderColor: theme.colors.textPrimary }]} />
            </View>
            <View style={styles.addresses}>
               <Text numberOfLines={1} style={[styles.addressText, { color: theme.colors.textPrimary }]}>{item.pickup_zone}</Text>
               <View style={{ height: 16 }} />
               <Text numberOfLines={1} style={[styles.addressText, { color: theme.colors.textPrimary }]}>{item.destination_zone}</Text>
            </View>
        </View>

        <View style={[styles.metaRow, { backgroundColor: theme.colors.inputBackground }]}>
           <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Distance</Text>
              <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>{item.distance_km?.toFixed(1) || '-'} km</Text>
           </View>
           <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Est. Time</Text>
              <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>{item.duration_minutes || '-'} min</Text>
           </View>
        </View>

        {isAvailable && (
          <View style={styles.actionRow}>
            <TouchableOpacity disabled={isAccepting} onPress={() => {}} style={[styles.actionBtn, { borderColor: theme.colors.border, opacity: isAccepting ? 0.55 : 1 }]}>
               <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isAccepting}
              onPress={() => handleAcceptRide(item)}
              style={[styles.actionBtn, { backgroundColor: BRAND.primary, borderColor: BRAND.primary, opacity: isAccepting ? 0.78 : 1 }]}
            >
               {isAccepting ? (
                 <View style={styles.acceptingRow}>
                   <ActivityIndicator size="small" color="#000" />
                   <Text style={[styles.actionText, { color: '#000', fontWeight: '700' }]}>Accepting...</Text>
                 </View>
               ) : (
                 <Text style={[styles.actionText, { color: '#000', fontWeight: '700' }]}>Accept Ride</Text>
               )}
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Rides</Text>
        </View>

        <View style={styles.tabsContainer}>
          {DRIVER_RIDE_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab,
                activeTab === tab ? { backgroundColor: BRAND.primary } : { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }
              ]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#000' : theme.colors.textSecondary }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.swipeArea} {...swipeResponder.panHandlers}>
          {loading ? (
            <View style={styles.center}><ListScreenSkeleton itemCount={4} /></View>
          ) : (
            <FlatList
              data={rides}
              renderItem={renderRideCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                   <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={theme.colors.textTertiary} />
                   <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No rides found</Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontWeight: '600', fontSize: 13 },
  swipeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  riderInfo: { flexDirection: 'row', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  riderName: { fontWeight: '700', fontSize: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12 },
  fareContainer: { alignItems: 'flex-end' },
  fareText: { fontSize: 16, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  divider: { height: 1, marginVertical: 12 },
  routeContainer: { flexDirection: 'row', marginBottom: 12 },
  timeline: { alignItems: 'center', marginRight: 12, paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { width: 1, flex: 1, marginVertical: 4 },
  square: { width: 8, height: 8, borderWidth: 1 },
  addresses: { flex: 1, justifyContent: 'space-between' },
  addressText: { fontSize: 14, fontWeight: '500' },
  metaRow: { flexDirection: 'row', borderRadius: 8, padding: 8, justifyContent: 'space-between' },
  metaItem: { alignItems: 'center', flex: 1 },
  metaLabel: { fontSize: 10 },
  metaValue: { fontSize: 13, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  acceptingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12 },
});
