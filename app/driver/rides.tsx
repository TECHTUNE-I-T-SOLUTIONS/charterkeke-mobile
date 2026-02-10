// 'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { apiService } from '@services/api';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import RiderBottomNavigation from '@components/RiderBottomNavigation';
import { COLORS } from '@utils/colors';
import { formatCurrency, formatDistance, formatDuration } from '@utils/formatting';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

interface RideItem {
  id: string;
  rider?: {
    name?: string;
    first_name?: string;
    last_name?: string;
    rating?: number;
  };
  users?: {
    name?: string;
    first_name?: string;
    last_name?: string;
    rating?: number;
  };
  pickup_location?: string;
  destination_location?: string;
  pickup_zone?: string;
  destination_zone?: string;
  estimated_fare?: number;
  fare?: number;
  distance?: number;
  estimated_time?: number;
  status?: string;
  created_at?: string;
  started_at?: string;
}

export default function RidesListScreen() {
  const router = useRouter();
  const { mode } = useTheme();
  const [rides, setRides] = useState<RideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'available' | 'history'>('active');

  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;

  useFocusEffect(
    React.useCallback(() => {
      fetchRides();
    }, [activeTab])
  );

  const fetchRides = async () => {
    try {
      setLoading(true);
      console.log(`📋 [RIDES-LIST] Fetching ${activeTab} rides...`);
      
      let data;
      if (activeTab === 'active') {
        const response = await apiService.getActiveRides();
        data = response?.rides || response || [];
      } else if (activeTab === 'available') {
        const response = await apiService.get('/driver/available-rides?radiusKm=10').catch(() => ({ rides: [] }));
        data = (response as any)?.rides || response || [];
      } else {
        const response = await apiService.getTransactions(1);
        data = response?.rides || response || [];
      }
      
      console.log('✅ [RIDES-LIST] Fetched rides:', data);
      setRides(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ [RIDES-LIST] Failed to fetch rides:', error);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRides();
    setRefreshing(false);
  };

  const handleRideTap = (ride: RideItem) => {
    console.log('🔹 [RIDES-LIST] Navigating to ride details:', ride.id);
    router.push({
      pathname: '/driver/ride-details',
      params: {
        rideId: ride.id,
        rideData: JSON.stringify(ride), // Pass full ride object
      },
    });
  };

  const getRiderName = (ride: RideItem) => {
    return ride.users?.first_name || ride.rider?.first_name || ride.users?.name || 'Unknown';
  };

  const getRiderRating = (ride: RideItem) => {
    return ride.users?.rating || ride.rider?.rating || 4.5;
  };

  const getRideDistance = (ride: RideItem) => {
    const distance = (ride as any)?.distance_km || ride.distance;
    return distance ? `${distance}km` : 'N/A';
  };

  const getRideFare = (ride: RideItem) => {
    const fare = (ride as any)?.driver_earnings || (ride as any)?.fare_amount || ride.fare || ride.estimated_fare || 0;
    return formatCurrency(fare);
  };

  const getRideTime = (ride: RideItem) => {
    const date = (ride as any)?.pickup_time || ride.created_at;
    return date ? new Date(date).toLocaleDateString() : 'N/A';
  };

  const handleAcceptRide = async (ride: RideItem) => {
    try {
      console.log('✅ [RIDES-LIST] Accepting ride:', ride.id);
      const response = await apiService.put(`/driver/rides/${ride.id}`, { status: 'accepted' });
      if (response) {
        Alert.alert('Success', 'Ride accepted! You will be contacted soon.');
        fetchRides();
      }
    } catch (error) {
      console.error('❌ [RIDES-LIST] Accept error:', error);
      Alert.alert('Error', 'Failed to accept ride');
    }
  };

  const handleHideRide = (ride: RideItem) => {
    console.log('👁️ [RIDES-LIST] Hiding ride:', ride.id);
    // Remove from list locally
    setRides(rides.filter(r => r.id !== ride.id));
  };

  const renderRideCard = ({ item: ride }: { item: RideItem }) => (
    <View
      style={{
        marginBottom: scale(12),
        marginHorizontal: scale(3),
      }}
    >
      <TouchableOpacity 
        onPress={() => handleRideTap(ride)}
        disabled={activeTab === 'available'}
      >
        <Card style={{
          paddingHorizontal: scale(12),
          paddingVertical: scale(12),
          borderRadius: scale(12),
          backgroundColor: colors.card,
          borderLeftWidth: 4,
          borderLeftColor: ride.status === 'completed' ? '#10b981' : '#3b82f6',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: scale(8) }}>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: colors.foreground, 
                fontSize: scale(14), 
                fontWeight: '600',
                marginBottom: scale(2),
              }}>
                {getRiderName(ride)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="star" size={14} color="#fbbf24" />
                <Text style={{ color: colors.mutedForeground, fontSize: scale(12), marginLeft: scale(4) }}>
                  {getRiderRating(ride).toFixed(1)}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.primary, fontSize: scale(14), fontWeight: '700' }}>
                {getRideFare(ride)}
              </Text>
              <Text style={{ 
                color: ride.status === 'completed' ? '#10b981' : '#3b82f6',
                fontSize: scale(11),
                fontWeight: '500',
                marginTop: scale(2),
                textTransform: 'capitalize',
              }}>
                {ride.status || 'Pending'}
              </Text>
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: scale(8), marginTop: scale(8) }}>
            <View style={{ marginBottom: scale(6) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, fontSize: scale(12), marginLeft: scale(6), flex: 1 }}>
                  {ride.pickup_zone || ride.pickup_location || 'Pickup'}
                </Text>
              </View>
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
                <Text style={{ color: colors.mutedForeground, fontSize: scale(12), marginLeft: scale(6), flex: 1, opacity: 0.7 }}>
                  {ride.destination_zone || ride.destination_location || 'Destination'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: scale(8), paddingTop: scale(8), borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.mutedForeground, fontSize: scale(11) }}>Distance</Text>
              <Text style={{ color: colors.foreground, fontSize: scale(12), fontWeight: '600', marginTop: scale(2) }}>
                {getRideDistance(ride)}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.mutedForeground, fontSize: scale(11) }}>Duration</Text>
              <Text style={{ color: colors.foreground, fontSize: scale(12), fontWeight: '600', marginTop: scale(2) }}>
                {ride.estimated_time ? `${ride.estimated_time}m` : 'N/A'}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.mutedForeground, fontSize: scale(11) }}>Date</Text>
              <Text style={{ color: colors.foreground, fontSize: scale(12), fontWeight: '600', marginTop: scale(2) }}>
                {getRideTime(ride)}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
      
      {/* Action Buttons for Available Rides */}
      {activeTab === 'available' && (
        <View style={{ flexDirection: 'row', gap: scale(8), marginTop: scale(8), paddingHorizontal: scale(3) }}>
          <TouchableOpacity
            onPress={() => handleAcceptRide(ride)}
            style={{
              flex: 1,
              paddingVertical: scale(10),
              paddingHorizontal: scale(12),
              backgroundColor: '#10b981',
              borderRadius: scale(8),
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: scale(6),
            }}
          >
            <MaterialCommunityIcons name="check-circle" size={scale(16)} color="#fff" />
            <Text style={{ color: '#fff', fontSize: scale(12), fontWeight: '600' }}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleHideRide(ride)}
            style={{
              flex: 1,
              paddingVertical: scale(10),
              paddingHorizontal: scale(12),
              backgroundColor: colors.card,
              borderRadius: scale(8),
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: scale(6),
            }}
          >
            <MaterialCommunityIcons name="eye-off" size={scale(16)} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: scale(12), fontWeight: '600' }}>Hide</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const emptyState = (
    <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: scale(60) }}>
      <MaterialCommunityIcons name="inbox" size={48} color={colors.mutedForeground} />
      <Text style={{ color: colors.mutedForeground, fontSize: scale(14), marginTop: scale(12), textAlign: 'center' }}>
        {activeTab === 'active' ? 'No active rides' : 'No ride history'}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: scale(16), paddingBottom: scale(8) }}>
          <Text style={{ color: colors.foreground, fontSize: scale(24), fontWeight: '700', marginBottom: scale(16) }}>
            Your Rides
          </Text>

          {/* Tab buttons */}
          <View style={{ flexDirection: 'row', gap: scale(8) }}>
            <TouchableOpacity
              onPress={() => setActiveTab('active')}
              style={{
                flex: 1,
                paddingVertical: scale(8),
                paddingHorizontal: scale(12),
                backgroundColor: activeTab === 'active' ? colors.primary : colors.card,
                borderRadius: scale(8),
              }}
            >
              <Text style={{
                color: activeTab === 'active' ? '#fff' : colors.mutedForeground,
                fontSize: scale(13),
                fontWeight: '600',
                textAlign: 'center',
              }}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('available')}
              style={{
                flex: 1,
                paddingVertical: scale(8),
                paddingHorizontal: scale(12),
                backgroundColor: activeTab === 'available' ? colors.primary : colors.card,
                borderRadius: scale(8),
              }}
            >
              <Text style={{
                color: activeTab === 'available' ? '#fff' : colors.mutedForeground,
                fontSize: scale(13),
                fontWeight: '600',
                textAlign: 'center',
              }}>
                Available
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('history')}
              style={{
                flex: 1,
                paddingVertical: scale(8),
                paddingHorizontal: scale(12),
                backgroundColor: activeTab === 'history' ? colors.primary : colors.card,
                borderRadius: scale(8),
              }}
            >
              <Text style={{
                color: activeTab === 'history' ? '#fff' : colors.mutedForeground,
                fontSize: scale(13),
                fontWeight: '600',
                textAlign: 'center',
              }}>
                History
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={rides}
            renderItem={renderRideCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: scale(12),
              paddingVertical: scale(12),
              paddingBottom: scale(100),
              flexGrow: 1,
            }}
            ListEmptyComponent={emptyState}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </SafeAreaView>
      <RiderBottomNavigation />
    </View>
  );
}
