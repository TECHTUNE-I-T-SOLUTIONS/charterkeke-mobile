import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import otaConfig from '@/constants/ota-changelog.json';

const STORAGE_KEY_SEEN_OTA_PREFIX = '@charterkeke_ota_seen_key_';

/**
 * Returns unique OTA update key.
 * Uses ota-changelog.json's key or expo-updates updateId if available.
 */
export const getActiveOtaUpdateKey = (): string => {
  try {
    const updateId = (Updates as any)?.updateId;
    if (updateId && typeof updateId === 'string' && updateId.trim().length > 0) {
      return `ota_${updateId.trim()}`;
    }
  } catch (e) {
    // ignore
  }

  return otaConfig?.key || 'ota_default';
};

interface OtaNoticeProps {
  onDismiss?: () => void;
}

export const OtaUpdateNoticeModal: React.FC<OtaNoticeProps> = ({ onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [updateKey, setUpdateKey] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const checkOtaNotice = async () => {
      try {
        const key = getActiveOtaUpdateKey();
        const storageKey = `${STORAGE_KEY_SEEN_OTA_PREFIX}${key}`;
        const hasSeen = await AsyncStorage.getItem(storageKey);

        if (!hasSeen && isMounted) {
          setUpdateKey(key);
          setVisible(true);
        }
      } catch (err) {
        console.warn('[OtaUpdateNotice] Failed to check seen status:', err);
      }
    };

    // Small delay so user sees initial screen before the modal surfaces smoothly
    const timeout = setTimeout(checkOtaNotice, 1500);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  const handleDismiss = async () => {
    try {
      if (updateKey) {
        await AsyncStorage.setItem(`${STORAGE_KEY_SEEN_OTA_PREFIX}${updateKey}`, 'true');
      }
    } catch (e) {
      console.warn('[OtaUpdateNotice] Failed to save seen status:', e);
    }
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  const title = otaConfig?.title || "We've Made Things Better! 🎉";
  const subtitle = otaConfig?.subtitle || "Here is what we've fixed and improved in this update:";
  const highlights = otaConfig?.highlights || [
    'Fixed driver remittance calculation so outstanding balance is always accurate',
    'Smoother ride acceptance and real-time trip connection',
    'Performance improvements and bug fixes',
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Header Icon & Title */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="star-shooting" size={30} color="#FF9101" />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>WHAT'S NEW</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* Highlights List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {highlights.map((item, index) => (
              <View key={index} style={styles.bulletRow}>
                <View style={styles.checkCircle}>
                  <MaterialCommunityIcons name="check" size={14} color="#10B981" />
                </View>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Dismiss Button */}
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={handleDismiss}
          >
            <Text style={styles.buttonText}>Got It, Let's Go</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 145, 1, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 145, 1, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 145, 1, 0.3)',
  },
  badge: {
    backgroundColor: 'rgba(255, 145, 1, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    color: '#FF9101',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 6,
  },
  scrollList: {
    maxHeight: 220,
    marginVertical: 10,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    color: '#E5E7EB',
    lineHeight: 19,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#FF9101',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
