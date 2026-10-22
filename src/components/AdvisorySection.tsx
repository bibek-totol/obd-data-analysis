'use client';

import React from 'react';
import {
  FileText,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Activity
} from 'lucide-react';

interface AdvisorySectionProps {
  districtName?: string;
  upazilaName?: string;
}

export default function AdvisorySection({
  districtName = 'Dhaka',
  upazilaName = 'Adabor'
}: AdvisorySectionProps) {
  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Banner Notice */}
      <div style={{
        background: 'linear-gradient(135deg, #006a4e 0%, #004d37 100%)',
        borderRadius: '14px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(0, 106, 78, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '720px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '10px'
          }}>
            <Sparkles size={14} color="#a7f3d0" />
            <span>NLAS Livestock Advisory Module</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>
            Livestock Health & Production Advisory Service
          </h2>
          <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5 }}>
            Automated veterinary recommendations, Temperature-Humidity Index (THI) alerts,
            and monthly bulletins tailored for {upazilaName}, {districtName}.
          </p>
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '12px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700 }}>
            Module Status
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
            Ready for Advisory Specs
          </div>
        </div>
      </div>

      {/* Advisory Status Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '18px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Cattle & Dairy */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Dairy & Beef Cattle (THI)
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '3px 8px',
              borderRadius: '6px'
            }}>
              Normal
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
            Calculated Heat Index is below thermal stress threshold. Adequate ventilation and regular fresh water intake recommended.
          </p>
          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={13} color="#10b981" />
            <span>Avg THI: 76.8 (Safe Zone &lt; 79)</span>
          </div>
        </div>

        {/* Card 2: Broiler Poultry */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Broiler Farming
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fef3c7',
              color: '#b45309',
              padding: '3px 8px',
              borderRadius: '6px'
            }}>
              Moderate Care
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
            Midday temperatures approaching 33°C. Maintain shed airflow, check litter humidity, and supply electrolytes during peak hours.
          </p>
          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={13} color="#f59e0b" />
            <span>Broiler THI: 27.9°C</span>
          </div>
        </div>

        {/* Card 3: Layer Poultry */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Commercial Layers
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '3px 8px',
              borderRadius: '6px'
            }}>
              Optimal
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
            Egg production climate indices stable. Follow routine biosecurity vaccination calendar and feed calcium fortification.
          </p>
          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={13} color="#10b981" />
            <span>Layer THI: 26.0°C</span>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px dashed #cbd5e1',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: '#f0fdf4',
          color: '#006a4e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px'
        }}>
          <FileText size={22} />
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
          Advisory Section Framework Initialized
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '600px', margin: '0 auto 16px', lineHeight: 1.5 }}>
          As requested, this section is registered in the NLS navigation structure. Whenever you provide the advisory specifications,
          we will immediately connect the HTML scraping routines and render the customized livestock health advisories.
        </p>
      </div>
    </div>
  );
}
