// 'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import RiderBottomNavigation from '@/components/RiderBottomNavigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { COLORS } from '@/utils/colors';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

export default function DriverProfileScreen() {
  const router = useRouter();
  const { user, logout, clearCache } = useAuth();
  const { mode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [driverDetails, setDriverDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;

  useFocusEffect(
    React.useCallback(() => {
      fetchDriverDetails();
    }, [])
  );

  const fetchDriverDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDriverDetails();
      console.log('✅ [DRIVER-PROFILE] Fetched driver details:', data);
      // Use the 'combined' property which has all merged driver + user data
      // Fallback: use driver data or user data if combined is not available
      const mergedData = data.combined || data.driver || data.user || data;
      setDriverDetails(mergedData);
    } catch (error) {
      console.error('❌ [DRIVER-PROFILE] Error fetching driver details:', error);
      setDriverDetails(user);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('📤 [DRIVER-PROFILE] Logging out...');
      router.replace('/');
      if (clearCache) await clearCache();
      await logout();
      console.log('✅ [DRIVER-PROFILE] Logout successful');
    } catch (error) {
      console.error('❌ [DRIVER-PROFILE] Logout error:', error);
    }
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+2341234567890');
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const driverData = driverDetails || {};

  const menuItems = [
    { title: 'Edit Profile', icon: '✏️' },
    { title: 'Verify Documents', icon: '✅' },
    { title: 'Vehicle Details', icon: '🚗' },
    { title: 'Bank Accounts', icon: '🏦' },
  ];

  const settingsItems = [
    { title: 'Language', value: 'English', icon: '🌐' },
    { title: 'Currency', value: 'NGN (₦)', icon: '💱' },
    { title: 'Privacy Policy', icon: '🔒' },
    { title: 'Terms & Conditions', icon: '📋' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scale(100) }}>
        {/* Header */}
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
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={scale(24)} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontSize: scale(24), fontWeight: 'bold', color: colors.foreground }}>
            Profile
          </Text>
          <TouchableOpacity
            style={{
              width: scale(44),
              height: scale(44),
              borderRadius: scale(8),
              backgroundColor: colors.card,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialCommunityIcons name="cog" size={scale(20)} color={colors.primary} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Profile Header Card */}
        <View style={{ marginHorizontal: scale(16), marginTop: scale(16), marginBottom: scale(16) }}>
          <View style={{ backgroundColor: colors.card, borderRadius: scale(16), padding: scale(16), borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(16) }}>
              <Image
                source={{ uri: driverData?.profile_picture_url || driverData?.avatar || 'https://via.placeholder.com/200' }}
                style={{
                  width: scale(80),
                  height: scale(80),
                  borderRadius: scale(40),
                  marginRight: scale(16),
                  backgroundColor: colors.border,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: scale(18),
                    fontWeight: 'bold',
                    color: colors.foreground,
                    marginBottom: 4,
                  }}
                >
                  {driverData?.first_name || 'Driver'} {driverData?.last_name || ''}
                </Text>
                <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginBottom: 2 }}>
                  {driverData?.email || user?.email || ''}
                </Text>
                <Text style={{ fontSize: scale(11), color: colors.mutedForeground }}>
                  {driverData?.vehicle_type ? driverData.vehicle_type.toUpperCase() : 'Vehicle'} • {driverData?.plate_number || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: scale(16),
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginBottom: 4 }}>
                  Rating
                </Text>
                <Text style={{ fontSize: scale(18), fontWeight: 'bold', color: '#f59e0b' }}>
                  {(driverData?.average_rating || 5).toFixed(1)}★
                </Text>
              </View>
              <View
                style={{
                  width: 1,
                  backgroundColor: colors.border,
                }}
              />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginBottom: 4 }}>
                  Total Rides
                </Text>
                <Text style={{ fontSize: scale(18), fontWeight: 'bold', color: colors.primary }}>
                  {driverData?.total_rides_completed || 0}
                </Text>
              </View>
              <View
                style={{
                  width: 1,
                  backgroundColor: colors.border,
                }}
              />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginBottom: 4 }}>
                  Earnings
                </Text>
                <Text style={{ fontSize: scale(16), fontWeight: 'bold', color: '#10b981' }}>
                  ₦{(driverData?.total_earnings || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Driver Details Card */}
        <View style={{ marginHorizontal: scale(16), marginBottom: scale(16) }}>
          <View style={{ backgroundColor: colors.card, borderRadius: scale(12), padding: scale(16), borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: scale(14), fontWeight: '600', color: colors.foreground, marginBottom: scale(12) }}>Details</Text>
            
            <View style={{ gap: scale(12) }}>
              {/* Phone */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialCommunityIcons name="phone" size={scale(18)} color={colors.primary} />
                  <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginLeft: scale(8) }}>Phone</Text>
                </View>
                <Text style={{ fontSize: scale(13), color: colors.foreground, fontWeight: '500' }}>
                  {driverData?.phone_number || 'N/A'}
                </Text>
              </View>

              {/* Email */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialCommunityIcons name="email" size={scale(18)} color={colors.primary} />
                  <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginLeft: scale(8) }}>Email</Text>
                </View>
                <Text style={{ fontSize: scale(12), color: colors.foreground, fontWeight: '500' }}>
                  {driverData?.email || 'N/A'}
                </Text>
              </View>

              {/* License */}
              <TouchableOpacity
                onPress={() => {
                  if (driverData?.license_picture_url) {
                    router.push({
                      pathname: '/driver/document-viewer',
                      params: { url: driverData.license_picture_url, title: 'Driver License' },
                    });
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialCommunityIcons name="card-account-details" size={scale(18)} color={colors.primary} />
                  <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginLeft: scale(8) }}>License</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: scale(12), color: colors.foreground, fontWeight: '500', marginRight: scale(6) }}>
                    {driverData?.license_picture_url ? 'View' : 'N/A'}
                  </Text>
                  {driverData?.license_picture_url && <MaterialCommunityIcons name="chevron-right" size={scale(18)} color={colors.primary} />}
                </View>
              </TouchableOpacity>

              {/* Vehicle Type */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialCommunityIcons name="car" size={scale(18)} color={colors.primary} />
                  <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginLeft: scale(8) }}>Vehicle Type</Text>
                </View>
                <Text style={{ fontSize: scale(12), color: colors.foreground, fontWeight: '500', textTransform: 'uppercase' }}>
                  {driverData?.vehicle_type || 'N/A'}
                </Text>
              </View>

              {/* Plate Number */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialCommunityIcons name="shield-account" size={scale(18)} color={colors.primary} />
                  <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginLeft: scale(8) }}>Plate Number</Text>
                </View>
                <Text style={{ fontSize: scale(12), color: colors.foreground, fontWeight: '500' }}>
                  {driverData?.plate_number || 'N/A'}
                </Text>
              </View>

              {/* Union */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialCommunityIcons name="shield-account" size={scale(18)} color={colors.primary} />
                  <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginLeft: scale(8) }}>Union</Text>
                </View>
                <Text style={{ fontSize: scale(12), color: colors.foreground, fontWeight: '500' }}>
                  {driverData?.union_name || 'N/A'}
                </Text>
              </View>

              {/* Bank */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialCommunityIcons name="bank" size={scale(18)} color={colors.primary} />
                  <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginLeft: scale(8) }}>Bank</Text>
                </View>
                <Text style={{ fontSize: scale(12), color: colors.foreground, fontWeight: '500' }}>
                  {driverData?.bank_name || 'N/A'}
                </Text>
              </View>

              {/* Account Number */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialCommunityIcons name="account-cash" size={scale(18)} color={colors.primary} />
                  <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginLeft: scale(8) }}>Account</Text>
                </View>
                <Text style={{ fontSize: scale(12), color: colors.foreground, fontWeight: '500' }}>
                  {driverData?.bank_account_number || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status Card */}
        <View style={{ marginHorizontal: scale(16), marginBottom: scale(16) }}>
          <View style={{ backgroundColor: colors.card, borderRadius: scale(12), padding: scale(16), borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: scale(14), fontWeight: '600', color: colors.foreground, marginBottom: scale(12) }}>Status</Text>
            
            <View style={{ gap: scale(12) }}>
              {/* Availability */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons 
                    name={driverData?.availability_status === 'online' ? 'check-circle' : 'clock-outline'} 
                    size={scale(18)} 
                    color={driverData?.availability_status === 'online' ? '#10b981' : '#f59e0b'} 
                  />
                  <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginLeft: scale(8) }}>Availability</Text>
                </View>
                <View style={{
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(6),
                  backgroundColor: driverData?.availability_status === 'online' ? '#10b98120' : '#f59e0b20',
                  borderRadius: scale(6),
                }}>
                  <Text style={{
                    fontSize: scale(12),
                    fontWeight: '600',
                    color: driverData?.availability_status === 'online' ? '#10b981' : '#f59e0b',
                    textTransform: 'capitalize'
                  }}>
                    {driverData?.availability_status || 'offline'}
                  </Text>
                </View>
              </View>

              {/* Verification */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons 
                    name={driverData?.verified ? 'shield-check' : 'shield-alert'} 
                    size={scale(18)} 
                    color={driverData?.verified ? '#10b981' : '#ef4444'} 
                  />
                  <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginLeft: scale(8) }}>Verification</Text>
                </View>
                <Text style={{ 
                  fontSize: scale(12), 
                  fontWeight: '600', 
                  color: driverData?.verified ? '#10b981' : '#ef4444' 
                }}>
                  {driverData?.verified ? 'Verified' : 'Unverified'}
                </Text>
              </View>

              {/* Profile Complete */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons 
                    name={driverData?.profile_complete ? 'check-circle' : 'alert-circle'} 
                    size={scale(18)} 
                    color={driverData?.profile_complete ? '#10b981' : '#f59e0b'} 
                  />
                  <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginLeft: scale(8) }}>Profile</Text>
                </View>
                <Text style={{ 
                  fontSize: scale(12), 
                  fontWeight: '600', 
                  color: driverData?.profile_complete ? '#10b981' : '#f59e0b' 
                }}>
                  {driverData?.profile_complete ? 'Complete' : 'Incomplete'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Settings Menu */}
        <View style={{ marginHorizontal: scale(16), marginBottom: scale(16) }}>
          <View style={{ backgroundColor: colors.card, borderRadius: scale(12), padding: scale(16), borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: scale(14), fontWeight: '600', color: colors.foreground, marginBottom: scale(12) }}>
              Settings
            </Text>

            <View style={{ gap: scale(12) }}>
              {[
                { title: 'Edit Profile', icon: 'pencil', color: colors.primary, route: '/driver/edit-profile' },
                { title: 'Bank Accounts', icon: 'bank', color: '#f59e0b', route: '/driver/bank-accounts' },
                { title: 'Documents', icon: 'file-document', color: '#10b981', route: '/driver/documents' },
              ].map((item: any, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => router.push(item.route)}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: scale(12),
                    borderBottomWidth: index < 2 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name={item.icon as any} size={scale(20)} color={item.color} />
                    <Text style={{ fontSize: scale(14), color: colors.foreground, fontWeight: '500', marginLeft: scale(12) }}>
                      {item.title}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={scale(20)} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={{ marginHorizontal: scale(16), marginBottom: scale(16) }}>
          <View style={{ backgroundColor: colors.card, borderRadius: scale(12), padding: scale(16), borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: scale(14), fontWeight: '600', color: colors.foreground, marginBottom: scale(12) }}>
              Help &amp; Support
            </Text>

            <View style={{
              paddingHorizontal: scale(12),
              paddingVertical: scale(10),
              backgroundColor: colors.background,
              borderRadius: scale(6),
            }}>
              <Text style={{ fontSize: scale(13), color: colors.foreground, fontWeight: '500', marginBottom: 4 }}>
                📧 Email Support
              </Text>
              <Text style={{ fontSize: scale(12), color: colors.mutedForeground }}>
                support@example.com
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={{ paddingHorizontal: scale(16), gap: scale(12), marginTop: scale(20), marginBottom: scale(24) }}>
          <TouchableOpacity
            onPress={() => setShowLogoutModal(true)}
            style={{
              paddingHorizontal: scale(16),
              paddingVertical: scale(14),
              backgroundColor: '#ef4444',
              borderRadius: scale(12),
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: scale(16), fontWeight: '600' }}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Confirmation */}
        {showLogoutModal && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
          >
            <Card isDark={mode === 'dark'}>
              <Text style={{ fontSize: scale(18), fontWeight: 'bold', color: colors.foreground, marginBottom: scale(12) }}>
                Logout?
              </Text>
              <Text style={{ fontSize: scale(14), color: colors.secondary, marginBottom: scale(20) }}>
                Are you sure you want to logout?
              </Text>
              <View style={{ flexDirection: 'row', gap: scale(12) }}>
                <TouchableOpacity
                  onPress={() => setShowLogoutModal(false)}
                  style={{
                    flex: 1,
                    paddingVertical: scale(12),
                    borderRadius: scale(8),
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ textAlign: 'center', fontWeight: '600', color: colors.foreground, fontSize: scale(14) }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Logout"
                    onPress={handleLogout}
                    isDark={mode === 'dark'}
                  />
                </View>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
      </SafeAreaView>
      <RiderBottomNavigation />
    </View>
  );
}
