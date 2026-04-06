/**
 * Enhanced Update Checker Hook with APK Download Support
 * Handles checking for updates and managing downloads on Android
 */

import { useState, useCallback, useEffect } from 'react';
import { UpdateService, UpdateCheckResult } from '@services/updateService';
import { Platform, Alert } from 'react-native';

export interface UseUpdateCheckerWithDownloadReturn {
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  updateInfo: UpdateCheckResult | null;
  error: string | null;
  checkForUpdates: (forceCheck?: boolean) => Promise<UpdateCheckResult | null>;
  downloadAndInstall: () => Promise<void>;
  dismissUpdate: (version: string) => Promise<void>;
  clearPendingUpdate: () => Promise<void>;
}

/**
 * Advanced hook for update checking with APK download and installation
 */
export function useUpdateCheckerWithDownload(): UseUpdateCheckerWithDownloadReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for pending update on mount
  useEffect(() => {
    const checkPendingUpdate = async () => {
      if (Platform.OS === 'android') {
        const pendingPath = await UpdateService.getPendingUpdatePath();
        if (pendingPath) {
          console.log('📦 [UPDATE] Found pending update at:', pendingPath);
          // Could prompt user to install pending update
        }
      }
    };
    checkPendingUpdate();
  }, []);

  const checkForUpdates = useCallback(
    async (forceCheck: boolean = false): Promise<UpdateCheckResult | null> => {
      try {
        setIsChecking(true);
        setError(null);

        const result = await UpdateService.checkForUpdates(forceCheck);
        setUpdateInfo(result);

        // Check if this version was previously dismissed
        if (result.hasUpdate) {
          const dismissedVersion = await UpdateService.getDismissedVersion();
          if (dismissedVersion === result.latestVersion) {
            // User dismissed this version, don't show again unless forced
            if (!forceCheck) {
              return null;
            }
          }
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('[useUpdateChecker] Error:', err);
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  const downloadAndInstall = useCallback(async () => {
    if (!updateInfo || !updateInfo.downloadUrl) {
      Alert.alert('Error', 'No download URL available');
      return;
    }

    if (Platform.OS !== 'android') {
      // For iOS, redirect to App Store
      await UpdateService.openIOSAppStore();
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      console.log(
        '📥 [UPDATE] Starting download from:',
        updateInfo.downloadUrl
      );

      // Download the APK
      const apkPath = await UpdateService.downloadAPK(
        updateInfo.downloadUrl,
        (progress) => {
          setDownloadProgress(progress);
          console.log(`📥 [UPDATE] Progress: ${Math.round(progress * 100)}%`);
        }
      );

      if (!apkPath) {
        throw new Error('Failed to download APK');
      }

      console.log('✅ [UPDATE] Download complete:', apkPath);

      // Install the APK
      setDownloadProgress(1);
      await UpdateService.installAPK(apkPath);

      console.log('📦 [UPDATE] Installation initiated');
      // The app will close and reinstall from here
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[useUpdateChecker] Download/Install error:', err);

      Alert.alert(
        'Update Failed',
        `Failed to download and install update: ${errorMessage}\n\nPlease try again or download manually from the website.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsDownloading(false);
    }
  }, [updateInfo]);

  const dismissUpdate = useCallback(async (version: string) => {
    try {
      await UpdateService.dismissVersion(version);
      setUpdateInfo(null);
    } catch (err) {
      console.error('[useUpdateChecker] Error dismissing update:', err);
    }
  }, []);

  const clearPendingUpdate = useCallback(async () => {
    try {
      await UpdateService.clearPendingUpdate();
      setDownloadProgress(0);
    } catch (err) {
      console.error('[useUpdateChecker] Error clearing pending update:', err);
    }
  }, []);

  return {
    isChecking,
    isDownloading,
    downloadProgress,
    updateInfo,
    error,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
    clearPendingUpdate,
  };
}
