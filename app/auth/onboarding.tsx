// 'use client';

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/utils/colors';

const { width, height } = Dimensions.get('window');

// Responsive scaling
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: [string, string];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to\nCharter Keke',
    description:
      'The easiest way to book a ride. Safe, affordable, and available 24/7.',
    icon: 'car-connected',
    color: '#FF6B00',
    bgGradient: ['rgba(255, 107, 0, 0.12)', 'rgba(255, 107, 0, 0.03)'],
  },
  {
    id: '2',
    title: 'Choose\nYour Ride',
    description:
      'Select from Keke, Bike, or Car. Get instant pricing and ETA.',
    icon: 'target',
    color: '#0066CC',
    bgGradient: ['rgba(0, 102, 204, 0.12)', 'rgba(0, 102, 204, 0.03)'],
  },
  {
    id: '3',
    title: 'Track Your\nDriver',
    description:
      'Real-time tracking with driver info. Stay safe with our safety features.',
    icon: 'map-marker-radius',
    color: '#00B368',
    bgGradient: ['rgba(0, 179, 104, 0.12)', 'rgba(0, 179, 104, 0.03)'],
  },
  {
    id: '4',
    title: 'Rate &\nReview',
    description:
      'Build trust in our community. Rate drivers and share your experience.',
    icon: 'star-circle',
    color: '#FFB800',
    bgGradient: ['rgba(255, 184, 0, 0.12)', 'rgba(255, 184, 0, 0.03)'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    setCurrentIndex(newIndex);
  };

  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      await markOnboardingComplete();
      router.push('/auth/login-new');
    }
  };

  const handleSkip = async () => {
    await markOnboardingComplete();
    router.push('/auth/login-new');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.stepCounter}>
            <Text style={styles.stepCurrent}>{currentIndex + 1}</Text>
            <Text style={styles.stepDivider}>/</Text>
            <Text style={styles.stepTotal}>{slides.length}</Text>
          </View>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={moderateScale(14)}
              color={COLORS.light.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: false,
              listener: handleScroll,
            }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={{
            width: width * slides.length,
          }}
        >
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.slideContainer, { width }]}
            >
              {/* Icon area */}
              <View style={styles.iconArea}>
                <LinearGradient
                  colors={slide.bgGradient}
                  style={styles.iconOuterRing}
                >
                  <View
                    style={[
                      styles.iconInnerRing,
                      { backgroundColor: slide.color + '18' },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconCore,
                        { backgroundColor: slide.color + '20' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={slide.icon as any}
                        size={moderateScale(40)}
                        color={slide.color}
                      />
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Text content */}
              <View style={styles.textArea}>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <View style={[styles.titleUnderline, { backgroundColor: slide.color + '40' }]} />
                <Text style={styles.slideDescription}>{slide.description}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Progress dots */}
          <View style={styles.dotsContainer}>
            {slides.map((_, index) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [
                  (index - 1) * width,
                  index * width,
                  (index + 1) * width,
                ],
                outputRange: [scale(8), scale(28), scale(8)],
                extrapolate: 'clamp',
              });
              const dotOpacity = scrollX.interpolate({
                inputRange: [
                  (index - 1) * width,
                  index * width,
                  (index + 1) * width,
                ],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity: dotOpacity,
                      backgroundColor:
                        index === currentIndex
                          ? slides[currentIndex].color
                          : COLORS.light.border,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={handleNext}
              style={[
                styles.nextButton,
                { backgroundColor: slides[currentIndex].color },
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
              </Text>
              <View style={styles.nextArrowBg}>
                <MaterialCommunityIcons
                  name={currentIndex === slides.length - 1 ? 'check' : 'arrow-right'}
                  size={moderateScale(16)}
                  color={slides[currentIndex].color}
                />
              </View>
            </TouchableOpacity>

            {currentIndex === 0 && (
              <TouchableOpacity
                onPress={handleSkip}
                style={styles.skipTourButton}
                activeOpacity={0.7}
              >
                <Text style={styles.skipTourText}>Skip Tour</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(14),
  },
  stepCounter: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  stepCurrent: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: COLORS.light.primary,
  },
  stepDivider: {
    fontSize: moderateScale(13),
    fontWeight: '400',
    color: COLORS.light.border,
    marginHorizontal: scale(2),
  },
  stepTotal: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: COLORS.light.textSecondary,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
    backgroundColor: 'rgba(0,0,0,0.04)',
    gap: scale(2),
  },
  skipText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: COLORS.light.textSecondary,
    letterSpacing: 0.2,
  },
  slideContainer: {
    paddingHorizontal: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconArea: {
    marginBottom: verticalScale(36),
    alignItems: 'center',
  },
  iconOuterRing: {
    width: scale(180),
    height: scale(180),
    borderRadius: scale(90),
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInnerRing: {
    width: scale(140),
    height: scale(140),
    borderRadius: scale(70),
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCore: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    alignItems: 'center',
    paddingHorizontal: scale(12),
  },
  slideTitle: {
    fontSize: moderateScale(30),
    fontWeight: '900',
    color: COLORS.light.text,
    textAlign: 'center',
    marginBottom: verticalScale(12),
    lineHeight: moderateScale(38),
    letterSpacing: -0.3,
  },
  titleUnderline: {
    width: scale(40),
    height: scale(3),
    borderRadius: scale(1.5),
    marginBottom: verticalScale(16),
  },
  slideDescription: {
    fontSize: moderateScale(14),
    color: COLORS.light.textSecondary,
    textAlign: 'center',
    lineHeight: moderateScale(22),
    maxWidth: scale(280),
    fontWeight: '400',
  },
  footer: {
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(20),
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(24),
    gap: scale(6),
  },
  dot: {
    height: scale(6),
    borderRadius: scale(3),
  },
  buttonsContainer: {
    gap: verticalScale(12),
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(24),
    borderRadius: scale(14),
    gap: scale(10),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  nextButtonText: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  nextArrowBg: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipTourButton: {
    paddingVertical: verticalScale(14),
    borderRadius: scale(14),
    borderWidth: 1.5,
    borderColor: COLORS.light.border,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  skipTourText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: COLORS.light.text,
    letterSpacing: 0.2,
  },
});
