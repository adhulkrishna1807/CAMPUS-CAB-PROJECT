'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { AdminReport } from '@/types';
import {
  FileText, TrendingUp, IndianRupee, Bike, Shirt, KeyRound,
  Calendar, RefreshCw, Download, ArrowUpRight, ShieldCheck, CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, CartesianGrid
} from 'recharts';

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadReport = async (selectedPeriod: 'day' | 'week' | 'month') => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdminReports(selectedPeriod);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate operational report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadReport(period);
    }
  }, [user, period]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || (loading && !report)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-campus-600 animate-spin" />
          <p className="text-slate-500 font-medium">Compiling Campus Cab financial & service reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-campus-100 text-campus-800">
              Executive Audits & Financials
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {report?.start_date} to {report?.end_date}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-950 flex items-center gap-2">
            <FileText className="w-8 h-8 text-campus-600" />
            Operational & Revenue Reports
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Reconciled service volume, gross earnings, and escrow deposit audit tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  period === p
                    ? 'bg-campus-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'day' ? 'Daily (24h)' : p === 'week' ? 'Weekly (7d)' : 'Monthly (30d)'}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadReport(period)}
            className="p-2 text-slate-500 hover:text-campus-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export / Print
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {report && (
        <>
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-campus-50 rounded-full blur-2xl -mr-6 -mt-6"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Platform Revenue</span>
                <div className="w-9 h-9 rounded-xl bg-campus-50 text-campus-600 flex items-center justify-center font-bold">
                  ₹
                </div>
              </div>
              <div className="text-3xl font-black text-campus-950">
                ₹{report.total_revenue.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Excludes ₹1,000 security deposits</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Services Executed</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-campus-950">
                {report.total_services}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Across Rides, Laundry & Vehicle Rentals
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Laundry Weight Processed</span>
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Shirt className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-campus-950">
                {report.laundry.total_kg} <span className="text-lg font-medium text-slate-500">kg</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {report.laundry.delivered} of {report.laundry.count} batches delivered
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deposit Escrow & Refunds</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-campus-950">
                ₹{report.rentals.total_refunds.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 text-xs text-amber-700 font-medium">
                Refunded from ₹{report.rentals.total_deposits.toLocaleString('en-IN')} collected
              </div>
            </div>
          </div>

          {/* Revenue Breakdown by Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bike Rides */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-campus-600 rounded-xl">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-campus-950">Bike Pickup & Drop</h3>
                    <p className="text-xs text-slate-500">Campus transit routes</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-campus-800 rounded-lg">
                  {report.rides.count} Bookings
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Completed Rides:</span>
                  <span className="font-bold text-slate-900">{report.rides.completed}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Average Fare / Trip:</span>
                  <span className="font-bold text-slate-900">₹{report.rides.avg_fare}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100 font-semibold">
                  <span className="text-campus-950">Total Ride Revenue:</span>
                  <span className="text-campus-600 font-extrabold text-base">₹{report.rides.revenue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Laundry */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
                    <Shirt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-campus-950">Laundry Services</h3>
                    <p className="text-xs text-slate-500">Wed / Sat batch cycles</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-cyan-100 text-cyan-800 rounded-lg">
                  {report.laundry.count} Orders
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Delivered Packages:</span>
                  <span className="font-bold text-slate-900">{report.laundry.delivered}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Washed Volume:</span>
                  <span className="font-bold text-slate-900">{report.laundry.total_kg} kg</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100 font-semibold">
                  <span className="text-campus-950">Total Laundry Revenue:</span>
                  <span className="text-cyan-700 font-extrabold text-base">₹{report.laundry.revenue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Rentals */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-campus-950">Vehicle Rentals</h3>
                    <p className="text-xs text-slate-500">3, 6, 12 & 24h slots</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded-lg">
                  {report.rentals.count} Rentals
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Returned Fleet:</span>
                  <span className="font-bold text-slate-900">{report.rentals.returned}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Escrow Balance Settled:</span>
                  <span className="font-bold text-slate-900">₹{report.rentals.total_refunds.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100 font-semibold">
                  <span className="text-campus-950">Rental Fees Earned:</span>
                  <span className="text-amber-700 font-extrabold text-base">₹{report.rentals.revenue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-campus-950">Revenue Trend (₹)</h3>
                <p className="text-xs text-slate-500">Platform earnings progression over selected interval</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.daily_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueReportGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1557C0" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1557C0" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`₹${val}`, 'Revenue']}
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#1557C0" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueReportGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Reconciliation Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-campus-950 text-base">Audit Reconciliation Log</h3>
              <span className="text-xs text-slate-500 font-medium">{report.daily_breakdown.length} day points recorded</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6 text-center">Rides Count</th>
                    <th className="py-3 px-6 text-center">Laundry Orders</th>
                    <th className="py-3 px-6 text-center">Vehicle Rentals</th>
                    <th className="py-3 px-6 text-right">Recognized Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {report.daily_breakdown.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {row.date}
                      </td>
                      <td className="py-3.5 px-6 text-center font-medium text-slate-700">
                        {row.rides}
                      </td>
                      <td className="py-3.5 px-6 text-center font-medium text-slate-700">
                        {row.laundry}
                      </td>
                      <td className="py-3.5 px-6 text-center font-medium text-slate-700">
                        {row.rentals}
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-campus-700">
                        ₹{row.revenue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
