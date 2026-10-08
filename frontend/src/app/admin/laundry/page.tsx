'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { LaundryOrder } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Shirt, CheckCircle2, Clock, MapPin, Scale, Search,
  Filter, ChevronRight, Phone, RefreshCw, User
} from 'lucide-react';

const STATUS_PIPELINE = [
  'PENDING',
  'PICKUP_SCHEDULED',
  'COLLECTED',
  'PROCESSING',
  'READY',
  'DELIVERED',
  'COMPLETED'
];

export default function AdminLaundryPage() {
  const { user, role, addToast } = useAuth();
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchLaundry = async () => {
    try {
      setLoading(true);
      const data = await api.getAllLaundry();
      setOrders(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && role === 'ADMIN') {
      fetchLaundry();
    }
  }, [user, role]);

  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.updateLaundryStatus(orderId, nextStatus);
      addToast(`Status updated to ${nextStatus.replace(/_/g, ' ')}`, 'success');
      await fetchLaundry();
    } catch (err: any) {
      addToast(err.message || 'Failed to update laundry status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.booking_id.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q)
      );
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
              <Shirt className="w-3.5 h-3.5" />
              <span>Campus Laundry Logistics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-campus-800">
              Laundry Operations Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage weekly Wednesday & Saturday pickup schedules, processing batches, and hostel room delivery.
            </p>
          </div>

          <button
            onClick={fetchLaundry}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-campus-600" />
            <span>Refresh Orders</span>
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
              placeholder="Search by Booking ID, student name, or phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-campus-600 transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 w-full sm:w-auto"
          >
            <option value="">Status: All Pipeline Stages</option>
            {STATUS_PIPELINE.map((st) => (
              <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
            ))}
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Orders Pipeline Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-campus-50/70 border-b border-slate-200 text-campus-800 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Order ID & Date</th>
                  <th className="py-3.5 px-4 sm:px-6">Customer & Hostel Room</th>
                  <th className="py-3.5 px-4 sm:px-6">Weight & Day</th>
                  <th className="py-3.5 px-4 sm:px-6">Pricing Breakdown</th>
                  <th className="py-3.5 px-4 sm:px-6">Current Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Advance Pipeline Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No laundry orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const currIdx = STATUS_PIPELINE.indexOf(ord.status);
                    const nextStatus = currIdx >= 0 && currIdx < STATUS_PIPELINE.length - 1
                      ? STATUS_PIPELINE[currIdx + 1]
                      : null;

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-mono font-bold text-campus-800">
                          {ord.booking_id}
                          <span className="block font-sans font-normal text-[10px] text-slate-400">
                            {new Date(ord.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </td>

                        <td className="py-4 px-4 sm:px-6">
                          <strong className="text-slate-900 block">{ord.name}</strong>
                          <span className="text-slate-500 block">{ord.phone}</span>
                          <span className="text-[11px] text-campus-700 font-semibold block">
                            {ord.hostel ? `${ord.hostel} (${ord.room_number || 'Room not set'})` : ord.pickup_location}
                          </span>
                        </td>

                        <td className="py-4 px-4 sm:px-6">
                          <strong className="text-slate-900 block">{ord.weight_kg} kg</strong>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-[10px] text-slate-700 inline-block mt-0.5">
                            {ord.pickup_day}
                          </span>
                        </td>

                        <td className="py-4 px-4 sm:px-6">
                          <strong className="text-campus-800 text-sm block">₹{ord.total_amount}</strong>
                          <span className="text-[10px] text-slate-400 block">
                            ₹{ord.weight_kg * ord.rate_per_kg} + ₹{ord.extra_charge} extra
                          </span>
                        </td>

                        <td className="py-4 px-4 sm:px-6">
                          <StatusBadge status={ord.status} size="sm" />
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right">
                          {nextStatus ? (
                            <button
                              type="button"
                              disabled={updatingId === ord.id}
                              onClick={() => handleUpdateStatus(ord.id, nextStatus)}
                              className="px-3.5 py-1.5 bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1"
                            >
                              <span>Mark {nextStatus.replace(/_/g, ' ')}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-bold">
                              ✓ Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
