import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheService } from '@/services/cache';
import { BRAND, COLORS } from '@/utils/colors';
import { useUpdateChecker } from '@/hooks/useUpdateChecker';
import { UpdateCheckerModal } from '@/components/UpdateCheckerModal';
import { usePushNotificationToggle } from '@/hooks/usePushNotificationToggle';
import { getTourStorageKey } from '@/utils/appTour';
import { getAppVersionLabel } from '@/utils/appInfo';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_picture_url?: string;
  accepted_rides?: number;
  total_rides_completed?: number;
  average_rating?: number;
  account_created_at?: string;
}

const normalizeRideList = (payload: any): any[] => {
  const candidates = [
    payload?.rides,
    payload?.transactions,
    payload?.data,
    payload,
  ];
  const list = candidates.find(Array.isArray);
  return Array.isArray(list) ? list : [];
};

const countDriverRideStats = (rides: any[]) => {
  const accepted = rides.filter((ride) => {
    const status = String(ride?.status || '').toLowerCase();
    return ['accepted', 'in_progress', 'started', 'completed'].includes(status);
  }).length;

  const completed = rides.filter((ride) => String(ride?.status || '').toLowerCase() === 'completed').length;

  return { accepted, completed };
};

export default function DriverProfileScreen() {
  const router = useRouter();
  const { logout, clearCache, user } = useAuth();
  const { theme, mode, toggleTheme } = useTheme();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { isSubscribed, isLoading: notifLoading, error: notifError, toggleSubscription } = usePushNotificationToggle();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const renderedOnce = useRef(false);
  const [hasCached, setHasCached] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { isChecking, updateInfo, checkForUpdates, dismissUpdate } = useUpdateChecker();

  const isLight = theme.mode === 'light';

  useFocusEffect(
    React.useCallback(() => {
      if (!renderedOnce.current) {
        renderedOnce.current = true;
        loadProfile();
        const fetchReferralCode = async () => {
          try {
            const res = await apiService.getReferralCode();
            const codeStr = (res?.referralCode?.referral_code || res?.referral_code || '');
            setReferralCode(String(codeStr).trim());
          } catch (err) {
            console.error('[Driver Profile] Error fetching referral code:', err);
            setReferralCode('');
          }
        };
        fetchReferralCode();
        return;
      }

      fetchProfile(false);
    }, [])
  );

  const loadProfile = async () => {
    const cached = await cacheService.get<ProfileData>('driver_profile');
    if (cached) {
      setProfileData(cached);
      setHasCached(true);
      setLoading(false);
    }

    await fetchProfile(!cached);
  };

  const fetchProfile = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const [detailsRes, historyRes] = await Promise.all([
        apiService.getDriverDetails(),
        apiService.getTransactions(1).catch(() => ({ rides: [] })),
      ]);
      const data = detailsRes.driver || detailsRes.user || detailsRes;
      const rides = normalizeRideList(historyRes);
      const { accepted, completed } = countDriverRideStats(rides);
      const nextProfile: ProfileData = {
        first_name: data?.first_name || (user as any)?.first_name || (user as any)?.firstName || '',
        last_name: data?.last_name || (user as any)?.last_name || (user as any)?.lastName || '',
        email: data?.email || (user as any)?.email || '',
        phone_number: data?.phone_number || (user as any)?.phone_number || (user as any)?.phone || '',
        profile_picture_url:
          data?.profile_picture_url ||
          data?.avatar ||
          (user as any)?.profile_picture_url ||
          (user as any)?.avatar ||
          (user as any)?.photo_url,
        accepted_rides:
          Number(
            data?.accepted_rides ??
            data?.acceptedRides ??
            data?.rides_accepted ??
            data?.total_rides_accepted ??
            accepted
          ) || accepted,
        total_rides_completed:
          Number(
            data?.total_rides_completed ??
            data?.totalRidesCompleted ??
            data?.rides_completed ??
            data?.total_rides ??
            data?.totalRides ??
            completed
          ) || completed,
        average_rating: Number(data?.average_rating ?? data?.rating ?? (user as any)?.averageRating ?? 0),
        account_created_at: data?.created_at || (user as any)?.created_at || (user as any)?.createdAt || '',
      };

      setProfileData(nextProfile);
      await cacheService.set('driver_profile', nextProfile);
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (clearCache) await clearCache();
      await logout();
      router.replace('/auth/welcome');
    } catch (e) {
      Alert.alert('Error', 'Logout failed');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      setShowDeleteAccount(false);
      await apiService.delete('/user/account');
      if (clearCache) await clearCache();
      await logout();
      router.replace('/auth/welcome');
    } catch (error) {
      Alert.alert('Deletion failed', 'We could not delete your account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleCheckUpdates = async () => {
    const result = await checkForUpdates(true);
    if (result?.hasUpdate) {
      setShowUpdateModal(true);
    } else if (result) {
      Alert.alert('Up to Date', 'You have the latest version of Charter Keke!');
    }
  };

  const handleReplayTour = async () => {
    await AsyncStorage.removeItem(getTourStorageKey('driver')).catch(() => {});
    router.push('/driver/home');
  };

  const handlePickAndUploadAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to upload your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const fileName = asset.fileName || asset.uri.split('/').pop() || 'avatar.jpg';
      const fileType = asset.mimeType || 'image/jpeg';

      const formData = new FormData();
      formData.append('profilePicture', {
        uri: asset.uri,
        type: fileType,
        name: fileName,
      } as any);

      setUploadingAvatar(true);
      const response: any = await apiService.post('/user/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newUrl = response?.user?.profile_picture_url;
      if (newUrl) {
        const next = {
          ...(profileData || {
            first_name: '',
            last_name: '',
            email: '',
            phone_number: '',
          }),
          profile_picture_url: newUrl,
        };

        setProfileData(next);
        await cacheService.set('driver_profile', next);
      }

      Alert.alert('Success', 'Profile picture updated successfully.');
    } catch (error) {
      console.error('Driver avatar upload failed:', error);
      Alert.alert('Upload Failed', 'Unable to update profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ProfileSkeleton isDark={!isLight} />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Profile</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    profileData?.profile_picture_url ||
                    `https://ui-avatars.com/api/?name=${profileData?.first_name || 'Driver'}&background=FF9101&color=000`,
                }}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={[styles.editBadge, { borderColor: theme.colors.card }]}
                onPress={handlePickAndUploadAvatar}
                disabled={uploadingAvatar}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialCommunityIcons name="pencil" size={13} color="#000" />
              </TouchableOpacity>
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={14} color="#FFF" />
              </View>
            </View>
            {uploadingAvatar ? (
              <Text style={[styles.uploadingText, { color: theme.colors.textSecondary }]}>Uploading...</Text>
            ) : null}
            <Text style={[styles.name, { color: theme.colors.textPrimary }]}>
              {profileData?.first_name} {profileData?.last_name}
            </Text>
            <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{profileData?.email}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                  {profileData?.accepted_rides || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Accepted</Text>
              </View>
              <View style={[styles.vertDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                  {profileData?.total_rides_completed || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
              </View>
              <View style={[styles.vertDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                  {profileData?.average_rating?.toFixed(1) || '0.0'}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Rating</Text>
              </View>
            </View>
          </View>

          {/* Compact Menu Container */}
          <View style={styles.menuContainer}>
            {/* HIERARCHY 1: PREFERENCES */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>PREFERENCES</Text>

            {/* Dark Mode Theme Toggle */}
            <View
              style={[
                styles.menuItem,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: theme.colors.inputBackground }]}>
                  <MaterialCommunityIcons
                    name={isLight ? 'weather-sunny' : 'weather-night'}
                    size={18}
                    color={theme.colors.textPrimary}
                  />
                </View>
                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Dark Mode</Text>
              </View>
              <Switch
                value={!isLight}
                onValueChange={() => toggleTheme()}
                trackColor={{ true: BRAND.primary, false: theme.colors.border }}
                thumbColor="#FFF"
              />
            </View>

            {/* Push Notifications Toggle */}
            <View
              style={[
                styles.menuItem,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: theme.colors.inputBackground }]}>
                  <MaterialCommunityIcons name="bell-outline" size={18} color={theme.colors.textPrimary} />
                </View>
                <View>
                  <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Notifications</Text>
                  {notifError ? (
                    <Text style={{ fontSize: 10, color: '#E74C3C', marginTop: 1 }}>{notifError}</Text>
                  ) : (
                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginTop: 1 }}>
                      {isSubscribed ? '✓ Enabled' : '✗ Disabled'}
                    </Text>
                  )}
                </View>
              </View>
              {notifLoading ? (
                <ActivityIndicator size="small" color={BRAND.primary} />
              ) : (
                <Switch
                  value={isSubscribed}
                  onValueChange={toggleSubscription}
                  disabled={notifLoading || Boolean(notifError)}
                  trackColor={{ true: BRAND.primary, false: theme.colors.border }}
                  thumbColor="#FFF"
                />
              )}
            </View>

            {/* HIERARCHY 2: DRIVER ACCOUNT & VEHICLE */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 18 }]}>
              DRIVER ACCOUNT
            </Text>
            <MenuItem
              icon="card-account-details-outline"
              label="Documents"
              onPress={() => router.push('/driver/documents')}
              theme={theme}
            />
            <MenuItem
              icon="car-outline"
              label="Vehicle Details"
              onPress={() => router.push('/driver/vehicle')}
              theme={theme}
            />
            <MenuItem
              icon="bank-outline"
              label="Bank Accounts"
              onPress={() => router.push('/driver/bank-accounts')}
              theme={theme}
            />
            <MenuItemWithSub
              icon="account-multiple-plus"
              label="Referrals"
              subLabel={referralCode}
              onPress={() => router.push('/driver/referrals')}
              theme={theme}
            />
            <MenuItem
              icon="message-outline"
              label="Messages"
              onPress={() => router.push('/driver/messages')}
              theme={theme}
            />

            {/* HIERARCHY 3: SAFETY, LEGAL & SUPPORT */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 18 }]}>
              SAFETY, LEGAL & SUPPORT
            </Text>
            <MenuItem
              icon="help-circle-outline"
              label="FAQ"
              onPress={() => router.push('/driver/faq')}
              theme={theme}
            />
            <MenuItem
              icon="shield-check-outline"
              label="Privacy & Security"
              onPress={() => router.push('/driver/privacy-settings')}
              theme={theme}
            />
            <MenuItem
              icon="file-document-outline"
              label="Terms of Use"
              onPress={() => router.push('/driver/terms')}
              theme={theme}
            />
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => router.push('/driver/help-and-support')}
              theme={theme}
            />
            <MenuItem
              icon="information-outline"
              label="About Charter Keke"
              onPress={() => router.push('/driver/about')}
              theme={theme}
            />
            <MenuItem
              icon="map-marker-question-outline"
              label="Take App Tour"
              onPress={handleReplayTour}
              theme={theme}
            />
            <MenuItem
              icon="cloud-download-outline"
              label="Check for Updates"
              onPress={handleCheckUpdates}
              theme={theme}
            />

            {/* HIERARCHY 4: ACCOUNT MANAGEMENT */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 18 }]}>
              ACCOUNT MANAGEMENT
            </Text>
            <TouchableOpacity
              style={[styles.logoutBtn, { borderColor: COLORS.light.destructive }]}
              onPress={() => setShowLogout(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="logout" size={18} color={COLORS.light.destructive} />
              <Text style={{ color: COLORS.light.destructive, fontWeight: '700', fontSize: 13 }}>Log Out</Text>
            </TouchableOpacity>

            <MenuItem
              icon="delete-outline"
              label="Delete Account"
              onPress={() => setShowDeleteAccount(true)}
              theme={theme}
              danger
              loading={deletingAccount}
            />

            <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
              {getAppVersionLabel()}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <ConfirmationDialog
        visible={showLogout}
        title="Log Out"
        message="Are you sure you want to log out?"
        onCancel={() => setShowLogout(false)}
        onConfirm={handleLogout}
        cancelText="Cancel"
        confirmText="Log Out"
        isDark={!isLight}
        type="danger"
      />

      <ConfirmationDialog
        visible={showDeleteAccount}
        title="Delete Account Permanently"
        message="This permanently deletes your Charter Keke account, removes your login access, and logs you out."
        onCancel={() => setShowDeleteAccount(false)}
        onConfirm={handleDeleteAccount}
        cancelText="Keep Account"
        confirmText={deletingAccount ? 'Deleting...' : 'Delete Account'}
        isDark={!isLight}
        type="danger"
      />

      <UpdateCheckerModal
        visible={showUpdateModal}
        updateInfo={updateInfo}
        isChecking={isChecking}
        onDismiss={dismissUpdate}
        onDownload={async () => setShowUpdateModal(false)}
      />
    </View>
  );
}

