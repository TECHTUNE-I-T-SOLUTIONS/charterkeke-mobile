
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
      const data = await apiService.get(`/driver/earnings?timeframe=${timeframeMap[timeFilter]}`);
      const nextData = data.earnings || {};
      setEarningsData(nextData);
      if (cacheKey) {
        await cacheService.set(cacheKey, nextData);
      }
    } catch (error) {
      setEarningsData({});
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const currentData = earningsData?.[timeFilter] || { total: 0, rides: 0, avgRating: 0, distances: 0, onlineTime: 0 };

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
              <Text style={styles.balanceText}>₦{currentData.total.toLocaleString()}</Text>
              
              <View style={styles.statsRow}>
                 <View>
                    <Text style={styles.statLabel}>Trips</Text>
                    <Text style={styles.statValue}>{currentData.rides}</Text>
                 </View>
                 <View>
                    <Text style={styles.statLabel}>Hrs Online</Text>
                    <Text style={styles.statValue}>{Math.floor((currentData.onlineTime || 0) / 60)}h</Text>
                 </View>
                 <View>
                    <Text style={styles.statLabel}>Rating</Text>
                    <Text style={styles.statValue}>{currentData.avgRating}★</Text>
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
             <DetailCard label="Avg. per Trip" value={`₦${currentData.rides > 0 ? Math.floor(currentData.total / currentData.rides).toLocaleString() : '0'}`} icon="cash-multiple" theme={theme} />
             <DetailCard label="Hourly Rate" value={`₦${(currentData.onlineTime || 0) > 0 ? Math.floor((currentData.total / currentData.onlineTime) * 60).toLocaleString() : '0'}`} icon="clock-time-four-outline" theme={theme} />
             <DetailCard label="Total Distance" value={`${currentData.distances} km`} icon="map-marker-distance" theme={theme} />
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.colors.inputBackground }]}>
             <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.textSecondary} />
             <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
               Earnings are calculated after deducting the platform fee (20%).
             </Text>
          </View>
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
});
