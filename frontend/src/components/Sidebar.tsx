'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import {
  LayoutDashboard, Bike, Shirt, KeyRound, Clock, Bell,
  User as UserIcon, LogOut, CheckCircle2, ShieldAlert,
  Users, DollarSign, FileText, Settings, History, HelpCircle,
  ToggleLeft, ToggleRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { role, user, riderInfo, refreshUser, logout, addToast } = useAuth();

  const handleAvailabilityChange = async (newStatus: 'Available' | 'Busy' | 'Offline') => {
    try {
      await api.updateRiderAvailability(newStatus);
      await refreshUser();
      addToast(`Status updated to ${newStatus}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update availability', 'error');
    }
  };

  if (!role) return null;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-5rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-6">
        {/* User Info Card */}
        <div className="p-3.5 bg-campus-50/70 border border-campus-100 rounded-2xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed in as</p>
          <p className="text-sm font-bold text-campus-text truncate mt-0.5">{user?.name}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-campus-200/50">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-campus-600 text-white">
              {role}
            </span>
            {role === 'RIDER' && riderInfo && (
              <span className={`text-[11px] font-bold flex items-center gap-1 ${
                riderInfo.availability_status === 'Available' ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${riderInfo.availability_status === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {riderInfo.availability_status}
              </span>
            )}
          </div>
        </div>

        {/* Rider Availability Toggle in Sidebar */}
        {role === 'RIDER' && riderInfo && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Duty Status
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['Available', 'Busy', 'Offline'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleAvailabilityChange(st)}
                  className={`text-[10px] font-bold py-1.5 rounded-lg transition-all ${
                    riderInfo.availability_status === st
                      ? st === 'Available'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : st === 'Busy'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="space-y-1">
          {role === 'USER' && (
            <>
              <SidebarItem
                href="/user/dashboard"
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Dashboard"
                active={pathname === '/user/dashboard'}
              />
              <SidebarItem
                href="/user/book-ride"
                icon={<Bike className="w-4 h-4" />}
                label="Book a Ride"
                active={pathname === '/user/book-ride'}
              />
              <SidebarItem
                href="/user/book-laundry"
                icon={<Shirt className="w-4 h-4" />}
                label="Laundry"
                active={pathname === '/user/book-laundry'}
              />
              <SidebarItem
                href="/user/rent-vehicle"
                icon={<KeyRound className="w-4 h-4" />}
                label="Rent a Vehicle"
                active={pathname === '/user/rent-vehicle'}
              />
              <SidebarItem
                href="/user/bookings"
                icon={<Clock className="w-4 h-4" />}
                label="My Bookings"
                active={pathname === '/user/bookings'}
              />
              <SidebarItem
                href="/user/notifications"
                icon={<Bell className="w-4 h-4" />}
                label="Notifications"
                active={pathname === '/user/notifications'}
              />
              <SidebarItem
                href="/user/profile"
                icon={<UserIcon className="w-4 h-4" />}
                label="Profile & Room"
                active={pathname === '/user/profile'}
              />
            </>
          )}

          {role === 'RIDER' && (
            <>
              <SidebarItem
                href="/rider/dashboard"
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Rider Console"
                active={pathname === '/rider/dashboard'}
              />
              <SidebarItem
                href="/rider/dashboard#pending-rides"
                icon={<Bike className="w-4 h-4" />}
                label="Pending Requests"
                active={pathname.includes('#pending-rides')}
              />
              <SidebarItem
                href="/rider/dashboard#active-rides"
                icon={<CheckCircle2 className="w-4 h-4" />}
                label="My Active Rides"
                active={pathname.includes('#active-rides')}
              />
              <SidebarItem
                href="/rider/dashboard#rentals"
                icon={<KeyRound className="w-4 h-4" />}
                label="Rental Requests"
                active={pathname.includes('#rentals')}
              />
              <SidebarItem
                href="/rider/dashboard#earnings"
                icon={<DollarSign className="w-4 h-4" />}
                label="Earnings & History"
                active={pathname.includes('#earnings')}
              />
              <SidebarItem
                href="/user/notifications"
                icon={<Bell className="w-4 h-4" />}
                label="Notifications"
                active={pathname === '/user/notifications'}
              />
            </>
          )}

          {role === 'ADMIN' && (
            <>
              <SidebarItem
                href="/admin/dashboard"
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Operations Center"
                active={pathname === '/admin/dashboard'}
              />
              <SidebarItem
                href="/admin/rides"
                icon={<Bike className="w-4 h-4" />}
                label="Ride Requests"
                active={pathname === '/admin/rides'}
              />
              <SidebarItem
                href="/admin/rentals"
                icon={<KeyRound className="w-4 h-4" />}
                label="Rental Requests"
                active={pathname === '/admin/rentals'}
              />
              <SidebarItem
                href="/admin/laundry"
                icon={<Shirt className="w-4 h-4" />}
                label="Laundry Orders"
                active={pathname === '/admin/laundry'}
              />
              <SidebarItem
                href="/admin/users"
                icon={<Users className="w-4 h-4" />}
                label="User Management"
                active={pathname === '/admin/users'}
              />
              <SidebarItem
                href="/admin/riders"
                icon={<Bike className="w-4 h-4" />}
                label="Rider Fleet"
                active={pathname === '/admin/riders'}
              />
              <SidebarItem
                href="/admin/fares"
                icon={<DollarSign className="w-4 h-4" />}
                label="Fare Management"
                active={pathname === '/admin/fares'}
              />
              <SidebarItem
                href="/admin/reports"
                icon={<FileText className="w-4 h-4" />}
                label="Reports & Analytics"
                active={pathname === '/admin/reports'}
              />
              <SidebarItem
                href="/admin/audit-logs"
                icon={<History className="w-4 h-4" />}
                label="Audit Logs"
                active={pathname === '/admin/audit-logs'}
              />
            </>
          )}
        </nav>
      </div>

      {/* Bottom Logout */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const SidebarItem: React.FC<{
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}> = ({ href, icon, label, active }) => {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
        active
          ? 'bg-campus-600 text-white shadow-sm shadow-campus-600/20'
          : 'text-slate-600 hover:text-campus-text hover:bg-slate-50'
      }`}
    >
      <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
};
