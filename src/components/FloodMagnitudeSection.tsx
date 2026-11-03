'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Waves,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ShieldAlert,
  Search,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  X,
  Calendar,
  CalendarDays,
  Info
} from 'lucide-react';
import {
  FloodMagnitudeResponse,
  FloodStationItem,
  FloodStatusType,
  FloodSummaryData
} from '@/lib/flood-magnitude-client';
import { useDashboard } from '@/context/DashboardContext';

interface FloodMagnitudeSectionProps {
  initialData?: FloodMagnitudeResponse;
}

function getTodayDhaka(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
}

function formatFloodHumanDate(dateStr: string, isBn = false): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m, d);
  const weekdaysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weekdaysBn = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
  const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthsBn = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

  if (isBn) {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const toBn = (num: number) => String(num).split('').map(c => bnDigits[parseInt(c, 10)] || c).join('');
    return `${weekdaysBn[dateObj.getDay()]}, ${toBn(d)} ${monthsBn[m]}, ${toBn(y)}`;
  }
  return `${weekdaysEn[dateObj.getDay()]}, ${d} ${monthsEn[m]}, ${y}`;
}

function formatStationObsTime(obsStr?: string, fallbackDate = ''): string {
  if (!obsStr) {
    return `${fallbackDate} 09:00 AM`;
  }
  // If obsStr has a timestamp like "2026-10-25 12"
  if (obsStr.includes(' ')) {
    const [dPart, hPart] = obsStr.split(' ');
    const h = parseInt(hPart, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${dPart} ${String(h12).padStart(2, '0')}:00 ${ampm}`;
  }
  if (obsStr.includes('T')) {
    const dPart = obsStr.split('T')[0];
    const timePart = obsStr.split('T')[1]?.slice(0, 5) || '09:00';
    return `${dPart} ${timePart}`;
  }
  return `${obsStr} 09:00 AM`;
}

export default function FloodMagnitudeSection({ initialData }: FloodMagnitudeSectionProps) {
  const { registerReload, setLastUpdated } = useDashboard();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDhaka);
  const [data, setData] = useState<FloodMagnitudeResponse | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBasin, setSelectedBasin] = useState<string>('All Basins');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alert_only' | FloodStatusType>('all');
  const [sortBy, setSortBy] = useState<'name' | 'danger' | 'diff' | 'waterlevel'>('diff');
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Selected station modal / drawer
  const [selectedStation, setSelectedStation] = useState<FloodStationItem | null>(null);

  const loadFloodData = useCallback(async (forceReload = false) => {
    setIsLoading(true);
    if (forceReload) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/nlas/flood-magnitude${forceReload ? '?reload=true' : ''}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSyncTime(timeStr);
          setLastUpdated(`Flood data synced at ${timeStr}`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch flood magnitude telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setLastUpdated]);

  useEffect(() => {
    loadFloodData();
  }, [loadFloodData]);

  // Register reload button in dashboard shell
  useEffect(() => {
    registerReload(() => {
      loadFloodData(true);
    });
  }, [registerReload, loadFloodData]);

  // Date step handlers
  const handleDateShift = (deltaDays: number) => {
    const parts = selectedDate.split('-');
    const cur = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    cur.setDate(cur.getDate() + deltaDays);
    const newStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    setSelectedDate(newStr);
  };

  const handleSetToday = () => {
    setSelectedDate(getTodayDhaka());
  };

  const summary = data?.summary;
  const stations = data?.stations || [];
  const basins = data?.basins || ['All Basins', 'Brahmaputra', 'Ganges', 'Meghna', 'South Eastern Hill'];

  // Filter & Sort stations
  const filteredStations = useMemo(() => {
    let list = [...stations];

    // Basin filter
    if (selectedBasin !== 'All Basins') {
      list = list.filter(s => s.basin.toLowerCase().includes(selectedBasin.toLowerCase()));
    }

    // Status filter
    if (statusFilter === 'alert_only') {
      list = list.filter(s => s.floodStatus === 'Flood' || s.floodStatus === 'Severe Flood' || s.floodStatus === 'Warning');
    } else if (statusFilter !== 'all') {
      list = list.filter(s => s.floodStatus === statusFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s =>
        s.station.toLowerCase().includes(q) ||
        (s.station_bn && s.station_bn.includes(q)) ||
        s.river.toLowerCase().includes(q) ||
        (s.river_bn && s.river_bn.includes(q)) ||
        s.district.toLowerCase().includes(q) ||
        s.basin.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'name') return a.station.localeCompare(b.station);
      if (sortBy === 'danger') return b.dl - a.dl;
      if (sortBy === 'waterlevel') return b.recordedWaterLevel - a.recordedWaterLevel;
      if (sortBy === 'diff') return b.differenceToDl - a.differenceToDl; // highest above DL first
      return 0;
    });

    return list;
  }, [stations, selectedBasin, statusFilter, searchTerm, sortBy]);

  const getStatusColor = (status: FloodStatusType) => {
    switch (status) {
      case 'Severe Flood': return { color: '#7e22ce', bg: '#f3e8ff', border: '#d8b4fe' };
      case 'Flood': return { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' };
      case 'Warning': return { color: '#ea580c', bg: '#ffedd5', border: '#fdba74' };
      case 'Normal': return { color: '#16a34a', bg: '#dcfce7', border: '#86efac' };
      default: return { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* 1. TOP HEADER & TELEMETRY CONTROL */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                <Waves size={13} />
                Flood Forecasting & Warning Centre (FFWC)
              </span>
              <span style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                fontSize: '11px',
                fontWeight: 600
              }}>
                BWDB • NLAS DLS Bangladesh
              </span>
            </div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              {lang === 'en' ? 'National River Flood Magnitude Intelligence' : 'জাতীয় নদ-নদীর বন্যা পরিস্থিতি ও পানি সমতল সূচক'}
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              {lang === 'en'
                ? 'Real-time hydrological water levels, danger level thresholds, and flood forecasts across 150+ river stations.'
                : 'দেশের ১৫০+ নদ-নদী স্টেশনের বর্তমান পানি সমতল, বিপদসীমা ও বন্যা পূর্বাভাস।'}
            </p>
          </div>

          {/* Sync & Language Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {lastSyncTime && (
              <span style={{
                fontSize: '11px',
                color: '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#f8fafc',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <Clock size={12} color="#006a4e" />
                Synced: {lastSyncTime}
              </span>
            )}

            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>

            <button
              onClick={() => loadFloodData(true)}
              disabled={isRefreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#006a4e',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                opacity: isRefreshing ? 0.7 : 1,
                boxShadow: '0 2px 4px rgba(0, 106, 78, 0.2)'
              }}
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin-fast' : ''} />
              {isRefreshing ? 'Syncing...' : 'Reload Flood Data'}
            </button>
          </div>
        </div>

        {/* PROMINENT HYDROLOGICAL OBSERVATION DATE BAR */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Active Hydrological Observation Date Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#0369a1',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'en' ? 'Observation Date & Cycle' : 'পানি সমতল পর্যবেক্ষণ তারিখ ও সময়'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                {formatFloodHumanDate(selectedDate, lang === 'bn')}
              </div>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              fontSize: '11px',
              fontWeight: 700,
              marginLeft: '8px'
            }}>
              <Clock size={13} />
              {lang === 'en' ? 'FFWC 09:00 AM BST Observation Cycle' : 'এফএফডব্লিউসি সকাল ০৯:০০ ঘটিকার পর্যবেক্ষণ'}
            </div>
          </div>

          {/* Date Shift Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => handleDateShift(-1)}
              title="Previous Day"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <input
              type="date"
              id="floodDateInput"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer',
                outline: 'none'
              }}
            />

            <button
              onClick={() => handleDateShift(1)}
              title="Next Day"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={handleSetToday}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: selectedDate === getTodayDhaka() ? '#0369a1' : '#ffffff',
                color: selectedDate === getTodayDhaka() ? '#ffffff' : '#0f172a',
                cursor: 'pointer'
              }}
            >
              {lang === 'en' ? 'Today' : 'আজ'}
            </button>
          </div>
        </div>

        {/* 2. FLOOD TELEMETRY KPI BANNER */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px'
        }}>
          {[
            { label: 'Total Stations', value: summary?.totalStations || stations.length, color: '#0f172a', bg: '#f8fafc' },
            { label: 'Rising 24h', value: summary?.risingCount || 0, icon: TrendingUp, color: '#ea580c', bg: '#ffedd5' },
            { label: 'Falling 24h', value: summary?.fallingCount || 0, icon: TrendingDown, color: '#0284c7', bg: '#e0f2fe' },
            { label: 'Steady 24h', value: summary?.steadyCount || 0, icon: Minus, color: '#64748b', bg: '#f1f5f9' },
            { label: 'Above Danger', value: summary?.aboveDangerCount || 0, icon: AlertTriangle, color: '#dc2626', bg: '#fee2e2' },
            { label: 'Warning Status', value: summary?.warningCount || 0, color: '#ca8a04', bg: '#fef9c3' },
            { label: 'Normal Status', value: summary?.normalCount || stations.length, icon: CheckCircle2, color: '#16a34a', bg: '#dcfce7' }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: item.bg,
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px 12px'
              }}
            >
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: item.color, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. OFFICIAL FLOOD STATUS LEGEND BAR */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '14px 18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={14} color="#006a4e" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
            Official FFWC Flood Magnitude Classification:
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { label: 'Normal: > 50 cm below DL', color: '#16a34a', bg: '#dcfce7' },
            { label: 'Warning: within 50 cm below DL', color: '#ea580c', bg: '#ffedd5' },
            { label: 'Flood: Above DL (0–100 cm)', color: '#dc2626', bg: '#fee2e2' },
            { label: 'Severe Flood: > 1 m Above DL', color: '#7e22ce', bg: '#f3e8ff' }
          ].map((leg, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: leg.bg,
                color: leg.color
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: leg.color }} />
              {leg.label}
            </span>
          ))}
        </div>
      </div>

      {/* 4. BASIN FILTER CHIPS */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        {basins.map(basin => {
          const isSelected = selectedBasin === basin;
          const count = basin === 'All Basins'
            ? stations.length
            : stations.filter(s => s.basin.toLowerCase().includes(basin.toLowerCase())).length;

          return (
            <button
              key={basin}
              onClick={() => setSelectedBasin(basin)}
              style={{
                padding: '8px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                border: isSelected ? '2px solid #006a4e' : '1px solid #cbd5e1',
                backgroundColor: isSelected ? '#e8f5f0' : '#ffffff',
                color: isSelected ? '#006a4e' : '#475569',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{basin}</span>
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: isSelected ? '#006a4e' : '#f1f5f9',
                color: isSelected ? '#ffffff' : '#64748b'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5. CONTROLS: SEARCH, SORT, VIEW SWITCHER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search station, river, or district...' : 'স্টেশন, নদী বা জেলা অনুসন্ধান করুন...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                fontSize: '13px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none'
              }}
            />
          </div>

          {/* Status filter toggle */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses ({stations.length})</option>
            <option value="alert_only">Alerts Only (Warning + Flood)</option>
            <option value="Normal">Normal Only</option>
            <option value="Warning">Warning Only</option>
            <option value="Flood">Flood Only</option>
            <option value="Severe Flood">Severe Flood Only</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="diff">Sort: Highest Water Level vs DL</option>
            <option value="danger">Sort: Highest Danger Level (m)</option>
            <option value="waterlevel">Sort: Highest Water Level (m)</option>
            <option value="name">Sort: Station Name (A-Z)</option>
          </select>
        </div>

        {/* Layout Switcher */}
        <div style={{
          display: 'inline-flex',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setViewType('grid')}
            title="Grid Cards View"
            style={{
              padding: '7px 12px',
              backgroundColor: viewType === 'grid' ? '#f1f5f9' : 'transparent',
              color: viewType === 'grid' ? '#006a4e' : '#64748b',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <LayoutGrid size={15} />
            Cards
          </button>
          <button
            onClick={() => setViewType('table')}
            title="Comparison Table View"
            style={{
              padding: '7px 12px',
              backgroundColor: viewType === 'table' ? '#f1f5f9' : 'transparent',
              color: viewType === 'table' ? '#006a4e' : '#64748b',
              border: 'none',
              borderLeft: '1px solid #cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <TableIcon size={15} />
            Table
          </button>
        </div>
      </div>

      {/* 6. STATIONS LIST / CARDS */}
      {isLoading ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <RefreshCw size={26} className="animate-spin-fast" color="#006a4e" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Loading FFWC Hydrological Telemetry for {formatFloodHumanDate(selectedDate, lang === 'bn')}...
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Synchronizing observed river water levels, danger levels, and flood warnings.
          </p>
        </div>
      ) : filteredStations.length === 0 ? (
        <div style={{
          padding: '50px 20px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            No Stations Found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            No river stations match your search or filter criteria.
          </p>
        </div>
      ) : viewType === 'grid' ? (
        /* GRID CARDS VIEW */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '14px'
        }}>
          {filteredStations.map(station => {
            const statusStyle = getStatusColor(station.floodStatus);
            const isAbove = station.differenceToDl > 0;
            const diffCm = Math.round(station.differenceToDl * 100);

            return (
              <div
                key={station.id || station.web_id}
                style={{
                  backgroundColor: '#ffffff',
                  border: `1px solid ${statusStyle.border}`,
                  borderRadius: '14px',
                  padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Station & River Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {station.station}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 700, marginTop: '2px' }}>
                      River: {station.river}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color
                  }}>
                    {station.floodStatus}
                  </span>
                </div>

                {/* District & Basin & Date Tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569'
                  }}>
                    {station.district} District
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1'
                  }}>
                    {station.basin} Basin
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e8f5f0',
                    color: '#006a4e',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    <Calendar size={10} /> {formatStationObsTime(station.observedAt, selectedDate)}
                  </span>
                </div>

                {/* Water Level Telemetry Matrix */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  backgroundColor: '#f8fafc',
                  padding: '10px',
                  borderRadius: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>WATER LEVEL</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      {station.recordedWaterLevel} <span style={{ fontSize: '10px', fontWeight: 500 }}>m</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>DANGER LEVEL</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#dc2626' }}>
                      {station.dl} <span style={{ fontSize: '10px', fontWeight: 500 }}>m</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>DIFF TO DL</div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: isAbove ? '#dc2626' : station.differenceToDl >= -0.5 ? '#ea580c' : '#16a34a'
                    }}>
                      {isAbove ? `+${diffCm} cm` : `${diffCm} cm`}
                    </div>
                  </div>
                </div>

                {/* 24-Hour Trend & Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700 }}>
                    <span style={{ color: '#64748b' }}>24h Trend:</span>
                    {station.trend24h === 'rising' ? (
                      <span style={{ color: '#ea580c', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <TrendingUp size={13} /> Rising
                      </span>
                    ) : station.trend24h === 'falling' ? (
                      <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <TrendingDown size={13} /> Falling
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Minus size={13} /> Steady
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedStation(station)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#006a4e',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Details & Advice</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPARISON TABLE VIEW */
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Station Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>River Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>District / Basin</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Observation Time</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Danger Level</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Water Level</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Diff vs DL</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>24h Trend</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Flood Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStations.map(station => {
                  const statusStyle = getStatusColor(station.floodStatus);
                  const isAbove = station.differenceToDl > 0;
                  const diffCm = Math.round(station.differenceToDl * 100);

                  return (
                    <tr key={station.id || station.web_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {station.station}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0369a1' }}>
                        {station.river}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <div>{station.district}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{station.basin}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                        {formatStationObsTime(station.observedAt, selectedDate)}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#dc2626' }}>
                        {station.dl} m
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a' }}>
                        {station.recordedWaterLevel} m
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        fontWeight: 700,
                        color: isAbove ? '#dc2626' : station.differenceToDl >= -0.5 ? '#ea580c' : '#16a34a'
                      }}>
                        {isAbove ? `+${diffCm} cm` : `${diffCm} cm`}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        {station.trend24h === 'rising' ? (
                          <span style={{ color: '#ea580c', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <TrendingUp size={13} /> Rising
                          </span>
                        ) : station.trend24h === 'falling' ? (
                          <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <TrendingDown size={13} /> Falling
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Minus size={13} /> Steady
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color
                        }}>
                          {station.floodStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedStation(station)}
                          style={{
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#006a4e',
                            cursor: 'pointer'
                          }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. STATION DETAILS & LIVESTOCK FLOOD ADVISORY MODAL */}
      {selectedStation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {selectedStation.station} – River {selectedStation.river}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {selectedStation.district} District • {selectedStation.basin} Basin
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>•</span>
                  <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> Observed: {formatStationObsTime(selectedStation.observedAt, selectedDate)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStation(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Telemetry Summary Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>WATER LEVEL</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {selectedStation.recordedWaterLevel} m
                  </div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>DANGER LEVEL</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                    {selectedStation.dl} m
                  </div>
                </div>
                <div style={{
                  backgroundColor: getStatusColor(selectedStation.floodStatus).bg,
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${getStatusColor(selectedStation.floodStatus).border}`
                }}>
                  <div style={{ fontSize: '11px', color: getStatusColor(selectedStation.floodStatus).color, fontWeight: 600 }}>
                    FLOOD STATUS
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: getStatusColor(selectedStation.floodStatus).color, marginTop: '2px' }}>
                    {selectedStation.floodStatus}
                  </div>
                </div>
              </div>

              {/* Water Level Gauge Bar */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  <span>Recorded Water Level: {selectedStation.recordedWaterLevel} m</span>
                  <span>Danger Level: {selectedStation.dl} m</span>
                </div>
                <div style={{
                  height: '12px',
                  borderRadius: '6px',
                  backgroundColor: '#e2e8f0',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${Math.min(100, Math.max(10, (selectedStation.recordedWaterLevel / selectedStation.dl) * 100))}%`,
                    backgroundColor: selectedStation.differenceToDl > 0 ? '#dc2626' : selectedStation.differenceToDl >= -0.5 ? '#ea580c' : '#006a4e',
                    borderRadius: '6px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', textAlign: 'right' }}>
                  Difference to Danger Level: <strong>{selectedStation.differenceToDl > 0 ? `+${Math.round(selectedStation.differenceToDl * 100)} cm` : `${Math.round(selectedStation.differenceToDl * 100)} cm`}</strong>
                </div>
              </div>

              {/* Livestock & Poultry Flood Directives */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <ShieldAlert size={16} color="#1d4ed8" />
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a', margin: 0 }}>
                    DLS Flood Emergency Livestock Advisory
                  </h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
                  <li><strong>Shelter & High Ground:</strong> Move cattle, buffalo, goats, and sheep to raised earthen platforms (Mujib Killa) or community flood shelters before water enters lower barns.</li>
                  <li><strong>Dry Fodder Storage:</strong> Elevate dry straw, hay, and concentrates above flood levels on bamboo lofts or covered plastic sheets to prevent mold and mycotoxin poisoning.</li>
                  <li><strong>Drinking Water:</strong> Provide uncontaminated tube-well or purified water to livestock to avoid waterborne bacterial outbreaks (Anthrax, Black Quarter, and Haemorrhagic Septicaemia).</li>
                  <li><strong>Vaccination & Disinfection:</strong> Contact the Upazila Livestock Officer (ULO) for emergency ring vaccination against Anthrax and HS in vulnerable floodplain zones.</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: '#f8fafc'
            }}>
              <button
                onClick={() => setSelectedStation(null)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
