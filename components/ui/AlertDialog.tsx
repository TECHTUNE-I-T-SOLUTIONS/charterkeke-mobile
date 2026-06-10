import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { BRAND } from '@/utils/colors';

const { width } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertDialogProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  type = 'info',
  title,
  message,
  buttons,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const isLight = theme.mode === 'light';

  const getVisuals = () => {
    switch (type) {
      case 'success':
        return { name: 'check-circle', color: '#10B981', bg: '#D1FAE5', title: 'Success' };
      case 'error':
        return { name: 'alert-circle', color: '#EF4444', bg: '#FEE2E2', title: 'Needs attention' };
      case 'warning':
        return { name: 'alert', color: '#F59E0B', bg: '#FEF3C7', title: 'Warning' };
      case 'confirm':
        return { name: 'shield-alert', color: BRAND.primary, bg: '#FFF3E1', title: 'Please confirm' };
      default:
        return { name: 'information', color: '#3B82F6', bg: '#DBEAFE', title: 'Notice' };
    }
  };

  const visuals = getVisuals();

  const defaultButtons: AlertButton[] = buttons || [
    {
      text: 'OK',
      onPress: onDismiss,
      style: 'default',
    },
  ];

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: isLight ? 'rgba(17,24,39,0.46)' : 'rgba(0,0,0,0.74)' }]}
          onPress={type === 'confirm' ? undefined : onDismiss}
        />

        <View style={[styles.dialog, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.topBar}>
            <View style={[styles.iconContainer, { backgroundColor: visuals.bg }]}>
              <MaterialCommunityIcons name={visuals.name as any} size={30} color={visuals.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kicker, { color: visuals.color }]}>{visuals.title}</Text>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
            </View>
          </View>

          {message && (
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
          )}

          <View style={styles.buttonContainer}>
            {defaultButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleButtonPress(button)}
                style={[
                  styles.button,
                  button.style === 'cancel' && { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border },
                  button.style === 'destructive' && { backgroundColor: '#EF4444', borderColor: '#EF4444' },
                  button.style === 'default' && { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && { color: theme.colors.textSecondary },
                    button.style === 'destructive' && { color: '#fff', fontWeight: '800' },
                    button.style === 'default' && { color: '#000', fontWeight: '700' },
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: width - 60,
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  topBar: {
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  kicker: {
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AlertDialog;
