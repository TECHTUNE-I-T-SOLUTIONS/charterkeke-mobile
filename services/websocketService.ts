import io, { Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

let socket: Socket | null = null;

export const initializeWebSocket = async (userId: string) => {
  try {
    const backendUrl = process.env.EXPO_PUBLIC_PUSH_SERVER_URL || 'http://localhost:3000';

    console.log('🌐 Connecting to WebSocket:', backendUrl);

    socket = io(backendUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      extraHeaders: {
        'User-ID': userId,
        Platform: Platform.OS,
      },
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      socket?.emit('user_connected', { userId, platform: Platform.OS });
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socket.on('error', (error: any) => {
      console.error('❌ WebSocket error:', error);
    });

    // Listen for ride events
    socket.on('ride_request', async (data: any) => {
      console.log('📬 Ride request:', data);
      await handleRideRequest(data);
    });

    socket.on('ride_accepted', async (data: any) => {
      console.log('📬 Ride accepted:', data);
      await handleRideAccepted(data);
    });

    socket.on('driver_arrived', async (data: any) => {
      console.log('📬 Driver arrived:', data);
      await handleDriverArrived(data);
    });

    socket.on('ride_completed', async (data: any) => {
      console.log('📬 Ride completed:', data);
      await handleRideCompleted(data);
    });

    socket.on('notification', async (data: any) => {
      console.log('📬 Notification:', data);
      await handleGenericNotification(data);
    });

    console.log('✅ WebSocket initialized');
  } catch (error) {
    console.error('❌ WebSocket init error:', error);
  }
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('✅ WebSocket disconnected');
  }
};

export const getWebSocket = (): Socket | null => {
  return socket;
};

export const isWebSocketConnected = (): boolean => {
  return socket?.connected || false;
};

// Notification handlers
const handleRideRequest = async (data: any) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New Ride Request',
      body: `${data.pickupLocation} to ${data.dropoffLocation}`,
      data,
    },
    trigger: null,
  });
};

const handleRideAccepted = async (data: any) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ride Accepted',
      body: `Driver ${data.driverName} accepted your ride`,
      data,
    },
    trigger: null,
  });
};

const handleDriverArrived = async (data: any) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Driver Arrived',
      body: `Your driver has arrived`,
      data,
    },
    trigger: null,
  });
};

const handleRideCompleted = async (data: any) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ride Completed',
      body: `Thank you for riding with us!`,
      data,
    },
    trigger: null,
  });
};

const handleGenericNotification = async (data: any) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: data.title || 'Notification',
      body: data.message || '',
      data,
    },
    trigger: null,
  });
};
