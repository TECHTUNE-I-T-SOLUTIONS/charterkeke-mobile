/**
 * Version utilities for the Charter Keke mobile app
 * Handles getting current app version and comparing with remote versions
 * 
 * RELIABILITY: Uses multiple sources with version.json as primary source:
 * Priority: 1) version.json (PRIMARY), 2) Manifest, 3) ExpoConfig, 4) Async Storage, 5) Fallback
 */

import * as Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import version constants from JSON file
import versionConfig from '@/constants/version.json';

const VERSION_CACHE_KEY = '@charter_keke_version_info';
const VERSION_CHECK_KEY = '@charter_keke_last_version_check';

/**
 * Multi-source version detection with version.json as primary source
 * Returns: { version: string, source: string, buildInfo: object }
 */
export async function getVersionInfoDetailed(): Promise<{
  version: string;
  source: 'constant' | 'manifest' | 'storage' | 'fallback';
  buildInfo: Record<string, any>;
  timestamp: number;
}> {
  try {
    const buildInfo: Record<string, any> = {};

    // 0. PRIMARY: Try version.json (PRIMARY SOURCE - updated with each build)
    if (versionConfig?.version) {
      console.log('[VersionUtils] ✓✓✓ Got version from constants/version.json:', versionConfig.version);
      console.log('[VersionUtils] Build number:', versionConfig.buildNumber);
      buildInfo.buildNumber = versionConfig.buildNumber;
      buildInfo.releaseDate = versionConfig.releaseDate;
      buildInfo.changelog = versionConfig.changelog;
      return {
        version: versionConfig.version,
        source: 'constant',
        buildInfo,
        timestamp: Date.now(),
      };
    }

    // 1. Try manifest (compiled into APK)
    const manifestVersion = (Constants as any)?.manifest?.version;
    const expoVersion = (Constants as any)?.expoConfig?.version;
    const runtimeVersion = (Constants as any)?.manifest?.runtimeVersion || 
                          (Constants as any)?.expoConfig?.runtimeVersion;

    buildInfo.manifestVersion = manifestVersion;
    buildInfo.expoVersion = expoVersion;
    buildInfo.runtimeVersion = runtimeVersion;
    buildInfo.buildNumber = (Constants as any)?.manifest?.exposedVersion || 
                           (Constants as any)?.manifest?.buildNumber;
    buildInfo.releaseChannel = (Constants as any)?.manifest?.releaseChannel || 'unknown';
    buildInfo.platform = (Constants as any)?.platform || 'unknown';

    if (manifestVersion) {
      console.log('[VersionUtils] ✓ Got version from manifest:', manifestVersion);
      console.log('[VersionUtils] Build info:', buildInfo);
      return {
        version: manifestVersion,
        source: 'manifest',
        buildInfo,
        timestamp: Date.now(),
      };
    }

    if (expoVersion) {
      console.log('[VersionUtils] ✓ Got version from expoConfig:', expoVersion);
      return {
        version: expoVersion,
        source: 'manifest',
        buildInfo,
        timestamp: Date.now(),
      };
    }

    // 2. Try stored version from previous successful detection
    const storedVersionInfo = await AsyncStorage.getItem(VERSION_CACHE_KEY);
    if (storedVersionInfo) {
      const parsed = JSON.parse(storedVersionInfo);
      console.log('[VersionUtils] ⚠ Using stored version:', parsed.version);
      console.log('[VersionUtils] ⚠ (version.json/manifest not available, using cache)');
      return {
        ...parsed,
        source: 'storage',
        buildInfo: { ...parsed.buildInfo, ...buildInfo },
      };
    }

    // 3. Fallback
    console.log('[VersionUtils] ✗ No version sources available, using fallback');
    return {
      version: '2.0.0',
      source: 'fallback',
      buildInfo,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[VersionUtils] Error getting version info:', error);
    return {
      version: '2.0.0',
      source: 'fallback',
      buildInfo: { error: String(error) },
      timestamp: Date.now(),
    };
  }
}

/**
 * Get the current app version from app.json or Constants
 * Format: "2.0.0" (semver)
 * 
 * IMPORTANT: Call getVersionInfoDetailed() in app init to cache the version
 */
export async function getCurrentAppVersion(): Promise<string> {
  const versionInfo = await getVersionInfoDetailed();
  return versionInfo.version;
}

/**
 * Cache the current version on app startup (call this in App.tsx)
 * This helps detect version changes and ensures manifest is readable
 */
export async function cacheCurrentVersion(): Promise<void> {
  try {
    const versionInfo = await getVersionInfoDetailed();
    await AsyncStorage.setItem(VERSION_CACHE_KEY, JSON.stringify(versionInfo));

    // Also store check timestamp for update detection
    await AsyncStorage.setItem(VERSION_CHECK_KEY, JSON.stringify({
      timestamp: Date.now(),
      version: versionInfo.version,
    }));

    console.log('[VersionUtils] ✓ Cached version:', versionInfo.version);
  } catch (error) {
    console.error('[VersionUtils] Error caching version:', error);
  }
}

/**
 * Detect if app version has changed since last check
 * Useful for clearing caches after update
 */
export async function hasVersionChanged(): Promise<{
  changed: boolean;
  previousVersion?: string;
  currentVersion: string;
}> {
  try {
    const lastCheck = await AsyncStorage.getItem(VERSION_CHECK_KEY);
    const currentVersion = await getCurrentAppVersion();

    if (!lastCheck) {
      return { changed: false, currentVersion };
    }

    const { version: previousVersion } = JSON.parse(lastCheck);

    if (previousVersion !== currentVersion) {
      console.log(`[VersionUtils] 📱 Version changed: ${previousVersion} → ${currentVersion}`);
      return {
        changed: true,
        previousVersion,
        currentVersion,
      };
    }

    return { changed: false, currentVersion };
  } catch (error) {
    console.error('[VersionUtils] Error checking version change:', error);
    return { changed: false, currentVersion: '2.0.0' };
  }
}

/**
 * Parse version string into parts for comparison
 * Input: "2.0.0" → Output: { major: 2, minor: 0, patch: 0 }
 */
export function parseVersion(versionString: string): {
  major: number;
  minor: number;
  patch: number;
} {
  try {
    const parts = versionString.split('.').map((v) => parseInt(v, 10) || 0);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  } catch {
    return { major: 0, minor: 0, patch: 0 };
  }
}

/**
 * Compare two semantic versions
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 * 
 * Example:
 * compareVersions("2.0.0", "1.5.0") → 1 (2.0.0 is newer)
 * compareVersions("1.5.0", "2.0.0") → -1 (1.5.0 is older)
 * compareVersions("2.0.0", "2.0.0") → 0 (same version)
 */
export function compareVersions(versionA: string, versionB: string): number {
  const a = parseVersion(versionA);
  const b = parseVersion(versionB);

  // Compare major
  if (a.major > b.major) return 1;
  if (a.major < b.major) return -1;

  // Compare minor
  if (a.minor > b.minor) return 1;
  if (a.minor < b.minor) return -1;

  // Compare patch
  if (a.patch > b.patch) return 1;
  if (a.patch < b.patch) return -1;

  // Equal
  return 0;
}

/**
 * Check if an update is available
 * Returns: true if latestVersion > currentVersion
 */
export function isUpdateAvailable(
  currentVersion: string,
  latestVersion: string
): boolean {
  return compareVersions(latestVersion, currentVersion) > 0;
}

/**
 * Get human-readable version comparison message
 */
export function getVersionComparisonMessage(
  currentVersion: string,
  latestVersion: string
): string {
  const comparison = compareVersions(latestVersion, currentVersion);

  if (comparison > 0) {
    return `Update available: ${currentVersion} → ${latestVersion}`;
  } else if (comparison < 0) {
    return `Current version (${currentVersion}) is newer than latest release (${latestVersion})`;
  } else {
    return `You are on the latest version (${currentVersion})`;
  }
}

/**
 * Validate if a version string is valid semver format
 */
export function isValidVersion(versionString: string): boolean {
  return /^\d+\.\d+\.\d+/.test(versionString);
}

/**
 * Get the constant version from version.json (synchronous)
 * This is the primary source of truth for app version
 * 
 * Use this when you need the version synchronously
 */
export function getConstantVersion(): string {
  return versionConfig?.version || '2.0.0';
}

/**
 * Export version config for direct access
 */
export function getVersionConfig() {
  return versionConfig;
}
