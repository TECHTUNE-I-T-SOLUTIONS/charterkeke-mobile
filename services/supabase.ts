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

  // ─── Ride status realtime (Postgres Changes on rides table) ─────────────────
  private rideStatusChannels = new Map<string, ReturnType<SupabaseClient['channel']>>();

  async subscribeToRideUpdates(rideId: string, callback: (ride: any) => void) {
    const channelName = `ride-status-${rideId}`;
    // Reuse existing channel to avoid "cannot add postgres_changes after subscribe()" on duplicate mounts
    const existing = this.rideStatusChannels.get(channelName);
    if (existing) {
      // Realtime-js allows multiple .on() before subscribe, but not after. If already SUBSCRIBED, we need a dedicated sub-channel.
      const state = (existing as any).state;
      if (state === 'subscribed' || state === 'joined') {
        // Create a namespaced sub-channel for the extra subscriber — same row, different channel name
        const subChannelName = `${channelName}:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`;
        const subChannel = this.supabase
          .channel(subChannelName)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` },
            (payload) => callback(payload.new)
          )
          .subscribe();
        return subChannel;
      }
      existing.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` },
        (payload) => callback(payload.new)
      );
      if (!(existing as any).state || (existing as any).state === 'unsubscribed') {
        existing.subscribe();
      }
      return existing;
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
    this.rideStatusChannels.set(channelName, channel);
    return channel;
  }

  async unsubscribeRideUpdates(rideId: string) {
    // Remove both the primary channel and any sub-channels for this ride
    const prefix = `ride-status-${rideId}`;
    const toRemove: string[] = [];
    this.rideStatusChannels.forEach((ch, name) => {
      if (name === prefix || name.startsWith(prefix + ':')) toRemove.push(name);
    });
    for (const name of toRemove) {
      const ch = this.rideStatusChannels.get(name);
      if (ch) {
        this.rideStatusChannels.delete(name);
        await this.supabase.removeChannel(ch).catch(() => {});
      }
    }
    // Fallback: also try to remove a channel that was never tracked (e.g. sub-channel created after early return)
    if (toRemove.length === 0) {
      const channel = this.supabase.channel(prefix);
      return this.supabase.removeChannel(channel).catch(() => {});
    }
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

  // ─── Direct Supabase Queries (faster than API calls) ─────────────────────
  
  async getDriverStatus(userId: string) {
    // Try to select with manual_availability_off first (if column exists)
    const withManualOff = await this.supabase
      .from('drivers')
      .select('id, user_id, availability_status, verified, updated_at, manual_availability_off')
      .eq('user_id', userId)
      .single();

    // If the column doesn't exist, fall back to selecting without it
    if (withManualOff.error && withManualOff.error.code === '42703') {
      const { data, error } = await this.supabase
        .from('drivers')
        .select('id, user_id, availability_status, verified, updated_at')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    }

    if (withManualOff.error) throw withManualOff.error;
    return withManualOff.data;
  }

  async getAvailableRides(driverLatitude: number, driverLongitude: number, radiusKm: number = 10) {
    // For now, get all pending/dispatched rides
    // In production, you can add PostGIS geospatial queries or simple bounding box filtering
    const { data, error } = await this.supabase
      .from('rides')
      .select(`
        id,
        rider_id,
        pickup_zone,
        destination_zone,
        pickup_description,
        destination_description,
        fare_amount,
        driver_earnings,
        platform_fee,
        distance_km,
        duration_minutes,
        status,
        pickup_time,
        created_at
      `)
      .in('status', ['pending', 'dispatched'])
      .is('driver_id', null)
      .gte('pickup_time', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    
    // Fetch user data for each ride
    const ridesWithUsers = await Promise.all(
      (data || []).map(async (ride: any) => {
        const { data: user } = await this.supabase
          .from('users')
          .select('id, first_name, last_name, phone_number, profile_picture_url')
          .eq('id', ride.rider_id)
          .single();
        
        return {
          ...ride,
          users: user || {},
        };
      })
    );

    return ridesWithUsers;
  }

  async getDriverRideHistory(driverId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    
    const { data, error } = await this.supabase
      .from('rides')
      .select(`
        id,
        pickup_zone,
        destination_zone,
        fare_amount,
        driver_earnings,
        platform_fee,
        distance_km,
        completed_at,
        created_at,
        status,
        rating,
        users:rider_id (first_name, last_name)
      `)
      .eq('driver_id', driverId)
      .in('status', ['completed', 'accepted', 'in_progress'])
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async getDriverActiveRides(driverId: string) {
    const { data, error } = await this.supabase
      .from('rides')
      .select(`
        id,
        rider_id,
        pickup_zone,
        pickup_description,
        destination_zone,
        destination_description,
        fare_amount,
        driver_earnings,
        platform_fee,
        seats_booked,
        distance_km,
        status,
        pickup_time,
        created_at
      `)
      .eq('driver_id', driverId)
      .in('status', ['accepted', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Fetch user data for each ride
    const ridesWithUsers = await Promise.all(
      (data || []).map(async (ride: any) => {
        const { data: user } = await this.supabase
          .from('users')
          .select('id, first_name, last_name, phone_number, profile_picture_url')
          .eq('id', ride.rider_id)
          .single();
        
        return {
          ...ride,
          users: user || {},
        };
      })
    );

    return ridesWithUsers;
  }

  async getDriverDetails(userId: string) {
    const { data, error } = await this.supabase
      .from('drivers')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        phone_number,
        email,
        profile_picture_url,
        vehicle_type,
        plate_number,
        vehicle_color,
        average_rating,
        total_rides_completed,
        total_earnings,
        verified,
        availability_status,
        manual_availability_off
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      // Fallback if manual_availability_off doesn't exist
      if (error.code === '42703') {
        const { data: fallbackData, error: fallbackError } = await this.supabase
          .from('drivers')
          .select(`
            id,
            user_id,
            first_name,
            last_name,
            phone_number,
            email,
            profile_picture_url,
            vehicle_type,
            plate_number,
            vehicle_color,
            average_rating,
            total_rides_completed,
            total_earnings,
            verified,
            availability_status
          `)
          .eq('user_id', userId)
          .single();
        
        if (fallbackError) throw fallbackError;
        return { driver: fallbackData };
      }
      throw error;
    }

    return { driver: data };
  }

  async getDriverEarningsStats(driverId: string) {
    // Get completed rides count and average rating
    const { data: rides, error } = await this.supabase
      .from('rides')
      .select('fare_amount, driver_earnings, rating')
      .eq('driver_id', driverId)
      .eq('status', 'completed');

    if (error) throw error;

    const totalRides = rides?.length || 0;
    const totalEarnings = rides?.reduce((sum, ride) => sum + Number(ride.driver_earnings || 0), 0) || 0;
    const ratings = rides?.map(r => r.rating).filter(r => r != null) || [];
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
      : 0;

    return {
      stats: {
        totalRides,
        totalEarnings,
        averageRating,
      }
    };
  }
}

export const supabaseService = new SupabaseService();
