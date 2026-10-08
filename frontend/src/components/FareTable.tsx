'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { FareRoute } from '@/types';
import { Search, Filter, ArrowRight, Bike } from 'lucide-react';
import { LOCATIONS } from './FareCalculator';

interface FareTableProps {
  onSelectRoute?: (route: FareRoute) => void;
  isAdmin?: boolean;
}

export const FareTable: React.FC<FareTableProps> = ({ onSelectRoute, isAdmin = false }) => {
  const [routes, setRoutes] = useState<FareRoute[]>([]);
  const [search, setSearch] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFares()
      .then((data) => setRoutes(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredRoutes = routes.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch =
      r.from_location.toLowerCase().includes(s) ||
      r.to_location.toLowerCase().includes(s);
    const matchFrom = !filterFrom || r.from_location === filterFrom;
    const matchTo = !filterTo || r.to_location === filterTo;
    return matchSearch && matchFrom && matchTo;
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md shadow-campus-600/5">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search routes (e.g., Boys Hostel, University, Gate 2)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-campus-600 transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="">From: All Origins</option>
            {LOCATIONS.map((loc) => (
              <option key={`f-from-${loc}`} value={loc}>{loc}</option>
            ))}
          </select>

          <select
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="">To: All Destinations</option>
            {LOCATIONS.map((loc) => (
              <option key={`f-to-${loc}`} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-campus-50/70 border-b border-slate-200 text-campus-800 text-xs font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">From (Pickup)</th>
              <th className="py-3.5 px-4 sm:px-6">To (Drop)</th>
              <th className="py-3.5 px-4 sm:px-6 text-center">Single Passenger</th>
              <th className="py-3.5 px-4 sm:px-6 text-center">Double Passengers</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-slate-500">
                  <span className="w-5 h-5 border-2 border-campus-600/30 border-t-campus-600 rounded-full animate-spin inline-block mr-2" />
                  Loading official campus routes...
                </td>
              </tr>
            ) : filteredRoutes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-slate-500">
                  No routes matching the search criteria.
                </td>
              </tr>
            ) : (
              filteredRoutes.map((route) => (
                <tr
                  key={route.id}
                  className="hover:bg-campus-50/40 transition-colors group"
                >
                  <td className="py-3 px-4 sm:px-6 font-semibold text-slate-900">
                    {route.from_location}
                  </td>
                  <td className="py-3 px-4 sm:px-6 font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-campus-400">→</span>
                      <span>{route.to_location}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 sm:px-6 text-center font-bold text-campus-700 bg-slate-50/40">
                    ₹{route.single_fare}
                  </td>
                  <td className="py-3 px-4 sm:px-6 text-center font-bold text-campus-800">
                    ₹{route.double_fare}
                  </td>
                  <td className="py-3 px-4 sm:px-6 text-right">
                    <Link
                      href={`/user/book-ride?from=${encodeURIComponent(route.from_location)}&to=${encodeURIComponent(route.to_location)}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-campus-600 hover:text-campus-800 hover:underline"
                    >
                      <span>Book</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing {filteredRoutes.length} of {routes.length} verified routes</span>
        <span className="italic font-medium">Source: Campus Cab Standard Operations Chart</span>
      </div>
    </div>
  );
};
