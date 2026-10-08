'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { LOCATIONS } from '@/components/FareCalculator';
import { FareCalculationResult, RideRequest } from '@/types';
import {
  Bike, MapPin, Clock, Users, User, ArrowRight,
  CheckCircle2, AlertCircle, Phone, Sparkles
} from 'lucide-react';

function BookRideInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, addToast } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickup, setPickup] = useState(searchParams?.get('from') || 'Boys Hostel');
  const [drop, setDrop] = useState(searchParams?.get('to') || 'Gate 2');
  const [passengers, setPassengers] = useState<1 | 2>(
    searchParams?.get('pax') === '2' ? 2 : 1
  );
  const [preferredTime, setPreferredTime] = useState('Immediate / Next 10 mins');

  const [fareResult, setFareResult] = useState<FareCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Success state modal
  const [submittedRide, setSubmittedRide] = useState<RideRequest | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  // Recalculate fare whenever pickup, drop, or passengers change
  useEffect(() => {
    let isMounted = true;
    const calc = async () => {
      if (!pickup || !drop) return;
      setCalculating(true);
      try {
        const res = await api.calculateFare(pickup, drop, passengers);
        if (isMounted) setFareResult(res);
      } catch {
        if (isMounted) {
          setFareResult({
            from_location: pickup,
            to_location: drop,
            passengers,
            fare: 0,
            is_available: false,
            message: 'Fare calculation failed.'
          });
        }
      } finally {
        if (isMounted) setCalculating(false);
      }
    };
    calc();
    return () => { isMounted = false; };
  }, [pickup, drop, passengers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fareResult?.is_available) {
      addToast('Cannot book unsupported route. Please select a valid campus route.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const ride = await api.createRide({
        pickup,
        drop,
        passengers,
        preferred_time: preferredTime,
      });
      setSubmittedRide(ride);
      addToast('Ride request submitted successfully! Matching campus riders...', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to submit ride request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex bg-slate-50/60 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        {/* Page Title */}
        <div className="mb-6 space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-campus-100 text-campus-700 text-xs font-bold">
            <Bike className="w-3.5 h-3.5" />
            <span>Campus Mobility</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-campus-800">
            Bike Pickup & Drop
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Book a Campus Cab rider for convenient campus and transit hub travel.
          </p>
        </div>

        {/* Booking Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Passenger Info (prefilled) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact Number</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
                />
              </div>
            </div>

            {/* Route Selection (Dropdowns per Requirement 15 & 16) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-campus-600" />
                  <span>Pickup Location</span>
                </label>
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={`pick-${loc}`} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Drop Location</span>
                </label>
                <select
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={`dr-${loc}`} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Passengers & Preferred Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Number of Passengers
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPassengers(1)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      passengers === 1
                        ? 'bg-campus-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>1 Passenger</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassengers(2)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      passengers === 2
                        ? 'bg-campus-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>2 Passengers</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Preferred Pickup Time</span>
                </label>
                <input
                  type="text"
                  required
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="e.g. 10:30 AM or Immediate"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
                />
              </div>
            </div>

            {/* TRIP SUMMARY & FARE DISPLAY - Requirement 18 */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Trip Summary
              </h3>

              {calculating ? (
                <div className="p-5 bg-slate-50 rounded-2xl flex items-center justify-center text-xs text-slate-500">
                  <span className="w-4 h-4 border-2 border-campus-600/30 border-t-campus-600 rounded-full animate-spin mr-2" />
                  Calculating fare from official chart...
                </div>
              ) : fareResult?.is_available ? (
                <div className="p-5 rounded-2xl bg-campus-50 border border-campus-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-campus-900">{pickup}</span>
                      <span className="text-campus-400">→</span>
                      <span className="font-bold text-sm text-campus-900">{drop}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Passengers: <strong className="text-slate-800">{passengers} ({passengers === 1 ? 'Single Fare' : 'Double Fare'})</strong>
                    </p>
                    <p className="text-xs text-slate-600">
                      Pickup Window: <strong className="text-slate-800">{preferredTime}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-3xl font-black text-campus-800">₹{fareResult.fare}</span>
                    <p className="text-[11px] text-slate-500 font-medium">Standard Fixed Fare</p>
                  </div>
                </div>
              ) : (
                /* Requirement 19: Invalid Route Handling */
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-left">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-900">
                      Fare for this route is currently unavailable.
                    </h5>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Please select a supported Campus Cab route from the fare chart, or contact Campus Admin for custom transit.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Ride Button */}
            <button
              type="submit"
              disabled={submitting || !fareResult?.is_available}
              className={`w-full py-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                fareResult?.is_available
                  ? 'bg-campus-600 hover:bg-campus-700 text-white shadow-campus-600/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Confirm Ride Request (₹{fareResult?.fare || 0})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* BOOKING CONFIRMATION MODAL - Requirement 20 */}
        {submittedRide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95 duration-150">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
              </div>

              <div>
                <h3 className="text-xl font-black text-campus-800">
                  Ride Request Submitted!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your ride has been broadcast to available campus riders.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking ID:</span>
                  <strong className="font-mono text-campus-700">{submittedRide.booking_id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    PENDING RIDER
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Route:</span>
                  <strong className="text-slate-800">{submittedRide.pickup} → {submittedRide.drop}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Passengers:</span>
                  <strong className="text-slate-800">{submittedRide.passengers} pax</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fare:</span>
                  <strong className="text-campus-800 text-sm">₹{submittedRide.fare}</strong>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/user/dashboard')}
                  className="flex-1 py-3 bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                >
                  View Booking in Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedRide(null);
                    router.push('/user/bookings');
                  }}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  My Bookings
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BookRidePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-4 border-campus-600 border-t-transparent" /></div>}>
      <BookRideInner />
    </Suspense>
  );
}
