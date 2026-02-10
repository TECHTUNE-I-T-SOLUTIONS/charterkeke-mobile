import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useRide } from '@/context/RideContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { COLORS } from '@/utils/colors';
import { formatCurrency, formatDistance, formatDuration } from '@/utils/formatting';

export default function AvailableRidesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentLocation } = useLocation();
  const { availableRides, isLoading, getAvailableRides, acceptRide } = useRide();
  const [isDark, setIsDark] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);

  const colors = isDark ? COLORS.dark : COLORS.light;

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    if (currentLocation) {
      await getAvailableRides({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radiusKm: 5,
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

  const handleAcceptRide = async (rideId: string) => {
    setSelectedRideId(rideId);
    try {
      const result = await acceptRide(rideId);
      if (result.success) {
        router.push({
          pathname: '/driver/active-ride',
          params: { rideId },
        });
      }
    } catch (error) {
      console.error('Accept ride error:', error);
    } finally {
      setSelectedRideId(null);
    }
  };

  // Mock available rides data
  const mockRides = [
    {
      id: '1',
      rider: {
        name: 'Zainab Ahmed',
        rating: 4.9,
        image: 'https://avatar.vercel.sh/zainab?size=100',
      },
      pickup: {
        address: 'Ikoyi, Lagos',
        latitude: 6.6271,
        longitude: 3.0829,
      },
      dropoff: {
        address: 'VI, Lagos',
        latitude: 6.5244,
        longitude: 3.3792,
      },
      distance: 12.5,
      duration: 25,
      fare: 2500,
      distanceFromYou: 1.2,
    },
    {
      id: '2',
      rider: {
        name: 'Emeka Obi',
        rating: 4.7,
        image: 'https://avatar.vercel.sh/emeka?size=100',
      },
      pickup: {
        address: 'Shomolu, Lagos',
        latitude: 6.5700,
        longitude: 3.3800,
      },
      dropoff: {
        address: 'Lekki, Lagos',
        latitude: 6.4729,
        longitude: 3.5898,
      },
      distance: 18.5,
      duration: 35,
      fare: 3500,
      distanceFromYou: 2.5,
    },
    {
      id: '3',
      rider: {
        name: 'Chineze Nwa',
        rating: 4.8,
        image: 'https://avatar.vercel.sh/chineze?size=100',
      },
      pickup: {
        address: 'Yaba, Lagos',
        latitude: 6.5344,
        longitude: 3.3397,
      },
      dropoff: {
        address: 'Ikeja, Lagos',
        latitude: 6.6018,
        longitude: 3.3413,
      },
      distance: 8.5,
      duration: 18,
      fare: 1800,
      distanceFromYou: 3.1,
    },
  ];

  const renderRideCard = ({ item }: { item: (typeof mockRides)[0] }) => (
    <Card isDark={isDark}>
      {/* Rider Info */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
            {item.rider.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: colors.warning, marginRight: 4 }}>★</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {item.rider.rating}
            </Text>
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: colors.primary + '15',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
            {formatDistance(item.distanceFromYou)} away
          </Text>
        </View>
      </View>

      {/* Route Info */}
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>📍</Text>
          <Text style={{ flex: 1, fontSize: 13, color: colors.text }}>
            {item.pickup.address}
          </Text>
        </View>
        <View
          style={{
            height: 20,
            marginLeft: 10,
            borderLeftWidth: 2,
            borderLeftColor: colors.primary,
          }}
        />
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>🎯</Text>
          <Text style={{ flex: 1, fontSize: 13, color: colors.text }}>
            {item.dropoff.address}
          </Text>
        </View>
      </View>

      {/* Journey Details */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: 12,
          backgroundColor: colors.background,
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
            Distance
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
            {formatDistance(item.distance)}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
            Duration
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
            {item.duration}min
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
            Your Earning
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
            ₦{(item.fare * 0.8).toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Fare Breakdown */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>Rider fare</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
          ₦{item.fare}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>Your commission (20%)</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
          ₦{(item.fare * 0.2).toFixed(0)}
        </Text>
      </View>

      {/* Accept Button */}
      <Button
        title={selectedRideId === item.id ? 'Accepting...' : 'Accept Ride'}
        onPress={() => handleAcceptRide(item.id)}
        isDark={isDark}
        disabled={selectedRideId !== null}
      />
    </Card>
  );

  if (isLoading && mockRides.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>
          Finding nearby rides...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>
          Available Rides
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
          {mockRides.length} rides within 5km
        </Text>
      </View>

      {/* Rides List */}
      {mockRides.length > 0 ? (
        <FlatList
          data={mockRides}
          renderItem={renderRideCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: scale(16), paddingBottom: scale(100) }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
            No rides available
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
            Check back soon or move to a more active area
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={{
              marginTop: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
