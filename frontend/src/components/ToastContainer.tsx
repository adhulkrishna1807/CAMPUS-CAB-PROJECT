'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-white border-blue-200 text-campus-text shadow-lg';
        let icon = <Info className="w-5 h-5 text-campus-500 shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-white border-emerald-300 text-emerald-950 shadow-lg';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-white border-rose-300 text-rose-950 shadow-lg';
          icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-white border-amber-300 text-amber-950 shadow-lg';
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border transition-all duration-200 animate-in slide-in-from-bottom-3 ${bg}`}
          >
            <div className="flex items-start space-x-3">
              {icon}
              <p className="text-sm font-medium leading-5">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
