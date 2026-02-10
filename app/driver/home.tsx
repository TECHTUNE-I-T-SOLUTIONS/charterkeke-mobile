// 'use client';

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@context/AuthContext';
import { useLocation } from '@context/LocationContext';
import { useTheme } from '@context/ThemeContext';
import { apiService } from '@services/api';
import RiderBottomNavigation from '@components/RiderBottomNavigation';
import { formatCurrency } from '@utils/formatting';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

interface DriverData {
  total_earnings?: number;
  total_rides_completed?: number;
  average_rating?: number;
  is_online?: boolean;
}

export default function DriverHomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { currentLocation } = useLocation();
  const { theme, mode, toggleTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [activeRidesCount, setActiveRidesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [dataFetched, setDataFetched] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!isAuthenticated) {
        console.log('🔓 [DRIVER-HOME] Not authenticated, redirecting to login');
        setLoading(false);
        setDataFetched(false);
        router.replace('/auth/welcome');
        return;
      }

      if (!dataFetched) {
        fetchDashboardData();
        setDataFetched(true);
      }

      return () => {};
    }, [isAuthenticated, dataFetched, router])
  );

  const fetchDashboardData = async () => {
    try {
      if (!isAuthenticated) {
        console.log('🔓 [DRIVER-HOME] Not authenticated, skipping data fetch');
        return;
      }

      setLoading(true);
      let hasAuthError = false;

      try {
        const detailsData = await apiService.getDriverDetails();
        console.log('✅ [DRIVER-HOME] Driver details:', detailsData);
        setDriverData(detailsData.driver || detailsData);
        setTodayEarnings(detailsData.driver?.total_earnings || 0);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        if (errorMsg.includes('No refresh token') || errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          hasAuthError = true;
        }
        console.error('⚠️ [DRIVER-HOME] Error fetching driver details:', err);
      }

      try {
        const statusData = await apiService.getDriverStatus();
        console.log('✅ [DRIVER-HOME] Driver status:', statusData);
        setIsOnline(statusData.status === 'online' || statusData.is_online === true);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        if (errorMsg.includes('No refresh token') || errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          hasAuthError = true;
        }
        console.error('⚠️ [DRIVER-HOME] Error fetching driver status:', err);
      }

      try {
        const ridesData = await apiService.getActiveRides();
        console.log('✅ [DRIVER-HOME] Active rides:', ridesData.rides?.length || 0);
        setActiveRidesCount(ridesData.rides?.length || 0);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        if (errorMsg.includes('No refresh token') || errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          hasAuthError = true;
        }
        console.error('⚠️ [DRIVER-HOME] Error fetching active rides:', err);
      }

      try {
        const availableData = await apiService.getAvailableRides(
          currentLocation?.latitude,
          currentLocation?.longitude,
          10
        );
        console.log('✅ [DRIVER-HOME] Available rides:', availableData.rides?.length || 0);
        setAvailableRides(availableData.rides?.slice(0, 3) || []);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        if (errorMsg.includes('No refresh token') || errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          hasAuthError = true;
        }
        console.error('⚠️ [DRIVER-HOME] Error fetching available rides:', err);
      }

      if (hasAuthError) {
        console.error('🔒 [DRIVER-HOME] Auth error detected! Token expired or invalid. Logging out...');
        await logout();
        router.replace('/auth/welcome');
        return;
      }
    } catch (error) {
      console.error('❌ [DRIVER-HOME] Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleOnlineToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      const newStatus = checked ? 'online' : 'offline';
      await apiService.setDriverStatus(newStatus);
      setIsOnline(checked);
      console.log('✅ [DRIVER-HOME] Status updated to:', newStatus);

      const message = checked
        ? 'You are now online! Start receiving ride requests.'
        : 'You are now offline.';
      Alert.alert('Status Updated', message);
    } catch (error) {
      console.error('❌ [DRIVER-HOME] Error updating status:', error);
      setIsOnline(!checked);
      const errorMsg = error instanceof Error ? error.message : 'Failed to update status';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsToggling(false);
    }
  };

  const gradientColors = useMemo(() => {
    return mode === 'light'
      ? ['#FFFFFF', '#F8F9FA']
      : ['#1A1A1A', '#0F0F0F'];
  }, [mode]) as [string, string];

  const headerGradient = useMemo(() => {
    return mode === 'light'
      ? ['#F3F4F6', '#E5E7EB']
      : ['#2D2D2D', '#1F1F1F'];
  }, [mode]) as [string, string];

  if (loading && !driverData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme?.colors?.background || '#FFFFFF', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme?.colors?.primary || '#000000'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.colors?.background || '#FFFFFF' }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme?.colors?.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Greeting */}
        <LinearGradient
          colors={headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.greetingContainer}>
              <Text style={[styles.greeting, { color: theme?.colors?.textPrimary || '#000000' }]}>
                Welcome back, {user?.firstName || 'Driver'}!
              </Text>
              <Text style={[styles.subGreeting, { color: theme?.colors?.textSecondary || '#666666' }]}>
                Ready to drive?
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={toggleTheme}
                style={[
                  styles.headerButton,
                  { backgroundColor: mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.3)' },
                ]}
              >
                <MaterialCommunityIcons
                  name={mode === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'}
                  size={scale(18)}
                  color={theme?.colors?.primary || '#000000'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/driver/notifications')}
                style={[
                  styles.headerButton,
                  { backgroundColor: mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.3)' },
                ]}
              >
                <MaterialCommunityIcons
                  name="bell"
                  size={scale(18)}
                  color={theme?.colors?.primary || '#000000'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.profileButton, { backgroundColor: theme?.colors?.primary || '#00CCFF' }]}
                onPress={() => router.push('/driver/profile')}
              >
                <Image
                  source={{
                    uri: (user as any)?.avatar || 'https://via.placeholder.com/40',
                  }}
                  style={styles.profileImage}
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Online Status Card */}
        <View style={[styles.statusCard, { marginHorizontal: scale(16), marginTop: scale(16) }]}>
          <LinearGradient
            colors={isOnline
              ? ['rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.04)']
              : [mode === 'light' ? 'rgba(107, 114, 128, 0.05)' : 'rgba(107, 114, 128, 0.1)', 'transparent']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusGradient}
          >
            <View style={styles.statusContent}>
              <View>
                <Text style={[styles.statusLabel, { color: theme?.colors?.textSecondary || '#666666' }]}>
                  Your Status
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: scale(6) }}>
                  <View
                    style={{
                      width: scale(8),
                      height: scale(8),
                      borderRadius: scale(4),
                      backgroundColor: isOnline ? '#10b981' : '#6b7280',
                      marginRight: scale(6),
                    }}
                  />
                  <Text style={[styles.statusValue, { color: theme?.colors?.textPrimary || '#000000' }]}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isOnline}
                onValueChange={handleOnlineToggle}
                disabled={isToggling}
                trackColor={{ false: theme?.colors?.border || '#cccccc', true: '#10b981' }}
                thumbColor={isOnline ? '#22c55e' : '#ef4444'}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Statistics Cards */}
        <View style={[styles.statsContainer, { marginHorizontal: scale(16), marginTop: scale(20) }]}>
          <View style={styles.statRow}>
            <StatCard
              icon="wallet"
              label="Today's Earnings"
              value={formatCurrency(todayEarnings)}
              colors={theme?.colors}
              theme={mode}
            />
            <StatCard
              icon="car"
              label="Active Rides"
              value={activeRidesCount.toString()}
              colors={theme?.colors}
              theme={mode}
            />
          </View>
          <View style={styles.statRow}>
            <StatCard
              icon="star"
              label="Rating"
              value={(driverData?.average_rating || 5.0).toFixed(1) + '⭐'}
              colors={theme?.colors}
              theme={mode}
            />
            <StatCard
              icon="check-circle"
              label="Completed Trips"
              value={(driverData?.total_rides_completed || 0).toString()}
              colors={theme?.colors}
              theme={mode}
            />
          </View>
        </View>

        {/* Current Location Map */}
        {currentLocation && currentLocation.latitude && currentLocation.longitude ? (
          <View style={[styles.mapContainer, { marginHorizontal: scale(16), marginTop: scale(20), borderRadius: scale(12), overflow: 'hidden', borderWidth: 1, borderColor: theme?.colors?.border || '#CCCCCC' }]}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              zoomEnabled={true}
              scrollEnabled={true}
            >
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title="Your Location"
                description="You are here"
              />
            </MapView>
            <View
              style={[
                styles.locationLabel,
                { backgroundColor: theme?.colors?.surfaceLight || '#F5F5F5', borderColor: theme?.colors?.border || '#CCCCCC' },
              ]}
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={scale(14)}
                color={theme?.colors?.primary || '#000000'}
              />
              <Text
                style={[styles.locationText, { color: theme?.colors?.textPrimary || '#000000', fontSize: scale(11) }]}
              >
                {currentLocation.latitude?.toFixed(3)}, {currentLocation.longitude?.toFixed(3)}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Available Rides Section */}
        <View style={[styles.sectionContainer, { marginTop: scale(20) }]}>
          <View style={[styles.sectionHeader, { marginHorizontal: scale(16) }]}>
            <Text style={[styles.sectionTitle, { color: theme?.colors?.textPrimary || '#000000', fontSize: scale(16) }]}>
              Available Rides
            </Text>
            <TouchableOpacity onPress={() => router.push('/driver/rides')}>
              <Text style={[styles.viewAll, { color: theme?.colors?.primary || '#000000', fontSize: scale(12) }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {isOnline && availableRides.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: scale(12), paddingHorizontal: scale(16), paddingBottom: scale(8), paddingTop: scale(12) }}
            >
              {availableRides.map((ride) => (
                <TouchableOpacity
                  key={ride.id}
                  style={[
                    styles.availableRideCard,
                    {
                      backgroundColor: theme?.colors?.surfaceLight || '#F5F5F5',
                      borderColor: theme?.colors?.border || '#CCCCCC',
                      width: scale(280),
                    },
                  ]}
                  onPress={() => router.push('/driver/rides')}
                >
                  <View style={styles.rideCardContent}>
                    <Text style={[styles.rideCardPassenger, { color: theme?.colors?.textPrimary || '#000000', fontSize: scale(14) }]}>
                      {ride.users?.first_name}
                    </Text>
                    <View style={{ marginTop: scale(10), gap: scale(6) }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={scale(13)}
                          color="#10b981"
                        />
                        <Text style={[styles.rideCardLocation, { color: theme?.colors?.textSecondary || '#666666', fontSize: scale(12) }]} numberOfLines={1}>
                          {ride.pickup_zone}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={scale(13)}
                          color="#ef4444"
                        />
                        <Text style={[styles.rideCardLocation, { color: theme?.colors?.textSecondary || '#666666', fontSize: scale(12) }]} numberOfLines={1}>
                          {ride.destination_zone}
                        </Text>
                      </View>
                    </View>
                    <View style={{ marginTop: scale(10), paddingTop: scale(10), borderTopWidth: 1, borderTopColor: theme?.colors?.border || '#CCCCCC', flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[styles.rideCardMeta, { color: theme?.colors?.textSecondary || '#999999', fontSize: scale(11) }]}>
                        {ride.distance_km?.toFixed(1) || '0'} km
                      </Text>
                      <Text style={[styles.rideCardEarnings, { color: '#10b981', fontSize: scale(12), fontWeight: '600' }]}>
                        ₦{(ride.driver_earnings || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : isOnline ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: theme?.colors?.surfaceLight || '#F5F5F5', borderColor: theme?.colors?.border || '#CCCCCC', marginHorizontal: scale(16), marginTop: scale(12) },
              ]}
            >
              <MaterialCommunityIcons
                name="car-off"
                size={scale(40)}
                color={theme?.colors?.textSecondary || '#333333'}
              />
              <Text
                style={[styles.emptyStateText, { color: theme?.colors?.textPrimary || '#000000', fontSize: scale(14) }]}
              >
                No rides available
              </Text>
              <Text
                style={[styles.emptyStateSubtext, { color: theme?.colors?.textSecondary || '#333333', fontSize: scale(12) }]}
              >
                Ride requests will appear here
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: theme?.colors?.surfaceLight || '#F5F5F5', borderColor: theme?.colors?.border || '#CCCCCC', marginHorizontal: scale(16), marginTop: scale(12) },
              ]}
            >
              <MaterialCommunityIcons
                name="power-off"
                size={scale(40)}
                color={theme?.colors?.textSecondary || '#333333'}
              />
              <Text
                style={[styles.emptyStateText, { color: theme?.colors?.textPrimary || '#000000', fontSize: scale(14) }]}
              >
                You're offline
              </Text>
              <Text
                style={[styles.emptyStateSubtext, { color: theme?.colors?.textSecondary || '#333333', fontSize: scale(12) }]}
              >
                Turn on to receive ride requests
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: scale(20) }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <RiderBottomNavigation />
    </SafeAreaView>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  colors: any;
  theme: string;
}

function StatCard({ icon, label, value, colors, theme }: StatCardProps) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors?.surfaceLight || '#F5F5F5',
          borderColor: colors?.border || '#CCCCCC',
        },
      ]}
    >
      <LinearGradient
        colors={theme === 'light'
          ? ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']
          : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: scale(36),
          height: scale(36),
          borderRadius: scale(8),
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={scale(18)}
          color={colors?.primary || '#000000'}
        />
      </LinearGradient>
      <Text style={[styles.statValue, { color: colors?.textPrimary || '#000000', fontSize: scale(14), marginTop: scale(8) }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors?.textSecondary || '#333333', fontSize: scale(11) }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
    marginRight: scale(12),
  },
  greeting: {
    fontSize: scale(18),
    fontWeight: '700',
  },
  subGreeting: {
    fontSize: scale(12),
    marginTop: scale(2),
  },
  headerButtons: {
    flexDirection: 'row',
    gap: scale(8),
    alignItems: 'center',
  },
  headerButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  statusGradient: {
    padding: scale(14),
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: scale(11),
    fontWeight: '500',
  },
  statusValue: {
    fontSize: scale(14),
    fontWeight: '600',
  },
  statsContainer: {
    gap: scale(12),
  },
  statRow: {
    flexDirection: 'row',
    gap: scale(12),
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: scale(12),
    padding: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    marginBottom: scale(8),
  },
  statValue: {
    fontWeight: '700',
    textAlign: 'center',
  },
  statLabel: {
    marginTop: scale(2),
    textAlign: 'center',
    fontWeight: '500',
  },
  mapContainer: {
    height: scale(220),
  },
  map: {
    flex: 1,
  },
  locationLabel: {
    position: 'absolute',
    bottom: scale(8),
    left: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(6),
    borderWidth: 1,
    gap: scale(6),
  },
  locationText: {
    fontWeight: '500',
  },
  sectionContainer: {
    paddingBottom: scale(8),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
  },
  viewAll: {
    fontWeight: '600',
  },
  availableRideCard: {
    borderWidth: 1,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  rideCardContent: {
    padding: scale(12),
  },
  rideCardPassenger: {
    fontWeight: '600',
  },
  rideCardLocation: {
    fontWeight: '500',
  },
  rideCardMeta: {
    fontWeight: '500',
  },
  rideCardEarnings: {
    fontWeight: '600',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: scale(12),
    paddingVertical: scale(28),
    paddingHorizontal: scale(16),
    alignItems: 'center',
    gap: scale(8),
  },
  emptyStateText: {
    fontWeight: '600',
    marginTop: scale(8),
  },
  emptyStateSubtext: {
    fontWeight: '400',
  },
});
