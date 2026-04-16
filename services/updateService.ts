import axios from 'axios';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import {
  getCurrentAppVersion,
  cacheCurrentVersion,
  hasVersionChanged,
  getVersionInfoDetailed,
  compareVersions,
  isUpdateAvailable,
  isValidVersion,
} from '@/utils/versionUtils';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface GitHubRelease {
  id?: number;
  version: string;
  name?: string;
  releaseNotes?: string;
  publishedAt?: string;
  isPrerelease?: boolean;
  assets: Array<{
    name: string;
    downloadUrl: string;
  }>;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  downloadUrl: string;
  release: GitHubRelease | null;
}

const STORAGE_KEY_LAST_CHECK = '@chart_keke_last_update_check';
const STORAGE_KEY_DISMISSED = '@chart_keke_dismissed_version';
const CHECK_INTERVAL_HOURS = 24;

export class UpdateService {
  /**
   * Initialize version detection on app startup
   * CALL THIS IN App.tsx on first load!
   */
  static async initializeVersionDetection(): Promise<void> {
    try {
      // Cache the current version on startup
      await cacheCurrentVersion();
      
      // Check if version changed since last run
      const versionChangeInfo = await hasVersionChanged();
      if (versionChangeInfo.changed) {
        console.log('[UpdateService] 🔄 App updated! Clearing caches...');
        // Clear dismissed version on app update to show new release notes
        await this.resetDismissedVersion();
      }

      // Log detailed version info for debugging
      const versionInfo = await getVersionInfoDetailed();
      console.log('[UpdateService] Version info:', {
        version: versionInfo.version,
        source: versionInfo.source,
        buildInfo: versionInfo.buildInfo,
      });
    } catch (error) {
      console.error('[UpdateService] Error initializing version detection:', error);
    }
  }

  /**
   * Get the current app version from app.json or expo constants
   * Uses reliable multi-source detection
   */
  static async getCurrentVersion(): Promise<string> {
    try {
      const version = await getCurrentAppVersion();
      console.log('[UpdateService] Current app version:', version);
      return version;
    } catch (error) {
      console.error('[UpdateService] Error getting current version:', error);
      return '2.0.0';
    }
  }

  /**
   * Check if enough time has passed since last check
   */
  static async shouldCheck(): Promise<boolean> {
    try {
      const lastCheck = await AsyncStorage.getItem(STORAGE_KEY_LAST_CHECK);
      if (!lastCheck) return true;

      const lastCheckTime = parseInt(lastCheck, 10);
      const now = Date.now();
      const hoursPassed = (now - lastCheckTime) / (1000 * 60 * 60);

      return hoursPassed >= CHECK_INTERVAL_HOURS;
    } catch (error) {
      console.error('[UpdateService] Error checking time interval:', error);
      return true;
    }
  }

  /**
   * Fetch latest release from backend API (which proxies GitHub)
   */
  static async fetchLatestRelease(): Promise<GitHubRelease | null> {
    try {
      // Use the API endpoint from environment or fallback
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
      
      // Ensure the URL is properly formatted
      const baseUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
      
      console.log('[UpdateService] Attempting to fetch latest release from:', `${baseUrl}/app/releases`);

      const response = await axios.get<GitHubRelease[]>(
        `${baseUrl}/app/releases?limit=1`,
        {
          timeout: 10000,
        }
      );

      const releases = response.data;
      return releases.length > 0 ? releases[0] : null;
    } catch (error) {
      console.error('[UpdateService] Error fetching latest release:', error instanceof Error ? error.message : error);
      
      // Fallback to checking GitHub directly if backend fails
      try {
        console.log('[UpdateService] Falling back to GitHub API...');
        const gitHubResponse = await axios.get(
          'https://api.github.com/repos/TECHTUNE-I-T-SOLUTIONS/charterkeke-mobile/releases/latest',
          {
            timeout: 10000,
          }
        );

        const release = gitHubResponse.data;
        
        return {
          version: release.tag_name?.replace(/^v/, '') || release.name || 'unknown',
          releaseNotes: release.body || '',
          assets: (release.assets || []).map((asset: any) => ({
            name: asset.name,
            downloadUrl: asset.browser_download_url,
          })),
        };
      } catch (fallbackError) {
        console.error('[UpdateService] Fallback GitHub API also failed:', fallbackError instanceof Error ? fallbackError.message : fallbackError);
        return null;
      }
    }
  }

  /**
   * Compare semantic versions - delegates to utility function
   * Returns true if latestVersion > currentVersion
   */
  static compareVersions(current: string, latest: string): boolean {
    const comparison = compareVersions(current, latest);
    return comparison < 0; // Returns true if latest > current
  }

