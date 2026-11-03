'use client';

import React, { useEffect, useRef } from 'react';
import BamisNationalBulletinSection from '@/components/BamisNationalBulletinSection';
import { useDashboard } from '@/context/DashboardContext';

export default function BamisNationalPage() {
  const { registerReload } = useDashboard();
  const nationalReloadRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    registerReload(() => {
      if (nationalReloadRef.current) {
        nationalReloadRef.current();
      }
    });
  }, [registerReload]);

  return (
    <div style={{ paddingBottom: '32px' }}>
      <BamisNationalBulletinSection
        onRegisterReload={(fn) => {
          nationalReloadRef.current = fn;
        }}
      />
    </div>
  );
}

