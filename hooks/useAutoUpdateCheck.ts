import { useEffect, useRef } from 'react';
import { useUpdateChecker } from './useUpdateChecker';

/**
 * Hook to auto-check for updates on app startup
 * Checks on first mount and respects the interval check
 */
export function useAutoUpdateCheck(enabled: boolean = true) {
  const { checkForUpdates } = useUpdateChecker();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasCheckedRef.current) return;

    const checkUpdates = async () => {
      try {
        hasCheckedRef.current = true;
        // Check for updates without forcing (respects the 24-hour interval)
        await checkForUpdates(false);
      } catch (error) {
        console.error('[useAutoUpdateCheck] Error checking for updates:', error);
      }
    };

    // Add a small delay to not block initial app load
    const timer = setTimeout(checkUpdates, 2000);
    return () => clearTimeout(timer);
  }, [enabled, checkForUpdates]);
}
