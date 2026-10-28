'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import BmdSection from '@/components/BmdSection';
import { useDashboard } from '@/context/DashboardContext';
import { ArrowLeft, Compass } from 'lucide-react';

export default function BmdUpazilaChartsPage() {
  const params = useParams();
  const upazilaCode = (Array.isArray(params?.upazilaCode) ? params.upazilaCode[0] : params?.upazilaCode) || '302602';

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
            <Link href="/bmd" style={{ color: '#64748b', textDecoration: 'none' }}>
              BMD Portal (USF)
            </Link>
            <span>/</span>
            <Link href="/bmd" style={{ color: '#64748b', textDecoration: 'none' }}>
              Upazila Weather Forecast
            </Link>
            <span>/</span>
            <span style={{ color: '#0369a1', fontWeight: 700 }}>
              Station #{upazilaCode} 3-Hourly Charts
            </span>
          </div>

        </div>

        <Link
          href="/bmd"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            color: '#0369a1',
            textDecoration: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e0f2fe';
            e.currentTarget.style.borderColor = '#0369a1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
        >
          <ArrowLeft size={16} />
          <span>সকল স্টেশনে ফিরে যান (Back to All Stations)</span>
        </Link>
      </div>

      <BmdSection
        initialUpazilaCode={upazilaCode}
        forceSingleView={true}
        onRegisterReload={(fn) => { bmdReloadRef.current = fn; }}
        onLoadingChange={setIsLoading}
        onLastReloadTimeChange={setLastUpdated}
      />
    </div>
  );
}
