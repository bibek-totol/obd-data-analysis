'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FfwcCombinedData,
  FfwcStation,
  FfwcWaterLevelRecord,
  FfwcTenDaysForecastStation,
  FfwcRainfallStation,
  FloodAlertStatus,
  toBengaliNumeral
} from '@/lib/ffwc-client';
import {
  Waves,
  Activity,
  Droplets,
  Map as MapIcon,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Layers,
  Info,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Compass,
  MapPin,
  Clock,
  ShieldCheck,
  Eye,
  X,
  CloudRain
} from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';

interface FfwcSectionProps {
  initialTab?: 'alerts' | 'hydrograph' | 'observed' | 'maps';
}

export default function FfwcSection({ initialTab = 'alerts' }: FfwcSectionProps) {
  const { registerReload, setIsLoading: setGlobalLoading, setLastUpdated } = useDashboard();

  // Active section tab
  const [activeTab, setActiveTab] = useState<'alerts' | 'hydrograph' | 'observed' | 'maps'>(initialTab);

  // Data state
  const [data, setData] = useState<FfwcCombinedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // UI state
  const [lang, setLang] = useState<'en' | 'bn'>('bn');

  // Tab 1: Flood Alert & Magnitude state
  const [farmerObdOnly, setFarmerObdOnly] = useState<boolean>(false);
  const [alertDistrictSearch, setAlertDistrictSearch] = useState<string>('');
  const [alertStatusFilter, setAlertStatusFilter] = useState<string>('all');

  // Tab 2: Hydrograph state
  const [hydroRiverFilter, setHydroRiverFilter] = useState<string>('all');
  const [hydroDistrictFilter, setHydroDistrictFilter] = useState<string>('all');
  const [hydroStationSearch, setHydroStationSearch] = useState<string>('');
  const [hydroRange, setHydroRange] = useState<'short' | 'medium' | 'monsoon'>('short');
  const [selectedHydroStationId, setSelectedHydroStationId] = useState<number | null>(null);
  const [hydro40Records, setHydro40Records] = useState<FfwcWaterLevelRecord[]>([]);
  const [loadingHydro40, setLoadingHydro40] = useState<boolean>(false);

  // Tab 3: Observed Water Level state
  const [obsRiverSearch, setObsRiverSearch] = useState<string>('all');
  const [obsStationSearch, setObsStationSearch] = useState<string>('');
  const [obsStatusFilter, setObsStatusFilter] = useState<string>('all');
  const [obsTrendFilter, setObsTrendFilter] = useState<string>('all');
  const [activeStationModal, setActiveStationModal] = useState<FfwcStation | null>(null);
  const [modal40Data, setModal40Data] = useState<FfwcWaterLevelRecord[]>([]);
  const [loadingModal40, setLoadingModal40] = useState<boolean>(false);

  // Tab 4: Forecast & Medium Range state
  const [tenDaysSearch, setTenDaysSearch] = useState<string>('');
  const [rainfallSearch, setRainfallSearch] = useState<string>('');
  const [rainfallBasinFilter, setRainfallBasinFilter] = useState<string>('all');

  // Synchronize initialTab prop if changed by parent router
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Load data callback - on demand only
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = isManual ? `/api/ffwc?reload=true&t=${Date.now()}` : '/api/ffwc';
      let res = await fetch(url);
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 400));
        res = await fetch(url);
      }
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json: FfwcCombinedData = await res.json();
      setData(json);

      const timeStr = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setLastSyncTime(timeStr);
      setLastUpdated(timeStr);

      // Default selected hydro station
      if (!selectedHydroStationId && json.stations.length > 0) {
        const defaultStation = json.stations.find(s => s.id === 109) || json.stations[0];
        setSelectedHydroStationId(defaultStation.id);
      }
    } catch (err) {
      console.error('[FFWC Section] Failed to load data:', err);
      setError('Failed to load official FFWC data. Local offline cache is active.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setGlobalLoading(false);
    }
  }, [selectedHydroStationId, setGlobalLoading, setLastUpdated]);

  // Initial load
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Register reload with Header
  useEffect(() => {
    registerReload(() => loadData(true));
  }, [registerReload, loadData]);

  // Fetch 40-day data when hydro station changes
  useEffect(() => {
    if (!selectedHydroStationId) return;

    let isMounted = true;
    setLoadingHydro40(true);
    fetch(`/api/ffwc?type=observed40&stationId=${selectedHydroStationId}`)
      .then(res => res.json())
      .then(json => {
        if (isMounted) {
          setHydro40Records(Array.isArray(json) ? json : []);
          setLoadingHydro40(false);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch 40-day records for hydro station:', err);
        if (isMounted) setLoadingHydro40(false);
      });

    return () => { isMounted = false; };
  }, [selectedHydroStationId]);

  // Fetch 40-day data when modal station is opened
  const openStationHistoryModal = useCallback((station: FfwcStation) => {
    setActiveStationModal(station);
    setLoadingModal40(true);
    setModal40Data([]);

    fetch(`/api/ffwc?type=observed40&stationId=${station.id}`)
      .then(res => res.json())
      .then(json => {
        setModal40Data(Array.isArray(json) ? json : []);
        setLoadingModal40(false);
      })
      .catch(err => {
        console.warn('Failed to fetch modal 40-day data:', err);
        setLoadingModal40(false);
      });
  }, []);

  // Filtered stations for Tab 1 (Alerts)
  const filteredAlertDistricts = useMemo(() => {
    if (!data) return [];
    const latestAlertGroup = data.districtAlerts.length > 0 ? data.districtAlerts[0] : null;
    if (!latestAlertGroup) return [];

    return latestAlertGroup.alerts.filter(item => {
      // Farmer OBD filter: show only Warning, Flood, Severe Flood
      if (farmerObdOnly) {
        if (item.alert_type === 'Normal' || item.alert_type === 'N/A') return false;
      }

      // Status dropdown filter
      if (alertStatusFilter !== 'all' && item.alert_type !== alertStatusFilter) {
        return false;
      }

      // District search
      if (alertDistrictSearch.trim()) {
        const q = alertDistrictSearch.toLowerCase().trim();
        const matchEn = item.district.toLowerCase().includes(q);
        const matchBn = item.district_bn && item.district_bn.includes(q);
        if (!matchEn && !matchBn) return false;
      }

      return true;
    });
  }, [data, farmerObdOnly, alertStatusFilter, alertDistrictSearch]);

  // Filtered stations for Tab 2 (Hydrograph)
  const filteredHydroStations = useMemo(() => {
    if (!data) return [];
    return data.stations.filter(st => {
      if (hydroRiverFilter !== 'all' && st.river !== hydroRiverFilter) return false;
      if (hydroDistrictFilter !== 'all' && st.district !== hydroDistrictFilter) return false;
      if (hydroStationSearch.trim()) {
        const q = hydroStationSearch.toLowerCase().trim();
        const mName = st.station.toLowerCase().includes(q) || (st.station_bn && st.station_bn.includes(q));
        const mRiver = st.river.toLowerCase().includes(q) || (st.river_bn && st.river_bn.includes(q));
        if (!mName && !mRiver) return false;
      }
      return true;
    });
  }, [data, hydroRiverFilter, hydroDistrictFilter, hydroStationSearch]);

  const activeHydroStation = useMemo(() => {
    if (!data || !selectedHydroStationId) return null;
    return data.stations.find(s => s.id === selectedHydroStationId) || data.stations[0];
  }, [data, selectedHydroStationId]);

  // Filtered stations for Tab 3 (Observed Water Level)
  const filteredObservedStations = useMemo(() => {
    if (!data) return [];
    return data.stations.filter(st => {
      if (obsRiverSearch !== 'all' && st.river !== obsRiverSearch) return false;
      if (obsStatusFilter !== 'all' && st.status !== obsStatusFilter) return false;
      if (obsTrendFilter !== 'all' && st.trend24h !== obsTrendFilter) return false;

      if (obsStationSearch.trim()) {
        const q = obsStationSearch.toLowerCase().trim();
        const mSt = st.station.toLowerCase().includes(q) || (st.station_bn && st.station_bn.includes(q));
        const mRv = st.river.toLowerCase().includes(q) || (st.river_bn && st.river_bn.includes(q));
        const mDt = st.district.toLowerCase().includes(q) || (st.district_bn && st.district_bn.includes(q));
        if (!mSt && !mRv && !mDt) return false;
      }
      return true;
    });
  }, [data, obsRiverSearch, obsStatusFilter, obsTrendFilter, obsStationSearch]);

  // Filtered 10-day forecast stations for Tab 4
  const filteredTenDays = useMemo(() => {
    if (!data) return [];
    return data.tenDaysForecast.filter(st => {
      if (tenDaysSearch.trim()) {
        const q = tenDaysSearch.toLowerCase().trim();
        const mName = st.stationName.toLowerCase().includes(q);
        const mRiver = st.riverName.toLowerCase().includes(q);
        if (!mName && !mRiver) return false;
      }
      return true;
    });
  }, [data, tenDaysSearch]);

  // Filtered rainfall stations for Tab 4
  const filteredRainfallStations = useMemo(() => {
    if (!data) return [];
    return data.rainfallStations.filter(st => {
      if (rainfallBasinFilter !== 'all' && st.basin !== rainfallBasinFilter) return false;
      if (rainfallSearch.trim()) {
        const q = rainfallSearch.toLowerCase().trim();
        const mName = st.name.toLowerCase().includes(q);
        const mDistrict = st.district.toLowerCase().includes(q);
        if (!mName && !mDistrict) return false;
      }
      return true;
    });
  }, [data, rainfallBasinFilter, rainfallSearch]);

  const getStatusBadgeStyle = (status: FloodAlertStatus) => {
    switch (status) {
      case 'Severe Flood':
        return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
      case 'Flood':
        return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' };
      case 'Warning':
        return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' };
      case 'Normal':
        return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
      default:
        return { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' };
    }
  };

  const getTrendIcon = (trend?: 'rising' | 'falling' | 'steady') => {
    if (trend === 'rising') return <TrendingUp size={14} color="#dc2626" />;
    if (trend === 'falling') return <TrendingDown size={14} color="#16a34a" />;
    return <Minus size={14} color="#64748b" />;
  };

  // Render SVG Hydrograph chart
  const renderHydrographChart = () => {
    if (!activeHydroStation) return null;

    if (loadingHydro40) {
      return (
        <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <RefreshCw size={24} className="animate-spin-fast" style={{ marginRight: '8px' }} />
          <span>{lang === 'bn' ? 'হাইড্রোগ্রাফ ডাটা লোড হচ্ছে...' : 'Loading hydrograph time-series...'}</span>
        </div>
      );
    }

    if (!hydro40Records || hydro40Records.length === 0) {
      return (
        <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <span>{lang === 'bn' ? 'এই স্টেশনের কোন রেকর্ডকৃত ডাটা পাওয়া যায়নি।' : 'No hydrograph records available for this station.'}</span>
        </div>
      );
    }

    // Sort ascending by date
    const sorted = [...hydro40Records].sort((a, b) => new Date(a.wl_date).getTime() - new Date(b.wl_date).getTime());
    const validWls = sorted.map(d => d.waterlevel).filter(v => v > 0);
    const dl = activeHydroStation.dl;
    const rhwl = Number(activeHydroStation.rhwl) || (validWls.length > 0 ? Math.max(...validWls) * 1.05 : dl * 1.1);

    const minWl = Math.max(0, Math.min(...validWls, dl) * 0.95);
    const maxWl = Math.max(...validWls, dl, rhwl) * 1.03;
    const wlRange = maxWl - minWl || 1;

    const chartW = 750;
    const chartH = 260;
    const padL = 50;
    const padR = 20;
    const padT = 25;
    const padB = 40;
    const innerW = chartW - padL - padR;
    const innerH = chartH - padT - padB;

    const getY = (val: number) => padT + innerH - ((val - minWl) / wlRange) * innerH;
    const getX = (index: number) => padL + (index / (sorted.length - 1 || 1)) * innerW;

    const points = sorted.map((d, i) => `${getX(i).toFixed(1)},${getY(d.waterlevel).toFixed(1)}`).join(' ');
    const dlY = getY(dl);
    const rhwlY = getY(rhwl);

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}>
          {/* Background grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padT + innerH * ratio;
            const val = maxWl - ratio * wlRange;
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                  {val.toFixed(2)}m
                </text>
              </g>
            );
          })}

          {/* RHWL Line (Highest Historical Level) */}
          {rhwl > 0 && rhwlY >= padT && rhwlY <= padT + innerH && (
            <g>
              <line x1={padL} y1={rhwlY} x2={chartW - padR} y2={rhwlY} stroke="#9333ea" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x={chartW - padR} y={rhwlY - 4} textAnchor="end" fontSize="10" fontWeight="700" fill="#9333ea">
                RHWL: {rhwl.toFixed(2)}m
              </text>
            </g>
          )}

          {/* Danger Level (DL) Line */}
          {dl > 0 && dlY >= padT && dlY <= padT + innerH && (
            <g>
              <line x1={padL} y1={dlY} x2={chartW - padR} y2={dlY} stroke="#ef4444" strokeWidth="2" strokeDasharray="5 3" />
              <rect x={padL + 8} y={dlY - 18} width="110" height="16" rx="4" fill="#fee2e2" />
              <text x={padL + 12} y={dlY - 6} fontSize="10" fontWeight="700" fill="#b91c1c">
                Danger Level: {dl.toFixed(2)}m
              </text>
            </g>
          )}

          {/* Water level area fill */}
          <polygon
            points={`${padL},${padT + innerH} ${points} ${chartW - padR},${padT + innerH}`}
            fill="url(#ffwcWaterGrad)"
            opacity="0.25"
          />

          {/* Water level polyline */}
          <polyline
            points={points}
            fill="none"
            stroke="#0891b2"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="ffwcWaterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Date labels on X axis */}
          {sorted.filter((_, idx) => idx % Math.ceil(sorted.length / 7) === 0).map((d, i) => {
            const origIdx = sorted.findIndex(item => item.wl_date === d.wl_date);
            const x = getX(origIdx);
            const dStr = new Date(d.wl_date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric' });
            return (
              <text key={i} x={x} y={chartH - 12} textAnchor="middle" fontSize="10" fill="#64748b">
                {dStr}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ padding: '16px 20px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'inherit' }}>
      {/* 1. Header & Live Telemetry KPI Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #cffafe',
        padding: '20px 24px',
        boxShadow: '0 2px 10px rgba(8, 145, 178, 0.05)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                backgroundColor: '#ecfeff',
                color: '#0891b2',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid #a5f3fc'
              }}>
                {lang === 'bn' ? 'বন্যা পূর্বাভাস ও সতর্কীকরণ কেন্দ্র (FFWC)' : 'Flood Forecasting & Warning Centre (FFWC)'}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {lang === 'bn' ? 'উৎস: বাংলাদেশ পানি উন্নয়ন বোর্ড (BWDB)' : 'Source: Bangladesh Water Development Board (BWDB)'}
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
              {lang === 'bn' ? 'জাতীয় নদী পানি স্তর ও বন্যা পর্যবেক্ষণ প্ল্যাটফর্ম' : 'National River Water Level & Flood Intelligence Hub'}
            </h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              {lang === 'bn'
                ? `সারাদেশের ১৫৩টি গেজিং স্টেশনের রিয়েল-টাইম তথ্য ও ৪টি প্রধান নদী অববাহিকার হাইড্রোগ্রাফ • লাইভ সিঙ্ক: ${lastSyncTime || '11:45 AM'}`
                : `Real-time monitoring across 153 hydrological gauging stations in 4 major river basins • Live Synced: ${lastSyncTime || '11:45 AM'}`}
            </p>
          </div>

          {/* Action buttons & Language toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'inline-flex',
              backgroundColor: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => setLang('bn')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: lang === 'bn' ? '#0891b2' : 'transparent',
                  color: lang === 'bn' ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLang('en')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: lang === 'en' ? '#0891b2' : 'transparent',
                  color: lang === 'en' ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                English
              </button>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid #a5f3fc',
                backgroundColor: isRefreshing ? '#e2e8f0' : '#ecfeff',
                color: isRefreshing ? '#64748b' : '#0e7490',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isRefreshing || loading ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin-fast' : ''} />
              <span>{isRefreshing ? (lang === 'bn' ? 'আপডেট হচ্ছে...' : 'Refreshing...') : (lang === 'bn' ? 'তাজা তথ্য আনুন' : 'Reload FFWC Feed')}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                {lang === 'bn' ? 'মোট পর্যবেক্ষণ স্টেশন' : 'Total Gauging Stations'}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                {lang === 'bn' ? toBengaliNumeral(data.summary.totalStations) : data.summary.totalStations}
              </div>
              <div style={{ fontSize: '11px', color: '#0891b2' }}>
                {lang === 'bn' ? '৪টি প্রধান নদী অববাহিকায়' : 'Across 4 Major River Basins'}
              </div>
            </div>

            <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#15803d' }}>
                {lang === 'bn' ? 'স্বাভাবিক স্তর (বিপৎসীমার ৫০+ সেমি নিচে)' : 'Normal Stage (>50cm below DL)'}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803d', margin: '4px 0' }}>
                {lang === 'bn' ? toBengaliNumeral(data.summary.normalCount) : data.summary.normalCount}
              </div>
              <div style={{ fontSize: '11px', color: '#16a34a' }}>
                {lang === 'bn' ? 'নিরাপদ নদী অঞ্চল' : 'Safe River Reach'}
              </div>
            </div>

            <div style={{ backgroundColor: '#fffbeb', padding: '14px', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#b45309' }}>
                {lang === 'bn' ? 'সতর্কতা স্তর (বিপৎসীমার ৫০ সেমি মধ্যে)' : 'Warning Stage (Within 50cm of DL)'}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#b45309', margin: '4px 0' }}>
                {lang === 'bn' ? toBengaliNumeral(data.summary.warningCount) : data.summary.warningCount}
              </div>
              <div style={{ fontSize: '11px', color: '#d97706' }}>
                {lang === 'bn' ? 'উচ্চ নজরদারি প্রয়োজন' : 'High Monitoring Required'}
              </div>
            </div>

            <div style={{ backgroundColor: '#fef2f2', padding: '14px', borderRadius: '10px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#b91c1c' }}>
                {lang === 'bn' ? 'বিপৎসীমার উপরে (বন্যা আক্রান্ত)' : 'Above Danger Level (Flooded)'}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#b91c1c', margin: '4px 0' }}>
                {lang === 'bn' ? toBengaliNumeral(data.summary.floodCount + data.summary.severeCount) : data.summary.floodCount + data.summary.severeCount}
              </div>
              <div style={{ fontSize: '11px', color: '#dc2626' }}>
                {data.summary.severeCount > 0
                  ? (lang === 'bn' ? `${toBengaliNumeral(data.summary.severeCount)}টি তীব্র বন্যা` : `${data.summary.severeCount} Severe Flood`)
                  : (lang === 'bn' ? 'বর্তমানে কোনো তীব্র বন্যা নেই' : 'No Severe Inundation')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Four Main Section Navigation Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#ffffff',
        padding: '6px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('alerts')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'alerts' ? '#0891b2' : 'transparent',
            color: activeTab === 'alerts' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Waves size={16} />
          <span>{lang === 'bn' ? '১. বন্যা সতর্কতা ও মাত্রা (Flood Alert)' : '1. Flood Alert & Magnitude'}</span>
        </button>

        <button
          onClick={() => setActiveTab('hydrograph')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'hydrograph' ? '#0891b2' : 'transparent',
            color: activeTab === 'hydrograph' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Activity size={16} />
          <span>{lang === 'bn' ? '২. হাইড্রোগ্রাফ ও নদীর পূর্বাভাস (Hydrograph)' : '2. Hydrograph & River Forecast'}</span>
        </button>

        <button
          onClick={() => setActiveTab('observed')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'observed' ? '#0891b2' : 'transparent',
            color: activeTab === 'observed' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Droplets size={16} />
          <span>{lang === 'bn' ? '৩. পানির স্তর ও ৪০ দিনের ইতিহাস (Observed WL)' : '3. Observed Water Level (40 Days)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('maps')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'maps' ? '#0891b2' : 'transparent',
            color: activeTab === 'maps' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <MapIcon size={16} />
          <span>{lang === 'bn' ? '৪. ১০ দিনের আউটলুক ও বৃষ্টিপাত (Forecast & Outlook)' : '4. 10-Day Forecast & Rainfall Outlook'}</span>
        </button>
      </div>

      {/* 3. TAB 1: FLOOD ALERT & MAGNITUDE */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls Bar: Farmer OBD Toggle & District Filters */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            {/* Farmer OBD Relevant Active Status Filter Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setFarmerObdOnly(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: farmerObdOnly ? '1px solid #f97316' : '1px solid #cbd5e1',
                  backgroundColor: farmerObdOnly ? '#fff7ed' : '#f8fafc',
                  color: farmerObdOnly ? '#c2410c' : '#475569',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <AlertTriangle size={15} color={farmerObdOnly ? '#ea580c' : '#64748b'} />
                <span>
                  {farmerObdOnly
                    ? (lang === 'bn' ? 'কৃষক ওবিডি ফিল্টার: সক্রিয় সতর্কতা চালু' : 'Farmer OBD: Active Alerts Only')
                    : (lang === 'bn' ? 'কৃষক ওবিডি: শুধু সক্রিয় সতর্কতা দেখুন' : 'Farmer OBD: Filter Active Alerts')}
                </span>
                <span style={{
                  backgroundColor: farmerObdOnly ? '#ea580c' : '#94a3b8',
                  color: '#ffffff',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 800
                }}>
                  {data ? (data.summary.warningCount + data.summary.floodCount + data.summary.severeCount) : 0}
                </span>
              </button>
            </div>

            {/* District Search & Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'জেলা খুঁজুন...' : 'Search district...'}
                  value={alertDistrictSearch}
                  onChange={(e) => setAlertDistrictSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px 7px 30px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <select
                value={alertStatusFilter}
                onChange={(e) => setAlertStatusFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">{lang === 'bn' ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
                <option value="Normal">{lang === 'bn' ? 'স্বাভাবিক (Normal)' : 'Normal'}</option>
                <option value="Warning">{lang === 'bn' ? 'সতর্কতা (Warning)' : 'Warning'}</option>
                <option value="Flood">{lang === 'bn' ? 'বন্যা (Flood)' : 'Flood'}</option>
                <option value="Severe Flood">{lang === 'bn' ? 'তীব্র বন্যা (Severe Flood)' : 'Severe Flood'}</option>
              </select>
            </div>
          </div>

          {/* District Status Grid */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {lang === 'bn'
                  ? `সারাদেশের জেলাওয়ারী বর্তমান বন্যা স্ট্যাটাস (${filteredAlertDistricts.length}টি জেলা প্রদর্শিত)`
                  : `District-Wise Flood Status Across Bangladesh (${filteredAlertDistricts.length} districts shown)`}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {lang === 'bn' ? 'তারিখ: ০৪ নভেম্বর ২০২৬' : 'Observed Date: 04 Nov 2026'}
              </div>
            </div>

            {filteredAlertDistricts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  {farmerObdOnly
                    ? (lang === 'bn' ? 'কোন জেলায় সক্রিয় বন্যা সতর্কতা নেই!' : 'No Active Flood Warnings Found!')
                    : (lang === 'bn' ? 'কোন ফলাফল মেলেনি।' : 'No matching districts found.')}
                </div>
                <p style={{ fontSize: '12px', margin: '4px 0 0' }}>
                  {farmerObdOnly
                    ? (lang === 'bn' ? 'সারাদেশে সকল পর্যবেক্ষণ জেলায় পানির স্তর স্বাভাবিক রয়েছে।' : 'All monitored districts currently maintain normal water levels below danger thresholds.')
                    : (lang === 'bn' ? 'অনুগ্রহ করে অনুসন্ধানের শব্দ পরিবর্তন করে চেষ্টা করুন।' : 'Please adjust your search criteria or reset filters.')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                {filteredAlertDistricts.map((item, idx) => {
                  const style = getStatusBadgeStyle(item.alert_type);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${style.border}`,
                        backgroundColor: style.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          {lang === 'bn' && item.district_bn ? item.district_bn : item.district}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          {item.district}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        color: style.text,
                        border: `1px solid ${style.border}`,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}>
                        {item.alert_type}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7-Day District Forecast Outlook Matrix */}
          {data && data.districtAlerts.length > 1 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                {lang === 'bn' ? '৭ দিনের জেলাভিত্তিক পূর্বাভাস ট্র্যাকার (7-Day Flood Projection)' : '7-Day District Flood Outlook Matrix'}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>
                        {lang === 'bn' ? 'তারিখ (Date)' : 'Date'}
                      </th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#15803d' }}>
                        {lang === 'bn' ? 'স্বাভাবিক (Normal)' : 'Normal'}
                      </th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#b45309' }}>
                        {lang === 'bn' ? 'সতর্কতা (Warning)' : 'Warning'}
                      </th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#c2410c' }}>
                        {lang === 'bn' ? 'বন্যা (Flood)' : 'Flood'}
                      </th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#b91c1c' }}>
                        {lang === 'bn' ? 'তীব্র বন্যা (Severe)' : 'Severe'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.districtAlerts.map((grp, gIdx) => {
                      const counts = { Normal: 0, Warning: 0, Flood: 0, 'Severe Flood': 0 };
                      grp.alerts.forEach(a => {
                        if (counts[a.alert_type as keyof typeof counts] !== undefined) {
                          counts[a.alert_type as keyof typeof counts]++;
                        }
                      });

                      const dFormatted = new Date(grp.date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });

                      return (
                        <tr key={gIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: 600, color: '#0f172a' }}>
                            {dFormatted} {gIdx === 0 && <span style={{ fontSize: '10px', backgroundColor: '#ecfeff', color: '#0891b2', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px' }}>Today</span>}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', color: '#15803d', fontWeight: 700 }}>
                            {counts.Normal}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', color: counts.Warning > 0 ? '#b45309' : '#94a3b8', fontWeight: 700 }}>
                            {counts.Warning}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', color: counts.Flood > 0 ? '#c2410c' : '#94a3b8', fontWeight: 700 }}>
                            {counts.Flood}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', color: counts['Severe Flood'] > 0 ? '#b91c1c' : '#94a3b8', fontWeight: 700 }}>
                            {counts['Severe Flood']}
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
      )}

      {/* 4. TAB 2: HYDROGRAPH & RIVER STAGES */}
      {activeTab === 'hydrograph' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Hydrograph Filters */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* River Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                  {lang === 'bn' ? 'নদী:' : 'River:'}
                </span>
                <select
                  value={hydroRiverFilter}
                  onChange={(e) => setHydroRiverFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="all">{lang === 'bn' ? 'সকল নদী' : 'All Rivers'}</option>
                  {data?.rivers.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* District Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                  {lang === 'bn' ? 'জেলা:' : 'District:'}
                </span>
                <select
                  value={hydroDistrictFilter}
                  onChange={(e) => setHydroDistrictFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="all">{lang === 'bn' ? 'সকল জেলা' : 'All Districts'}</option>
                  {data?.districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Station Search */}
              <div style={{ position: 'relative', width: '200px' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'স্টেশন খুঁজুন...' : 'Search station...'}
                  value={hydroStationSearch}
                  onChange={(e) => setHydroStationSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Range Switcher (Short Range 5-Day / Medium Range 10-Day / Monsoon) */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => setHydroRange('short')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: hydroRange === 'short' ? '#0891b2' : 'transparent',
                  color: hydroRange === 'short' ? '#ffffff' : '#475569'
                }}
              >
                {lang === 'bn' ? 'স্বল্পমেয়াদী (৫ দিন)' : 'Short Range (5-Day)'}
              </button>
              <button
                onClick={() => setHydroRange('medium')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: hydroRange === 'medium' ? '#0891b2' : 'transparent',
                  color: hydroRange === 'medium' ? '#ffffff' : '#475569'
                }}
              >
                {lang === 'bn' ? 'মধ্যমেয়াদী (১০ দিন)' : 'Medium Range (10-Day)'}
              </button>
              <button
                onClick={() => setHydroRange('monsoon')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: hydroRange === 'monsoon' ? '#0891b2' : 'transparent',
                  color: hydroRange === 'monsoon' ? '#ffffff' : '#475569'
                }}
              >
                {lang === 'bn' ? 'বর্ষা মৌসুম (Monsoon)' : 'Monsoon Season'}
              </button>
            </div>
          </div>

          {/* Active Station Hydrograph Card */}
          {activeHydroStation && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                      {lang === 'bn' && activeHydroStation.station_bn ? activeHydroStation.station_bn : activeHydroStation.station}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      ({activeHydroStation.river} River • {activeHydroStation.district})
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                    {lang === 'bn' ? 'অববাহিকা:' : 'Basin:'} <strong>{activeHydroStation.basin}</strong> • {lang === 'bn' ? 'বিপৎসীমা:' : 'Danger Level:'} <strong style={{ color: '#b91c1c' }}>{activeHydroStation.dl.toFixed(2)}m</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{lang === 'bn' ? 'সর্বশেষ স্তর' : 'Observed Level'}</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0891b2' }}>
                      {activeHydroStation.recordedWaterLevel?.toFixed(2)}m
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{lang === 'bn' ? 'বিপৎসীমার পার্থক্য' : 'Diff to DL'}</div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: (activeHydroStation.differenceToDl || 0) >= 0 ? '#b91c1c' : '#15803d'
                    }}>
                      {(activeHydroStation.differenceToDl || 0) >= 0 ? `+${activeHydroStation.differenceToDl}m` : `${activeHydroStation.differenceToDl}m`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Visualizer */}
              {renderHydrographChart()}

              {/* Chart Legend */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569' }}>
                  <div style={{ width: '16px', height: '3px', backgroundColor: '#0891b2' }} />
                  <span>{lang === 'bn' ? 'পর্যবেক্ষিত পানির স্তর (Observed WL)' : 'Observed Water Level'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569' }}>
                  <div style={{ width: '16px', height: '2px', backgroundColor: '#ef4444', borderTop: '2px dashed #ef4444' }} />
                  <span>{lang === 'bn' ? 'বিপৎসীমা (Danger Level - DL)' : 'Danger Level (DL)'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569' }}>
                  <div style={{ width: '16px', height: '2px', backgroundColor: '#9333ea', borderTop: '2px dashed #9333ea' }} />
                  <span>{lang === 'bn' ? 'ঐতিহাসিক সর্বোচ্চ স্তর (RHWL)' : 'Recorded Highest Water Level (RHWL)'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Station Selector Cards Grid */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              {lang === 'bn' ? 'অন্যান্য স্টেশন নির্বাচন করে হাইড্রোগ্রাফ দেখুন:' : 'Select Any Station to Plot Hydrograph:'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
              {filteredHydroStations.map(st => {
                const isSelected = selectedHydroStationId === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setSelectedHydroStationId(st.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #0891b2' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#ecfeff' : '#f8fafc',
                      color: isSelected ? '#0e7490' : '#334155',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: isSelected ? 800 : 600 }}>
                      {st.station}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      {st.river} • {st.district}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: OBSERVED WATER LEVEL & 40-DAY HISTORY */}
      {activeTab === 'observed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls Bar */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* River Filter */}
              <select
                value={obsRiverSearch}
                onChange={(e) => setObsRiverSearch(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="all">{lang === 'bn' ? 'সকল নদী' : 'All Rivers'}</option>
                {data?.rivers.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={obsStatusFilter}
                onChange={(e) => setObsStatusFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="all">{lang === 'bn' ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
                <option value="Normal">Normal</option>
                <option value="Warning">Warning</option>
                <option value="Flood">Flood</option>
                <option value="Severe Flood">Severe Flood</option>
              </select>

              {/* Trend Filter */}
              <select
                value={obsTrendFilter}
                onChange={(e) => setObsTrendFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="all">{lang === 'bn' ? 'সকল ট্রেন্ড' : 'All Trends'}</option>
                <option value="rising">{lang === 'bn' ? 'বৃদ্ধি পাচ্ছে (Rising)' : 'Rising'}</option>
                <option value="falling">{lang === 'bn' ? 'কমছে (Falling)' : 'Falling'}</option>
                <option value="steady">{lang === 'bn' ? 'অপরিবর্তিত (Steady)' : 'Steady'}</option>
              </select>
            </div>

            {/* Station Search input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'স্টেশন/জেলা খুঁজুন...' : 'Search station or district...'}
                value={obsStationSearch}
                onChange={(e) => setObsStationSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 30px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* High-Density Observed Water Level Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'স্টেশন ও জেলা' : 'Station & District'}</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'নদী ও অববাহিকা' : 'River & Basin'}</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? 'বিপৎসীমা (DL)' : 'Danger Level'}</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? 'পর্যবেক্ষিত স্তর' : 'Observed Level'}</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? 'বিপৎসীমা পার্থক্য' : 'Diff to DL'}</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? 'ট্রেন্ড (২৪ঘণ্টা)' : '24h Trend'}</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? '৪০ দিনের ইতিহাস' : '40-Day History'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredObservedStations.map(st => {
                    const badge = getStatusBadgeStyle(st.status);
                    return (
                      <tr
                        key={st.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.1s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{st.station}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{st.district}</div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#334155' }}>{st.river}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{st.basin}</div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#b91c1c' }}>
                          {st.dl.toFixed(2)}m
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#0891b2' }}>
                          {st.recordedWaterLevel && st.recordedWaterLevel > 0 ? `${st.recordedWaterLevel.toFixed(2)}m` : '-'}
                        </td>
                        <td style={{
                          padding: '10px 14px',
                          textAlign: 'center',
                          fontWeight: 700,
                          color: (st.differenceToDl || 0) >= 0 ? '#b91c1c' : '#15803d'
                        }}>
                          {(st.differenceToDl || 0) >= 0 ? `+${st.differenceToDl}m` : `${st.differenceToDl}m`}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {getTrendIcon(st.trend24h)}
                            <span style={{ fontSize: '11px', textTransform: 'capitalize', color: '#475569' }}>
                              {st.trend24h}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`
                          }}>
                            {st.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => openStationHistoryModal(st)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cffafe',
                              backgroundColor: '#ecfeff',
                              color: '#0891b2',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={13} />
                            <span>{lang === 'bn' ? 'চার্ট দেখুন' : 'View 40D'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: FORECAST, BULLETINS & MEDIUM RANGE OUTLOOK */}
      {activeTab === 'maps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Hydrological Outlook & Forecast Trends Card */}
          {data?.summary.forecastTrends && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    {lang === 'bn' ? 'নদী পরিস্থিতি ও পূর্বাভাসের সার্বিক গতিপ্রকৃতি (Forecast Trends)' : 'Hydrological Outlook & Basin Forecast Trends'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {lang === 'bn' ? 'FFWC গাণিতিক মডেলিং ও আবহাওয়া পূর্বাভাসের ভিত্তিতে আগামী দিনের গতিপ্রকৃতি' : 'Medium-range flood evolution and trend analytics across river systems'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>
                    {lang === 'bn' ? 'উন্নতিশীল অবস্থা (Improving)' : 'Improving Conditions'}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d', margin: '4px 0' }}>
                    {data.summary.forecastTrends.improving.length} {lang === 'bn' ? 'টি জেলা' : 'Districts'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#15803d' }}>
                    {data.summary.forecastTrends.improving.length > 0 ? data.summary.forecastTrends.improving.join(', ') : (lang === 'bn' ? 'বর্তমানে কোনো উন্নতিশীল জেলা নেই' : 'None')}
                  </div>
                </div>

                <div style={{ backgroundColor: '#fef3c7', padding: '14px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309' }}>
                    {lang === 'bn' ? 'নতুন সতর্কতা (New Alerts)' : 'New Warning Alerts'}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#b45309', margin: '4px 0' }}>
                    {data.summary.forecastTrends.new_alerts.length} {lang === 'bn' ? 'টি জেলা' : 'Districts'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#92400e' }}>
                    {data.summary.forecastTrends.new_alerts.length > 0 ? data.summary.forecastTrends.new_alerts.join(', ') : (lang === 'bn' ? 'নতুন কোনো সতর্কবার্তা নেই' : 'No new alerts')}
                  </div>
                </div>

                <div style={{ backgroundColor: '#fff7ed', padding: '14px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#c2410c' }}>
                    {lang === 'bn' ? 'অবনতিশীল অবস্থা (Worsening)' : 'Worsening Trends'}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#c2410c', margin: '4px 0' }}>
                    {data.summary.forecastTrends.worsening.length} {lang === 'bn' ? 'টি জেলা' : 'Districts'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9a3412' }}>
                    {data.summary.forecastTrends.worsening.length > 0 ? data.summary.forecastTrends.worsening.join(', ') : (lang === 'bn' ? 'অবনতিশীল এলাকা নেই' : 'Stable')}
                  </div>
                </div>

                <div style={{ backgroundColor: '#fef2f2', padding: '14px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c' }}>
                    {lang === 'bn' ? 'চলমান তীব্র বন্যা (Persisting Severe)' : 'Persisting Severe Flood'}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#b91c1c', margin: '4px 0' }}>
                    {data.summary.forecastTrends.persisting_severe.length} {lang === 'bn' ? 'টি জেলা' : 'Districts'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#991b1b' }}>
                    {data.summary.forecastTrends.persisting_severe.length > 0 ? data.summary.forecastTrends.persisting_severe.join(', ') : (lang === 'bn' ? 'তীব্র বন্যা মুক্ত' : 'None')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10-Days Medium Range Forecast Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  {lang === 'bn' ? '১০ দিনের মধ্যমেয়াদী নদী পূর্বাভাস (10-Day Medium Range Forecast)' : '10-Day Medium Range River Forecast Outlook'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {lang === 'bn' ? 'গুরুত্বপূর্ণ ২৯টি ট্রানজিশনাল স্টেশনের পূর্বাভাসিত পানির স্তর (মিনিমাম, ম্যাক্সিমাম, গড়)' : 'Projected Water Level Range (Min, Max, Mean) for 29 Core Monitoring Stations'}
                </div>
              </div>

              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'স্টেশন/নদী খুঁজুন...' : 'Search station or river...'}
                  value={tenDaysSearch}
                  onChange={(e) => setTenDaysSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'স্টেশন ও নদী' : 'Station & River'}</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#b91c1c' }}>{lang === 'bn' ? 'বিপৎসীমা' : 'DL'}</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? '১ম দিন (গড়)' : 'Day 1'}</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? '৩য় দিন (গড়)' : 'Day 3'}</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? '৫ম দিন (গড়)' : 'Day 5'}</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? '৭ম দিন (গড়)' : 'Day 7'}</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? '১০ম দিন (গড়)' : 'Day 10'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenDays.map((st, i) => {
                    const days = st.forecastDays;
                    const d1 = days[0];
                    const d3 = days[2];
                    const d5 = days[4];
                    const d7 = days[6];
                    const d10 = days[days.length - 1];

                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{st.stationName}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{st.riverName}</div>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#b91c1c' }}>
                          {st.dangerLevel > 0 ? `${st.dangerLevel.toFixed(2)}m` : '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: '#0891b2' }}>
                          {d1 ? `${d1.mean.toFixed(2)}m` : '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: '#0891b2' }}>
                          {d3 ? `${d3.mean.toFixed(2)}m` : '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: '#0891b2' }}>
                          {d5 ? `${d5.mean.toFixed(2)}m` : '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: '#0891b2' }}>
                          {d7 ? `${d7.mean.toFixed(2)}m` : '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: '#0891b2' }}>
                          {d10 ? `${d10.mean.toFixed(2)}m` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 81-Station Rainfall Observation Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  {lang === 'bn' ? '৮১টি স্টেশনভিত্তিক ২৪ ঘণ্টার বৃষ্টিপাত পর্যবেক্ষণ (Rainfall Stations)' : '81 Station-Based 24-Hour Rainfall Observations'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {lang === 'bn' ? 'বাংলাদেশ পানি উন্নয়ন বোর্ড (BWDB) এর দেশব্যাপী রেইনগেজ নেটওয়ার্ক' : 'BWDB Nationwide Hydro-meteorological Rain Gauge Network'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  value={rainfallBasinFilter}
                  onChange={(e) => setRainfallBasinFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    color: '#334155'
                  }}
                >
                  <option value="all">{lang === 'bn' ? 'সকল অববাহিকা (All Basins)' : 'All River Basins'}</option>
                  {data?.basins.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <div style={{ position: 'relative', width: '200px' }}>
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'স্টেশন/জেলা খুঁজুন...' : 'Search station or district...'}
                    value={rainfallSearch}
                    onChange={(e) => setRainfallSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px 6px 30px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'স্টেশন' : 'Station'}</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'জেলা' : 'District'}</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'অববাহিকা' : 'River Basin'}</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? '২৪ ঘণ্টার বৃষ্টিপাত' : '24h Rainfall'}</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? 'বৃষ্টির মাত্রা' : 'Intensity'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRainfallStations.slice(0, 50).map((rf, idx) => {
                    const rain = rf.total_rainfall;
                    let badge = { text: lang === 'bn' ? 'শুষ্ক' : 'Dry', bg: '#f1f5f9', color: '#64748b' };
                    if (rain > 88) {
                      badge = { text: lang === 'bn' ? 'অতি ভারী বৃষ্টি' : 'Very Heavy', bg: '#fee2e2', color: '#b91c1c' };
                    } else if (rain > 50) {
                      badge = { text: lang === 'bn' ? 'ভারী বৃষ্টি' : 'Heavy', bg: '#ffedd5', color: '#c2410c' };
                    } else if (rain > 20) {
                      badge = { text: lang === 'bn' ? 'মাঝারি বৃষ্টি' : 'Moderate', bg: '#cffafe', color: '#0891b2' };
                    } else if (rain > 0) {
                      badge = { text: lang === 'bn' ? 'হালকা বৃষ্টি' : 'Light Rain', bg: '#e0f2fe', color: '#0284c7' };
                    }

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: '#0f172a' }}>{rf.name}</td>
                        <td style={{ padding: '10px', color: '#475569' }}>{rf.district}</td>
                        <td style={{ padding: '10px', color: '#64748b' }}>{rf.basin}</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 800, color: rain > 0 ? '#0891b2' : '#94a3b8' }}>
                          {rain.toFixed(1)} mm
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            backgroundColor: badge.bg,
                            color: badge.color
                          }}>
                            {badge.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredRainfallStations.length > 50 && (
                <div style={{ textAlign: 'center', padding: '10px', fontSize: '11px', color: '#64748b' }}>
                  {lang === 'bn' ? 'মোট ' + filteredRainfallStations.length + 'টি স্টেশনের মধ্যে প্রথম ৫০টি দেখানো হয়েছে। আরো নির্দিষ্ট করতে সার্চ বা ফিল্টার ব্যবহার করুন।' : 'Showing first 50 of ' + filteredRainfallStations.length + ' stations. Use search to narrow down.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: 40-DAY HISTORICAL WATER LEVEL INSPECTOR */}
      {activeStationModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {activeStationModal.station} — {lang === 'bn' ? 'বিগত ৪০ দিনের পানির স্তর' : 'Past 40 Days Water Level History'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {activeStationModal.river} River • {activeStationModal.district} • Danger Level: <strong style={{ color: '#b91c1c' }}>{activeStationModal.dl}m</strong>
                </div>
              </div>
              <button
                onClick={() => setActiveStationModal(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} color="#475569" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {loadingModal40 ? (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin-fast" style={{ marginRight: '8px' }} />
                  <span>{lang === 'bn' ? '৪০ দিনের ডাটা লোড হচ্ছে...' : 'Loading 40-day telemetry records...'}</span>
                </div>
              ) : modal40Data.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  {lang === 'bn' ? 'কোন তথ্য পাওয়া যায়নি।' : 'No historical data found for this station.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Summary metric banner */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ backgroundColor: '#ecfeff', padding: '10px', borderRadius: '8px', border: '1px solid #cffafe' }}>
                      <div style={{ fontSize: '10px', color: '#0891b2', fontWeight: 600 }}>{lang === 'bn' ? 'সর্বশেষ পানির স্তর' : 'Latest Water Level'}</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0e7490' }}>
                        {modal40Data[0]?.waterlevel}m
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: '10px', color: '#b91c1c', fontWeight: 600 }}>{lang === 'bn' ? 'বিপৎসীমা (DL)' : 'Danger Level'}</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#991b1b' }}>
                        {activeStationModal.dl}m
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>{lang === 'bn' ? 'সর্বোচ্চ স্তর (৪০ দিনে)' : '40-Day Peak'}</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#334155' }}>
                        {Math.max(...modal40Data.map(d => d.waterlevel)).toFixed(2)}m
                      </div>
                    </div>
                  </div>

                  {/* History Table */}
                  <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                          <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? 'পানির স্তর (Water Level)' : 'Water Level'}</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#b91c1c' }}>{lang === 'bn' ? 'বিপৎসীমা' : 'Danger Level'}</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? 'অবস্থা' : 'Condition'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modal40Data.slice(0, 60).map((rec, rIdx) => {
                          const diff = rec.waterlevel - rec.dangerlevel;
                          const isAboveDl = diff >= 0;
                          return (
                            <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '6px 8px', color: '#0f172a' }}>
                                {new Date(rec.wl_date).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: '#0891b2' }}>
                                {rec.waterlevel.toFixed(2)}m
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#b91c1c' }}>
                                {rec.dangerlevel.toFixed(2)}m
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  backgroundColor: isAboveDl ? '#fee2e2' : '#dcfce7',
                                  color: isAboveDl ? '#b91c1c' : '#15803d'
                                }}>
                                  {isAboveDl ? `+${diff.toFixed(2)}m Above DL` : `${Math.abs(diff).toFixed(2)}m Below DL`}
                                </span>
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

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                FFWC Project 2026 Telemetry • BWDB
              </span>
              <button
                onClick={() => setActiveStationModal(null)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
