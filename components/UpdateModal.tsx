import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';

const { height } = Dimensions.get('window');
// Charter Keke Brand Colors
const BRAND_ORANGE = '#FF9101';      // Exact Charter Keke Orange
const BRAND_ORANGE_LIGHT = '#FFAB3F'; // Lighter shade for gradients
const BRAND_WHITE = '#FFFFFF';
const BRAND_BLACK = '#000000';

interface UpdateModalProps {
  visible: boolean;
  version: string;
  releaseNotes: string;
  onUpdate: () => Promise<void>;
  onDismiss: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  version,
  releaseNotes,
  onUpdate,
  onDismiss,
  isDownloading = false,
  downloadProgress = 0,
}) => {
  const { theme } = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdate();
    } finally {
      setIsUpdating(false);
    }
  };

  const isLight = theme.mode === 'light';
  const bgColor = isLight ? '#FFFFFF' : '#1A1A1A';
  const textColor = theme.colors.textPrimary;
  const secondaryText = theme.colors.textSecondary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        ]}
      />

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.modal,
            {
              backgroundColor: bgColor,
            },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={[BRAND_ORANGE, BRAND_ORANGE_LIGHT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="download-circle"
                  size={48}
                  color={BRAND_WHITE}
                />
              </View>
              <Text style={styles.headerTitle}>Update Available</Text>
              <Text style={styles.versionText}>Version {version}</Text>
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.subtitle, { color: textColor }]}>
              A new version of Charter Keke is ready!
            </Text>

            {releaseNotes && (
              <View style={[styles.notesContainer, { borderColor: isLight ? '#E0E0E0' : '#333' }]}>
                <Text style={[styles.notesLabel, { color: BRAND_ORANGE }]}>
                  📋 What's New:
                </Text>
                <Text
                  style={[
                    styles.notesText,
                    { color: secondaryText },
                  ]}
                  numberOfLines={3}
                >
                  {releaseNotes}
                </Text>
              </View>
            )}

            {/* Download Progress */}
            {(isDownloading || isUpdating) && (
              <View style={styles.progressContainer}>
                <Text style={[styles.progressLabel, { color: textColor }]}>
                  {isDownloading ? 'Downloading...' : 'Installing...'}
                </Text>
                <View style={[
                  styles.progressBar,
                  { backgroundColor: isLight ? '#E0E0E0' : '#333' },
                ]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${downloadProgress * 100}%`,
                        backgroundColor: BRAND_ORANGE,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressPercent, { color: secondaryText }]}>
                  {Math.round(downloadProgress * 100)}%
                </Text>
              </View>
            )}

            {/* Features */}
            {!isDownloading && !isUpdating && (
              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={BRAND_ORANGE}
                  />
                  <Text style={[styles.featureText, { color: secondaryText }]}>
                    Faster performance
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="wrench-outline"
                    size={20}
                    color={BRAND_ORANGE}
                  />
                  <Text style={[styles.featureText, { color: secondaryText }]}>
                    Bug fixes & improvements
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={20}
                    color={BRAND_ORANGE}
                  />
                  <Text style={[styles.featureText, { color: secondaryText }]}>
                    Security updates
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Actions */}
          {!isDownloading && !isUpdating ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: isLight ? '#E0E0E0' : '#333',
                    backgroundColor: isLight ? '#F5F5F5' : '#2A2A2A',
                  },
                ]}
                onPress={onDismiss}
              >
                <Text style={[styles.secondaryButtonText, { color: textColor }]}>
                  Later
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleUpdate}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[BRAND_ORANGE, BRAND_ORANGE_LIGHT]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButtonGradient}
                >
                  <MaterialCommunityIcons
                    name="download"
                    size={20}
                    color={BRAND_BLACK}
                  />
                  <Text style={[styles.primaryButtonText, { color: BRAND_BLACK }]}>
                    Download & Install
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loadingAction}>
              <ActivityIndicator size="small" color={BRAND_ORANGE} />
              <Text style={[styles.loadingText, { color: secondaryText }]}>
                {isDownloading ? 'Downloading update...' : 'Installing update...'}
              </Text>
            </View>
          )}

          {/* Info Text */}
          <Text style={[styles.infoText, { color: secondaryText }]}>
            The app will close momentarily to install the update.
            {'\n'}
            Please don't force close the app.
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND_WHITE,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  notesContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(241, 137, 2, 0.05)',
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 19,
  },
  featuresContainer: {
    marginTop: 20,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
  },
  progressContainer: {
    marginVertical: 20,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1.2,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    // Color is set inline in JSX for the Download & Install button
  },
  loadingAction: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    lineHeight: 16,
  },
});
