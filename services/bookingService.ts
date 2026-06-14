import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';

export type DistanceBand = {
  maxKm: number | null;
  rate: number;
};

export type BookingPricingConfig = {
  id: string;
  name: string;
  baseFare: number;
  minimumFare: number;
  perMinute: number;
  platformFeeRate: number;
  etaPerKm: {
    lowTraffic: number;
    normalTraffic: number;
    heavyTraffic: number;
  };
  learningWeight: number;
  distanceBands: DistanceBand[];
  updatedAt?: string;
  source?: string;
};

const PRICING_CACHE_KEY = '@charter_keke_rail_pricing';
const PRICING_CACHE_MAX_AGE_MS = 10 * 60 * 1000;

export const BOOKING_PRICING: BookingPricingConfig = {
  id: 'fallback-rail-v1',
  name: 'RAIL v1',
  baseFare: 700,
  minimumFare: 1500,
  perMinute: 0,
  platformFeeRate: 0.15,
  etaPerKm: {
    lowTraffic: 2.2,
    normalTraffic: 3,
    heavyTraffic: 4.2,
  },
  learningWeight: 0.1,
  distanceBands: [
    { maxKm: 3, rate: 450 },
    { maxKm: 10, rate: 550 },
    { maxKm: null, rate: 650 },
  ],
  source: 'fallback',
} as const;

let inMemoryPricing: BookingPricingConfig = BOOKING_PRICING;

function normalizePricing(input: Partial<BookingPricingConfig> | null | undefined): BookingPricingConfig {
  const bands = Array.isArray(input?.distanceBands) && input.distanceBands.length
    ? input.distanceBands.map((band) => ({
        maxKm: band.maxKm === null || !Number.isFinite(Number(band.maxKm)) ? null : Number(band.maxKm),
        rate: Number.isFinite(Number(band.rate)) ? Number(band.rate) : 0,
      }))
    : BOOKING_PRICING.distanceBands;

  return {
    id: String(input?.id || BOOKING_PRICING.id),
    name: String(input?.name || BOOKING_PRICING.name),
    baseFare: Number.isFinite(Number(input?.baseFare)) ? Number(input?.baseFare) : BOOKING_PRICING.baseFare,
    minimumFare: Number.isFinite(Number(input?.minimumFare)) ? Number(input?.minimumFare) : BOOKING_PRICING.minimumFare,
    perMinute: Number.isFinite(Number(input?.perMinute)) ? Number(input?.perMinute) : BOOKING_PRICING.perMinute,
    platformFeeRate: Number.isFinite(Number(input?.platformFeeRate)) ? Number(input?.platformFeeRate) : BOOKING_PRICING.platformFeeRate,
    etaPerKm: {
      lowTraffic: Number.isFinite(Number(input?.etaPerKm?.lowTraffic)) ? Number(input?.etaPerKm?.lowTraffic) : BOOKING_PRICING.etaPerKm.lowTraffic,
      normalTraffic: Number.isFinite(Number(input?.etaPerKm?.normalTraffic)) ? Number(input?.etaPerKm?.normalTraffic) : BOOKING_PRICING.etaPerKm.normalTraffic,
      heavyTraffic: Number.isFinite(Number(input?.etaPerKm?.heavyTraffic)) ? Number(input?.etaPerKm?.heavyTraffic) : BOOKING_PRICING.etaPerKm.heavyTraffic,
    },
    learningWeight: Number.isFinite(Number(input?.learningWeight)) ? Number(input?.learningWeight) : BOOKING_PRICING.learningWeight,
    distanceBands: bands.sort((a, b) => (a.maxKm ?? Number.MAX_SAFE_INTEGER) - (b.maxKm ?? Number.MAX_SAFE_INTEGER)),
    updatedAt: input?.updatedAt,
    source: input?.source || 'runtime',
  };
}

export async function getBookingPricingConfig(options: { forceRefresh?: boolean } = {}): Promise<BookingPricingConfig> {
  if (!options.forceRefresh && inMemoryPricing.source !== 'fallback') {
    return inMemoryPricing;
  }

  if (!options.forceRefresh) {
    try {
      const cached = await AsyncStorage.getItem(PRICING_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - Number(parsed.cachedAt || 0) < PRICING_CACHE_MAX_AGE_MS) {
          inMemoryPricing = normalizePricing(parsed.config);
          return inMemoryPricing;
        }
      }
    } catch (error) {
      console.warn('[BookingPricing] Failed to read pricing cache:', error);
    }
  }

  try {
    const remote = await apiService.get<BookingPricingConfig>('/pricing/active', { skipAuth: true });
    inMemoryPricing = normalizePricing(remote);
    await AsyncStorage.setItem(PRICING_CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), config: inMemoryPricing }));
    return inMemoryPricing;
  } catch (error) {
    console.warn('[BookingPricing] Failed to load remote pricing, using fallback/cache:', error);
    return inMemoryPricing || BOOKING_PRICING;
  }
}

