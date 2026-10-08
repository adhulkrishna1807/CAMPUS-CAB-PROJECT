'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { RideRequest, Rental, RiderStats } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import {
  Bike, DollarSign, Clock, CheckCircle2, AlertCircle,
  Phone, User, MapPin, KeyRound, Shield, RefreshCw
} from 'lucide-react';

export default function RiderDashboard() {
  const router = useRouter();
  const { user, role, riderInfo, refreshUser, isLoading, addToast } = useAuth();

  const [stats, setStats] = useState<RiderStats | null>(null);
  const [pendingRides, setPendingRides] = useState<RideRequest[]>([]);
  const [pendingRentals, setPendingRentals] = useState<Rental[]>([]);
  const [activeRides, setActiveRides] = useState<RideRequest[]>([]);
  const [completedRides, setCompletedRides] = useState<RideRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Accept confirmation
  const [acceptItem, setAcceptItem] = useState<{ type: 'RIDE' | 'RENTAL'; id: number; booking_id: string } | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Status updating
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Strict role enforcement (Requirement 9 & 136)
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (role !== 'RIDER') {
        if (role === 'USER') router.push('/user/dashboard');
        else if (role === 'ADMIN') router.push('/admin/dashboard');
      }
    }
  }, [user, role, isLoading, router]);

  const fetchRiderData = async () => {
    try {
      setDataLoading(true);
      const [st, pr, pren, ar, allR] = await Promise.all([
        api.getRiderStats().catch(() => null),
        api.getPendingRides().catch(() => []),
        api.getPendingRentals().catch(() => []),
        api.getActiveRides().catch(() => []),
        api.getMyRides().catch(() => []),
      ]);
      setStats(st);
      setPendingRides(pr);
      setPendingRentals(pren);
      setActiveRides(ar);
      setCompletedRides(allR.filter((r) => r.status === 'COMPLETED'));
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user && role === 'RIDER') {
      fetchRiderData();
    }
  }, [user, role]);

  const handleConfirmAccept = async () => {
    if (!acceptItem) return;
    setIsAccepting(true);
    try {
      if (acceptItem.type === 'RIDE') {
        const res = await api.acceptRide(acceptItem.id);
        addToast(`Ride ${acceptItem.booking_id} accepted successfully! User notified.`, 'success');
      } else {
        const res = await api.acceptRental(acceptItem.id);
        addToast(`Rental ${acceptItem.booking_id} accepted!`, 'success');
      }
      setAcceptItem(null);
      await fetchRiderData();
    } catch (err: any) {
      // Handles 409 Conflict if another rider already accepted (Requirement 137 & 154)
      addToast(err.message || 'Another rider has already accepted this request.', 'error');
      setAcceptItem(null);
      await fetchRiderData();
    } finally {
      setIsAccepting(false);
    }
  };

  const handleStatusProgression = async (rideId: number, nextStatus: string) => {
    setUpdatingId(rideId);
    try {
      await api.updateRideStatus(rideId, nextStatus);
      addToast(`Status updated to ${nextStatus.replace(/_/g, ' ')}`, 'success');
      await fetchRiderData();
    } catch (err: any) {
      addToast(err.message || 'Status update failed', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading || !user || role !== 'RIDER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="w-8 h-8 border-3 border-campus-600/30 border-t-campus-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50/60 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-campus-800 to-campus-700 text-white rounded-3xl p-6 sm:p-8 shadow-md shadow-campus-800/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-campus-200 bg-campus-900/40 px-3 py-1 rounded-full">
                Rider Console
              </span>
              <span className="text-xs font-bold text-emerald-300">
                ⭐ {riderInfo?.rating || 4.9} Rating
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">
              Welcome, {user.name} 🏍️
            </h1>
            <p className="text-xs sm:text-sm text-campus-100 mt-1">
              Vehicle: <strong>{riderInfo?.vehicle_type || 'Bike'}</strong> ({riderInfo?.vehicle_number || 'TN-DEMO-01'})
            </p>
          </div>

          <button
            onClick={fetchRiderData}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Requests</span>
          </button>
        </div>

        {/* Metric Cards - Requirement 24 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Pending Requests</span>
            <p className="text-2xl font-black text-amber-700 mt-1">
              {pendingRides.length + pendingRentals.length}
            </p>
            <span className="text-[11px] text-slate-400 font-medium">Available to accept</span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">My Active Rides</span>
            <p className="text-2xl font-black text-campus-600 mt-1">{activeRides.length}</p>
            <span className="text-[11px] text-campus-600 font-medium">Currently in-progress</span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Completed Rides</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {stats?.completed_rides || completedRides.length}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium">Total campus trips</span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Today&apos;s Earnings</span>
            <p className="text-2xl font-black text-campus-800 mt-1">
              ₹{stats?.today_earnings || 0}
            </p>
            <span className="text-[11px] text-slate-400 font-medium">Lifetime: ₹{stats?.total_earnings || 0}</span>
          </div>
        </div>

        {/* SECTION 1: PENDING RIDE REQUESTS (Requirement 21) */}
        <section id="pending-rides" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bike className="w-5 h-5 text-campus-600" />
              <h2 className="text-lg font-bold text-campus-text">
                Pending Ride Requests ({pendingRides.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">Real-time incoming campus requests</span>
          </div>

          {pendingRides.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2 text-slate-400">
              <Bike className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No pending ride requests at this moment.</p>
              <p className="text-[11px]">New student requests will appear here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRides.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-white rounded-3xl border-2 border-campus-100 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-campus-700 bg-campus-50 px-2 py-0.5 rounded-lg border border-campus-200">
                        {ride.booking_id}
                      </span>
                      <span className="text-2xl font-black text-campus-800">₹{ride.fare}</span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-campus-text">
                        {ride.pickup} → {ride.drop}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Passenger: <strong className="text-slate-800">{ride.customer_name}</strong> • {ride.passengers} pax
                      </p>
                      <p className="text-xs text-slate-500">
                        Pickup Window: <strong className="text-slate-800">{ride.preferred_time}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAcceptItem({ type: 'RIDE', id: ride.id, booking_id: ride.booking_id })}
                      className="flex-1 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Ride</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addToast('Request dismissed for this view', 'info')}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: MY ACTIVE RIDES (Requirement 22 & 48) */}
        <section id="active-rides" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-campus-600" />
              <h2 className="text-lg font-bold text-campus-text">
                My Active Assigned Rides ({activeRides.length})
              </h2>
            </div>
          </div>

          {activeRides.length === 0 ? (
            <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
              No rides in progress right now. Accept a pending request above to start.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRides.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-white rounded-3xl border border-campus-200 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-campus-700 bg-campus-50 px-2.5 py-0.5 rounded-lg border border-campus-200">
                        {ride.booking_id}
                      </span>
                      <h4 className="text-base font-bold text-campus-text mt-1">
                        {ride.pickup} → {ride.drop}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-campus-800">₹{ride.fare}</span>
                      <div className="mt-1">
                        <StatusBadge status={ride.status} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Customer:</span>
                      <strong className="text-slate-800">{ride.customer_name}</strong>
                    </div>
                    <a
                      href={`tel:${ride.customer_phone}`}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{ride.customer_phone}</span>
                    </a>
                  </div>

                  {/* Progression Actions (Requirement 48) */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    {ride.status === 'ACCEPTED' && (
                      <button
                        type="button"
                        disabled={updatingId === ride.id}
                        onClick={() => handleStatusProgression(ride.id, 'RIDER_ON_WAY')}
                        className="flex-1 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs rounded-xl transition-colors"
                      >
                        {updatingId === ride.id ? 'Updating...' : 'Mark: Rider on the Way'}
                      </button>
                    )}

                    {ride.status === 'RIDER_ON_WAY' && (
                      <button
                        type="button"
                        disabled={updatingId === ride.id}
                        onClick={() => handleStatusProgression(ride.id, 'STARTED')}
                        className="flex-1 py-2.5 bg-campus-700 hover:bg-campus-800 text-white font-bold text-xs rounded-xl transition-colors"
                      >
                        {updatingId === ride.id ? 'Updating...' : 'Start Ride (Customer Picked Up)'}
                      </button>
                    )}

                    {ride.status === 'STARTED' && (
                      <button
                        type="button"
                        disabled={updatingId === ride.id}
                        onClick={() => handleStatusProgression(ride.id, 'COMPLETED')}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                      >
                        {updatingId === ride.id ? 'Updating...' : 'Complete Ride (Collect ₹' + ride.fare + ')'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3: PENDING RENTALS (Requirement 25) */}
        <section id="rentals" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-campus-600" />
              <h2 className="text-lg font-bold text-campus-text">
                Pending Rental Requests ({pendingRentals.length})
              </h2>
            </div>
          </div>

          {pendingRentals.length === 0 ? (
            <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
              No pending rental requests.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRentals.map((rent) => (
                <div
                  key={rent.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-campus-700 bg-campus-50 px-2 py-0.5 rounded-lg border border-campus-200">
                        {rent.booking_id}
                      </span>
                      <span className="text-lg font-black text-campus-800">₹{rent.rental_charge}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-campus-text">
                        {rent.vehicle_type} Rental ({rent.duration_hours}h)
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">Customer: <strong>{rent.customer_name}</strong></p>
                      <p className="text-xs text-slate-600">Location: {rent.pickup_location}</p>
                      <p className="text-xs text-slate-600">Time: {rent.preferred_pickup_time}</p>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        Deposit: ₹{rent.security_deposit}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAcceptItem({ type: 'RENTAL', id: rent.id, booking_id: rent.booking_id })}
                    className="w-full py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    Accept Rental Handover
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CONFIRMATION MODAL (Requirement 128) */}
        <ConfirmationModal
          isOpen={!!acceptItem}
          title={`Accept ${acceptItem?.type === 'RIDE' ? 'Ride' : 'Rental'} Request`}
          message={`Are you ready to accept booking ${acceptItem?.booking_id}? You will be linked as the assigned rider and the customer will receive your vehicle and contact details immediately.`}
          confirmLabel="Yes, Accept Request"
          isLoading={isAccepting}
          onConfirm={handleConfirmAccept}
          onCancel={() => setAcceptItem(null)}
        />
      </main>
    </div>
  );
}
