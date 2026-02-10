// 'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '@context/ThemeContext';
import { apiService } from '@services/api';
import Button from '@components/ui/Button';
import { COLORS } from '@utils/colors';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

export default function RideDetailsScreen() {
  const router = useRouter();
  const { rideId, rideData } = useLocalSearchParams();
  const { mode } = useTheme();
  const [ride, setRide] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;

  useEffect(() => {
    // Load ride from navigation params
    if (rideData) {
      try {
        const parsedRide = typeof rideData === 'string' ? JSON.parse(rideData) : rideData;
        console.log('✅ [RIDE-DETAILS] Loaded ride from params:', parsedRide);
        setRide(parsedRide);
      } catch (error) {
        console.error('❌ [RIDE-DETAILS] Error parsing ride data:', error);
        setRide(null);
      }
    } else {
      console.warn('⚠️ [RIDE-DETAILS] No rideData provided in navigation params');
      setRide(null);
    }
  }, [rideData]);

  const handleStatusUpdate = async (newStatus: 'in_progress' | 'completed') => {
    if (!rideId) return;

    try {
      setUpdating(true);
      await apiService.updateRideStatus(rideId as string, newStatus);

      const statusText = newStatus === 'in_progress' ? 'Passenger picked up' : 'Ride completed';
      Alert.alert('Success', statusText);

      // Update local ride state
      setRide((prev: any) => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('❌ [RIDE-DETAILS] Error updating status:', error);
      Alert.alert('Error', 'Failed to update ride status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCallPassenger = () => {
    if (ride?.users?.phone_number) {
      Linking.openURL(`tel:${ride.users.phone_number}`);
    }
  };

  if (!ride) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ alignItems: 'center', paddingHorizontal: scale(16) }}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.mutedForeground} />
          <Text style={{ color: colors.foreground, textAlign: 'center', marginTop: scale(12), fontSize: scale(14), fontWeight: '600' }}>
            Ride not found
          </Text>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{
              marginTop: scale(20),
              paddingHorizontal: scale(20),
              paddingVertical: scale(12),
              backgroundColor: colors.primary,
              borderRadius: scale(8)
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in_progress':
        return '#f59e0b';
      default:
        return colors.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'in_progress':
        return 'progress-clock';
      default:
        return 'clock-outline';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
        {/* Header */}
        <LinearGradient
          colors={(mode === 'dark') ? ['rgba(45, 45, 45, 0.6)', 'rgba(30, 30, 30, 0.4)'] : ['rgba(245, 245, 245, 0.8)', 'rgba(250, 250, 250, 0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: scale(16),
            paddingVertical: scale(14),
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: scale(40),
              height: scale(40),
              borderRadius: scale(8),
              backgroundColor: (mode === 'dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialCommunityIcons name="chevron-left" size={scale(24)} color={colors.foreground} />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: scale(18),
              fontWeight: '700',
              color: colors.foreground,
              flex: 1,
              marginLeft: scale(12),
            }}
          >
            Ride Details
          </Text>

          <View
            style={{
              paddingHorizontal: scale(12),
              paddingVertical: scale(6),
              backgroundColor: getStatusColor(ride.status) + '20',
              borderRadius: scale(8),
              flexDirection: 'row',
              alignItems: 'center',
              gap: scale(4),
            }}
          >
            <MaterialCommunityIcons
              name={getStatusIcon(ride.status)}
              size={scale(12)}
              color={getStatusColor(ride.status)}
            />
            <Text
              style={{
                fontSize: scale(10),
                fontWeight: '700',
                color: getStatusColor(ride.status),
                textTransform: 'capitalize',
              }}
            >
              {ride.status || 'pending'}
            </Text>
          </View>
        </LinearGradient>

        {/* Map */}
        <View
          style={{
            height: scale(250),
            marginVertical: scale(16),
            marginHorizontal: scale(16),
            borderRadius: scale(14),
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: 6.5244,
              longitude: 3.3792,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            {ride.pickup_description && (
              <Marker
                coordinate={{
                  latitude: parseFloat((ride.pickup_description.match(/Lat:\s*([\d.-]+)/) || ['', '6.5244'])[1]),
                  longitude: parseFloat((ride.pickup_description.match(/Lng:\s*([\d.-]+)/) || ['', '3.3792'])[1]),
                }}
                title="Pickup"
                pinColor="green"
              />
            )}
            {ride.destination_description && (
              <Marker
                coordinate={{
                  latitude: parseFloat((ride.destination_description.match(/Lat:\s*([\d.-]+)/) || ['', '6.6244'])[1]),
                  longitude: parseFloat((ride.destination_description.match(/Lng:\s*([\d.-]+)/) || ['', '3.4792'])[1]),
                }}
                title="Dropoff"
                pinColor="red"
              />
            )}
          </MapView>
        </View>

        {/* Passenger Info Card */}
        <View style={{ marginHorizontal: scale(16), marginBottom: scale(16) }}>
          <Text style={{ fontSize: scale(13), fontWeight: '700', color: colors.foreground, marginBottom: scale(10), textTransform: 'uppercase', opacity: 0.7 }}>
            Passenger Information
          </Text>
          <LinearGradient
            colors={(mode === 'dark') ? ['rgba(45,45,45,0.5)', 'rgba(35,35,35,0.3)'] : ['rgba(255,255,255,0.5)', 'rgba(248,249,250,0.3)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: scale(12), overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
          >
            <View style={{ padding: scale(14), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: scale(15), fontWeight: '700', color: colors.foreground }}>
                  {ride.users?.first_name} {ride.users?.last_name}
                </Text>
                <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginTop: scale(4), fontWeight: '500' }}>
                  {ride.users?.phone_number}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCallPassenger}
                style={{
                  backgroundColor: colors.primary,
                  width: scale(44),
                  height: scale(44),
                  borderRadius: scale(10),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons name="phone" size={scale(20)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Route Info Card */}
        <View style={{ marginHorizontal: scale(16), marginBottom: scale(16) }}>
          <Text style={{ fontSize: scale(13), fontWeight: '700', color: colors.foreground, marginBottom: scale(10), textTransform: 'uppercase', opacity: 0.7 }}>
            Route Details
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: scale(12),
              padding: scale(14),
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Pickup */}
            <View style={{ marginBottom: scale(16) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(8) }}>
                <View
                  style={{
                    width: scale(28),
                    height: scale(28),
                    borderRadius: scale(6),
                    backgroundColor: '#10b98120',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="map-marker" size={scale(16)} color="#10b981" />
                </View>
                <Text style={{ fontSize: scale(11), color: colors.mutedForeground, marginLeft: scale(10), fontWeight: '600', textTransform: 'uppercase', opacity: 0.8 }}>
                  Pickup Location
                </Text>
              </View>
              <Text style={{ fontSize: scale(14), fontWeight: '600', color: colors.foreground, marginLeft: scale(38) }}>
                {ride.pickup_zone}
              </Text>
            </View>

            {/* Divider with line */}
            <View style={{ height: scale(28), justifyContent: 'center', alignItems: 'center', marginLeft: scale(13) }}>
              <View
                style={{
                  width: scale(2),
                  height: scale(16),
                  backgroundColor: colors.border,
                }}
              />
              <MaterialCommunityIcons name="chevron-down" size={scale(16)} color={colors.mutedForeground} />
            </View>

            {/* Dropoff */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(8) }}>
                <View
                  style={{
                    width: scale(28),
                    height: scale(28),
                    borderRadius: scale(6),
                    backgroundColor: '#ef444420',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="map-marker" size={scale(16)} color="#ef4444" />
                </View>
                <Text style={{ fontSize: scale(11), color: colors.mutedForeground, marginLeft: scale(10), fontWeight: '600', textTransform: 'uppercase', opacity: 0.8 }}>
                  Drop-off Location
                </Text>
              </View>
              <Text style={{ fontSize: scale(14), fontWeight: '600', color: colors.foreground, marginLeft: scale(38) }}>
                {ride.destination_zone}
              </Text>
            </View>
          </View>
        </View>

        {/* Trip Details Card */}
        <View style={{ marginHorizontal: scale(16), marginBottom: scale(16) }}>
          <Text style={{ fontSize: scale(13), fontWeight: '700', color: colors.foreground, marginBottom: scale(10), textTransform: 'uppercase', opacity: 0.7 }}>
            Trip Details
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: scale(12),
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', paddingVertical: scale(14), paddingHorizontal: scale(14), borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <MaterialCommunityIcons name="map-marker" size={scale(18)} color={colors.primary} />
                <Text style={{ fontSize: scale(11), color: colors.mutedForeground, marginTop: scale(4), fontWeight: '600' }}>Distance</Text>
                <Text style={{ fontSize: scale(14), fontWeight: '700', color: colors.foreground, marginTop: scale(3) }}>
                  {ride.distance_km?.toFixed(1) || '0'} km
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: colors.border, marginVertical: scale(4) }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <MaterialCommunityIcons name="clock-outline" size={scale(18)} color={colors.primary} />
                <Text style={{ fontSize: scale(11), color: colors.mutedForeground, marginTop: scale(4), fontWeight: '600' }}>Duration</Text>
                <Text style={{ fontSize: scale(14), fontWeight: '700', color: colors.foreground, marginTop: scale(3) }}>
                  {ride.estimated_duration || '0'} min
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: colors.border, marginVertical: scale(4) }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <MaterialCommunityIcons name="clock-start" size={scale(18)} color={colors.primary} />
                <Text style={{ fontSize: scale(11), color: colors.mutedForeground, marginTop: scale(4), fontWeight: '600' }}>Requested</Text>
                <Text style={{ fontSize: scale(14), fontWeight: '700', color: colors.foreground, marginTop: scale(3) }}>
                  {new Date(ride.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>

            {/* Status Row */}
            <View style={{ padding: scale(14), backgroundColor: (mode === 'dark') ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: scale(12), color: colors.mutedForeground, fontWeight: '600' }}>Current Status</Text>
                <View
                  style={{
                    paddingHorizontal: scale(10),
                    paddingVertical: scale(5),
                    backgroundColor: getStatusColor(ride.status) + '20',
                    borderRadius: scale(6),
                  }}
                >
                  <Text style={{ fontSize: scale(12), fontWeight: '700', color: getStatusColor(ride.status), textTransform: 'capitalize' }}>
                    {ride.status || 'pending'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Fare Breakdown Card */}
        <View style={{ marginHorizontal: scale(16), marginBottom: scale(24) }}>
          <Text style={{ fontSize: scale(13), fontWeight: '700', color: colors.foreground, marginBottom: scale(10), textTransform: 'uppercase', opacity: 0.7 }}>
            Fare Breakdown
          </Text>
          <LinearGradient
            colors={(mode === 'dark') ? ['rgba(16, 185, 129, 0.05)', 'rgba(16, 185, 129, 0.02)'] : ['rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: scale(12),
              padding: scale(14),
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ marginBottom: scale(12), flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.mutedForeground, fontSize: scale(13), fontWeight: '500' }}>Fare Amount</Text>
              <Text style={{ fontWeight: '700', color: colors.foreground, fontSize: scale(13) }}>
                ₦{(ride.fare_amount || 0).toLocaleString()}
              </Text>
            </View>
            <View style={{ marginBottom: scale(12), flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.mutedForeground, fontSize: scale(13), fontWeight: '500' }}>Platform Fee</Text>
              <Text style={{ fontWeight: '700', color: colors.foreground, fontSize: scale(13) }}>
                ₦{(ride.platform_fee || 0).toLocaleString()}
              </Text>
            </View>
            <View style={{ height: scale(1), backgroundColor: colors.border, marginVertical: scale(12) }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '700', color: colors.foreground, fontSize: scale(14) }}>You Earn</Text>
              <Text style={{ fontWeight: '800', color: '#10b981', fontSize: scale(16) }}>
                ₦{(ride.driver_earnings || 0).toLocaleString()}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={{ marginHorizontal: scale(16), marginBottom: scale(24), gap: scale(10) }}>
          {ride.status === 'accepted' && (
            <Button
              title="Mark Picked Up"
              loading={updating}
              onPress={() => handleStatusUpdate('in_progress')}
            />
          )}

          {ride.status === 'in_progress' && (
            <Button
              title="Mark Completed"
              loading={updating}
              onPress={() => handleStatusUpdate('completed')}
            />
          )}

          {(ride.status === 'accepted' || ride.status === 'in_progress') && (
            <Button
              title="Call Passenger"
              onPress={handleCallPassenger}
            />
          )}

          {ride.status === 'completed' && (
            <Button
              title="Back to Rides"
              onPress={() => router.back()}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
