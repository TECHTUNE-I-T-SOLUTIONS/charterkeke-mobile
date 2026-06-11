export const BOOKING_PRICING = {
  baseFare: 600,
  perKmFee: 400,
  perMinuteFee: 100,
  minimumFare: 600,
  platformFeeRate: 0.15,
  kekeRouteTimeMultiplier: 1.24,
  kekeStopBufferMinutes: 5,
} as const;

export function calculateKekeDurationMinutes(routeDurationMin: number, routeDistanceKm: number): number {
  const mapDuration = Number.isFinite(routeDurationMin) ? routeDurationMin : 0;
  const safeDistance = Math.max(0, Number.isFinite(routeDistanceKm) ? routeDistanceKm : 0);
  const distanceBuffer = Math.max(2, safeDistance * 0.8);

  return Math.max(
    1,
    Math.ceil(
      mapDuration * BOOKING_PRICING.kekeRouteTimeMultiplier +
        BOOKING_PRICING.kekeStopBufferMinutes +
        distanceBuffer
    )
  );
}

export function calculateRideFare(distanceKm: number, durationMin: number): number {
  const safeDistance = Math.max(0, Number.isFinite(distanceKm) ? distanceKm : 0);
  const safeDuration = Math.max(1, Number.isFinite(durationMin) ? durationMin : 0);
  const rawFare =
    BOOKING_PRICING.baseFare +
    safeDistance * BOOKING_PRICING.perKmFee +
    safeDuration * BOOKING_PRICING.perMinuteFee;

  return Math.max(BOOKING_PRICING.minimumFare, Math.ceil(rawFare / 50) * 50);
}

export function calculateDriverSettlement(fare: number) {
  const safeFare = Math.max(0, Number.isFinite(fare) ? fare : 0);
  const platformFee = Math.round(safeFare * BOOKING_PRICING.platformFeeRate);

  return {
    fare: safeFare,
    platformFee,
    driverReceives: Math.max(0, safeFare - platformFee),
  };
}
