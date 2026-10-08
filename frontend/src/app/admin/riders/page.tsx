'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { Bike, Plus, RefreshCw, X, Check, Phone, Shield } from 'lucide-react';

export default function AdminRidersPage() {
  const { user, role, addToast } = useAuth();
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add rider modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newVehicleType, setNewVehicleType] = useState('Bike');
  const [newVehicleNumber, setNewVehicleNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminRiders();
      setRiders(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && role === 'ADMIN') {
      fetchRiders();
    }
  }, [user, role]);

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createRider({
        name: newName,
        email: newEmail,
        phone: newPhone,
        password: 'Rider@123',
        vehicle_type: newVehicleType,
        vehicle_number: newVehicleNumber,
      });
      addToast('New rider added successfully!', 'success');
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewVehicleNumber('');
      await fetchRiders();
    } catch (err: any) {
      addToast(err.message || 'Failed to add rider', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (riderId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Available' ? 'Busy' : currentStatus === 'Busy' ? 'Offline' : 'Available';
    try {
      await api.updateRider(riderId, { availability_status: nextStatus });
      addToast(`Status changed to ${nextStatus}`, 'success');
      await fetchRiders();
    } catch (err: any) {
      addToast(err.message || 'Failed to update rider status', 'error');
    }
  };

  return (
    <div className="flex bg-slate-50/60 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-campus-100 text-campus-700 text-xs font-bold mb-1">
              <Bike className="w-3.5 h-3.5" />
              <span>Campus Fleet Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-campus-800">
              Rider Fleet & Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage registered student riders, vehicle numbers, on-duty availability, and service history.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchRiders}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-campus-600" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Rider</span>
            </button>
          </div>
        </div>

        {/* Riders Fleet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">
              Loading rider fleet records...
            </div>
          ) : (
            riders.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600">⭐ {r.rating} Rating</span>
                    <button
                      onClick={() => handleToggleStatus(r.id, r.availability_status)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                        r.availability_status === 'Available'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : r.availability_status === 'Busy'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      ● {r.availability_status}
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-campus-50 text-campus-600 font-bold flex items-center justify-center shrink-0">
                      {r.name[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-campus-text">{r.name}</h4>
                      <p className="text-[11px] text-slate-500">{r.phone}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vehicle:</span>
                      <strong className="text-slate-800">{r.vehicle_type}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Registration:</span>
                      <strong className="text-slate-800">{r.vehicle_number}</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-400">Completed Trips:</span>
                      <strong className="text-campus-800">{r.completed_rides}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Click badge to toggle status</span>
                  <a
                    href={`tel:${r.phone}`}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Call Rider"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ADD RIDER MODAL - Requirement 42 */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-campus-text">Register New Campus Rider</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddRider} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Rider Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Suresh Kumar"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-campus-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="rider@campuscab.demo"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-campus-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="9876543224"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-campus-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={newVehicleType}
                      onChange={(e) => setNewVehicleType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    >
                      <option value="Bike">Motorcycle / Bike</option>
                      <option value="Scooty">Scooty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      required
                      value={newVehicleNumber}
                      onChange={(e) => setNewVehicleNumber(e.target.value)}
                      placeholder="TN-01-XX-0000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-campus-600"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    <span>Add Rider</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
