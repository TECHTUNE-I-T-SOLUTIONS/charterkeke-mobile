import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PromotionalAdCarousel } from './PromotionalAdCarousel';

const { width, height } = Dimensions.get('window');
const COUNTDOWN_DURATION = 7; // 7 seconds

interface FullScreenAdDisplayProps {
  visible: boolean;
  onClose: () => void;
  onBookNow?: () => void;
}

export function FullScreenAdDisplay({
  visible,
  onClose,
  onBookNow,
}: FullScreenAdDisplayProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [canSkip, setCanSkip] = useState(false);
  const countdownIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      setCountdown(COUNTDOWN_DURATION);
      setCanSkip(false);
      return;
    }

    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [visible, fadeAnim]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleBookNow = () => {
    handleClose();
    if (onBookNow) {
      setTimeout(onBookNow, 300);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Skip Button with Countdown */}
        <View style={styles.skipContainer}>
          <TouchableOpacity
            style={[
              styles.skipButton,
              !canSkip && styles.skipButtonDisabled,
            ]}
            onPress={handleClose}
            disabled={!canSkip}
            activeOpacity={canSkip ? 0.7 : 1}
          >
            <Text style={styles.skipText}>
              {canSkip ? '✕ Skip' : `Skip in ${countdown}s`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Full Screen Ad Carousel */}
        <View style={styles.carouselContainer}>
          <PromotionalAdCarousel
            onBookNowPress={handleBookNow}
          />
        </View>

        {/* Video Ad Warning Text */}
        <View style={styles.adLabel}>
          <Text style={styles.adLabelText}>Advertisement • 1 of 1</Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingBottom: 0,
  },
  skipContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 16 : 8,
    right: 16,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  skipButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  skipText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  adLabel: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  adLabelText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
