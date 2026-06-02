
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '@/services/api';
import { cacheService } from '@/services/cache';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import { BRAND, COLORS } from '@/utils/colors';

const { width } = Dimensions.get('window');

export default function DriverEarningsScreen() {
  const { theme, mode } = useTheme();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const [earningsData, setEarningsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const [hasCached, setHasCached] = useState(false);

  const isLight = theme.mode === 'light';

  const toSafeNumber = (value: any) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 8 }).start();
  }, []);

  useEffect(() => {
    loadEarnings();
  }, [timeFilter]);

  const loadEarnings = async () => {
    const cacheKey = `driver_earnings_${timeFilter}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      setEarningsData(cached);
      setHasCached(true);
      setLoading(false);
    }

    await fetchEarningsData(!cached, cacheKey);
  };

  const fetchEarningsData = async (showLoader: boolean = true, cacheKey?: string) => {
    try {
      if (showLoader) setLoading(true);
      const timeframeMap: Record<string, string> = { 'today': 'day', 'week': 'week', 'month': 'month' };
      let nextData: any;

      if (timeFilter === 'today') {
        const daily = await apiService.getDriverDailySettlement();
        const rides = daily?.rides || [];
        const totalDistance = rides.reduce((sum: number, ride: any) => sum + Number(ride?.distance_km || 0), 0);

        nextData = {
          total: Number(daily?.settlement?.totalDriverEarnings || daily?.totals?.netDriverEarnings || 0),
          rides: Number(daily?.settlement?.totalRides || daily?.totals?.acceptedRides || rides.length || 0),
          avgRating: 0,
          distances: totalDistance,
          onlineTime: 0,
          grossAmount: Number(daily?.settlement?.totalFareAmount || daily?.totals?.grossAmount || 0),
          platformFee: Number(daily?.settlement?.totalPlatformFees || daily?.totals?.platformFee || 0),
          netDriverEarnings: Number(daily?.settlement?.totalDriverEarnings || daily?.totals?.netDriverEarnings || 0),
          ridesList: rides,
        };
      } else {
        const data = await apiService.getEarnings(timeframeMap[timeFilter]);
        const earnings = data?.earnings || {};
        nextData = {
          total: Number(earnings?.total_driver_earnings || 0),
          rides: Number(earnings?.total_rides_accepted || 0),
          avgRating: Number(earnings?.average_rating || 0),
          distances: Number(earnings?.total_distance || 0),
          onlineTime: 0,
          grossAmount: Number(earnings?.total_ride_earnings || 0),
          platformFee: Number(earnings?.total_platform_fee || 0),
          netDriverEarnings: Number(earnings?.total_driver_earnings || 0),
          ridesList: data?.rides || [],
        };
      }

      setEarningsData(nextData);
      if (cacheKey) {
        await cacheService.set(cacheKey, nextData);
      }
    } catch (error) {
      console.error('Earnings fetch error:', error);
      setEarningsData({
        total: 0,
        rides: 0,
        avgRating: 0,
        distances: 0,
        onlineTime: 0,
        grossAmount: 0,
        platformFee: 0,
        netDriverEarnings: 0,
        ridesList: [],
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const rawData = earningsData || {
    total: 0,
    rides: 0,
    avgRating: 0,
    distances: 0,
    onlineTime: 0,
    grossAmount: 0,
    platformFee: 0,
    netDriverEarnings: 0,
    ridesList: [],
  };

  const currentData = {
    total: toSafeNumber(rawData?.total),
    rides: toSafeNumber(rawData?.rides),
    avgRating: toSafeNumber(rawData?.avgRating),
    distances: toSafeNumber(rawData?.distances),
    onlineTime: toSafeNumber(rawData?.onlineTime),
    grossAmount: toSafeNumber(rawData?.grossAmount),
    platformFee: toSafeNumber(rawData?.platformFee),
    netDriverEarnings: toSafeNumber(rawData?.netDriverEarnings),
    ridesList: Array.isArray(rawData?.ridesList) ? rawData.ridesList : [],
  };

  const formatRideDate = (ride: any) => {
    const dateValue = ride?.created_at || ride?.accepted_at || ride?.ride_created_at || ride?.completed_at;
    if (!dateValue) return '—';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
           <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Earnings</Text>
        </View>

        {loading ? (
          <ListScreenSkeleton itemCount={4} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* Main Card */}
          <Animated.View style={[styles.mainCard, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={[BRAND.primary, '#E68200']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <Text style={styles.cardLabel}>Total Earnings</Text>
              <Text style={styles.balanceText}>₦{toSafeNumber(currentData.total).toLocaleString('en-US')}</Text>
              
              <View style={styles.statsRow}>
                 <View>
                    <Text style={styles.statLabel}>Trips</Text>
                    <Text style={styles.statValue}>{toSafeNumber(currentData.rides)}</Text>
                 </View>
                 <View>
                    <Text style={styles.statLabel}>Hrs Online</Text>
                    <Text style={styles.statValue}>{Math.floor(toSafeNumber(currentData.onlineTime) / 60)}h</Text>
                 </View>
                 <View>
                    <Text style={styles.statLabel}>Rating</Text>
                    <Text style={styles.statValue}>{toSafeNumber(currentData.avgRating).toFixed(1)}★</Text>
                 </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Filters */}
          <View style={styles.filterRow}>
            {['today', 'week', 'month'].map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setTimeFilter(filter as any)}
                style={[
                  styles.filterBtn,
                  timeFilter === filter ? { backgroundColor: BRAND.primary } : { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }
                ]}
              >
                <Text style={[styles.filterText, { color: timeFilter === filter ? '#000' : theme.colors.textSecondary }]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Detailed Stats */}
          <View style={styles.detailsContainer}>
             <DetailCard label="Avg. per Trip" value={`₦${currentData.rides > 0 ? Math.floor(toSafeNumber(currentData.total) / toSafeNumber(currentData.rides)).toLocaleString('en-US') : '0'}`} icon="cash-multiple" theme={theme} />
             <DetailCard label="Hourly Rate" value={`₦${toSafeNumber(currentData.onlineTime) > 0 ? Math.floor((toSafeNumber(currentData.total) / toSafeNumber(currentData.onlineTime)) * 60).toLocaleString('en-US') : '0'}`} icon="clock-time-four-outline" theme={theme} />
             <DetailCard label="Total Distance" value={`${toSafeNumber(currentData.distances)} km`} icon="map-marker-distance" theme={theme} />
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.colors.inputBackground }]}>
             <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.textSecondary} />
             <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
               Earnings are calculated after deducting the platform fee (15%).
             </Text>
          </View>

          {/* Rides Breakdown */}
          {(currentData?.ridesList?.length ?? 0) > 0 && (
            <View style={styles.ridesSection}>
              <View style={{ paddingHorizontal: 20 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Rides Breakdown</Text>
              </View>
              {currentData.ridesList.map((ride: any, index: number) => (
                <View key={ride?.id || `ride-${index}`} style={[styles.rideCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.rideCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ridePath, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {ride.pickup_zone} → {ride.destination_zone}
                      </Text>
                      <View style={styles.rideMetaRow}>
                        <Text style={[styles.rideMeta, { color: theme.colors.textSecondary }]}>
                          {ride.distance_km || 0} km
                        </Text>
                        <Text style={[styles.rideMeta, { color: theme.colors.textSecondary }]}>
                          {formatRideDate(ride)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.rideStatus}>
                      <Text style={[styles.rideFare, { color: BRAND.primary }]}>₦{toSafeNumber(ride?.fare_amount).toLocaleString('en-US')}</Text>
                      <View style={[styles.statusBadge, { 
                        backgroundColor: ride.status === 'completed' ? '#10B98120' : '#3B82F620' 
                      }]}>
                        <Text style={[styles.statusBadgeText, { 
                          color: ride.status === 'completed' ? '#10B981' : '#3B82F6' 
                        }]}>
                          {ride.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                  
                  <View style={styles.rideCardBottom}>
                    <View style={styles.breakdownItem}>
                      <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>Platform Fee (15%)</Text>
                      <Text style={[styles.breakdownValue, { color: theme.colors.error }]}>
                        -₦{Number(ride.platform_fee || 0).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>Your Earning</Text>
                      <Text style={[styles.breakdownValue, { color: '#10B981', fontWeight: '700' }]}>
                        ₦{toSafeNumber(ride?.driver_earnings).toLocaleString('en-US')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const DetailCard = ({ label, value, icon, theme }: any) => (
  <View style={[styles.detailCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
     <View style={[styles.detailIcon, { backgroundColor: theme.colors.inputBackground }]}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.colors.textPrimary} />
     </View>
     <View>
       <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
       <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>{value}</Text>
     </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  mainCard: { marginHorizontal: 20, marginBottom: 20 },
  cardGradient: { borderRadius: 20, padding: 24, elevation: 8, shadowColor: BRAND.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 8 } },
  cardLabel: { fontSize: 14, color: 'rgba(0,0,0,0.6)', fontWeight: '600' },
  balanceText: { fontSize: 40, fontWeight: '800', color: '#000', marginVertical: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  statLabel: { fontSize: 12, color: 'rgba(0,0,0,0.6)' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#000' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontWeight: '600', fontSize: 13 },
  detailsContainer: { paddingHorizontal: 20, gap: 12 },
  detailCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 16 },
  detailIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 18, fontWeight: '700' },
  infoBox: { margin: 20, padding: 16, borderRadius: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  ridesSection: { paddingBottom: 20 },
  rideCard: { marginHorizontal: 20, marginBottom: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  rideCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ridePath: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  rideMetaRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  rideMeta: { fontSize: 11 },
  rideStatus: { alignItems: 'flex-end' },
  rideFare: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  divider: { height: 1, marginVertical: 8 },
  rideCardBottom: { flexDirection: 'row', gap: 16 },
  breakdownItem: { flex: 1 },
  breakdownLabel: { fontSize: 11, marginBottom: 2 },
  breakdownValue: { fontSize: 12, fontWeight: '600' },
});
