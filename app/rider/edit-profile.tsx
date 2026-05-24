import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { COLORS } from '@/utils/colors';
import { isValidEmail, isValidPhone, normalizeNigerianPhone } from '@/utils/validation';
import { EditProfileSkeleton } from '@/components/EditProfileSkeleton';

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  dob?: string;
  gender?: string;
  role?: string;
  status?: string;
  profile_complete?: boolean;
  created_at?: string;
  updated_at?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  profile_picture_url?: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profileImage: '',
    dob: '',
    gender: '',
    role: '',
    status: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const screenLaunchedOnce = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!screenLaunchedOnce.current) {
        screenLaunchedOnce.current = true;
        fetchProfileData();
      }
    }, [])
  );

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      console.log('📤 [EDIT-PROFILE] Fetching profile data...');
      
      const profileRes = await apiService.get('/user/details');
      console.log('✅ [EDIT-PROFILE] Profile fetched:', profileRes);
      
      const user = (profileRes as any)?.user || profileRes;
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone_number || '',
        profileImage: user.profile_picture_url || `https://avatar.vercel.sh/${user.first_name}?size=100`,
        dob: user.dob || '',
        gender: user.gender || '',
        role: user.role || '',
        status: user.status || '',
        emergencyContact: user.emergency_contact || '',
        emergencyPhone: user.emergency_phone || '',
      });
    } catch (error) {
      console.error('❌ [EDIT-PROFILE] Error fetching profile:', error);
      Alert.alert('Error', 'Could not load profile data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!isValidEmail(formData.email)) newErrors.email = 'Invalid email address';
    if (!isValidPhone(formData.phone)) newErrors.phone = 'Invalid phone number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadProfileImage = async () => {
    try {
      setUploadingImage(true);

      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission', 'Permission to access media library is required');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        setUploadingImage(false);
        return;
      }

      const uri = result.assets[0].uri;
      const filename = uri.split('/').pop() || 'profile.jpg';
      const mimeType = 'image/jpeg';

      // Create FormData
      const formDataObj = new FormData();
      formDataObj.append('profilePicture', {
        uri,
        name: filename,
        type: mimeType,
      } as any);

      console.log('📤 Uploading profile image...');

      // Upload image via authenticated API service
      const uploadData: any = await apiService.post('/user/profile/avatar', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('✅ Image uploaded:', uploadData);

      // Update form data with new image URL
      setFormData(prev => ({
        ...prev,
        profileImage: uploadData?.user?.profile_picture_url || uploadData.publicUrl || uploadData.url,
      }));

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('❌ Image upload error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const normalizedPhone = normalizeNigerianPhone(formData.phone);
    if (!normalizedPhone) {
      setErrors((prev) => ({ ...prev, phone: 'Invalid phone number' }));
      return;
    }

    setSaving(true);
    try {
      console.log('📤 [EDIT-PROFILE] Saving profile...');
      
      await apiService.put('/user/details', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: normalizedPhone,
      });

      setFormData((prev) => ({ ...prev, phone: normalizedPhone }));

      console.log('✅ [EDIT-PROFILE] Profile saved');
      Alert.alert('Success', 'Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      console.error('❌ [EDIT-PROFILE] Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <EditProfileSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
            {!editMode ? (
              <TouchableOpacity onPress={() => setEditMode(true)}>
                <MaterialCommunityIcons name="pencil" size={24} color={colors.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setEditMode(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.destructive} />
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Picture */}
          <View style={[styles.card, { backgroundColor: colors.card || colors.background, borderColor: colors.border }]}>
            <TouchableOpacity 
              onPress={editMode ? uploadProfileImage : undefined}
              style={styles.profileImageSection}
              disabled={!editMode || uploadingImage}
            >
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: formData.profileImage }}
                  style={styles.profileImage}
                />
                {editMode && (
                  <View style={[styles.uploadOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}>
                    {uploadingImage ? (
                      <ActivityIndicator color="white" size="large" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="camera-plus" size={40} color="white" />
                        <Text style={styles.uploadText}>Change Photo</Text>
                      </>
                    )}
                  </View>
                )}
              </View>
              <Text style={[styles.profileImageLabel, { color: colors.textSecondary }]}>
                {editMode ? 'Tap to change photo' : 'Profile Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.detailsCard, { backgroundColor: colors.card || colors.background, borderColor: colors.border }]}>
            <Text style={[styles.detailsTitle, { color: colors.textSecondary }]}>PROFILE DETAILS</Text>
            <DetailRow label="First Name" value={formData.firstName || 'N/A'} colors={colors} />
            <DetailRow label="Last Name" value={formData.lastName || 'N/A'} colors={colors} />
            <DetailRow label="Email" value={formData.email || 'N/A'} colors={colors} />
            <DetailRow label="Phone" value={formData.phone || 'N/A'} colors={colors} />
            <DetailRow label="DOB" value={formData.dob || 'N/A'} colors={colors} />
            <DetailRow label="Gender" value={formData.gender || 'N/A'} colors={colors} />
            <DetailRow label="Role" value={formData.role || 'user'} colors={colors} />
            <DetailRow label="Status" value={formData.status || 'pending'} colors={colors} />
            <DetailRow label="Emergency Contact" value={formData.emergencyContact || 'N/A'} colors={colors} />
            <DetailRow label="Emergency Phone" value={formData.emergencyPhone || 'N/A'} colors={colors} />
          </View>

          {/* Form Fields */}
          <View style={[styles.card, { backgroundColor: colors.card || colors.background, borderColor: colors.border }]}>
            {/* First Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>First Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.background : '#F5F5F5',
                    color: colors.text,
                    borderColor: errors.firstName ? colors.destructive : colors.border,
                  }
                ]}
                placeholder="Enter first name"
                placeholderTextColor={colors.textSecondary}
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                editable={editMode}
              />
              {errors.firstName && (
                <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.firstName}</Text>
              )}
            </View>

            {/* Last Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Last Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.background : '#F5F5F5',
                    color: colors.text,
                    borderColor: errors.lastName ? colors.destructive : colors.border,
                  }
                ]}
                placeholder="Enter last name"
                placeholderTextColor={colors.textSecondary}
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                editable={editMode}
              />
              {errors.lastName && (
                <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.lastName}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.background : '#F5F5F5',
                    color: colors.text,
                    borderColor: errors.email ? colors.destructive : colors.border,
                  }
                ]}
                placeholder="Enter email address"
                placeholderTextColor={colors.textSecondary}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                editable={editMode}
              />
              {errors.email && (
                <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.email}</Text>
              )}
            </View>

            {/* Phone */}
            <View style={[styles.formGroup, { marginTop: 0 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.background : '#F5F5F5',
                    color: colors.text,
                    borderColor: errors.phone ? colors.destructive : colors.border,
                  }
                ]}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textSecondary}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
                editable={editMode}
              />
              {errors.phone && (
                <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.phone}</Text>
              )}
            </View>
          </View>

          {/* Save Button */}
          {editMode && (
            <View style={styles.buttonSection}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
              >
                {saving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={20} color="white" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  profileImageSection: {
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  uploadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  profileImageLabel: {
    fontSize: 12,
    marginTop: 12,
  },
  detailsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
  },
  buttonSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

const DetailRow = ({ label, value, colors }: any) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
    <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
  </View>
);
