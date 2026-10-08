'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

export const DemoBanner: React.FC = () => {
  const { user } = useAuth();

  // Only show a very subtle indicator for demo accounts, and only if logged in
  if (!user) return null;
  const isDemo =
    user.email?.includes('@campuscab.demo') ||
    user.email?.includes('demo');
  if (!isDemo) return null;

  return (
    <div className="bg-campus-700 text-white text-[11px] py-1 px-4 text-center font-medium tracking-wide">
      You are viewing Campus Cab as a demo account &mdash; data may be reset periodically.
    </div>
  );
};
