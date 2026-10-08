'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import {
  Bike, GraduationCap, Shield, ArrowRight, Lock, Mail,
  Eye, EyeOff, MapPin
} from 'lucide-react';

export default function LoginPage() {
  const { login, register, demoLogin } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regHostel, setRegHostel] = useState('');
  const [regRoom, setRegRoom] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsRegisterMode(false);
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
    } catch {
      // toast shown by auth context
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        confirm_password: regConfirmPassword,
        hostel: regHostel,
        room_number: regRoom,
      });
    } catch {
      // toast shown by auth context
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setSubmitting(true);
    try {
      await demoLogin(role);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const roleConfig = {
    USER: {
      icon: GraduationCap,
      label: 'Student',
      desc: 'Book rides, laundry and rentals',
    },
    RIDER: {
      icon: Bike,
      label: 'Rider',
      desc: 'Accept ride and rental requests',
    },
    ADMIN: {
      icon: Shield,
      label: 'Admin',
      desc: 'Manage platform and analytics',
    },
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF] flex">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-b from-[#073B8F] via-[#1557C0] to-[#062B68] flex-col justify-between p-12">
        <div>
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center relative">
              <Bike className="w-7 h-7 text-white stroke-[2.2]" />
              <MapPin className="w-3.5 h-3.5 text-blue-200 absolute -top-0.5 -right-0.5 fill-blue-200" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">CAMPUS CAB</h1>
              <p className="text-[11px] font-semibold text-blue-200 tracking-widest uppercase">Ride • Connect • Campus</p>
            </div>
          </Link>

          <div className="mt-16 space-y-6">
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Your campus.<br />One platform.
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
              Bike pickups, scheduled laundry, and vehicle rentals — all managed from a single dashboard built for college life.
            </p>
          </div>

          {/* Feature list */}
          <div className="mt-12 space-y-4">
            {[
              'Transparent fixed fares — no surprises',
              'Laundry pickup every Wednesday & Saturday',
              'Bike & Scooty rentals from 3 to 24 hours',
              'Live ride tracking with rider contact',
            ].map((item) => (
              <div key={item} className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <span className="text-xs text-blue-100 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-blue-300 mt-8">© {new Date().getFullYear()} Campus Cab. All rights reserved.</p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex items-center space-x-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#1557C0] flex items-center justify-center shadow-md">
              <Bike className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-[#062B68] tracking-tight">CAMPUS CAB</h1>
              <p className="text-[11px] font-semibold text-[#1557C0]">Ride • Connect • Campus</p>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to your Campus Cab account</p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-3 gap-2 mb-6 p-1 bg-white rounded-2xl border border-slate-200 shadow-xs">
            {(Object.keys(roleConfig) as UserRole[]).map((role) => {
              const { icon: Icon, label } = roleConfig[role];
              const active = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-150 ${
                    active
                      ? 'bg-[#1557C0] text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1 stroke-[2.2]" />
                  <span className="text-[11px] font-bold">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-7">
            {/* Form heading */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-extrabold text-[#102A43]">
                  {isRegisterMode ? 'Create Account' : `Sign in as ${roleConfig[selectedRole].label}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{roleConfig[selectedRole].desc}</p>
              </div>
            </div>

            {!isRegisterMode ? (
              /* ─── Login Form ─── */
              <form onSubmit={handleLoginSubmit} className="space-y-4" aria-label={`Sign in as ${roleConfig[selectedRole].label}`} noValidate>
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="your@email.com"
                      aria-required="true"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1557C0] focus:ring-1 focus:ring-[#1557C0]/20 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="text-xs font-semibold text-slate-600">Password</label>
                    <button
                      type="button"
                      onClick={() => alert('Please contact Campus Cab support to reset your password.')}
                      className="text-xs text-[#1557C0] hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      aria-required="true"
                      className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1557C0] focus:ring-1 focus:ring-[#1557C0]/20 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                  className="w-full mt-1 py-3.5 rounded-xl bg-[#1557C0] hover:bg-[#073B8F] text-white font-bold text-sm shadow-md shadow-[#1557C0]/25 hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Sign In</span>
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>

                {selectedRole === 'USER' && (
                  <p className="text-center text-xs text-slate-500 pt-1">
                    New to Campus Cab?{' '}
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(true)}
                      className="font-bold text-[#1557C0] hover:underline"
                    >
                      Create a student account
                    </button>
                  </p>
                )}

                {selectedRole !== 'USER' && (
                  <p className="text-center text-[11px] text-slate-400 pt-1">
                    Rider and Admin accounts are created by the Campus Cab operations team.
                  </p>
                )}
              </form>
            ) : (
              /* ─── Register Form ─── */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Rahul Menon"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#1557C0] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="student@college.edu"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#1557C0] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#1557C0] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Hostel <span className="font-normal text-slate-400">(optional)</span></label>
                    <input
                      type="text"
                      value={regHostel}
                      onChange={(e) => setRegHostel(e.target.value)}
                      placeholder="Boys Hostel"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#1557C0] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Room No. <span className="font-normal text-slate-400">(optional)</span></label>
                    <input
                      type="text"
                      value={regRoom}
                      onChange={(e) => setRegRoom(e.target.value)}
                      placeholder="B-204"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#1557C0] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#1557C0] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#1557C0] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3.5 rounded-xl bg-[#1557C0] hover:bg-[#073B8F] text-white font-bold text-sm shadow-md shadow-[#1557C0]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Create Account</span>
                </button>

                <p className="text-center text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(false)}
                    className="font-bold text-[#1557C0] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* Try Demo Section — styled professionally, not "competition-ready" */}
          <div className="mt-5 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 mb-3 text-center">Try Campus Cab with a demo account</p>
            <div className="grid grid-cols-3 gap-2">
              {(['USER', 'RIDER', 'ADMIN'] as UserRole[]).map((r) => {
                const { icon: Icon, label } = roleConfig[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleQuickDemo(r)}
                    disabled={submitting}
                    className="flex flex-col items-center py-2.5 px-2 rounded-xl border border-slate-200 hover:border-[#1557C0] hover:bg-[#EAF4FF] text-slate-600 hover:text-[#1557C0] transition-all text-center group"
                  >
                    <Icon className="w-4 h-4 mb-1 stroke-[2.2]" />
                    <span className="text-[11px] font-bold">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-5">
            <Link href="/" className="hover:text-[#1557C0] transition-colors">← Back to Campus Cab</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
