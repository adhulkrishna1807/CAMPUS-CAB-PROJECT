'use client';

import React from 'react';
import Link from 'next/link';
import { FareCalculator } from '@/components/FareCalculator';
import {
  Bike, Shirt, KeyRound, MapPin, CheckCircle2, ArrowRight,
  Clock, ChevronRight, Shield, PhoneCall
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#073B8F] via-[#1557C0] to-[#1976D2] text-white pt-16 pb-24 sm:pt-20 sm:pb-32">
        {/* Subtle bg circles */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/5 -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 -ml-24 -mb-24 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left */}
            <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-semibold text-white/90 tracking-wide border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Campus Cab is live and accepting bookings</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                Your Campus.<br />
                Your Ride.
                <br />
                <span className="text-blue-200">Your Campus Cab.</span>
              </h1>

              <p className="text-base sm:text-lg text-blue-100 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Bike rides, laundry pickup, and vehicle rentals — all managed from one campus platform with transparent fares and verified riders.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-[#1557C0] font-bold text-sm hover:bg-blue-50 shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Book a Service</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/fare-chart"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/25 transition-all flex items-center justify-center gap-2"
                >
                  View Fare Chart
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 pt-2 text-blue-100">
                {['Transparent fixed fares', 'Verified campus riders', 'Wed & Sat laundry'].map((f) => (
                  <div key={f} className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Fare Calculator card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl shadow-2xl shadow-[#062B68]/30 overflow-hidden">
                <div className="bg-[#EAF4FF] px-5 py-4 border-b border-blue-100">
                  <p className="text-xs font-bold text-[#1557C0] uppercase tracking-wider">Quick Fare Calculator</p>
                  <p className="text-[11px] text-[#486581] mt-0.5">Get an instant fare estimate</p>
                </div>
                <div className="p-1">
                  <FareCalculator showBookButton={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-20 bg-[#F5F9FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1557C0] bg-[#EAF4FF] px-3 py-1 rounded-full border border-[#D2E6FF]">
              Our Services
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight mt-3">
              Everything you need, in one place
            </h2>
            <p className="text-sm text-[#486581] mt-2 leading-relaxed">
              From your hostel door to anywhere on campus — we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-3xl border border-[#D2E6FF] p-6 hover:shadow-lg hover:border-[#1557C0]/40 transition-all duration-200 flex flex-col group">
              <div className="w-12 h-12 rounded-2xl bg-[#1557C0] text-white flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform">
                <Bike className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-bold text-[#102A43] mb-2">Bike Pickup & Drop</h3>
              <p className="text-xs text-[#486581] leading-relaxed mb-4 flex-1">
                Request a campus ride with transparent fares and easy rider matching across hostels, gates, and city hubs.
              </p>
              <div className="p-3 rounded-xl bg-[#F5F9FF] border border-[#EAF4FF] mb-4 text-[11px] space-y-1">
                <div className="flex justify-between text-[#486581]">
                  <span>Hostel → Gate 2:</span>
                  <strong className="text-[#1557C0]">₹30 / ₹40</strong>
                </div>
                <div className="flex justify-between text-[#486581]">
                  <span>University → JIPMER:</span>
                  <strong className="text-[#1557C0]">₹170</strong>
                </div>
              </div>
              <Link href="/login" className="w-full py-2.5 px-4 rounded-xl bg-[#1557C0] hover:bg-[#073B8F] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                Book a Ride <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl border border-[#D2E6FF] p-6 hover:shadow-lg hover:border-[#1557C0]/40 transition-all duration-200 flex flex-col group">
              <div className="w-12 h-12 rounded-2xl bg-[#1976D2] text-white flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform">
                <Shirt className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-bold text-[#102A43] mb-2">Campus Laundry</h3>
              <p className="text-xs text-[#486581] leading-relaxed mb-4 flex-1">
                Schedule your laundry pickup on Wednesday or Saturday. Clean, dried, packed, and delivered to your room.
              </p>
              <div className="p-3 rounded-xl bg-[#F5F9FF] border border-[#EAF4FF] mb-4 text-[11px] space-y-1">
                <div className="flex justify-between text-[#486581]">
                  <span>Rate per kg:</span>
                  <strong className="text-[#1557C0]">₹65 / kg</strong>
                </div>
                <div className="flex justify-between text-[#486581]">
                  <span>Service charge:</span>
                  <strong className="text-[#1557C0]">₹25</strong>
                </div>
              </div>
              <Link href="/login" className="w-full py-2.5 px-4 rounded-xl bg-[#1557C0] hover:bg-[#073B8F] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                Book Laundry <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-3xl border border-[#D2E6FF] p-6 hover:shadow-lg hover:border-[#1557C0]/40 transition-all duration-200 flex flex-col group">
              <div className="w-12 h-12 rounded-2xl bg-[#073B8F] text-white flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform">
                <KeyRound className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-bold text-[#102A43] mb-2">Bike Rental</h3>
              <p className="text-xs text-[#486581] leading-relaxed mb-4 flex-1">
                Rent a bike for 3, 6, 12, or 24 hours. Campus freedom with transparent security deposit refunding.
              </p>
              <div className="p-3 rounded-xl bg-[#F5F9FF] border border-[#EAF4FF] mb-4 text-[11px] space-y-1">
                <div className="flex justify-between text-[#486581]">
                  <span>3 hr / 6 hr:</span>
                  <strong className="text-[#1557C0]">₹200 / ₹270</strong>
                </div>
                <div className="flex justify-between text-[#486581]">
                  <span>12 hr / 24 hr:</span>
                  <strong className="text-[#1557C0]">₹340 / ₹420</strong>
                </div>
              </div>
              <Link href="/login?type=Bike" className="w-full py-2.5 px-4 rounded-xl bg-[#1557C0] hover:bg-[#073B8F] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                Rent a Bike <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-3xl border border-[#D2E6FF] p-6 hover:shadow-lg hover:border-[#1557C0]/40 transition-all duration-200 flex flex-col group">
              <div className="w-12 h-12 rounded-2xl bg-[#062B68] text-white flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform">
                <Bike className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-bold text-[#102A43] mb-2">Scooty Rental</h3>
              <p className="text-xs text-[#486581] leading-relaxed mb-4 flex-1">
                Flexible scooty rentals for campus and nearby travel. Easy handling with transparent refundable deposit.
              </p>
              <div className="p-3 rounded-xl bg-[#F5F9FF] border border-[#EAF4FF] mb-4 text-[11px] space-y-1">
                <div className="flex justify-between text-[#486581]">
                  <span>Security Deposit:</span>
                  <strong className="text-emerald-700">₹1000 (Refundable)</strong>
                </div>
                <div className="flex justify-between text-[#486581]">
                  <span>6-hr return refund:</span>
                  <strong className="text-[#1557C0]">₹730 back</strong>
                </div>
              </div>
              <Link href="/login?type=Scooty" className="w-full py-2.5 px-4 rounded-xl bg-[#1557C0] hover:bg-[#073B8F] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                Rent a Scooty <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CAMPUS CAB ── */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1557C0] bg-[#EAF4FF] px-3 py-1 rounded-full border border-[#D2E6FF]">
              Why Campus Cab
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight mt-3">
              No more messy WhatsApp groups
            </h2>
            <p className="text-sm text-[#486581] mt-2">
              One centralized platform replacing scattered messages with structured, trackable services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                emoji: '💰',
                title: 'Transparent Pricing',
                desc: 'Exact fixed fares from the official Campus Cab fare chart. No haggling or surprise markups.',
              },
              {
                emoji: '🏍️',
                title: 'Verified Riders',
                desc: 'Registered student riders with documented vehicle numbers and direct contact on acceptance.',
              },
              {
                emoji: '📍',
                title: 'Live Status Tracking',
                desc: 'Track every step: Requested → Accepted → On the Way → Completed, with notifications.',
              },
              {
                emoji: '⚡',
                title: 'Instant Booking',
                desc: 'Submit a request in under a minute. Unique booking ID generated on every service.',
              },
              {
                emoji: '🎓',
                title: 'Campus-Focused',
                desc: 'Routes, pickup points, and schedules built specifically for hostel and campus life.',
              },
              {
                emoji: '🛡️',
                title: 'Admin Oversight',
                desc: 'Dedicated admin center managing laundry batches, rental returns, and analytics.',
              },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="p-6 bg-[#F5F9FF] rounded-3xl border border-[#EAF4FF] hover:border-[#D2E6FF] hover:shadow-sm transition-all">
                <div className="text-2xl mb-3">{emoji}</div>
                <h4 className="text-sm font-bold text-[#102A43] mb-1.5">{title}</h4>
                <p className="text-xs text-[#486581] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 bg-[#F5F9FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1557C0] bg-[#EAF4FF] px-3 py-1 rounded-full border border-[#D2E6FF]">
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight mt-3">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Choose a Service', desc: 'Select from Bike Pickup & Drop, Campus Laundry, or Bike/Scooty Rental. Fares are calculated upfront.' },
              { step: '02', title: 'Submit Your Request', desc: 'Pick your pickup location, preferred time, and number of passengers or rental duration.' },
              { step: '03', title: 'Track & Confirm', desc: 'A verified rider accepts your request. Get instant notification with rider contact and vehicle info.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative p-8 bg-white rounded-3xl border border-[#D2E6FF] hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#1557C0] text-white font-black text-lg flex items-center justify-center mb-5 shadow-md">
                  {step}
                </div>
                <h3 className="text-base font-bold text-[#102A43] mb-2">{title}</h3>
                <p className="text-xs text-[#486581] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-gradient-to-r from-[#062B68] via-[#073B8F] to-[#1557C0] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to get moving?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
            Join hundreds of students already using Campus Cab for rides, laundry, and vehicle rentals on campus.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl bg-white text-[#1557C0] font-bold text-sm shadow-lg hover:bg-blue-50 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/fare-chart"
              className="px-8 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm border border-white/30 transition-colors"
            >
              View Fare Chart
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
