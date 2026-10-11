import { Platform } from 'react-native';
import Constants from 'expo-constants';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

let Notifications: any = null;

if (!IS_EXPO_GO) {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    console.warn('⚠️ [LiveTracking] Failed to import notification modules:', error);
  }
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
  if (IS_EXPO_GO || !Notifications) {
    console.log('⚠️ [LiveTracking] Skipping notification (Expo Go or Notifications unavailable)');
    return;
  }

  try {
    // Android Big Picture Style
    const androidNotification = {
      channelId: 'live-tracking',
      priority: 'max' as const,
      sticky: false,
      autoCancel: true,
      vibrate: [0, 200, 100, 200],
      // Big picture style for Android
      style: {
        type: Notifications.AndroidNotificationStyle.BIG_PICTURE,
        picture: imageUrl || undefined,
        largeIcon: undefined,
        contentTitle: title,
        summaryText: body,
      },
    };

    // iOS content
    const iosNotification = {
      sound: 'default',
      badge: 1,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        ...(imageUrl && { imageUrl }), // iOS also supports imageUrl
        ...(Platform.OS === 'android' ? androidNotification : iosNotification),
      },
      trigger: null, // Send immediately
    });

    console.log('✅ [LiveTracking] Notification sent with banner');
  } catch (error) {
    console.error('❌ [LiveTracking] Failed to send notification:', error);
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
