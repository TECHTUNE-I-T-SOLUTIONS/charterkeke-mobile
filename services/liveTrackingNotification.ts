import { Platform } from 'react-native';
import Constants from 'expo-constants';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('⚠️ [LiveTracking] Failed to import notification modules:', error);
}

/**
 * Send a live tracking notification with a big picture banner
 * This creates a heads-up notification with a visual map or tracking indicator
 */
export async function sendLiveTrackingNotification({
  title,
  body,
  imageUrl,
  data,
}: {
  title: string;
  body: string;
  imageUrl?: string;
  data?: any;
}) {
  if (!Notifications) {
    console.log('⚠️ [LiveTracking] Notifications module unavailable');
    return;
  }
  // In Expo Go, local notifications still work on many devices — attempt anyway, just don't require native channel
  if (IS_EXPO_GO) {
    console.log('[LiveTracking] Expo Go detected — attempting local notification (may be limited)');
  }

  // Ensure permission — Android 13+ and iOS need it explicitly, otherwise schedule is silent
  try {
    const perms = await Notifications.getPermissionsAsync?.();
    if (perms && perms.status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync?.();
      console.log('[LiveTracking] permission request result:', req?.status || req);
    }
  } catch {}
  // Android 16 promoted-live-update gate: POST_PROMOTED_NOTIFICATIONS.
  // Regular POST_NOTIFICATIONS is not enough — promoted chips/lock-screen elevation is a separate toggle.
  // In a dev/production build (not Expo Go) we explicitly request/open it here so the live chip is not silently downgraded.
  if (Platform.OS === 'android' && !IS_EXPO_GO) {
    try {
      const { PermissionsAndroid } = require('react-native');
      const promotedPerm = 'android.permission.POST_PROMOTED_NOTIFICATIONS' as any;
      if (PermissionsAndroid && promotedPerm) {
        const already = await PermissionsAndroid.check?.(promotedPerm);
        if (!already) {
          const res = await PermissionsAndroid.request(promotedPerm as any);
          console.log('[LiveTracking] POST_PROMOTED_NOTIFICATIONS request:', res);
        }
      }
    } catch {}
    try {
      const mod: any = await import('droptrack-live').catch(() => null);
      const dl = mod?.default ?? mod;
      if (dl?.areActivitiesEnabled && !dl.areActivitiesEnabled()) {
        console.log('[LiveTracking] promoted live-update toggle off — opening system settings');
        await dl.requestPromotedPermission?.().catch(() => {});
      }
    } catch {}
  }
  const customSound = 'notifications.wav';
  try {
    if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
      try {
        await Notifications.setNotificationChannelAsync('live-tracking', {
          name: 'Live Tracking',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 200, 100, 200],
          lightColor: '#F5820B',
          sound: customSound,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          enableVibrate: true,
          showBadge: true,
        });
      } catch {}
    }

    // Android Big Picture Style when image provided, otherwise high-priority ongoing-like heads-up
    const androidNotification: any = imageUrl
      ? {
          channelId: 'live-tracking',
          priority: 'max' as const,
          sticky: false,
          autoCancel: true,
          vibrate: [0, 200, 100, 200],
          style: {
            type: Notifications.AndroidNotificationStyle.BIG_PICTURE,
            picture: imageUrl,
            contentTitle: title,
            summaryText: body,
          },
        }
      : {
          channelId: 'live-tracking',
          priority: 'max' as const,
          sticky: false,
          autoCancel: false,
          vibrate: [0, 200, 100, 200],
          categoryId: 'live_tracking',
        };

    const iosNotification: any = { sound: customSound, badge: 1, interruptionLevel: 'timeSensitive' as const };

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: customSound,
        data: data || {},
        ...(imageUrl && { imageUrl }),
        ...(Platform.OS === 'android' ? androidNotification : iosNotification),
      },
      trigger: null,
    });

    // The native live-update widget (Android Live Update / iOS Live Activity)
    // is rendered by the droptrack-live module in dev/production builds. This
    // local notification is the Expo Go / fallback heads-up only.
    console.log(`✅ [LiveTracking] Local heads-up sent${imageUrl ? ' (with image)' : ''}. Native widget: ${IS_EXPO_GO ? 'unavailable in Expo Go' : 'requested'}.`);
  } catch (error) {
    console.error('❌ [LiveTracking] Failed to send notification:', error);
  }
}

export async function sendMessageNotification({
  title,
  body,
  data,
}: {
  title: string;
  body: string;
  data?: any;
}) {
  if (!Notifications) {
    console.log('⚠️ [LiveTracking] Notifications unavailable for message');
    return;
  }
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...(data || {}), type: 'message' },
        sound: 'notifications.wav',
        badge: 1,
      },
      trigger: null,
    });
    console.log('✅ [LiveTracking] Message notification sent');
  } catch (e) {
    console.error('❌ [LiveTracking] Message notification failed:', e);
  }
}

export async function sendSupportNotification({
  title,
  body,
  data,
}: {
  title: string;
  body: string;
  data?: any;
}) {
  if (!Notifications) {
    console.log('⚠️ [LiveTracking] Notifications unavailable for support');
    return;
  }
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...(data || {}), type: 'support_message' },
        sound: 'notifications.wav',
        badge: 1,
      },
      trigger: null,
    });
    console.log('✅ [LiveTracking] Support notification sent');
  } catch (e) {
    console.error('❌ [LiveTracking] Support notification failed:', e);
  }
}

/**
 * Banner dimensions for live tracking notifications
 *
 * Android Big Picture Style:
 * - Recommended: 640x360 pixels (16:9 aspect ratio)
 * - Maximum: 1024x1024 pixels
 * - File size: Keep under 300KB for performance
 *
 * iOS Rich Media:
 * - Recommended: 640x320 pixels (2:1 aspect ratio)
 * - Maximum: 2048x2048 pixels
 * - File size: Keep under 500KB
 *
 * For GIF support:
 * - GIFs work on both platforms but may have performance impact
 * - Keep GIF size under 1MB
 * - Use simple animations (3-5 frames max)
 * - Duration: 2-3 seconds max
 *
 * Recommended banner design:
 * - Include driver location marker
 * - Show route line to destination
 * - Display ETA in large text
 * - Use brand colors (Charter Keke orange #F5820B)
 * - Dark background for better visibility
 */
export const BANNER_DIMENSIONS = {
  android: {
    recommended: { width: 640, height: 360 },
    maximum: { width: 1024, height: 1024 },
    aspectRatio: '16:9',
  },
  ios: {
    recommended: { width: 640, height: 320 },
    maximum: { width: 2048, height: 2048 },
    aspectRatio: '2:1',
  },
  maxSizeKB: 300,
  gifMaxSizeKB: 1000,
} as const;
