'use client';

import React, { useState, useMemo } from 'react';
import {
  DistrictForecastResponseData,
  UpazilaWeatherSummary
} from '@/lib/district-forecast';
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
  Layers,
  ChevronDown,
  Navigation,
  Sparkles
} from 'lucide-react';
import BmdWeatherIcon from './BmdWeatherIcon';

interface DistrictAllUpazilasViewProps {
  districtData: DistrictForecastResponseData;
  isLoading: boolean;
  onSelectUpazila: (upazilaCode: string) => void;
  onReloadDistrict?: () => void;
}

// Helper to format raw government time string e.g. "2026-10-26 00:06:00" to "6:00 AM" or "06:00"
function formatHourlyTime(rawStr: string): string {
  if (!rawStr) return '';
  let timePart = rawStr;
  if (rawStr.includes(' ')) {
    timePart = rawStr.split(' ')[1];
  }
  const parts = timePart.split(':');
  let hour = parseInt(parts[0], 10);
  if (parts.length >= 2 && parts[0] === '00' && parseInt(parts[1], 10) > 0) {
    // Government format "00:HH:00" e.g. "00:06:00" means 06:00
    hour = parseInt(parts[1], 10);
  }
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:00 ${ampm}`;
}

// Helper to format 3-hourly slot range
function formatHourlySlotRange(sStart: string, sEnd: string): { timeSpan: string; dayLabel: string } {
  const startFmt = formatHourlyTime(sStart);
  const endFmt = formatHourlyTime(sEnd);

  // Extract day
  let dayLabel = '';
  if (sStart && sStart.includes(' ')) {
    const datePart = sStart.split(' ')[0]; // "2026-10-26"
    const p = datePart.split('-');
    if (p.length === 3) {
      const day = parseInt(p[2], 10);
      const mIdx = parseInt(p[1], 10) - 1;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dayLabel = `${day} ${months[mIdx] || ''}`;
    }
  }

  const timeSpan = startFmt && endFmt ? `${startFmt} – ${endFmt}` : '3-Hour Interval';
  return { timeSpan, dayLabel };
}

export default function DistrictAllUpazilasView({
  districtData,
  isLoading,
  onSelectUpazila,
  onReloadDistrict
}: DistrictAllUpazilasViewProps) {
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
      list = list.filter(u => u.upazilaName.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'name') return a.upazilaName.localeCompare(b.upazilaName);
      if (sortBy === 'temp-high') return b.current.temperature - a.current.temperature;
      if (sortBy === 'temp-low') return a.current.temperature - b.current.temperature;
      if (sortBy === 'humidity') return b.current.rh - a.current.rh;
      if (sortBy === 'rain') return b.rainToday - a.rainToday;
      return 0;
    });

    return list;
  }, [districtData, searchTerm, sortBy]);

  if (isLoading && (!districtData || !districtData.upazilas || districtData.upazilas.length === 0)) {
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
          color: '#006a4e',
          marginBottom: '16px'
        }}>
          <RefreshCw size={26} className="animate-spin-fast" />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
          Loading All Upazilas in {districtData?.districtName || 'District'}...
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>
          Aggregating and synchronizing real-time BMDWRF meteorological telemetry for all monitored upazilas.
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#006a4e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <MapPin size={15} />
              <span>District-Wide Weather Intelligence</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {districtName} District — All {totalUpazilas} Upazilas Weather Overview
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Real-time meteorological observations, 5-6 day outlooks, and 3-hourly telemetry for every upazila in {districtName}.
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
              <span>Synchronized: {updatedAt}</span>
            </div>

            {onReloadDistrict && (
              <button
                onClick={onReloadDistrict}
                type="button"
                title="Reload Latest District Observations"
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
                <span>Sync District</span>
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
              backgroundColor: '#e8f5f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#006a4e'
            }}>
              <MapPin size={22} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Monitored Upazilas
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                {totalUpazilas} Stations
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Full coverage across {districtName}
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
                District Temperature
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                {metrics.minTemp}°C — {metrics.maxTemp}°C
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                District Average: <strong>{metrics.avgTemp}°C</strong>
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
                Average Humidity
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                {metrics.avgRh}%
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Relative Humidity
              </div>
            </div>
          </div>

          {/* KPI 4: Rainfall Status */}
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
                Rainfall Alert
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {metrics.rainyUpazilasCount > 0
                  ? `${metrics.rainyUpazilasCount} Stations Rain`
                  : 'No Rain Detected'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Max rainfall: <strong>{metrics.maxRain} mm</strong>
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
            placeholder={`Search ${totalUpazilas} upazilas in ${districtName}...`}
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
            onFocus={(e) => e.target.style.borderColor = '#006a4e'}
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
                backgroundColor: globalForecastTab === 'daily' ? '#006a4e' : 'transparent',
                color: globalForecastTab === 'daily' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              <Calendar size={14} />
              <span>5-6 Day Outlook</span>
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
                backgroundColor: globalForecastTab === 'hourly' ? '#006a4e' : 'transparent',
                color: globalForecastTab === 'hourly' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              <Clock size={14} />
              <span>3-Hourly Timeline</span>
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
              <option value="name">Sort: Name (A-Z)</option>
              <option value="temp-high">Sort: Highest Temp</option>
              <option value="temp-low">Sort: Lowest Temp</option>
              <option value="humidity">Sort: Highest Humidity</option>
              <option value="rain">Sort: Highest Rainfall</option>
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
              title="Cards Grid View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewType === 'grid' ? '#006a4e' : 'transparent',
                color: viewType === 'grid' ? '#ffffff' : '#64748b',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewType('table')}
              title="Comparison Table View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewType === 'table' ? '#006a4e' : 'transparent',
                color: viewType === 'table' ? '#ffffff' : '#64748b',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <TableIcon size={14} />
              <span>Table</span>
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
          <p style={{ fontSize: '15px', fontWeight: 600 }}>No upazilas matched your search term "{searchTerm}".</p>
          <button
            onClick={() => setSearchTerm('')}
            style={{
              marginTop: '10px',
              padding: '6px 14px',
              backgroundColor: '#006a4e',
              color: '#ffffff',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Clear Search Filter
          </button>
        </div>
      ) : viewType === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
          gap: '24px'
        }}>
          {filteredUpazilas.map((u) => {
            const cur = u.current;
            const conditionName = cur.condition_name || 'CLEAR';
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
                  e.currentTarget.style.borderColor = '#006a4e';
                  e.currentTarget.style.boxShadow = '0 10px 28px rgba(0, 106, 78, 0.1)';
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
                        backgroundColor: '#e8f5f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#006a4e',
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
                          {u.districtName}, {u.divisionName} Division
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
                      backgroundColor: cur.is_day ? '#fef3c7' : '#e0e7ff',
                      border: cur.is_day ? '1px solid #fde68a' : '1px solid #c7d2fe',
                      color: cur.is_day ? '#b45309' : '#3730a3'
                    }}>
                      {cur.is_day ? <Sun size={13} /> : <Moon size={13} />}
                      <span>{cur.is_day ? 'Day' : 'Night'}</span>
                    </span>
                  </div>

                  {/* Atmospheric Hero Telemetry Box */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #f8fafc 100%)',
                    border: '1px solid #bbf7d0',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 2px 8px rgba(0, 106, 78, 0.04)'
                  }}>
                    {/* Left: Weather condition icon, condition text, rain badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {cur.condition_image ? (
                          <img
                            src={cur.condition_image}
                            alt={conditionName}
                            style={{ width: '52px', height: '52px', objectFit: 'contain' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <BmdWeatherIcon iconType={conditionName} size={50} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          {conditionName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                          <span style={{ color: '#0284c7', fontWeight: 600 }}>Min {cur.temp_min}°C</span>
                          <span>•</span>
                          <span style={{ color: '#dc2626', fontWeight: 700 }}>Max {cur.temp_max}°C</span>
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
                            backgroundColor: u.rainToday > 0 ? '#dbeafe' : '#e8f5f0',
                            color: u.rainToday > 0 ? '#1d4ed8' : '#047857'
                          }}>
                            {u.rainToday > 0 ? <CloudRain size={12} /> : <Sun size={12} />}
                            <span>{u.rainToday > 0 ? `${u.rainToday} mm Rain Expected` : 'No Rain Expected'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Huge current temperature & RealFeel */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '38px', fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.02em' }}>
                        {cur.temperature}°<span style={{ fontSize: '24px', fontWeight: 700, color: '#475569' }}>C</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
                        RealFeel {Math.round(cur.temperature + (cur.rh > 65 ? (cur.rh - 65) * 0.08 : 0))}°C
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
                        <span>Humidity</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                        {cur.rh}%
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Relative</div>
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
                        <span>Wind</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                        {cur.wind_speed} <span style={{ fontSize: '11px', fontWeight: 600 }}>km/h</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#0f766e', fontWeight: 700 }}>{cur.wind_direction}</div>
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
                        <span>Rainfall</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: u.rainToday > 0 ? '#1d4ed8' : '#0f172a', marginTop: '3px' }}>
                        {u.rainToday} <span style={{ fontSize: '11px', fontWeight: 600 }}>mm</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>24h Total</div>
                    </div>

                    {/* Metric 4: Temp Spread */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#dc2626', fontSize: '11px', fontWeight: 700 }}>
                        <Thermometer size={13} />
                        <span>Spread</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                        {Math.round(cur.temp_max - cur.temp_min)}°C
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Diurnal range</div>
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
                          backgroundColor: activeTab === 'daily' ? '#006a4e' : 'transparent',
                          color: activeTab === 'daily' ? '#ffffff' : '#64748b',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Calendar size={13} />
                        <span>5-6 Day Forecast</span>
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
                          backgroundColor: activeTab === 'hourly' ? '#006a4e' : 'transparent',
                          color: activeTab === 'hourly' ? '#ffffff' : '#64748b',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Clock size={13} />
                        <span>3-Hourly Timeline</span>
                      </button>
                    </div>

                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                      {activeTab === 'daily' ? `${u.daily.length} Days Outlook` : 'Next 24h Intervals'}
                    </span>
                  </div>

                  {/* TAB 1: 5-6 DAY FORECAST LIST (APPLE WEATHER STYLE - CLEAN, SPACIOUS, LUXURIOUS) */}
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
                            backgroundColor: dIdx === 0 ? '#f0fdf4' : '#f8fafc',
                            border: dIdx === 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                            borderRadius: '10px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* Day & Date */}
                          <div style={{ width: '90px', flexShrink: 0 }}>
                            <div style={{ fontWeight: 800, color: dIdx === 0 ? '#006a4e' : '#0f172a', fontSize: '13px' }}>
                              {dIdx === 0 ? 'Today' : d.week}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {d.date.slice(0, 6)}
                            </div>
                          </div>

                          {/* Icon & Weather Condition */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '120px' }}>
                            {d.cloud_condition?.image ? (
                              <img
                                src={d.cloud_condition.image}
                                alt={d.cloud_condition.name}
                                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                              />
                            ) : (
                              <Sun size={24} color="#f59e0b" />
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '12px' }}>
                                {d.cloud_condition?.name || 'Sunny'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>Rain: <strong>{d.rf} mm</strong></span>
                                <span>•</span>
                                <span>Hum: <strong>{d.rh}%</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Temperature Bar & Max/Min */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0284c7' }}>
                              {d.temp_min}°C
                            </span>
                            <div style={{
                              width: '54px',
                              height: '5px',
                              borderRadius: '3px',
                              background: 'linear-gradient(90deg, #38bdf8 0%, #f59e0b 50%, #ef4444 100%)',
                              opacity: 0.85
                            }} />
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626' }}>
                              {d.temp_max}°C
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
                            const { timeSpan, dayLabel } = formatHourlySlotRange(step.step_start, step.step_end);
                            return (
                              <div
                                key={sIdx}
                                style={{
                                  minWidth: '125px',
                                  flexShrink: 0,
                                  backgroundColor: sIdx === 0 ? '#f0fdf4' : '#f8fafc',
                                  border: sIdx === 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
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
                                  {dayLabel || 'Today'}
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: sIdx === 0 ? '#006a4e' : '#0f172a' }}>
                                  {timeSpan}
                                </div>

                                {/* Weather Icon */}
                                <div style={{ margin: '4px 0' }}>
                                  {step.cloud_image ? (
                                    <img
                                      src={step.cloud_image}
                                      alt={step.cloud_name}
                                      style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                                    />
                                  ) : (
                                    <Sun size={26} color="#f59e0b" />
                                  )}
                                </div>

                                {/* Temperature */}
                                <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                                  {Math.round(step.temp_avg)}°C
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
                                  {step.cloud_name}
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
                                  <span style={{ color: '#0284c7', fontWeight: 700 }}>💧 {step.rh}%</span>
                                  <span>•</span>
                                  <span style={{ color: '#0f766e', fontWeight: 700 }}>🌬️ {step.windspd}k</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                          No 3-hourly intervals available for this station.
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
                    backgroundColor: '#e8f5f0',
                    color: '#006a4e',
                    border: '1px solid #a7f3d0',
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
                    e.currentTarget.style.backgroundColor = '#006a4e';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e8f5f0';
                    e.currentTarget.style.color = '#006a4e';
                  }}
                >
                  <span>Inspect 3-Hourly Spline Charts</span>
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
                <th style={{ padding: '14px 18px' }}>Upazila & Code</th>
                <th style={{ padding: '14px 18px' }}>Condition</th>
                <th style={{ padding: '14px 18px' }}>Temperature</th>
                <th style={{ padding: '14px 18px' }}>Min / Max</th>
                <th style={{ padding: '14px 18px' }}>Humidity</th>
                <th style={{ padding: '14px 18px' }}>Wind</th>
                <th style={{ padding: '14px 18px' }}>Rainfall Today</th>
                <th style={{ padding: '14px 18px' }}>5-Day Forecast Strip</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUpazilas.map((u, idx) => {
                const cur = u.current;
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
                        <MapPin size={14} color="#006a4e" />
                        <span>{u.upazilaName}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                        Code: #{u.upazilaCode}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {cur.condition_image && (
                          <img src={cur.condition_image} alt="" style={{ width: '26px', height: '26px' }} />
                        )}
                        <span style={{ fontWeight: 600, color: '#334155' }}>{cur.condition_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f172a' }}>{cur.temperature}°C</td>
                    <td style={{ padding: '14px 18px', color: '#64748b' }}>{cur.temp_min}° / {cur.temp_max}°</td>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0284c7' }}>{cur.rh}%</td>
                    <td style={{ padding: '14px 18px', color: '#0f766e', fontWeight: 600 }}>{cur.wind_speed} km/h {cur.wind_direction}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: u.rainToday > 0 ? '#2563eb' : '#64748b' }}>{u.rainToday} mm</td>
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
                            title={`${d.week}: ${d.temp_max}°/${d.temp_min}°, Rain: ${d.rf}mm, Humidity: ${d.rh}%`}
                          >
                            {d.week.slice(0, 1)}:{d.temp_max}°
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <button
                        onClick={() => onSelectUpazila(u.upazilaCode)}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#006a4e',
                          color: '#ffffff',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Inspect Charts
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
