import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

interface SuccessDialogProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  visible,
  title = 'Success',
  message,
  onClose,
  primaryActionText = 'Continue',
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  const { theme } = useTheme();
  const scaleAnimRef = React.useRef(new Animated.Value(visible ? 1 : 0));
  const checkmarkAnimRef = React.useRef(new Animated.Value(visible ? 1 : 0));
  const scaleAnim = scaleAnimRef.current;
  const checkmarkAnim = checkmarkAnimRef.current;

  useEffect(() => {
    // Ensure animated values are initialized according to visible to avoid
    // the case where the modal overlay shows but the dialog content stays hidden
    if (visible) {
      // If the app was under heavy load the animation might not run; set a safe initial value
      scaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(100),
          Animated.spring(checkmarkAnim, {
            toValue: 1,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Reset checkmark for next show
        checkmarkAnim.setValue(0);
      });
    }
  }, [visible]);

  const handlePrimaryAction = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    }
    onClose();
  };

  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    }
    onClose();
  };

  const isLight = theme.mode === 'light';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />

        <Animated.View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: theme.colors.card,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Success Icon with Animation */}
          <Animated.View
            style={[
              styles.iconContainer,
              { backgroundColor: '#D1FAE5' },
              {
                transform: [
                  { scale: checkmarkAnim },
                  {
                    rotate: checkmarkAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons name="check-circle" size={56} color="#F18902" />
          </Animated.View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: '#F18902AD' }]}
              onPress={handlePrimaryAction}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{primaryActionText}</Text>
            </TouchableOpacity>

            {secondaryActionText && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.secondaryButton,
                  {
                    backgroundColor: theme.mode === 'light' ? '#F3F4F6' : '#374151',
                  },
                ]}
                onPress={handleSecondaryAction}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {secondaryActionText}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dialogContainer: {
    width: Math.min(width * 0.85, 380),
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {},
  secondaryButton: {},
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