const MenuItem = ({ icon, label, onPress, theme, loading, danger }: any) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.7}
    style={[styles.menuItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
  >
    <View style={styles.menuLeft}>
      <View style={[styles.iconBox, { backgroundColor: theme.colors.inputBackground }]}>
        {loading ? (
          <ActivityIndicator size="small" color={danger ? COLORS.light.destructive : theme.colors.textPrimary} />
        ) : (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={danger ? COLORS.light.destructive : theme.colors.textPrimary}
          />
        )}
      </View>
      <Text style={[styles.menuText, { color: danger ? COLORS.light.destructive : theme.colors.textPrimary }]}>
        {label}
      </Text>
    </View>
    {!loading && (
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={danger ? COLORS.light.destructive : theme.colors.textSecondary}
      />
    )}
  </TouchableOpacity>
);

const MenuItemWithSub = ({ icon, label, subLabel, onPress, theme }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[styles.menuItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
  >
    <View style={styles.menuLeft}>
      <View style={[styles.iconBox, { backgroundColor: theme.colors.inputBackground }]}>
        <MaterialCommunityIcons name={icon} size={18} color={theme.colors.textPrimary} />
      </View>
      <View>
        <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>{label}</Text>
        {subLabel ? <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 1 }}>{subLabel}</Text> : null}
      </View>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.textSecondary} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  content: { paddingBottom: 60 },
  profileSection: { alignItems: 'center', marginBottom: 20 },
  avatarContainer: { position: 'relative', marginBottom: 10 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: BRAND.primary },
  editBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: BRAND.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 10,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  uploadingText: { fontSize: 11, marginTop: -4, marginBottom: 4, fontWeight: '500' },
  name: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  email: { fontSize: 13 },
  statsRow: { flexDirection: 'row', marginTop: 14, alignItems: 'center', gap: 16 },
  statItem: { alignItems: 'center', minWidth: 50 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11 },
  vertDivider: { width: 1, height: 24 },
  menuContainer: { paddingHorizontal: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', marginBottom: 6, marginLeft: 2, letterSpacing: 0.5 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 13, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
    gap: 8,
  },
  versionText: { textAlign: 'center', fontSize: 11, fontWeight: '600', marginTop: 14, marginBottom: 8 },
});
