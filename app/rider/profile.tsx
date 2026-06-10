
import React, { useState, useRef, useMemo } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';
import { apiService } from '@/services/api';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheService } from '@/services/cache';
import { STORAGE_KEYS } from '@/utils/constants';
import { BRAND, COLORS } from '@/utils/colors';
import { useUpdateChecker } from '@/hooks/useUpdateChecker';
import { UpdateCheckerModal } from '@/components/UpdateCheckerModal';
import { getTourStorageKey } from '@/utils/appTour';
import { getAppVersionLabel } from '@/utils/appInfo';

interface ProfileData {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role?: string;
  status?: string;
  profile_complete?: boolean;
  created_at?: string;
  updated_at?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  profile_picture_url?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, clearCache } = useAuth();
  const { theme, mode } = useTheme();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const renderedOnce = useRef(false);
  const [hasCached, setHasCached] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');
  const [rideStats, setRideStats] = useState({
    acceptedRides: 0,
    completedRides: 0,
    reviewsGiven: 0,
    averageRatingGiven: 0,
  });
  
  // Update checker
  const { isChecking, updateInfo, checkForUpdates, dismissUpdate } = useUpdateChecker();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const isLight = theme.mode === 'light';

  useFocusEffect(
    React.useCallback(() => {
      if (!renderedOnce.current) {
        renderedOnce.current = true;
        loadProfileWithCache();
        // Fetch referral code - extract it correctly
        const fetchReferralCode = async () => {
          try {
            const res = await apiService.getReferralCode();
            console.log('[Profile] getReferralCode response:', JSON.stringify(res));
            
            // Get the code string - must be a string
            const codeStr = (res?.referralCode?.referral_code || res?.referral_code || '');
            const finalCode = String(codeStr).trim();
            
            console.log('[Profile] Extracted code:', finalCode, 'type:', typeof finalCode);
            setReferralCode(finalCode);
          } catch (err) {
            console.error('[Profile] Error fetching referral code:', err);
            setReferralCode('');
          }
        };
        fetchReferralCode();
      }
    }, [])
  );

  const loadProfileWithCache = async () => {
    const cached = await cacheService.get<ProfileData>(STORAGE_KEYS.RIDER_PROFILE);
    if (cached) {
      setProfileData(cached);
      setHasCached(true);
      setLoading(false);
    }

    await loadProfile(!cached);
  };

  const loadProfile = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await apiService.get('/user/profile');
      const nextProfile = (res as any)?.user || res;
      setProfileData(nextProfile);
      await cacheService.set(STORAGE_KEYS.RIDER_PROFILE, nextProfile);
      await loadRideStats((nextProfile as any)?.id || (res as any)?.user?.id || '');
    } catch (error) { console.error(error); } 
    finally { if (showLoader) setLoading(false); }
  };

  const loadRideStats = async (userId: string) => {
    try {
      if (!userId) return;
      const [rideHistoryRes, reviewsRes] = await Promise.all([
        apiService.get('/user/ride-history?limit=200').catch(() => ({ rides: [] })),
        apiService.get(`/ride-reviews?reviewer_id=${userId}`).catch(() => ({ reviews: [] })),
      ]);

      const rides = (rideHistoryRes as any)?.rides || [];
      const acceptedRides = rides.filter((ride: any) => ['accepted', 'started', 'in_progress', 'completed'].includes(String(ride.status || '').toLowerCase())).length;
      const completedRides = rides.filter((ride: any) => String(ride.status || '').toLowerCase() === 'completed').length;
      const reviews = (reviewsRes as any)?.reviews || (Array.isArray(reviewsRes) ? reviewsRes : []);
      const reviewRatings = reviews
        .map((review: any) => Number(review.rating))
        .filter((rating: number) => Number.isFinite(rating) && rating > 0);

      setRideStats({
        acceptedRides,
        completedRides,
        reviewsGiven: reviews.length,
        averageRatingGiven: reviewRatings.length ? reviewRatings.reduce((sum: number, rating: number) => sum + rating, 0) / reviewRatings.length : 0,
      });
    } catch (error) {
      console.error('[Profile] Failed to load ride stats:', error);
    }
  };

  const accountAge = useMemo(() => {
    if (!profileData?.created_at) return 'N/A';
    const created = new Date(profileData.created_at);
    if (Number.isNaN(created.getTime())) return 'N/A';
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    if (years > 0) return `${years}y`;
    if (months > 0) return `${months}m`;
    return `${days}d`;
  }, [profileData?.created_at]);

  const handleLogout = async () => {
    try {
      if (clearCache) await clearCache();
      await logout();
      router.replace('/auth/welcome');
    } catch (e) { Alert.alert('Error', 'Logout failed'); }
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
    await AsyncStorage.removeItem(getTourStorageKey('rider')).catch(() => {});
    await AsyncStorage.removeItem('@charter_keke_tour_rider_booking_seen').catch(() => {});
    router.push('/rider/home');
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
        setProfileData((prev) => (prev ? { ...prev, profile_picture_url: newUrl } : prev));
      }

      Alert.alert('Success', 'Profile picture updated successfully.');
    } catch (error) {
      console.error('Avatar upload failed:', error);
      Alert.alert('Upload Failed', 'Unable to update profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) return <SafeAreaView style={{flex:1, backgroundColor: theme.colors.background}}><ProfileSkeleton isDark={!isLight}/></SafeAreaView>;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
           {/* <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.inputBackground }]}>
             <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
           </TouchableOpacity> */}
           <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Profile</Text>
           <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: profileData?.profile_picture_url || `https://ui-avatars.com/api/?name=${profileData?.first_name}&background=FF9101&color=000` }} 
                style={styles.avatar} 
              />
              <TouchableOpacity
                style={[styles.editBadge, { borderColor: theme.colors.card }]}
                onPress={handlePickAndUploadAvatar}
                disabled={uploadingAvatar}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                 <MaterialCommunityIcons name="pencil" size={14} color="#000" />
              </TouchableOpacity>
            </View>
            {uploadingAvatar ? (
              <Text style={[styles.uploadingText, { color: theme.colors.textSecondary }]}>Uploading...</Text>
            ) : null}
            <Text style={[styles.name, { color: theme.colors.textPrimary }]}>{profileData?.first_name} {profileData?.last_name}</Text>
            <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{profileData?.email}</Text>
          </View>

          {/* Stats */}
          <View style={[styles.statsContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
             <View style={styles.stat}>
               <Text style={[styles.statNum, { color: theme.colors.textPrimary }]}>{rideStats.acceptedRides}</Text>
               <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Accepted</Text>
             </View>
             <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
             <View style={styles.stat}>
               <Text style={[styles.statNum, { color: theme.colors.textPrimary }]}>{rideStats.completedRides}</Text>
               <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
             </View>
             <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
             <View style={styles.stat}>
               <Text style={[styles.statNum, { color: theme.colors.textPrimary }]}>{rideStats.reviewsGiven ? rideStats.averageRatingGiven.toFixed(1) : 'N/A'}</Text>
               <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Given</Text>
             </View>
             <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
             <View style={styles.stat}>
               <Text style={[styles.statNum, { color: theme.colors.textPrimary }]}>{accountAge}</Text>
               <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Age</Text>
             </View>
          </View>

          {/* Menu */}
          <View style={styles.menuContainer}>
             <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>ACCOUNT</Text>
             <MenuItem icon="account-outline" label="Edit Profile" onPress={() => router.push('/rider/edit-profile')} theme={theme} />
             <MenuItem icon="credit-card-outline" label="Payment Methods" onPress={() => router.push('/rider/payment-methods')} theme={theme} />
             <MenuItemWithSub icon="account-multiple-plus" label="Referrals" subLabel={referralCode} onPress={() => router.push('/rider/referrals')} theme={theme} />
             <MenuItem icon="message-outline" label="Messages" onPress={() => router.push('/rider/messages')} theme={theme} />
             <MenuItem icon="star-outline" label="My Reviews" onPress={() => router.push('/rider/my-reviews')} theme={theme} />
             
             <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 24 }]}>PREFERENCES</Text>
             <View style={[styles.menuItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.menuLeft}>
                   <View style={[styles.iconBox, { backgroundColor: theme.colors.inputBackground }]}>
                      <MaterialCommunityIcons name="bell-outline" size={20} color={theme.colors.textPrimary} />
                   </View>
                   <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Notifications</Text>
                </View>
                <Switch 
                  value={notifEnabled} 
                  onValueChange={setNotifEnabled} 
                  trackColor={{ true: BRAND.primary, false: theme.colors.border }}
                  thumbColor="#FFF"
                />
             </View>
            <MenuItem icon="shield-check-outline" label="Privacy & Security" onPress={() => router.push('/rider/privacy-settings')} theme={theme} />
            <MenuItem
              icon="delete-outline"
              label="Delete Account"
              onPress={() => setShowDeleteAccount(true)}
              theme={theme}
              danger
              loading={deletingAccount}
            />

             <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 24 }]}>SUPPORT</Text>
             <MenuItem icon="map-marker-question-outline" label="Take App Tour" onPress={handleReplayTour} theme={theme} />
             <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => router.push('/rider/help-and-support')} theme={theme} />
             <MenuItem icon="information-outline" label="About Charter Keke" onPress={() => router.push('/rider/about')} theme={theme} />
             <MenuItem 
              icon="cloud-download-outline" 
              label="Check for Updates" 
              onPress={handleCheckUpdates} 
              theme={theme}
              loading={isChecking}
             />
             
             <TouchableOpacity style={[styles.logoutBtn, { borderColor: COLORS.light.destructive }]} onPress={() => setShowLogout(true)}>
                <MaterialCommunityIcons name="logout" size={20} color={COLORS.light.destructive} />
                <Text style={{ color: COLORS.light.destructive, fontWeight: '600' }}>Log Out</Text>
             </TouchableOpacity>
             <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>{getAppVersionLabel()}</Text>
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
        onDismiss={async (version) => {
          await dismissUpdate(version);
          setShowUpdateModal(false);
        }}
        onDownload={async (url) => {
          setShowUpdateModal(false);
        }}
      />
    </View>
  );
}

