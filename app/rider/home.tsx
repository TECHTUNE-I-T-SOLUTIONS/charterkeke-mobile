import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@context/AuthContext';
import { useLocation } from '@context/LocationContext';
import { useTheme } from '@context/ThemeContext';
import RiderBottomNavigation from '@components/RiderBottomNavigation';
import { formatCurrency } from '@utils/formatting';

const { width, height } = Dimensions.get('window');

export default function RiderHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { currentLocation } = useLocation();
  const { theme, mode, toggleTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const gradientColors = useMemo(() => {
    return mode === 'light'
      ? ['#5F5F5F', '#BBBBBB']
      : ['#797979', '#383838'];
  }, [mode]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.colors?.background || '#FFFFFF' }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Greeting */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View>
              <Text
                style={[
                  styles.greeting,
                  { color: mode === 'light' ? '#000000' : '#000000' },
                ]}
              >
                Welcome back, {user?.firstName || 'Rider'}! 👋
              </Text>
              <Text
                style={[
                  styles.subGreeting,
                  { color: mode === 'light' ? '#CCCCCC' : '#666666' },
                ]}
              >
                Ready for your next ride?
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={toggleTheme}
                style={[
                  styles.themeToggle,
                  { backgroundColor: theme?.colors?.primary || '#00CCFF' },
                ]}
              >
                <MaterialCommunityIcons
                  name={mode === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'}
                  size={20}
                  color={mode === 'light' ? '#FFFFFF' : '#000000'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.profileButton, { backgroundColor: theme?.colors?.primary || '#00CCFF' }]}
                onPress={() => router.push('/rider/profile')}
              >
                <Image
                  source={{
                    uri: user?.profilePictureUrl || 'https://via.placeholder.com/40',
                  }}
                  style={styles.profileImage}
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Action - Book a Ride */}
        <TouchableOpacity
          style={[styles.bookingCard, { backgroundColor: theme?.colors?.primary || '#00CCFF' }]}
          onPress={() => router.push('/rider/booking')}
        >
          <LinearGradient
            colors={[
              mode === 'light' ? '#949494' : '#555555',
              mode === 'light' ? '#ACA7A7' : '#ACACAC',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bookingGradient}
          >
            <MaterialCommunityIcons
              name="plus-circle"
              size={24}
              color={mode === 'light' ? '#FFFFFF' : '#000000'}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bookingTitle, { color: mode === 'light' ? '#FFFFFF' : '#000000' }]}>Book a Ride</Text>
              <Text style={[styles.bookingSubtitle, { color: mode === 'light' ? '#E8E8E8' : '#333333' }]}>
                Top destinations: {currentLocation ? 'Available' : 'Enable location'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={mode === 'light' ? '#FFFFFF' : '#000000'} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <StatCard
              icon="car"
              label="Total Rides"
              value={user?.totalRides?.toString() || '0'}
              colors={theme?.colors}
            />
            <StatCard
              icon="star"
              label="Rating"
              value={user?.averageRating?.toFixed(1) || '4.8'}
              colors={theme?.colors}
            />
          </View>
          <View style={styles.statRow}>
            <StatCard
              icon="wallet"
              label="Wallet Balance"
              value={formatCurrency(user?.walletBalance || 0)}
              colors={theme?.colors}
            />
            <StatCard
              icon="clock-outline"
              label="Avg. Wait Time"
              value="3 mins"
              colors={theme?.colors}
            />
          </View>
        </View>

        {/* Current Location Map */}
        {currentLocation && currentLocation.latitude && currentLocation.longitude ? (
          <View style={[styles.mapContainer, { marginHorizontal: 16, marginTop: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme?.colors?.border || '#CCCCCC' }]}>
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
                size={16}
                color={theme?.colors?.primary || '#000000'}
              />
              <Text
                style={[styles.locationText, { color: theme?.colors?.textPrimary || '#000000' }]}
              >
                {currentLocation.latitude?.toFixed(3)}, {currentLocation.longitude?.toFixed(3)}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Recent Rides Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme?.colors?.textPrimary || '#000000' }]}>
              Recent Rides
            </Text>
            <TouchableOpacity onPress={() => router.push('/rider/rides-history')}>
              <Text style={[styles.viewAll, { color: theme?.colors?.primary || '#000000' }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Empty State */}
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme?.colors?.surfaceLight || '#F5F5F5', borderColor: theme?.colors?.border || '#CCCCCC' },
            ]}
          >
            <MaterialCommunityIcons
              name="car-off"
              size={40}
              color={theme?.colors?.textSecondary || '#333333'}
            />
            <Text
              style={[styles.emptyStateText, { color: theme?.colors?.textPrimary || '#000000' }]}
            >
              No recent rides
            </Text>
            <Text
              style={[styles.emptyStateSubtext, { color: theme?.colors?.textSecondary || '#333333' }]}
            >
              Your ride history will appear here
            </Text>
          </View>
        </View>

        {/* Help & Support */}
        <View style={[styles.helpContainer, { borderTopColor: theme?.colors?.border || '#CCCCCC' }]}>
          <Text style={[styles.sectionTitle, { color: theme?.colors?.textPrimary || '#000000' }]}>
            Need Help?
          </Text>
          <TouchableOpacity
            style={[styles.helpButton, { borderColor: theme?.colors?.border || '#CCCCCC' }]}
          >
            <MaterialCommunityIcons
              name="message-question-outline"
              size={20}
              color={theme?.colors?.primary || '#000000'}
            />
            <Text style={[styles.helpText, { color: theme?.colors?.textPrimary || '#000000' }]}>
              Contact Support
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
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
}

function StatCard({ icon, label, value, colors }: StatCardProps) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors?.surfaceLight || '#CEC8C8',
          borderColor: colors?.border || '#CCCCCC',
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={colors?.primary || '#000000'}
        style={styles.statIcon}
      />
      <Text style={[styles.statValue, { color: colors?.textPrimary || '#000000' }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors?.textSecondary || '#333333' }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  greeting: {
    fontSize: 12,
    fontWeight: '400',
  },
  subGreeting: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
    opacity: 0.8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  mapCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    height: 200,
    overflow: 'hidden',
  },
  mapPreview: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    borderTopWidth: 1,
  },
  mapLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookingCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bookingSubtitle: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 400,
  },
  map: {
    flex: 1,
  },
  locationLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    // right: 30,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  helpContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 12,
    gap: 12,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
