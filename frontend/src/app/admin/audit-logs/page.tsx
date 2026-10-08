'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { AuditLog } from '@/types';
import {
  ShieldAlert, RefreshCw, Search, Clock, UserCheck,
  FileCheck, Shield, ChevronRight
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit trails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadLogs();
    }
  }, [user]);

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.affected_item.toLowerCase().includes(term) ||
      (log.details && log.details.toLowerCase().includes(term)) ||
      log.admin_name.toLowerCase().includes(term)
    );
  });

  const getActionBadge = (action: string) => {
    if (action.includes('FARE')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('RIDER')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (action.includes('RETURN') || action.includes('COMPLETE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('CANCEL') || action.includes('RESET')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-campus-100 text-campus-800">
              System Compliance & Security
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Immutable operations log</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-950 flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-campus-600" />
            Administrative Audit Trail
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Real-time record of all fare tariff adjustments, rider provisioning, deposit settlements, and overrides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, item, admin, or detail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredLogs.length}</span> of {logs.length} logged events
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-campus-600 mb-2" />
            Loading audit records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Shield className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No audit events match your search.</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6">Timestamp (UTC)</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Target Entity</th>
                  <th className="py-3 px-6">Administrator</th>
                  <th className="py-3 px-6">Details / Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 whitespace-nowrap text-xs text-slate-500 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">
                      {log.affected_item}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap text-slate-600 text-xs font-medium">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                        {log.admin_name || `Admin #${log.admin_id}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-600 max-w-md break-words">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
