import io, { Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

let socket: Socket | null = null;

/**
 * Initialize WebSocket connection to backend
 */
export const initializeWebSocket = async (userId: string) => {
  try {
    const backendUrl = process.env.EXPO_PUBLIC_PUSH_SERVER_URL || 'http://localhost:3000';

    console.log('🌐 [WEBSOCKET] Connecting to:', backendUrl);

    socket = io(backendUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      extraHeaders: {
        'User-ID': userId,
        'Platform': Platform.OS,
      },
    });

    socket.on('connect', () => {
      console.log('✅ [WEBSOCKET] Connected to backend');
      socket?.emit('user_connected', { userId, platform: Platform.OS });
    });

    socket.on('disconnect', () => {
      console.log('❌ [WEBSOCKET] Disconnected from backend');
    });

    socket.on('error', (error: any) => {
      console.error('❌ [WEBSOCKET] Error:', error);
    });

    // Listen for ride request notifications
    socket.on('ride_request', async (data: any) => {
      console.log('📬 [WEBSOCKET] Ride request received:', data);
      await handleRideRequest(data);
    });

    // Listen for ride accepted notifications
    socket.on('ride_accepted', async (data: any) => {
      console.log('📬 [WEBSOCKET] Ride accepted received:', data);
      await handleRideAccepted(data);
    });

    // Listen for driver arrival notifications
    socket.on('driver_arrived', async (data: any) => {
      console.log('📬 [WEBSOCKET] Driver arrived received:', data);
      await handleDriverArrived(data);
    });

    // Listen for ride completed notifications
    socket.on('ride_completed', async (data: any) => {
      console.log('📬 [WEBSOCKET] Ride completed received:', data);
      await handleRideCompleted(data);
    });

    // Listen for generic notifications
    socket.on('notification', async (data: any) => {
      console.log('📬 [WEBSOCKET] Generic notification received:', data);
      await handleGenericNotification(data);
    });

    console.log('✅ [WEBSOCKET] WebSocket initialized successfully');
  } catch (error) {
    console.error('❌ [WEBSOCKET] Initialization error:', error);
  }
};

/**
 * Disconnect WebSocket
 */
export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('✅ [WEBSOCKET] Disconnected');
  }
};

/**
 * Get WebSocket instance
 */
export const getWebSocket = (): Socket | null => {
  return socket;
};

/**
 * Check if connected to WebSocket
 */
export const isWebSocketConnected = (): boolean => {
  return socket?.connected || false;
};

/**
 * Handle ride request notification
 */
const handleRideRequest = async (data: any) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 New Ride Request',
        body: `${data.pickup} → ${data.dropoff}`,
        data: {
          type: 'ride_request',
          rideId: data.rideId,
          pickup: data.pickup,
          dropoff: data.dropoff,
          fare: data.fare?.toString() || '0',
        },
        badge: 1,
        sound: 'default',
      },
      trigger: { type: 'time' as any, seconds: 1 },
    });
  } catch (error) {
    console.error('❌ [WEBSOCKET] Error handling ride request:', error);
  }
};

/**
 * Handle ride accepted notification
 */
const handleRideAccepted = async (data: any) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Ride Accepted',
        body: `${data.driverName} accepted your ride. ETA ${data.estimatedArrival} min`,
        data: {
          type: 'ride_accepted',
          rideId: data.rideId,
          driverName: data.driverName,
        },
        badge: 1,
        sound: 'default',
      },
      trigger: { type: 'time' as any, seconds: 1 },
    });
  } catch (error) {
    console.error('❌ [WEBSOCKET] Error handling ride accepted:', error);
  }
};

/**
 * Handle driver arrived notification
 */
const handleDriverArrived = async (data: any) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 Driver Arrived',
        body: `${data.driverName} is here. Please come out!`,
        data: {
          type: 'driver_arrived',
          rideId: data.rideId,
          driverName: data.driverName,
        },
        badge: 1,
        sound: 'default',
      },
      trigger: { type: 'time' as any, seconds: 1 },
    });
  } catch (error) {
    console.error('❌ [WEBSOCKET] Error handling driver arrived:', error);
  }
};

/**
 * Handle ride completed notification
 */
const handleRideCompleted = async (data: any) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Ride Completed',
        body: `Ride completed. Total fare: ₹${data.fare}`,
        data: {
          type: 'ride_completed',
          rideId: data.rideId,
          fare: data.fare?.toString() || '0',
        },
        badge: 1,
        sound: 'default',
      },
      trigger: { type: 'time' as any, seconds: 1 },
    });
  } catch (error) {
    console.error('❌ [WEBSOCKET] Error handling ride completed:', error);
  }
};

/**
 * Handle generic notification
 */
const handleGenericNotification = async (data: any) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title || 'Notification',
        body: data.body || data.message || '',
        data: data.data || {},
        badge: 1,
        sound: 'default',
      },
      trigger: { type: 'time' as any, seconds: 1 },
    });
  } catch (error) {
    console.error('❌ [WEBSOCKET] Error handling generic notification:', error);
  }
};

/**
 * Emit event to backend (e.g., to notify we're online)
 */
export const emitWebSocketEvent = (event: string, data: any) => {
  if (isWebSocketConnected()) {
    socket?.emit(event, data);
    console.log('📤 [WEBSOCKET] Emitted event:', event);
  } else {
    console.warn('⚠️ [WEBSOCKET] Not connected, cannot emit event:', event);
  }
};
