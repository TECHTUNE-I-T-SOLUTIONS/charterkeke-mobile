// 'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Switch,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import RiderBottomNavigation from '@/components/RiderBottomNavigation';
import { apiService } from '@/services/api';
import { COLORS } from '@/utils/colors';
import { STATUS_COLORS } from '@/utils/colors';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

type ColorScheme = typeof COLORS.light;

export default function DriverEarningsScreen() {
  const { mode } = useTheme();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const [isOnline, setIsOnline] = useState(true);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 8,
    }).start();
  }, [scaleAnim]);

  useEffect(() => {
    fetchEarningsData();
  }, [timeFilter]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      console.log(`📊 [EARNINGS] Fetching earnings for timeframe: ${timeFilter}`);
      
      // Map frontend filter names to backend parameter values
      const timeframeMap: Record<string, string> = {
        'today': 'day',
        'week': 'week',
        'month': 'month'
      };
      
      const timeframeValue = timeframeMap[timeFilter] || 'day';
      // Note: DO NOT include /api/ prefix - baseURL already has it
      const data = await apiService.get(`/driver/earnings?timeframe=${timeframeValue}`);
      console.log('✅ [EARNINGS] Earnings data:', data);
      
      // Backend returns { earnings: {...} }
      setEarningsData(data.earnings || {});
      setRecentRides(data.recentRides || []);
    } catch (error) {
      console.error('❌ [EARNINGS] Error fetching earnings:', error);
      setEarningsData({});
      setRecentRides([]);
    } finally {
      setLoading(false);
    }
  };

  const currentData = earningsData?.[timeFilter] || { total: 0, rides: 0, avgRating: 0, distances: 0, onlineTime: 0, estimate: 0 };

  const handleWithdraw = () => {
    // Navigate to withdrawal screen
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scale(100) }}>
        {/* Header with Online Status */}
        <LinearGradient
          colors={mode === 'dark' ? ['rgba(30, 30, 30, 0.8)', 'rgba(20, 20, 20, 0.6)'] : ['rgba(240, 240, 240, 0.8)', 'rgba(255, 255, 255, 0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: scale(20),
            paddingVertical: scale(16),
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text style={{ fontSize: scale(28), fontWeight: 'bold', color: colors.foreground }}>
              Earnings
            </Text>
            <Text style={{ fontSize: scale(12), color: colors.secondary, marginTop: 2 }}>
              Track your daily income
            </Text>
          </View>
          <View
            style={{
              alignItems: 'center',
              paddingHorizontal: scale(12),
              paddingVertical: scale(8),
              borderRadius: scale(8),
              backgroundColor: isOnline ? colors.primary + '15' : colors.secondary + '15',
            }}
          >
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={isOnline ? colors.primary : colors.secondary}
              style={{ marginBottom: 4 }}
            />
            <Text
              style={{
                fontSize: scale(10),
                color: isOnline ? colors.primary : colors.secondary,
                fontWeight: '600',
              }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </LinearGradient>

        {/* Main Earnings Card */}
        <Animated.View style={{ paddingHorizontal: scale(20), marginTop: scale(20), marginBottom: scale(12), transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={[colors.primary, colors.primary + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: scale(20),
              paddingVertical: scale(24),
              borderRadius: scale(12),
              shadowColor: colors.primary,
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text style={{ fontSize: scale(12), color: '#ffffff80', marginBottom: 8 }}>
              Total Earnings ({timeFilter === 'today' ? 'Today' : timeFilter === 'week' ? 'This Week' : 'This Month'})
            </Text>
            <Text style={{ fontSize: scale(40), fontWeight: 'bold', color: '#ffffff', marginBottom: scale(20) }}>
              ₦{currentData.total.toLocaleString()}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: scale(11), color: '#ffffff80', marginBottom: 4 }}>
                  Trips
                </Text>
                <Text style={{ fontSize: scale(18), fontWeight: 'bold', color: '#ffffff' }}>
                  {currentData.rides}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: scale(11), color: '#ffffff80', marginBottom: 4 }}>
                  Distance
                </Text>
                <Text style={{ fontSize: scale(18), fontWeight: 'bold', color: '#ffffff' }}>
                  {currentData.distances} km
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: scale(11), color: '#ffffff80', marginBottom: 4 }}>
                  Rating
                </Text>
                <Text style={{ fontSize: scale(18), fontWeight: 'bold', color: '#ffffff' }}>
                  {currentData.avgRating}★
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Time Filter */}
        <View style={{ paddingHorizontal: scale(20), flexDirection: 'row', gap: scale(8), marginBottom: scale(20) }}>
          {['today', 'week', 'month'].map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setTimeFilter(filter as 'today' | 'week' | 'month')}
              style={{
                paddingHorizontal: scale(16),
                paddingVertical: scale(8),
                borderRadius: scale(8),
                backgroundColor: timeFilter === filter ? colors.primary : colors.border + '30',
              }}
            >
              <Text
                style={{
                  fontSize: scale(12),
                  fontWeight: '600',
                  color: timeFilter === filter ? '#ffffff' : colors.mutedForeground,
                  textTransform: 'capitalize',
                }}
              >
                {filter === 'today' ? 'Today' : filter === 'week' ? 'Week' : 'Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={{ paddingHorizontal: scale(20), gap: scale(12), marginBottom: scale(20) }}>
          <Card isDark={mode === 'dark'}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginBottom: 8, fontWeight: '500' }}>
                  Online Time
                </Text>
                <Text style={{ fontSize: scale(18), fontWeight: 'bold', color: colors.foreground }}>
                  {Math.floor((currentData.onlineTime || 0) / 60)}h {(currentData.onlineTime || 0) % 60}m
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginBottom: 8, fontWeight: '500' }}>
                  Avg Per Trip
                </Text>
                <Text style={{ fontSize: scale(18), fontWeight: 'bold', color: colors.foreground }}>
                  ₦{currentData.rides > 0 ? Math.floor(currentData.total / currentData.rides).toLocaleString() : '0'}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginBottom: 8, fontWeight: '500' }}>
                  Hourly Rate
                </Text>
                <Text style={{ fontSize: scale(18), fontWeight: 'bold', color: colors.foreground }}>
                  ₦{(currentData.onlineTime || 0) > 0 ? Math.floor((currentData.total / currentData.onlineTime) * 60).toLocaleString() : '0'}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Commission Info */}
        <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
          <Card isDark={mode === 'dark'}>
            <View style={{ marginBottom: scale(12) }}>
              <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginBottom: 4, fontWeight: '500' }}>
                Platform Commission Rate
              </Text>
              <Text style={{ fontSize: scale(16), fontWeight: 'bold', color: colors.foreground }}>
                20%
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: scale(12),
                paddingVertical: scale(10),
                backgroundColor: colors.background,
                borderRadius: scale(6),
                marginTop: scale(12),
              }}
            >
              <Text style={{ fontSize: scale(11), color: colors.mutedForeground, lineHeight: scale(16) }}>
                Your earnings are calculated as 80% of the ride fare. Commission helps us maintain the platform and insurance.
              </Text>
            </View>
          </Card>
        </View>

        {/* Recent Rides Breakdown */}
        <View style={{ paddingHorizontal: scale(20), marginTop: scale(20), marginBottom: scale(12) }}>
          <Text style={{ fontSize: scale(16), fontWeight: 'bold', color: colors.foreground, marginBottom: scale(12) }}>
            Recent Trips
          </Text>

          <FlatList
            data={recentRides}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View
                key={item.id}
                style={{
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  borderRadius: scale(8),
                  backgroundColor: colors.background,
                  marginBottom: index < recentRides.length - 1 ? scale(8) : 0,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(8) }}>
                  <View>
                    <Text style={{ fontSize: scale(13), fontWeight: '600', color: colors.foreground, marginBottom: 2 }}>
                      {item.rider}
                    </Text>
                    <Text style={{ fontSize: scale(11), color: colors.mutedForeground }}>
                      {item.time} • {item.distance} • {item.duration}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                      {[...Array(5)].map((_, i) => (
                        <Text key={i} style={{ fontSize: scale(12), color: i < item.rating ? STATUS_COLORS.warning : colors.border }}>
                          ★
                        </Text>
                      ))}
                    </View>
                    <Text style={{ fontSize: scale(12), fontWeight: '600', color: STATUS_COLORS.success }}>
                      +₦{item.earnings}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: scale(8), borderTopWidth: 1, borderTopColor: colors.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: scale(10), color: colors.mutedForeground }}>
                      Fare
                    </Text>
                    <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground }}>
                      ₦{item.fare}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: scale(10), color: colors.mutedForeground }}>
                      Commission
                    </Text>
                    <Text style={{ fontSize: scale(12), fontWeight: '600', color: STATUS_COLORS.error }}>
                      -₦{item.commission}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: scale(10), color: colors.mutedForeground }}>
                      You Earn
                    </Text>
                    <Text style={{ fontSize: scale(12), fontWeight: 'bold', color: STATUS_COLORS.success }}>
                      ₦{item.earnings}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        </View>

        {/* Withdraw Button */}
        <View style={{ paddingHorizontal: scale(20), gap: scale(12), marginTop: scale(20) }}>
          <Button
            title={`Withdraw ₦${(currentData.total * 0.9).toFixed(0)}`}
            onPress={handleWithdraw}
            isDark={mode === 'dark'}
          />
          <TouchableOpacity
            style={{
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
                color: colors.mutedForeground,
                fontSize: scale(14),
              }}
            >
              View Full History
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </SafeAreaView>
      <RiderBottomNavigation />
    </View>
  );
}