export function getCurrentBookingPricingConfig(): BookingPricingConfig {
  return inMemoryPricing || BOOKING_PRICING;
}

export function calculateKekeDurationMinutes(
  routeDurationMin: number,
  routeDistanceKm: number,
  config: BookingPricingConfig = getCurrentBookingPricingConfig(),
  traffic: keyof BookingPricingConfig['etaPerKm'] = 'normalTraffic'
): number {
  const safeDistance = Math.max(0.1, Number.isFinite(routeDistanceKm) ? routeDistanceKm : 0.1);
  const mapDuration = Number.isFinite(routeDurationMin) && routeDurationMin > 0 ? routeDurationMin : 0;
  const deterministicEta = safeDistance * Number(config.etaPerKm[traffic] || config.etaPerKm.normalTraffic || 3);
  const blendedEta = mapDuration > 0 ? Math.min(mapDuration, deterministicEta * 1.15) : deterministicEta;

  return Math.max(1, Math.ceil(blendedEta));
}

export function calculateRideFare(
  distanceKm: number,
  config: BookingPricingConfig = getCurrentBookingPricingConfig()
): number {
  const safeDistance = Math.max(0, Number.isFinite(distanceKm) ? distanceKm : 0);
  const band = config.distanceBands.find((item) => item.maxKm === null || safeDistance <= item.maxKm) || config.distanceBands[config.distanceBands.length - 1];
  const distanceRate = Number(band?.rate || 0);
  const rawFare = config.baseFare + safeDistance * distanceRate;

  return Math.max(config.minimumFare, Math.round(rawFare));
}

export function calculateDriverSettlement(fare: number, config: BookingPricingConfig = getCurrentBookingPricingConfig()) {
  const safeFare = Math.max(0, Number.isFinite(fare) ? fare : 0);
  const platformFee = Math.round(safeFare * config.platformFeeRate);

  return {
    fare: safeFare,
    platformFee,
    driverReceives: Math.max(0, safeFare - platformFee),
  };
}

export function buildRideBookingPayload(input: {
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  distanceKm: number;
  durationMinutes: number;
  pickupTime: string;
  fare: number;
  pricingConfig?: BookingPricingConfig;
}) {
  const config = input.pricingConfig || getCurrentBookingPricingConfig();
  const distanceKm = Number.isFinite(input.distanceKm) && input.distanceKm > 0 ? input.distanceKm : 1;
  const durationMinutes = Number.isFinite(input.durationMinutes) && input.durationMinutes > 0 ? input.durationMinutes : calculateKekeDurationMinutes(0, distanceKm, config);
  const fare = Number.isFinite(input.fare) && input.fare > 0 ? input.fare : calculateRideFare(distanceKm, config);
  const settlement = calculateDriverSettlement(fare, config);
  const band = config.distanceBands.find((item) => item.maxKm === null || distanceKm <= item.maxKm) || config.distanceBands[config.distanceBands.length - 1];

  return {
    pickup_location: {
      lat: input.pickup.lat,
      lng: input.pickup.lng,
      address: input.pickup.address,
    },
    dropoff_location: {
      lat: input.dropoff.lat,
      lng: input.dropoff.lng,
      address: input.dropoff.address,
    },
    estimated_distance: distanceKm,
    eta_minutes: durationMinutes,
    duration_minutes: 0,
    estimated_duration_minutes: durationMinutes,
    number_of_seats: 1,
    pickup_time: input.pickupTime,
    fare_amount: settlement.fare,
    platform_fee: settlement.platformFee,
    driver_earnings: settlement.driverReceives,
    seats_available: 4,
    pricing_model: config.name || 'RAIL v1',
    pricing_breakdown: {
      pricingSettingId: config.id,
      pricingSource: config.source,
      baseFare: config.baseFare,
      minimumFare: config.minimumFare,
      perMinuteFee: config.perMinute,
      distanceRate: band?.rate || 0,
      distanceBands: config.distanceBands,
      etaPerKm: config.etaPerKm,
      distanceKm,
      etaMinutes: durationMinutes,
      platformFeeRate: config.platformFeeRate,
    },
  };
}
