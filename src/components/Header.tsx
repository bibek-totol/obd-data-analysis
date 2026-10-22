'use client';

import React from 'react';
import { RefreshCw, Radio, Globe, Bell, User, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onReload: () => void;
  isLoading: boolean;
  lastUpdated?: string;
  source?: string;
  currentLang: 'EN' | 'বাংলা';
  onLangChange: (lang: 'EN' | 'বাংলা') => void;
}

export default function Header({
  onReload,
  isLoading,
  lastUpdated,
  source = 'BMDWRF',
  currentLang,
  onLangChange
}: HeaderProps) {
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
          <div style={{
            background: 'linear-gradient(135deg, #006a4e 0%, #004d37 100%)',
            color: '#ffffff',
            padding: '5px 12px',
            borderRadius: '6px',
            fontWeight: 800,
            fontSize: '15px',
            letterSpacing: '0.05em'
          }}>
            CARE <span style={{ fontSize: '10px', fontWeight: 500, color: '#a7f3d0' }}>SOUTH ASIA</span>
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: '#cbd5e1' }} />
          <div>
            <h1 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.2
            }}>
              National Livestock Advisory System
            </h1>
            <p style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: 500
            }}>
              Department of Livestock Services (DLS) • Govt. of the People&apos;s Republic of Bangladesh
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions, Refresh, Language, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Live Feed Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
            display: 'inline-block'
          }} />
          <span>Live Feed ({source})</span>
        </div>

        {/* Reload Latest Data Button */}
        <button
          onClick={onReload}
          disabled={isLoading}
          id="btn-reload-latest-data"
          title="Click to fetch fresh real-time 5-day weather data"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isLoading ? '#e2e8f0' : '#006a4e',
            color: isLoading ? '#64748b' : '#ffffff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            boxShadow: isLoading ? 'none' : '0 2px 8px rgba(0, 106, 78, 0.25)',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#00523d';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#006a4e';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <RefreshCw
            size={15}
            style={{
              animation: isLoading ? 'spin 0.8s linear infinite' : 'none'
            }}
          />
          <span>{isLoading ? 'Reloading...' : 'Reload Latest Data'}</span>
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

        {/* Language Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '2px',
          fontSize: '12px',
          fontWeight: 600
        }}>
          <button
            onClick={() => onLangChange('বাংলা')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              backgroundColor: currentLang === 'বাংলা' ? '#ffffff' : 'transparent',
              color: currentLang === 'বাংলা' ? '#0f172a' : '#64748b',
              boxShadow: currentLang === 'বাংলা' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            বাংলা
          </button>
          <button
            onClick={() => onLangChange('EN')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              backgroundColor: currentLang === 'EN' ? '#ffffff' : 'transparent',
              color: currentLang === 'EN' ? '#0f172a' : '#64748b',
              boxShadow: currentLang === 'EN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            EN
          </button>
        </div>

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
