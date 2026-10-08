'use client';

import React from 'react';
import Link from 'next/link';
import { FareTable } from '@/components/FareTable';
import { FareCalculator } from '@/components/FareCalculator';
import { Bike, MapPin, ArrowRight, ShieldCheck, FileSpreadsheet } from 'lucide-react';

export default function FareChartPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-campus-100 text-campus-700 text-xs font-bold">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Official Campus Mobility Tariff</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-campus-800 tracking-tight">
            Campus Cab Fare Chart
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            All routes are pre-calculated with fixed campus tariffs. Single passenger trips use the single fare, and two passengers use the double fare. No peak pricing, no hidden surcharges.
          </p>
        </div>

        {/* Dual Layout: Calculator & Quick Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <FareTable />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <FareCalculator showBookButton={true} />

            {/* Fare Guidelines Card */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-campus-text flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-campus-600" />
                <span>Fare Chart Rules & Policy</span>
              </h3>

              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-campus-600 mt-1.5 shrink-0" />
                  <span><strong>1 Passenger:</strong> Uses standard single fare (e.g., Boys Hostel to Gate 2 is ₹30).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-campus-600 mt-1.5 shrink-0" />
                  <span><strong>2 Passengers:</strong> Uses standard double fare (e.g., Boys Hostel to Gate 2 is ₹40).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-campus-600 mt-1.5 shrink-0" />
                  <span><strong>University Transit:</strong> Express routes to McDonald&apos;s (₹60/₹80), PIMS (₹80/₹100), and JIPMER / Railway Station (₹170/₹230).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-campus-600 mt-1.5 shrink-0" />
                  <span><strong>Unlisted Routes:</strong> If a custom route is not on the chart, the system strictly disallows arbitrary pricing to protect students.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
