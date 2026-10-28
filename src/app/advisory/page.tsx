'use client';

import React, { useEffect, useRef } from 'react';
import AdvisorySection from '@/components/AdvisorySection';
import { useDashboard } from '@/context/DashboardContext';

export default function AdvisoryPage() {
  const { registerReload, setIsLoading, setLastUpdated } = useDashboard();
  const advisoryReloadRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    registerReload(() => {
      if (advisoryReloadRef.current) {
        advisoryReloadRef.current();
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
            <span>NLS Portal (NLAS)</span>
            <span>/</span>
            <span style={{ color: '#006a4e', fontWeight: 700 }}>
              Region Wise Monthly Advisory
            </span>
          </div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#0f172a',
            marginTop: '4px'
          }}>
            Region Wise Monthly Advisory
          </h1>
        </div>
      </div>

      <AdvisorySection
        districtName="Dhaka"
        upazilaName="Adabor"
        onRegisterReload={(fn) => { advisoryReloadRef.current = fn; }}
        onLoadingChange={setIsLoading}
        onLastReloadTimeChange={setLastUpdated}
      />
    </div>
  );
}
