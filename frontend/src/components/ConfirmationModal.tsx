'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'success';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  let btnColor = 'bg-campus-600 hover:bg-campus-700 text-white';
  let icon = <CheckCircle className="w-6 h-6 text-campus-600" />;

  if (variant === 'danger') {
    btnColor = 'bg-rose-600 hover:bg-rose-700 text-white';
    icon = <AlertTriangle className="w-6 h-6 text-rose-600" />;
  } else if (variant === 'success') {
    btnColor = 'bg-emerald-600 hover:bg-emerald-700 text-white';
    icon = <CheckCircle className="w-6 h-6 text-emerald-600" />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all scale-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              {icon}
            </div>
            <h3 className="text-lg font-bold text-campus-text">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4">
          <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-sm font-semibold rounded-xl shadow-sm transition-all duration-150 flex items-center gap-2 ${btnColor}`}
          >
            {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
