import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { COLORS } from '@/utils/colors';
import { validateEmail, isValidPhone } from '@/utils/validation';

export default function EditProfileScreen() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const colors = isDark ? COLORS.dark : COLORS.light;

  // Form state
  const [formData, setFormData] = useState({
    firstName: 'Bukola',
    lastName: 'Adeyemi',
    email: 'bukola@example.com',
    phone: '+2349012345678',
    dateOfBirth: '1995-03-15',
    gender: 'female',
    city: 'Lagos',
    address: '123 Ikoyi Road, Ikoyi',
    profileImage: 'https://avatar.vercel.sh/bukola?size=200',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!validateEmail(formData.email)) newErrors.email = 'Invalid email address';
    if (!isValidPhone(formData.phone)) newErrors.phone = 'Invalid phone number';
    if (!formData.city.trim()) newErrors.city = 'City is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Simulate saving
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = () => {
    // In a real app, this would open image picker
    alert('Image picker would open here');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
      >
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
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ fontSize: 28, color: colors.primary }}>←</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>
              Edit Profile
            </Text>
            {!editMode ? (
              <TouchableOpacity onPress={() => setEditMode(true)}>
                <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>
                  Edit
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setEditMode(false)}>
                <Text style={{ fontSize: 14, color: colors.error, fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Picture */}
          <Card isDark={isDark}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  position: 'relative',
                  marginBottom: 12,
                }}
              >
                <Image
                  source={{ uri: formData.profileImage }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                  }}
                />
                {editMode && (
                  <TouchableOpacity
                    onPress={handleImageChange}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 3,
                      borderColor: colors.background,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>📷</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: colors.text,
                  marginBottom: 2,
                }}
              >
                {formData.firstName} {formData.lastName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {formData.email}
              </Text>
            </View>
          </Card>

          {/* Personal Information */}
          <Card isDark={isDark}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: 12,
              }}
            >
              Personal Information
            </Text>

            <View style={{ gap: 12 }}>
              {/* First Name */}
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 6,
                    fontWeight: '500',
                  }}
                >
                  First Name
                </Text>
                <TextInput
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: errors.firstName ? colors.error : colors.border,
                    borderRadius: 8,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: editMode ? colors.background : colors.border + '20',
                  }}
                  value={formData.firstName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, firstName: text })
                  }
                  editable={editMode}
                  placeholderTextColor={colors.textSecondary}
                />
                {errors.firstName && (
                  <Text style={{ fontSize: 11, color: colors.error, marginTop: 4 }}>
                    {errors.firstName}
                  </Text>
                )}
              </View>

              {/* Last Name */}
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 6,
                    fontWeight: '500',
                  }}
                >
                  Last Name
                </Text>
                <TextInput
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: errors.lastName ? colors.error : colors.border,
                    borderRadius: 8,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: editMode ? colors.background : colors.border + '20',
                  }}
                  value={formData.lastName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, lastName: text })
                  }
                  editable={editMode}
                  placeholderTextColor={colors.textSecondary}
                />
                {errors.lastName && (
                  <Text style={{ fontSize: 11, color: colors.error, marginTop: 4 }}>
                    {errors.lastName}
                  </Text>
                )}
              </View>

              {/* Email */}
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 6,
                    fontWeight: '500',
                  }}
                >
                  Email Address
                </Text>
                <TextInput
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: errors.email ? colors.error : colors.border,
                    borderRadius: 8,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: editMode ? colors.background : colors.border + '20',
                  }}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  editable={editMode}
                  keyboardType="email-address"
                  placeholderTextColor={colors.textSecondary}
                />
                {errors.email && (
                  <Text style={{ fontSize: 11, color: colors.error, marginTop: 4 }}>
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Phone */}
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 6,
                    fontWeight: '500',
                  }}
                >
                  Phone Number
                </Text>
                <TextInput
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: errors.phone ? colors.error : colors.border,
                    borderRadius: 8,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: editMode ? colors.background : colors.border + '20',
                  }}
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  editable={editMode}
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textSecondary}
                />
                {errors.phone && (
                  <Text style={{ fontSize: 11, color: colors.error, marginTop: 4 }}>
                    {errors.phone}
                  </Text>
                )}
              </View>
            </View>
          </Card>

          {/* Additional Information */}
          <Card isDark={isDark}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: 12,
              }}
            >
              Additional Information
            </Text>

            <View style={{ gap: 12 }}>
              {/* Date of Birth */}
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 6,
                    fontWeight: '500',
                  }}
                >
                  Date of Birth
                </Text>
                <TextInput
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: editMode ? colors.background : colors.border + '20',
                  }}
                  value={formData.dateOfBirth}
                  onChangeText={(text) =>
                    setFormData({ ...formData, dateOfBirth: text })
                  }
                  editable={editMode}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Gender */}
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 6,
                    fontWeight: '500',
                  }}
                >
                  Gender
                </Text>
                {editMode ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['male', 'female', 'other'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() =>
                          setFormData({ ...formData, gender: option })
                        }
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor:
                            formData.gender === option
                              ? colors.primary
                              : colors.border,
                          backgroundColor:
                            formData.gender === option
                              ? colors.primary + '15'
                              : colors.background,
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color:
                              formData.gender === option
                                ? colors.primary
                                : colors.textSecondary,
                            textTransform: 'capitalize',
                          }}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      backgroundColor: colors.border + '20',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.text,
                        textTransform: 'capitalize',
                      }}
                    >
                      {formData.gender}
                    </Text>
                  </View>
                )}
              </View>

              {/* City */}
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 6,
                    fontWeight: '500',
                  }}
                >
                  City
                </Text>
                <TextInput
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: errors.city ? colors.error : colors.border,
                    borderRadius: 8,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: editMode ? colors.background : colors.border + '20',
                  }}
                  value={formData.city}
                  onChangeText={(text) =>
                    setFormData({ ...formData, city: text })
                  }
                  editable={editMode}
                  placeholderTextColor={colors.textSecondary}
                />
                {errors.city && (
                  <Text style={{ fontSize: 11, color: colors.error, marginTop: 4 }}>
                    {errors.city}
                  </Text>
                )}
              </View>

              {/* Address */}
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 6,
                    fontWeight: '500',
                  }}
                >
                  Address
                </Text>
                <TextInput
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: editMode ? colors.background : colors.border + '20',
                    minHeight: 70,
                    textAlignVertical: 'top',
                  }}
                  value={formData.address}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address: text })
                  }
                  editable={editMode}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          </Card>

          {/* Save Button */}
          {editMode && (
            <View style={{ paddingHorizontal: 20, gap: 12, marginTop: 20 }}>
              <Button
                title={isSaving ? 'Saving...' : 'Save Changes'}
                onPress={handleSave}
                isDark={isDark}
                disabled={isSaving}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
