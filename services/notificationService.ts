import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@services/api';
import { navigate } from '@services/navigationService';

const IS_DEV = process.env.EXPO_PUBLIC_DEVELOPMENT_MODE === 'true';

// Callbacks for navigation and unread count management
let onIncrementUnread: (() => void) | null = null;

export const setNotificationCallbacks = (incrementUnread: () => void) => {
  onIncrementUnread = incrementUnread;
};

/**
 * Development logging helper
 */
const devLog = (message: string, data?: any) => {
  if (IS_DEV) {
    console.log(`[DEV] ${message}`, data || '');
  }
};

/**
 * Configure notification behavior and handlers
 */
export const configureNotifications = async () => {
  try {
    await Notifications.setNotificationCategoryAsync('ride_request_action', [
      {
        identifier: 'RIDE_ACCEPT_ACTION',
        buttonTitle: 'Accept',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'RIDE_REJECT_ACTION',
        buttonTitle: 'Reject',
        options: { opensAppToForeground: true, isDestructive: true },
      },
    ]);

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Request permissions automatically on app startup
    console.log('🔔 [NOTIFICATIONS] Requesting notification permissions on app startup...');
    await requestNotificationPermissions();

    // Handle notification when app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('📬 [NOTIFICATIONS] Received while app open:', notification.request.content.title);
      // Increment unread count when notification is received
      if (onIncrementUnread) {
        onIncrementUnread();
      }
    });

    // Handle notification when user taps it
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 [NOTIFICATIONS] User tapped notification:', response.notification.request.content.title);
      handleNotificationResponse(response);
    });

    console.log('✅ [NOTIFICATIONS] Notification handlers configured');
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error configuring notifications:', error);
  }
};

/**
 * Request notification permissions and get push token
 */
export const requestNotificationPermissions = async () => {
  try {
    devLog('Requesting notification permissions...');
    console.log('🔔 [NOTIFICATIONS] Requesting permissions...');
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ [NOTIFICATIONS] Permission denied');
      devLog('Permission denied by user');
      return null;
    }

    // Get expo push token
    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    const tokenValue = expoPushToken.data;
    devLog('Got token:', tokenValue.slice(0, 30) + '...');
    
    console.log('✅ [NOTIFICATIONS] Permissions granted, token:', tokenValue.slice(0, 20) + '...');
    return tokenValue;
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error requesting permissions:', error);
    devLog('Permission request error:', error);
    return null;
  }
};

/**
 * Check if user has already seen the welcome notification
 */
export const hasSeenWelcomeNotification = async (): Promise<boolean> => {
  try {
    const seen = await AsyncStorage.getItem('welcomeNotificationSeen');
    return seen === 'true';
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error checking welcome status:', error);
    return false;
  }
};

/**
 * Update welcome notification seen state
 */
export const markWelcomeNotificationSeen = async (seen: boolean = true) => {
  try {
    if (seen) {
      await AsyncStorage.setItem('welcomeNotificationSeen', 'true');
    } else {
      await AsyncStorage.removeItem('welcomeNotificationSeen');
    }
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error updating welcome state:', error);
  }
};

/**
 * Send welcome notification on first app launch
 */
export const sendWelcomeNotification = async () => {
  try {
    console.log('🎉 [NOTIFICATIONS] Sending welcome notification...');
    
    // Send the welcome notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Welcome to Charter Keke!',
        body: 'Get N100 off your first ride when you refer people and they use your code to signup',
        data: {
          type: 'welcome',
          code: 'KEKE100',
          discount: '100',
          action: 'open_booking',
        },
        badge: 1,
        sound: 'default',
      },
      trigger: {
        type: 'time' as any,
        seconds: 2,
      },
    });

    await markWelcomeNotificationSeen();
    
    console.log('✅ [NOTIFICATIONS] Welcome notification sent');
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error sending welcome notification:', error);
  }
};

/**
 * Subscribe to push notifications from backend
 */
export const subscribeToPushNotifications = async (userId: string) => {
  try {
    console.log('📡 [NOTIFICATIONS] Subscribing to push for user:', userId);

    // Get push token
    const pushToken = await requestNotificationPermissions();
    if (!pushToken) {
      console.warn('⚠️ [NOTIFICATIONS] No push token available');
      return;
    }

    // Save subscription to device storage
    const subscription = {
      userId,
      pushToken,
      subscribedAt: new Date().toISOString(),
      platform: Platform.OS,
    };

    await AsyncStorage.setItem(
      'pushSubscription',
      JSON.stringify(subscription)
    );

    try {
      await apiService.post('/notifications/subscribe', {
        pushToken,
        platform: Platform.OS,
      });
      console.log('✅ [NOTIFICATIONS] Push token synced to backend');
    } catch (backendError) {
      console.error('❌ [NOTIFICATIONS] Failed syncing push token to backend:', backendError);
    }

    console.log('✅ [NOTIFICATIONS] Subscribed to push notifications');

    // Send welcome notification on first app run
    const hasSeen = await hasSeenWelcomeNotification();
    if (!hasSeen) {
      console.log('🎯 [NOTIFICATIONS] First time user - sending welcome notification');
      await sendWelcomeNotification();
    }

    return subscription;
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Subscription error:', error);
  }
};

