'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { RideRequest, Rental, LaundryOrder } from '@/types';
import {
  Clock, Bike, Shirt, KeyRound, Search, Filter,
  Phone, X, CheckCircle2, AlertTriangle, Calendar, MapPin
} from 'lucide-react';

export default function MyBookingsPage() {
  const { user, addToast } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'rides' | 'laundry' | 'rentals'>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [rides, setRides] = useState<RideRequest[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [laundry, setLaundry] = useState<LaundryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected item for details modal
  const [selectedItem, setSelectedItem] = useState<{
    type: 'RIDE' | 'RENTAL' | 'LAUNDRY';
    data: any;
  } | null>(null);

  // Cancellation modal
  const [cancelModalItem, setCancelModalItem] = useState<any | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [r, ren, l] = await Promise.all([
        api.getMyRides().catch(() => []),
        api.getMyRentals().catch(() => []),
        api.getMyLaundry().catch(() => []),
      ]);
      setRides(r);
      setRentals(ren);
      setLaundry(l);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalItem) return;
    setIsCancelling(true);
    try {
      if (cancelModalItem.type === 'RIDE') {
        await api.cancelRide(cancelModalItem.id);
        addToast(`Ride ${cancelModalItem.booking_id} cancelled.`, 'info');
      }
      setCancelModalItem(null);
      setSelectedItem(null);
      await fetchData();
    } catch (err: any) {
      addToast(err.message || 'Failed to cancel', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // Combine and sort
  const combinedList: Array<{
    type: 'RIDE' | 'RENTAL' | 'LAUNDRY';
    id: number;
    booking_id: string;
    title: string;
    subtitle: string;
    status: string;
    amount: number;
    created_at: string;
    raw: any;
  }> = [
    ...rides.map((r) => ({
      type: 'RIDE' as const,
      id: r.id,
      booking_id: r.booking_id,
      title: `${r.pickup} → ${r.drop}`,
      subtitle: `${r.passengers} Passenger${r.passengers > 1 ? 's' : ''} • Preferred ${r.preferred_time}`,
      status: r.status,
      amount: r.fare,
      created_at: r.created_at,
      raw: r,
    })),
    ...rentals.map((r) => ({
      type: 'RENTAL' as const,
      id: r.id,
      booking_id: r.booking_id,
      title: `${r.vehicle_type} Rental (${r.duration_hours}h)`,
      subtitle: `Pickup: ${r.pickup_location} • Upfront deposit: ₹${r.security_deposit}`,
      status: r.status,
      amount: r.rental_charge,
      created_at: r.created_at,
      raw: r,
    })),
    ...laundry.map((l) => ({
      type: 'LAUNDRY' as const,
      id: l.id,
      booking_id: l.booking_id,
      title: `Campus Laundry (${l.weight_kg} kg)`,
      subtitle: `${l.pickup_day} Pickup • ${l.pickup_location}`,
      status: l.status,
      amount: l.total_amount,
      created_at: l.created_at,
      raw: l,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredList = combinedList.filter((item) => {
    if (activeTab === 'rides' && item.type !== 'RIDE') return false;
    if (activeTab === 'rentals' && item.type !== 'RENTAL') return false;
    if (activeTab === 'laundry' && item.type !== 'LAUNDRY') return false;

    if (statusFilter && item.status.toUpperCase() !== statusFilter.toUpperCase()) {
      return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const matchId = item.booking_id.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      return matchId || matchTitle;
    }

    return true;
  });

  return (
    <div className="flex bg-slate-50/60 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-campus-100 text-campus-700 text-xs font-bold mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Booking History & Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-campus-800">
              My Campus Bookings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Track status, review rider assignments, and access complete transaction summaries.
            </p>
          </div>
        </div>

        {/* Tab Selector & Controls */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            {/* Tabs (Requirement 46) */}
            <div className="flex space-x-1">
              {[
                { id: 'all', label: 'All Services' },
                { id: 'rides', label: 'Bike Rides' },
                { id: 'laundry', label: 'Laundry Orders' },
                { id: 'rentals', label: 'Vehicle Rentals' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-campus-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">Status: All</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted / Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Booking ID (e.g., CC-RIDE-1001) or location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-campus-600 transition-colors"
            />
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <span className="w-6 h-6 border-2 border-campus-600/30 border-t-campus-600 rounded-full animate-spin inline-block mb-2" />
            <p>Loading your campus bookings...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No bookings found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven&apos;t placed any requests matching this filter. Choose a campus service above to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((item) => {
              let icon = <Bike className="w-5 h-5 text-campus-600" />;
              if (item.type === 'LAUNDRY') icon = <Shirt className="w-5 h-5 text-campus-600" />;
              if (item.type === 'RENTAL') icon = <KeyRound className="w-5 h-5 text-campus-600" />;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-campus-700 bg-campus-50 px-2.5 py-0.5 rounded-lg border border-campus-200">
                        {item.booking_id}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        {icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-campus-text leading-tight">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Amount</span>
                      <span className="text-base font-black text-campus-800">₹{item.amount}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedItem({ type: item.type, data: item.raw })}
                      className="px-3.5 py-1.5 rounded-xl bg-campus-50 hover:bg-campus-100 text-campus-700 font-bold text-xs transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOOKING DETAIL MODAL - Requirement 47 */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-campus-700 bg-campus-50 px-2.5 py-0.5 rounded-lg border border-campus-200">
                      {selectedItem.data.booking_id}
                    </span>
                    <StatusBadge status={selectedItem.data.status} size="sm" />
                  </div>
                  <h3 className="text-base font-bold text-campus-text mt-1">
                    {selectedItem.type === 'RIDE' && 'Bike Pickup & Drop Details'}
                    {selectedItem.type === 'LAUNDRY' && 'Campus Laundry Order Details'}
                    {selectedItem.type === 'RENTAL' && 'Vehicle Rental Details'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* RIDE DETAILS */}
              {selectedItem.type === 'RIDE' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pickup Location:</span>
                      <strong className="text-slate-900">{selectedItem.data.pickup}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Drop Location:</span>
                      <strong className="text-slate-900">{selectedItem.data.drop}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Passengers:</span>
                      <strong className="text-slate-900">{selectedItem.data.passengers} Passenger(s)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Preferred Time:</span>
                      <strong className="text-slate-900">{selectedItem.data.preferred_time}</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-700 font-bold">Standard Fare:</span>
                      <strong className="text-campus-800 text-sm">₹{selectedItem.data.fare}</strong>
                    </div>
                  </div>

                  {/* Rider Info if matched (Requirement 23) */}
                  {selectedItem.data.rider_name ? (
                    <div className="p-4 rounded-2xl bg-campus-50 border border-campus-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-campus-800">Assigned Rider Information</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Rider Name:</span>
                          <strong>{selectedItem.data.rider_name}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Phone Number:</span>
                          <strong>{selectedItem.data.rider_phone || '9876543220'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Vehicle Type:</span>
                          <strong>{selectedItem.data.vehicle_type || 'Bike'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Registration:</span>
                          <strong>{selectedItem.data.vehicle_number || 'TN-DEMO-01'}</strong>
                        </div>
                      </div>
                      <a
                        href={`tel:${selectedItem.data.rider_phone || '9876543220'}`}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Rider</span>
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
                      Looking for available campus riders... You will be notified immediately upon acceptance.
                    </div>
                  )}
                </div>
              )}

              {/* LAUNDRY DETAILS */}
              {selectedItem.type === 'LAUNDRY' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Weight:</span>
                    <strong className="text-slate-900">{selectedItem.data.weight_kg} kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pickup Day:</span>
                    <strong className="text-slate-900">{selectedItem.data.pickup_day}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <strong className="text-slate-900">{selectedItem.data.pickup_location}</strong>
                  </div>
                  {selectedItem.data.room_number && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hostel / Room:</span>
                      <strong className="text-slate-900">{selectedItem.data.hostel} ({selectedItem.data.room_number})</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rate:</span>
                    <span>₹{selectedItem.data.rate_per_kg} / kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Extra Charge:</span>
                    <span>₹{selectedItem.data.extra_charge}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-700 font-bold">Total Amount:</span>
                    <strong className="text-campus-800 text-sm">₹{selectedItem.data.total_amount}</strong>
                  </div>
                </div>
              )}

              {/* RENTAL DETAILS */}
              {selectedItem.type === 'RENTAL' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Type:</span>
                    <strong className="text-slate-900">{selectedItem.data.vehicle_type}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <strong className="text-slate-900">{selectedItem.data.duration_hours} Hours</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pickup Location:</span>
                    <strong className="text-slate-900">{selectedItem.data.pickup_location}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Initial Security Deposit:</span>
                    <strong className="text-slate-900">₹{selectedItem.data.security_deposit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rental Charge:</span>
                    <strong className="text-campus-800">₹{selectedItem.data.rental_charge}</strong>
                  </div>
                  {selectedItem.data.refund_amount !== null && selectedItem.data.refund_amount !== undefined && (
                    <div className="flex justify-between pt-1 border-t border-slate-200 text-emerald-800 font-bold">
                      <span>Refunded Balance:</span>
                      <strong className="text-sm">₹{selectedItem.data.refund_amount}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Actions & Cancellation (Requirement 129) */}
              <div className="flex items-center justify-between pt-2">
                {selectedItem.data.status === 'PENDING' ? (
                  <button
                    type="button"
                    onClick={() => setCancelModalItem({ type: selectedItem.type, id: selectedItem.data.id, booking_id: selectedItem.data.booking_id })}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    Cancel Booking
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Confirmation Dialog */}
        <ConfirmationModal
          isOpen={!!cancelModalItem}
          title="Cancel Booking Request"
          message={`Are you sure you want to cancel booking ${cancelModalItem?.booking_id}? This request will be marked as cancelled immediately.`}
          confirmLabel="Yes, Cancel Booking"
          variant="danger"
          isLoading={isCancelling}
          onConfirm={handleCancelBooking}
          onCancel={() => setCancelModalItem(null)}
        />
      </main>
    </div>
  );
}
