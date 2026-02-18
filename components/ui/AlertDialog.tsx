import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
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

  const getIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'check-circle', color: '#10B981' };
      case 'error':
        return { name: 'alert-circle', color: '#EF4444' };
      case 'warning':
        return { name: 'alert', color: '#F59E0B' };
      case 'confirm':
        return { name: 'help-circle', color: BRAND.primary };
      default:
        return { name: 'information', color: '#3B82F6' };
    }
  };

  const icon = getIcon();

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
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.7)' }]} />

        <View style={[styles.dialog, { backgroundColor: theme.colors.surface }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
            <MaterialCommunityIcons name={icon.name as any} size={40} color={icon.color} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>

          {/* Message */}
          {message && (
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {defaultButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleButtonPress(button)}
                style={[
                  styles.button,
                  button.style === 'cancel' && { backgroundColor: theme.colors.inputBackground },
                  button.style === 'destructive' && { backgroundColor: '#EF444420' },
                  button.style === 'default' && { backgroundColor: BRAND.primary },
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && { color: theme.colors.textSecondary },
                    button.style === 'destructive' && { color: '#EF4444' },
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
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AlertDialog;