  /**
   * Main function to check for updates
   */
  static async checkForUpdates(
    forceCheck: boolean = false
  ): Promise<UpdateCheckResult> {
    try {
      // Check if we should skip this check based on interval
      if (!forceCheck && !(await this.shouldCheck())) {
        return {
          hasUpdate: false,
          currentVersion: await this.getCurrentVersion(),
          latestVersion: await this.getCurrentVersion(),
          releaseNotes: '',
          downloadUrl: '',
          release: null,
        };
      }

      // Update last check time
      await AsyncStorage.setItem(
        STORAGE_KEY_LAST_CHECK,
        Date.now().toString()
      );

      const currentVersion = await this.getCurrentVersion();
      const latestRelease = await this.fetchLatestRelease();

      if (!latestRelease) {
        return {
          hasUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          releaseNotes: '',
          downloadUrl: '',
          release: null,
        };
      }

      const latestVersionTag = latestRelease.version;
      const hasUpdate = this.compareVersions(currentVersion, latestVersionTag);

      // Get the download URL from assets
      const apkAsset = latestRelease.assets.find((asset) =>
        asset.name.endsWith('.apk')
      );
      const iosAsset = latestRelease.assets.find((asset) =>
        asset.name.endsWith('.ipa')
      );

      const assetFile = apkAsset || iosAsset;
      
      // Construct backend download URL instead of using GitHub URL directly
      // Format: /api/app/download/[version]/[filename]
      const downloadUrl = assetFile
        ? `/api/app/download/${latestVersionTag}/${assetFile.name}`
        : '';

      console.log('[UpdateService] Constructed download URL:', downloadUrl);

      return {
        hasUpdate,
        currentVersion,
        latestVersion: latestVersionTag,
        releaseNotes: latestRelease.releaseNotes || '',
        downloadUrl,
        release: latestRelease,
      };
    } catch (error) {
      console.error('[UpdateService] Error checking for updates:', error);
      return {
        hasUpdate: false,
        currentVersion: await this.getCurrentVersion(),
        latestVersion: await this.getCurrentVersion(),
        releaseNotes: '',
        downloadUrl: '',
        release: null,
      };
    }
  }

  /**
   * Dismiss an update version (user can dismiss and ask later)
   */
  static async dismissVersion(version: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_DISMISSED, version);
    } catch (error) {
      console.error('[UpdateService] Error dismissing version:', error);
    }
  }

  /**
   * Get the dismissed version
   */
  static async getDismissedVersion(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEY_DISMISSED);
    } catch (error) {
      console.error('[UpdateService] Error getting dismissed version:', error);
      return null;
    }
  }

  /**
   * Reset dismissed version to show the update again
   */
  static async resetDismissedVersion(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_DISMISSED);
    } catch (error) {
      console.error('[UpdateService] Error resetting dismissed version:', error);
    }
  }

  /**
   * Download APK file for Android
   */
  static async downloadAPK(
    downloadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<string | null> {
    try {
      if (Platform.OS !== 'android') {
        console.warn('[UpdateService] APK download only available on Android');
        return null;
      }

      const fileName = 'charter-keke-update.apk';
      const cacheDir = (FileSystem as any)?.cacheDirectory || `${(FileSystem as any)?.CacheDirectory || ''}`;
  const filePath = `${cacheDir}${fileName}`;

      console.log('📥 [UPDATE] Downloading APK to:', filePath);

      // Fix URL if it's a GitHub redirect
      const actualDownloadUrl = downloadUrl.includes('github.com')
        ? downloadUrl.replace('github.com', 'raw.githubusercontent.com').replace('/download/', '/')
        : downloadUrl;

      const downloadResumable = FileSystem.createDownloadResumable(
        actualDownloadUrl,
        filePath,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          console.log(
            `📥 [UPDATE] Download progress: ${Math.round(progress * 100)}%`
          );
          onProgress?.(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result && result.uri) {
        console.log('✅ [UPDATE] APK downloaded successfully:', result.uri);
        await AsyncStorage.setItem('pendingUpdatePath', result.uri);
        return result.uri;
      }

      return null;
    } catch (error) {
      console.error('❌ [UPDATE] Error downloading APK:', error);
      throw error;
    }
  }

  /**
   * Install downloaded APK
   */
  static async installAPK(apkPath: string): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        console.warn('[UpdateService] APK installation only available on Android');
        return false;
      }

      console.log('📦 [UPDATE] Installing APK from:', apkPath);

      // Use file:// URI for installation
      const fileUri = apkPath.startsWith('file://')
        ? apkPath
        : `file://${apkPath}`;

      // Trigger Android system installer
      await Linking.openURL(fileUri);

      console.log('✅ [UPDATE] Installation initiated');
      return true;
    } catch (error) {
      console.error('❌ [UPDATE] Error installing APK:', error);
      throw error;
    }
  }

  /**
   * Get pending update path if available
   */
  static async getPendingUpdatePath(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('pendingUpdatePath');
    } catch (error) {
      console.error('[UpdateService] Error getting pending update:', error);
      return null;
    }
  }

  /**
   * Clear pending update
   */
  static async clearPendingUpdate(): Promise<void> {
    try {
      const pendingPath = await AsyncStorage.getItem('pendingUpdatePath');
      if (pendingPath) {
        await FileSystem.deleteAsync(pendingPath, { idempotent: true });
      }
      await AsyncStorage.removeItem('pendingUpdatePath');
      console.log('🗑️ [UPDATE] Cleared pending update');
    } catch (error) {
      console.error('[UpdateService] Error clearing pending update:', error);
    }
  }

  /**
   * Open iOS App Store for update
   */
  static async openIOSAppStore(): Promise<void> {
    try {
      const appStoreUrl =
        'https://apps.apple.com/app/charter-keke/id1234567890';
      await Linking.openURL(appStoreUrl);
    } catch (error) {
      console.error('[UpdateService] Error opening App Store:', error);
    }
  }

  /**
   * Open Google Play Store for update
   */
  static async openPlayStore(): Promise<void> {
    try {
      const playStoreUrl =
        'https://play.google.com/store/apps/details?id=com.charterkeke';
      await Linking.openURL(playStoreUrl);
    } catch (error) {
      console.error('[UpdateService] Error opening Play Store:', error);
    }
  }
}
