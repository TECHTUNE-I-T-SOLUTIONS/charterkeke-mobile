/**
 * websocketService — DISABLED (no-op shim).
 *
 * Charter Keke has NO socket.io server. This module used to connect to
 * `EXPO_PUBLIC_PUSH_SERVER_URL || http://localhost:3000`, which does not exist,
 * so on real devices it just failed and retried, wasting battery and network.
 *
 * All realtime + push functionality now lives in:
 *   - Push notifications: Expo Push Service + FCM (see services/notificationService.ts
 *     and the web backend lib/push-service.ts / push-emitters.ts).
 *   - Live ride location: Supabase Realtime broadcast channels
 *     (see services/supabase.ts → broadcastRideLocation / subscribeToRideLocationUpdates).
 *
 * This file is kept as a no-op shim so existing imports (e.g. AuthContext) keep
 * working without pulling in socket.io or attempting dead connections. It can be
 * deleted once those imports are removed.
 */

// Minimal stand-in so callers that expected a socket instance don't crash.
type NoopSocket = {
  connected: boolean;
  disconnect: () => void;
  emit: (...args: any[]) => void;
  on: (...args: any[]) => void;
};

let socket: NoopSocket | null = null;

export const initializeWebSocket = async (_userId: string): Promise<void> => {
  // Intentionally does nothing. Realtime is handled by Supabase + Expo Push.
  return;
};

export const disconnectWebSocket = (): void => {
  socket = null;
};

export const getWebSocket = (): NoopSocket | null => {
  return socket;
};

export const isWebSocketConnected = (): boolean => {
  return false;
};
