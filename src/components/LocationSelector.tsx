'use client';

import React from 'react';
import { ChevronDown, Compass, LayoutGrid } from 'lucide-react';
import { DistrictItem, UpazilaItem } from '@/lib/nlas-client';

interface LocationSelectorProps {
  districts: DistrictItem[];
  upazilas: UpazilaItem[];
  selectedDistrict: string;
  selectedUpazila: string;
  onDistrictChange: (districtCode: string) => void;
  onUpazilaChange: (upazilaCode: string) => void;
  isLoadingUpazilas: boolean;
  viewMode?: 'single' | 'all';
  onViewModeChange?: (mode: 'single' | 'all') => void;
}

export default function LocationSelector({
  districts,
  upazilas,
  selectedDistrict,
  selectedUpazila,
  onDistrictChange,
  onUpazilaChange,
  isLoadingUpazilas,
  viewMode = 'all',
  onViewModeChange
}: LocationSelectorProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap',
      width: '100%'
    }}>
      {/* District Dropdown */}
      <div style={{ position: 'relative', minWidth: 'min(100%, 160px)', flex: '1 1 160px' }}>
        <select
          id="select-district"
          value={selectedDistrict}
          onChange={(e) => onDistrictChange(e.target.value)}
          style={{
            width: '100%',
            appearance: 'none',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '9px 34px 9px 14px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#1e293b',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'border-color 0.15s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#006a4e'}
          onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
        >
          <option value="" disabled>Select District</option>
          {districts.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#64748b'
          }}
        />
      </div>

      {/* Upazila Dropdown */}
      <div style={{ position: 'relative', minWidth: 'min(100%, 200px)', flex: '1 1 200px' }}>
        <select
          id="select-upazila"
          value={viewMode === 'all' ? 'all' : selectedUpazila}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'all') {
              if (onViewModeChange) onViewModeChange('all');
            } else {
              if (onViewModeChange) onViewModeChange('single');
              onUpazilaChange(val);
            }
          }}
          disabled={isLoadingUpazilas || upazilas.length === 0}
          style={{
            width: '100%',
            appearance: 'none',
            backgroundColor: isLoadingUpazilas ? '#f8fafc' : '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '9px 34px 9px 14px',
            fontSize: '13px',
            fontWeight: 600,
            color: isLoadingUpazilas ? '#94a3b8' : '#1e293b',
            cursor: isLoadingUpazilas ? 'wait' : 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'border-color 0.15s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#006a4e'}
          onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
        >
          {isLoadingUpazilas ? (
            <option>Loading Upazilas...</option>
          ) : upazilas.length === 0 ? (
            <option>No Upazilas found</option>
          ) : (
            <>
              <option value="all" style={{ fontWeight: 700, color: '#006a4e' }}>
                🌐 All Upazilas in District ({upazilas.length})
              </option>
              {upazilas.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </>
          )}
        </select>
        <ChevronDown
          size={16}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#64748b'
          }}
        />
      </div>

      {/* Segmented View Mode Toggle: All Upazilas vs Single Upazila */}
      {onViewModeChange && (
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'rgba(255, 255, 255, 0.18)',
          borderRadius: '8px',
          padding: '3px',
          border: '1px solid rgba(255, 255, 255, 0.28)',
          backdropFilter: 'blur(8px)',
          flexShrink: 0
        }}>
          <button
            onClick={() => onViewModeChange('all')}
            id="btn-viewmode-all"
            type="button"
            title="View All Upazilas of District in One Page"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: viewMode === 'all' ? '#ffffff' : 'transparent',
              color: viewMode === 'all' ? '#006a4e' : '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: viewMode === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <LayoutGrid size={14} />
            <span>All Upazilas ({upazilas.length})</span>
          </button>
          <button
            onClick={() => {
              onViewModeChange('single');
              if (selectedUpazila === 'all' && upazilas.length > 0) {
                onUpazilaChange(upazilas[0].value);
              }
            }}
            id="btn-viewmode-single"
            type="button"
            title="View Single Upazila with 3-Hourly Charts"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: viewMode === 'single' ? '#ffffff' : 'transparent',
              color: viewMode === 'single' ? '#006a4e' : '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: viewMode === 'single' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Compass size={14} />
            <span>Single Upazila</span>
          </button>
        </div>
      )}
    </div>
  );
}
