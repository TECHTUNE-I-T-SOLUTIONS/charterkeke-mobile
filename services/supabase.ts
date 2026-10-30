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

  async getDriverSettlementSummary(driverId: string) {
    // Lagos WAT = UTC+1
    const LAGOS_OFFSET_MS = 60 * 60 * 1000;
    const getLagosDateString = (date = new Date()) =>
      new Date(date.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
    const getLagosDayRange = (dateString: string) => {
      const start = new Date(new Date(`${dateString}T00:00:00.000Z`).getTime() - LAGOS_OFFSET_MS);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      return { start, end };
    };

    const today = getLagosDateString();
    const { start: todayStart, end: todayEnd } = getLagosDayRange(today);

    // Run queries in parallel for speed
    const [todaySettlementResult, overdueResult, todayRidesResult] = await Promise.all([
      // 1. Today's settlement row
      this.supabase
        .from('driver_daily_settlement')
        .select('id, settlement_date, total_platform_fees, total_driver_earnings, total_rides, settlement_status, payment_due_date, paid_at')
        .eq('driver_id', driverId)
        .eq('settlement_date', today)
        .maybeSingle(),

      // 2. Past overdue settlements (strictly past dates)
      this.supabase
        .from('driver_daily_settlement')
        .select('id, settlement_date, total_platform_fees, total_driver_earnings, settlement_status, payment_due_date')
        .eq('driver_id', driverId)
        .in('settlement_status', ['pending', 'overdue'])
        .lt('settlement_date', today)
        .order('settlement_date', { ascending: false }),

      // 3. Today's unremitted rides only
      this.supabase
        .from('rides')
        .select('id, platform_fee, fare_amount, driver_earnings')
        .eq('driver_id', driverId)
        .eq('remitted', false)
        .in('status', ['accepted', 'in_progress', 'completed'])
        .gte('updated_at', todayStart.toISOString())
        .lt('updated_at', todayEnd.toISOString()),
    ]);

    const todaySettlement = todaySettlementResult.data;
    const overdueSettlements = overdueResult.data || [];
    const todayRides = todayRidesResult.data || [];

    // Overdue total: sum of past unpaid daily settlements (matches backend & wallet screen)
    const overdueTotal = overdueSettlements.reduce(
      (sum: number, s: any) => sum + Number(s.total_platform_fees || 0),
      0
    );

    // Today's total: computed from today's rides, or fallback to today's settlement row
    const calculatedTodayTotal = todayRides.reduce(
      (sum: number, r: any) => sum + Number(r.platform_fee || Number(r.fare_amount || 0) * 0.15),
      0
    );
    const settlementTodayFee = Number(todaySettlement?.total_platform_fees || 0);
    const todayTotal = calculatedTodayTotal > 0 ? calculatedTodayTotal : (todaySettlement?.settlement_status !== 'paid' ? settlementTodayFee : 0);

    const grandTotal = overdueTotal + todayTotal;
    const dueAt = todaySettlement?.payment_due_date || todayEnd.toISOString();
    const msRemaining = Math.max(new Date(dueAt).getTime() - Date.now(), 0);

    const todayEarnings = Number(
      todaySettlement?.total_driver_earnings ??
      todayRides.reduce((sum: number, r: any) => sum + Number(r.driver_earnings || (Number(r.fare_amount || 0) * 0.85)), 0)
    );

    return {
      blocked: overdueTotal > 0,
      totalOutstanding: overdueTotal,
      overdueTotal,
      todayTotal,
      grandTotal,
      totalOverdue: overdueTotal,
      totalTodayDue: todayTotal,
      totalDueNow: grandTotal,
      todayRemittance: {
        totalDue: todayTotal,
        ridesDue: todayRides.length,
        dueAt,
        millisecondsRemaining: msRemaining,
        isOverdue: msRemaining <= 0 && todayTotal > 0,
      },
      remittanceSummary: {
        overdueTotal,
        todayTotal,
        grandTotal,
      },
      todaySettlement: todaySettlement || {
        total_driver_earnings: todayEarnings,
        total_platform_fees: todayTotal,
        settlement_status: todayTotal > 0 ? 'pending' : 'paid',
      },
      outstandingSettlements: overdueSettlements,
    };
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
        duration_minutes,
        pickup_time,
        completed_at,
        created_at,
        status,
        rating,
        users:rider_id (first_name, last_name, profile_picture_url)
      `)
      .eq('driver_id', driverId)
      .in('status', ['completed', 'accepted', 'in_progress'])
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async getDriverActiveRides(driverId: string) {
    if (!driverId) return [];
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
        duration_minutes,
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
    try {
      const { data: driver, error: driverError } = await this.supabase
        .from("drivers")
        .select(`
          *,
          users:user_id (
            id,
            first_name,
            last_name,
            email,
            phone_number,
            profile_picture_url
          )
        `)
        .eq("user_id", userId)
        .single();

      if (!driverError && driver) {
        const u = (driver as any).users || {};
        return {
          driver: {
            ...driver,
            first_name: u.first_name || "",
            last_name: u.last_name || "",
            email: u.email || "",
            phone_number: u.phone_number || "",
            profile_picture_url: u.profile_picture_url || "",
          }
        };
      }

      // Fallback: query drivers with basic columns and users separately
      const { data: rawDriver, error: rawError } = await this.supabase
        .from("drivers")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (rawError) throw rawError;

      const { data: rawUser } = await this.supabase
        .from("users")
        .select("id, first_name, last_name, email, phone_number, profile_picture_url")
        .eq("id", userId)
        .single();

      return {
        driver: {
          ...rawDriver,
          first_name: rawUser?.first_name || "",
          last_name: rawUser?.last_name || "",
          email: rawUser?.email || "",
          phone_number: rawUser?.phone_number || "",
          profile_picture_url: rawUser?.profile_picture_url || "",
        }
      };
    } catch (err) {
      console.warn("[supabaseService] getDriverDetails error, falling back to basic:", err);
      const { data: minimal } = await this.supabase
        .from("drivers")
        .select("id, user_id, verified, availability_status")
        .eq("user_id", userId)
        .maybeSingle();
      return { driver: minimal || {} };
    }
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

  async updateRideEta(rideId: string, etaMinutes: number) {
    const { data, error } = await this.supabase
      .from('rides')
      .update({ 
        eta_minutes: etaMinutes,
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const supabaseService = new SupabaseService();
