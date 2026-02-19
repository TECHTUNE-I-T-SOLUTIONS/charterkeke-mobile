import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';

const { width, height } = Dimensions.get('window');

interface ActiveRide {
  id: string;
  pickup_zone: string;
  destination_zone: string;
  fare_amount: number;
  status: string;
  driver?: {
    users: {
      first_name: string;
      last_name: string;
      profile_picture_url?: string;
    };
    average_rating: number;
    vehicle_type?: string;
    plate_number?: string;
  };
  driver_id?: string;
}

export default function ActiveRideScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { currentLocation } = useLocation();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isDark = theme?.mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  useEffect(() => {
    fetchActiveRide();
  }, [rideId]);

  const fetchActiveRide = async () => {
    try {
      setLoading(true);
      let res;
      
      // If rideId is provided via deep-link, fetch that specific ride
      if (rideId) {
        res = await fetch(`/api/user/active-rides/${rideId}`);
      } else {
        // Otherwise fetch the current active ride
        res = await fetch('/api/user/active-rides');
      }
      
      const data = await res.json();
      
      if (data.rides && data.rides.length > 0) {
        setActiveRide(data.rides[0]);
        // Simulate driver location for demo
        setDriverLocation({
          latitude: (currentLocation?.latitude || 6.5244) + Math.random() * 0.02,
          longitude: (currentLocation?.longitude || 3.3792) + Math.random() * 0.02,
        });
      } else if (data.ride) {
        // Handle single ride response
        setActiveRide(data.ride);
        setDriverLocation({
          latitude: (currentLocation?.latitude || 6.5244) + Math.random() * 0.02,
          longitude: (currentLocation?.longitude || 3.3792) + Math.random() * 0.02,
        });
      }
    } catch (error) {
      console.error('Failed to fetch active ride:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActiveRide();
    setRefreshing(false);
  };

  // Memoized gradient colors
  const headerGradient = useMemo(
    () => [
      isDark ? '#FFFFFF' : '#000000',
      isDark ? '#F0F0F0' : '#333333',
    ] as const,
    [isDark]
  );

  // Memoized map markers
  const mapMarkers = useMemo(() => {
    const markers = [];
    if (currentLocation) {
      markers.push({
        id: 'pickup',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        title: 'Pickup Location',
        type: 'pickup',
      });
    }
    if (driverLocation) {
      markers.push({
        id: 'driver',
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        title: 'Driver Location',
        type: 'driver',
      });
    }
    return markers;
  }, [currentLocation, driverLocation]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 16 }}>Loading ride...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeRide) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <MaterialCommunityIcons name="car-off" size={48} color={colors.textSecondary} />
          <Text style={{ color: colors.text, marginTop: 16, fontSize: 16, fontWeight: '600' }}>
            No Active Ride
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            You don't have any active rides. Book a ride to get started.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/rider/booking')}
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: colors.primary,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: isDark ? '#000000' : '#FFFFFF', fontWeight: '600' }}>
              Book a Ride
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const driver = activeRide.driver?.users;
  const driverRating = activeRide.driver?.average_rating || 5;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <LinearGradient
          colors={headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 28 }} />
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: isDark ? '#000000' : '#FFFFFF',
                marginLeft: 12,
                flex: 1,
              }}
            >
              Active Ride
            </Text>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: colors.primary + '30',
                borderRadius: 6,
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>
                {activeRide.status}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? '#666666' : '#CCCCCC',
              fontWeight: '500',
            }}
          >
            {activeRide.pickup_zone} → {activeRide.destination_zone}
          </Text>
        </LinearGradient>

        {/* Map Container */}
        <View
          style={{
            height: 400,
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            showsUserLocation
            followsUserLocation
            initialRegion={{
              latitude: currentLocation?.latitude || 6.5244,
              longitude: currentLocation?.longitude || 3.3792,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            {mapMarkers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={marker.title}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor:
                      marker.type === 'driver' ? colors.primary : colors.secondary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 3,
                    borderColor: colors.card,
                  }}
                >
                  <MaterialCommunityIcons
                    name={marker.type === 'driver' ? 'car' : 'map-marker'}
                    size={24}
                    color={isDark ? '#000000' : '#FFFFFF'}
                  />
                </View>
              </Marker>
            ))}
          </MapView>
        </View>

        {/* Driver Info Card */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 20,
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Driver Info
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 24 }}>
                {driver?.first_name?.charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                }}
              >
                {driver?.first_name} {driver?.last_name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <MaterialCommunityIcons
                  name="star"
                  size={14}
                  color={colors.primary}
                />
                <Text
                  style={{
                    color: colors.text,
                    marginLeft: 4,
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  {driverRating.toFixed(1)}
                </Text>
                <Text style={{ color: colors.textSecondary, marginLeft: 4, fontSize: 11 }}>
                  (Excellent driver)
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons
                name="phone"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Vehicle Info */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
                Vehicle
              </Text>
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: 12 }}>
                {activeRide.driver?.vehicle_type || 'Keke'}
              </Text>
            </View>
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
                Plate Number
              </Text>
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: 12 }}>
                {activeRide.driver?.plate_number || 'N/A'}
              </Text>
            </View>
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
                Fare
              </Text>
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                ₦{activeRide.fare_amount?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>
        </View>

        {/* Route Info */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <MaterialCommunityIcons
                  name="map-marker"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Pickup</Text>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>
                  {activeRide.pickup_zone}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginVertical: 8,
              }}
            >
              <View
                style={{
                  width: 2,
                  height: 20,
                  backgroundColor: colors.border,
                  marginHorizontal: 15,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <MaterialCommunityIcons
                  name="map-search"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Destination</Text>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>
                  {activeRide.destination_zone}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            paddingHorizontal: 16,
            marginTop: 16,
            gap: 12,
          }}
        >
          <TouchableOpacity
            style={{
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: colors.primary,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: isDark ? '#000000' : '#FFFFFF',
              }}
            >
              Share Live Location
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: colors.card,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.text,
              }}
            >
              Cancel Ride
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