const MenuItem = ({ icon, label, onPress, theme, loading, danger }: any) => (
  <TouchableOpacity onPress={onPress} disabled={loading} style={[styles.menuItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
    <View style={styles.menuLeft}>
       <View style={[styles.iconBox, { backgroundColor: theme.colors.inputBackground }]}>
          {loading ? (
            <ActivityIndicator size="small" color={danger ? COLORS.light.destructive : theme.colors.textPrimary} />
          ) : (
            <MaterialCommunityIcons name={icon} size={20} color={danger ? COLORS.light.destructive : theme.colors.textPrimary} />
          )}
       </View>
       <Text style={[styles.menuText, { color: danger ? COLORS.light.destructive : theme.colors.textPrimary }]}>{label}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color={danger ? COLORS.light.destructive : theme.colors.textSecondary} />
  </TouchableOpacity>
);

const MenuItemWithSub = ({ icon, label, subLabel, onPress, theme }: any) => {
  // Ensure subLabel is definitely a string, never an object
  const safeLabel = typeof subLabel === 'string' && subLabel.length > 0 ? subLabel : '';
  
  return (
    <TouchableOpacity onPress={onPress} style={[styles.menuItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.menuLeft}>
         <View style={[styles.iconBox, { backgroundColor: theme.colors.inputBackground }]}>
            <MaterialCommunityIcons name={icon} size={20} color={theme.colors.textPrimary} />
         </View>
         <View>
           <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>{label}</Text>
           {safeLabel ? (
             <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{safeLabel}</Text>
           ) : null}
         </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { paddingBottom: 40 },
  profileSection: { alignItems: 'center', marginTop: 10, marginBottom: 24 },
  detailsCard: { marginHorizontal: 16, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: BRAND.primary },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: BRAND.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  uploadingText: { fontSize: 12, marginTop: -8, marginBottom: 8, fontWeight: '500' },
  name: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  email: { fontSize: 14 },
  statsContainer: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 24 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  divider: { width: 1, height: '100%' },
  menuContainer: { paddingHorizontal: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 14, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 20, gap: 8 },
  versionText: { textAlign: 'center', fontSize: 12, fontWeight: '700', marginTop: 18, marginBottom: 8 },
});

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
    <Text style={{ fontSize: 13, fontWeight: '600', color: '#666' }}>{label}</Text>
    <Text style={{ fontSize: 13, fontWeight: '700', color: '#111', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
  </View>
);
