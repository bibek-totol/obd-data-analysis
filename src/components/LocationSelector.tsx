'use client';

import React from 'react';
import { MapPin, Search, ChevronDown, Compass } from 'lucide-react';
import { DistrictItem, UpazilaItem } from '@/lib/nlas-client';

interface LocationSelectorProps {
  districts: DistrictItem[];
  upazilas: UpazilaItem[];
  selectedDistrict: string;
  selectedUpazila: string;
  onDistrictChange: (districtCode: string) => void;
  onUpazilaChange: (upazilaCode: string) => void;
  isLoadingUpazilas: boolean;
}

export default function LocationSelector({
  districts,
  upazilas,
  selectedDistrict,
  selectedUpazila,
  onDistrictChange,
  onUpazilaChange,
  isLoadingUpazilas
}: LocationSelectorProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      {/* District Dropdown */}
      <div style={{ position: 'relative', minWidth: '180px' }}>
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
      <div style={{ position: 'relative', minWidth: '200px' }}>
        <select
          id="select-upazila"
          value={selectedUpazila}
          onChange={(e) => onUpazilaChange(e.target.value)}
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
            upazilas.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))
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
    </div>
  );
}
