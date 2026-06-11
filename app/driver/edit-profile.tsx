// 'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { apiService } from '@services/api';
import { cacheService } from '@services/cache';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import Button from '@components/ui/Button';
import { COLORS } from '@utils/colors';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

export default function EditProfileScreen() {
  const router = useRouter();
  const { mode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    guarantorName: '',
    guarantorPhone: '',
    guarantorAddress: '',
    emergencyContact: '',
  });
  const [hasCached, setHasCached] = useState(false);

  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;

  useEffect(() => {
    loadDriverDetails();
  }, []);

  const loadDriverDetails = async () => {
    const cached = await cacheService.get<any>('driver_profile_edit');
    if (cached) {
      setFormData(cached);
      setHasCached(true);
      setLoading(false);
    }

    await fetchDriverDetails(!cached);
  };

  const fetchDriverDetails = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await apiService.getDriverDetails();
      const driverData = data.combined || data.driver || data.user || data;
      
      const nextForm = {
        firstName: driverData?.first_name || '',
        lastName: driverData?.last_name || '',
        email: driverData?.email || '',
        phone: driverData?.phone_number || '',
        guarantorName: driverData?.guarantor_name || '',
        guarantorPhone: driverData?.guarantor_phone || '',
        guarantorAddress: driverData?.guarantor_address || '',
        emergencyContact: driverData?.emergency_contact || '',
      };
      setFormData(nextForm);
      await cacheService.set('driver_profile_edit', nextForm);
    } catch (error) {
      console.error('❌ [EDIT-PROFILE] Error fetching details:', error);
      Alert.alert('Error', 'Failed to load profile details');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
        guarantor_name: formData.guarantorName,
        guarantor_phone: formData.guarantorPhone,
        guarantor_address: formData.guarantorAddress,
        emergency_contact: formData.emergencyContact,
      };

      // Call API to update profile
      const response = await apiService.put('/driver/details', payload);
      
      if (response) {
        Alert.alert('Success', 'Profile updated successfully');
        router.back();
      }
    } catch (error) {
      console.error('❌ [EDIT-PROFILE] Save error:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ListScreenSkeleton itemCount={4} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Header */}
          <View style={{
            paddingHorizontal: scale(16),
            paddingVertical: scale(16),
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialCommunityIcons name="chevron-left" size={scale(24)} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={{ fontSize: scale(20), fontWeight: 'bold', color: colors.foreground }}>
              Edit Profile
            </Text>
            <View style={{ width: scale(24) }} />
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: scale(16), paddingVertical: scale(20) }}>
            {/* First Name */}
            <View style={{ marginBottom: scale(16) }}>
              <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(8) }}>
                First Name
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: scale(8),
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  fontSize: scale(14),
                  color: colors.foreground,
                  backgroundColor: colors.card,
                }}
                placeholderTextColor={colors.mutedForeground}
                placeholder="Enter first name"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
              />
            </View>

            {/* Last Name */}
            <View style={{ marginBottom: scale(16) }}>
              <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(8) }}>
                Last Name
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: scale(8),
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  fontSize: scale(14),
                  color: colors.foreground,
                  backgroundColor: colors.card,
                }}
                placeholderTextColor={colors.mutedForeground}
                placeholder="Enter last name"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
              />
            </View>

            {/* Email */}
            <View style={{ marginBottom: scale(16) }}>
              <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(8) }}>
                Email
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: scale(8),
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  fontSize: scale(14),
                  color: colors.foreground,
                  backgroundColor: colors.card,
                }}
                placeholderTextColor={colors.mutedForeground}
                placeholder="Enter email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                editable={false}
              />
            </View>

            {/* Phone */}
            <View style={{ marginBottom: scale(16) }}>
              <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(8) }}>
                Phone Number
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: scale(8),
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  fontSize: scale(14),
                  color: colors.foreground,
                  backgroundColor: colors.card,
                }}
                placeholderTextColor={colors.mutedForeground}
                placeholder="Enter phone"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Guarantor Details */}
            <View style={{ marginBottom: scale(16) }}>
              <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(8) }}>
                Guarantor Name
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: scale(8),
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  fontSize: scale(14),
                  color: colors.foreground,
                  backgroundColor: colors.card,
                }}
                placeholderTextColor={colors.mutedForeground}
                placeholder="Enter guarantor name"
                value={formData.guarantorName}
                onChangeText={(value) => handleInputChange('guarantorName', value)}
              />
            </View>

            <View style={{ marginBottom: scale(16) }}>
              <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(8) }}>
                Guarantor Phone
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: scale(8),
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  fontSize: scale(14),
                  color: colors.foreground,
                  backgroundColor: colors.card,
                }}
                placeholderTextColor={colors.mutedForeground}
                placeholder="Enter guarantor phone"
                value={formData.guarantorPhone}
                onChangeText={(value) => handleInputChange('guarantorPhone', value)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={{ marginBottom: scale(16) }}>
              <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(8) }}>
                Guarantor Address
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: scale(8),
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  fontSize: scale(14),
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  minHeight: scale(72),
                  textAlignVertical: 'top',
                }}
                placeholderTextColor={colors.mutedForeground}
                placeholder="Enter guarantor address"
                value={formData.guarantorAddress}
                onChangeText={(value) => handleInputChange('guarantorAddress', value)}
                multiline
              />
            </View>

            {/* Emergency Contact */}
            <View style={{ marginBottom: scale(24) }}>
              <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(8) }}>
                Emergency Contact
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: scale(8),
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  fontSize: scale(14),
                  color: colors.foreground,
                  backgroundColor: colors.card,
                }}
                placeholderTextColor={colors.mutedForeground}
                placeholder="Enter emergency contact"
                value={formData.emergencyContact}
                onChangeText={(value) => handleInputChange('emergencyContact', value)}
              />
            </View>

            {/* Save Button */}
            <Button
              title={saving ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              isDark={mode === 'dark'}
              disabled={saving}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
