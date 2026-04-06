/**
 * Version utilities for the Charter Keke mobile app
 * Handles getting current app version and comparing with remote versions
 */

import * as Constants from 'expo-constants';

/**
 * Get the current app version from app.json or Constants
 * Format: "2.0.0" (semver)
 */
export function getCurrentAppVersion(): string {
  try {
    // Try to get version from Constants manifest
    const manifestVersion = (Constants as any)?.manifest?.version || '2.0.0';
    if (manifestVersion) {
      console.log('[VersionUtils] Got version from manifest:', manifestVersion);
      return manifestVersion;
    }

    // Fallback to default version
    console.log('[VersionUtils] Using fallback version');
    return '2.0.0';
  } catch (error) {
    console.error('[VersionUtils] Error getting version:', error);
    return '2.0.0';
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
