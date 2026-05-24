import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@services/api';
import { navigate } from '@services/navigationService';

const IS_DEV = process.env.EXPO_PUBLIC_DEVELOPMENT_MODE === 'true';
const PENDING_PUSH_KEY = 'pending_push_subscription';

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
 * Handles Firebase FCM errors gracefully by separating permission request from token retrieval
 */
export const requestNotificationPermissions = async () => {
  try {
    devLog('Requesting notification permissions...');
    console.log('🔔 [NOTIFICATIONS] Requesting permissions...');
    
    // Step 1: Check and request permissions (independent of token retrieval)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ [NOTIFICATIONS] Permission denied by user');
      devLog('Permission denied by user');
      return null;
    }

    console.log('✅ [NOTIFICATIONS] Permissions granted');

    // Step 2: Try to get a native device push token first on real builds.
    // Expo Go may still require Expo push tokens, so we fall back gracefully.
    try {
      const isNativeBuild = Platform.OS === 'ios' || Platform.OS === 'android';
      const tokenValue = isNativeBuild && !IS_DEV
        ? (await Notifications.getDevicePushTokenAsync()).data
        : (await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
          })).data;
      devLog('Got push token:', tokenValue.slice(0, 30) + '...');
      
      console.log('✅ [NOTIFICATIONS] Push token obtained:', tokenValue.slice(0, 20) + '...');
      return tokenValue;
    } catch (tokenError: any) {
      // Handle specific Firebase/FCM errors
      const errorMessage = tokenError?.message || String(tokenError);
      const errorCode = tokenError?.code || '';

      // Check for MISSING_INSTANCEID_SERVICE error (Firebase not initialized on device)
      if (errorMessage.includes('MISSING_INSTANCEID_SERVICE') || 
          errorMessage.includes('java.io.IOException')) {
        console.warn('⚠️ [NOTIFICATIONS] Firebase/Google Play Services unavailable on this device');
        console.warn('📱 This is normal on emulators without Google Play Services installed');
        console.log('💡 [NOTIFICATIONS] On real devices, ensure Google Play Services is installed');
        devLog('Firebase unavailable, permissions still granted');
        
        return `placeholder_${Date.now()}_${Platform.OS}`;
      }

      // For other token errors, still allow subscription with placeholder
      console.warn('⚠️ [NOTIFICATIONS] Could not obtain push token:', errorMessage);
      console.warn('💡 [NOTIFICATIONS] Will retry token retrieval later');
      devLog('Token retrieval failed, using placeholder');
      
      return `placeholder_${Date.now()}_${Platform.OS}`;
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    console.error('❌ [NOTIFICATIONS] Error requesting permissions:', error);
    
    // Don't fail completely - permission might still be granted
    if (errorMessage.includes('MISSING_INSTANCEID_SERVICE')) {
      console.warn('⚠️ [NOTIFICATIONS] Permissions granted but token unavailable (Firebase issue)');
      return `placeholder_${Date.now()}_${Platform.OS}`;
    }
    
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
 * Handles cases where token is temporarily unavailable (Firebase not initialized)
 */
export const subscribeToPushNotifications = async (userId: string) => {
  try {
    console.log('📡 [NOTIFICATIONS] Subscribing to push for user:', userId);

    // Get push token (may be placeholder if Firebase unavailable)
    const pushToken = await requestNotificationPermissions();
    if (!pushToken) {
      console.warn('⚠️ [NOTIFICATIONS] No push token or permissions available');
      // Still try to sync permission status to backend
      try {
        await apiService.post('/notifications/subscribe', {
          pushToken: null,
          push_token: null,
          platform: Platform.OS,
          status: 'permission_denied',
          action: 'subscribe',
          source: IS_DEV ? 'expo-go-or-dev-client' : 'production-build',
        });
      } catch (err) {
        // Ignore if backend call fails
      }
      return;
    }

    const isPlaceholder = pushToken.startsWith('placeholder_');
    
    if (isPlaceholder) {
      console.log('⏳ [NOTIFICATIONS] Using temporary placeholder token (Firebase not ready)');
    }

    // Save subscription to device storage
    const subscription = {
      userId,
      pushToken,
      subscribedAt: new Date().toISOString(),
      platform: Platform.OS,
      isPlaceholder,
    };

    await AsyncStorage.setItem('pushSubscription', JSON.stringify(subscription));
    await AsyncStorage.setItem('expo_push_token', pushToken);

    if (!userId) {
      await AsyncStorage.setItem(PENDING_PUSH_KEY, JSON.stringify(subscription));
      console.log('⏳ [NOTIFICATIONS] Stored pending push subscription until user ID is available');
    }

    try {
      const subscriptionPayload: any = {
        pushToken,
        push_token: pushToken,
        platform: Platform.OS,
        userId,
        action: 'subscribe',
        source: IS_DEV ? 'expo-go-or-dev-client' : 'production-build',
      };

      // Include status indicators for backend to understand token state
      if (isPlaceholder) {
        subscriptionPayload.status = 'permission_granted_token_pending';
        subscriptionPayload.reason = 'Firebase/Google Play Services not available';
      } else {
        subscriptionPayload.status = 'token_ready';
      }

      const backendResponse = await apiService.post('/notifications/subscribe', subscriptionPayload);
      console.log('✅ [NOTIFICATIONS] Push subscription synced to backend');
      console.log('📡 [NOTIFICATIONS] Subscribe response:', JSON.stringify(backendResponse));
      await AsyncStorage.removeItem(PENDING_PUSH_KEY);
    } catch (backendError) {
      console.error('❌ [NOTIFICATIONS] Failed syncing push subscription to backend:', backendError);
      // Don't fail - permission is still granted
    }

    console.log('✅ [NOTIFICATIONS] Subscribed to push notifications');

    // If using placeholder, schedule a retry for getting real token
    if (isPlaceholder) {
      scheduleTokenRetry(userId);
    }

    // Send welcome notification on first app run
    const hasSeen = await hasSeenWelcomeNotification();
    if (!hasSeen && !isPlaceholder) {
      console.log('🎯 [NOTIFICATIONS] First time user - sending welcome notification');
      await sendWelcomeNotification();
    }

    return subscription;
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Subscription error:', error);
    // Don't throw - allow app to continue even if subscription fails
  }
};

/**
 * Schedule automatic retry for getting real push token
 * Retries up to 5 times with exponential backoff
 */
const scheduleTokenRetry = async (userId: string, attempt: number = 1) => {
  const MAX_RETRIES = 5;
  
  if (attempt > MAX_RETRIES) {
    console.warn('⚠️ [NOTIFICATIONS] Max retry attempts reached for push token');
    return;
  }

  // Exponential backoff: 10s, 20s, 40s, 80s, 160s
  const delaySeconds = Math.min(10 * Math.pow(2, attempt - 1), 300);
  
  setTimeout(async () => {
    try {
      console.log(`🔄 [NOTIFICATIONS] Retry attempt ${attempt}/${MAX_RETRIES} to get real push token`);
      
      const realToken = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      if (realToken?.data && !realToken.data.startsWith('placeholder')) {
        console.log('✅ [NOTIFICATIONS] Successfully obtained real push token on retry');
        
        // Update local storage with real token
        const subscriptionStr = await AsyncStorage.getItem('pushSubscription');
        if (subscriptionStr) {
          const subscription = JSON.parse(subscriptionStr);
          subscription.pushToken = realToken.data;
          subscription.isPlaceholder = false;
          await AsyncStorage.setItem('pushSubscription', JSON.stringify(subscription));
        }
          await AsyncStorage.setItem('expo_push_token', realToken.data);

        // Sync real token to backend
        try {
        const backendResponse = await apiService.post('/notifications/subscribe', {
          pushToken: realToken.data,
          push_token: realToken.data,
          platform: Platform.OS,
          status: 'token_ready',
          action: 'subscribe',
          source: IS_DEV ? 'expo-go-or-dev-client' : 'production-build',
        });
        console.log('📡 [NOTIFICATIONS] Retry response:', JSON.stringify(backendResponse));
        console.log('✅ [NOTIFICATIONS] Real token synced to backend');
        } catch (err) {
          console.error('❌ [NOTIFICATIONS] Failed to sync real token to backend:', err);
        }
        
        return; // Success, no more retries needed
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('MISSING_INSTANCEID_SERVICE')) {
        console.log(`⏳ [NOTIFICATIONS] Firebase still unavailable (retry ${attempt}/${MAX_RETRIES})`);
      } else {
        console.error(`❌ [NOTIFICATIONS] Retry attempt ${attempt} failed:`, error);
      }
      
      // Schedule next retry
      if (attempt < MAX_RETRIES) {
        scheduleTokenRetry(userId, attempt + 1);
      }
    }
  }, delaySeconds * 1000);
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
    // Get the current push token to remove from database
      const storedSubscription = await AsyncStorage.getItem('pushSubscription');
      const legacyToken = await AsyncStorage.getItem('expo_push_token');
      const pushToken = legacyToken || (storedSubscription ? JSON.parse(storedSubscription)?.pushToken : null);
    
    try {
      if (pushToken) {
        // Remove specific token subscription
        await apiService.delete('/notifications/subscribe', {
          data: { push_token: pushToken },
        });
      } else {
        // Fallback: remove all subscriptions if no token stored
        await apiService.delete('/notifications/subscribe');
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed removing backend subscription:', error);
    }

    await AsyncStorage.removeItem('pushSubscription');
    await AsyncStorage.removeItem('expo_push_token');
    console.log('✅ [NOTIFICATIONS] Subscription cleared');
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error clearing subscription:', error);
  }
};

/**
 * Manually retry getting push token (useful for settings screen or after device returns online)
 */
export const manuallyRetryPushToken = async (userId: string) => {
  try {
    console.log('🔄 [NOTIFICATIONS] Manual push token retry initiated');
    
    const realToken = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    if (!realToken?.data) {
      console.warn('⚠️ [NOTIFICATIONS] Token still unavailable');
      return { success: false, message: 'Firebase still initializing. Try again in a moment.' };
    }

    if (realToken.data.startsWith('placeholder')) {
      console.warn('⚠️ [NOTIFICATIONS] Still getting placeholder token');
      return { success: false, message: 'Google Play Services still initializing' };
    }

    console.log('✅ [NOTIFICATIONS] Real token obtained:', realToken.data.slice(0, 20) + '...');

    // Update local storage
    const subscriptionStr = await AsyncStorage.getItem('pushSubscription');
    if (subscriptionStr) {
      const subscription = JSON.parse(subscriptionStr);
      subscription.pushToken = realToken.data;
      subscription.isPlaceholder = false;
      subscription.tokenUpdatedAt = new Date().toISOString();
      await AsyncStorage.setItem('pushSubscription', JSON.stringify(subscription));
    }

    // Sync to backend
    try {
    const backendResponse = await apiService.post('/notifications/subscribe', {
      pushToken: realToken.data,
      push_token: realToken.data,
      platform: Platform.OS,
      status: 'token_ready',
      action: 'subscribe',
      source: IS_DEV ? 'expo-go-or-dev-client' : 'production-build',
    });
    console.log('📡 [NOTIFICATIONS] Manual retry response:', JSON.stringify(backendResponse));
    console.log('✅ [NOTIFICATIONS] Real token synced to backend');
      return { success: true, message: 'Push token updated successfully!', token: realToken.data };
    } catch (err) {
      console.error('❌ [NOTIFICATIONS] Failed to sync real token to backend:', err);
      return { success: false, message: 'Token obtained but sync failed. Will retry automatically.' };
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    console.error('❌ [NOTIFICATIONS] Manual retry failed:', error);
    
    if (errorMessage.includes('MISSING_INSTANCEID_SERVICE')) {
      return { 
        success: false, 
        message: 'Google Play Services not available on this device. Manual token unavailable.' 
      };
    }
    
    return { success: false, message: errorMessage };
  }
};

export const flushPendingPushSubscription = async (userId: string) => {
  try {
    if (!userId) return false;

    const pending = await AsyncStorage.getItem(PENDING_PUSH_KEY);
    const stored = await AsyncStorage.getItem('pushSubscription');
    const raw = pending || stored;
    if (!raw) return false;

    const subscription = JSON.parse(raw);
    if (!subscription?.pushToken) return false;

    const backendResponse = await apiService.post('/notifications/subscribe', {
      pushToken: subscription.pushToken,
      push_token: subscription.pushToken,
      platform: subscription.platform || Platform.OS,
      status: subscription.isPlaceholder ? 'permission_granted_token_pending' : 'token_ready',
      userId,
      action: 'subscribe',
      source: IS_DEV ? 'expo-go-or-dev-client' : 'production-build',
    });
    console.log('📡 [NOTIFICATIONS] Flush response:', JSON.stringify(backendResponse));

    await AsyncStorage.removeItem(PENDING_PUSH_KEY);
    console.log('✅ [NOTIFICATIONS] Pending push subscription flushed to backend');
    return true;
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Failed to flush pending push subscription:', error);
    return false;
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
