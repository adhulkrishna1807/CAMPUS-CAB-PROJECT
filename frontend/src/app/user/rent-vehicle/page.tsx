'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { LOCATIONS } from '@/components/FareCalculator';
import { Rental } from '@/types';
import {
  Bike, KeyRound, Clock, MapPin, CheckCircle2,
  AlertCircle, ArrowRight, ShieldCheck, DollarSign
} from 'lucide-react';

function RentVehicleInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, addToast } = useAuth();

  const [vehicleType, setVehicleType] = useState<'Bike' | 'Scooty'>(
    searchParams?.get('type') === 'Scooty' ? 'Scooty' : 'Bike'
  );
  const [durationHours, setDurationHours] = useState<3 | 6 | 12 | 24>(6);
  const [pickupLocation, setPickupLocation] = useState('University');
  const [preferredTime, setPreferredTime] = useState('10:00 AM');

  const [submitting, setSubmitting] = useState(false);
  const [submittedRental, setSubmittedRental] = useState<Rental | null>(null);

  const DURATION_PRICES: Record<number, number> = {
    3: 200,
    6: 270,
    12: 340,
    24: 420,
  };

  const SECURITY_DEPOSIT = 1000;
  const rentalCharge = DURATION_PRICES[durationHours];
  const refundableBalance = SECURITY_DEPOSIT - rentalCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const rental = await api.createRental({
        vehicle_type: vehicleType,
        duration_hours: durationHours,
        pickup_location: pickupLocation,
        preferred_pickup_time: preferredTime,
      });
      setSubmittedRental(rental);
      addToast('Vehicle rental request submitted successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to submit rental request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex bg-slate-50/60 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        {/* Title */}
        <div className="mb-6 space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-campus-100 text-campus-700 text-xs font-bold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Campus Self-Ride Rentals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-campus-800">
            Rent a Bike or Scooty
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Flexible self-ride vehicle rentals for campus commute, city transit, and weekend errands.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Type Toggle - Requirement 26 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Choose Vehicle Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setVehicleType('Bike')}
                  className={`p-4 rounded-2xl border-2 flex items-center space-x-3 transition-all ${
                    vehicleType === 'Bike'
                      ? 'border-campus-600 bg-campus-50/60 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    vehicleType === 'Bike' ? 'bg-campus-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Bike className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-campus-text">Motorcycle / Bike</p>
                    <p className="text-[11px] text-slate-500">Standard geared campus bike</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleType('Scooty')}
                  className={`p-4 rounded-2xl border-2 flex items-center space-x-3 transition-all ${
                    vehicleType === 'Scooty'
                      ? 'border-campus-600 bg-campus-50/60 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    vehicleType === 'Scooty' ? 'bg-campus-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <KeyRound className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-campus-text">Gearless Scooty</p>
                    <p className="text-[11px] text-slate-500">Smooth automatic campus ride</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Rental Duration Options - Requirement 26 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Rental Duration
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { hours: 3, price: 200 },
                  { hours: 6, price: 270 },
                  { hours: 12, price: 340 },
                  { hours: 24, price: 420 },
                ].map((tier) => (
                  <button
                    key={tier.hours}
                    type="button"
                    onClick={() => setDurationHours(tier.hours as any)}
                    className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
                      durationHours === tier.hours
                        ? 'border-campus-600 bg-campus-50/80 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-600 block">{tier.hours} Hours</span>
                    <span className="text-lg font-black text-campus-800 block mt-0.5">₹{tier.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pickup Location & Preferred Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-campus-600" />
                  <span>Pickup Location</span>
                </label>
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={`rent-pick-${loc}`} value={loc}>{loc}</option>
                  ))}
                </select>
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
                  placeholder="e.g. 10:00 AM"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600"
                />
              </div>
            </div>

            {/* SECURITY DEPOSIT & PRICING TRANSPARENCY - Requirements 27 & 29 */}
            <div className="p-5 rounded-2xl bg-campus-50/70 border border-campus-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-campus-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-campus-600" />
                  <span>Transparent Upfront Security Deposit</span>
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                  100% Refundable
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-campus-200/60">
                <div className="flex justify-between">
                  <span>Upfront Security Deposit:</span>
                  <strong className="text-slate-900">₹{SECURITY_DEPOSIT}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Rental Charge ({durationHours} Hours):</span>
                  <strong className="text-campus-800">₹{rentalCharge}</strong>
                </div>
                <div className="flex justify-between text-emerald-800 font-semibold pt-1 border-t border-campus-200/40">
                  <span>Estimated Refund Balance on Return:</span>
                  <strong className="text-base text-emerald-700">₹{refundableBalance}</strong>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 leading-relaxed italic bg-white/60 p-2.5 rounded-xl border border-campus-200/50">
                &quot;₹1000 includes a refundable security balance. Final rental charge is calculated based on selected duration. The remaining balance (₹{refundableBalance}) is refunded upon vehicle handover.&quot;
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-sm shadow-md shadow-campus-600/20 transition-all flex items-center justify-center gap-2"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Submit Rental Request ({vehicleType} • {durationHours}h)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* CONFIRMATION MODAL */}
        {submittedRental && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95 duration-150">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
              </div>

              <div>
                <h3 className="text-xl font-black text-campus-800">
                  Rental Request Submitted!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Awaiting rider assignment and handover coordination.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking ID:</span>
                  <strong className="font-mono text-campus-700">{submittedRental.booking_id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle:</span>
                  <strong className="text-slate-800">{submittedRental.vehicle_type}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <strong className="text-slate-800">{submittedRental.duration_hours} Hours</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rental Price:</span>
                  <span className="text-slate-800 font-semibold">₹{submittedRental.rental_charge}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Deposit:</span>
                  <span className="text-slate-800 font-semibold">₹{submittedRental.security_deposit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    PENDING RIDER
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/user/dashboard')}
                  className="flex-1 py-3 bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/user/bookings')}
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

export default function RentVehiclePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-4 border-campus-600 border-t-transparent" /></div>}>
      <RentVehicleInner />
    </Suspense>
  );
}
