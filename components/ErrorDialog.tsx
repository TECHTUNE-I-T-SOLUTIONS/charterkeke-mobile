import React, { useEffect, useRef } from 'react';
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

interface ErrorDialogProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  actionText?: string;
  onAction?: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  visible,
  title = 'Error',
  message,
  onClose,
  actionText = 'OK',
  onAction,
}) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.96,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, scaleAnim]);

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0.96);
      opacityAnim.setValue(0);
    }
  }, [visible, opacityAnim, scaleAnim]);

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.mode === 'light' ? 'rgba(17,24,39,0.48)' : 'rgba(0,0,0,0.76)' }]} />

        <Animated.View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="alert-octagon" size={30} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>Action needed</Text>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
            </View>
          </View>

          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleAction}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{actionText}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.colors.inputBackground }]}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="close" size={18} color={theme.colors.textSecondary} />
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
    width: Math.min(width * 0.88, 390),
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
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
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kicker: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
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
