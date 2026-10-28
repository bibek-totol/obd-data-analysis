'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BamisAllDistrictsResponse,
  BamisZillaSummary,
  BAMIS_DIVISIONS
} from '@/lib/bamis-all-districts';
import {
  Sprout,
  MapPin,
  Calendar,
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  Cloud,
  Search,
  ArrowUpDown,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  RefreshCw,
  Sun,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface BamisAllDistrictsViewProps {
  data: BamisAllDistrictsResponse;
  isLoading: boolean;
  lang: 'bn' | 'en';
  onSelectDistrict: (districtId: string) => void;
  onReload?: () => void;
}

// Convert numbers to Bengali digits
function toBnDigits(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

// Category color mappings
const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'ধান আমন': { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  'ধান বোরো': { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'সবজি': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'আলু': { bg: '#fefce8', color: '#a16207', border: '#fef08a' },
  'গম': { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'ভুট্টা': { bg: '#fef3c7', color: '#d97706', border: '#fcd34d' },
  'গবাদি পশু': { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' },
  'হাঁসমুরগী': { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
  'মৎস্য': { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  'চিংড়ি ও মৎস্য': { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  'হাওর মৎস্য': { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  'মাছ চাষ': { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  'উদ্যান ফসল': { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  'চা বাগান': { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'পান': { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  'সরিষা': { bg: '#fefce8', color: '#854d0e', border: '#fef08a' },
  'ডাল ফসল': { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
};

function getCategoryBadgeStyle(catName: string) {
  for (const [key, val] of Object.entries(CATEGORY_COLORS)) {
    if (catName.includes(key)) {
      return val;
    }
  }
  return { bg: '#f8fafc', color: '#334155', border: '#e2e8f0' };
}

export default function BamisAllDistrictsView({
  data,
  isLoading,
  lang,
  onSelectDistrict,
  onReload
}: BamisAllDistrictsViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'temp-high' | 'temp-low' | 'rain' | 'advisories'>('name');
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');

  // Filter & Sort Logic
  const filteredDistricts = useMemo(() => {
    if (!data?.districts) return [];
    let list = [...data.districts];

    // Filter by division
    if (selectedDivision !== 'all') {
      const divObj = BAMIS_DIVISIONS.find(d => d.id === selectedDivision);
      if (divObj) {
        list = list.filter(z =>
          z.divisionEn.toLowerCase() === divObj.nameEn.toLowerCase() ||
          z.divisionBn === divObj.nameBn
        );
      }
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(z =>
        z.nameBn.toLowerCase().includes(q) ||
        z.nameEn.toLowerCase().includes(q) ||
        z.divisionBn.toLowerCase().includes(q) ||
        z.divisionEn.toLowerCase().includes(q) ||
        z.advisoryCategories.some(c => c.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'name') {
        return lang === 'bn' ? a.nameBn.localeCompare(b.nameBn) : a.nameEn.localeCompare(b.nameEn);
      }
      if (sortBy === 'temp-high') return b.maxTemp.val - a.maxTemp.val;
      if (sortBy === 'temp-low') return a.minTemp.val - b.minTemp.val;
      if (sortBy === 'rain') return b.rainOutlook.maxVal - a.rainOutlook.maxVal;
      if (sortBy === 'advisories') return b.advisoriesCount - a.advisoriesCount;
      return 0;
    });

    return list;
  }, [data, selectedDivision, searchTerm, sortBy, lang]);

  if (isLoading || !data) {
    return (
      <div style={{
        padding: '70px 20px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#e8f5f0',
          color: '#0c713e',
          marginBottom: '16px'
        }}>
          <RefreshCw size={26} className="animate-spin-fast" />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
          {lang === 'bn'
            ? 'সারাদেশের ৬৪টি জেলার কৃষি আবহাওয়া বুলেটিন একত্রিত করা হচ্ছে...'
            : 'Aggregating Agromet Bulletins for All 64 Districts...'}
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>
          {lang === 'bn'
            ? 'কৃষি সম্প্রসারণ অধিদপ্তর (বামিস) হতে সর্বশেষ বৃষ্টিপাত, তাপমাত্রা এবং ফসল পরামর্শের ডাটা সমন্বয় করা হচ্ছে।'
            : 'Synchronizing real-time agricultural advisories, rainfall forecasts, and temperature spans across all divisions.'}
        </p>
      </div>
    );
  }

  const { metrics, districts, updatedAt } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* -------------------------------------------------------------
          1. NATIONAL AGROMET TELEMETRY & KPI BANNER
         ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '22px 26px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        {/* Banner Top Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#0c713e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>

              <span>{lang === 'bn' ? 'জাতীয় কৃষি আবহাওয়া ও ফসল পরামর্শ ড্যাশবোর্ড' : 'National Agromet Advisory Intelligence'}</span>
            </div>
            <h2 style={{ fontSize: '21px', fontWeight: 800, color: '#0f172a', marginTop: '4px', lineHeight: 1.25 }}>
              {lang === 'bn'
                ? `সারাদেশের সকল ৬৪টি জেলার সার্বিক কৃষি আবহাওয়া ও পরামর্শ তথ্য`
                : `All 64 Districts Agromet Weather & Crop Advisory Overview`}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
              {lang === 'bn'
                ? `কৃষি সম্প্রসারণ অধিদপ্তর (বামিস) • বুলেটিন নং ${toBnDigits(metrics.bulletinNo)} (${metrics.validityWindow})`
                : `Department of Agricultural Extension (BAMIS) • Bulletin No ${metrics.bulletinNo} (${metrics.validityWindow})`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#475569',
              fontWeight: 600
            }}>
              <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
              <span>{lang === 'bn' ? `লাইভ আপডেট: ${updatedAt}` : `Updated: ${updatedAt}`}</span>
            </div>

            {onReload && (
              <button
                onClick={onReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0c713e',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(12, 113, 62, 0.3)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#064e2e'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0c713e'; }}
              >
                <RefreshCw size={13} />
                <span>{lang === 'bn' ? 'তাজা ডাটা আনুন' : 'Refresh Feed'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 KPI Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {/* KPI 1: Total Districts */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                {lang === 'bn' ? 'মোট জেলা ও বিভাগ' : 'Total Districts'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {lang === 'bn' ? `${toBnDigits(districts.length)}টি জেলা` : `${districts.length} Districts`}
              </div>
              <div style={{ fontSize: '11px', color: '#0c713e', fontWeight: 600 }}>
                {lang === 'bn' ? `${toBnDigits(metrics.totalDivisions)}টি বিভাগে বিভক্ত` : `Across ${metrics.totalDivisions} Divisions`}
              </div>
            </div>
          </div>

          {/* KPI 2: Temperature Range */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                {lang === 'bn' ? 'জাতীয় তাপমাত্রা ব্যাপ্তি' : 'National Temp Span'}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {lang === 'bn'
                  ? `${toBnDigits(metrics.minTemp.toFixed(1))}° – ${toBnDigits(metrics.maxTemp.toFixed(1))}°C`
                  : `${metrics.minTemp.toFixed(1)}° – ${metrics.maxTemp.toFixed(1)}°C`}
              </div>
              <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600 }}>
                {lang === 'bn' ? `গড় সর্বোচ্চ: ${toBnDigits(metrics.avgMaxTemp)}°C` : `Avg Max: ${metrics.avgMaxTemp}°C`}
              </div>
            </div>
          </div>

          {/* KPI 3: Rainfall Alert */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                {lang === 'bn' ? 'বৃষ্টিপাতের পূর্বাভাস' : 'Rain Forecast Alert'}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {lang === 'bn'
                  ? `${toBnDigits(metrics.rainyZillasCount)}টি জেলায় বৃষ্টি`
                  : `${metrics.rainyZillasCount} Rainy Districts`}
              </div>
              <div style={{ fontSize: '11px', color: metrics.rainyZillasCount > 0 ? '#2563eb' : '#16a34a', fontWeight: 600 }}>
                {lang === 'bn' ? `সর্বোচ্চ: ${toBnDigits(metrics.maxRainExpected)} মিমি` : `Max Rain: ${metrics.maxRainExpected} mm`}
              </div>
            </div>
          </div>

          {/* KPI 4: Humidity */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                {lang === 'bn' ? 'গড় আপেক্ষিক আর্দ্রতা' : 'Average Humidity'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {lang === 'bn' ? `${toBnDigits(metrics.avgHumidity)}%` : `${metrics.avgHumidity}%`}
              </div>
              <div style={{ fontSize: '11px', color: '#0891b2', fontWeight: 600 }}>
                {lang === 'bn' ? 'ফসল বৃদ্ধিতে সহায়ক' : 'Agro-favorable moisture'}
              </div>
            </div>
          </div>

          {/* KPI 5: Active Bulletin */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                {lang === 'bn' ? 'বুলেটিন নং ও মেয়াদ' : 'Bulletin Window'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                {lang === 'bn' ? `নং ${toBnDigits(metrics.bulletinNo)}` : `No. ${metrics.bulletinNo}`}
              </div>
              <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>
                {metrics.validityWindow}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. DIVISION FILTER PILLS & SEARCH / SORT TOOLBAR
         ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Division Quick Filter Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '5px', marginRight: '4px' }}>
            <Filter size={13} />
            {lang === 'bn' ? 'বিভাগ নির্বাচন:' : 'Filter Division:'}
          </span>

          {BAMIS_DIVISIONS.map((div) => {
            const isSelected = selectedDivision === div.id;
            return (
              <button
                key={div.id}
                onClick={() => setSelectedDivision(div.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 600,
                  border: isSelected ? '1px solid #0c713e' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#e8f5f0' : '#ffffff',
                  color: isSelected ? '#0c713e' : '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{lang === 'bn' ? div.nameBn : div.nameEn}</span>
                <span style={{
                  fontSize: '10px',
                  backgroundColor: isSelected ? '#0c713e' : '#f1f5f9',
                  color: isSelected ? '#ffffff' : '#64748b',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {lang === 'bn' ? toBnDigits(div.count) : div.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Sort and Layout Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '12px'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'bn' ? 'জেলা, বিভাগ বা ফসলের নাম দিয়ে খুঁজুন...' : 'Search by district, division or crop...'}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Controls: Sort & Grid/Table switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={14} style={{ color: '#64748b' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="name">{lang === 'bn' ? 'জেলা নাম (ক-হ)' : 'District Name (A-Z)'}</option>
                <option value="temp-high">{lang === 'bn' ? 'সর্বোচ্চ তাপমাত্রা (বেশি থেকে কম)' : 'Highest Max Temp'}</option>
                <option value="temp-low">{lang === 'bn' ? 'সর্বনিম্ন তাপমাত্রা (কম থেকে বেশি)' : 'Lowest Min Temp'}</option>
                <option value="rain">{lang === 'bn' ? 'বৃষ্টিপাত পূর্বাভাস (বেশি থেকে কম)' : 'Highest Rain Outlook'}</option>
                <option value="advisories">{lang === 'bn' ? 'সর্বাধিক কৃষি পরামর্শ' : 'Most Crop Advisories'}</option>
              </select>
            </div>

            {/* Layout Toggle (Grid / Table) */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: '#f1f5f9',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => setViewType('grid')}
                title="Cards Grid View"
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewType === 'grid' ? '#ffffff' : 'transparent',
                  color: viewType === 'grid' ? '#0c713e' : '#64748b',
                  boxShadow: viewType === 'grid' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                <LayoutGrid size={14} />
                <span>{lang === 'bn' ? 'কার্ড' : 'Grid'}</span>
              </button>

              <button
                onClick={() => setViewType('table')}
                title="Comparison Table View"
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewType === 'table' ? '#ffffff' : 'transparent',
                  color: viewType === 'table' ? '#0c713e' : '#64748b',
                  boxShadow: viewType === 'table' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                <TableIcon size={14} />
                <span>{lang === 'bn' ? 'টেবিল' : 'Table'}</span>
              </button>
            </div>

            {/* Count Badge */}
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, paddingLeft: '4px' }}>
              {lang === 'bn'
                ? `প্রদর্শন: ${toBnDigits(filteredDistricts.length)}টি জেলা`
                : `Showing: ${filteredDistricts.length} Districts`}
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          3. MAIN CONTENT: CARDS GRID VIEW OR COMPARISON TABLE
         ------------------------------------------------------------- */}
      {filteredDistricts.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          color: '#64748b'
        }}>
          <AlertCircle size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            {lang === 'bn' ? 'কোন জেলা পাওয়া যায়নি' : 'No Districts Found'}
          </h4>
          <p style={{ fontSize: '13px' }}>
            {lang === 'bn'
              ? 'অনুগ্রহ করে অনুসন্ধানের শব্দ পরিবর্তন করুন বা অন্য বিভাগ নির্বাচন করুন।'
              : 'Please adjust your search criteria or select another division filter.'}
          </p>
        </div>
      ) : viewType === 'grid' ? (
        /* Cards Grid View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: '16px'
        }}>
          {filteredDistricts.map((z) => {
            const hasRain = z.rainOutlook.hasRain;

            return (
              <div
                key={z.districtId}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 18px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = '#0c713e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {/* Card Header: District Name, Division, Bulletin Tag */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {lang === 'bn' ? z.nameBn : z.nameEn}
                      </h3>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                        ({lang === 'bn' ? z.nameEn : z.nameBn})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: '#e8f5f0',
                        color: '#0c713e',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 700
                      }}>
                        {lang === 'bn' ? `${z.divisionBn} বিভাগ` : `${z.divisionEn} Division`}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>•</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        {lang === 'bn' ? `বুলেটিন নং ${toBnDigits(z.bulletinNo)}` : `Bull. #${z.bulletinNo}`}
                      </span>
                    </div>
                  </div>

                  {/* Rain Forecast Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: hasRain ? '#eff6ff' : '#f0fdf4',
                    color: hasRain ? '#2563eb' : '#15803d',
                    border: hasRain ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
                    flexShrink: 0
                  }}>
                    {hasRain ? <CloudRain size={13} /> : <Sun size={13} />}
                    <span>{hasRain ? (lang === 'bn' ? 'বৃষ্টির সম্ভাবনা' : 'Rain Forecast') : (lang === 'bn' ? 'শুষ্ক আবহাওয়া' : 'Dry / Clear')}</span>
                  </div>
                </div>

                {/* Weather Metrics Strip: Rain, Max/Min Temp, Humidity */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  backgroundColor: '#f8fafc',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #f1f5f9'
                }}>
                  {/* Rain */}
                  <div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CloudRain size={11} style={{ color: '#2563eb' }} />
                      {lang === 'bn' ? '৫ দিনের বৃষ্টি' : '5-Day Rain'}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {z.rainOutlook.range}
                    </div>
                  </div>

                  {/* Max / Min Temp */}
                  <div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Thermometer size={11} style={{ color: '#ea580c' }} />
                      {lang === 'bn' ? 'সর্বোচ্চ তাপমাত্রা' : 'Max Temp'}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                      {z.maxTemp.range}
                    </div>
                  </div>

                  {/* Humidity */}
                  <div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Droplets size={11} style={{ color: '#0891b2' }} />
                      {lang === 'bn' ? 'আর্দ্রতা' : 'Humidity'}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {z.humidity.range}
                    </div>
                  </div>
                </div>

                {/* Wind and Min Temp sub-row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#475569',
                  padding: '0 4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Wind size={12} style={{ color: '#64748b' }} />
                    <span>{lang === 'bn' ? `বাতাস: ${z.wind.speed}` : `Wind: ${z.wind.speed}`}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Compass size={12} style={{ color: '#64748b' }} />
                    <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {z.wind.direction}
                    </span>
                  </div>
                </div>

                {/* Agricultural Advisory Tags */}
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
                    {lang === 'bn' ? 'সক্রিয় ফসল পরামর্শ:' : 'Advisory Categories:'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {z.advisoryCategories.slice(0, 5).map((cat, i) => {
                      const style = getCategoryBadgeStyle(cat);
                      return (
                        <span
                          key={i}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: style.bg,
                            color: style.color,
                            border: `1px solid ${style.border}`
                          }}
                        >
                          {cat}
                        </span>
                      );
                    })}
                    {z.advisoryCategories.length > 5 && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: '#64748b'
                      }}>
                        +{z.advisoryCategories.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Top Advisory Recommendation Excerpt */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderLeft: '3px solid #0c713e',
                  padding: '8px 12px',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '12px',
                  color: '#334155',
                  lineHeight: 1.45
                }}>
                  {z.topAdvisorySnippet}
                </div>

                {/* Card Action Button: Drill down into single district route page */}
                <Link
                  href={`/bamis/${z.districtId}`}
                  onClick={() => {
                    if (onSelectDistrict) onSelectDistrict(z.districtId);
                  }}
                  style={{
                    marginTop: 'auto',
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0c713e',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    boxSizing: 'border-box',
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
                  <span>{lang === 'bn' ? `পূর্ণাঙ্গ ${z.nameBn} জেলা বুলেটিন দেখুন` : `View Full ${z.nameEn} Bulletin`}</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        /* Comparison Table View */
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', width: '45px' }}>#</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>
                    {lang === 'bn' ? 'জেলা (District)' : 'District'}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>
                    {lang === 'bn' ? 'বিভাগ' : 'Division'}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>
                    {lang === 'bn' ? '৫ দিনের বৃষ্টিপাত' : 'Rain Outlook'}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>
                    {lang === 'bn' ? 'সর্বোচ্চ তাপমাত্রা' : 'Max Temp'}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>
                    {lang === 'bn' ? 'সর্বনিম্ন তাপমাত্রা' : 'Min Temp'}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>
                    {lang === 'bn' ? 'আর্দ্রতা (%)' : 'Humidity'}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>
                    {lang === 'bn' ? 'বাতাস' : 'Wind'}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>
                    {lang === 'bn' ? 'সক্রিয় ফসল পরামর্শ' : 'Active Advisories'}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>
                    {lang === 'bn' ? 'অ্যাকশন' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDistricts.map((z, idx) => {
                  const hasRain = z.rainOutlook.hasRain;

                  return (
                    <tr
                      key={z.districtId}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.1s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      onClick={() => {
                        if (onSelectDistrict) onSelectDistrict(z.districtId);
                        router.push(`/bamis/${z.districtId}`);
                      }}
                    >
                      {/* # */}
                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 600 }}>
                        {lang === 'bn' ? toBnDigits(idx + 1) : idx + 1}
                      </td>

                      {/* District Name */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                          {lang === 'bn' ? z.nameBn : z.nameEn}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {lang === 'bn' ? z.nameEn : z.nameBn}
                        </div>
                      </td>

                      {/* Division */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '11px',
                          backgroundColor: '#e8f5f0',
                          color: '#0c713e',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700
                        }}>
                          {lang === 'bn' ? z.divisionBn : z.divisionEn}
                        </span>
                      </td>

                      {/* Rain Outlook */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: hasRain ? '#2563eb' : '#15803d'
                        }}>
                          {hasRain ? <CloudRain size={13} /> : <Sun size={13} />}
                          {z.rainOutlook.range}
                        </span>
                      </td>

                      {/* Max Temp */}
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ea580c' }}>
                        {z.maxTemp.range}
                      </td>

                      {/* Min Temp */}
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0284c7' }}>
                        {z.minTemp.range}
                      </td>

                      {/* Humidity */}
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                        {z.humidity.range}
                      </td>

                      {/* Wind */}
                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        <div>{z.wind.speed}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{z.wind.direction}</div>
                      </td>

                      {/* Active Advisories */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                          {z.advisoryCategories.slice(0, 3).map((cat, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#f1f5f9',
                                color: '#334155'
                              }}
                            >
                              {cat}
                            </span>
                          ))}
                          {z.advisoryCategories.length > 3 && (
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
                              +{z.advisoryCategories.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <Link
                          href={`/bamis/${z.districtId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectDistrict) onSelectDistrict(z.districtId);
                          }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#0c713e',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#0c713e';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.color = '#0c713e';
                          }}
                        >
                          <span>{lang === 'bn' ? 'বুলেটিন' : 'View'}</span>
                          <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
