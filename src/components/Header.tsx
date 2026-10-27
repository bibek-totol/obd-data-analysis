import React from 'react';
import { RefreshCw } from 'lucide-react';
import { ActiveSection } from './Sidebar';

interface HeaderProps {
  activeSection?: ActiveSection;
  onReload: () => void;
  isLoading: boolean;
  lastUpdated?: string;
}

export default function Header({
  activeSection = 'forecast',
  onReload,
  isLoading,
  lastUpdated
}: HeaderProps) {
  const isBmd = activeSection === 'bmd-forecast';
  const isBamis = activeSection === 'bamis-bulletin';

  const themeColor = isBmd ? '#0369a1' : isBamis ? '#0c713e' : '#006a4e';
  const themeHoverColor = isBmd ? '#075985' : isBamis ? '#084f2b' : '#00523d';

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      {/* Left: Branding & Logos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isBmd ? (
            <div style={{
              background: 'linear-gradient(135deg, #0a336f 0%, #0369a1 100%)',
              color: '#ffffff',
              padding: '5px 12px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '15px',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 6px rgba(3, 105, 161, 0.25)'
            }}>
              BMD <span style={{ fontSize: '10px', fontWeight: 500, color: '#bae6fd' }}>BANGLADESH</span>
            </div>
          ) : isBamis ? (
            <div style={{
              background: 'linear-gradient(135deg, #054c27 0%, #0c713e 100%)',
              color: '#ffffff',
              padding: '5px 12px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '15px',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 6px rgba(12, 113, 62, 0.25)'
            }}>
              BAMIS <span style={{ fontSize: '10px', fontWeight: 500, color: '#bbf7d0' }}>BANGLADESH</span>
            </div>
          ) : (
            <div style={{
              background: 'linear-gradient(135deg, #006a4e 0%, #004d37 100%)',
              color: '#ffffff',
              padding: '5px 12px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '15px',
              letterSpacing: '0.05em'
            }}>
              NLS <span style={{ fontSize: '10px', fontWeight: 500, color: '#a7f3d0' }}>BANGLADESH</span>
            </div>
          )}
          <div style={{ height: '24px', width: '1px', backgroundColor: '#cbd5e1' }} />
          <div>
            <h1 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.2
            }}>
              {isBmd
                ? 'Upazila Weather Forecast Portal (USF)'
                : isBamis
                ? 'District Agromet Advisory Bulletin (BAMIS)'
                : 'National Livestock Advisory System'}
            </h1>
            <p style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: 500
            }}>
              {isBmd
                ? 'Bangladesh Meteorological Department (BMD) & RIMES • Govt. of Bangladesh'
                : isBamis
                ? 'Department of Agricultural Extension (DAE) • Ministry of Agriculture • Govt. of Bangladesh'
                : 'Department of Livestock Services (DLS) • Govt. of the People\'s Republic of Bangladesh'}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions, Refresh, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Context-Aware Reload Button */}
        <button
          onClick={onReload}
          disabled={isLoading}
          id={
            isBmd
              ? 'btn-reload-latest-bmd-forecast'
              : isBamis
              ? 'btn-reload-latest-bamis-bulletin'
              : activeSection === 'forecast'
              ? 'btn-reload-latest-forecast'
              : 'btn-reload-latest-advisory'
          }
          title={
            isBmd
              ? 'Click to fetch fresh real-time BMDWRF weather forecast'
              : isBamis
              ? 'Click to fetch fresh real-time BAMIS agromet bulletin'
              : activeSection === 'forecast'
              ? 'Click to fetch fresh real-time weather forecast'
              : 'Click to fetch fresh real-time regional advisory directives'
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isLoading ? '#e2e8f0' : themeColor,
            color: isLoading ? '#64748b' : '#ffffff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            transition: 'all 0.2s ease',
            boxShadow: isLoading
              ? 'none'
              : `0 2px 8px ${themeColor}40`,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = themeHoverColor;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = themeColor;
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin-fast' : ''} />
          <span>
            {isLoading
              ? 'Fetching Data...'
              : isBmd
              ? 'Reload Latest BMD Feed'
              : isBamis
              ? 'Reload Latest BAMIS Feed'
              : activeSection === 'forecast'
              ? 'Reload Latest Forecast'
              : 'Reload Latest Advisory'}
          </span>
        </button>

        {/* Last Updated Timestamp */}
        {lastUpdated && (
          <span style={{
            fontSize: '11px',
            color: '#64748b',
            display: 'none',
            maxWidth: '120px'
          }}>
            Updated: {lastUpdated}
          </span>
        )}

        {/* Profile Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px 4px 6px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '24px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#006a4e',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700
          }}>
            NL
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            Officer Portal
          </span>
        </div>
      </div>
    </header>
  );
}

