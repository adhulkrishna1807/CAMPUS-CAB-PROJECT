'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { Users, Search, RefreshCw, Shield, Calendar, Phone, Mail } from 'lucide-react';

export default function AdminUsersPage() {
  const { user, role } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAdminUsers(search);
      setUsersList(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (user && role === 'ADMIN') {
      fetchUsers();
    }
  }, [user, role, fetchUsers]);

  return (
    <div className="flex bg-slate-50/60 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-campus-100 text-campus-700 text-xs font-bold mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Campus Community</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-campus-800">
              User Directory & Accounts
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Registered students, riders, and platform administrators with activity metrics.
            </p>
          </div>

          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-campus-600" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, or phone number..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-campus-600 transition-colors"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-campus-50/70 border-b border-slate-200 text-campus-800 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">User Name</th>
                  <th className="py-3.5 px-4 sm:px-6">Contact & Email</th>
                  <th className="py-3.5 px-4 sm:px-6">Hostel Location</th>
                  <th className="py-3.5 px-4 sm:px-6">Role</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Total Bookings</th>
                  <th className="py-3.5 px-4 sm:px-6">Joined Date</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading users directory...
                    </td>
                  </tr>
                ) : usersList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No users match the search criteria.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                        {u.name}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <span className="text-slate-800 font-medium block">{u.phone}</span>
                        <span className="text-slate-400 text-[11px] block">{u.email}</span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                        {u.hostel ? `${u.hostel} (${u.room_number || 'Room not set'})` : '—'}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'RIDER'
                            ? 'bg-blue-100 text-campus-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-center font-bold text-campus-800">
                        {u.total_bookings}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-slate-400 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
