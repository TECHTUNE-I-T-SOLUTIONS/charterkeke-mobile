
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  BackHandler,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotificationBadge } from '@/context/NotificationContext';
import { formatCurrency } from '@/utils/formatting';
import { apiService } from '@/services/api';
import { setNotificationCallbacks } from '@/services/notificationService';
import { setNavigationRef } from '@/services/navigationService';
import { HomeSkeleton } from '@/components/HomeSkeleton';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import CtaCarousel, { CtaCard } from '@/components/CtaCarousel';
import SupportFloatingWidget from '@/components/SupportFloatingWidget';
import { useAutoUpdateCheck } from '@/hooks/useAutoUpdateCheck';
import { BRAND, COLORS } from '@/utils/colors';
import { cacheService } from '@/services/cache';
import { STORAGE_KEYS } from '@/utils/constants';

const { width } = Dimensions.get('window');

const DEBUG_DISABLE_MAP = true;
const DEBUG_DISABLE_HOME_FETCH = false;
const DEBUG_DISABLE_CACHE = false;// Disable map rendering in production until Google Maps API key is available
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_DISABLED_NO_KEY = !GOOGLE_MAPS_API_KEY;
interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_picture_url?: string;
  role: string;
}

export default function RiderHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);  
  const [rideStats, setRideStats] = useState({ totalRides: 0, averageRating: 0, walletBalance: 0 });
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const { user, isAuthenticated } = useAuth();
  const { currentLocation } = useLocation();
  const [loading, setLoading] = useState(true);  
  const { theme, mode, toggleTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [hasCached, setHasCached] = useState(false);
  const { unreadCount, resetUnreadCount, incrementUnreadCount } = useNotificationBadge();

  // Refs to prevent state updates on unmounted component
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);

  // Auto-check for updates on app startup
  useAutoUpdateCheck(true);

  // Set up navigation ref and notification callbacks
  useEffect(() => {
    setNavigationRef(router);
    setNotificationCallbacks(incrementUnreadCount);
  }, [router, incrementUnreadCount]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== 'android' || !user) return;

      const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp();
        return true;
      });

      return () => backSubscription.remove();
    }, [user])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (!isAuthenticated) {
        console.log('❌ [RIDER-HOME] Not authenticated, redirecting to login');
        return router.replace('/auth/welcome');
      }
      if (!user?.id) {
        console.warn('⚠️  [RIDER-HOME] User ID not available, skipping home load');
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }
      if (!isLoadingRef.current) {
        console.log('🔄 [RIDER-HOME] Initializing home data for user:', user?.id);
        loadHomeData();
      }
    }, [isAuthenticated, user?.id])
  );


  const loadHomeData = async () => {
    if (!isMountedRef.current || isLoadingRef.current) return;
    if (DEBUG_DISABLE_HOME_FETCH) {
      if (isMountedRef.current) setLoading(false);
      return;
    }
    
    try {
      isLoadingRef.current = true;
      const cached = DEBUG_DISABLE_CACHE ? null : await cacheService.get<any>(STORAGE_KEYS.RIDER_HOME);
      
      if (!isMountedRef.current) return;
      
      if (cached) {
        console.log('📦 [RIDER-HOME] Using cached home data');
        setProfileData(cached.profileData || null);
        setRideStats(cached.rideStats || { totalRides: 0, averageRating: 0, walletBalance: 0 });
        setRecentRides(cached.recentRides || []);
        setHasCached(true);
        setLoading(false);
      }

      if (isMountedRef.current) {
        await fetchProfileData(!cached);
      }
    } catch (error) {
      console.error('❌ [RIDER-HOME] loadHomeData error:', error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    } finally {
      isLoadingRef.current = false;
    }
  };

  const fetchProfileData = async (showLoader: boolean = true) => {
    if (!isMountedRef.current) return;
    
    try {
      if (showLoader) setLoading(true);
      
      console.log('📊 [RIDER-HOME] Fetching profile data...');
      const profileRes = await apiService.get('/user/profile').catch((err) => {
        console.warn('⚠️  [RIDER-HOME] getProfile failed:', err?.message || err);
        return {};
      });
      
      if (!isMountedRef.current) return;
      
      const nextProfile = (profileRes as any)?.user || profileRes;
      setProfileData(nextProfile);
      console.log('✅ [RIDER-HOME] Profile loaded:', { hasProfile: !!nextProfile });

      let nextStats = { ...rideStats };
      let nextRecent = recentRides;

      try {
        const historyRes = await apiService.get('/user/ride-history?limit=100');
        if (isMountedRef.current) {
          const rides = (historyRes as any)?.rides || [];
          const totalRides = rides.length;
          const averageRating = rides.length > 0 ? rides.reduce((sum: number, ride: any) => sum + (ride.rating || 0), 0) / rides.length : 0;
          nextStats = { ...nextStats, totalRides, averageRating };
          nextRecent = rides.slice(0, 5);
          setRideStats(nextStats);
          setRecentRides(nextRecent);
          console.log('✅ [RIDER-HOME] Ride history loaded:', { totalRides, averageRating });
        }
      } catch (err) {
        console.warn('⚠️  [RIDER-HOME] getRideHistory failed:', (err as any)?.message || err);
      }

      if (!isMountedRef.current) return;

      try {
        const walletRes = await apiService.get('/user/wallet');
        if (isMountedRef.current) {
          nextStats = { ...nextStats, walletBalance: (walletRes as any)?.wallet?.balance || 0 };
          setRideStats(nextStats);
          console.log('✅ [RIDER-HOME] Wallet loaded:', { balance: nextStats.walletBalance });
        }
      } catch (err) {
        console.warn('⚠️  [RIDER-HOME] getWallet failed:', (err as any)?.message || err);
      }

      if (isMountedRef.current && !DEBUG_DISABLE_CACHE) {
        await cacheService.set(STORAGE_KEYS.RIDER_HOME, {
          profileData: nextProfile,
          rideStats: nextStats,
          recentRides: nextRecent,
        });
      }
    } catch (error) {
      console.error('❌ [RIDER-HOME] Profile fetch error:', error);
      // Don't crash the app - show cached data or empty state
    } finally {
      if (isMountedRef.current && showLoader) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData(!hasCached);
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      case 'in_progress':
        return '#3B82F6';
      default:
        return BRAND.primary;
    }
  };

  const isLight = theme.mode === 'light';
  const MAPBOX_TOKEN = !!process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN;
  
  // Convert ride data to markers for Mapbox
  const mapboxMarkers = useMemo(() => {
    return recentRides
      .flatMap((ride) => {
        const markers = [];
        if (ride.pickup_latitude && ride.pickup_longitude) {
          markers.push({
            id: `pickup-${ride.id}`,
            latitude: parseFloat(String(ride.pickup_latitude)),
            longitude: parseFloat(String(ride.pickup_longitude)),
            title: 'Pickup',
            description: ride.pickup_zone || 'Pickup Location',
            color: '#2563EB',
          });
        }
        if (ride.dropoff_latitude && ride.dropoff_longitude) {
          markers.push({
            id: `dropoff-${ride.id}`,
            latitude: parseFloat(String(ride.dropoff_latitude)),
            longitude: parseFloat(String(ride.dropoff_longitude)),
            title: 'Dropoff',
            description: ride.dropoff_zone || 'Dropoff Location',
            color: '#10B981',
          });
        }
        return markers;
      })
      .filter((m) => Number.isFinite(m.latitude) && Number.isFinite(m.longitude));
  }, [recentRides]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      
      {loading ? (
        <HomeSkeleton />
      ) : (
        <>
          {/* Fixed Header */}
          <LinearGradient
            colors={isLight ? ['#FFFFFF', '#FFF8F0'] : ['#000000', '#1A1100']}
            style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
          >
            <View style={styles.header}>
              <View>
                <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
                  Welcome back,
                </Text>
                <Text style={[styles.name, { color: theme.colors.textPrimary }]}>
                  {profileData?.first_name || 'Rider'}! 👋
                </Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  onPress={() => {
                    resetUnreadCount();
                    router.push('/rider/notifications');
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
                <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: theme.colors.inputBackground }]}>
                  <MaterialCommunityIcons name={isLight ? "weather-sunny" : "weather-night"} size={20} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/rider/profile')} style={styles.profileBtn}>
                  <Image
                    source={{
                      uri:
                        (user as any)?.avatar ||
                        (user as any)?.profile_picture_url ||
                        profileData?.profile_picture_url ||
                        'https://via.placeholder.com/40',
                    }}
                    style={styles.profileImage}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            scrollEnabled={scrollEnabled}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
            showsVerticalScrollIndicator={false}
          >

        {/* Hero Action - Book Ride */}
        <View style={styles.paddingH}>
          <TouchableOpacity style={styles.heroCard} onPress={() => router.push('/rider/booking')} activeOpacity={0.9}>
            <LinearGradient
              colors={[BRAND.primary, '#E68200']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View>
                <Text style={styles.heroTitle}>Need a ride?</Text>
                <Text style={styles.heroSubtitle}>Fast and affordable keke rides.</Text>
                <View style={styles.heroBtn}>
                  <Text style={styles.heroBtnText}>Book Now</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={BRAND.primary} />
                </View>
              </View>
              <Image source={require('@assets/charter keke.png')} style={styles.heroImage} resizeMode="contain" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
             <View style={[styles.statIconBox, { backgroundColor: isLight ? '#FFF5E5' : '#2A1800' }]}>
               <MaterialCommunityIcons name="wallet-outline" size={20} color={BRAND.primary} />
             </View>
             <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{formatCurrency(rideStats.walletBalance)}</Text>
             <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Wallet Balance</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
             <View style={[styles.statIconBox, { backgroundColor: isLight ? '#F0F9FF' : '#001E2B' }]}>
               <MaterialCommunityIcons name="rickshaw" size={20} color="#0EA5E9" />
             </View>
             <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{rideStats.totalRides}</Text>
             <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Rides</Text>
          </View>
        </View>

        {/* Map Preview */}
        <View style={[styles.mapSection, { borderColor: theme.colors.border }]}>
           <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Around You</Text>
              <View style={[styles.liveTag, { backgroundColor: '#10B98120' }]}>
                 <View style={styles.liveDot} />
                 <Text style={styles.liveText}>Live</Text>
              </View>
           </View>
           <View style={styles.mapContainer}>
             {MAPBOX_TOKEN ? (
               <>
               <MapboxMap
                 latitude={currentLocation?.latitude || 6.5244}
                 longitude={currentLocation?.longitude || 3.3792}
                 onTouchStart={() => setScrollEnabled(false)}
                 onTouchEnd={() => setScrollEnabled(true)}
               >
                 {mapboxMarkers.map((marker) => (
                   <MapboxMarker
                     key={marker.id}
                     id={marker.id}
                     coordinate={[marker.longitude, marker.latitude]}
                     title={marker.title}
                     description={marker.description}
                     color={marker.color}
                   />
                 ))}
               </MapboxMap>

                 {/* CTA Carousel moved below map (rendered after mapSection) */}
               </>
             ) : (
               <View style={[styles.map, { backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }]}>
                 <MaterialCommunityIcons 
                   name="map-marker-off" 
                   size={40} 
                   color={theme.colors.textTertiary} 
                   style={{ marginBottom: 12 }}
                 />
                 <Text style={[styles.emptyText, { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '600', textAlign: 'center' }]}>
                   Map Configuration Required
                 </Text>
                 <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 6 }]}>
                   Mapbox token not configured.
                 </Text>
               </View>
             )}
           </View>
           <View style={[styles.locationPill, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="navigation" size={14} color={BRAND.primary} />
              <Text numberOfLines={1} style={[styles.locationText, { color: theme.colors.textPrimary }]}>
                 {currentLocation ? 'Current Location' : 'Locating...'}
              </Text>
           </View>
        </View>

        {/* CTA Carousel (rider-only cards) - placed under map and above Recent Activity */}
        <View style={[styles.paddingH, { marginTop: 16 }]}> 
          <CtaCarousel
            items={[
              {
                id: 'quick-book',
                title: 'Wanna get there faster?',
                subtitle: 'Quickly book a ride to your destination with one tap.',
                label: 'Quick Book',
                onPress: () => router.push('/rider/booking'),
              } as CtaCard,
              {
                id: 'somolu',
                title: 'Going to Somolu?',
                subtitle: 'Book a ride to Somolu quickly with pre-filled destination.',
                label: 'Book Somolu',
                onPress: () => router.push('/rider/booking?destination=Somolu'),
              } as CtaCard,
              {
                id: 'refer',
                title: 'Have you referred a friend today?',
                subtitle: 'Share your referral code and get rewards.',
                label: 'Share',
                share: true,
                onPress: () => router.push('/rider/referrals'),
              } as CtaCard,
            ]}
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.paddingH}>
           <View style={styles.sectionHeader}>
             <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Activity</Text>
             <TouchableOpacity onPress={() => router.push('/rider/rides-history')}>
               <Text style={[styles.seeAll, { color: BRAND.primary }]}>See All</Text>
             </TouchableOpacity>
           </View>

           {recentRides.length === 0 ? (
             <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <MaterialCommunityIcons name="history" size={32} color={theme.colors.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No recent rides found</Text>
                <TouchableOpacity onPress={() => router.push('/rider/booking')}>
                  <Text style={[styles.emptyLink, { color: BRAND.primary }]}>Book your first ride</Text>
                </TouchableOpacity>
             </View>
           ) : (
             <View style={styles.recentList}>
               {recentRides.map((ride) => (
                 <TouchableOpacity
                   key={ride.id}
                   activeOpacity={0.9}
                   onPress={() =>
                     router.push({
                       pathname: '/rider/ride-details',
                       params: { rideData: JSON.stringify(ride) },
                     } as any)
                   }
                   style={[styles.recentCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                 >
                   <View style={styles.recentHeader}>
                     <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) + '20' }]}>
                       <Text style={[styles.statusText, { color: getStatusColor(ride.status) }]}>{String(ride.status || '').toUpperCase()}</Text>
                     </View>
                     <Text style={[styles.recentFare, { color: theme.colors.textPrimary }]}>
                       ₦{(ride.fare_amount ?? 0).toLocaleString()}
                     </Text>
                   </View>

                   <View style={styles.recentRoute}>
                     <View style={styles.timeline}>
                       <View style={[styles.dot, { backgroundColor: BRAND.primary }]} />
                       <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
                       <View style={[styles.square, { borderColor: theme.colors.textPrimary }]} />
                     </View>
                     <View style={styles.addresses}>
                       <Text numberOfLines={1} style={[styles.addressText, { color: theme.colors.textPrimary }]}>
                         {ride.pickup_zone || 'Pickup'}
                       </Text>
                       <View style={{ height: 10 }} />
                       <Text numberOfLines={1} style={[styles.addressText, { color: theme.colors.textPrimary }]}>
                         {ride.destination_zone || 'Destination'}
                       </Text>
                     </View>
                   </View>

                   <View style={[styles.recentFooter, { borderTopColor: theme.colors.border }]}
                   >
                     <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}
                     >
                       {ride.created_at
                         ? `${new Date(ride.created_at).toLocaleDateString()} • ${new Date(ride.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                         : 'Recent ride'}
                     </Text>
                   </View>
                 </TouchableOpacity>
               ))}
             </View>
           )}
        </View>

          </ScrollView>
        </>
      )}

      <SupportFloatingWidget route="/rider/help-and-support" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  headerGradient: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerButtons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badge: { position: 'absolute', top: -6, right: -4, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  profileBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: BRAND.primary, padding: 1 },
  profileImage: { width: '100%', height: '100%', borderRadius: 20 },
  greeting: { fontSize: 13, fontWeight: '500' },
  name: { fontSize: 20, fontWeight: '800' },
  paddingH: { paddingHorizontal: 20, marginTop: 20 },
  heroCard: { borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: BRAND.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12 },
  heroGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, height: 140 },
  heroTitle: { color: '#000', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  heroSubtitle: { color: '#333', fontSize: 13, marginBottom: 16 },
  heroBtn: { backgroundColor: '#000', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, alignSelf: 'flex-start', gap: 6 },
  heroBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  heroImage: { width: 100, height: 80, transform: [{ rotate: '-10deg' }] },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 20 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1 },
  statIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '500' },
  mapSection: { marginHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  liveTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveText: { fontSize: 10, fontWeight: '700', color: '#10B981' },
  mapContainer: { height: 480, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  map: { flex: 1 },
  locationPill: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  locationText: { fontSize: 11, fontWeight: '600' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  emptyState: { padding: 32, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  emptyText: { fontSize: 13, marginTop: 8 },
  emptyLink: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  recentList: { gap: 12 },
  recentCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recentFare: { fontSize: 14, fontWeight: '700' },
  recentRoute: { flexDirection: 'row', marginBottom: 10 },
  recentFooter: { borderTopWidth: 1, paddingTop: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  timeline: { alignItems: 'center', marginRight: 12, paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { width: 1, flex: 1, marginVertical: 4 },
  square: { width: 8, height: 8, borderWidth: 1 },
  addresses: { flex: 1 },
  addressText: { fontSize: 13, fontWeight: '500' },
  dateText: { fontSize: 11 },
});

const mapDarkStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
];
