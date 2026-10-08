'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { RideRequest, Rental, LaundryOrder } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Bike, Shirt, KeyRound, Clock, Bell, ArrowRight,
  CheckCircle2, AlertCircle, Phone, MapPin, Calendar, Plus
} from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const { user, role, isLoading } = useAuth();

  const [myRides, setMyRides] = useState<RideRequest[]>([]);
  const [myRentals, setMyRentals] = useState<Rental[]>([]);
  const [myLaundry, setMyLaundry] = useState<LaundryOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Strict role check (Requirement 9 & 136)
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (role !== 'USER') {
        if (role === 'RIDER') router.push('/rider/dashboard');
        else if (role === 'ADMIN') router.push('/admin/dashboard');
      }
    }
  }, [user, role, isLoading, router]);

  useEffect(() => {
    if (user && role === 'USER') {
      Promise.all([
        api.getMyRides().catch(() => []),
        api.getMyRentals().catch(() => []),
        api.getMyLaundry().catch(() => [])
      ]).then(([rides, rentals, laundry]) => {
        setMyRides(rides);
        setMyRentals(rentals);
        setMyLaundry(laundry);
      }).finally(() => setDataLoading(false));
    }
  }, [user, role]);

  if (isLoading || !user || role !== 'USER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="w-8 h-8 border-3 border-campus-600/30 border-t-campus-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Active / in-progress ride
  const activeRide = myRides.find((r) =>
    ['ACCEPTED', 'RIDER_ON_WAY', 'STARTED'].includes(r.status)
  ) || myRides.find((r) => r.status === 'PENDING');

  const pendingCount =
    myRides.filter((r) => r.status === 'PENDING').length +
    myRentals.filter((r) => r.status === 'PENDING').length +
    myLaundry.filter((r) => r.status === 'PENDING').length;

  const completedCount =
    myRides.filter((r) => r.status === 'COMPLETED').length +
    myRentals.filter((r) => r.status === 'COMPLETED').length +
    myLaundry.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div className="flex bg-slate-50/60 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-campus-800 to-campus-700 text-white rounded-3xl p-6 sm:p-8 shadow-md shadow-campus-800/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-campus-200 bg-campus-900/40 px-3 py-1 rounded-full">
              Student Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">
              Welcome back, {user.name} 👋
            </h1>
            <p className="text-xs sm:text-sm text-campus-100 mt-1">
              Hostel: {user.hostel || 'Not set'} • Room: {user.room_number || 'Not set'}
            </p>
          </div>
          <Link
            href="/user/book-ride"
            className="px-5 py-3 rounded-2xl bg-white text-campus-800 hover:bg-campus-50 font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-campus-600" />
            <span>Book New Service</span>
          </Link>
        </div>

        {/* Dashboard Metric Cards - Requirement 13 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Active Booking</span>
            <p className="text-2xl font-black text-campus-text mt-1">
              {activeRide ? '1 Active' : '0 Active'}
            </p>
            <span className="text-[11px] text-campus-600 font-medium">
              {activeRide ? activeRide.booking_id : 'No active rides'}
            </span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Pending Requests</span>
            <p className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</p>
            <span className="text-[11px] text-slate-400 font-medium">Awaiting rider/admin</span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Completed Services</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">{completedCount}</p>
            <span className="text-[11px] text-emerald-600 font-medium">Historical completed</span>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Total Bookings</span>
            <p className="text-2xl font-black text-campus-800 mt-1">
              {myRides.length + myRentals.length + myLaundry.length}
            </p>
            <span className="text-[11px] text-slate-400 font-medium">Rides, laundry & rentals</span>
          </div>
        </div>

        {/* LIVE RIDE TRACKER (Requirement 48 & 23) */}
        {activeRide && (
          <div className="bg-white rounded-3xl p-6 border border-campus-200 shadow-md shadow-campus-600/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-campus-700 bg-campus-50 px-2.5 py-0.5 rounded-lg border border-campus-200">
                    {activeRide.booking_id}
                  </span>
                  <StatusBadge status={activeRide.status} />
                </div>
                <h3 className="text-base font-bold text-campus-text mt-1.5">
                  {activeRide.pickup} → {activeRide.drop}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-campus-800">₹{activeRide.fare}</span>
                <p className="text-[11px] text-slate-400">Fixed campus fare</p>
              </div>
            </div>

            {/* Visual Timeline Tracker - Requirement 48 */}
            <div className="py-6">
              <div className="grid grid-cols-4 gap-2 text-center relative">
                {/* Step 1 */}
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xs font-bold shadow-sm">
                    ✓
                  </div>
                  <p className="text-xs font-bold text-slate-800">Requested</p>
                  <p className="text-[10px] text-slate-400">{activeRide.preferred_time}</p>
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-sm ${
                    ['ACCEPTED', 'RIDER_ON_WAY', 'STARTED', 'COMPLETED'].includes(activeRide.status)
                      ? 'bg-campus-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {['ACCEPTED', 'RIDER_ON_WAY', 'STARTED', 'COMPLETED'].includes(activeRide.status) ? '✓' : '2'}
                  </div>
                  <p className={`text-xs font-bold ${
                    ['ACCEPTED', 'RIDER_ON_WAY', 'STARTED', 'COMPLETED'].includes(activeRide.status) ? 'text-campus-800' : 'text-slate-400'
                  }`}>
                    Rider Matched
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-sm ${
                    ['RIDER_ON_WAY', 'STARTED', 'COMPLETED'].includes(activeRide.status)
                      ? 'bg-campus-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {['RIDER_ON_WAY', 'STARTED', 'COMPLETED'].includes(activeRide.status) ? '✓' : '3'}
                  </div>
                  <p className={`text-xs font-bold ${
                    ['RIDER_ON_WAY', 'STARTED', 'COMPLETED'].includes(activeRide.status) ? 'text-campus-800' : 'text-slate-400'
                  }`}>
                    On The Way
                  </p>
                </div>

                {/* Step 4 */}
                <div className="space-y-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-sm ${
                    activeRide.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {activeRide.status === 'COMPLETED' ? '✓' : '4'}
                  </div>
                  <p className={`text-xs font-bold ${
                    activeRide.status === 'COMPLETED' ? 'text-emerald-800' : 'text-slate-400'
                  }`}>
                    Completed
                  </p>
                </div>
              </div>
            </div>

            {/* Rider Details shared with user (Requirement 23) */}
            {activeRide.rider_name && (
              <div className="p-4 rounded-2xl bg-campus-50 border border-campus-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-campus-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {activeRide.rider_name[0]}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-campus-700 uppercase tracking-wider">
                      Assigned Rider ✓
                    </span>
                    <h4 className="text-sm font-bold text-campus-text">{activeRide.rider_name}</h4>
                    <p className="text-xs text-slate-600">
                      Vehicle: <span className="font-semibold text-slate-800">{activeRide.vehicle_type || 'Bike'}</span> ({activeRide.vehicle_number || 'TN-XX-XXXX'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <a
                    href={`tel:${activeRide.rider_phone || '9876543220'}`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Rider ({activeRide.rider_phone || '9876543220'})</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Action Cards - Requirement 13 */}
        <div>
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/user/book-ride"
              className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-campus-400 hover:shadow-md transition-all group flex items-start space-x-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-campus-50 text-campus-600 flex items-center justify-center group-hover:bg-campus-600 group-hover:text-white transition-colors shrink-0">
                <Bike className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-campus-text group-hover:text-campus-600 transition-colors">
                  Book a Ride
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Hostel pickup, science block, SOM & transit stops.
                </p>
              </div>
            </Link>

            <Link
              href="/user/book-laundry"
              className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-campus-400 hover:shadow-md transition-all group flex items-start space-x-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-campus-50 text-campus-600 flex items-center justify-center group-hover:bg-campus-600 group-hover:text-white transition-colors shrink-0">
                <Shirt className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-campus-text group-hover:text-campus-600 transition-colors">
                  Book Laundry
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Wednesday & Saturday pickup from hostel room.
                </p>
              </div>
            </Link>

            <Link
              href="/user/rent-vehicle"
              className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-campus-400 hover:shadow-md transition-all group flex items-start space-x-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-campus-50 text-campus-600 flex items-center justify-center group-hover:bg-campus-600 group-hover:text-white transition-colors shrink-0">
                <KeyRound className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-campus-text group-hover:text-campus-600 transition-colors">
                  Rent a Vehicle
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  3h, 6h, 12h, 24h Bike & Scooty with deposit refund.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Bookings Feed */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-campus-text">Recent Campus Cab Activity</h2>
            <Link
              href="/user/bookings"
              className="text-xs font-bold text-campus-600 hover:underline"
            >
              View all bookings →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {myRides.length === 0 && myRentals.length === 0 && myLaundry.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent bookings. Book your first campus ride or laundry pickup!
              </div>
            ) : (
              [...myRides.slice(0, 3)].map((ride) => (
                <div key={ride.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-campus-50 text-campus-600 flex items-center justify-center shrink-0">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-800">{ride.booking_id}</span>
                        <StatusBadge status={ride.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {ride.pickup} → {ride.drop} ({ride.passengers} pax)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-campus-800">₹{ride.fare}</span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(ride.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
