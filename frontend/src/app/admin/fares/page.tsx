'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { FareRoute } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { DollarSign, Search, Plus, Edit2, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { LOCATIONS } from '@/components/FareCalculator';

export default function AdminFaresPage() {
  const { user, role, addToast } = useAuth();
  const [routes, setRoutes] = useState<FareRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit modal
  const [editingRoute, setEditingRoute] = useState<FareRoute | null>(null);
  const [editSingle, setEditSingle] = useState<number>(0);
  const [editDouble, setEditDouble] = useState<number>(0);

  // Add route modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFrom, setNewFrom] = useState('Boys Hostel');
  const [newTo, setNewTo] = useState('Gate 2');
  const [newSingle, setNewSingle] = useState<number>(30);
  const [newDouble, setNewDouble] = useState<number>(40);

  // Confirm dialog
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchFares = async () => {
    try {
      setLoading(true);
      const data = await api.getFares();
      setRoutes(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && role === 'ADMIN') {
      fetchFares();
    }
  }, [user, role]);

  const handleOpenEdit = (route: FareRoute) => {
    setEditingRoute(route);
    setEditSingle(route.single_fare);
    setEditDouble(route.double_fare);
  };

  const handleTriggerSave = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmModalOpen(true);
  };

  const handleExecuteSave = async () => {
    if (!editingRoute) return;
    setIsSaving(true);
    try {
      await api.updateFareRoute(editingRoute.id, {
        single_fare: editSingle,
        double_fare: editDouble,
      });
      addToast(`Updated fare for ${editingRoute.from_location} → ${editingRoute.to_location}`, 'success');
      setEditingRoute(null);
      setConfirmModalOpen(false);
      await fetchFares();
    } catch (err: any) {
      addToast(err.message || 'Failed to update fare', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.createFareRoute({
        from_location: newFrom,
        to_location: newTo,
        single_fare: Number(newSingle),
        double_fare: Number(newDouble),
      });
      addToast('New route tariff added successfully!', 'success');
      setIsAddOpen(false);
      await fetchFares();
    } catch (err: any) {
      addToast(err.message || 'Failed to create route', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = routes.filter((r) => {
    const s = search.toLowerCase();
    return r.from_location.toLowerCase().includes(s) || r.to_location.toLowerCase().includes(s);
  });

  return (
    <div className="flex bg-slate-50/60 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-campus-100 text-campus-700 text-xs font-bold mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Campus Cab Tariff Policy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-campus-800">
              Fare Chart Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Review and update standard fares. Changes are automatically logged to the administrative audit trail.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchFares}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-campus-600" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2.5 bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Route</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search route origin or destination..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-campus-600 transition-colors"
            />
          </div>
        </div>

        {/* Fare Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-campus-50/70 border-b border-slate-200 text-campus-800 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Pickup (Origin)</th>
                  <th className="py-3.5 px-4 sm:px-6">Drop (Destination)</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Single Passenger Fare</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Double Passenger Fare</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Edit Tariff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Loading fare routes...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No routes found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((route) => (
                    <tr key={route.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                        {route.from_location}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-800">
                        → {route.to_location}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-center font-bold text-campus-700 bg-slate-50/40">
                        ₹{route.single_fare}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-center font-bold text-campus-800">
                        ₹{route.double_fare}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(route)}
                          className="px-3 py-1.5 rounded-xl bg-campus-50 hover:bg-campus-100 text-campus-700 font-bold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* EDIT MODAL */}
        {editingRoute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-campus-text">Edit Route Fare</h3>
                <button
                  onClick={() => setEditingRoute(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTriggerSave} className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Route:</span>
                  <strong className="text-slate-900">{editingRoute.from_location} → {editingRoute.to_location}</strong>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Single Fare (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      value={editSingle}
                      onChange={(e) => setEditSingle(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Double Fare (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      value={editDouble}
                      onChange={(e) => setEditDouble(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingRoute(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal - Requirement 68 & 147 */}
        <ConfirmationModal
          isOpen={confirmModalOpen}
          title="Confirm Fare Change"
          message={`Are you sure you want to change this fare to Single: ₹${editSingle}, Double: ₹${editDouble}? This will update the system's live fare calculation immediately.`}
          confirmLabel="Yes, Update Fare"
          isLoading={isSaving}
          onConfirm={handleExecuteSave}
          onCancel={() => setConfirmModalOpen(false)}
        />

        {/* ADD ROUTE MODAL */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-campus-text">Add Custom Fare Route</h3>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRoute} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pickup Location (From)
                  </label>
                  <input
                    type="text"
                    required
                    value={newFrom}
                    onChange={(e) => setNewFrom(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Drop Location (To)
                  </label>
                  <input
                    type="text"
                    required
                    value={newTo}
                    onChange={(e) => setNewTo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Single Fare (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      value={newSingle}
                      onChange={(e) => setNewSingle(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Double Fare (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      value={newDouble}
                      onChange={(e) => setNewDouble(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSaving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    <span>Add Route</span>
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
