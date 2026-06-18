
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  Modal,
  Dimensions,
  StatusBar,
  Animated,
  BackHandler,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import CtaCarousel, { CtaCard } from '@/components/CtaCarousel';
import HomePromoCarousel, { HomePromoSlide } from '@/components/HomePromoCarousel';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotificationBadge } from '@/context/NotificationContext';
import { apiService } from '@/services/api';
import { cacheService } from '@/services/cache';
import { setNotificationCallbacks } from '@/services/notificationService';
import { setNavigationRef } from '@/services/navigationService';
import { HomeSkeleton } from '@/components/HomeSkeleton';
import SupportFloatingWidget from '@/components/SupportFloatingWidget';
import { TourStep, TourTarget, useGuidedTour } from '@/components/GuidedTour';
import { getTourStorageKey } from '@/utils/appTour';
import { formatCurrency } from '@/utils/formatting';
import { BRAND, COLORS } from '@/utils/colors';
import { useAutoUpdateCheck } from '@/hooks/useAutoUpdateCheck';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const DRIVER_HOME_TOUR_STEPS: TourStep[] = [
  {
    id: 'driver-notifications',
    title: 'Ride alerts arrive here',
    body: 'New ride requests, rider updates, settlements, support messages, and account notices show here.',
  },
  {
    id: 'driver-online-toggle',
    title: 'Go online to earn',
    body: 'Switch online when you are ready to receive nearby ride requests. Settlement locks are shown here too.',
  },
  {
    id: 'driver-earnings',
    title: 'Track earnings',
    body: "Open earnings to see today's income, ride totals, and settlement information.",
  },
  {
    id: 'driver-support',
    title: 'Support is one tap away',
    body: 'Use the floating support button to reach Charter Keke support without hunting through settings.',
  },
];

interface DriverData {
  total_earnings?: number;
  total_rides_completed?: number;
  average_rating?: number;
  is_online?: boolean;
}

