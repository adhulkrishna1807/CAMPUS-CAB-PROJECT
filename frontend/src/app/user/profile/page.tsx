'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { User, Phone, Home, Mail, Shield, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, role, refreshUser, addToast } = useAuth();

  const [phone, setPhone] = useState('');
  const [hostel, setHostel] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setHostel(user.hostel || 'Boys Hostel');
      setRoomNumber(user.room_number || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({ phone, hostel, room_number: roomNumber });
      await refreshUser();
      addToast('Profile details updated successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex bg-slate-50/60 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-campus-800">
            Account & Hostel Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Keep your contact number and hostel location updated for seamless pickup and delivery.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Readonly identity fields (Requirement 83) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-bold text-slate-800">
                  {user?.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Registered Email
                </label>
                <div className="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-medium text-slate-600">
                  {user?.email}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-campus-600" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-campus-600" />
                  <span>Role Access</span>
                </label>
                <div className="px-4 py-2.5 bg-campus-50 border border-campus-200 rounded-xl text-xs font-bold text-campus-700">
                  {role} (Strictly verified on server)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-campus-600" />
                  <span>Hostel Name</span>
                </label>
                <input
                  type="text"
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  placeholder="e.g. Boys Hostel"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Room Number
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. B-204"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-campus-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-3 px-6 py-3 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
