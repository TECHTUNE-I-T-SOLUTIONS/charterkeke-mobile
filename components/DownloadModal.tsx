import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';

const { height } = Dimensions.get('window');

// Charter Keke Brand Colors
const BRAND_ORANGE = '#FF9101';       // Primary orange
const BRAND_ORANGE_LIGHT = '#FFAB3F'; // Light orange for gradients
const BRAND_WHITE = '#FFFFFF';        // White
const BRAND_BLACK = '#000000';        // Black

interface DownloadModalProps {
  visible: boolean;
  version: string;
  fileSize: string;
  Platform: 'ios' | 'android' | 'web';
  releaseNotes?: string;
  onDownload: () => Promise<void>;
  onDismiss: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  visible,
  version,
  fileSize,
  Platform,
  releaseNotes,
  onDownload,
  onDismiss,
  isDownloading = false,
  downloadProgress = 0,
}) => {
  const { theme } = useTheme();
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

  const isLight = theme.mode === 'light';
  
  // Theme-aware colors
  const colors = {
    bgPrimary: isLight ? BRAND_WHITE : '#0B0D0F',
    bgSecondary: isLight ? '#F5F5F5' : '#1A1A1A',
    textPrimary: isLight ? BRAND_BLACK : BRAND_WHITE,
    textSecondary: isLight ? '#6B7280' : '#D1D5DB',
    border: isLight ? '#E5E7EB' : '#374151',
  };

  const getPlatformIcon = () => {
    switch (Platform) {
      case 'ios':
        return 'apple';
      case 'android':
        return 'android';
      case 'web':
        return 'web';
      default:
        return 'download';
    }
  };

  const getPlatformName = () => {
    switch (Platform) {
      case 'ios':
        return 'iOS App';
      case 'android':
        return 'Android App';
      case 'web':
        return 'Web App';
      default:
        return 'App';
    }
  };

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
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
              backgroundColor: colors.bgPrimary,
            },
          ]}
        >
          {/* Header - Orange Gradient */}
          <LinearGradient
            colors={[BRAND_ORANGE, BRAND_ORANGE_LIGHT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={getPlatformIcon()}
                  size={52}
                  color={BRAND_WHITE}
                />
              </View>
              <Text style={styles.headerTitle}>Ready to Download</Text>
              <Text style={styles.platformText}>{getPlatformName()} v{version}</Text>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView
            style={styles.content}
            scrollEnabled={!!releaseNotes}
            showsVerticalScrollIndicator={false}
          >
            {/* Info Cards */}
            <View style={styles.infoCardsContainer}>
              {/* Version Card */}
              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="tag"
                  size={20}
                  color={BRAND_ORANGE}
                />
                <View style={styles.infoCardContent}>
                  <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>
                    Version
                  </Text>
                  <Text style={[styles.infoCardValue, { color: colors.textPrimary }]}>
                    {version}
                  </Text>
                </View>
              </View>

              {/* File Size Card */}
              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="database"
                  size={20}
                  color={BRAND_ORANGE}
                />
                <View style={styles.infoCardContent}>
                  <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>
                    File Size
                  </Text>
                  <Text style={[styles.infoCardValue, { color: colors.textPrimary }]}>
                    {fileSize}
                  </Text>
                </View>
              </View>

              {/* Platform Card */}
              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={getPlatformIcon()}
                  size={20}
                  color={BRAND_ORANGE}
                />
                <View style={styles.infoCardContent}>
                  <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>
                    Platform
                  </Text>
                  <Text style={[styles.infoCardValue, { color: colors.textPrimary }]}>
                    {getPlatformName()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Release Notes */}
            {releaseNotes && (
              <View
                style={[
                  styles.notesContainer,
                  {
                    backgroundColor: isLight
                      ? 'rgba(255, 161, 1, 0.08)'
                      : 'rgba(255, 161, 1, 0.12)',
                    borderColor: BRAND_ORANGE,
                  },
                ]}
              >
                <View style={styles.notesHeader}>
                  <MaterialCommunityIcons
                    name="clipboard-list"
                    size={18}
                    color={BRAND_ORANGE}
                  />
                  <Text style={[styles.notesTitle, { color: BRAND_ORANGE }]}>
                    What's New
                  </Text>
                </View>
                <Text
                  style={[
                    styles.notesText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {releaseNotes}
                </Text>
              </View>
            )}

            {/* Download Progress */}
            {isDownloading && (
              <View
                style={[
                  styles.progressContainer,
                  {
                    backgroundColor: colors.bgSecondary,
                  },
                ]}
              >
                <Text style={[styles.progressLabel, { color: colors.textPrimary }]}>
                  Downloading...
                </Text>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: colors.border },
                  ]}
                >
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
                <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>
                  {Math.round(downloadProgress * 100)}%
                </Text>
              </View>
            )}

            {/* Features - Show when not downloading */}
            {!isDownloading && (
              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconWrapper}>
                    <MaterialCommunityIcons
                      name="lightning-bolt"
                      size={18}
                      color={BRAND_WHITE}
                    />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                    Optimized performance
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconWrapper}>
                    <MaterialCommunityIcons
                      name="shield-check"
                      size={18}
                      color={BRAND_WHITE}
                    />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                    Security improvements
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconWrapper}>
                    <MaterialCommunityIcons
                      name="bug-check"
                      size={18}
                      color={BRAND_WHITE}
                    />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                    Bug fixes & stability
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          {!isDownloading ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.bgSecondary,
                  },
                ]}
                onPress={onDismiss}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
                  Later
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onDownload}
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
                    Download
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.loadingAction,
                { backgroundColor: colors.bgSecondary },
              ]}
            >
              <ActivityIndicator size="small" color={BRAND_ORANGE} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Downloading {getPlatformName().toLowerCase()}...
              </Text>
            </View>
          )}

          {/* Info Text */}
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Stable internet connection recommended.
            {Platform === 'android' && '\nThe app will close briefly to install.'}
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
    padding: 16,
  },
  modal: {
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%',
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
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
    fontSize: 26,
    fontWeight: '800',
    color: BRAND_WHITE,
    marginBottom: 4,
  },
  platformText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flex: 1,
  },
  infoCardsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  notesContainer: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
    marginBottom: 20,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  notesText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  progressContainer: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPercent: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '700',
  },
  featuresContainer: {
    marginVertical: 16,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: BRAND_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
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
  },
  loadingAction: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    lineHeight: 16,
    fontWeight: '500',
  },
});
