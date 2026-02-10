import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { COLORS } from '@/utils/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, clearCache } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [shareLocationEnabled, setShareLocationEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const colors = isDark ? COLORS.dark : COLORS.light;

  const profileMenuItems = [
    { id: 'edit', label: 'Edit Profile', icon: '✏️', action: () => router.push('/rider/edit-profile') },
    {
      id: 'verification',
      label: 'Verification',
      icon: '✓',
      action: () => router.push('/rider/verification'),
    },
    {
      id: 'emergency',
      label: 'Emergency Contacts',
      icon: '☎️',
      action: () => router.push('/rider/emergency-contacts'),
    },
    {
      id: 'payment',
      label: 'Payment Methods',
      icon: '💳',
      action: () => router.push('/rider/payment-methods'),
    },
  ];

  const settingsMenuItems = [
    { id: 'language', label: 'Language', icon: '🌐', value: 'English' },
    { id: 'currency', label: 'Currency', icon: '💱', value: 'NGN (₦)' },
    { id: 'privacy', label: 'Privacy Settings', icon: '🔒', action: () => {} },
    { id: 'about', label: 'About Charter Keke', icon: 'ℹ️', action: () => {} },
  ];

  const handleLogout = async () => {
    try {
      console.log('📤 [RIDER-PROFILE] Logging out...');
      if (clearCache) {
        await clearCache();
      }
      await logout();
      console.log('✅ [RIDER-PROFILE] Logout successful');
      router.replace('/auth/login');
    } catch (error) {
      console.error('❌ [RIDER-PROFILE] Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 28, color: colors.primary }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text, marginTop: 12 }}>
            Profile
          </Text>
        </View>

        {/* Profile Card */}
        <Card isDark={isDark}>
          <View style={{ alignItems: 'center' }}>
            <Image
              source={{
                uri: user?.profileImage || 'https://avatar.vercel.sh/user?size=100',
              }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                marginBottom: 12,
              }}
            />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              {user?.email}
            </Text>

            {/* Rating & Stats */}
            {user?.userType === 'rider' && (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 20,
                  marginTop: 16,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                    {user?.totalRides || 0}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Rides</Text>
                </View>
                <View
                  style={{
                    width: 1,
                    backgroundColor: colors.border,
                  }}
                />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.warning }}>
                    {user?.rating?.toFixed(1) || '-'}★
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Rating</Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Profile Menu */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
            Account
          </Text>
          {profileMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={item.action}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 12,
                marginBottom: 8,
                borderRadius: 8,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 18, marginRight: 12 }}>{item.icon}</Text>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text }}>
                  {item.label}
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
            Preferences
          </Text>

          {/* Notifications Toggle */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 12,
              marginBottom: 8,
              borderRadius: 8,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>🔔</Text>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text }}>
                  Notifications
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  Ride updates & offers
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={notificationsEnabled ? colors.primary : colors.border}
            />
          </View>

          {/* Location Sharing Toggle */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 12,
              marginBottom: 8,
              borderRadius: 8,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>📍</Text>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text }}>
                  Share Location
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  With drivers during rides
                </Text>
              </View>
            </View>
            <Switch
              value={shareLocationEnabled}
              onValueChange={setShareLocationEnabled}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={shareLocationEnabled ? colors.primary : colors.border}
            />
          </View>

          {/* Other Settings */}
          {settingsMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={item.action}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 12,
                marginBottom: 8,
                borderRadius: 8,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 18, marginRight: 12 }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text }}>
                    {item.label}
                  </Text>
                  {'value' in item && (
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                      {item.value}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Support & Info */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
            Support
          </Text>
          <TouchableOpacity
            style={{
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 8,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>💬</Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text }}>
                Help & Support
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>ℹ️</Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text }}>
                App Version 1.0.0
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => setShowLogoutModal(true)}
            style={{
              paddingVertical: 12,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: colors.destructive,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontWeight: '600',
                color: colors.destructive,
                fontSize: 14,
              }}
            >
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <ConfirmationDialog
        visible={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out? You'll need to log in again to access your account."
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false);
          await handleLogout();
        }}
        cancelText="Cancel"
        confirmText="Log Out"
        isDark={isDark}
        type="danger"
      />
    </SafeAreaView>
  );
}
