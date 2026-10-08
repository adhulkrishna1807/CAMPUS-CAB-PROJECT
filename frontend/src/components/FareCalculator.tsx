'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { FareCalculationResult } from '@/types';
import { Calculator, ArrowRight, AlertCircle, CheckCircle2, User, Users, MapPin } from 'lucide-react';

export const LOCATIONS = [
  "Boys Hostel",
  "Girls Hostel",
  "Gate 1",
  "Gate 2",
  "Science Block",
  "Ponlait",
  "SOM",
  "SJ",
  "Banyan Tree / Al Bayt",
  "Jaya Theatre / Pillaichavady",
  "Any Gate",
  "Pillaichavady",
  "Department / Hostel (Except SJ)",
  "University",
  "Kottakuppam",
  "Kuilapalayam",
  "PIMS",
  "McDonald's",
  "Bus Stand / JIPMER / Railway"
];

interface FareCalculatorProps {
  onSelectRoute?: (from: string, to: string, pax: number) => void;
  showBookButton?: boolean;
}

export const FareCalculator: React.FC<FareCalculatorProps> = ({
  onSelectRoute,
  showBookButton = true,
}) => {
  const [fromLoc, setFromLoc] = useState('Boys Hostel');
  const [toLoc, setToLoc] = useState('Gate 2');
  const [passengers, setPassengers] = useState<1 | 2>(1);
  const [result, setResult] = useState<FareCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const calculate = async () => {
      if (!fromLoc || !toLoc) return;
      setLoading(true);
      try {
        const res = await api.calculateFare(fromLoc, toLoc, passengers);
        if (isMounted) setResult(res);
      } catch (err) {
        if (isMounted) {
          setResult({
            from_location: fromLoc,
            to_location: toLoc,
            passengers,
            fare: 0,
            is_available: false,
            message: 'Fare calculation failed. Please check route.'
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    calculate();
    return () => { isMounted = false; };
  }, [fromLoc, toLoc, passengers]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-campus-200/70 shadow-xl shadow-campus-600/5">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-campus-100 flex items-center justify-center text-campus-600">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-campus-text">Instant Fare Calculator</h3>
          <p className="text-xs text-slate-500">Official Campus Cab fixed fare engine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* From Location */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-campus-600" />
            <span>Pickup Location</span>
          </label>
          <select
            value={fromLoc}
            onChange={(e) => setFromLoc(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
          >
            {LOCATIONS.map((loc) => (
              <option key={`from-${loc}`} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* To Location */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Drop Location</span>
          </label>
          <select
            value={toLoc}
            onChange={(e) => setToLoc(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
          >
            {LOCATIONS.map((loc) => (
              <option key={`to-${loc}`} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Passengers Selector */}
      <div className="mt-4">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Passengers
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPassengers(1)}
            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              passengers === 1
                ? 'bg-campus-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1 Passenger (Single)</span>
          </button>
          <button
            type="button"
            onClick={() => setPassengers(2)}
            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              passengers === 2
                ? 'bg-campus-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2 Passengers (Double)</span>
          </button>
        </div>
      </div>

      {/* Result Display Card */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        {loading ? (
          <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-center text-xs text-slate-500">
            <span className="w-4 h-4 border-2 border-campus-600/30 border-t-campus-600 rounded-full animate-spin mr-2" />
            Fetching exact fare...
          </div>
        ) : result?.is_available ? (
          <div className="p-4 rounded-2xl bg-campus-50 border border-campus-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-campus-800 uppercase tracking-wide">
                  Verified Route Fare
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {result.from_location} → {result.to_location} ({passengers} {passengers > 1 ? 'Passengers' : 'Passenger'})
              </p>
            </div>

            <div className="flex items-baseline space-x-1 sm:text-right">
              <span className="text-3xl font-black text-campus-800">₹{result.fare}</span>
              <span className="text-xs text-slate-500 font-medium">fixed</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-left">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-amber-900">Fare for this route is currently unavailable.</h5>
              <p className="text-xs text-amber-700 mt-0.5">
                Please select a supported Campus Cab route from the fare chart or contact campus admin.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Book This Ride CTA */}
      {showBookButton && result?.is_available && (
        <div className="mt-4">
          <Link
            href={`/user/book-ride?from=${encodeURIComponent(fromLoc)}&to=${encodeURIComponent(toLoc)}&pax=${passengers}`}
            className="w-full py-3 px-4 bg-campus-600 hover:bg-campus-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-150"
          >
            <span>Book This Ride for ₹{result.fare}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};
