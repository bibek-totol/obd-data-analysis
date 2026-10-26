'use client';

import React, { useState, useMemo } from 'react';
import {
  BmdDistrictForecastResponseData,
  BmdUpazilaWeatherSummary
} from '@/lib/bmd-district-forecast';
import {
  MapPin,
  Search,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Clock,
  Compass,
  Navigation
} from 'lucide-react';
import BmdWeatherIcon from './BmdWeatherIcon';

interface BmdDistrictAllUpazilasViewProps {
  districtData: BmdDistrictForecastResponseData;
  isLoading: boolean;
  lang: 'en' | 'bn';
  onSelectUpazila: (upazilaCode: string) => void;
  onReloadDistrict?: () => void;
}

export default function BmdDistrictAllUpazilasView({
  districtData,
  isLoading,
  lang,
  onSelectUpazila,
  onReloadDistrict
}: BmdDistrictAllUpazilasViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'temp-high' | 'temp-low' | 'humidity' | 'rain'>('name');
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');

  // Active view tab per card: 'daily' | 'hourly'
  const [cardTabState, setCardTabState] = useState<Record<string, 'daily' | 'hourly'>>({});

  // Global default tab for all cards
  const [globalForecastTab, setGlobalForecastTab] = useState<'daily' | 'hourly'>('daily');

  // Filter & Sort Upazilas
  const filteredUpazilas = useMemo(() => {
    if (!districtData?.upazilas) return [];
    let list = [...districtData.upazilas];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(u =>
        u.upazilaName.toLowerCase().includes(q) ||
        u.upazilaCode.includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'name') return a.upazilaName.localeCompare(b.upazilaName);
      if (sortBy === 'temp-high') return b.hero.temp - a.hero.temp;
      if (sortBy === 'temp-low') return a.hero.temp - b.hero.temp;
      if (sortBy === 'humidity') return b.hero.humidity - a.hero.humidity;
      if (sortBy === 'rain') return b.rainToday - a.rainToday;
      return 0;
    });

    return list;
  }, [districtData, searchTerm, sortBy]);

  if (isLoading || !districtData) {
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
          backgroundColor: '#e0f2fe',
          color: '#0284c7',
          marginBottom: '16px'
        }}>
          <RefreshCw size={26} className="animate-spin-fast" />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
          {lang === 'bn'
            ? `${districtData?.districtName || 'জেলা'}-র সকল উপজেলার আবহাওয়া লোড হচ্ছে...`
            : `Loading All Upazilas in ${districtData?.districtName || 'District'}...`}
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>
          {lang === 'bn'
            ? 'বাংলাদেশ আবহাওয়া অধিদপ্তর (BMDWRF) থেকে লাইভ ডাটা একত্রিত করা হচ্ছে।'
            : 'Aggregating and synchronizing real-time BMDWRF meteorological telemetry for all monitored stations.'}
        </p>
      </div>
    );
  }

  const { metrics, districtName, totalUpazilas, updatedAt } = districtData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* -------------------------------------------------------------
          1. DISTRICT HEADER & KPI TELEMETRY BANNER
         ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        {/* Title & Metadata Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <MapPin size={15} />
              <span>{lang === 'bn' ? 'জেলা ভিত্তিক সার্বিক আবহাওয়া পর্যবেক্ষণ' : 'District-Wide Weather Intelligence'}</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {lang === 'bn'
                ? `${districtName} জেলা — সকল ${metrics.rainyCountFormatted ? totalUpazilas : totalUpazilas}টি উপজেলার আবহাওয়া তথ্য`
                : `${districtName} District — All ${totalUpazilas} Upazilas Weather Overview`}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              {lang === 'bn'
                ? `BMDWRF মডেল ভিত্তিক রিয়েল-টাইম পর্যবেক্ষণ, ৫-৮ দিনের পূর্বাভাস এবং ৩-ঘণ্টার ব্যবধানের ডাটা।`
                : `Real-time meteorological observations, 5-8 day forecasts, and 3-hourly telemetry across all upazilas in ${districtName}.`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '12px',
              color: '#15803d',
              fontWeight: 600
            }}>
              <CheckCircle2 size={14} color="#16a34a" />
              <span>{lang === 'bn' ? `আপডেট: ${updatedAt}` : `Updated: ${updatedAt}`}</span>
            </div>

            {onReloadDistrict && (
              <button
                onClick={onReloadDistrict}
                type="button"
                title={lang === 'bn' ? 'জেলার লাইভ ডাটা পুনরায় লোড করুন' : 'Reload Latest District Observations'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                <RefreshCw size={13} />
                <span>{lang === 'bn' ? 'সিঙ্ক জেলা' : 'Sync District'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Card KPI Stat Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px'
        }}>
          {/* KPI 1: Monitored Upazilas */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0369a1'
            }}>
              <MapPin size={22} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'পর্যবেক্ষিত উপজেলা' : 'Monitored Upazilas'}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                {totalUpazilas} {lang === 'bn' ? 'টি উপজেলা' : 'Stations'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {lang === 'bn' ? `${districtName} জেলায় পূর্ণ কভারেজ` : `Full coverage in ${districtName}`}
              </div>
            </div>
          </div>

          {/* KPI 2: District Temp Range */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626'
            }}>
              <Thermometer size={22} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'জেলার তাপমাত্রা বিস্তার' : 'District Temp Range'}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                {metrics.minTempFormatted} — {metrics.maxTempFormatted}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {lang === 'bn' ? 'গড় তাপমাত্রা: ' : 'District Average: '}
                <strong>{metrics.avgTempFormatted}</strong>
              </div>
            </div>
          </div>

          {/* KPI 3: Average Humidity */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7'
            }}>
              <Droplets size={22} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'গড় আপেক্ষিক আর্দ্রতা' : 'Average Humidity'}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                {metrics.avgRhFormatted}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {lang === 'bn' ? 'বাতাসে জলীয় বাষ্প' : 'Relative Humidity'}
              </div>
            </div>
          </div>

          {/* KPI 4: Rainfall Alert */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: metrics.rainyUpazilasCount > 0 ? '#dbeafe' : '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: metrics.rainyUpazilasCount > 0 ? '#2563eb' : '#64748b'
            }}>
              <CloudRain size={22} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'বৃষ্টিপাত সতর্কতা' : 'Rainfall Alert'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {metrics.rainyUpazilasCount > 0
                  ? (lang === 'bn' ? `${metrics.rainyCountFormatted}টি উপজেলায় বৃষ্টি` : `${metrics.rainyUpazilasCount} Stations Rain`)
                  : (lang === 'bn' ? 'বৃষ্টিপাত নেই' : 'No Rain Detected')}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {lang === 'bn' ? 'সর্বোচ্চ: ' : 'Max rain: '}
                <strong>{metrics.maxRainFormatted}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. SEARCH, SORT & VIEW CONTROLS TOOLBAR
         ------------------------------------------------------------- */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        backgroundColor: '#ffffff',
        padding: '14px 20px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {/* Left: Search Box */}
        <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 260px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder={lang === 'bn' ? `${districtName} জেলার উপজেলা খুঁজুন...` : `Search ${totalUpazilas} upazilas in ${districtName}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#0f172a',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0369a1'}
            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
          />
        </div>

        {/* Center: In-Card Details Selector (when in grid mode) */}
        {viewType === 'grid' && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => {
                setGlobalForecastTab('daily');
                setCardTabState({});
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: globalForecastTab === 'daily' ? '#0369a1' : 'transparent',
                color: globalForecastTab === 'daily' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              <Calendar size={14} />
              <span>{lang === 'bn' ? '৫-৮ দিনের পূর্বাভাস' : '5-8 Day Outlook'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setGlobalForecastTab('hourly');
                setCardTabState({});
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: globalForecastTab === 'hourly' ? '#0369a1' : 'transparent',
                color: globalForecastTab === 'hourly' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              <Clock size={14} />
              <span>{lang === 'bn' ? '৩-ঘণ্টার টাইমলাইন' : '3-Hourly Timeline'}</span>
            </button>
          </div>
        )}

        {/* Right: Sort and View Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={14} color="#64748b" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="name">{lang === 'bn' ? 'সাজান: নাম (অ-ক্ষর)' : 'Sort: Name (A-Z)'}</option>
              <option value="temp-high">{lang === 'bn' ? 'সাজান: সর্বোচ্চ তাপমাত্রা' : 'Sort: Highest Temp'}</option>
              <option value="temp-low">{lang === 'bn' ? 'সাজান: সর্বনিম্ন তাপমাত্রা' : 'Sort: Lowest Temp'}</option>
              <option value="humidity">{lang === 'bn' ? 'সাজান: সর্বোচ্চ আর্দ্রতা' : 'Sort: Highest Humidity'}</option>
              <option value="rain">{lang === 'bn' ? 'সাজান: সর্বোচ্চ বৃষ্টিপাত' : 'Sort: Highest Rainfall'}</option>
            </select>
          </div>

          {/* Layout Toggle: Grid vs Table */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setViewType('grid')}
              title={lang === 'bn' ? 'কার্ড ভিউ' : 'Cards Grid View'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewType === 'grid' ? '#0369a1' : 'transparent',
                color: viewType === 'grid' ? '#ffffff' : '#64748b',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={14} />
              <span>{lang === 'bn' ? 'কার্ড' : 'Cards'}</span>
            </button>
            <button
              onClick={() => setViewType('table')}
              title={lang === 'bn' ? 'সারণী ভিউ' : 'Comparison Table View'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewType === 'table' ? '#0369a1' : 'transparent',
                color: viewType === 'table' ? '#ffffff' : '#64748b',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <TableIcon size={14} />
              <span>{lang === 'bn' ? 'টেবিল' : 'Table'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          3. UPALIZAS CARDS GRID VIEW (CLEAN, SPACIOUS, BEAUTIFUL)
         ------------------------------------------------------------- */}
      {filteredUpazilas.length === 0 ? (
        <div style={{
          padding: '50px 20px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          color: '#64748b'
        }}>
          <p style={{ fontSize: '15px', fontWeight: 600 }}>
            {lang === 'bn'
              ? `"${searchTerm}" নামের কোনো উপজেলা পাওয়া যায়নি।`
              : `No upazilas matched your search term "${searchTerm}".`}
          </p>
          <button
            onClick={() => setSearchTerm('')}
            style={{
              marginTop: '10px',
              padding: '6px 14px',
              backgroundColor: '#0369a1',
              color: '#ffffff',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {lang === 'bn' ? 'অনুসন্ধান মুছুন' : 'Clear Search Filter'}
          </button>
        </div>
      ) : viewType === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
          gap: '24px'
        }}>
          {filteredUpazilas.map((u) => {
            const hero = u.hero;
            const activeTab = cardTabState[u.upazilaCode] || globalForecastTab;

            return (
              <div
                key={u.upazilaCode}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '24px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '20px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0369a1';
                  e.currentTarget.style.boxShadow = '0 10px 28px rgba(3, 105, 161, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';
                }}
              >
                <div>
                  {/* Top Bar: Upazila Name, Code, Day/Night */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: '#e0f2fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0369a1',
                        flexShrink: 0
                      }}>
                        <MapPin size={20} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                            {u.upazilaName}
                          </h4>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#64748b',
                            backgroundColor: '#f1f5f9',
                            padding: '2px 7px',
                            borderRadius: '6px'
                          }}>
                            #{u.upazilaCode}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {u.districtName}, {u.divisionName}
                        </div>
                      </div>
                    </div>

                    {/* Day / Night pill */}
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: hero.isNight ? '#e0e7ff' : '#fef3c7',
                      border: hero.isNight ? '1px solid #c7d2fe' : '1px solid #fde68a',
                      color: hero.isNight ? '#3730a3' : '#b45309'
                    }}>
                      {hero.isNight ? <Moon size={13} /> : <Sun size={13} />}
                      <span>{hero.isNight ? (lang === 'bn' ? 'রাত' : 'Night') : (lang === 'bn' ? 'দিন' : 'Day')}</span>
                    </span>
                  </div>

                  {/* Atmospheric Hero Telemetry Box */}
                  <div style={{
                    background: hero.isNight
                      ? 'linear-gradient(135deg, #f0f4ff 0%, #ffffff 50%, #f8fafc 100%)'
                      : 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f8fafc 100%)',
                    border: '1px solid #bae6fd',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 2px 8px rgba(3, 105, 161, 0.04)'
                  }}>
                    {/* Left: Weather condition icon, condition text, rain badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BmdWeatherIcon iconType={hero.conditionIcon} size={50} isNight={hero.isNight} />
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          {hero.conditionText}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                          <span style={{ color: '#0284c7', fontWeight: 600 }}>
                            {lang === 'bn' ? 'সর্বনিম্ন ' : 'Min '}
                            {u.daily[0]?.tempMin ? `${u.daily[0].tempMin}°` : ''}
                          </span>
                          <span>•</span>
                          <span style={{ color: '#dc2626', fontWeight: 700 }}>
                            {lang === 'bn' ? 'সর্বোচ্চ ' : 'Max '}
                            {u.daily[0]?.tempMax ? `${u.daily[0].tempMax}°` : ''}
                          </span>
                        </div>
                        <div style={{ marginTop: '5px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: u.rainToday > 0 ? '#dbeafe' : '#f0fdf4',
                            color: u.rainToday > 0 ? '#1d4ed8' : '#15803d'
                          }}>
                            {u.rainToday > 0 ? <CloudRain size={12} /> : <Sun size={12} />}
                            <span>
                              {u.rainToday > 0
                                ? (lang === 'bn' ? `${u.rainTodayFormatted} বৃষ্টি প্রত্যাশিত` : `${u.rainTodayFormatted} Rain Expected`)
                                : (lang === 'bn' ? 'বৃষ্টিপাতের সম্ভাবনা নেই' : 'No Rain Expected')}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Huge current temperature & RealFeel */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '38px', fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.02em' }}>
                        {hero.tempFormatted}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
                        {lang === 'bn' ? 'অনুভূত ' : 'RealFeel '}
                        {hero.realFeelFormatted}
                      </div>
                    </div>
                  </div>

                  {/* 4 Clean Metric Badges */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px',
                    marginBottom: '20px'
                  }}>
                    {/* Metric 1: Humidity */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#0284c7', fontSize: '11px', fontWeight: 700 }}>
                        <Droplets size={13} />
                        <span>{lang === 'bn' ? 'আর্দ্রতা' : 'Humidity'}</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                        {hero.humidityFormatted}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {lang === 'bn' ? 'আপেক্ষিক' : 'Relative'}
                      </div>
                    </div>

                    {/* Metric 2: Wind Speed & Direction */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#0f766e', fontSize: '11px', fontWeight: 700 }}>
                        <Wind size={13} />
                        <span>{lang === 'bn' ? 'বাতাস' : 'Wind'}</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                        {hero.windSpeedFormatted}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#0f766e', fontWeight: 700 }}>{hero.windDirectionText}</div>
                    </div>

                    {/* Metric 3: Rain Today */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: u.rainToday > 0 ? '#2563eb' : '#64748b', fontSize: '11px', fontWeight: 700 }}>
                        <CloudRain size={13} />
                        <span>{lang === 'bn' ? 'বৃষ্টিপাত' : 'Rainfall'}</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: u.rainToday > 0 ? '#1d4ed8' : '#0f172a', marginTop: '3px' }}>
                        {u.rainTodayFormatted}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {lang === 'bn' ? 'আজকের' : '24h Total'}
                      </div>
                    </div>

                    {/* Metric 4: Wind Vector Deg */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#7c3aed', fontSize: '11px', fontWeight: 700 }}>
                        <Compass size={13} />
                        <span>{lang === 'bn' ? 'দিক' : 'Direction'}</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                        {hero.windDirectionText}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {hero.windDirectionDeg}°
                      </div>
                    </div>
                  </div>

                  {/* Section Divider with In-Card View Switcher */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '10px'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '8px',
                      padding: '2px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <button
                        type="button"
                        onClick={() => setCardTabState(prev => ({ ...prev, [u.upazilaCode]: 'daily' }))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: activeTab === 'daily' ? '#0369a1' : 'transparent',
                          color: activeTab === 'daily' ? '#ffffff' : '#64748b',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Calendar size={13} />
                        <span>{lang === 'bn' ? '৫-৮ দিনের পূর্বাভাস' : '5-8 Day Forecast'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardTabState(prev => ({ ...prev, [u.upazilaCode]: 'hourly' }))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: activeTab === 'hourly' ? '#0369a1' : 'transparent',
                          color: activeTab === 'hourly' ? '#ffffff' : '#64748b',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Clock size={13} />
                        <span>{lang === 'bn' ? '৩-ঘণ্টার টাইমলাইন' : '3-Hourly Timeline'}</span>
                      </button>
                    </div>

                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                      {activeTab === 'daily'
                        ? (lang === 'bn' ? `${u.daily.length} দিনের পূর্বাভাস` : `${u.daily.length} Days Outlook`)
                        : (lang === 'bn' ? 'পরবর্তী ২৪ ঘণ্টার ধাপ' : 'Next 24h Intervals')}
                    </span>
                  </div>

                  {/* TAB 1: 5-8 DAY FORECAST LIST (APPLE WEATHER STYLE - SPACIOUS & CLEAN) */}
                  {activeTab === 'daily' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                      {u.daily.slice(0, 6).map((d, dIdx) => (
                        <div
                          key={dIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            backgroundColor: dIdx === 0 ? '#f0f9ff' : '#f8fafc',
                            border: dIdx === 0 ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                            borderRadius: '10px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* Day & Date */}
                          <div style={{ width: '90px', flexShrink: 0 }}>
                            <div style={{ fontWeight: 800, color: dIdx === 0 ? '#0369a1' : '#0f172a', fontSize: '13px' }}>
                              {dIdx === 0 ? (lang === 'bn' ? 'আজ' : 'Today') : d.dateWeek}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {d.dateFormatted.slice(0, 6)}
                            </div>
                          </div>

                          {/* Icon & Weather Condition */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '120px' }}>
                            <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <BmdWeatherIcon iconType={d.conditionIcon} size={28} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '12px' }}>
                                {d.conditionText}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{lang === 'bn' ? 'বৃষ্টি: ' : 'Rain: '}<strong>{d.rainFormatted}</strong></span>
                                <span>•</span>
                                <span>{lang === 'bn' ? 'আর্দ্রতা: ' : 'Hum: '}<strong>{d.humidityFormatted}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Temperature Bar & Max/Min */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0284c7' }}>
                              {d.tempMin}°
                            </span>
                            <div style={{
                              width: '54px',
                              height: '5px',
                              borderRadius: '3px',
                              background: 'linear-gradient(90deg, #38bdf8 0%, #f59e0b 50%, #ef4444 100%)',
                              opacity: 0.85
                            }} />
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626' }}>
                              {d.tempMax}°
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 2: 3-HOURLY STEPS TIMELINE (CLEAN HORIZONTAL SCROLL TRACK - NEVER CRAMMED) */}
                  {activeTab === 'hourly' && (
                    <div style={{ marginBottom: '14px' }}>
                      {u.hourly && u.hourly.length > 0 ? (
                        <div style={{
                          display: 'flex',
                          gap: '10px',
                          overflowX: 'auto',
                          paddingBottom: '8px',
                          paddingTop: '2px',
                          scrollbarWidth: 'thin'
                        }}>
                          {u.hourly.slice(0, 8).map((step, sIdx) => {
                            return (
                              <div
                                key={sIdx}
                                style={{
                                  minWidth: '125px',
                                  flexShrink: 0,
                                  backgroundColor: sIdx === 0 ? '#f0f9ff' : '#f8fafc',
                                  border: sIdx === 0 ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                                  borderRadius: '12px',
                                  padding: '12px 10px',
                                  textAlign: 'center',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {/* Date & Time */}
                                <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
                                  {step.dateLabel}
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: sIdx === 0 ? '#0369a1' : '#0f172a' }}>
                                  {step.timeRange}
                                </div>

                                {/* Weather Icon */}
                                <div style={{ margin: '4px 0' }}>
                                  <BmdWeatherIcon iconType={step.conditionIcon} size={28} />
                                </div>

                                {/* Temperature */}
                                <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                                  {step.tempFormatted}
                                </div>

                                {/* Condition Name */}
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#334155',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '110px'
                                }}>
                                  {step.conditionText}
                                </div>

                                {/* Metrics Row */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontSize: '10px',
                                  color: '#64748b',
                                  marginTop: '4px',
                                  paddingTop: '4px',
                                  borderTop: '1px solid #e2e8f0',
                                  width: '100%'
                                }}>
                                  <span style={{ color: '#0284c7', fontWeight: 700 }}>💧 {step.humidityFormatted}</span>
                                  <span>•</span>
                                  <span style={{ color: '#0f766e', fontWeight: 700 }}>🌬️ {step.windSpeedFormatted}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                          {lang === 'bn' ? 'কোনো ৩-ঘণ্টার ধাপ পাওয়া যায়নি।' : 'No 3-hourly intervals available for this station.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Button: Deep 3-Hourly Spline Graphs */}
                <button
                  onClick={() => onSelectUpazila(u.upazilaCode)}
                  type="button"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0369a1';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e0f2fe';
                    e.currentTarget.style.color = '#0369a1';
                  }}
                >
                  <span>{lang === 'bn' ? '৩-ঘণ্টার বিস্তারিত চার্ট ও গ্রাফ দেখুন' : 'Inspect 3-Hourly Spline Charts'}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* -------------------------------------------------------------
            4. UPALIZAS COMPARISON TABLE VIEW (WITH ALL COLUMNS)
           ------------------------------------------------------------- */
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          overflowX: 'auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '12px' }}>
                <th style={{ padding: '14px 18px' }}>#</th>
                <th style={{ padding: '14px 18px' }}>{lang === 'bn' ? 'উপজেলা ও কোড' : 'Upazila & Code'}</th>
                <th style={{ padding: '14px 18px' }}>{lang === 'bn' ? 'অবস্থা' : 'Condition'}</th>
                <th style={{ padding: '14px 18px' }}>{lang === 'bn' ? 'তাপমাত্রা' : 'Temperature'}</th>
                <th style={{ padding: '14px 18px' }}>{lang === 'bn' ? 'সর্বনিম্ন / সর্বোচ্চ' : 'Min / Max'}</th>
                <th style={{ padding: '14px 18px' }}>{lang === 'bn' ? 'আর্দ্রতা' : 'Humidity'}</th>
                <th style={{ padding: '14px 18px' }}>{lang === 'bn' ? 'বাতাস' : 'Wind'}</th>
                <th style={{ padding: '14px 18px' }}>{lang === 'bn' ? 'বৃষ্টিপাত' : 'Rainfall'}</th>
                <th style={{ padding: '14px 18px' }}>{lang === 'bn' ? '৫-দিনের চিত্র' : '5-Day Strip'}</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUpazilas.map((u, idx) => {
                const hero = u.hero;
                return (
                  <tr
                    key={u.upazilaCode}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    <td style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#0369a1" />
                        <span>{u.upazilaName}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                        #{u.upazilaCode}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BmdWeatherIcon iconType={hero.conditionIcon} size={24} />
                        <span style={{ fontWeight: 600, color: '#334155' }}>{hero.conditionText}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f172a' }}>{hero.tempFormatted}</td>
                    <td style={{ padding: '14px 18px', color: '#64748b' }}>
                      {u.daily[0]?.tempMin ? `${u.daily[0].tempMin}°` : ''} / {u.daily[0]?.tempMax ? `${u.daily[0].tempMax}°` : ''}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0284c7' }}>{hero.humidityFormatted}</td>
                    <td style={{ padding: '14px 18px', color: '#0f766e', fontWeight: 600 }}>{hero.windSpeedFormatted} {hero.windDirectionText}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: u.rainToday > 0 ? '#2563eb' : '#64748b' }}>{u.rainTodayFormatted}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {u.daily.slice(0, 5).map((d, dIdx) => (
                          <span
                            key={dIdx}
                            style={{
                              fontSize: '11px',
                              padding: '3px 7px',
                              backgroundColor: '#f1f5f9',
                              borderRadius: '6px',
                              fontWeight: 600,
                              color: '#334155'
                            }}
                            title={`${d.dateWeek}: ${d.tempMax}°/${d.tempMin}°, ${d.rainFormatted}`}
                          >
                            {d.dateWeek.slice(0, 1)}:{d.tempMax}°
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <button
                        onClick={() => onSelectUpazila(u.upazilaCode)}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#0369a1',
                          color: '#ffffff',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {lang === 'bn' ? 'চার্ট দেখুন' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
