'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { LaundryOrder } from '@/types';
import {
  Shirt, MapPin, Calendar, Scale, ArrowRight,
  CheckCircle2, AlertCircle, Home, Sparkles
} from 'lucide-react';

export default function BookLaundryPage() {
  const router = useRouter();
  const { user, addToast } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupLocation, setPickupLocation] = useState('Boys Hostel');
  const [hostel, setHostel] = useState('Boys Hostel');
  const [roomNumber, setRoomNumber] = useState('');
  const [weightKg, setWeightKg] = useState<number>(2);
  const [pickupDay, setPickupDay] = useState<'Wednesday' | 'Saturday'>('Saturday');

  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<LaundryOrder | null>(null);

  // Constants per requirements 30 & 31
  const RATE_PER_KG = 65;
  const EXTRA_SERVICE_CHARGE = 25;

  const laundryCost = (weightKg > 0 ? weightKg : 0) * RATE_PER_KG;
  const totalAmount = laundryCost + EXTRA_SERVICE_CHARGE;

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      if (user.hostel) {
        setHostel(user.hostel);
        setPickupLocation(user.hostel);
      }
      if (user.room_number) setRoomNumber(user.room_number);
    }
  }, [user]);

  // Conditional hostel logic (Requirement 33)
  const isHostelLocation = pickupLocation.toLowerCase().includes('hostel');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (weightKg <= 0) {
      addToast('Weight must be greater than 0 kg', 'error');
      return;
    }
    if (pickupDay !== 'Wednesday' && pickupDay !== 'Saturday') {
      addToast('Laundry pickup is available only on Wednesday and Saturday.', 'error');
      return;
    }
    if (isHostelLocation && !roomNumber.trim()) {
      addToast('Please enter your hostel room number for room pickup.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const order = await api.createLaundry({
        name,
        phone,
        pickup_location: pickupLocation,
        hostel: isHostelLocation ? hostel : undefined,
        room_number: isHostelLocation ? roomNumber : undefined,
        weight_kg: Number(weightKg),
        pickup_day: pickupDay,
      });
      setSubmittedOrder(order);
      addToast('Laundry request submitted successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to submit laundry request', 'error');
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
            <Shirt className="w-3.5 h-3.5" />
            <span>Campus Laundry Service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-campus-800">
            Book Laundry Pickup
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Professional wash, dry, iron and doorstep delivery scheduled exclusively on Wednesdays and Saturdays.
          </p>
        </div>

        {/* Pricing Transparency Banner (Requirement 30) */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-campus-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-campus-50 text-campus-600 flex items-center justify-center font-bold">
              🧺
            </div>
            <div>
              <p className="text-xs font-bold text-campus-800">Campus Laundry Standard Pricing</p>
              <p className="text-[11px] text-slate-500">Transparent rates per kilogram with dedicated packaging</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="bg-campus-50 px-3 py-1.5 rounded-xl border border-campus-200 text-campus-800">
              Rate: <strong>₹65/kg</strong>
            </span>
            <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
              Extra Service Charge: <strong>₹25</strong>
            </span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
                />
              </div>
            </div>

            {/* Pickup Location & Conditional Hostel Fields (Requirement 33) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-campus-600" />
                  <span>Pickup Location</span>
                </label>
                <select
                  value={pickupLocation}
                  onChange={(e) => {
                    setPickupLocation(e.target.value);
                    if (e.target.value.toLowerCase().includes('hostel')) {
                      setHostel(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
                >
                  <option value="Boys Hostel">Boys Hostel</option>
                  <option value="Girls Hostel">Girls Hostel</option>
                  <option value="Department Block">Department Block</option>
                  <option value="Science Block">Science Block</option>
                  <option value="University Campus Quarters">University Campus Quarters</option>
                </select>
              </div>

              {/* Day selection strictly limited to Wednesday & Saturday (Requirement 32) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-campus-600" />
                  <span>Preferred Pickup Day</span>
                </label>
                <select
                  value={pickupDay}
                  onChange={(e) => setPickupDay(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
                >
                  <option value="Wednesday">Wednesday Pickup</option>
                  <option value="Saturday">Saturday Pickup</option>
                </select>
                <p className="text-[11px] text-campus-600 mt-1">
                  ✓ Laundry pickup is available only on Wednesday and Saturday.
                </p>
              </div>
            </div>

            {/* Conditional Hostel & Room Fields */}
            {isHostelLocation && (
              <div className="p-4 bg-campus-50/50 rounded-2xl border border-campus-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-campus-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-campus-600" />
                    <span>Hostel Wing / Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    placeholder="e.g. Boys Hostel Block A"
                    className="w-full px-3.5 py-2.5 bg-white border border-campus-200 rounded-xl text-sm font-medium text-slate-800 focus:border-campus-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-campus-900 uppercase tracking-wider mb-1">
                    Room Number (Required for Hostel)
                  </label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. B-204"
                    className="w-full px-3.5 py-2.5 bg-white border border-campus-200 rounded-xl text-sm font-medium text-slate-800 focus:border-campus-600"
                  />
                </div>
              </div>
            )}

            {/* Weight Input (Requirement 31) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                <span>Estimated Weight in KG</span>
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-32 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:border-campus-600"
                />
                <span className="text-sm font-semibold text-slate-600">Kilograms</span>
              </div>
            </div>

            {/* DYNAMIC CALCULATION BREAKDOWN - Requirement 31 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Order Price Breakdown
              </h3>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Laundry Rate ({weightKg} kg × ₹{RATE_PER_KG}):</span>
                <span className="font-semibold text-slate-800">₹{laundryCost}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Extra Service Charge (Sanitization & Packing):</span>
                <span className="font-semibold text-slate-800">₹{EXTRA_SERVICE_CHARGE}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-campus-text">Total Payable:</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-campus-800">₹{totalAmount}</span>
                  <span className="text-[10px] text-slate-400 block font-normal">(Pay upon delivery)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-sm shadow-md shadow-campus-600/20 transition-all flex items-center justify-center gap-2"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Submit Laundry Request (₹{totalAmount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* CONFIRMATION MODAL - Requirement 34 */}
        {submittedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95 duration-150">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
              </div>

              <div>
                <h3 className="text-xl font-black text-campus-800">
                  Laundry Request Submitted!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Scheduled for collection by Campus Cab laundry operations.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking ID:</span>
                  <strong className="font-mono text-campus-700">{submittedOrder.booking_id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pickup Day:</span>
                  <strong className="text-slate-800">{submittedOrder.pickup_day}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Weight:</span>
                  <strong className="text-slate-800">{submittedOrder.weight_kg} kg</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Laundry:</span>
                  <span className="text-slate-800 font-semibold">₹{submittedOrder.weight_kg * submittedOrder.rate_per_kg}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Extra Charge:</span>
                  <span className="text-slate-800 font-semibold">₹{submittedOrder.extra_charge}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Total:</span>
                  <strong className="text-campus-800 text-sm">₹{submittedOrder.total_amount}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    PENDING ADMIN
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