/**
 * Handle notification action (accept ride, decline, etc)
 */
const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
  const { notification } = response;
  const data = notification.request.content.data;
  const actionId = response.actionIdentifier;

  if (actionId === 'RIDE_ACCEPT_ACTION' && data.rideId) {
    try {
      await apiService.post('/driver/accept-ride', { rideId: data.rideId });
      console.log('✅ [NOTIFICATIONS] Ride accepted from notification action:', data.rideId);
      navigate(`/driver/available-rides?focusRide=${data.rideId}`);
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to accept ride from notification action:', error);
      const message = (error as any)?.message || 'Unable to accept ride.';
      Alert.alert('Unable to Accept Ride', message);
    }
    return;
  }

  if (actionId === 'RIDE_REJECT_ACTION' && data.rideId) {
    try {
      await apiService.post('/driver/reject-ride', { rideId: data.rideId });
      console.log('✅ [NOTIFICATIONS] Ride rejected from notification action:', data.rideId);
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to reject ride from notification action:', error);
    }
    return;
  }

  console.log('🎯 [NOTIFICATIONS] Handling action for type:', data.type);

  switch (data.type) {
    case 'welcome':
      console.log('🎉 [NOTIFICATIONS] Welcome notification tapped - opening booking');
      navigate('/rider/booking');
      break;

    case 'ride_request':
      console.log('🚗 [NOTIFICATIONS] Ride request:', data.rideId);
      if (data.rideId) {
        navigate(`/driver/available-rides?focusRide=${data.rideId}`);
      }
      break;

    case 'ride_accepted':
      console.log('✅ [NOTIFICATIONS] Ride accepted by driver:', data.driverId);
      if (data.rideId) {
        navigate(`/rider/active-ride?rideId=${data.rideId}`);
      }
      break;

    case 'ride_update':
      console.log('📍 [NOTIFICATIONS] Ride update:', data.status);
      if (data.rideId) {
        if (data.userRole === 'rider') {
          navigate(`/rider/active-ride?rideId=${data.rideId}`);
        } else if (data.userRole === 'driver') {
          navigate(`/driver/active-rides?rideId=${data.rideId}`);
        }
      }
      break;

    case 'ride_completed':
      console.log('✅ [NOTIFICATIONS] Ride completed:', data.rideId);
      if (data.rideId && data.userRole === 'rider') {
        navigate(`/rider/rides-history?completedRideId=${data.rideId}`);
      } else if (data.rideId && data.userRole === 'driver') {
        navigate(`/driver/completed-rides?completedRideId=${data.rideId}`);
      }
      break;

    case 'support_message':
      console.log('💬 [NOTIFICATIONS] Support message received');
      navigate('/help-and-support');
      break;

    default:
      console.log('❓ [NOTIFICATIONS] Unknown notification type:', data.type);
  }
};

/**
 * Send a local notification (for testing)
 */
export const sendLocalNotification = async (
  title: string,
  message: string,
  data?: Record<string, any>
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        data: data || {},
        sound: 'default',
        badge: 1,
      },
      trigger: {
        type: 'time' as any,
        seconds: 1,
      },
    });
    console.log('✅ [NOTIFICATIONS] Local notification sent:', title);
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error sending local notification:', error);
  }
};

/**
 * Get stored push subscription
 */
export const getPushSubscription = async () => {
  try {
    const subscription = await AsyncStorage.getItem('pushSubscription');
    return subscription ? JSON.parse(subscription) : null;
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error getting subscription:', error);
    return null;
  }
};

/**
 * Clear push subscription (on logout)
 */
export const clearPushSubscription = async () => {
  try {
    try {
      await apiService.delete('/notifications/subscribe');
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed removing backend subscription:', error);
    }

    await AsyncStorage.removeItem('pushSubscription');
    console.log('✅ [NOTIFICATIONS] Subscription cleared');
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error clearing subscription:', error);
  }
};

/**
 * Background notification task (when app is terminated)
 */
const NOTIFICATION_BACKGROUND_TASK = 'NOTIFICATION_BACKGROUND_TASK';

export const registerBackgroundNotificationTask = () => {
  TaskManager.defineTask(NOTIFICATION_BACKGROUND_TASK, async ({ data, error }) => {
    if (error) {
      console.error('❌ [NOTIFICATIONS] Background task error:', error);
      return;
    }

    console.log('📬 [NOTIFICATIONS] Background notification received');
    handleNotificationResponse({
      notification: data as Notifications.Notification,
      actionName: 'default',
    } as any);
  });
};