function formatRemittanceCountdown(ms: number) {
  const safe = Math.max(Number(ms || 0), 0);
  const hours = Math.floor(safe / 3600000);
  const minutes = Math.floor((safe % 3600000) / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);

  if (hours <= 0 && minutes <= 0 && seconds <= 0) return 'due now';
  if (hours <= 0) return `${minutes}m ${seconds}s`;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function getRemittanceGrandTotal(payload: any, fallback = 0) {
  if (typeof payload?.remittanceSummary?.grandTotal !== 'undefined') {
    return Number(payload.remittanceSummary.grandTotal || 0);
  }
  if (typeof payload?.totalDueNow !== 'undefined') {
    return Number(payload.totalDueNow || 0);
  }

  const computed =
    Number(payload?.totalOutstanding ?? payload?.totalOverdue ?? payload?.remittanceSummary?.overdueTotal ?? 0) +
    Number(payload?.todayRemittance?.totalDue ?? payload?.totalTodayDue ?? payload?.remittanceSummary?.todayTotal ?? 0);

  if (computed > 0) return computed;

  return Number(
    fallback ??
    0
  );
}

function getRemittanceOverdueTotal(payload: any, fallback = 0) {
  return Number(
    payload?.remittanceSummary?.overdueTotal ??
    payload?.totalOverdue ??
    payload?.totalOutstanding ??
    fallback ??
    0
  );
}

export default function DriverHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuth();
  const { currentLocation, hasLocationPermission, requestLocationPermission } = useLocation();
  const { theme, mode, toggleTheme } = useTheme();
  const { unreadCount, resetUnreadCount, incrementUnreadCount } = useNotificationBadge();
  
  // Auto-check for updates on app startup
  useAutoUpdateCheck(true);
  
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [activeRidesCount, setActiveRidesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [hasCached, setHasCached] = useState(false);
  const [settlementBlocked, setSettlementBlocked] = useState(false);
  const [settlementOutstanding, setSettlementOutstanding] = useState(0);
  const [todayRemittanceDue, setTodayRemittanceDue] = useState(0);
  const [remittanceDueAt, setRemittanceDueAt] = useState<string | null>(null);
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const [remittanceModalVisible, setRemittanceModalVisible] = useState(false);
  const [remittanceModalAmount, setRemittanceModalAmount] = useState(0);
  const [driverStats, setDriverStats] = useState({ completedTrips: 0, averageRating: 0 });
  const [locationPermissionVisible, setLocationPermissionVisible] = useState(false);
  const [checkingLocationPermission, setCheckingLocationPermission] = useState(false);
  const { startTour } = useGuidedTour();
  const hasCheckedDriverTourRef = useRef(false);

  const startDriverHomeTour = useCallback(() => {
    startTour(DRIVER_HOME_TOUR_STEPS, () => {
      AsyncStorage.setItem(getTourStorageKey('driver'), 'true').catch(() => {});
    });
  }, [startTour]);
  
  // Refs to prevent state updates on unmounted component
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  
  // Animations
  const onlineAnim = useRef(new Animated.Value(0)).current;

  // Set up navigation ref and notification callbacks
  useEffect(() => {
    setNavigationRef(router);
    setNotificationCallbacks(incrementUnreadCount);
  }, [router, incrementUnreadCount]);

  useEffect(() => {
    const maybeShowTour = async () => {
      if (hasCheckedDriverTourRef.current) return;
      hasCheckedDriverTourRef.current = true;
      const seen = await AsyncStorage.getItem(getTourStorageKey('driver'));
      if (!seen) {
        startDriverHomeTour();
      }
    };
    if (!loading) maybeShowTour().catch(() => {});
  }, [loading, startDriverHomeTour]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!isAuthenticated) {
        console.log('❌ [DRIVER-HOME] Not authenticated, redirecting to login');
        return router.replace('/auth/welcome');
      }
      // Ensure auth is fully initialized before loading dashboard
      if (!user?.id) {
        console.warn('⚠️  [DRIVER-HOME] User ID not available, skipping dashboard load');
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }
      console.log('🔄 [DRIVER-HOME] Loading dashboard for user:', user.id);
      if (!isLoadingRef.current) {
        cacheService.remove('driver_home_dashboard').finally(() => loadDashboard());
      }
    }, [isAuthenticated, user?.id])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== 'android' || !isAuthenticated) return;

      const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp();
        return true;
      });

      return () => backSubscription.remove();
    }, [isAuthenticated])
  );

  useEffect(() => {
    Animated.timing(onlineAnim, {
      toValue: isOnline ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOnline]);

  useEffect(() => {
    const timer = setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const ensureLocationEnabled = async () => {
      if (!isAuthenticated) return;
      try {
        setCheckingLocationPermission(true);
        const granted = await hasLocationPermission();
        if (!granted) {
          setLocationPermissionVisible(true);
          const requested = await requestLocationPermission();
          if (!requested) return;
        }
        if (!currentLocation) {
          await requestLocationPermission();
        }
      } catch (error) {
        console.warn('[DRIVER-HOME] Location permission check failed:', error);
        setLocationPermissionVisible(true);
      } finally {
        setCheckingLocationPermission(false);
      }
    };

    ensureLocationEnabled().catch(() => undefined);
  }, [isAuthenticated, currentLocation, hasLocationPermission, requestLocationPermission]);

  const loadDashboard = async () => {
    if (!isMountedRef.current || isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      const cached = await cacheService.get<any>('driver_home_dashboard');
      
      if (!isMountedRef.current) return;
      
      if (cached) {
        console.log('📦 [DRIVER-HOME] Using cached dashboard data');
        setDriverData(cached.driverData || null);
        setTodayEarnings(cached.todayEarnings || 0);
        setIsOnline(!!cached.isOnline);
        setActiveRidesCount(cached.activeRidesCount || 0);
        setActiveRides(cached.activeRides || []);
        setAvailableRides(cached.availableRides || []);
        setRecentRides(cached.recentRides || []);
        setSettlementBlocked(!!cached.settlementBlocked);
        setSettlementOutstanding(cached.settlementOutstanding || 0);
        setTodayRemittanceDue(cached.todayRemittanceDue || 0);
        setRemittanceDueAt(cached.remittanceDueAt || null);
        setDriverStats(cached.driverStats || { completedTrips: 0, averageRating: 0 });
        setHasCached(true);
        setLoading(false);
      }

      if (isMountedRef.current) {
        await fetchDashboardData(!cached);
      }
    } catch (error) {
      console.error('❌ [DRIVER-HOME] loadDashboard error:', error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    } finally {
      isLoadingRef.current = false;
    }
  };

  const fetchDashboardData = async (showLoader: boolean = true) => {
    if (!isMountedRef.current) return;
    
    try {
      if (showLoader) setLoading(true);
      
      console.log('📊 [DRIVER-HOME] Fetching dashboard data...');
      const [details, status, rides, available, history, settlement, dailyEarnings, earningsStats] = await Promise.all([
        apiService.getDriverDetails().catch((err) => {
          console.warn('⚠️  [DRIVER-HOME] getDriverDetails failed:', err?.message || err);
          return {};
        }),
        apiService.getDriverStatus().catch((err) => {
          console.warn('⚠️  [DRIVER-HOME] getDriverStatus failed:', err?.message || err);
          return { status: 'offline' };
        }),
        apiService.getActiveRides().catch((err) => {
          console.warn('⚠️  [DRIVER-HOME] getActiveRides failed:', err?.message || err);
          return { rides: [] };
        }),
        apiService.getAvailableRides(currentLocation?.latitude, currentLocation?.longitude, 10).catch((err) => {
          console.warn('⚠️  [DRIVER-HOME] getAvailableRides failed:', err?.message || err);
          return { rides: [] };
        }),
        apiService.get('/user/ride-history?limit=5').catch((err) => {
          console.warn('⚠️  [DRIVER-HOME] getRideHistory failed:', err?.message || err);
          return { rides: [] };
        }),
        apiService.getDriverSettlementStatus().catch((err) => {
          console.warn('⚠️  [DRIVER-HOME] getDriverSettlementStatus failed:', err?.message || err);
          return { blocked: false, totalOutstanding: 0 };
        }),
        apiService.getDriverDailySettlement().catch((err) => {
          console.warn('⚠️  [DRIVER-HOME] getDriverDailySettlement failed:', err?.message || err);
          return { total_ride_earnings: 0 };
        }),
        apiService.getDriverEarningsStats().catch((err) => {
          console.warn('⚠️  [DRIVER-HOME] getDriverEarningsStats failed:', err?.message || err);
          return { stats: { totalRides: 0, averageRating: 0 } };
        }),
      ]);

      if (!isMountedRef.current) return;

      const nextDriverData = details.driver || details;
      const nextIsOnline = status.status === 'online' || status.is_online === true;
      const nextActiveRides = rides.rides || [];
      const nextActiveRidesCount = nextActiveRides.length;
      const nextAvailableRides = available.rides?.slice(0, 3) || [];
      const nextRecentRides = ((history as any)?.rides || (history as any)?.data || []).slice(0, 5);
      const nextTodayEarnings = Number(dailyEarnings?.settlement?.totalDriverEarnings || dailyEarnings?.totals?.netDriverEarnings || 0);
      const nextOverdueTotal = getRemittanceOverdueTotal(settlement);
      const nextTodayRemittanceDue = Number(
        settlement?.todayRemittance?.totalDue ||
        settlement?.totalTodayDue ||
        settlement?.remittanceSummary?.todayTotal ||
        dailyEarnings?.totals?.unremittedPlatformFee ||
        dailyEarnings?.settlement?.outstandingPlatformFees ||
        0
      );
      const nextGrandTotal = getRemittanceGrandTotal(settlement, nextOverdueTotal + nextTodayRemittanceDue);
      const nextRemittanceDueAt = (
        settlement?.todayRemittance?.dueAt ||
        dailyEarnings?.due?.dueAt ||
        null
      );
      const nextStats = {
        completedTrips: Number(earningsStats?.stats?.totalRides || nextDriverData?.total_rides_completed || 0),
        averageRating: Number(earningsStats?.stats?.averageRating || nextDriverData?.average_rating || 0),
      };

      console.log('✅ [DRIVER-HOME] Dashboard data loaded:', {
        hasDriverData: !!nextDriverData,
        isOnline: nextIsOnline,
        activeRides: nextActiveRidesCount,
        todayEarnings: nextTodayEarnings,
      });

      setDriverData(nextDriverData);
      setTodayEarnings(nextTodayEarnings);
      setIsOnline(nextIsOnline);
      setActiveRidesCount(nextActiveRidesCount);
      setActiveRides(nextActiveRides);
      setAvailableRides(nextAvailableRides);
      setRecentRides(nextRecentRides);
      setSettlementBlocked(!!settlement?.blocked);
      setSettlementOutstanding(nextGrandTotal);
      setTodayRemittanceDue(nextTodayRemittanceDue);
      setRemittanceDueAt(nextRemittanceDueAt);
      setDriverStats(nextStats);

      await cacheService.set('driver_home_dashboard', {
        driverData: nextDriverData,
        todayEarnings: nextTodayEarnings,
        isOnline: nextIsOnline,
        activeRidesCount: nextActiveRidesCount,
        activeRides: nextActiveRides,
        availableRides: nextAvailableRides,
        recentRides: nextRecentRides,
        settlementBlocked: !!settlement?.blocked,
        settlementOutstanding: nextGrandTotal,
        todayRemittanceDue: nextTodayRemittanceDue,
        remittanceDueAt: nextRemittanceDueAt,
        driverStats: nextStats,
      });
    } catch (error) {
      console.error('❌ [DRIVER-HOME] Dashboard fetch error:', error);
      // Don't crash the app - show cached data or empty state
    } finally {
      if (isMountedRef.current && showLoader) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cacheService.remove('driver_home_dashboard');
    await fetchDashboardData(!hasCached);
    setRefreshing(false);
  };

  const handleOnlineToggle = async (value: boolean) => {
    try {
      if (value && settlementBlocked) {
        setIsOnline(false);
        setRemittanceModalAmount(settlementOutstanding);
        setRemittanceModalVisible(true);
        return;
      }

      if (!value) setIsOnline(false);
      const result = await apiService.setDriverStatus(value ? 'online' : 'offline');
      const nextStatus = String(result?.status || '').toLowerCase();
      setIsOnline(nextStatus ? nextStatus === 'online' : value);
      await cacheService.remove('driver_home_dashboard');
      fetchDashboardData(false).catch(() => undefined);
    } catch (error) {
      if (value) {
        setIsOnline(false);
      } else {
        setIsOnline(true);
      }
      const err: any = error;
      if (err?.status === 403 || err?.code === 'settlement_overdue' || settlementBlocked) {
        const apiPayload = err?.details || err?.response?.data || err;
        const amount = getRemittanceGrandTotal(apiPayload, settlementOutstanding);
        setSettlementOutstanding(amount);
        setSettlementBlocked(true);
        setRemittanceModalAmount(amount);
        setRemittanceModalVisible(true);
        return;
      }
      setRemittanceModalAmount(0);
      setRemittanceModalVisible(true);
    }
  };

  const isLight = theme.mode === 'light';
  const statusColor = onlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.textSecondary, '#10B981']
  });

  const remittanceCountdownMs = remittanceDueAt
    ? Math.max(new Date(remittanceDueAt).getTime() - countdownNow, 0)
    : 0;

  const mapRides = useMemo(() => {
    const source = activeRides.length > 0 ? activeRides : recentRides;
    return source.slice(0, 5);
  }, [activeRides, recentRides]);

  const mapFocusCoordinates = useMemo<[number, number][]>(() => {
    const coordinates: [number, number][] = [];

    if (currentLocation) {
      coordinates.push([currentLocation.longitude, currentLocation.latitude]);
    }

    mapRides.forEach((ride) => {
      const pickupLng = parseFloat(String(
        ride.pickup_longitude ?? ride.pickup_location?.longitude ?? ride.pickup_location?.lng
      ));
      const pickupLat = parseFloat(String(
        ride.pickup_latitude ?? ride.pickup_location?.latitude ?? ride.pickup_location?.lat
      ));
      const dropoffLng = parseFloat(String(
        ride.dropoff_longitude ?? ride.dropoff_location?.longitude ?? ride.dropoff_location?.lng
      ));
      const dropoffLat = parseFloat(String(
        ride.dropoff_latitude ?? ride.dropoff_location?.latitude ?? ride.dropoff_location?.lat
      ));

      if (Number.isFinite(pickupLat) && Number.isFinite(pickupLng)) {
        coordinates.push([pickupLng, pickupLat]);
      }
      if (Number.isFinite(dropoffLat) && Number.isFinite(dropoffLng)) {
        coordinates.push([dropoffLng, dropoffLat]);
      }
    });

    return coordinates;
  }, [currentLocation, mapRides]);

  const promoSlides = useMemo<HomePromoSlide[]>(() => ([
    {
      id: 'driver-promo-1',
      image: require('@assets/Carousel1.png'),
      onPress: () => router.push('/driver/rides'),
      accessibilityLabel: 'Open driver ride requests',
    },
    {
      id: 'driver-promo-2',
      image: require('@assets/Carousel2.png'),
      onPress: () => router.push('/driver/rides'),
      accessibilityLabel: 'View Charter Keke driver rides',
    },
  ]), [router]);

  return (
    <View style={[styles.container, { backgroundColor: isLight ? COLORS.light.background : COLORS.dark.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      
      {loading && !driverData ? (
        <HomeSkeleton />
      ) : (
        <ScrollView
          style={styles.scrollView}
          scrollEnabled={scrollEnabled}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient
            colors={isLight ? ['#FFFFFF', '#FFF8F0'] : ['#000000', '#1A1100']}
            style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
          >
            <View style={styles.header}>
              <View>
                <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Ready to earn?</Text>
                <Text style={[styles.name, { color: theme.colors.textPrimary }]}>
                  {user?.firstName || (user as any)?.first_name || (driverData as any)?.first_name || 'Driver'} 👋
                </Text>
              </View>
              <View style={styles.headerButtons}>
                <TourTarget id="driver-notifications">
                  <TouchableOpacity 
                    onPress={() => {
                      resetUnreadCount();
                      router.push('/driver/notifications');
                    }} 
                    style={[styles.iconBtn, { backgroundColor: theme.colors.inputBackground }]}
                  >
                    <MaterialCommunityIcons name="bell-outline" size={20} color={theme.colors.textPrimary} />
                    {unreadCount > 0 && (
                      <View style={[styles.badge, { backgroundColor: BRAND.primary }]}>
                        <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </TourTarget>
                <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: theme.colors.inputBackground }]}>
                  <MaterialCommunityIcons name={isLight ? "weather-sunny" : "weather-night"} size={20} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/driver/profile')} style={styles.profileBtn}>
                  <Image source={{ uri: (user as any)?.avatar || (driverData as any)?.profile_picture_url || 'https://via.placeholder.com/40' }} style={styles.profileImage} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Status Toggle Card */}
            <TourTarget id="driver-online-toggle">
              <View style={[styles.statusCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                 <View style={styles.statusInfo}>
                    <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>Current Status</Text>
                    <Animated.Text style={[styles.statusValue, { color: statusColor }]}>
                      {isOnline ? 'Online - Receiving Requests' : 'Offline'}
                    </Animated.Text>
                    {settlementBlocked ? (
                      <Text style={[styles.statusNote, { color: '#EF4444' }]}>
                        Overdue remittance lock: {formatCurrency(settlementOutstanding || 0)}
                      </Text>
                    ) : todayRemittanceDue > 0 ? (
                      <Text style={[styles.statusNote, { color: BRAND.primary }]}>
                        Remittance due in {formatRemittanceCountdown(remittanceCountdownMs)} - {formatCurrency(todayRemittanceDue)}
                      </Text>
                    ) : (
                      <Text style={[styles.statusNote, { color: theme.colors.textSecondary }]}>
                        No remittance due right now
                      </Text>
                    )}
                 </View>
                 <Switch
                    value={isOnline}
                    onValueChange={handleOnlineToggle}
                    trackColor={{ false: theme.colors.border, true: '#10B981' }}
                    thumbColor="#FFF"
                 />
              </View>
            </TourTarget>
          </LinearGradient>

          <HomePromoCarousel slides={promoSlides} />

          {/* Stats Grid */}
          <View style={styles.statsContainer}>
             <TourTarget id="driver-earnings" style={{ flex: 1 }}>
               <StatCard 
                 label="Today's Earnings" 
                 value={formatCurrency(todayEarnings || 0)} 
                 icon="wallet-outline" 
                 color={BRAND.primary}
                 theme={theme}
                 isLight={isLight}
                 onPress={() => router.push('/driver/earnings')}
               />
             </TourTarget>
             <StatCard 
               label="Completed Trips" 
               value={driverStats.completedTrips.toString()} 
               icon="check-circle-outline" 
               color="#10B981"
               theme={theme}
               isLight={isLight}
               onPress={() => router.push('/driver/rides')}
             />
          </View>
          
          <View style={[styles.statsContainer, { marginTop: 12 }]}>
             <StatCard 
               label="Active Rides" 
               value={activeRidesCount.toString()} 
               icon="rickshaw" 
               color="#3B82F6"
               theme={theme}
               isLight={isLight}
               onPress={() => router.push('/driver/rides')}
             />
             <StatCard 
               label="Rating" 
               value={(driverStats.averageRating || 0).toFixed(1)} 
               icon="star" 
               color="#F59E0B"
               theme={theme}
               isLight={isLight}
               onPress={() => router.push('/driver/profile')}
             />
          </View>

          {/* Map Preview */}
          <View style={[styles.mapSection, { borderColor: theme.colors.border }]}>
             <MapboxMap
                style={styles.map}
                latitude={currentLocation?.latitude || 6.5244}
                longitude={currentLocation?.longitude || 3.3792}
                zoom={13}
               mapStyle="standard"
               showUserLocation
               showCompass
               showScaleBar
               autoCenter={false}
               fitCoordinates={mapFocusCoordinates}
                onTouchStart={() => setScrollEnabled(false)}
                onTouchEnd={() => setScrollEnabled(true)}
              >
                {mapRides.flatMap((ride) => {
                  const markers = [];
                  const pickupLng = parseFloat(String(
                    ride.pickup_longitude ?? ride.pickup_location?.longitude ?? ride.pickup_location?.lng
                  ));
                  const pickupLat = parseFloat(String(
                    ride.pickup_latitude ?? ride.pickup_location?.latitude ?? ride.pickup_location?.lat
                  ));
                  const dropoffLng = parseFloat(String(
                    ride.dropoff_longitude ?? ride.dropoff_location?.longitude ?? ride.dropoff_location?.lng
                  ));
                  const dropoffLat = parseFloat(String(
                    ride.dropoff_latitude ?? ride.dropoff_location?.latitude ?? ride.dropoff_location?.lat
                  ));

                  if (Number.isFinite(pickupLat) && Number.isFinite(pickupLng)) {
                    markers.push(
                      <MapboxMarker
                        key={`pickup-${ride.id}`}
                        id={`pickup-${ride.id}`}
                        coordinate={[pickupLng, pickupLat]}
                        title={activeRides.length > 0 ? 'Active Pickup' : 'Pickup'}
                        description={ride.pickup_zone || 'Pickup Location'}
                        color="#2563EB"
                      />
                    );
                  }
                  if (Number.isFinite(dropoffLat) && Number.isFinite(dropoffLng)) {
                    markers.push(
                      <MapboxMarker
                        key={`dropoff-${ride.id}`}
                        id={`dropoff-${ride.id}`}
                        coordinate={[dropoffLng, dropoffLat]}
                        title={activeRides.length > 0 ? 'Active Dropoff' : 'Dropoff'}
                        description={ride.destination_zone || 'Dropoff Location'}
                        color="#10B981"
                      />
                    );
                  }
                  return markers;
                })}
              </MapboxMap>
              {/* CTA Carousel moved below mapSection */}
              {mapRides.length > 0 && (
                <View style={[styles.mapInfo, { backgroundColor: theme.colors.surface }]}> 
                  <Text numberOfLines={1} style={[styles.mapInfoText, { color: theme.colors.textPrimary }]}>
                    {activeRides.length > 0
                      ? `Showing ${activeRides.length} active ride${activeRides.length > 1 ? 's' : ''}`
                      : `Showing ${mapRides.length} recent ride${mapRides.length > 1 ? 's' : ''}`}
                  </Text>
                </View>
              )}
              <View style={[styles.mapOverlay, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.dot} />
                <Text style={[styles.locationText, { color: theme.colors.textPrimary }]}>
                   {currentLocation ? 'You are here' : 'Locating...'}
                </Text>
              </View>
          </View>

          {/* CTA Carousel (driver-only cards) - placed under map and above recent/available rides */}
          <View style={[styles.paddingH, { marginTop: 16 }]}> 
            <CtaCarousel
              items={[
                {
                  id: 'earn-more',
                  title: 'View Earnings',
                  subtitle: 'See how much you earned today and withdraw.',
                  label: 'Earnings',
                  onPress: () => router.push('/driver/earnings'),
                } as CtaCard,
                {
                  id: 'settlement',
                  title: 'Settlement Status',
                  subtitle: 'Check outstanding settlements and remittance details.',
                  label: 'Settlements',
                  onPress: () => router.push('/driver/wallet'),
                } as CtaCard,
                {
                  id: 'refer',
                  title: 'Refer a friend',
                  subtitle: 'Share your referral code and earn rewards.',
                  label: 'Share',
                  share: true,
                  onPress: () => router.push('/driver/referrals'),
                } as CtaCard,
              ]}
            />
          </View>

          {isOnline && availableRides.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ridesScroll}>
              {availableRides.map((ride) => (
                <TouchableOpacity 
                  key={ride.id} 
                  style={[styles.rideCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => router.push('/driver/rides')}
                >
                   <View style={styles.rideHeader}>
                     <View style={styles.rideBadge}><Text style={styles.rideBadgeText}>NEW</Text></View>
                     <Text style={[styles.rideFare, { color: BRAND.primary }]}>₦{ride.driver_earnings?.toLocaleString()}</Text>
                   </View>
                   <Text numberOfLines={1} style={[styles.rideLoc, { color: theme.colors.textPrimary }]}>{ride.pickup_zone}</Text>
                   <Text style={[styles.rideArrow, { color: theme.colors.textSecondary }]}>↓</Text>
                   <Text numberOfLines={1} style={[styles.rideLoc, { color: theme.colors.textPrimary }]}>{ride.destination_zone}</Text>
                   <View style={styles.rideMeta}>
                      <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{ride.distance_km?.toFixed(1)} km</Text>
                   </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
             <View style={[styles.emptyState, { borderColor: theme.colors.border, borderStyle: 'dashed' }]}>
               <MaterialCommunityIcons name={isOnline ? "rickshaw" : "power-sleep"} size={32} color={theme.colors.textTertiary} />
               <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                 {isOnline ? 'Searching for nearby rides...' : 'Go online to see requests'}
               </Text>
             </View>
          )}

        </ScrollView>
      )}

      <Modal
        transparent
        visible={locationPermissionVisible}
        animationType="fade"
        onRequestClose={() => setLocationPermissionVisible(false)}
      >
        <View style={styles.permissionOverlay}>
          <View style={[styles.permissionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="crosshairs-gps" size={32} color={BRAND.primary} />
            <Text style={[styles.permissionTitle, { color: theme.colors.textPrimary }]}>Turn on location</Text>
            <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
              Driver mode needs location access to receive rides, keep your status accurate, and update tracking while the app is open.
            </Text>
            <View style={styles.permissionActions}>
              <TouchableOpacity
                onPress={async () => {
                  const granted = await requestLocationPermission().catch(() => false);
                  if (granted) setLocationPermissionVisible(false);
                }}
                disabled={checkingLocationPermission}
                style={[styles.permissionButton, { backgroundColor: BRAND.primary, opacity: checkingLocationPermission ? 0.7 : 1 }]}
              >
                <Text style={styles.permissionButtonText}>Enable</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openSettings().catch(() => {})}
                style={[styles.permissionButton, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border, borderWidth: 1 }]}
              >
                <Text style={[styles.permissionButtonText, { color: theme.colors.textPrimary }]}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SupportFloatingWidget route="/driver/help-and-support" tourId="driver-support" />

      <Modal
        visible={remittanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRemittanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#EF4444" />
            </View>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              Remittance Overdue
            </Text>
            <Text style={[styles.modalText, { color: theme.colors.textSecondary }]}>
              You can only go online after paying overdue platform fees. Today&apos;s remittance stays open until midnight; this lock only applies to overdue balances.
            </Text>
            {remittanceModalAmount > 0 && (
              <View style={[styles.modalAmountBox, { backgroundColor: theme.colors.inputBackground }]}>
                <Text style={[styles.modalAmountLabel, { color: theme.colors.textSecondary }]}>Total amount to remit</Text>
                <Text style={styles.modalAmount}>{formatCurrency(remittanceModalAmount)}</Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setRemittanceModalVisible(false)}
                style={[styles.modalBtn, { borderColor: theme.colors.border, borderWidth: 1 }]}
              >
                <Text style={[styles.modalBtnSecondaryText, { color: theme.colors.textPrimary }]}>Not Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setRemittanceModalVisible(false);
                  router.push('/driver/wallet');
                }}
                style={[styles.modalBtn, { backgroundColor: BRAND.primary }]}
              >
                <Text style={styles.modalBtnPrimaryText}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const StatCard = ({ label, value, icon, color, theme, onPress }: any) => (
  <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 13, fontWeight: '500' },
  name: { fontSize: 22, fontWeight: '800' },
  headerButtons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badge: { position: 'absolute', top: -6, right: -4, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  profileBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: BRAND.primary, padding: 1 },
  profileImage: { width: '100%', height: '100%', borderRadius: 20 },
  statusCard: { padding: 16, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  statusLabel: { fontSize: 12, marginBottom: 4 },
  statusValue: { fontSize: 14, fontWeight: '700' },
  statusNote: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  statusInfo: { flex: 1 },
  statsContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 20 },
  statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  mapSection: { margin: 20, height: 440, borderRadius: 20, overflow: 'hidden', borderWidth: 1, position: 'relative' },
  map: { flex: 1 },
  mapInfo: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mapInfoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapOverlay: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.primary },
  locationText: { fontSize: 12, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  ridesScroll: { paddingHorizontal: 20, gap: 12 },
  rideCard: { width: 200, padding: 16, borderRadius: 16, borderWidth: 1, marginRight: 4 },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rideBadge: { backgroundColor: BRAND.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rideBadgeText: { fontSize: 10, fontWeight: '700', color: '#000' },
  rideFare: { fontSize: 14, fontWeight: '700' },
  rideLoc: { fontSize: 13, fontWeight: '600' },
  rideArrow: { fontSize: 12, marginVertical: 2 },
  rideMeta: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 11 },
  emptyState: { margin: 20, padding: 30, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 8, fontSize: 13 },
  paddingH: { paddingHorizontal: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  modalAmountBox: {
    width: '100%',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  modalAmountLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalAmount: {
    color: '#EF4444',
    fontSize: 24,
    fontWeight: '900',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondaryText: {
    fontWeight: '800',
  },
  modalBtnPrimaryText: {
    color: '#000',
    fontWeight: '900',
  },
  permissionOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionCard: { width: '100%', maxWidth: 420, borderRadius: 24, padding: 24, borderWidth: 1, alignItems: 'center', gap: 12 },
  permissionTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  permissionText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  permissionActions: { width: '100%', gap: 10, marginTop: 4 },
  permissionButton: { borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  permissionButtonText: { fontSize: 14, fontWeight: '800' },
});

const mapDarkStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
];
