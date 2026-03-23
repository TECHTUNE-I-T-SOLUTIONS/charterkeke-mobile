import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UpdateCheckResult } from '@services/updateService';

interface UpdateCheckerModalProps {
  visible: boolean;
  updateInfo: UpdateCheckResult | null;
  isChecking: boolean;
  onDismiss: (version: string) => Promise<void>;
  onDownload: (url: string) => Promise<void>;
}

export const UpdateCheckerModal: React.FC<UpdateCheckerModalProps> = ({
  visible,
  updateInfo,
  isChecking,
  onDismiss,
  onDownload,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!updateInfo || !updateInfo.hasUpdate) {
    return (
      <Modal visible={visible && isChecking} transparent animationType="fade">
        <View style={styles.checkingContainer}>
          <View style={styles.checkingCard}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.checkingText}>Checking for updates...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  const handleUpdate = async () => {
    try {
      if (!updateInfo.downloadUrl) {
        Alert.alert('Error', 'Download link not available. Please update manually from the website.');
        return;
      }

      setIsDownloading(true);

      // Open download link
      const canOpen = await Linking.canOpenURL(updateInfo.downloadUrl);
      if (canOpen) {
        await Linking.openURL(updateInfo.downloadUrl);
        await onDownload(updateInfo.downloadUrl);
      } else {
        Alert.alert(
          'Cannot Open Link',
          'Please visit the website to download the latest version.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start download. Please try again.');
      console.error('[UpdateCheckerModal] Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await onDismiss(updateInfo.latestVersion);
    } catch (error) {
      console.error('[UpdateCheckerModal] Dismiss error:', error);
    }
  };

  const handleWebsiteDownload = async () => {
    const url = 'https://charterkeke.vercel.app/app/install';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open website');
      console.error('[UpdateCheckerModal] Website open error:', error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        {/* Overlay */}
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleDismiss}
        />

        {/* Update Card */}
        <View style={styles.card}>
          {/* Header with gradient */}
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="download-circle-outline"
                size={48}
                color="white"
              />
            </View>

            <Text style={styles.versionBadge}>
              v{updateInfo.currentVersion} → v{updateInfo.latestVersion}
            </Text>
          </LinearGradient>

          {/* Content */}
          <ScrollView
            style={styles.content}
            scrollEnabled={!!updateInfo.releaseNotes}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Update Available!</Text>
            <Text style={styles.subtitle}>
              A new version of Charter Keke is available
            </Text>

            {updateInfo.releaseNotes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>What's New:</Text>
                <Text style={styles.notesContent}>
                  {updateInfo.releaseNotes.substring(0, 300)}
                  {updateInfo.releaseNotes.length > 300 ? '...' : ''}
                </Text>
              </View>
            )}

            {/* Quick Benefits */}
            <View style={styles.benefitsSection}>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={20}
                  color="#10b981"
                />
                <Text style={styles.benefitText}>Security improvements</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons
                  name="speedometer"
                  size={20}
                  color="#10b981"
                />
                <Text style={styles.benefitText}>Performance optimization</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons
                  name="wrench"
                  size={20}
                  color="#10b981"
                />
                <Text style={styles.benefitText}>Bug fixes & improvements</Text>
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.dismissButton]}
              onPress={handleDismiss}
              disabled={isDownloading}
            >
              <Text style={styles.dismissButtonText}>Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.downloadButton]}
              onPress={handleUpdate}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="download"
                    size={18}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.downloadButtonText}>
                    Download & Install
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Website Download Link */}
          <TouchableOpacity
            style={styles.websiteLink}
            onPress={handleWebsiteDownload}
          >
            <MaterialCommunityIcons
              name="link-variant"
              size={14}
              color="#0066cc"
            />
            <Text style={styles.websiteLinkText}>Or download from website</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  iconContainer: {
    marginBottom: 12,
  },
  versionBadge: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    maxHeight: 400,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  notesSection: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
    paddingLeft: 12,
    paddingTop: 12,
    paddingRight: 12,
    paddingBottom: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  notesTitle: {
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
    fontSize: 13,
  },
  notesContent: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  benefitsSection: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  checkingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  checkingCard: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  checkingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  dismissButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dismissButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#666',
  },
  downloadButton: {
    backgroundColor: '#10b981',
    elevation: 3,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  downloadButtonText: {
    fontWeight: '700',
    fontSize: 14,
    color: 'white',
  },
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  websiteLinkText: {
    color: '#0066cc',
    fontSize: 12,
    fontWeight: '600',
  },
});
