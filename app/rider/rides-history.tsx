
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAlert } from '@/context/AlertContext';
import { BRAND } from '@/utils/colors';
import { apiService } from '@/services/api';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import { useRideHistory } from '@/hooks/useLocationCache';


export default function RidesHistoryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const { showConfirm, showError, showSuccess } = useAlert();
  const [filterStatus, setFilterStatus] = useState('all');
  const [cancellingRideId, setCancellingRideId] = useState<string | null>(null);

  const { data: rides = [], isLoading: loading, isRefetching: refreshing, refetch } = useRideHistory();

  const isLight = theme.mode === 'light';

  useEffect(() => { if (user && !authLoading) refetch(); }, [user, authLoading, refetch]);

  const filteredRides = useMemo(() => {
    if (filterStatus === 'all') return rides;
    return rides.filter((ride) => ride.status === filterStatus);
  }, [rides, filterStatus]);

  const onRefresh = async () => { await refetch(); };

  const handleCancelRide = async (rideId: string) => {
    showConfirm(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      async () => {
        try {
          setCancellingRideId(rideId);
          await apiService.cancelRide(rideId, 'User initiated');
          await refetch();
          showSuccess('Cancelled', 'Ride has been cancelled successfully');
        } catch (e) {
          showError('Error', 'Failed to cancel ride. Please try again.');
        } finally {
          setCancellingRideId(null);
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      default: return BRAND.primary;
    }
  };

  if (authLoading || loading) return <SafeAreaView style={{flex:1, backgroundColor: theme.colors.background}}><ListScreenSkeleton itemCount={6}/></SafeAreaView>;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Your Rides</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>{filteredRides.length} total</Text>
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(status => (
              <TouchableOpacity
                key={status}
                onPress={() => setFilterStatus(status)}
                style={[
                  styles.tab,
                  filterStatus === status ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary } : { borderColor: theme.colors.border, backgroundColor: theme.colors.card }
                ]}
              >
                <Text style={[styles.tabText, { color: filterStatus === status ? '#000' : theme.colors.textSecondary }]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />} contentContainerStyle={styles.listContent}>
          {filteredRides.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="map-search-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No rides found in this category.</Text>
            </View>
          ) : (
            filteredRides.map(ride => (
              <TouchableOpacity
                key={ride.id}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/rider/ride-details', params: { rideData: JSON.stringify(ride) } } as any)}
                style={[styles.rideCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(ride.status) }]}>{ride.status.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.fareText, { color: theme.colors.textPrimary }]}>₦{ride.fare_amount ? ride.fare_amount.toLocaleString() : '0'}</Text>
                </View>

                <View style={styles.routeContainer}>
                  <View style={styles.timeline}>
                    <View style={[styles.dot, { backgroundColor: BRAND.primary }]} />
                    <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
                    <View style={[styles.square, { borderColor: theme.colors.textPrimary }]} />
                  </View>
                  <View style={styles.addresses}>
                    <Text numberOfLines={1} style={[styles.addressText, { color: theme.colors.textPrimary }]}>{ride.pickup_zone}</Text>
                    <View style={{ height: 12 }} />
                    <Text numberOfLines={1} style={[styles.addressText, { color: theme.colors.textPrimary }]}>{ride.destination_zone}</Text>
                  </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
                  <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                    {new Date(ride.created_at).toLocaleDateString()} • {new Date(ride.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                  </Text>
                  {ride.status === 'pending' && (
                    <TouchableOpacity onPress={() => handleCancelRide(ride.id)} disabled={cancellingRideId === ride.id}>
                      <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 12 }}>
                        {cancellingRideId === ride.id ? 'Cancelling...' : 'Cancel'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSubtitle: { fontSize: 14 },
  tabsContainer: { paddingBottom: 12 },
  tabsContent: { paddingHorizontal: 20, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  tabText: { fontSize: 12, fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 16 },
  rideCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  fareText: { fontSize: 16, fontWeight: '700' },
  routeContainer: { flexDirection: 'row', marginBottom: 16 },
  timeline: { alignItems: 'center', marginRight: 12, paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { width: 1, flex: 1, marginVertical: 4 },
  square: { width: 8, height: 8, borderWidth: 1 },
  addresses: { flex: 1 },
  addressText: { fontSize: 14, fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1 },
  dateText: { fontSize: 12 },
});
