import { useState, useCallback } from 'react';
import { UpdateService, UpdateCheckResult } from '@services/updateService';

export interface UseUpdateCheckerReturn {
  isChecking: boolean;
  updateInfo: UpdateCheckResult | null;
  error: string | null;
  checkForUpdates: (forceCheck?: boolean) => Promise<UpdateCheckResult | null>;
  dismissUpdate: (version: string) => Promise<void>;
}

/**
 * Hook to manage update checking
 */
export function useUpdateChecker(): UseUpdateCheckerReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const dismissUpdate = useCallback(async (version: string) => {
    try {
      await UpdateService.dismissVersion(version);
      setUpdateInfo(null);
    } catch (err) {
      console.error('[useUpdateChecker] Error dismissing update:', err);
    }
  }, []);

  return {
    isChecking,
    updateInfo,
    error,
    checkForUpdates,
    dismissUpdate,
  };
}
