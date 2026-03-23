import axios from 'axios';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
   * Get the current app version from package.json or expo config
   */
  static async getCurrentVersion(): Promise<string> {
    try {
      // Try to get from Updates API first (Works in native builds)
      if (Updates.manifest && (Updates.manifest as any).version) {
        return (Updates.manifest as any).version;
      }

      // Fallback to stored version
      const stored = await AsyncStorage.getItem('@chart_keke_app_version');
      return stored || '1.0.0';
    } catch (error) {
      console.error('[UpdateService] Error getting current version:', error);
      return '1.0.0';
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
      // Use the backend API endpoint which handles GitHub rate limiting
      const response = await axios.get<GitHubRelease[]>(
        `${API_URL}/app/releases?limit=1`,
        {
          timeout: 10000,
        }
      );

      const releases = response.data;
      return releases.length > 0 ? releases[0] : null;
    } catch (error) {
      console.error('[UpdateService] Error fetching latest release:', error);
      return null;
    }
  }

  /**
   * Compare versions (returns true if latestVersion > currentVersion)
   */
  static compareVersions(current: string, latest: string): boolean {
    try {
      const currentParts = current.split('.').map((v) => parseInt(v, 10));
      const latestParts = latest.split('.').map((v) => parseInt(v, 10));

      for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const curr = currentParts[i] || 0;
        const next = latestParts[i] || 0;

        if (next > curr) return true;
        if (next < curr) return false;
      }

      return false; // Equal versions
    } catch (error) {
      console.error('[UpdateService] Error comparing versions:', error);
      return false;
    }
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

      const downloadUrl =
        apkAsset?.downloadUrl || iosAsset?.downloadUrl || '';

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
}
