'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import BamisSection from '@/components/BamisSection';
import { BAMIS_DISTRICTS } from '@/lib/bamis-client';
import { useDashboard } from '@/context/DashboardContext';
import { ArrowLeft, MapPin } from 'lucide-react';

export default function BamisDistrictPage() {
  const params = useParams();
  const districtId = (Array.isArray(params?.districtId) ? params.districtId[0] : params?.districtId) || '57';
  const district = BAMIS_DISTRICTS.find(d => d.id === districtId) || { id: districtId, nameEn: 'District', nameBn: 'জেলা' };

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
      {/* Breadcrumb Navigation & Return to All Districts Link */}
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
            <Link href="/bamis" style={{ color: '#64748b', textDecoration: 'none' }}>
              BAMIS Portal (DAE)
            </Link>
            <span>/</span>
            <Link href="/bamis" style={{ color: '#64748b', textDecoration: 'none' }}>
              All 64 Districts
            </Link>
            <span>/</span>
            <span style={{ color: '#0c713e', fontWeight: 700 }}>
              {district.nameEn} ({district.nameBn}) Bulletin
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(16px, 4vw, 22px)',
            fontWeight: 800,
            color: '#0f172a',
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <MapPin size={22} style={{ color: '#0c713e' }} />
            <span>{district.nameEn} ({district.nameBn}) Agromet Advisory Bulletin</span>
          </h1>
        </div>

        <Link
          href="/bamis"
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
            color: '#0c713e',
            textDecoration: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e8f5f0';
            e.currentTarget.style.borderColor = '#0c713e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
        >
          <ArrowLeft size={16} />
          <span className="hide-on-mobile">সকল ৬৪ জেলা তালিকায় ফিরে যান (Back to All 64 Districts)</span>
          <span className="mobile-only-block" style={{ display: 'none' }}>সকল জেলা তালিকা</span>
        </Link>
      </div>

      <BamisSection
        initialDistrictId={districtId}
        forceSingleView={true}
        onRegisterReload={(fn) => { bamisReloadRef.current = fn; }}
        onLoadingChange={setIsLoading}
        onLastReloadTimeChange={setLastUpdated}
      />
    </div>
  );
}
