import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Chat, Message } from '@/types';

type RideLocationPayload = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: number;
  role: 'rider' | 'driver';
  userId?: string;
};

type RideChannelEntry = {
  channel: ReturnType<SupabaseClient['channel']>;
  ready: Promise<void>;
  subscribe: () => void;
  subscribed: boolean;
};

class SupabaseService {
  private supabase: SupabaseClient;
  private rideLocationChannels = new Map<string, RideChannelEntry>();

  constructor() {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  // Chat methods
  async subscribeToChat(chatId: string, callback: (message: Message) => void) {
    return this.supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  }

  async subscribeToChatUpdates(chatId: string, callback: (chat: Chat) => void) {
    return this.supabase
      .channel(`chat-updates-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `id=eq.${chatId}`,
        },
        (payload) => {
          callback(payload.new as Chat);
        }
      )
      .subscribe();
  }

  // Location sharing methods (using realtime channels, not database storage)
  async shareLocation(chatId: string, locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    timestamp: number;
    userId: string;
  }) {
    return this.supabase
      .channel(`location-${chatId}`)
      .send({
        type: 'broadcast',
        event: 'location_update',
        payload: locationData,
      });
  }

  async subscribeToLocationUpdates(chatId: string, callback: (locationData: any) => void) {
    return this.supabase
      .channel(`location-${chatId}`)
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        callback(payload);
      })
      .subscribe();
  }

  private getRideLocationEntry(rideId: string) {
    const channelName = `ride-location-${rideId}`;
    const existing = this.rideLocationChannels.get(channelName);
    if (existing) return existing;

    let resolveReady: () => void = () => {};
    let rejectReady: (error: Error) => void = () => {};
    const ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });

    const channel = this.supabase.channel(channelName, {
      config: {
        broadcast: {
          self: true,
          ack: true,
        },
      },
    });

    const entry: RideChannelEntry = {
      channel,
      ready,
      subscribed: false,
      subscribe: () => {
        if (entry.subscribed) return;
        entry.subscribed = true;
        channel.subscribe((status, error) => {
          if (status === 'SUBSCRIBED') resolveReady();
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            rejectReady(error || new Error(`Ride location channel ${channelName} ${status}`));
            this.rideLocationChannels.delete(channelName);
          }
        });
      },
    };
    this.rideLocationChannels.set(channelName, entry);

    return entry;
  }

  async broadcastRideLocation(rideId: string, locationData: RideLocationPayload) {
    const entry = this.getRideLocationEntry(rideId);
    entry.subscribe();
    await entry.ready;

    return entry.channel.send({
      type: 'broadcast',
      event: 'ride_location_update',
      payload: locationData,
    });
  }

  async subscribeToRideLocationUpdates(rideId: string, callback: (locationData: any) => void) {
    const entry = this.getRideLocationEntry(rideId);
    entry.channel.on('broadcast', { event: 'ride_location_update' }, ({ payload }) => {
        callback(payload);
      });
    entry.subscribe();
    await entry.ready;
    return entry.channel;
  }

  async unsubscribeRideLocation(rideId: string) {
    const channelName = `ride-location-${rideId}`;
    const entry = this.rideLocationChannels.get(channelName);
    if (!entry) return;

    this.rideLocationChannels.delete(channelName);
    return this.supabase.removeChannel(entry.channel);
  }

  // Subscribe to message updates (for read status changes)
  async subscribeToMessageUpdates(chatId: string, callback: (message: Message) => void) {
    return this.supabase
      .channel(`message-updates-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  }

  // Unsubscribe methods
  async unsubscribe(channelName: string) {
    return this.supabase.removeChannel(
      this.supabase.channel(channelName)
    );
  }

  // Get client for direct access if needed
  getClient() {
    return this.supabase;
  }
}

export const supabaseService = new SupabaseService();
