'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import {
  HelpCircle, X, Sparkles, Bike, Shirt, KeyRound,
  CheckCircle2, ArrowRight, ShieldCheck, RefreshCw, UserCheck
} from 'lucide-react';

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({ isOpen, onClose }) => {
  const { demoLogin, addToast, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'flow1' | 'flow2' | 'flow3' | 'rules'>('flow1');
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await api.resetDemo();
      addToast('Demo database successfully reset to clean presentation state!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to reset demo data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handlePrepare = async (type: 'ride' | 'rental' | 'laundry') => {
    try {
      if (type === 'ride') {
        const res = await api.prepareDemoRide();
        addToast(`Pending ride created: ${res.booking_id} (Fare: ₹30)`, 'success');
      } else if (type === 'rental') {
        const res = await api.prepareDemoRental();
        addToast(`Pending rental created: ${res.booking_id} (Scooty 6h)`, 'success');
      } else {
        const res = await api.prepareDemoLaundry();
        addToast(`Pending laundry created: ${res.booking_id} (2kg, ₹155)`, 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Preparation failed', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-campus-100 flex items-center justify-center text-campus-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-campus-text">Campus Cab — Live Demo Guide</h3>
              <p className="text-xs text-slate-500">Interactive walkthrough for presentation & judging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Role Switcher Bar */}
        <div className="my-4 p-3 rounded-xl bg-campus-50 border border-campus-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-campus-800">1-Click Role Switch:</span>
            <button
              onClick={() => demoLogin('USER')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                role === 'USER' ? 'bg-campus-600 text-white shadow-sm' : 'bg-white text-campus-700 hover:bg-campus-100 border border-campus-200'
              }`}
            >
              🎓 Student
            </button>
            <button
              onClick={() => demoLogin('RIDER')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                role === 'RIDER' ? 'bg-campus-600 text-white shadow-sm' : 'bg-white text-campus-700 hover:bg-campus-100 border border-campus-200'
              }`}
            >
              🏍️ Rider
            </button>
            <button
              onClick={() => demoLogin('ADMIN')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                role === 'ADMIN' ? 'bg-campus-600 text-white shadow-sm' : 'bg-white text-campus-700 hover:bg-campus-100 border border-campus-200'
              }`}
            >
              🛡️ Admin
            </button>
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo DB</span>
          </button>
        </div>

        {/* Scenario Tabs */}
        <div className="flex space-x-1 border-b border-slate-200 text-xs font-semibold pb-1">
          <button
            onClick={() => setActiveTab('flow1')}
            className={`px-3 py-2 rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'flow1'
                ? 'border-b-2 border-campus-600 text-campus-600 bg-campus-50/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Flow 1: Ride Matching</span>
          </button>
          <button
            onClick={() => setActiveTab('flow2')}
            className={`px-3 py-2 rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'flow2'
                ? 'border-b-2 border-campus-600 text-campus-600 bg-campus-50/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span>Flow 2: Laundry Order</span>
          </button>
          <button
            onClick={() => setActiveTab('flow3')}
            className={`px-3 py-2 rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'flow3'
                ? 'border-b-2 border-campus-600 text-campus-600 bg-campus-50/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Flow 3: Rental & Refund</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-2 rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-b-2 border-campus-600 text-campus-600 bg-campus-50/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Security & Business Rules</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 text-sm text-slate-700 space-y-4">
          {activeTab === 'flow1' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-800">Scenario: Student Books Ride → Rider Accepts</span>
                <button
                  onClick={() => handlePrepare('ride')}
                  className="px-2.5 py-1 text-xs font-semibold text-campus-700 bg-white hover:bg-campus-50 border border-campus-200 rounded-lg"
                >
                  Prepare Fresh Pending Ride
                </button>
              </div>

              <ol className="space-y-3 list-decimal list-inside text-xs leading-relaxed">
                <li className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="font-bold text-campus-800">Step 1: Switch to Student Demo</span>
                  <p className="text-slate-600 mt-1">
                    Go to <strong>Book a Ride</strong>. Choose <em>Boys Hostel → Gate 2</em> (1 passenger). Fare automatically calculates as <strong>₹30</strong>. Submit the request.
                  </p>
                </li>
                <li className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="font-bold text-campus-800">Step 2: Switch to Rider Demo (Vishnu)</span>
                  <p className="text-slate-600 mt-1">
                    Open <strong>Pending Requests</strong>. The booking appears instantly with pickup, drop, fare, and customer details. Click <strong>Accept Ride</strong>.
                  </p>
                </li>
                <li className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="font-bold text-campus-800">Step 3: Switch back to Student Demo</span>
                  <p className="text-slate-600 mt-1">
                    Open <strong>Notifications</strong> or <strong>My Bookings</strong>. Notice status changed to <em>ACCEPTED</em>, showing Vishnu&apos;s name, phone, and vehicle (Bike TN-DEMO-01) with a direct &quot;Call Rider&quot; option!
                  </p>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'flow2' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-800">Scenario: Student Books Laundry → Admin Progresses Pipeline</span>
                <button
                  onClick={() => handlePrepare('laundry')}
                  className="px-2.5 py-1 text-xs font-semibold text-campus-700 bg-white hover:bg-campus-50 border border-campus-200 rounded-lg"
                >
                  Prepare Fresh Pending Laundry
                </button>
              </div>

              <ol className="space-y-3 list-decimal list-inside text-xs leading-relaxed">
                <li className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="font-bold text-campus-800">Step 1: Student Books Laundry</span>
                  <p className="text-slate-600 mt-1">
                    Weight: 2 kg. Calculation: <em>2 × ₹65 = ₹130 + ₹25 extra = ₹155 total</em>. Note that pickup day only allows <strong>Wednesday</strong> or <strong>Saturday</strong>.
                  </p>
                </li>
                <li className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="font-bold text-campus-800">Step 2: Switch to Admin Demo</span>
                  <p className="text-slate-600 mt-1">
                    Navigate to <strong>Laundry</strong> page. Click status update sequence: <em>Pickup Scheduled → Collected → Processing → Ready → Delivered → Completed</em>.
                  </p>
                </li>
                <li className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="font-bold text-campus-800">Step 3: Student Live Notification</span>
                  <p className="text-slate-600 mt-1">
                    Every admin update triggers a real notification to the student with clear progress.
                  </p>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'flow3' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-800">Scenario: Scooty Rental → Rider Accept → Return & Deposit Refund</span>
                <button
                  onClick={() => handlePrepare('rental')}
                  className="px-2.5 py-1 text-xs font-semibold text-campus-700 bg-white hover:bg-campus-50 border border-campus-200 rounded-lg"
                >
                  Prepare Fresh Pending Rental
                </button>
              </div>

              <ol className="space-y-3 list-decimal list-inside text-xs leading-relaxed">
                <li className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="font-bold text-campus-800">Step 1: Student Rents Scooty</span>
                  <p className="text-slate-600 mt-1">
                    Duration: <strong>6 Hours (₹270)</strong>. Security deposit: <strong>₹1000</strong>. Note: Upfront payable includes refundable deposit.
                  </p>
                </li>
                <li className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="font-bold text-campus-800">Step 2: Rider Accepts Rental</span>
                  <p className="text-slate-600 mt-1">
                    Rider opens <strong>Rental Requests</strong> and accepts.
                  </p>
                </li>
                <li className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="font-bold text-campus-800">Step 3: Return & Refund Calculation</span>
                  <p className="text-slate-600 mt-1">
                    Admin or Rider marks <strong>Returned</strong>. System automatically computes: <em>Deposit ₹1000 - Charge ₹270 = Refundable Balance ₹730</em>!
                  </p>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                <h4 className="font-bold text-campus-800">🛡️ Concurrency & Double Accept Protection</h4>
                <p className="text-slate-600 mt-1">
                  Database transaction with row-level safety ensures if two riders click Accept simultaneously, only one succeeds; the second receives an HTTP 409 Conflict.
                </p>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                <h4 className="font-bold text-campus-800">🔒 Strict Role-Based Access</h4>
                <p className="text-slate-600 mt-1">
                  Students cannot navigate to <code>/admin/*</code> or <code>/rider/*</code>. Doing so returns 403 Forbidden and cleanly redirects them.
                </p>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                <h4 className="font-bold text-campus-800">💰 Clean Accounting & Revenue Logic</h4>
                <p className="text-slate-600 mt-1">
                  Security deposits and deposit refunds are strictly excluded from company revenue. Only actual rental charges, ride fares, and laundry fees count toward platform revenue.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Campus Cab 2026 • Real Startup Architecture</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-campus-700 bg-campus-50 hover:bg-campus-100 rounded-xl transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
