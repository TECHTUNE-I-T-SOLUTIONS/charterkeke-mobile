// 'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  TextInput,
  Image,
  Alert,
  Modal,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@context/AuthContext';
import { useTheme } from '@context/ThemeContext';
import { ThemeToggle } from '@components/ThemeToggle';
import { BRAND } from '@utils/colors';
import { apiService } from '@services/api';

const { width, height } = Dimensions.get('window');

// Responsive scaling
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

type SignupStep = 'role' | 'basic' | 'emergency' | 'security';
type UserRole = 'rider' | 'driver';

const STEPS: Record<SignupStep, { number: number; label: string; icon: string }> = {
  role: { number: 1, label: 'Role', icon: 'account-switch' },
  basic: { number: 2, label: 'Basic Info', icon: 'card-account-details' },
  emergency: { number: 3, label: 'Emergency', icon: 'phone-alert' },
  security: { number: 4, label: 'Security', icon: 'shield-lock' },
};

export default function SignupMultiStepScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signup, isLoading, updateUserProfile } = useAuth();
  const { theme } = useTheme();

  const [currentStep, setCurrentStep] = useState<SignupStep>('role');
  const [role, setRole] = useState<UserRole | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+234',
    homeAddress: '',
    workAddress: '',
    dob: '',
    gender: '',
    password: '',
    confirmPassword: '',
    profileImage: null as any,
    emergencyContactName: '',
    emergencyContactPhone: '',
    referralCode: '',
    // Driver-specific fields
    bankName: '',
    bankCode: '',
    bankAccountNumber: '',
    verifiedAccountName: '',
    vehicleType: '',
    plateNumber: '',
    unionName: '',
    vehicleImage: null as any,
    licenseImage: null as any,
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVehicleImage, setPreviewVehicleImage] = useState<string | null>(null);
  const [previewLicenseImage, setPreviewLicenseImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Memoized handler to prevent keyboard focus loss
  const handleFieldChange = useCallback((field: string, value: string) => {
    const normalizedValue =
      field === 'bankAccountNumber' ? value.replace(/\D/g, '').slice(0, 10) : value;

    setFormData((prev) => {
      const next = { ...prev, [field]: normalizedValue };
      if (field === 'bankAccountNumber' || field === 'bankCode') {
        next.verifiedAccountName = '';
      }
      return next;
    });
    if (field === 'bankAccountNumber' || field === 'bankCode') {
      setAccountVerified(false);
    }
  }, []);

  // === ENTRANCE ANIMATIONS ===
  const stepFade = useRef(new Animated.Value(0)).current;
  const stepSlide = useRef(new Animated.Value(verticalScale(30))).current;
  const stepScale = useRef(new Animated.Value(0.95)).current;

  // === LIVE AMBIENT ANIMATIONS ===
  // Floating orbs
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Opacity = useRef(new Animated.Value(0.03)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb2Opacity = useRef(new Animated.Value(0.02)).current;

  // Step circle pulse for active step
  const activeStepPulse = useRef(new Animated.Value(1)).current;
  const activeStepGlow = useRef(new Animated.Value(0.15)).current;

  // Role card hover glow
  const roleGlow1 = useRef(new Animated.Value(0)).current;
  const roleGlow2 = useRef(new Animated.Value(0)).current;

  // Button breathing
  const buttonBreath = useRef(new Animated.Value(1)).current;

  // Safety banner icon pulse
  const safetyPulse = useRef(new Animated.Value(1)).current;

  // Camera circle pulse
  const cameraPulse = useRef(new Animated.Value(1)).current;

  // Password strength dot animation
  const strengthDotScale = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const triggerStepAnimation = () => {
    stepFade.setValue(0);
    stepSlide.setValue(verticalScale(30));
    stepScale.setValue(0.95);

    Animated.parallel([
      Animated.timing(stepFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(stepSlide, {
        toValue: 0,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(stepScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    triggerStepAnimation();

    // === LIVE AMBIENT ===

    // Floating orb 1
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb1Y, {
            toValue: -verticalScale(22),
            duration: 6000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1X, {
            toValue: scale(12),
            duration: 6000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1Opacity, {
            toValue: 0.06,
            duration: 6000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb1Y, {
            toValue: verticalScale(16),
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1X, {
            toValue: -scale(8),
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1Opacity, {
            toValue: 0.03,
            duration: 7000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Floating orb 2
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb2Y, {
            toValue: verticalScale(18),
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2X, {
            toValue: -scale(14),
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2Opacity, {
            toValue: 0.05,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb2Y, {
            toValue: -verticalScale(14),
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2X, {
            toValue: scale(10),
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2Opacity, {
            toValue: 0.02,
            duration: 7000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Active step indicator pulse
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(activeStepPulse, {
            toValue: 1.15,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(activeStepGlow, {
            toValue: 0.3,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(activeStepPulse, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(activeStepGlow, {
            toValue: 0.15,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Role card gentle glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(roleGlow1, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(roleGlow1, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(roleGlow2, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(roleGlow2, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1200);

    // Button breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonBreath, {
          toValue: 1.015,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(buttonBreath, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Safety banner icon pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(safetyPulse, {
          toValue: 1.15,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(safetyPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Camera circle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(cameraPulse, {
          toValue: 1.06,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(cameraPulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Password strength dots staggered pulse
    strengthDotScale.forEach((anim, index) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1.4,
              duration: 1200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, index * 300);
    });
  }, []);

  // Trigger step animation on step change
  useEffect(() => {
    triggerStepAnimation();
  }, [currentStep]);

  const loadBanks = async () => {
    setLoadingBanks(true);
    try {
      const paystackKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY;
      const response = await fetch('https://api.paystack.co/bank', {
        headers: paystackKey ? { Authorization: `Bearer ${paystackKey}` } : {},
      });
      const data = await response.json();
      if (data?.status && Array.isArray(data.data)) {
        const activeBanks = data.data.filter((bank: any) => bank.active !== false);
        setBanks(activeBanks.map((bank: any) => ({ code: bank.code, name: bank.name })));
      } else {
        setBanks([]);
      }
    } catch (error) {
      console.error('❌ [SIGNUP] Failed to fetch banks:', error);
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleSelectBank = (bank: { code: string; name: string }) => {
    setFormData((prev) => ({
      ...prev,
      bankName: bank.name,
      bankCode: bank.code,
      verifiedAccountName: '',
    }));
    setAccountVerified(false);
    setBankPickerVisible(false);
  };

  const handleVerifyBankAccount = async () => {
    if (!formData.bankAccountNumber || formData.bankAccountNumber.length !== 10) {
      Alert.alert('Invalid Account', 'Account number must be 10 digits.');
      return;
    }
    if (!formData.bankCode) {
      Alert.alert('Select Bank', 'Please select a bank to continue.');
      return;
    }

    setVerifyingAccount(true);
    try {
      const response = await apiService.post('/paystack/verify-account', {
        accountNumber: formData.bankAccountNumber,
        bankCode: formData.bankCode,
      }) as any;

      if (response?.status === true) {
        setFormData((prev) => ({
          ...prev,
          verifiedAccountName: response?.data?.account_name || '',
          bankName: prev.bankName || banks.find((bank) => bank.code === formData.bankCode)?.name || '',
        }));
        setAccountVerified(true);
        Alert.alert('Verified', 'Account verified successfully.');
      } else {
        const message = (response?.error || response?.message || 'Account verification failed.') as string;
        setAccountVerified(false);
        Alert.alert('Verification Failed', message);
      }
    } catch (error: any) {
      setAccountVerified(false);
      Alert.alert('Verification Failed', error?.message || 'Account verification failed.');
    } finally {
      setVerifyingAccount(false);
    }
  };

  const handleProceedWithoutVerification = () => {
    if (!formData.bankCode) {
      Alert.alert('Select Bank', 'Please select a bank to continue.');
      return;
    }
    if (!formData.bankAccountNumber || formData.bankAccountNumber.length !== 10) {
      Alert.alert('Invalid Account', 'Account number must be 10 digits.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      bankName: prev.bankName || banks.find((bank) => bank.code === formData.bankCode)?.name || '',
      verifiedAccountName: '',
    }));
    setAccountVerified(true);
  };

  useEffect(() => {
    if (role === 'driver' && currentStep === 'emergency' && banks.length === 0) {
      loadBanks();
    }
  }, [role, currentStep, banks.length]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        setPreviewImage(result.assets[0].uri);
        setFormData({ ...formData, profileImage: result.assets[0] });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickVehicleImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        setPreviewVehicleImage(result.assets[0].uri);
        setFormData({ ...formData, vehicleImage: result.assets[0] });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick vehicle image');
    }
  };

  const pickLicenseImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        setPreviewLicenseImage(result.assets[0].uri);
        setFormData({ ...formData, licenseImage: result.assets[0] });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick license image');
    }
  };

  const validateStep = (step: SignupStep): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'role':
        if (!role) {
          newErrors.role = 'Please select a role';
        }
        break;

      case 'basic':
        if (!formData.firstName.trim()) newErrors.firstName = 'First name required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name required';
        if (!formData.email.includes('@')) newErrors.email = 'Valid email required';
        if (formData.phone.length < 11) newErrors.phone = 'Valid phone number required';
        if (!formData.dob) newErrors.dob = 'Date of birth required';
        if (!formData.gender) newErrors.gender = 'Gender required';
        break;

      case 'emergency':
        if (role === 'rider') {
          // Rider validation
          if (!formData.emergencyContactName.trim())
            newErrors.emergencyContactName = 'Emergency contact name required';
          if (formData.emergencyContactPhone.length < 11)
            newErrors.emergencyContactPhone = 'Valid phone number required';
        } else if (role === 'driver') {
          // Driver validation
          if (!formData.emergencyContactName.trim())
            newErrors.emergencyContactName = 'Emergency contact name required';
          if (formData.emergencyContactPhone.length < 11)
            newErrors.emergencyContactPhone = 'Valid emergency phone required';
          if (!formData.bankCode.trim()) newErrors.bankCode = 'Select a bank';
          if (!formData.bankAccountNumber.trim())
            newErrors.bankAccountNumber = 'Bank account number required';
          if (formData.bankAccountNumber.length !== 10)
            newErrors.bankAccountNumber = 'Valid bank account number required';
          if (!accountVerified) newErrors.bankVerification = 'Verify your bank account';
          if (!formData.vehicleType.trim()) newErrors.vehicleType = 'Vehicle type required';
          if (!formData.plateNumber.trim()) newErrors.plateNumber = 'Plate number required';
          if (!formData.unionName.trim()) newErrors.unionName = 'Union name required';
          if (!formData.vehicleImage) newErrors.vehicleImage = 'Vehicle photo required';
          if (!formData.licenseImage) newErrors.licenseImage = 'License photo required';
        }
        break;

      case 'security':
        if (formData.password.length < 8) newErrors.password = 'Minimum 8 characters';
        if (formData.password !== formData.confirmPassword)
          newErrors.confirmPassword = 'Passwords do not match';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const stepOrder: SignupStep[] = ['role', 'basic', 'emergency', 'security'];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
      setErrors({});
    }
  };

  const handleBack = () => {
    const stepOrder: SignupStep[] = ['role', 'basic', 'emergency', 'security'];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
      setErrors({});
    } else {
      router.back();
    }
  };

  const uploadProfilePictureInBackground = (imageAsset: any) => {
    if (!imageAsset?.uri) return;

    const fileName = imageAsset.fileName || imageAsset.uri.split('/').pop() || 'profile.jpg';
    const fileType = imageAsset.mimeType || 'image/jpeg';

    const uploadFormData = new FormData();
    uploadFormData.append('profilePicture', {
      uri: imageAsset.uri,
      type: fileType,
      name: fileName,
    } as any);

    void apiService
      .post('/user/profile/avatar', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(async (response: any) => {
        const uploadedAvatar = response?.user?.profile_picture_url;
        if (uploadedAvatar) {
          await updateUserProfile({
            avatar: uploadedAvatar,
            profile_picture_url: uploadedAvatar,
          } as any);
        }
      })
      .catch((error) => {
        console.error('⚠️ [SIGNUP] Background avatar upload failed:', error);
      });
  };

  const handleSignup = async () => {
    if (!validateStep('security')) return;

    try {
      const deferredProfileImage = formData.profileImage;
      const formDataObj = new FormData();

      // Common fields for all users
      formDataObj.append('firstName', formData.firstName);
      formDataObj.append('lastName', formData.lastName);
      formDataObj.append('email', formData.email);
      formDataObj.append('phone', formData.phone);
      if (formData.homeAddress) {
        formDataObj.append('homeAddress', formData.homeAddress);
      }
      if (formData.workAddress) {
        formDataObj.append('workAddress', formData.workAddress);
      }
      formDataObj.append('dob', formData.dob);
      formDataObj.append('gender', formData.gender);
      if (formData.emergencyContactName) {
        formDataObj.append('emergencyContactName', formData.emergencyContactName);
      }
      if (formData.emergencyContactPhone) {
        formDataObj.append('emergencyContactPhone', formData.emergencyContactPhone);
      }
      formDataObj.append('password', formData.password);
      if (role) {
        formDataObj.append('role', role === 'rider' ? 'user' : role);
      }

      // Role-specific fields
      if (role === 'rider') {
        if (formData.referralCode) {
          formDataObj.append('referralCode', formData.referralCode);
        }
      } else if (role === 'driver') {
        // Driver-specific fields
        const selectedBankName = formData.bankName || banks.find((bank) => bank.code === formData.bankCode)?.name || '';
        formDataObj.append('bankName', selectedBankName);
        formDataObj.append('bankAccountNumber', formData.bankAccountNumber);
        if (formData.bankCode) {
          formDataObj.append('bankCode', formData.bankCode);
        }
        if (formData.verifiedAccountName) {
          formDataObj.append('accountName', formData.verifiedAccountName);
        }
        formDataObj.append('vehicleType', formData.vehicleType);
        formDataObj.append('plateNumber', formData.plateNumber);
        formDataObj.append('unionName', formData.unionName);

        // Vehicle and license photos
        if (formData.vehicleImage) {
          formDataObj.append('vehiclePicture', {
            uri: formData.vehicleImage.uri,
            type: formData.vehicleImage.mimeType || 'image/jpeg',
            name: formData.vehicleImage.uri.split('/').pop() || 'vehicle.jpg',
          } as any);
        }

        if (formData.licenseImage) {
          formDataObj.append('licensePicture', {
            uri: formData.licenseImage.uri,
            type: formData.licenseImage.mimeType || 'image/jpeg',
            name: formData.licenseImage.uri.split('/').pop() || 'license.jpg',
          } as any);
        }
      }

      await signup(formDataObj);

      if (deferredProfileImage) {
        uploadProfilePictureInBackground(deferredProfileImage);
      }

      // Navigate based on role
      const targetRoute = role === 'driver' ? '/driver/home' : '/rider/home';
      router.replace(targetRoute);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Signup failed');
    }
  };

  const getProgressColor = (stepName: SignupStep): string => {
    const order: SignupStep[] = ['role', 'basic', 'emergency', 'security'];
    const currentIdx = order.indexOf(currentStep);
    const stepIdx = order.indexOf(stepName);

    if (stepIdx < currentIdx) return '#F18902';
    if (stepIdx === currentIdx) return '#F18902';
    return 'rgba(241, 137, 2, 0.94)';
  };

  const StepIndicator = () => (
    <View style={styles.stepIndicator}>
      {(Object.keys(STEPS) as SignupStep[]).map((step, index) => {
        const isActive = step === currentStep;
        const isCompleted = getProgressColor(step) === '#F18902';
        const isFuture = !isActive && !isCompleted;

        return (
          <React.Fragment key={step}>
            <View style={styles.stepItem}>
              {isActive ? (
                <Animated.View
                  style={[
                    styles.stepCircleGlow,
                    { opacity: activeStepGlow },
                  ]}
                />
              ) : null}
              <Animated.View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: isCompleted
                      ? '#F18902'
                      : isActive
                      ? 'rgb(248, 167, 62)'
                      : 'rgba(221, 170, 103, 0.94)',
                    borderWidth: isActive ? 2 : 0,
                    borderColor: isActive ? '#F5F2ED' : 'transparent',
                    transform: isActive ? [{ scale: activeStepPulse }] : [],
                  },
                ]}
              >
                {isCompleted ? (
                  <MaterialCommunityIcons name="check" size={moderateScale(14)} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      { 
                        opacity: isFuture ? 0.4 : 1,
                        color: '#000000',
                      },
                    ]}
                  >
                    {STEPS[step].number}
                  </Text>
                )}
              </Animated.View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: theme.colors.textPrimary,
                  },
                  isActive && styles.stepLabelActive,
                  isFuture && { opacity: 0.4 },
                ]}
              >
                {STEPS[step].label}
              </Text>
            </View>

            {index < Object.keys(STEPS).length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor: isCompleted
                      ? '#F18902'
                      : 'rgba(146, 144, 142, 0.88)',
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );

  const InputField = useMemo(() => {
    return ({
      label,
      value,
      onChangeText,
      placeholder,
      error,
      keyboardType = 'default',
      icon,
    }: {
      label: string;
      value: string;
      onChangeText: (text: string) => void;
      placeholder: string;
      error?: string;
      keyboardType?: any;
      icon?: string;
    }) => (
      <View>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
        <View
          style={[
            styles.inputWrapper,
            {
              borderColor: error ? theme.colors.error : theme.colors.border,
              backgroundColor: theme.colors.inputBackground,
            },
            error ? styles.inputWrapperError : null,
          ]}
        >
          {icon && (
            <MaterialCommunityIcons
              name={icon as any}
              size={moderateScale(16)}
              color={theme.colors.textSecondary}
              style={styles.inputIcon}
            />
          )}
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary }]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.inputPlaceholder}
            keyboardType={keyboardType}
            value={value}
            onChangeText={onChangeText}
          />
        </View>
        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        )}
      </View>
    );
  }, [theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'light' ? 'dark-content' : 'light-content'} />
      {/* Theme Toggle */}
      <ThemeToggle top={insets.top + 16} right={16} />

      {/* Animated floating orbs */}
      <Animated.View
        style={[
          styles.decorOrb1,
          {
            opacity: orb1Opacity,
            transform: [{ translateY: orb1Y }, { translateX: orb1X }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.decorOrb2,
          {
            opacity: orb2Opacity,
            transform: [{ translateY: orb2Y }, { translateX: orb2X }],
          },
        ]}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={moderateScale(20)}
                  color={theme.colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Create Account</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Progress Indicator */}
            <StepIndicator />

            {/* Animated Step Content */}
            <Animated.View
              style={{
                opacity: stepFade,
                transform: [{ translateY: stepSlide }, { scale: stepScale }],
              }}
            >
              {/* Step 1: Role Selection */}
              {currentStep === 'role' && (
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>Select Your Role</Text>
                  <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
                    Choose how you want to use Charter Keke
                  </Text>

                  <View style={styles.roleContainer}>
                    <TouchableOpacity
                      onPress={() => setRole('rider')}
                      activeOpacity={0.8}
                      style={[
                        styles.roleCard,
                        role === 'rider' && styles.roleCardActive,
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.roleCardGlow,
                          {
                            opacity: roleGlow1.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 0.03],
                            }),
                          },
                        ]}
                      />
                      <View style={styles.roleIconBg}>
                        <MaterialCommunityIcons
                          name="account"
                          size={moderateScale(32)}
                          color={theme.colors.primary}
                        />
                      </View>
                      <Text style={[styles.roleTitle, { color: theme.colors.textPrimary }]}>Rider</Text>
                      <Text style={[styles.roleDesc, { color: theme.colors.textSecondary }]}>
                        Book and ride with Charter Keke
                      </Text>
                      {role === 'rider' && (
                        <View style={styles.roleCheckmark}>
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={moderateScale(22)}
                            color="#F18902"
                          />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setRole('driver')}
                      activeOpacity={0.8}
                      style={[
                        styles.roleCard,
                        role === 'driver' && styles.roleCardActive,
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.roleCardGlow,
                          {
                            opacity: roleGlow2.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 0.03],
                            }),
                          },
                        ]}
                      />
                      <View style={styles.roleIconBg}>
                        <MaterialCommunityIcons
                          name="truck"
                          size={moderateScale(32)}
                          color={theme.colors.primary}
                        />
                      </View>
                      <Text style={[styles.roleTitle, { color: theme.colors.textPrimary }]}>Driver</Text>
                      <Text style={[styles.roleDesc, { color: theme.colors.textSecondary }]}>
                        Earn money driving your keke
                      </Text>
                      {role === 'driver' && (
                        <View style={styles.roleCheckmark}>
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={moderateScale(22)}
                            color="#F18902"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  {errors.role && (
                    <Text style={styles.errorText}>{errors.role}</Text>
                  )}
                </View>
              )}

              {/* Step 2: Basic Info */}
              {currentStep === 'basic' && (
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>Basic Information</Text>
                  <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>Tell us about yourself</Text>

                  <View style={styles.form}>
                    {/* Profile Picture with animated camera */}
                    <TouchableOpacity
                      onPress={pickImage}
                      style={styles.imageUploadContainer}
                      activeOpacity={0.8}
                    >
                      {previewImage ? (
                        <View style={styles.profileImageContainer}>
                          <Image source={{ uri: previewImage }} style={styles.profileImage} />
                          <View style={styles.editImageBadge}>
                            <MaterialCommunityIcons
                              name="pencil"
                              size={moderateScale(12)}
                              color="#F18902"
                            />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.imageUploadPlaceholder}>
                          <Animated.View
                            style={[
                              styles.cameraCircle,
                              { transform: [{ scale: cameraPulse }] },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="camera-plus"
                              size={moderateScale(28)}
                              color="#F18902"
                            />
                          </Animated.View>
                          <Text style={styles.uploadText}>Add Profile Photo</Text>
                          <Text style={styles.uploadHint}>Tap to upload</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Names Row */}
                    <View style={styles.row}>
                      <View style={styles.halfField}>
                        <InputField
                          label="First Name *"
                          value={formData.firstName}
                          onChangeText={(text) => handleFieldChange('firstName', text)}
                          placeholder="John"
                          error={errors.firstName}
                          icon="account-outline"
                        />
                      </View>
                      <View style={styles.halfField}>
                        <InputField
                          label="Last Name *"
                          value={formData.lastName}
                          onChangeText={(text) => handleFieldChange('lastName', text)}
                          placeholder="Doe"
                          error={errors.lastName}
                          icon="account-outline"
                        />
                      </View>
                    </View>

                    <InputField
                      label="Email *"
                      value={formData.email}
                      onChangeText={(text) => handleFieldChange('email', text)}
                      placeholder="john@example.com"
                      error={errors.email}
                      keyboardType="email-address"
                      icon="email-outline"
                    />

                    <InputField
                      label="Phone Number *"
                      value={formData.phone}
                      onChangeText={(text) => handleFieldChange('phone', text)}
                      placeholder="+234 801 234 5678"
                      error={errors.phone}
                      keyboardType="phone-pad"
                      icon="phone-outline"
                    />

                    <InputField
                      label="Home Address"
                      value={formData.homeAddress}
                      onChangeText={(text) => handleFieldChange('homeAddress', text)}
                      placeholder="Enter your home address"
                      icon="home-outline"
                    />

                    <InputField
                      label="Work Address"
                      value={formData.workAddress}
                      onChangeText={(text) => handleFieldChange('workAddress', text)}
                      placeholder="Enter your work address"
                      icon="briefcase-outline"
                    />

                    {/* Date of Birth */}
                    <View>
                      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Date of Birth *</Text>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.8}
                        style={[
                          styles.inputWrapper,
                          {
                            borderColor: errors.dob ? theme.colors.error : theme.colors.border,
                            backgroundColor: theme.colors.inputBackground,
                          },
                          errors.dob ? styles.inputWrapperError : null,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="calendar-outline"
                          size={moderateScale(16)}
                          color={theme.colors.textSecondary}
                          style={styles.inputIcon}
                        />
                        <Text
                          style={[
                            styles.input,
                            {
                              color: formData.dob ? theme.colors.textPrimary : theme.colors.inputPlaceholder,
                            },
                          ]}
                        >
                          {formData.dob
                            ? new Date(formData.dob).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : 'Select your date of birth'}
                        </Text>
                      </TouchableOpacity>
                      {errors.dob && (
                        <Text style={[styles.errorText, { color: theme.colors.error }]}>
                          {errors.dob}
                        </Text>
                      )}
                    </View>

                    {/* Date Picker Modal for iOS */}
                    {Platform.OS === 'ios' && showDatePicker && (
                      <Modal
                        visible={showDatePicker}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowDatePicker(false)}
                      >
                        <View style={styles.datePickerModal}>
                          <View style={[styles.datePickerContainer, { backgroundColor: theme.colors.card }]}>
                            <View style={styles.datePickerHeader}>
                              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text style={[styles.datePickerButton, { color: theme.colors.primary }]}>
                                  Done
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <DateTimePicker
                              value={formData.dob ? new Date(formData.dob) : new Date()}
                              mode="date"
                              display="spinner"
                              maximumDate={new Date()}
                              onChange={(event, date) => {
                                if (date) {
                                  handleFieldChange('dob', date.toISOString().split('T')[0]);
                                }
                              }}
                              textColor={theme.colors.textPrimary}
                            />
                          </View>
                        </View>
                      </Modal>
                    )}

                    {/* Date Picker for Android */}
                    {Platform.OS === 'android' && showDatePicker && (
                      <DateTimePicker
                        value={formData.dob ? new Date(formData.dob) : new Date()}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        onChange={(event, date) => {
                          setShowDatePicker(false);
                          if (date && event.type === 'set') {
                            handleFieldChange('dob', date.toISOString().split('T')[0]);
                          }
                        }}
                      />
                    )}


                    {/* Gender */}
                    <View>
                      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Gender *</Text>
                      <View style={styles.genderRow}>
                        {['male', 'female', 'other'].map((g) => (
                          <TouchableOpacity
                            key={g}
                            onPress={() => setFormData({ ...formData, gender: g })}
                            activeOpacity={0.8}
                            style={[
                              styles.genderBtn,
                              formData.gender === g && styles.genderBtnActive,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={
                                g === 'male'
                                  ? 'gender-male'
                                  : g === 'female'
                                  ? 'gender-female'
                                  : 'gender-non-binary'
                              }
                              size={moderateScale(14)}
                              color={formData.gender === g ? theme.colors.primary : theme.colors.textTertiary}
                              style={{ marginRight: scale(4) }}
                            />
                            <Text
                              style={[
                                styles.genderText,
                                {
                                  color: formData.gender === g
                                    ? theme.colors.primary
                                    : theme.colors.textTertiary,
                                },
                                formData.gender === g && styles.genderTextActive,
                              ]}
                            >
                              {g.charAt(0).toUpperCase() + g.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Step 3: Emergency Contact / Driver Info */}
              {currentStep === 'emergency' && (
                <View style={styles.stepContent}>
                  {role === 'rider' ? (
                    <>
                      <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>Emergency Contact</Text>
                      <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
                        For your safety and security
                      </Text>

                      <View style={styles.safetyBanner}>
                        <Animated.View style={{ transform: [{ scale: safetyPulse }] }}>
                          <MaterialCommunityIcons
                            name="shield-check"
                            size={moderateScale(18)}
                            color="#F18902"
                          />
                        </Animated.View>
                        <Text style={[styles.safetyText, { color: theme.colors.textSecondary }]}>
                          Your emergency contact will only be used in critical situations
                        </Text>
                      </View>

                      <View style={styles.form}>
                        <InputField
                          label="Emergency Contact Name *"
                          value={formData.emergencyContactName}
                          onChangeText={(text) =>
                            handleFieldChange('emergencyContactName', text)
                          }
                          placeholder="Full name"
                          error={errors.emergencyContactName}
                          icon="account-alert-outline"
                        />

                        <InputField
                          label="Emergency Contact Phone *"
                          value={formData.emergencyContactPhone}
                          onChangeText={(text) =>
                            handleFieldChange('emergencyContactPhone', text)
                          }
                          placeholder="08012345678"
                          error={errors.emergencyContactPhone}
                          keyboardType="phone-pad"
                          icon="phone-alert"
                        />

                        <InputField
                          label="Referral Code (Optional)"
                          value={formData.referralCode}
                          onChangeText={(text) =>
                            handleFieldChange('referralCode', text)
                          }
                          placeholder="Enter referral code if you have one"
                          icon="gift-outline"
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>Driver Information</Text>
                      <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>Vehicle & Banking Details</Text>

                      <View style={styles.safetyBanner}>
                        <Animated.View style={{ transform: [{ scale: safetyPulse }] }}>
                          <MaterialCommunityIcons
                            name="shield-check"
                            size={moderateScale(18)}
                            color="#F18902"
                          />
                        </Animated.View>
                        <Text style={[styles.safetyText, { color: theme.colors.textSecondary }]}>
                          Secure information handling for all drivers
                        </Text>
                      </View>

                      <View style={styles.form}>
                        {/* Vehicle Information */}
                        <InputField
                          label="Vehicle Type *"
                          value={formData.vehicleType}
                          onChangeText={(text) =>
                            handleFieldChange('vehicleType', text)
                          }
                          placeholder="e.g., Keke NAPEP, Marwa"
                          error={errors.vehicleType}
                          icon="truck-outline"
                        />

                        <InputField
                          label="Plate Number *"
                          value={formData.plateNumber}
                          onChangeText={(text) =>
                            handleFieldChange('plateNumber', text)
                          }
                          placeholder="e.g., ABC123"
                          error={errors.plateNumber}
                          icon="numeric-outline"
                        />

                        <InputField
                          label="Union Name *"
                          value={formData.unionName}
                          onChangeText={(text) =>
                            handleFieldChange('unionName', text)
                          }
                          placeholder="Your union/cooperative name"
                          error={errors.unionName}
                          icon="home-group"
                        />

                        <InputField
                          label="Emergency Contact Name *"
                          value={formData.emergencyContactName}
                          onChangeText={(text) =>
                            handleFieldChange('emergencyContactName', text)
                          }
                          placeholder="Emergency contact full name"
                          error={errors.emergencyContactName}
                          icon="account-alert-outline"
                        />

                        <InputField
                          label="Emergency Contact Phone *"
                          value={formData.emergencyContactPhone}
                          onChangeText={(text) =>
                            handleFieldChange('emergencyContactPhone', text)
                          }
                          placeholder="08012345678"
                          error={errors.emergencyContactPhone}
                          keyboardType="phone-pad"
                          icon="phone-alert"
                        />

                        {/* Banking Information */}
                        <View>
                          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Bank *</Text>
                          <TouchableOpacity
                            onPress={() => setBankPickerVisible(true)}
                            activeOpacity={0.85}
                            style={[
                              styles.inputWrapper,
                              {
                                borderColor: errors.bankCode ? theme.colors.error : theme.colors.border,
                                backgroundColor: theme.colors.inputBackground,
                                flexDirection: 'row',
                                alignItems: 'center',
                              },
                              errors.bankCode ? styles.inputWrapperError : null,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="bank-outline"
                              size={moderateScale(16)}
                              color={theme.colors.textSecondary}
                              style={styles.inputIcon}
                            />
                            <Text
                              style={{
                                flex: 1,
                                color: formData.bankName ? theme.colors.textPrimary : theme.colors.inputPlaceholder,
                                fontSize: moderateScale(12),
                              }}
                            >
                              {formData.bankName || (loadingBanks ? 'Loading banks...' : 'Select bank')}
                            </Text>
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={moderateScale(18)}
                              color={theme.colors.textSecondary}
                            />
                          </TouchableOpacity>
                          {errors.bankCode && (
                            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.bankCode}</Text>
                          )}
                        </View>

                        <InputField
                          label="Bank Account Number *"
                          value={formData.bankAccountNumber}
                          onChangeText={(text) =>
                            handleFieldChange('bankAccountNumber', text)
                          }
                          placeholder="Your bank account number"
                          error={errors.bankAccountNumber}
                          keyboardType="phone-pad"
                          icon="numeric-outline"
                        />

                        <TouchableOpacity
                          onPress={handleVerifyBankAccount}
                          disabled={verifyingAccount || !formData.bankCode || formData.bankAccountNumber.length !== 10}
                          style={[
                            styles.verifyButton,
                            {
                              backgroundColor: theme.colors.primary,
                              opacity:
                                verifyingAccount || !formData.bankCode || formData.bankAccountNumber.length !== 10
                                  ? 0.6
                                  : 1,
                            },
                          ]}
                        >
                          {verifyingAccount ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.verifyButtonText}>Verify Account</Text>
                          )}
                        </TouchableOpacity>

                        {accountVerified && (
                          <View style={styles.verifiedBox}>
                            <Text style={styles.verifiedTitle}>
                              {formData.verifiedAccountName ? 'Account Verified' : 'Account Accepted'}
                            </Text>
                            {formData.verifiedAccountName ? (
                              <Text style={styles.verifiedText}>{formData.verifiedAccountName}</Text>
                            ) : (
                              <Text style={styles.verifiedText}>{formData.bankAccountNumber}</Text>
                            )}
                          </View>
                        )}

                        {!accountVerified && formData.bankAccountNumber.length === 10 && formData.bankCode ? (
                          <TouchableOpacity onPress={handleProceedWithoutVerification} style={styles.manualProceedButton}>
                            <Text style={styles.manualProceedText}>Proceed without verification</Text>
                          </TouchableOpacity>
                        ) : null}

                        {errors.bankVerification && (
                          <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.bankVerification}</Text>
                        )}

                        {/* Vehicle Photo */}
                        <View style={styles.uploadSection}>
                          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Vehicle Photo *</Text>
                          <TouchableOpacity
                            onPress={pickVehicleImage}
                            style={styles.uploadBox}
                            activeOpacity={0.8}
                          >
                            {previewVehicleImage ? (
                              <>
                                <Image
                                  source={{ uri: previewVehicleImage }}
                                  style={styles.uploadedImage}
                                />
                                <View style={styles.changePhotoOverlay}>
                                  <MaterialCommunityIcons
                                    name="pencil"
                                    size={moderateScale(16)}
                                    color="#fff"
                                  />
                                  <Text style={styles.changePhotoText}>Change</Text>
                                </View>
                              </>
                            ) : (
                              <>
                                <MaterialCommunityIcons
                                  name="car-outline"
                                  size={moderateScale(32)}
                                  color="rgba(241, 137, 2, 0.94)"
                                />
                                <Text style={[styles.uploadBoxText, { color: theme.colors.textSecondary }]}>
                                  Upload Vehicle Photo
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                          {errors.vehicleImage && (
                            <Text style={styles.errorText}>{errors.vehicleImage}</Text>
                          )}
                        </View>

                        {/* License Photo */}
                        <View style={styles.uploadSection}>
                          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>License Photo *</Text>
                          <TouchableOpacity
                            onPress={pickLicenseImage}
                            style={styles.uploadBox}
                            activeOpacity={0.8}
                          >
                            {previewLicenseImage ? (
                              <>
                                <Image
                                  source={{ uri: previewLicenseImage }}
                                  style={styles.uploadedImage}
                                />
                                <View style={styles.changePhotoOverlay}>
                                  <MaterialCommunityIcons
                                    name="pencil"
                                    size={moderateScale(16)}
                                    color="#fff"
                                  />
                                  <Text style={styles.changePhotoText}>Change</Text>
                                </View>
                              </>
                            ) : (
                              <>
                                <MaterialCommunityIcons
                                  name="image-multiple-outline"
                                  size={moderateScale(32)}
                                  color="rgba(241, 137, 2, 0.94)"
                                />
                                <Text style={[styles.uploadBoxText, { color: theme.colors.textSecondary }]}>
                                  Upload License Photo
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                          {errors.licenseImage && (
                            <Text style={styles.errorText}>{errors.licenseImage}</Text>
                          )}
                        </View>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Step 4: Security */}
              {currentStep === 'security' && (
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>Secure Your Account</Text>
                  <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>Create a strong password</Text>

                  <View style={styles.form}>
                    <View>
                      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Password *</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            borderColor: errors.password ? theme.colors.error : theme.colors.border,
                            backgroundColor: theme.colors.inputBackground,
                          },
                          errors.password ? styles.inputWrapperError : null,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="lock-outline"
                          size={moderateScale(16)}
                          color="rgba(241, 137, 2, 0.94)"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, styles.passwordInput, { color: theme.colors.textPrimary }]}
                          placeholder="Minimum 8 characters"
                          placeholderTextColor={theme.colors.inputPlaceholder}
                          secureTextEntry={!showPassword}
                          value={formData.password}
                          onChangeText={(text) =>
                            handleFieldChange('password', text)
                          }
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeIcon}
                        >
                          <MaterialCommunityIcons
                            name={showPassword ? 'eye' : 'eye-off'}
                            size={moderateScale(18)}
                            color={theme.colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>
                      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                    </View>

                    {/* Password strength indicators with animated dots */}
                    <View style={styles.strengthContainer}>
                      {[
                        { label: 'Min 8 chars', met: formData.password.length >= 8 },
                        { label: 'Uppercase', met: /[A-Z]/.test(formData.password) },
                        { label: 'Number', met: /[0-9]/.test(formData.password) },
                        { label: 'Special', met: /[!@#$%^&*]/.test(formData.password) },
                      ].map((req, idx) => (
                        <View key={idx} style={styles.strengthItem}>
                          <Animated.View
                            style={[
                              styles.strengthDot,
                              {
                                backgroundColor: req.met ? '#F18902' : theme.colors.border,
                                transform: [{ scale: req.met ? strengthDotScale[idx] : 1 }],
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.strengthText,
                              { color: req.met ? '#F18902' : theme.colors.textTertiary },
                            ]}
                          >
                            {req.label}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View>
                      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Confirm Password *</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            borderColor: errors.confirmPassword ? theme.colors.error : theme.colors.border,
                            backgroundColor: theme.colors.inputBackground,
                          },
                          errors.confirmPassword ? styles.inputWrapperError : null,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="lock-check-outline"
                          size={moderateScale(16)}
                          color="rgba(241, 137, 2, 0.94)"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, styles.passwordInput, { color: theme.colors.textPrimary }]}
                          placeholder="Re-enter password"
                          placeholderTextColor={theme.colors.inputPlaceholder}
                          secureTextEntry={!showConfirmPassword}
                          value={formData.confirmPassword}
                          onChangeText={(text) =>
                            handleFieldChange('confirmPassword', text)
                          }
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeIcon}
                        >
                          <MaterialCommunityIcons
                            name={showConfirmPassword ? 'eye' : 'eye-off'}
                            size={moderateScale(18)}
                            color={theme.colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>
                      {errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={moderateScale(16)}
                  color="#F18902"
                />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              {currentStep !== 'security' ? (
                <Animated.View style={[styles.nextButton, { transform: [{ scale: buttonBreath }] }]}>
                  <TouchableOpacity
                    onPress={handleNext}
                    activeOpacity={0.85}
                    style={{ flex: 1 }}
                  >
                    <LinearGradient
                      colors={theme.mode === 'light' ? ['#1B150CBE', '#643B06C4'] : ['#F1890240', '#F1890260']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.nextButtonGradient}
                    >
                      <Text style={styles.nextButtonText}>Next</Text>
                      <View style={styles.nextArrowBg}>
                        <MaterialCommunityIcons
                          name="arrow-right"
                          size={moderateScale(14)}
                          color={BRAND.primary}
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <Animated.View style={[styles.nextButton, { transform: [{ scale: buttonBreath }] }]}>
                  <TouchableOpacity
                    onPress={handleSignup}
                    disabled={isLoading}
                    activeOpacity={0.85}
                    style={{ flex: 1 }}
                  >
                    <LinearGradient
                      colors={theme.mode === 'light' ? ['#55330788', '#29180386'] : ['#F1890250', '#F1890270']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.nextButtonGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={BRAND.secondary} />
                      ) : (
                        <>
                          <Text style={styles.nextButtonText}>Create Account</Text>
                          <View style={styles.nextArrowBg}>
                            <MaterialCommunityIcons
                              name="check"
                              size={moderateScale(14)}
                              color={BRAND.secondary}
                            />
                          </View>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login-new')}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={bankPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBankPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Select Bank</Text>
              <TouchableOpacity onPress={() => setBankPickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={moderateScale(18)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.modalSearch, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
              <TextInput
                placeholder="Search bank"
                placeholderTextColor={theme.colors.inputPlaceholder}
                value={bankSearch}
                onChangeText={setBankSearch}
                style={[styles.modalSearchInput, { color: theme.colors.textPrimary }]}
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(bankSearch
                ? banks.filter((bank) => bank.name.toLowerCase().includes(bankSearch.toLowerCase()))
                : banks
              ).map((bank) => (
                <TouchableOpacity
                  key={bank.code}
                  onPress={() => handleSelectBank(bank)}
                  style={[styles.modalRow, { borderBottomColor: theme.colors.border }]}
                >
                  <Text style={[styles.modalRowText, { color: theme.colors.textPrimary }]}>{bank.name}</Text>
                </TouchableOpacity>
              ))}
              {!loadingBanks && banks.length === 0 && (
                <Text style={[styles.modalEmptyText, { color: theme.colors.textSecondary }]}>No banks available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  decorOrb1: {
    position: 'absolute',
    top: -height * 0.06,
    right: -width * 0.12,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(214, 186, 148, 0.94)',
  },
  decorOrb2: {
    position: 'absolute',
    bottom: height * 0.08,
    left: -width * 0.18,
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: width * 0.225,
    backgroundColor: 'rgba(193, 232, 255, 0.03)',
  },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(40),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(18),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  headerSpacer: {
    width: scale(24),
  },
  backBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(28),
    paddingHorizontal: scale(4),
  },
  stepItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleGlow: {
    position: 'absolute',
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: 'rgba(241, 137, 2, 0.12)',
    top: -scale(7),
  },
  stepCircle: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  stepNumber: {
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
  stepLabel: {
    fontSize: moderateScale(9),
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  stepLabelActive: {
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    marginHorizontal: scale(6),
    marginBottom: verticalScale(18),
  },
  stepContent: {
    marginBottom: verticalScale(10),
  },
  stepTitle: {
    color: '#000000',
    fontSize: moderateScale(22),
    fontWeight: '800',
    marginBottom: verticalScale(2),
    letterSpacing: 0.1,
  },
  stepDescription: {
    color: 'rgb(0, 0, 0)',
    fontSize: moderateScale(12),
    marginBottom: verticalScale(22),
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  form: { gap: verticalScale(16) },
  row: {
    flexDirection: 'row',
    gap: scale(12),
  },
  halfField: { flex: 1 },
  label: {
    color: 'rgb(0, 0, 0)',
    fontSize: moderateScale(11),
    fontWeight: '600',
    marginBottom: verticalScale(2),
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    paddingHorizontal: scale(14),
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  inputIcon: {
    marginRight: scale(10),
  },
  input: {
    flex: 1,
    paddingVertical: verticalScale(13),
    fontSize: moderateScale(13),
    color: '#ffffff',
    fontWeight: '500',
  },
  passwordInput: {
    paddingRight: scale(40),
  },
  errorText: {
    color: '#fca5a5',
    fontSize: moderateScale(10),
    marginTop: verticalScale(4),
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  imageUploadContainer: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(241, 137, 2, 0.61)',
    borderRadius: scale(16),
    overflow: 'hidden',
    marginBottom: verticalScale(2),
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: verticalScale(100),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: scale(10),
    right: scale(10),
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: BRAND.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(193, 232, 255, 0.3)',
  },
  imageUploadPlaceholder: {
    height: verticalScale(100),
    justifyContent: 'center',
    alignItems: 'center',
    gap: verticalScale(2),
  },
  cameraCircle: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: 'rgba(193, 232, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.1)',
    marginBottom: verticalScale(2),
  },
  uploadText: {
    color: '#C1E8FF',
    fontSize: moderateScale(12),
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  uploadHint: {
    color: 'rgba(193, 232, 255, 0.4)',
    fontSize: moderateScale(10),
    fontWeight: '400',
  },
  roleContainer: {
    gap: verticalScale(14),
  },
  roleCard: {
    paddingVertical: verticalScale(22),
    paddingHorizontal: scale(20),
    backgroundColor: 'rgba(216, 128, 14, 0.48)',
    borderRadius: scale(16),
    borderWidth: 1.5,
    borderColor: 'rgba(3, 24, 36, 0.1)',
    alignItems: 'center',
    gap: verticalScale(8),
    position: 'relative',
    overflow: 'hidden',
  },
  roleCardActive: {
    backgroundColor: 'rgba(241, 137, 2, 0.53)',
    borderColor: 'rgba(49, 29, 2, 0.94)',
  },
  roleCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  roleIconBg: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: 'rgba(193, 232, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  roleTitle: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  roleDesc: {
    color: 'rgba(193, 232, 255, 0.55)',
    fontSize: moderateScale(11),
    textAlign: 'center',
    fontWeight: '400',
  },
  roleCheckmark: {
    position: 'absolute',
    top: scale(14),
    right: scale(14),
  },
  genderRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: verticalScale(12),
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: 'rgba(241, 137, 2, 0.53)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnActive: {
    backgroundColor: 'rgba(241, 137, 2, 0.12)',
    borderColor: 'rgba(241, 137, 2, 0.35)',
  },
  genderText: {
    color: 'rgba(241, 137, 2, 0.77)',
    fontWeight: '600',
    fontSize: moderateScale(11),
  },
  genderTextActive: {
    color: '#F18902',
  },
  eyeIcon: {
    position: 'absolute',
    right: scale(14),
    padding: scale(4),
  },
  strengthContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: scale(10),
    padding: scale(12),
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    width: '45%',
  },
  strengthDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  strengthText: {
    fontSize: moderateScale(10),
    fontWeight: '500',
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    backgroundColor: 'rgba(241, 137, 2, 0.53)',
    borderRadius: scale(12),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: 'rgba(100, 59, 6, 0.56)',
  },
  safetyText: {
    flex: 1,
    color: 'rgba(241, 137, 2, 0.53)',
    fontSize: moderateScale(11),
    lineHeight: moderateScale(16),
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    gap: scale(12),
    marginTop: 'auto',
    paddingTop: verticalScale(24),
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: 'rgba(241, 137, 2, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    backgroundColor: 'rgba(104, 60, 3, 0.38)',
  },
  backButtonText: {
    color: '#F18902',
    fontWeight: '600',
    fontSize: moderateScale(13),
  },
  nextButton: {
    flex: 1.3,
    overflow: 'hidden',
    borderRadius: scale(12),
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(241, 137, 2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  nextButtonGradient: {
    flexDirection: 'row',
    paddingVertical: verticalScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(8),
  },
  nextButtonText: {
    color: BRAND.primary,
    fontWeight: '800',
    fontSize: moderateScale(13),
    letterSpacing: 0.2,
  },
  nextArrowBg: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: 'rgba(5, 38, 89, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButton: {
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
  verifiedBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  verifiedTitle: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#0F766E',
    marginBottom: moderateScale(4),
  },
  verifiedText: {
    fontSize: moderateScale(12),
    color: '#0F766E',
  },
  manualProceedButton: {
    marginTop: verticalScale(6),
    alignItems: 'center',
  },
  manualProceedText: {
    color: '#F18902',
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: moderateScale(18),
    borderTopRightRadius: moderateScale(18),
    padding: moderateScale(16),
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  modalSearch: {
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(10),
  },
  modalSearchInput: {
    fontSize: moderateScale(12),
  },
  modalRow: {
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
  },
  modalRowText: {
    fontSize: moderateScale(13),
  },
  modalEmptyText: {
    textAlign: 'center',
    marginTop: verticalScale(20),
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(18),
  },
  signInText: {
    color: 'rgb(241, 137, 2)',
    fontSize: moderateScale(12),
  },
  signInLink: {
    color: '#F18902',
    fontSize: moderateScale(12),
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  uploadSection: {
    marginBottom: verticalScale(16),
  },
  uploadBox: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    borderWidth: 2,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  changePhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  uploadBoxText: {
    color: '#666666',
    fontSize: moderateScale(12),
    textAlign: 'center',
    marginTop: verticalScale(8),
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContainer: {
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingBottom: verticalScale(20),
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: moderateScale(20),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(8),
  },
  datePickerButton: {
    fontSize: moderateScale(17),
    fontWeight: '600',
  },
});
