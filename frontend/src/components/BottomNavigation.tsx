'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home, Clock, Bell, User as UserIcon, LayoutDashboard,
  Bike, Shirt, KeyRound, Shield
} from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const { user, role } = useAuth();

  if (!user) return null;

  const getHomeLink = () => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'RIDER') return '/rider/dashboard';
    return '/user/dashboard';
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
      <Link
        href={getHomeLink()}
        className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-colors ${
          pathname.includes('/dashboard')
            ? 'text-campus-600'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Dashboard</span>
      </Link>

      {role === 'USER' && (
        <>
          <Link
            href="/user/book-ride"
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-colors ${
              pathname === '/user/book-ride'
                ? 'text-campus-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bike className="w-5 h-5 mb-0.5" />
            <span>Ride</span>
          </Link>
          <Link
            href="/user/bookings"
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-colors ${
              pathname === '/user/bookings'
                ? 'text-campus-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span>Bookings</span>
          </Link>
        </>
      )}

      {role === 'RIDER' && (
        <>
          <Link
            href="/rider/dashboard#pending-rides"
            className="flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-slate-800"
          >
            <Bike className="w-5 h-5 mb-0.5" />
            <span>Requests</span>
          </Link>
          <Link
            href="/rider/dashboard#active-rides"
            className="flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-slate-800"
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span>Active</span>
          </Link>
        </>
      )}

      {role === 'ADMIN' && (
        <>
          <Link
            href="/admin/rides"
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-colors ${
              pathname === '/admin/rides'
                ? 'text-campus-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bike className="w-5 h-5 mb-0.5" />
            <span>Rides</span>
          </Link>
          <Link
            href="/admin/laundry"
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-colors ${
              pathname === '/admin/laundry'
                ? 'text-campus-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shirt className="w-5 h-5 mb-0.5" />
            <span>Laundry</span>
          </Link>
        </>
      )}

      <Link
        href={role === 'USER' ? '/user/notifications' : getHomeLink()}
        className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-colors ${
          pathname.includes('/notifications')
            ? 'text-campus-600'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Bell className="w-5 h-5 mb-0.5" />
        <span>Alerts</span>
      </Link>

      <Link
        href={role === 'USER' ? '/user/profile' : getHomeLink()}
        className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-colors ${
          pathname.includes('/profile')
            ? 'text-campus-600'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <UserIcon className="w-5 h-5 mb-0.5" />
        <span>Profile</span>
      </Link>
    </div>
  );
};
