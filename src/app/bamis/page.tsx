'use client';

import React, { useEffect, useRef } from 'react';
import BamisSection from '@/components/BamisSection';
import { useDashboard } from '@/context/DashboardContext';

export default function BamisPage() {
  const { registerReload, setIsLoading, setLastUpdated } = useDashboard();
  const bamisReloadRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    registerReload(() => {
      if (bamisReloadRef.current) {
        bamisReloadRef.current();
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
            <span>BAMIS Portal (DAE)</span>
            <span>/</span>
            <span style={{ color: '#0c713e', fontWeight: 700 }}>
              District Agromet Bulletin
            </span>
          </div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#0f172a',
            marginTop: '4px'
          }}>
            District Agromet Advisory Bulletin (bamis.gov.bd)
          </h1>
        </div>
      </div>

      <BamisSection
        onRegisterReload={(fn) => { bamisReloadRef.current = fn; }}
        onLoadingChange={setIsLoading}
        onLastReloadTimeChange={setLastUpdated}
      />
    </div>
  );
}
