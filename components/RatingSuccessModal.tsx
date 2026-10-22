import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { BRAND } from '@/utils/colors';

interface RatingSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onHome: () => void;
  rating: number;
  driverName: string;
  reviewText?: string;
}

export default function RatingSuccessModal({
  visible,
  onClose,
  onHome,
  rating,
  driverName,
  reviewText,
}: RatingSuccessModalProps) {
  const { theme } = useTheme();
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [starAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      starAnim.setValue(0);

      // Run entrance animations
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Star animation sequence
      const starAnimations = [0, 100, 200, 300, 400].map((delay, index) =>
        Animated.timing(starAnim, {
          toValue: index + 1,
          duration: 200,
          delay,
          useNativeDriver: true,
        })
      );
      Animated.sequence(starAnimations).start();
    }
  }, [visible]);

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => {
      const starScale = starAnim.interpolate({
        inputRange: [star - 1, star],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View
          key={star}
          style={[
            styles.starContainer,
            {
              transform: [{ scale: starScale }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="star"
            size={32}
            color={BRAND.primary}
          />
        </Animated.View>
      );
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.card,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Success Icon with bounce */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: '#10B98120',
                  transform: [
                    {
                      scale: scaleAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.8, 1.1, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <MaterialCommunityIcons name="check-circle" size={80} color="#10B981" />
            </Animated.View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Review Submitted!
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Thank you for rating {driverName}
          </Text>

          {/* Animated Stars */}
          <View style={styles.starsContainer}>{renderStars()}</View>

          {/* Rating Value */}
          <Animated.Text
            style={[
              styles.ratingValue,
              { color: BRAND.primary },
              {
                opacity: fadeAnim,
              },
            ]}
          >
            {rating}/5
          </Animated.Text>

          {/* Review Text if provided */}
          {reviewText && (
            <View style={[styles.reviewBox, { backgroundColor: theme.colors.inputBackground }]}>
              <Text style={[styles.reviewLabel, { color: theme.colors.textSecondary }]}>
                YOUR COMMENT
              </Text>
              <Text style={[styles.reviewText, { color: theme.colors.textPrimary }]}>
                {reviewText}
              </Text>
            </View>
          )}

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.colors.inputBackground }]}>
            <MaterialCommunityIcons name="information-outline" size={20} color={BRAND.primary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Your feedback helps us improve our service
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.border }]}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>
                Close
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onHome}
              style={[styles.button, styles.primaryButton, { backgroundColor: BRAND.primary }]}
            >
              <Text style={styles.primaryButtonText}>Book Another Ride</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starContainer: {
    transform: [{ scale: 0 }],
  },
  ratingValue: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  reviewBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  reviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
