
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
import { cacheService } from '@/services/cache';
import { BRAND, COLORS } from '@/utils/colors';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_picture_url?: string;
  total_rides_completed?: number;
  average_rating?: number;
}

export default function DriverProfileScreen() {
  const router = useRouter();
  const { logout, clearCache, user } = useAuth();
  const { theme, mode } = useTheme();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const renderedOnce = useRef(false);
  const [hasCached, setHasCached] = useState(false);

  const isLight = theme.mode === 'light';

  useFocusEffect(
    React.useCallback(() => {
      if (!renderedOnce.current) {
        renderedOnce.current = true;
        loadProfile();
        return;
      }

      // Always refresh on focus to keep ride count in sync with home screen
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
      const res = await apiService.getDriverDetails();
      const data = res.driver || res.user || res;
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
        total_rides_completed:
          Number(
            data?.total_rides_completed ??
            data?.totalRidesCompleted ??
            data?.rides_completed ??
            data?.total_rides ??
            data?.totalRides ??
            (user as any)?.total_rides_completed ??
            (user as any)?.totalRides ??
            0
          ) || 0,
        average_rating: Number(data?.average_rating ?? data?.rating ?? (user as any)?.averageRating ?? 0),
      };

      setProfileData(nextProfile);
      await cacheService.set('driver_profile', nextProfile);
    } catch (error) { console.error(error); } 
    finally { if (showLoader) setLoading(false); }
  };

  const handleLogout = async () => {
    try {
      if (clearCache) await clearCache();
      await logout();
      router.replace('/auth/welcome');
    } catch (e) { Alert.alert('Error', 'Logout failed'); }
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

  if (loading) return <SafeAreaView style={{flex:1, backgroundColor: theme.colors.background}}><ProfileSkeleton isDark={!isLight}/></SafeAreaView>;

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
                source={{ uri: profileData?.profile_picture_url || `https://ui-avatars.com/api/?name=${profileData?.first_name || 'Driver'}&background=FF9101&color=000` }} 
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
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={16} color="#FFF" />
              </View>
            </View>
            {uploadingAvatar ? (
              <Text style={[styles.uploadingText, { color: theme.colors.textSecondary }]}>Uploading...</Text>
            ) : null}
            <Text style={[styles.name, { color: theme.colors.textPrimary }]}>{profileData?.first_name} {profileData?.last_name}</Text>
            <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{profileData?.email}</Text>
            
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{profileData?.total_rides_completed || 0}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Rides</Text>
                </View>
                <View style={[styles.vertDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{profileData?.average_rating?.toFixed(1) || '5.0'}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Rating</Text>
                </View>
            </View>
          </View>

          {/* Menu */}
          <View style={styles.menuContainer}>
             <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>DRIVER ACCOUNT</Text>
             <MenuItem icon="card-account-details-outline" label="Documents" onPress={() => router.push('/driver/documents')} theme={theme} />
             <MenuItem icon="car-outline" label="Vehicle Details" onPress={() => router.push('/driver/vehicle')} theme={theme} />
             <MenuItem icon="bank-outline" label="Bank Accounts" onPress={() => router.push('/driver/bank-accounts')} theme={theme} />

             <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 24 }]}>SETTINGS</Text>
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
             
             <TouchableOpacity style={[styles.logoutBtn, { borderColor: COLORS.light.destructive }]} onPress={() => setShowLogout(true)}>
                <MaterialCommunityIcons name="logout" size={20} color={COLORS.light.destructive} />
                <Text style={{ color: COLORS.light.destructive, fontWeight: '600' }}>Log Out</Text>
             </TouchableOpacity>
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
    </View>
  );
}

const MenuItem = ({ icon, label, onPress, theme }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.menuItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
    <View style={styles.menuLeft}>
       <View style={[styles.iconBox, { backgroundColor: theme.colors.inputBackground }]}>
          <MaterialCommunityIcons name={icon} size={20} color={theme.colors.textPrimary} />
       </View>
       <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>{label}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  content: { paddingBottom: 100 },
  profileSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: BRAND.primary },
  editBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: BRAND.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, zIndex: 10 },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10B981', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  uploadingText: { fontSize: 12, marginTop: -8, marginBottom: 8, fontWeight: '500' },
  name: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  email: { fontSize: 14 },
  statsRow: { flexDirection: 'row', marginTop: 20, alignItems: 'center', gap: 20 },
  statItem: { alignItems: 'center', minWidth: 60 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12 },
  vertDivider: { width: 1, height: 30 },
  menuContainer: { paddingHorizontal: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 14, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 20, gap: 8 },
});
