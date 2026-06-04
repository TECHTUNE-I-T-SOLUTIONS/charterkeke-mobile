import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/utils/colors';

export default function ProfileCompletionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { updateUserProfile, isLoading } = useAuth();
  const [isDark, setIsDark] = useState(false);

  const email = Array.isArray(params.email) ? params.email[0] : params.email || '';
  const userType = Array.isArray(params.userType) ? params.userType[0] : params.userType || 'rider';

  const [formData, setFormData] = useState({
    city: 'Lagos',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    licenseNumber: '', // For drivers only
    vehicleType: 'keke', // For drivers only
    vehicleNumber: '', // For drivers only
  });

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const colors = isDark ? COLORS.dark : COLORS.light;

  const handleNext = () => {
    if (step < (userType === 'driver' ? 3 : 2)) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      const payload = {
        ...formData,
        vehicleType: formData.vehicleType as 'keke' | 'bike' | 'car' | undefined,
      };
      const result = await updateUserProfile(payload);
      if (result.success) {
        router.replace(userType === 'driver' ? '/driver/home' : '/rider/home');
      }
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  // Step 1: Personal Information
  const renderStep1 = () => (
    <View>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
        Personal Information
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>
        Help us know you better
      </Text>

      <Input
        label="City"
        placeholder="Lagos"
        value={formData.city}
        onChangeText={(text) => setFormData({ ...formData, city: text })}
        isDark={isDark}
      />

      <Input
        label="Address"
        placeholder="123 Main Street"
        value={formData.address}
        onChangeText={(text) => setFormData({ ...formData, address: text })}
        isDark={isDark}
      />
    </View>
  );

  // Step 2: Emergency Contact
  const renderStep2 = () => (
    <View>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
        Emergency Contact
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>
        In case we need to reach someone
      </Text>

      <Input
        label="Contact Name"
        placeholder="Jane Doe"
        value={formData.emergencyContact}
        onChangeText={(text) =>
          setFormData({ ...formData, emergencyContact: text })
        }
        isDark={isDark}
      />

      <Input
        label="Contact Phone"
        placeholder="+234 801 234 5678"
        value={formData.emergencyPhone}
        onChangeText={(text) =>
          setFormData({ ...formData, emergencyPhone: text })
        }
        keyboardType="phone-pad"
        isDark={isDark}
      />
    </View>
  );

  // Step 3: Driver Documents (for drivers only)
  const renderStep3 = () => (
    <View>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
        Driver Documents
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>
        Required to start accepting rides
      </Text>

      <Input
        label="Driving License Number"
        placeholder="A1234567"
        value={formData.licenseNumber}
        onChangeText={(text) =>
          setFormData({ ...formData, licenseNumber: text })
        }
        isDark={isDark}
      />

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
          Vehicle Type
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {['Keke', 'Bike', 'Car'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setFormData({ ...formData, vehicleType: type.toLowerCase() })}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                borderWidth: 2,
                borderColor:
                  formData.vehicleType === type.toLowerCase()
                    ? colors.primary
                    : colors.border,
                backgroundColor:
                  formData.vehicleType === type.toLowerCase()
                    ? colors.primary + '15'
                    : 'transparent',
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontWeight: '600',
                  color:
                    formData.vehicleType === type.toLowerCase()
                      ? colors.primary
                      : colors.textSecondary,
                }}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Input
        label="Vehicle Registration Number"
        placeholder="ABC-123-XY"
        value={formData.vehicleNumber}
        onChangeText={(text) =>
          setFormData({ ...formData, vehicleNumber: text })
        }
        isDark={isDark}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
        >
          {/* Progress Bar */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {Array.from({
                length: userType === 'driver' ? 3 : 2,
              }).map((_, index) => (
                <View
                  key={index}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor:
                      index < step ? colors.primary : colors.border,
                  }}
                />
              ))}
            </View>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                marginTop: 8,
              }}
            >
              Step {step} of {userType === 'driver' ? 3 : 2}
            </Text>
          </View>

          {/* Content */}
          <View style={{ marginBottom: 32 }}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && userType === 'driver' && renderStep3()}
          </View>

          {/* Navigation Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {step > 1 && (
              <TouchableOpacity
                onPress={() => setStep(step - 1)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontWeight: '600',
                    color: colors.text,
                  }}
                >
                  Back
                </Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Button
                title={step === (userType === 'driver' ? 3 : 2) ? 'Complete' : 'Next'}
                onPress={handleNext}
                isDark={isDark}
                disabled={isLoading}
              />
            </View>
          </View>

          {/* Skip Button */}
          <TouchableOpacity
            onPress={() => router.replace(userType === 'driver' ? '/driver/home' : '/rider/home')}
            style={{ marginTop: 16 }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              Skip for now
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
