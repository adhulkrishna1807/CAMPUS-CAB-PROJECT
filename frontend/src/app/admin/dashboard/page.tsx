'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { AdminAnalytics } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  Shield, Bike, Shirt, KeyRound, Users, DollarSign,
  TrendingUp, RefreshCw, Plus, Clock, CheckCircle2,
  AlertTriangle, Sparkles, FileText, ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, role, isLoading, addToast } = useAuth();

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);

  // Strict role check (Requirement 9 & 136)
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (role !== 'ADMIN') {
        if (role === 'USER') router.push('/user/dashboard');
        else if (role === 'RIDER') router.push('/rider/dashboard');
      }
    }
  }, [user, role, isLoading, router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminAnalytics();
      setAnalytics(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && role === 'ADMIN') {
      fetchAnalytics();
    }
  }, [user, role]);

  const handleResetDemo = async () => {
    if (!confirm('Reset all demo bookings, rides, laundry, and rentals to fresh pristine state?')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetDemo();
      addToast('Demo database successfully reset to clean state!', 'success');
      await fetchAnalytics();
    } catch (err: any) {
      addToast(err.message || 'Reset failed', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading || !user || role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="w-8 h-8 border-3 border-campus-600/30 border-t-campus-600 rounded-full animate-spin" />
      </div>
    );
  }

  const COLORS = ['#1557C0', '#1976D2', '#4D96FF', '#073B8F'];

  return (
    <div className="flex bg-slate-50/60 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Presentation Mode Top Flag - Requirement 108 */}
        {presentationMode && (
          <div className="p-3 bg-gradient-to-r from-campus-900 via-campus-800 to-campus-900 text-white rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>CAMPUS CAB LIVE DEMO — COMPETITION PRESENTATION MODE ACTIVE</span>
            </div>
            <button
              onClick={() => setPresentationMode(false)}
              className="text-[11px] underline text-campus-200 hover:text-white"
            >
              Exit presentation mode
            </button>
          </div>
        )}

        {/* Operations Center Header - Requirement 37 */}
        <div className="bg-gradient-to-r from-campus-800 to-campus-700 text-white rounded-3xl p-6 sm:p-8 shadow-md shadow-campus-800/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-campus-200 bg-campus-900/40 px-3 py-1 rounded-full">
                Campus Cab Operations Center
              </span>
              <span className="text-xs font-bold text-emerald-300">● Systems Online</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">
              Good Morning, {user.name} 🛡️
            </h1>
            <p className="text-xs sm:text-sm text-campus-100 mt-1">
              Centralized monitoring for mobility rides, laundry logistics, vehicle fleet, and revenue.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPresentationMode(!presentationMode)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors"
            >
              {presentationMode ? 'Standard View' : 'Presentation Mode'}
            </button>

            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        {/* OPERATIONS KPIS - Requirements 37 & 95 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Total Rides</span>
            <p className="text-xl font-black text-campus-text mt-0.5">{analytics?.total_rides || 0}</p>
            <span className="text-[10px] text-campus-600 font-medium">All recorded</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Pending Rides</span>
            <p className="text-xl font-black text-amber-700 mt-0.5">{analytics?.pending_rides || 0}</p>
            <span className="text-[10px] text-amber-600 font-medium">Needs rider</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Completed Rides</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{analytics?.completed_rides || 0}</p>
            <span className="text-[10px] text-emerald-600 font-medium">Successful</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Active Riders</span>
            <p className="text-xl font-black text-campus-800 mt-0.5">{analytics?.active_riders || 0}</p>
            <span className="text-[10px] text-slate-400 font-medium">On duty fleet</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Rental Requests</span>
            <p className="text-xl font-black text-campus-text mt-0.5">{analytics?.rental_requests || 0}</p>
            <span className="text-[10px] text-slate-400 font-medium">Bike/Scooty</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Laundry Orders</span>
            <p className="text-xl font-black text-campus-text mt-0.5">{analytics?.laundry_orders || 0}</p>
            <span className="text-[10px] text-slate-400 font-medium">Wed & Sat</span>
          </div>

          {/* Revenue logic - Requirement 94 (Deposits strictly excluded!) */}
          <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
            <span className="text-[11px] font-semibold text-emerald-800">Total Revenue</span>
            <p className="text-xl font-black text-emerald-800 mt-0.5">₹{analytics?.total_revenue || 0}</p>
            <span className="text-[10px] text-emerald-600 font-medium">Excl. deposits</span>
          </div>
        </div>

        {/* QUICK OPERATIONAL ACTIONS - Requirement 90 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            href="/admin/rides"
            className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-campus-400 text-xs font-bold text-campus-800 hover:bg-campus-50 transition-colors flex items-center justify-between"
          >
            <span>Manage Rides</span>
            <ArrowRight className="w-3.5 h-3.5 text-campus-600" />
          </Link>
          <Link
            href="/admin/laundry"
            className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-campus-400 text-xs font-bold text-campus-800 hover:bg-campus-50 transition-colors flex items-center justify-between"
          >
            <span>Manage Laundry</span>
            <ArrowRight className="w-3.5 h-3.5 text-campus-600" />
          </Link>
          <Link
            href="/admin/rentals"
            className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-campus-400 text-xs font-bold text-campus-800 hover:bg-campus-50 transition-colors flex items-center justify-between"
          >
            <span>Manage Rentals</span>
            <ArrowRight className="w-3.5 h-3.5 text-campus-600" />
          </Link>
          <Link
            href="/admin/riders"
            className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-campus-400 text-xs font-bold text-campus-800 hover:bg-campus-50 transition-colors flex items-center justify-between"
          >
            <span>Rider Fleet</span>
            <ArrowRight className="w-3.5 h-3.5 text-campus-600" />
          </Link>
          <Link
            href="/admin/fares"
            className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-campus-400 text-xs font-bold text-campus-800 hover:bg-campus-50 transition-colors flex items-center justify-between"
          >
            <span>Fare Chart Editor</span>
            <ArrowRight className="w-3.5 h-3.5 text-campus-600" />
          </Link>
        </div>

        {/* ANALYTICS CHARTS - Requirement 38 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Rides & Services Volume */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-campus-text">Daily Service Activity (Past 7 Days)</h3>
                <p className="text-xs text-slate-500">Volume distribution of completed & active campus requests</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-campus-50 text-campus-700">
                Live Data
              </span>
            </div>

            <div className="h-64 w-full">
              {analytics?.rides_by_day && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.rides_by_day}>
                    <defs>
                      <linearGradient id="colorRides" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1557C0" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#1557C0" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="rides"
                      name="Rides"
                      stroke="#1557C0"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRides)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Service Revenue Distribution */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-campus-text">Revenue by Service</h3>
              <p className="text-xs text-slate-500">Excludes refundable security balances</p>
            </div>

            <div className="space-y-3 pt-2">
              {analytics?.revenue_by_service.map((item, idx) => (
                <div key={item.service} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">{item.service}</span>
                    <strong className="text-campus-800">₹{item.revenue}</strong>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-campus-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (item.revenue / (analytics.total_revenue || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Platform Operating Total:</span>
              <span className="text-base font-black text-campus-800">₹{analytics?.total_revenue || 0}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
