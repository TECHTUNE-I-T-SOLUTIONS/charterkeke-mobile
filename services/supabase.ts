import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Chat, Message } from '@/types';

class SupabaseService {
  private supabase: SupabaseClient;

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