'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { NotificationItem } from '@/types';
import {
  Bike, MapPin, Bell, LogOut,
  Menu, X, ChevronDown, LayoutDashboard
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then((data) => setNotifications(data))
        .catch(() => {});
    }
  }, [user, pathname]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const getDashboardLink = () => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'RIDER') return '/rider/dashboard';
    return '/user/dashboard';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CC';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const isActive = (href: string) => pathname === href;

  // Public nav links (shown when logged out)
  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/#services', label: 'Services' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/fare-chart', label: 'Fare Chart' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href={user ? getDashboardLink() : '/'} className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#1557C0] flex items-center justify-center relative shadow-sm group-hover:bg-[#073B8F] transition-colors">
              <Bike className="w-5 h-5 text-white stroke-[2.2]" />
              <MapPin className="w-2.5 h-2.5 text-blue-200 fill-blue-200 absolute -top-0.5 -right-0.5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-[#062B68] tracking-tight leading-none">CAMPUS CAB</span>
              <p className="text-[10px] font-medium text-[#486581] tracking-wide hidden sm:block">Ride • Connect • Campus</p>
            </div>
          </Link>

          {/* Desktop Nav — public links only when logged out */}
          {!user && (
            <nav className="hidden md:flex items-center space-x-1">
              {publicLinks.map(({ href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive(href)
                      ? 'text-[#1557C0] bg-[#EAF4FF]'
                      : 'text-[#486581] hover:text-[#102A43] hover:bg-slate-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {/* Dashboard quick link */}
                <Link
                  href={getDashboardLink()}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#486581] hover:text-[#1557C0] hover:bg-[#EAF4FF] transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 rounded-lg text-[#486581] hover:text-[#1557C0] hover:bg-[#EAF4FF] transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#1557C0] text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                      <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-[#102A43]">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-bold bg-[#EAF4FF] text-[#1557C0] px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-xs text-[#1557C0] hover:underline font-semibold">
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">No notifications yet</div>
                        ) : (
                          notifications.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleMarkAsRead(item.id)}
                              className={`p-3.5 cursor-pointer transition-colors ${
                                !item.is_read ? 'bg-[#F5F9FF] hover:bg-[#EAF4FF]' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <p className={`text-xs ${!item.is_read ? 'font-bold text-[#102A43]' : 'font-medium text-slate-600'}`}>
                                  {item.title}
                                </p>
                                {!item.is_read && <span className="w-2 h-2 rounded-full bg-[#1557C0] ml-2 mt-0.5 shrink-0" />}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{item.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-4 pt-2 border-t border-slate-100 text-center">
                        <Link
                          href={role === 'USER' ? '/user/notifications' : getDashboardLink()}
                          onClick={() => setNotificationsOpen(false)}
                          className="text-xs font-semibold text-[#1557C0] hover:underline"
                        >
                          View all →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-[#1557C0] hover:bg-[#F5F9FF] transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#1557C0] text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                      {getInitials(user.name)}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-bold text-[#102A43] leading-none truncate max-w-[100px]">{user.name}</p>
                      <span className="text-[10px] font-semibold text-[#1557C0] uppercase">{role}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-[#102A43]">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF4FF] text-[#1557C0]">{role}</span>
                      </div>
                      <div className="py-1">
                        <Link
                          href={getDashboardLink()}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#1557C0]"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 mr-2" /> Dashboard
                        </Link>
                        {role === 'USER' && (
                          <>
                            <Link
                              href="/user/bookings"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#1557C0]"
                            >
                              My Bookings
                            </Link>
                            <Link
                              href="/user/profile"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#1557C0]"
                            >
                              Profile & Settings
                            </Link>
                          </>
                        )}
                      </div>
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => { setProfileDropdownOpen(false); logout(); }}
                          className="w-full flex items-center px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-[#1557C0] hover:bg-[#EAF4FF] rounded-lg transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-bold text-white bg-[#1557C0] hover:bg-[#073B8F] rounded-lg shadow-sm transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-[#1557C0] hover:bg-[#EAF4FF] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1">
          {!user && publicLinks.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-[#EAF4FF] hover:text-[#1557C0] transition-colors"
            >
              {label}
            </Link>
          ))}
          {user && (
            <>
              <Link href={getDashboardLink()} className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-[#EAF4FF] hover:text-[#1557C0]">
                Dashboard
              </Link>
              {role === 'USER' && (
                <>
                  <Link href="/user/bookings" className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-[#EAF4FF] hover:text-[#1557C0]">
                    My Bookings
                  </Link>
                  <Link href="/user/notifications" className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-[#EAF4FF] hover:text-[#1557C0]">
                    Notifications
                  </Link>
                  <Link href="/user/profile" className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-[#EAF4FF] hover:text-[#1557C0]">
                    Profile
                  </Link>
                </>
              )}
              <div className="pt-2 border-t border-slate-100 mt-2">
                <button
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
          {!user && (
            <div className="pt-2 border-t border-slate-100 mt-2 flex gap-2">
              <Link href="/login" className="flex-1 py-2.5 text-center text-sm font-bold text-[#1557C0] bg-[#EAF4FF] rounded-lg">
                Log in
              </Link>
              <Link href="/login" className="flex-1 py-2.5 text-center text-sm font-bold text-white bg-[#1557C0] rounded-lg">
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
