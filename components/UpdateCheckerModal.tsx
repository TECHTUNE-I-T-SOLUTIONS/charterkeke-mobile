import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
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
  const [downloadProgress, setDownloadProgress] = useState(0);

  if (!updateInfo || !updateInfo.hasUpdate) {
    return (
      <Modal visible={visible && isChecking} transparent animationType="fade">
        <View style={styles.checkingContainer}>
          <View style={styles.checkingCard}>
            <ActivityIndicator size="large" color="#FF9101" />
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
      setDownloadProgress(0);

      // Construct full download URL
      // IMPORTANT: EXPO_PUBLIC_API_URL already includes /api, so we need to remove the /api prefix from downloadUrl
      let fullUrl = updateInfo.downloadUrl;
      
      if (!fullUrl.startsWith('http')) {
        // Remove leading /api if present to avoid double /api
        const pathWithoutApi = fullUrl.startsWith('/api') 
          ? fullUrl.substring(4)  // Remove /api prefix
          : fullUrl;
        
        // Construct from EXPO_PUBLIC_API_URL which already has /api
        fullUrl = `${process.env.EXPO_PUBLIC_API_URL}${pathWithoutApi}`;
      }

      console.log('[UpdateCheckerModal] Starting download from:', fullUrl);

      // Get file name from URL
      const fileName = updateInfo.downloadUrl.split('/').pop() || `app-${updateInfo.latestVersion}.apk`;
      const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).CacheDirectory;
      
      if (!cacheDir) {
        throw new Error('Cache directory not available');
      }

      const fileUri = `${cacheDir}${fileName}`;

      // Use fetch API for download (Expo v54+ compatible)
      console.log('[UpdateCheckerModal] Using fetch API for download');
        
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        const contentLength = parseInt(
          response.headers.get('content-length') || '0',
          10
        );
        
        if (contentLength === 0) {
          throw new Error('Content length is 0');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Unable to read response body');
        }

        let receivedLength = 0;
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          receivedLength += value.length;
          setDownloadProgress(receivedLength / contentLength);
          
          console.log(
            '[UpdateCheckerModal] Download progress:',
            Math.round((receivedLength / contentLength) * 100),
            '%'
          );
        }

        // Write file using Expo FileSystem
        const fileContent = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
          fileContent.set(chunk, position);
          position += chunk.length;
        }

        const binaryString = String.fromCharCode.apply(null, Array.from(fileContent) as any);
        const base64String = btoa(binaryString);
        
        // Encode as base64 for FileSystem write
        const encodingType = (FileSystem as any).EncodingType?.Base64 || 'base64';
        await (FileSystem as any).writeAsStringAsync(fileUri, base64String, { encoding: encodingType });

        console.log('[UpdateCheckerModal] Download complete:', fileUri);

        // Install the APK (Android only)
        if (Platform.OS === 'android') {
          try {
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: fileUri,
              flags: 1,
            });

            console.log('[UpdateCheckerModal] APK installation started');
            await onDownload(updateInfo.downloadUrl);
          } catch (intentError) {
            console.error('[UpdateCheckerModal] Intent launcher error:', intentError);
            Alert.alert(
              'Installation',
              'APK downloaded successfully.\n\nPlease go to Settings > Security > Unknown Sources and install the APK manually.',
              [{ text: 'OK' }]
            );
          }
        } else if (Platform.OS === 'ios') {
          Alert.alert(
            'Download Complete',
            'IPA file downloaded. Please use TestFlight or Xcode to install the app.',
            [{ text: 'OK' }]
          );
          await onDownload(updateInfo.downloadUrl);
        }
    } catch (error) {
      console.error('[UpdateCheckerModal] Download error:', error);
      Alert.alert(
        'Download Failed',
        error instanceof Error ? error.message : 'Failed to download update. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
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
    // Website link no longer needed as we download directly from backend
    // Dismiss the modal instead
    await handleDismiss();
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
            colors={['#FF9101', '#FFAB3F']}
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
                  color="#FF9101"
                />
                <Text style={styles.benefitText}>Security improvements</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons
                  name="speedometer"
                  size={20}
                  color="#FF9101"
                />
                <Text style={styles.benefitText}>Performance optimization</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons
                  name="wrench"
                  size={20}
                  color="#FF9101"
                />
                <Text style={styles.benefitText}>Bug fixes & improvements</Text>
              </View>
            </View>
          </ScrollView>

          {/* Download Progress */}
          {isDownloading && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Downloading update...</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${downloadProgress * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressPercent}>
                {Math.round(downloadProgress * 100)}%
              </Text>
            </View>
          )}

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

          {/* Website Download Link - Now acts as fallback dismiss button */}
          <TouchableOpacity
            style={styles.websiteLink}
            onPress={handleWebsiteDownload}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color="#666"
            />
            <Text style={styles.websiteLinkText}>Remind me later</Text>
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
    backgroundColor: 'rgba(255, 145, 1, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9101',
    paddingLeft: 12,
    paddingTop: 12,
    paddingRight: 12,
    paddingBottom: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  notesTitle: {
    fontWeight: '700',
    color: '#FF9101',
    marginBottom: 8,
    fontSize: 13,
  },
  notesContent: {
    fontSize: 13,
    color: '#FF9101',
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
  checkingSpinner: {
    color: '#FF9101',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9101',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    fontWeight: '500',
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
    backgroundColor: '#FF9101',
    elevation: 3,
    shadowColor: '#FF9101',
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
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
});
