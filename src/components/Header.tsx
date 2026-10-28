'use client';

import React from 'react';
import { RefreshCw, Menu, X } from 'lucide-react';
import { ActiveSection } from './Sidebar';
import { useDashboard } from '@/context/DashboardContext';

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
  const { isMobileDrawerOpen, toggleMobileDrawer } = useDashboard();

  const isBmd = activeSection === 'bmd-forecast';
  const isBamis = activeSection === 'bamis-bulletin';

  const themeColor = isBmd ? '#0369a1' : isBamis ? '#0c713e' : '#006a4e';
  const themeHoverColor = isBmd ? '#075985' : isBamis ? '#084f2b' : '#00523d';

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      gap: '12px'
    }}>
      {/* Left: Mobile Menu Toggle + Branding & Logos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {/* Mobile Hamburger Drawer Toggle (Visible on < 1024px) */}
        <button
          onClick={toggleMobileDrawer}
          id="btn-mobile-nav-toggle"
          aria-label={isMobileDrawerOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          className="mobile-nav-toggle"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            color: '#1e293b',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
        >
          {isMobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Portal Branding Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {isBmd ? (
            <div style={{
              background: 'linear-gradient(135deg, #0a336f 0%, #0369a1 100%)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '14px',
              letterSpacing: '0.04em',
              boxShadow: '0 2px 6px rgba(3, 105, 161, 0.25)',
              flexShrink: 0
            }}>
              BMD <span style={{ fontSize: '9px', fontWeight: 500, color: '#bae6fd' }}>BD</span>
            </div>
          ) : isBamis ? (
            <div style={{
              background: 'linear-gradient(135deg, #054c27 0%, #0c713e 100%)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '14px',
              letterSpacing: '0.04em',
              boxShadow: '0 2px 6px rgba(12, 113, 62, 0.25)',
              flexShrink: 0
            }}>
              BAMIS <span style={{ fontSize: '9px', fontWeight: 500, color: '#bbf7d0' }}>BD</span>
            </div>
          ) : (
            <div style={{
              background: 'linear-gradient(135deg, #006a4e 0%, #004d37 100%)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '14px',
              letterSpacing: '0.04em',
              flexShrink: 0
            }}>
              NLS <span style={{ fontSize: '9px', fontWeight: 500, color: '#a7f3d0' }}>BD</span>
            </div>
          )}

          <div style={{ height: '22px', width: '1px', backgroundColor: '#cbd5e1', flexShrink: 0 }} />

          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontSize: 'clamp(12px, 3.2vw, 15px)',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {isBmd
                ? 'Upazila Weather Forecast Portal (USF)'
                : isBamis
                ? 'District Agromet Advisory Bulletin (BAMIS)'
                : 'National Livestock Advisory System'}
            </h1>
            <p className="hide-on-tablet-down" style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
            gap: '6px',
            backgroundColor: isLoading ? '#e2e8f0' : themeColor,
            color: isLoading ? '#64748b' : '#ffffff',
            padding: '7px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            border: 'none',
            transition: 'all 0.2s ease',
            boxShadow: isLoading
              ? 'none'
              : `0 2px 6px ${themeColor}35`,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap'
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
          <RefreshCw size={14} className={isLoading ? 'animate-spin-fast' : ''} />
          {/* Responsive label: Short on mobile, full on tablet/desktop */}
          <span className="hide-on-mobile">
            {isLoading
              ? 'Fetching...'
              : isBmd
              ? 'Reload Latest BMD Feed'
              : isBamis
              ? 'Reload Latest BAMIS Feed'
              : activeSection === 'forecast'
              ? 'Reload Latest Forecast'
              : 'Reload Latest Advisory'}
          </span>
          <span className="mobile-only-block" style={{ display: 'none' }}>
            {isLoading ? '...' : 'Reload'}
          </span>
        </button>

        {/* Profile Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 8px 3px 4px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          flexShrink: 0
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: themeColor,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700
          }}>
            NL
          </div>
          <span className="hide-text-on-mobile" style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
            Officer
          </span>
        </div>
      </div>
    </header>
  );
}
