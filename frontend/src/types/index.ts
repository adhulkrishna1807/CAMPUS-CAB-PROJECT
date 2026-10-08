export type UserRole = 'USER' | 'RIDER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  hostel?: string | null;
  room_number?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RiderInfo {
  id: number;
  user_id?: number;
  name?: string;
  phone?: string;
  email?: string;
  vehicle_type: string;
  vehicle_number: string;
  availability_status: 'Available' | 'Busy' | 'Offline';
  rating: number;
  completed_rides?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface FareRoute {
  id: number;
  from_location: string;
  to_location: string;
  single_fare: number;
  double_fare: number;
  is_active: boolean;
}

export interface FareCalculationResult {
  from_location: string;
  to_location: string;
  passengers: number;
  fare: number;
  is_available: boolean;
  message?: string;
}

export type RideStatus = 'PENDING' | 'ACCEPTED' | 'RIDER_ON_WAY' | 'STARTED' | 'COMPLETED' | 'CANCELLED';

export interface RideRequest {
  id: number;
  booking_id: string;
  user_id: number;
  rider_id?: number | null;
  pickup: string;
  drop: string;
  passengers: number;
  preferred_time: string;
  fare: number;
  status: RideStatus;
  created_at: string;
  accepted_at?: string | null;
  completed_at?: string | null;
  customer_name?: string;
  customer_phone?: string;
  rider_name?: string | null;
  rider_phone?: string | null;
  vehicle_type?: string | null;
  vehicle_number?: string | null;
}

export type RentalStatus = 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'RETURNED' | 'COMPLETED' | 'CANCELLED';

export interface Rental {
  id: number;
  booking_id: string;
  user_id: number;
  rider_id?: number | null;
  vehicle_type: 'Bike' | 'Scooty';
  duration_hours: number;
  pickup_location: string;
  preferred_pickup_time: string;
  security_deposit: number;
  rental_charge: number;
  actual_return_time?: string | null;
  refund_amount?: number | null;
  status: RentalStatus;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  rider_name?: string | null;
  rider_phone?: string | null;
  vehicle_number?: string | null;
}

export type LaundryStatus = 
  | 'PENDING'
  | 'PICKUP_SCHEDULED'
  | 'COLLECTED'
  | 'PROCESSING'
  | 'READY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface LaundryOrder {
  id: number;
  booking_id: string;
  user_id: number;
  name: string;
  phone: string;
  pickup_location: string;
  hostel?: string | null;
  room_number?: string | null;
  weight_kg: number;
  rate_per_kg: number;
  extra_charge: number;
  total_amount: number;
  pickup_day: 'Wednesday' | 'Saturday';
  status: LaundryStatus;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'RIDE' | 'LAUNDRY' | 'RENTAL' | 'SYSTEM' | 'INFO';
  is_read: boolean;
  created_at: string;
}

export interface AdminAnalytics {
  total_rides: number;
  completed_rides: number;
  pending_rides: number;
  active_riders: number;
  rental_requests: number;
  laundry_orders: number;
  total_revenue: number;
  today_rides: number;
  today_rentals: number;
  today_laundry: number;
  today_revenue: number;
  rides_by_day: { date: string; rides: number }[];
  laundry_by_day: { date: string; orders: number }[];
  rentals_by_day: { date: string; rentals: number }[];
  revenue_by_service: { service: string; revenue: number }[];
  service_distribution: { name: string; count: number }[];
}

export interface RiderStats {
  pending_requests: number;
  pending_rides: number;
  pending_rentals: number;
  active_rides: number;
  completed_rides: number;
  today_earnings: number;
  total_earnings: number;
  availability_status: 'Available' | 'Busy' | 'Offline';
  rating: number;
  vehicle_type: string;
  vehicle_number: string;
}

export interface AuditLog {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  affected_item: string;
  details?: string;
  created_at: string;
}

export interface AdminReport {
  period: 'day' | 'week' | 'month';
  days: number;
  start_date: string;
  end_date: string;
  total_revenue: number;
  total_services: number;
  rides: {
    count: number;
    completed: number;
    revenue: number;
    avg_fare: number;
  };
  laundry: {
    count: number;
    delivered: number;
    revenue: number;
    total_kg: number;
  };
  rentals: {
    count: number;
    returned: number;
    revenue: number;
    total_deposits: number;
    total_refunds: number;
  };
  daily_breakdown: {
    date: string;
    rides: number;
    laundry: number;
    rentals: number;
    revenue: number;
  }[];
}
