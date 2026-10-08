import {
  User, RiderInfo, FareRoute, FareCalculationResult,
  RideRequest, Rental, LaundryOrder, NotificationItem,
  AdminAnalytics, RiderStats, AuditLog, AdminReport
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiService {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('campuscab_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, config);
      
      if (!res.ok) {
        let errorMsg = `Error ${res.status}: ${res.statusText}`;
        try {
          const errData = await res.json();
          if (errData && errData.detail) {
            if (typeof errData.detail === 'string') {
              errorMsg = errData.detail;
            } else if (Array.isArray(errData.detail)) {
              errorMsg = errData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
            }
          }
        } catch {
          // keep fallback errorMsg
        }
        throw new Error(errorMsg);
      }

      return await res.json() as T;
    } catch (err: any) {
      console.error(`API Request Failed: ${endpoint}`, err);
      throw err;
    }
  }

  // --- Auth ---
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: any): Promise<{ access_token: string; user: User }> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async demoLogin(role: 'USER' | 'RIDER' | 'ADMIN'): Promise<{ access_token: string; user: User }> {
    return this.request('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async getMe(): Promise<{ user: User; rider: RiderInfo | null }> {
    return this.request('/api/auth/me');
  }

  async updateProfile(data: { phone?: string; hostel?: string; room_number?: string }): Promise<User> {
    return this.request('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- Fares ---
  async getFares(): Promise<FareRoute[]> {
    return this.request('/api/fares');
  }

  async calculateFare(from_location: string, to_location: string, passengers: number): Promise<FareCalculationResult> {
    return this.request('/api/fares/calculate', {
      method: 'POST',
      body: JSON.stringify({ from_location, to_location, passengers }),
    });
  }

  // --- Rides ---
  async createRide(data: { pickup: string; drop: string; passengers: number; preferred_time: string }): Promise<RideRequest> {
    return this.request('/api/rides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyRides(): Promise<RideRequest[]> {
    return this.request('/api/rides/my');
  }

  async getPendingRides(): Promise<RideRequest[]> {
    return this.request('/api/rides/pending');
  }

  async getActiveRides(): Promise<RideRequest[]> {
    return this.request('/api/rides/active');
  }

  async getAllRides(status?: string): Promise<RideRequest[]> {
    const q = status ? `?status_filter=${encodeURIComponent(status)}` : '';
    return this.request(`/api/rides/all${q}`);
  }

  async acceptRide(rideId: number): Promise<{ message: string; booking_id: string; status: string }> {
    return this.request(`/api/rides/${rideId}/accept`, {
      method: 'POST',
    });
  }

  async updateRideStatus(rideId: number, status: string): Promise<{ message: string; status: string }> {
    return this.request(`/api/rides/${rideId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async cancelRide(rideId: number): Promise<{ message: string; booking_id: string }> {
    return this.request(`/api/rides/${rideId}/cancel`, {
      method: 'POST',
    });
  }

  // --- Rentals ---
  async createRental(data: {
    vehicle_type: 'Bike' | 'Scooty';
    duration_hours: number;
    pickup_location: string;
    preferred_pickup_time: string;
  }): Promise<Rental> {
    return this.request('/api/rentals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyRentals(): Promise<Rental[]> {
    return this.request('/api/rentals/my');
  }

  async getPendingRentals(): Promise<Rental[]> {
    return this.request('/api/rentals/pending');
  }

  async getAllRentals(status?: string): Promise<Rental[]> {
    const q = status ? `?status_filter=${encodeURIComponent(status)}` : '';
    return this.request(`/api/rentals/all${q}`);
  }

  async acceptRental(rentalId: number): Promise<{ message: string; booking_id: string; status: string }> {
    return this.request(`/api/rentals/${rentalId}/accept`, {
      method: 'POST',
    });
  }

  async updateRentalStatus(rentalId: number, status: string): Promise<{ message: string; status: string }> {
    return this.request(`/api/rentals/${rentalId}/status?status=${encodeURIComponent(status)}`, {
      method: 'POST',
    });
  }

  async returnRental(rentalId: number, data: { actual_return_time?: string; actual_duration_hours?: number }): Promise<any> {
    return this.request(`/api/rentals/${rentalId}/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Laundry ---
  async createLaundry(data: {
    name: string;
    phone: string;
    pickup_location: string;
    hostel?: string;
    room_number?: string;
    weight_kg: number;
    pickup_day: string;
  }): Promise<LaundryOrder> {
    return this.request('/api/laundry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyLaundry(): Promise<LaundryOrder[]> {
    return this.request('/api/laundry/my');
  }

  async getAllLaundry(status?: string): Promise<LaundryOrder[]> {
    const q = status ? `?status_filter=${encodeURIComponent(status)}` : '';
    return this.request(`/api/laundry/admin${q}`);
  }

  async updateLaundryStatus(laundryId: number, status: string): Promise<any> {
    return this.request(`/api/laundry/${laundryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // --- Notifications ---
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request('/api/notifications');
  }

  async markNotificationRead(id: number): Promise<any> {
    return this.request(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead(): Promise<any> {
    return this.request('/api/notifications/read-all', {
      method: 'POST',
    });
  }

  // --- Rider ---
  async updateRiderAvailability(status: 'Available' | 'Busy' | 'Offline'): Promise<any> {
    return this.request(`/api/rider/availability?status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    });
  }

  async getRiderStats(): Promise<RiderStats> {
    return this.request('/api/rider/stats');
  }

  // --- Admin ---
  async getAdminAnalytics(): Promise<AdminAnalytics> {
    return this.request('/api/admin/analytics');
  }

  async getAdminReports(period: 'day' | 'week' | 'month' = 'week'): Promise<AdminReport> {
    return this.request(`/api/admin/reports?period=${period}`);
  }

  async getAdminUsers(search?: string): Promise<any[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/api/admin/users${q}`);
  }

  async getAdminRiders(): Promise<any[]> {
    return this.request('/api/admin/riders');
  }

  async createRider(data: any): Promise<any> {
    return this.request('/api/admin/riders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRider(riderId: number, data: any): Promise<any> {
    return this.request(`/api/admin/riders/${riderId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createFareRoute(data: { from_location: string; to_location: string; single_fare: number; double_fare: number }): Promise<FareRoute> {
    return this.request('/api/admin/fares', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFareRoute(routeId: number, data: { single_fare?: number; double_fare?: number; is_active?: boolean }): Promise<FareRoute> {
    return this.request(`/api/admin/fares/${routeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request('/api/admin/audit-logs');
  }

  // --- Demo Controls ---
  async resetDemo(): Promise<any> {
    return this.request('/api/demo/reset', { method: 'POST' });
  }

  async prepareDemoRide(): Promise<any> {
    return this.request('/api/demo/prepare-ride', { method: 'POST' });
  }

  async prepareDemoRental(): Promise<any> {
    return this.request('/api/demo/prepare-rental', { method: 'POST' });
  }

  async prepareDemoLaundry(): Promise<any> {
    return this.request('/api/demo/prepare-laundry', { method: 'POST' });
  }
}

export const api = new ApiService();
