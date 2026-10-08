'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { RideRequest } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { Bike, Search, Filter, Phone, RefreshCw, XCircle } from 'lucide-react';

export default function AdminRidesPage() {
  const { user, role, addToast } = useAuth();
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [cancelRideId, setCancelRideId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchRides = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAllRides(statusFilter);
      setRides(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (user && role === 'ADMIN') {
      fetchRides();
    }
  }, [user, role, fetchRides]);

  const handleCancel = async () => {
    if (!cancelRideId) return;
    setCancelling(true);
    try {
      await api.cancelRide(cancelRideId);
      addToast('Ride cancelled by admin override', 'info');
      setCancelRideId(null);
      await fetchRides();
    } catch (err: any) {
      addToast(err.message || 'Failed to cancel', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const filteredRides = rides.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      const matchId = r.booking_id.toLowerCase().includes(q);
      const matchCust = r.customer_name?.toLowerCase().includes(q) || false;
      const matchRider = r.rider_name?.toLowerCase().includes(q) || false;
      return matchId || matchCust || matchRider;
    }
    return true;
  });

  return (
    <div className="flex bg-slate-50/60 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-campus-100 text-campus-700 text-xs font-bold mb-1">
              <Bike className="w-3.5 h-3.5" />
              <span>Campus Rides Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-campus-800">
              Ride Requests Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Live monitoring, driver assignments, and trip cancellation controls across all campus routes.
            </p>
          </div>

          <button
            onClick={fetchRides}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-campus-600" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Booking ID, student name, or rider name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-campus-600 transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 w-full sm:w-auto"
          >
            <option value="">Status: All Rides</option>
            <option value="PENDING">PENDING</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="RIDER_ON_WAY">RIDER ON WAY</option>
            <option value="STARTED">STARTED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Rides Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-campus-50/70 border-b border-slate-200 text-campus-800 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Booking ID</th>
                  <th className="py-3.5 px-4 sm:px-6">Customer</th>
                  <th className="py-3.5 px-4 sm:px-6">Route</th>
                  <th className="py-3.5 px-4 sm:px-6">Pax & Time</th>
                  <th className="py-3.5 px-4 sm:px-6">Fare</th>
                  <th className="py-3.5 px-4 sm:px-6">Assigned Rider</th>
                  <th className="py-3.5 px-4 sm:px-6">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading ride requests...
                    </td>
                  </tr>
                ) : filteredRides.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No rides matching search or filter.
                    </td>
                  </tr>
                ) : (
                  filteredRides.map((ride) => (
                    <tr key={ride.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-campus-800">
                        {ride.booking_id}
                        <span className="block font-sans font-normal text-[10px] text-slate-400">
                          {new Date(ride.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-800">
                        {ride.customer_name}
                        <span className="block text-[10px] text-slate-400 font-normal">{ride.customer_phone}</span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900">
                        {ride.pickup} → {ride.drop}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                        {ride.passengers} pax
                        <span className="block text-[10px] text-slate-400">{ride.preferred_time}</span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 font-bold text-campus-800">
                        ₹{ride.fare}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        {ride.rider_name ? (
                          <div>
                            <strong className="text-slate-800 block">{ride.rider_name}</strong>
                            <span className="text-[10px] text-slate-400 block">{ride.vehicle_number}</span>
                          </div>
                        ) : (
                          <span className="text-amber-700 font-semibold text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <StatusBadge status={ride.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        {ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => setCancelRideId(ride.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            Cancel Override
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmationModal
          isOpen={!!cancelRideId}
          title="Admin Override: Cancel Ride"
          message="Are you sure you want to cancel this ride request? This will mark the booking as CANCELLED."
          confirmLabel="Cancel Ride"
          variant="danger"
          isLoading={cancelling}
          onConfirm={handleCancel}
          onCancel={() => setCancelRideId(null)}
        />
      </main>
    </div>
  );
}
