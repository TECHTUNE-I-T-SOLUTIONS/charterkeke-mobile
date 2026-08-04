// 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Easing,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRide } from '@/context/RideContext';
import { useLocation } from '@/context/LocationContext';
import { apiService } from '@/services/api';
import { supabaseService } from '@/services/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import { COLORS } from '@/utils/colors';

const { width, height } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;

// Map a persisted ride status to the local 4-step UI state.
const uiStatusFromRide = (status?: string): 'accepted' | 'arrived' | 'started' | 'completed' => {
  switch (String(status || '').toLowerCase()) {
    case 'in_progress':
      return 'started';
    case 'completed':
      return 'completed';
    default:
      return 'accepted';
  }
};

export default function DriverActiveRideScreen() {
  const router = useRouter();
  const { currentRide } = useRide();
  const { watchLocation } = useLocation();
  const { rideId: rideIdParam } = useLocalSearchParams<{ rideId: string }>();
  const [isDark] = useState(false);
  const [ride, setRide] = useState<any>(currentRide || null);
  const [rideStatus, setRideStatus] = useState<'accepted' | 'arrived' | 'started' | 'completed'>('accepted');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [odometer, setOdometer] = useState('0.0');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const colors = isDark ? COLORS.dark : COLORS.light;

  const rideId = String(ride?.id || rideIdParam || currentRide?.id || '');
  const progressAnimation = React.useRef(new Animated.Value(0)).current;

  // Load real ride data (params/currentRide -> active-rides).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        let resolved: any = currentRide || null;
        if (rideIdParam) {
          const list = await apiService.getActiveRides();
          const rides = list?.rides || [];
          resolved = rides.find((r: any) => String(r.id) === String(rideIdParam)) || resolved;
        } else if (!resolved) {
          const list = await apiService.getActiveRides();
          resolved = list?.rides?.[0] || null;
        }
        if (!cancelled && resolved) {
          setRide(resolved);
          setRideStatus(uiStatusFromRide(resolved.status));
        }
      } catch (err) {
        console.error('Failed to load driver active ride:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rideIdParam]);

  // Broadcast the driver's REAL location to the rider over Supabase Realtime
  // while the ride is active (accepted -> in_progress). This is what powers the
  // live driver marker on the rider's map.
  useEffect(() => {
    if (!rideId) return;
    if (rideStatus === 'completed') return;

    let unwatch: (() => void) | null = null;
    let active = true;

    (async () => {
      try {
        unwatch = await watchLocation((location) => {
          if (!active) return;
          supabaseService
            .broadcastRideLocation(rideId, {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: (location as any).accuracy ?? null,
              timestamp: (location as any).timestamp || 0,
              role: 'driver',
            })
            .catch(() => {});
        });
      } catch (err) {
        console.log('Failed to start driver location broadcast:', err);
      }
    })();

    return () => {
      active = false;
      if (unwatch) unwatch();
    };
  }, [rideId, rideStatus, watchLocation]);

  // Stop broadcasting once the ride is done.
  useEffect(() => {
    if (rideStatus === 'completed' && rideId) {
      supabaseService.unsubscribeRideLocation(rideId).catch(() => {});
    }
  }, [rideStatus, rideId]);

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: rideStatus === 'completed' ? 100 : rideStatus === 'started' ? 75 : rideStatus === 'arrived' ? 50 : 25,
      duration: 800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [rideStatus]);

  const riderUser = ride?.rider?.users || ride?.riders?.users || ride?.rider || null;
  const rider = {
    id: ride?.rider_id || '',
    name: riderUser
      ? `${riderUser.first_name || ''} ${riderUser.last_name || ''}`.trim() || 'Rider'
      : 'Rider',
    rating: ride?.rider?.average_rating ?? riderUser?.rating ?? 5,
    phone: riderUser?.phone_number || '',
    profileImage:
      riderUser?.profile_picture_url ||
      `https://avatar.vercel.sh/${ride?.rider_id || 'rider'}?size=200`,
  };

  const estimatedFare = Number(ride?.fare_amount || 0);

  // "I've Arrived" — notification-only, does NOT change ride status server-side.
  const handleArrived = useCallback(async () => {
    if (!rideId) return;
    setActionLoading(true);
    try {
      await apiService.notifyArrival(rideId);
      setRideStatus('arrived');
    } catch (err: any) {
      console.error('Notify arrival error:', err);
      Alert.alert('Error', err?.message || 'Failed to notify rider of arrival');
    } finally {
      setActionLoading(false);
    }
  }, [rideId]);

  // "Start Ride" — transitions the ride to in_progress (fires Trip Started push).
  const handleStartRide = useCallback(async () => {
    if (!rideId) return;
    setActionLoading(true);
    try {
      await apiService.updateRideStatus(rideId, 'in_progress');
      setRideStatus('started');
    } catch (err: any) {
      console.error('Start ride error:', err);
      Alert.alert('Error', err?.message || 'Failed to start ride');
    } finally {
      setActionLoading(false);
    }
  }, [rideId]);

  // "Complete Ride" — transitions to completed (fires Ride Completed push).
  // NOTE: calls updateRideStatus directly so it hits /driver/update-ride-status
  // (RideContext.completeRide uses a generic PUT that bypasses the push route).
  const handleCompleteRide = useCallback(async () => {
    if (!odometer) {
      Alert.alert('Error', 'Please enter the distance traveled');
      return;
    }
    if (!rideId) return;
    setActionLoading(true);
    try {
      await apiService.updateRideStatus(rideId, 'completed');
      setRideStatus('completed');
      await supabaseService.unsubscribeRideLocation(rideId).catch(() => {});
      router.replace('/driver/home');
    } catch (err: any) {
      console.error('Complete ride error:', err);
      Alert.alert('Error', err?.message || 'Failed to complete ride');
    } finally {
      setActionLoading(false);
    }
  }, [odometer, rideId]);

  const isLoading = loading || actionLoading;

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const StatusStep = ({ label, icon, isActive, isCompleted }: { label: string; icon: string; isActive: boolean; isCompleted: boolean }) => (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Animated.View
        style={{
          width: scale(44),
          height: scale(44),
          borderRadius: scale(22),
          backgroundColor: isCompleted ? colors.primary : isActive ? colors.primary : colors.border,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: scale(8),
          opacity: isActive ? 1 : 0.6,
        }}
      >
        <Text style={{ fontSize: scale(20) }}>{icon}</Text>
      </Animated.View>
      <Text
        style={{
          fontSize: scale(10),
          color: isActive ? colors.primary : colors.secondary,
          textAlign: 'center',
          fontWeight: isActive ? '600' : '400',
        }}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {isLoading ? (
        <ListScreenSkeleton itemCount={4} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Elegant Header */}
        <LinearGradient
          colors={isDark ? ['rgba(30, 30, 30, 0.8)', 'rgba(20, 20, 20, 0.6)'] : ['rgba(240, 240, 240, 0.8)', 'rgba(255, 255, 255, 0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: scale(20),
            paddingVertical: scale(16),
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: scale(28), fontWeight: 'bold', color: colors.text }}>
                Active Ride
              </Text>
              <Text style={{ fontSize: scale(12), color: colors.textSecondary, marginTop: 4 }}>
                Trip in progress
              </Text>
            </View>
            <TouchableOpacity
              style={{
                width: scale(44),
                height: scale(44),
                borderRadius: scale(8),
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons name="bell" size={scale(20)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Map Placeholder with Modern Design */}
        <View
          style={{
            height: verticalScale(250),
            backgroundColor: colors.border,
            marginHorizontal: scale(20),
            marginTop: scale(16),
            borderRadius: scale(12),
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MaterialCommunityIcons name="map" size={scale(48)} color={colors.secondary} opacity={0.3} />
          <Text style={{ fontSize: scale(14), color: colors.secondary, marginTop: 8, fontWeight: '500' }}>
            📍 Map View
          </Text>
          <Text style={{ fontSize: scale(12), color: colors.secondary, marginTop: 4 }}>
            Live tracking enabled
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={{ paddingHorizontal: scale(20), marginTop: scale(20), marginBottom: scale(16) }}>
          <View style={{ marginBottom: scale(12) }}>
            <Text style={{ fontSize: scale(12), color: colors.secondary, fontWeight: '500' }}>
              Trip Progress
            </Text>
          </View>
          <Animated.View
            style={{
              height: scale(4),
              backgroundColor: colors.border,
              borderRadius: scale(2),
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                height: '100%',
                backgroundColor: colors.primary,
                width: progressWidth,
              }}
            />
          </Animated.View>
        </View>

        {/* Status Steps */}
        <View
          style={{
            paddingHorizontal: scale(20),
            marginVertical: scale(20),
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}
        >
          <StatusStep label="Accepted" icon="✓" isActive={rideStatus === 'accepted'} isCompleted={['arrived', 'started', 'completed'].includes(rideStatus)} />
          <StatusStep label="Arrived" icon="📍" isActive={rideStatus === 'arrived'} isCompleted={['started', 'completed'].includes(rideStatus)} />
          <StatusStep label="Started" icon="▶" isActive={rideStatus === 'started'} isCompleted={rideStatus === 'completed'} />
          <StatusStep label="Completed" icon="✓" isActive={rideStatus === 'completed'} isCompleted={false} />
        </View>

        {/* Rider Info Card */}
        <Card isDark={isDark}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(12) }}>
            <Image
              source={{ uri: rider.profileImage }}
              style={{
                width: scale(56),
                height: scale(56),
                borderRadius: scale(28),
                marginRight: scale(12),
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: scale(16), fontWeight: 'bold', color: colors.foreground }}>
                {rider.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: scale(4) }}>
                <Text style={{ color: colors.primary, marginRight: 4, fontSize: scale(14) }}>★</Text>
                <Text style={{ fontSize: scale(13), color: colors.foreground }}>
                  {rider.rating} Rating
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={{
                width: scale(44),
                height: scale(44),
                borderRadius: scale(8),
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons name="phone" size={scale(18)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Route Details */}
        <Card isDark={isDark}>
          <View style={{ marginBottom: scale(12) }}>
            <Text style={{ fontSize: scale(12), color: colors.secondary, marginBottom: 4, fontWeight: '500' }}>
              From
            </Text>
            <Text style={{ fontSize: scale(14), fontWeight: '600', color: colors.foreground }}>
              📍 {ride?.pickup_zone || (currentRide?.pickupLocation as any)?.address || 'Pickup Location'}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: scale(12) }} />

          <View>
            <Text style={{ fontSize: scale(12), color: colors.secondary, marginBottom: 4, fontWeight: '500' }}>
              To
            </Text>
            <Text style={{ fontSize: scale(14), fontWeight: '600', color: colors.foreground }}>
              📍 {ride?.destination_zone || (currentRide as any)?.dropoffLocation?.address || 'Dropoff Location'}
            </Text>
          </View>
        </Card>

        {/* Distance & Fare (if ride ongoing) */}
        {rideStatus === 'started' && (
          <Card isDark={isDark}>
            <View style={{ marginBottom: scale(16) }}>
              <Text style={{ fontSize: scale(14), fontWeight: '600', color: colors.foreground, marginBottom: scale(12) }}>
                Ride Summary
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(12) }}>
                <Text style={{ color: colors.secondary }}>Distance Traveled</Text>
                <Text style={{ fontWeight: '600', color: colors.foreground }}>
                  {odometer} km
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(10),
                  borderRadius: scale(6),
                  backgroundColor: colors.background,
                  marginBottom: scale(12),
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: scale(12), color: colors.secondary, flex: 1 }}>
                  Update distance:
                </Text>
                <TextInput
                  value={odometer}
                  onChangeText={setOdometer}
                  placeholder="0.0"
                  keyboardType="decimal-pad"
                  style={{
                    width: scale(60),
                    paddingHorizontal: scale(8),
                    paddingVertical: scale(6),
                    borderRadius: scale(4),
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                  }}
                />
              </View>

              <View
                style={{
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  backgroundColor: colors.primary + '15',
                  borderRadius: scale(8),
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Text style={{ fontSize: scale(12), color: colors.secondary, marginBottom: 4 }}>
                  Estimated Earnings
                </Text>
                <Text style={{ fontSize: scale(18), fontWeight: 'bold', color: colors.primary }}>
                  ₦{(estimatedFare * 0.8).toFixed(0)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: scale(20), gap: scale(12), marginTop: scale(20) }}>
          {rideStatus === 'accepted' && (
            <>
              <Button
                title={actionLoading ? 'Notifying rider…' : "I've Arrived"}
                onPress={handleArrived}
                isDark={isDark}
                size="large"
                disabled={actionLoading || !rideId}
              />
              <TouchableOpacity
                onPress={() => setShowCancelConfirm(true)}
                style={{
                  paddingVertical: scale(12),
                  borderRadius: scale(8),
                  borderWidth: 2,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    fontSize: scale(14),
                  }}
                >
                  Cancel Ride
                </Text>
              </TouchableOpacity>
            </>
          )}

          {rideStatus === 'arrived' && (
            <Button
              title={actionLoading ? 'Starting…' : 'Start Ride'}
              onPress={handleStartRide}
              isDark={isDark}
              size="large"
              disabled={actionLoading || !rideId}
            />
          )}

          {rideStatus === 'started' && (
            <Button
              title={isLoading ? 'Completing...' : 'Complete Ride'}
              onPress={handleCompleteRide}
              isDark={isDark}
              size="large"
              disabled={!odometer || isLoading}
            />
          )}
        </View>
        </ScrollView>
      )}

      {/* Cancel Confirmation */}
      {showCancelConfirm && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
            zIndex: 1000,
            paddingHorizontal: scale(20),
            paddingBottom: scale(20),
          }}
        >
          <Card isDark={isDark}>
            <Text
              style={{
                fontSize: scale(18),
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: scale(12),
              }}
            >
              Cancel Ride?
            </Text>
            <Text
              style={{
                fontSize: scale(14),
                color: colors.textSecondary,
                marginBottom: scale(20),
              }}
            >
              Are you sure? This may affect your rating.
            </Text>
            <View style={{ flexDirection: 'row', gap: scale(12) }}>
              <TouchableOpacity
                onPress={() => setShowCancelConfirm(false)}
                style={{
                  flex: 1,
                  paddingVertical: scale(12),
                  borderRadius: scale(8),
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontWeight: '600',
                    color: colors.foreground,
                    fontSize: scale(14),
                  }}
                >
                  Keep Ride
                </Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowCancelConfirm(false);
                    router.replace('/driver/home');
                  }}
                  isDark={isDark}
                />
              </View>
            </View>
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}
