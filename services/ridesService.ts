import { apiService } from './api';
import { BookingPricingConfig, buildRideBookingPayload } from './bookingService';

type LocationPoint = { lat: number; lng: number; address: string };

export async function createRideBooking(input: {
  pickup: LocationPoint;
  dropoff: LocationPoint;
  distanceKm: number;
  durationMinutes: number;
  pickupTime: string;
  fare: number;
  pricingConfig?: BookingPricingConfig;
}): Promise<{ ride?: { id?: string }; [key: string]: any }> {
  return apiService.post('/user/book-ride', buildRideBookingPayload(input));
}

export async function getRideDetails(rideId: string) {
  return apiService.get(`/rides/${rideId}`);
}

export async function getRiderActiveRides() {
  return apiService.get('/user/active-rides');
}

export async function getRiderRideHistory(limit = 20) {
  return apiService.get(`/user/ride-history?limit=${limit}`);
}
