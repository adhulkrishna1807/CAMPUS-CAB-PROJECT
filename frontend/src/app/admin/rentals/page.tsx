'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Rental } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/StatusBadge';
import { KeyRound, Search, RefreshCw, CheckCircle2, X } from 'lucide-react';

export default function AdminRentalsPage() {
  const { user, role, addToast } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Return modal state
  const [returnModalRental, setReturnModalRental] = useState<Rental | null>(null);
  const [actualDuration, setActualDuration] = useState<number>(6);
  const [actualReturnTime, setActualReturnTime] = useState('04:00 PM');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  const fetchRentals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAllRentals(statusFilter);
      setRentals(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (user && role === 'ADMIN') {
      fetchRentals();
    }
  }, [user, role, fetchRentals]);

  const handleOpenReturnModal = (rental: Rental) => {
    setReturnModalRental(rental);
    setActualDuration(rental.duration_hours);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActualReturnTime(nowStr);
  };

  const handleConfirmReturn = async () => {
    if (!returnModalRental) return;
    setIsProcessingReturn(true);
    try {
      const res = await api.returnRental(returnModalRental.id, {
        actual_return_time: actualReturnTime,
        actual_duration_hours: actualDuration,
      });
      addToast(
        `Rental returned! Deposit: ₹${res.security_deposit}, Charge: ₹${res.rental_charge}, Refund: ₹${res.refund_amount}`,
        'success'
      );
      setReturnModalRental(null);
      await fetchRentals();
    } catch (err: any) {
      addToast(err.message || 'Failed to process return', 'error');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const DURATION_PRICES: Record<number, number> = { 3: 200, 6: 270, 12: 340, 24: 420 };
  const currentCharge = DURATION_PRICES[actualDuration] || 270;
  const currentRefund = 1000 - currentCharge;

  const filteredRentals = rentals.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      const matchId = r.booking_id.toLowerCase().includes(q);
      const matchCust = r.customer_name?.toLowerCase().includes(q) || false;
      return matchId || matchCust;
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
              <KeyRound className="w-3.5 h-3.5" />
              <span>Fleet Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-campus-800">
              Vehicle Rental Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Monitor active vehicle dispatches, security deposit escrow, and return settlement calculations.
            </p>
          </div>

          <button
            onClick={fetchRentals}
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
              placeholder="Search by Booking ID or customer..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-campus-600 transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 w-full sm:w-auto"
          >
            <option value="">Status: All Rentals</option>
            <option value="PENDING">PENDING</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Rentals Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-campus-50/70 border-b border-slate-200 text-campus-800 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Booking ID</th>
                  <th className="py-3.5 px-4 sm:px-6">Customer</th>
                  <th className="py-3.5 px-4 sm:px-6">Vehicle & Duration</th>
                  <th className="py-3.5 px-4 sm:px-6">Deposit / Charge</th>
                  <th className="py-3.5 px-4 sm:px-6">Refund Balance</th>
                  <th className="py-3.5 px-4 sm:px-6">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading rental records...
                    </td>
                  </tr>
                ) : filteredRentals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No rental bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredRentals.map((rent) => (
                    <tr key={rent.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-mono font-bold text-campus-800">
                        {rent.booking_id}
                        <span className="block font-sans font-normal text-[10px] text-slate-400">
                          {new Date(rent.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-6">
                        <strong className="text-slate-800 block">{rent.customer_name}</strong>
                        <span className="text-[10px] text-slate-400 block">{rent.customer_phone}</span>
                      </td>

                      <td className="py-4 px-4 sm:px-6">
                        <strong className="text-slate-900 block">{rent.vehicle_type}</strong>
                        <span className="text-slate-500 block">{rent.duration_hours} Hours</span>
                        <span className="text-[10px] text-slate-400 block">{rent.pickup_location}</span>
                      </td>

                      <td className="py-4 px-4 sm:px-6">
                        <span className="text-slate-500 block">Deposit: ₹{rent.security_deposit}</span>
                        <strong className="text-campus-800 block">Charge: ₹{rent.rental_charge}</strong>
                      </td>

                      <td className="py-4 px-4 sm:px-6">
                        {rent.refund_amount !== null && rent.refund_amount !== undefined ? (
                          <strong className="text-emerald-700 text-sm">₹{rent.refund_amount}</strong>
                        ) : (
                          <span className="text-slate-400 italic">Pending return</span>
                        )}
                      </td>

                      <td className="py-4 px-4 sm:px-6">
                        <StatusBadge status={rent.status} size="sm" />
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        {rent.status !== 'COMPLETED' && rent.status !== 'CANCELLED' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReturnModal(rent)}
                            className="px-3.5 py-1.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs shadow-xs transition-colors"
                          >
                            Mark Returned
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold">
                            Closed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RETURN & REFUND CALCULATION MODAL - Requirements 28 & 55 */}
        {returnModalRental && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-campus-700 bg-campus-50 px-2 py-0.5 rounded-lg border border-campus-200">
                    {returnModalRental.booking_id}
                  </span>
                  <h3 className="text-base font-bold text-campus-text mt-1">
                    Process Vehicle Return & Refund
                  </h3>
                </div>
                <button
                  onClick={() => setReturnModalRental(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Actual Return Time
                  </label>
                  <input
                    type="text"
                    value={actualReturnTime}
                    onChange={(e) => setActualReturnTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-campus-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Billable Duration
                  </label>
                  <select
                    value={actualDuration}
                    onChange={(e) => setActualDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  >
                    <option value={3}>3 Hours (₹200 charge)</option>
                    <option value={6}>6 Hours (₹270 charge)</option>
                    <option value={12}>12 Hours (₹340 charge)</option>
                    <option value={24}>24 Hours (₹420 charge)</option>
                  </select>
                </div>

                {/* Return Summary Card - Requirement 28 */}
                <div className="p-4 rounded-2xl bg-campus-50 border border-campus-200 space-y-2">
                  <h4 className="font-bold text-campus-900 border-b border-campus-200/60 pb-1">
                    RENTAL RETURN SUMMARY
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Initial Security Deposit:</span>
                    <strong className="text-slate-900">₹1000</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Rental Charge ({actualDuration}h):</span>
                    <strong className="text-campus-800">₹{currentCharge}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-campus-200 text-emerald-800 font-bold text-sm">
                    <span>Refundable Balance to Customer:</span>
                    <span>₹{currentRefund}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalRental(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingReturn}
                  onClick={handleConfirmReturn}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  {isProcessingReturn && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Confirm Handover & Refund</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
