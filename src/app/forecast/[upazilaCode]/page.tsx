'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ForecastSection from '@/components/ForecastSection';
import { ArrowLeft, CloudSun } from 'lucide-react';

export default function ForecastUpazilaChartsPage() {
  const params = useParams();
  const upazilaCode = (Array.isArray(params?.upazilaCode) ? params.upazilaCode[0] : params?.upazilaCode) || '302602';

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
            <Link href="/forecast" style={{ color: '#64748b', textDecoration: 'none' }}>
              NLS Portal (NLAS)
            </Link>
            <span>/</span>
            <Link href="/forecast" style={{ color: '#64748b', textDecoration: 'none' }}>
              Weather Forecast
            </Link>
            <span>/</span>
            <span style={{ color: '#006a4e', fontWeight: 700 }}>
              Upazila #{upazilaCode} 3-Hourly Charts
            </span>
          </div>

        </div>

        <Link
          href="/forecast"
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
            color: '#006a4e',
            textDecoration: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e8f5f0';
            e.currentTarget.style.borderColor = '#006a4e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
        >
          <ArrowLeft size={16} />
          <span>সকল উপজেলায় ফিরে যান (Back to All Upazilas)</span>
        </Link>
      </div>

      <ForecastSection
        initialUpazilaCode={upazilaCode}
        forceSingleView={true}
      />
    </div>
  );
}
