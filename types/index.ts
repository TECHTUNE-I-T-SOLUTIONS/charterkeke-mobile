// User Types
export type UserRole = 'rider' | 'driver' | 'admin' | 'user';

export interface BaseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rider extends BaseUser {
  role: 'rider' | 'user';
  homeAddress?: string;
  workAddress?: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  rideCount: number;
  averageRating: number;
  walletBalance: number;
}

export interface Driver extends BaseUser {
  role: 'driver';
  licenseNumber: string;
  licenseExpiry: string;
  vehicleType: 'keke' | 'bike' | 'car' | 'okada';
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleRegistration: string;
  plateNumber?: string;
  operatingZones: string[];
  isVerified: boolean;
  isActive: boolean;
  totalRides: number;
  averageRating: number;
  walletBalance: number;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

// Authentication Types
export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: Rider | Driver;
}

export interface OTPVerifyPayload {
  phone: string;
  otp: string;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationUpdate {
  rideId: string;
  location: Location;
}

// Ride Types
export type RideStatus =
  | 'pending'
  | 'accepted'
  | 'started'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface RideRequest {
  pickupLocation: Location;
  pickupAddress: string;
  destinationLocation: Location;
  destinationAddress: string;
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedFare: number;
  passengers: number;
}

export interface Ride {
  id: string;
  rideNumber: string;
  rider: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone: string;
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone: string;
    rating: number;
  };
  pickupLocation: Location;
  pickupAddress: string;
  destinationLocation: Location;
  destinationAddress: string;
  status: RideStatus;
  estimatedFare: number;
  actualFare?: number;
  passengers: number;
  scheduledTime?: string;
  startTime?: string;
  endTime?: string;
  distance?: number;
  duration?: number;
  route?: Location[];
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

// Review Types
export interface Review {
  id: string;
  rideId: string;
  rating: number;
  comment: string;
  reviewedBy: string; // user id
  reviewedUser: string; // user id
  createdAt: string;
}

// Transaction Types
export type TransactionType = 'charge' | 'credit' | 'refund' | 'bonus';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  rideId?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  metadata?: Record<string, any>;
}

// Wallet Types
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  transactions: Transaction[];
  updatedAt: string;
}

// Notification Types
export type NotificationType =
  | 'ride_accepted'
  | 'ride_started'
  | 'ride_completed'
  | 'ride_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'new_ride_available'
  | 'driver_arriving'
  | 'system_message';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// Cache Types
export interface CacheableData {
  timestamp: number;
  data: any;
  expiresIn?: number; // in milliseconds
}

// API Error Types
export interface APIError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

// Network State
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: 'none' | 'wifi' | 'cellular' | 'other' | 'unknown';
}

// Chat Types
export interface Chat {
  id: string;
  ride_id: string;
  rider_id: string;
  driver_id: string;
  created_at: string;
  updated_at: string;
  last_message?: Message | null;
  unread_count?: number;
  ride?: {
    id: string;
    pickup_location?: string;
    dropoff_location?: string;
    status: RideStatus;
  };
  rider?: {
    id: string;
    name: string;
    phone?: string;
  };
  driver?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export type MessageType = 'text' | 'location';

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content?: string;
  message_type: MessageType;
  location_data?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
  };
  sent_at: string;
  read_by_rider?: boolean;
  read_by_driver?: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ChatParticipant {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone: string;
}
