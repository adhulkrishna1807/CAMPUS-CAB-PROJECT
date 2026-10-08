'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { NotificationItem } from '@/types';
import { Bell, Check, Clock, Bike, Shirt, KeyRound, Sparkles } from 'lucide-react';

export default function NotificationsPage() {
  const { user, addToast } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

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
      addToast('All notifications marked as read', 'success');
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex bg-slate-50/60 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-campus-100 text-campus-700 text-xs font-bold mb-1">
              <Bell className="w-3.5 h-3.5" />
              <span>Campus Updates</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-campus-800">
              Notification Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Live updates on rider assignments, laundry pickup schedules, and vehicle returns.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-campus-50 hover:bg-campus-100 text-campus-700 font-bold text-xs rounded-xl border border-campus-200 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <span className="w-6 h-6 border-2 border-campus-600/30 border-t-campus-600 rounded-full animate-spin inline-block mb-2" />
              <p>Loading alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center space-y-2 text-slate-400">
              <Bell className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">No notifications to display.</p>
            </div>
          ) : (
            notifications.map((item) => {
              let icon = <Sparkles className="w-4 h-4 text-campus-600" />;
              if (item.type === 'RIDE') icon = <Bike className="w-4 h-4 text-campus-600" />;
              if (item.type === 'LAUNDRY') icon = <Shirt className="w-4 h-4 text-campus-600" />;
              if (item.type === 'RENTAL') icon = <KeyRound className="w-4 h-4 text-campus-600" />;

              return (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item.id)}
                  className={`p-4 sm:p-5 transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                    !item.is_read ? 'bg-campus-50/60 hover:bg-campus-100/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs mt-0.5">
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-sm ${!item.is_read ? 'font-black text-campus-900' : 'font-bold text-slate-800'}`}>
                          {item.title}
                        </h4>
                        {!item.is_read && (
                          <span className="px-2 py-0.5 rounded-full bg-campus-600 text-white text-[9px] font-bold">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xl">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-2 block">
                        {new Date(item.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {!item.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(item.id);
                      }}
                      className="p-1 text-slate-400 hover:text-campus-600 rounded-lg"
                      title="Mark read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
