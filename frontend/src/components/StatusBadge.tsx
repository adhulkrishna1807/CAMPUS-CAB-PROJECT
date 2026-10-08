import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status ? status.toUpperCase() : 'UNKNOWN';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
  let dotColor = 'bg-slate-400';

  if (norm.includes('PENDING')) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
    dotColor = 'bg-amber-500';
  } else if (norm.includes('ACCEPTED') || norm.includes('WAY') || norm.includes('START') || norm.includes('PROCESS') || norm.includes('ACTIVE') || norm.includes('COLLECT') || norm.includes('SCHEDULE')) {
    colorClasses = 'bg-blue-50 text-campus-700 border-blue-200';
    dotColor = 'bg-campus-600';
  } else if (norm.includes('COMPLETE') || norm.includes('DELIVER') || norm.includes('READY') || norm.includes('RETURN')) {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    dotColor = 'bg-emerald-600';
  } else if (norm.includes('CANCEL')) {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-300';
    dotColor = 'bg-rose-500';
  }

  const label = norm.replace(/_/g, ' ');
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};
