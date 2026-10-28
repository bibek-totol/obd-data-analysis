'use client';

import React, { useEffect, useRef } from 'react';
import BmdSection from '@/components/BmdSection';
import { useDashboard } from '@/context/DashboardContext';

export default function BmdPage() {
  const { registerReload, setIsLoading, setLastUpdated } = useDashboard();
  const bmdReloadRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    registerReload(() => {
      if (bmdReloadRef.current) {
        bmdReloadRef.current();
      }
    });
  }, [registerReload]);

  return (
    <div>
      {/* Section Breadcrumb & Status Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#64748b',
            fontWeight: 600
          }}>
            <span>BMD Portal (USF)</span>
            <span>/</span>
            <span style={{ color: '#0369a1', fontWeight: 700 }}>
              Upazila Weather Forecast
            </span>
          </div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#0f172a',
            marginTop: '4px'
          }}>
            Upazila Weather Forecast (usf.bmd.gov.bd)
          </h1>
        </div>
      </div>

      <BmdSection
        onRegisterReload={(fn) => { bmdReloadRef.current = fn; }}
        onLoadingChange={setIsLoading}
        onLastReloadTimeChange={setLastUpdated}
      />
    </div>
  );
}
