'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BmdLiveResponseData,
  BmdLiveStationData,
  toBengaliNumeral,
  generateServer6Fallback
} from '@/lib/server6-bmd-client';
import {
  Cloud,
  CloudSun,
  Sun,
  Sunrise,
  Sunset,
  Wind,
  Droplets,
  Gauge,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  MapPin,
  Calendar,
  X,
  FileText,
  Activity,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';

interface BmdLiveSectionProps {
  initialStationId?: string;
}

export default function BmdLiveSection({ initialStationId }: BmdLiveSectionProps = {}) {
  const { registerReload, setIsLoading: setGlobalLoading, setLastUpdated } = useDashboard();

  // Data states
  const [data, setData] = useState<BmdLiveResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // UI Filter states
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('1'); // Default Dhaka
  const [selectedStationId, setSelectedStationId] = useState<string>(initialStationId || '58'); // Default Faridpur (matches user screenshot)
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [viewMode, setViewMode] = useState<'portal' | 'all'>('portal'); // 'portal' = Image 1 & 2 layout; 'all' = 63 stations table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detailModalStation, setDetailModalStation] = useState<BmdLiveStationData | null>(null);
  const dataRef = useRef<BmdLiveResponseData | null>(null);

  // Fetch data - only invoked on initial mount or when user clicks reload/refresh
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = isManual ? `/api/bmd-live/forecast?reload=true&t=${Date.now()}` : '/api/bmd-live/forecast';
      let res = await fetch(url);
      if (!res.ok) {
        await new Promise(r => setTimeout(r, 400));
        res = await fetch(url);
      }
      const json = await res.json();
      if (json.success && json.data) {
        dataRef.current = json.data;
        setData(json.data);
        const timeStr = new Date().toLocaleTimeString();
        setLastSyncTime(timeStr);
        setLastUpdated(timeStr);
      } else {
        throw new Error(json.error || 'Failed to parse BMD Live data');
      }
    } catch (err) {
      console.warn('Using fallback dataset:', err);
      if (!dataRef.current) {
        const fb = generateServer6Fallback();
        dataRef.current = fb;
        setData(fb);
      }
      setError('Live connection delayed, displaying latest verified reserve observation.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setGlobalLoading(false);
    }
  }, [setGlobalLoading, setLastUpdated]);

  // Initial mount: only fetches once when page loads or reloads
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Register header reload button: only triggered when user clicks "Reload BMD Live Data"
  useEffect(() => {
    registerReload(() => {
      loadData(true);
    });
  }, [registerReload, loadData]);

  // Active Divisions & Stations lists
  const divisions = useMemo(() => data?.divisions || [], [data]);
  const allStations = useMemo(() => data?.stations || [], [data]);

  // Stations filtered by selected division
  const divisionStations = useMemo(() => {
    if (!selectedDivisionId || selectedDivisionId === 'all') return allStations;
    return allStations.filter(s => s.divisionId === selectedDivisionId);
  }, [allStations, selectedDivisionId]);

  // Current active station for the portal view
  const currentStation = useMemo(() => {
    const found = allStations.find(s => s.id === selectedStationId);
    if (found) return found;
    // Default to Faridpur (id 58) or first station in selected division
    const faridpur = allStations.find(s => s.name.toLowerCase() === 'faridpur');
    if (faridpur) return faridpur;
    return divisionStations[0] || allStations[0] || null;
  }, [allStations, selectedStationId, divisionStations]);

  // When division changes, update selected station if current station not in that division
  const handleDivisionChange = (divId: string) => {
    setSelectedDivisionId(divId);
    const inDiv = allStations.filter(s => s.divisionId === divId);
    if (inDiv.length > 0 && !inDiv.some(s => s.id === selectedStationId)) {
      setSelectedStationId(inDiv[0].id);
    }
  };

  // Quick jump via [Division] - [Station] combined dropdown (Image 1 feature)
  const handleQuickJump = (stationId: string) => {
    const target = allStations.find(s => s.id === stationId);
    if (target) {
      setSelectedStationId(target.id);
      setSelectedDivisionId(target.divisionId);
    }
  };

  // Filtered stations for "All Stations Comparison" view
  const filteredStations = useMemo(() => {
    return allStations.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nameBn.includes(searchQuery) ||
        s.divisionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.divisionNameBn.includes(searchQuery) ||
        s.today.condition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDiv = selectedDivisionId === 'all' || s.divisionId === selectedDivisionId;
      return matchSearch && matchDiv;
    });
  }, [allStations, searchQuery, selectedDivisionId]);

  if (loading && !data) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        minHeight: '400px'
      }}>
        <RefreshCw size={36} color="#1d76a2" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        <h3 style={{ marginTop: '16px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
          Connecting to BMD Live Meteorological Server (server6.bmd.gov.bd)...
        </h3>
        <p style={{ marginTop: '6px', fontSize: '13px', color: '#64748b' }}>
          Fetching real-time surface observations, diurnal humidity & next-day forecasts
        </p>
      </div>
    );
  }

  const isBn = lang === 'bn';

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* ============================================================== */}
      {/* 1. TOP HEADER & TELEMETRY CONTROL BAR */}
      {/* ============================================================== */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Left: Branding & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                {isBn ? 'বাংলাদেশ আবহাওয়া অধিদপ্তর (BMD লাইভ পোর্টাল)' : 'Bangladesh Meteorological Department (BMD)'}
              </h1>
              <span style={{
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid #bae6fd'
              }}>
                server6.bmd.gov.bd
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0', fontWeight: 500 }}>
              {isBn
                ? 'জাতীয় আবহাওয়া পর্যবেক্ষণ কেন্দ্র • দৈনন্দিন পূর্বাভাস ও আর্দ্রতা তথ্য'
                : 'National Weather Forecasting Center • Real-Time Daily Observations & Next-Day Outlook'}
            </p>
          </div>
        </div>

        {/* Right: Controls & Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle: Portal View vs All Stations View */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setViewMode('portal')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: viewMode === 'portal' ? '#ffffff' : 'transparent',
                color: viewMode === 'portal' ? '#1d76a2' : '#64748b',
                boxShadow: viewMode === 'portal' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <CloudSun size={15} />
              <span>{isBn ? 'স্টেশন পোর্টাল' : 'Station Portal'}</span>
            </button>
            <button
              onClick={() => setViewMode('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: viewMode === 'all' ? '#ffffff' : 'transparent',
                color: viewMode === 'all' ? '#1d76a2' : '#64748b',
                boxShadow: viewMode === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={15} />
              <span>{isBn ? 'সকল স্টেশন' : 'All 46 Stations'}</span>
            </button>
          </div>

          {/* Bilingual Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setLang('en')}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: lang === 'en' ? '#1d76a2' : 'transparent',
                color: lang === 'en' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              EN
            </button>
            <button
              onClick={() => setLang('bn')}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: lang === 'bn' ? '#1d76a2' : 'transparent',
                color: lang === 'bn' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              বাং
            </button>
          </div>

          {/* Sync / Reload Button */}
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            title="Fetch real-time data from server6.bmd.gov.bd"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} color="#1d76a2" />
            <span>{isRefreshing ? (isBn ? 'আপডেট হচ্ছে...' : 'Syncing...') : (isBn ? 'রিফ্রেশ' : 'Reload')}</span>
          </button>
        </div>
      </div>

      {/* Real-time sync timestamp badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#64748b',
        fontWeight: 500,
        marginBottom: '16px',
        padding: '0 4px',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 6px #10b981'
          }} />
          <span>
            {isBn
              ? `সর্বশেষ সিঙ্ক: ${toBengaliNumeral(lastSyncTime || 'অন-ডিমান্ড')} • সোর্স: BMD Live Server 6`
              : `Live Synced: ${lastSyncTime || 'On Demand'} • Source: BMD Live Server 6 (Official)`}
          </span>
        </div>
        {error && (
          <span style={{ color: '#d97706', fontWeight: 600 }}>
            {error}
          </span>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. NATIONAL KPI SUMMARY METRICS BANNER */}
      {/* ============================================================== */}
      {data?.metrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {/* Card 1: Total Stations */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              {isBn ? 'মোট পর্যবেক্ষণ কেন্দ্র' : 'Monitored Stations'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {isBn ? `${toBengaliNumeral(data.metrics.totalStations)} টি` : `${data.metrics.totalStations} Stations`}
            </div>
            <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px', fontWeight: 600 }}>
              {isBn ? '৮ বিভাগ জুড়ে সক্রিয়' : 'Across 8 Divisions'}
            </div>
          </div>

          {/* Card 2: Temperature Range */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              {isBn ? 'জাতীয় তাপমাত্রা সীমা' : 'National Temp Range'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#ea580c', marginTop: '4px' }}>
              {isBn
                ? `${toBengaliNumeral(data.metrics.tempMax)}° / ${toBengaliNumeral(data.metrics.tempMin)}°C`
                : `${data.metrics.tempMax}° / ${data.metrics.tempMin}°C`}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
              {isBn ? `গড় সর্বোচ্চ: ${toBengaliNumeral(data.metrics.avgTemp)}°C` : `Avg Max: ${data.metrics.avgTemp}°C`}
            </div>
          </div>

          {/* Card 3: Humidity Spectrum */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              {isBn ? 'গড় সকাল/সন্ধ্যা আর্দ্রতা' : 'Diurnal Humidity Avg'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
              {isBn
                ? `${toBengaliNumeral(data.metrics.avgMorningHumidity)}% / ${toBengaliNumeral(data.metrics.avgEveningHumidity)}%`
                : `${data.metrics.avgMorningHumidity}% / ${data.metrics.avgEveningHumidity}%`}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
              {isBn ? 'সকাল ও সন্ধ্যার আর্দ্রতা' : 'Morning / Evening RH'}
            </div>
          </div>

          {/* Card 4: Rainy Stations Alert */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              {isBn ? 'বৃষ্টিপাত রেকর্ডকৃত স্টেশন' : 'Rain Recorded Today'}
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 800,
              color: data.metrics.rainyStationsCount > 0 ? '#2563eb' : '#059669',
              marginTop: '4px'
            }}>
              {isBn
                ? `${toBengaliNumeral(data.metrics.rainyStationsCount)} টি কেন্দ্রে বৃষ্টি`
                : `${data.metrics.rainyStationsCount} Stations`}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
              {data.metrics.rainyStationsCount === 0
                ? (isBn ? 'সারাদেশে শুষ্ক ও অনুকূল আবহাওয়া' : 'Dry conditions nationwide')
                : (isBn ? 'স্থানীয়ভাবে হালকা বৃষ্টি' : 'Localized showers recorded')}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MAIN SECTION: PORTAL VIEW (MATCHES USER IMAGES 1 & 2) */}
      {/* ============================================================== */}
      {viewMode === 'portal' && currentStation && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '24px',
            alignItems: 'start'
          }}>
            {/* LEFT COLUMN: Division, Station, Buttons & Bulletin (Image 2 Left Sidebar) */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Division Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  {isBn ? 'বিভাগ নির্বাচন' : 'Division'}
                </label>
                <select
                  value={selectedDivisionId}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {isBn ? div.nameBn : div.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Station Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  {isBn ? 'স্টেশন নির্বাচন' : 'Station'}
                </label>
                <select
                  value={currentStation.id}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {divisionStations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {isBn ? st.nameBn : st.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons: View Details & Forecast */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                {/* View Details Button */}
                <button
                  onClick={() => setDetailModalStation(currentStation)}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#94a3b8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  {isBn ? 'বিস্তারিত দেখুন' : 'View Details'}
                </button>

                {/* ☁ Forecast Button (Active BMD Style from Image 2) */}
                <button
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2b87b1',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(43, 135, 177, 0.3)',
                    cursor: 'default'
                  }}
                >
                  <Cloud size={18} fill="#fad81f" color="#fad81f" />
                  <span>{isBn ? 'পূর্বাভাস' : 'Forecast'}</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Today's Condition Card & Next Days Forecast */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* ============================================================== */}
              {/* TODAY'S CONDITION CARD (AUTHENTIC BMD SERVER6 DESIGN FROM IMAGE 2) */}
              {/* ============================================================== */}
              <div style={{
                background: 'linear-gradient(135deg, #1d6e99 0%, #2178a4 50%, #2586b6 100%)',
                borderRadius: '16px',
                padding: 'clamp(20px, 4vw, 26px)',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(29, 110, 153, 0.35)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Header Title: Today's Condition: [Station] */}
                <h2 style={{
                  fontSize: 'clamp(18px, 4vw, 22px)',
                  fontWeight: 800,
                  color: '#ffffff',
                  marginBottom: '18px',
                  letterSpacing: '-0.01em'
                }}>
                  {isBn
                    ? `আজকের আবহাওয়া: ${currentStation.nameBn}`
                    : `Today's Condition: ${currentStation.name}`}
                </h2>

                {/* Card Body: Icon + Temps + Telemetry Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                  gap: '20px',
                  alignItems: 'center'
                }}>
                  {/* Left & Middle: Weather Icon, Temperature & Condition */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    {/* Weather Icon */}
                    <div style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      backdropFilter: 'blur(4px)'
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentStation.today.weatherIcon}
                        alt={currentStation.today.condition}
                        style={{ width: '56px', height: '56px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.currentTarget.src = 'https://server6.bmd.gov.bd/file/2016/08/17/png/1129.png';
                        }}
                      />
                    </div>

                    {/* Temperature Indicators & Condition Name */}
                    <div>
                      {/* Max Temp (Orange) & Min Temp (Cyan) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        {/* Max Temp */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <ArrowUp size={20} color="#ff9800" strokeWidth={3} />
                          <span style={{ fontSize: '22px', fontWeight: 800, color: '#ff9800' }}>
                            {isBn ? `${toBengaliNumeral(currentStation.today.maxTemp)}°C` : `${currentStation.today.maxTemp}°C`}
                          </span>
                        </div>

                        {/* Min Temp */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <ArrowDown size={20} color="#00e5ff" strokeWidth={3} />
                          <span style={{ fontSize: '22px', fontWeight: 800, color: '#00e5ff' }}>
                            {isBn ? `${toBengaliNumeral(currentStation.today.minTemp)}°C` : `${currentStation.today.minTemp}°C`}
                          </span>
                        </div>
                      </div>

                      {/* Condition Label */}
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginTop: '6px' }}>
                        {isBn ? currentStation.today.conditionBn : currentStation.today.condition}
                      </div>

                      {currentStation.today.rainfall > 0 && (
                        <div style={{ fontSize: '13px', color: '#bae6fd', fontWeight: 600, marginTop: '2px' }}>
                          {isBn ? `বৃষ্টিপাত: ${toBengaliNumeral(currentStation.today.rainfall)} মিমি` : `Rain: ${currentStation.today.rainfall} mm`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Telemetry list (Wind, Morning Hum, Evening Hum, Pressure) */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#f8fafc',
                    borderLeft: '1px solid rgba(255,255,255,0.2)',
                    paddingLeft: '20px'
                  }}>
                    <div>
                      {isBn
                        ? `বাতাস: ${toBengaliNumeral(currentStation.today.windSpeed)} কিমি/ঘণ্টা`
                        : `Wind: ${currentStation.today.windSpeed} km/h`}
                    </div>
                    <div>
                      {isBn
                        ? `সকালের আর্দ্রতা: ${toBengaliNumeral(currentStation.today.morningHumidity)} %`
                        : `Morning Humidity: ${currentStation.today.morningHumidity} %`}
                    </div>
                    <div>
                      {isBn
                        ? `সন্ধ্যার আর্দ্রতা: ${toBengaliNumeral(currentStation.today.eveningHumidity)} %`
                        : `Evening Humidity: ${currentStation.today.eveningHumidity} %`}
                    </div>
                    <div>
                      {isBn
                        ? `বায়ুমণ্ডলীয় চাপ: ${toBengaliNumeral(currentStation.today.surfacePressure)} hPa`
                        : `Surface Pressure: ${currentStation.today.surfacePressure} hPa`}
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* SUNRISE & SUNSET PILLS (FROM IMAGE 2) */}
              {/* ============================================================== */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: '14px'
              }}>
                {/* Sunrise Pill */}
                <div style={{
                  backgroundColor: '#3488b3',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(52, 136, 179, 0.25)'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Sunrise size={20} color="#ffde59" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#e0f2fe', fontWeight: 600, textTransform: 'uppercase' }}>
                      {isBn ? 'সূর্যোদয়' : 'Sunrise'}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800 }}>
                      {isBn ? toBengaliNumeral(currentStation.today.sunrise) : currentStation.today.sunrise}
                    </div>
                  </div>
                </div>

                {/* Sunset Pill */}
                <div style={{
                  backgroundColor: '#3488b3',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(52, 136, 179, 0.25)'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#e0f2fe', fontWeight: 600, textTransform: 'uppercase' }}>
                      {isBn ? 'সূর্যাস্ত' : 'Sunset'}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800 }}>
                      {isBn ? toBengaliNumeral(currentStation.today.sunset) : currentStation.today.sunset}
                    </div>
                  </div>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Sunset size={20} color="#ffaa00" />
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* NEXT X-DAYS WEATHER FORECAST (AUTHENTIC IMAGE 1 DESIGN) */}
              {/* ============================================================== */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                {/* Top Row: "Next 1-Days Weather Forecast" + Quick Station Dropdown */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '18px',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '14px'
                }}>
                  <h3 style={{
                    fontSize: 'clamp(16px, 3.5vw, 19px)',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: 0
                  }}>
                    {isBn
                      ? `পরবর্তী ${toBengaliNumeral(currentStation.forecasts.length)}-দিনের আবহাওয়া পূর্বাভাস`
                      : `Next ${currentStation.forecasts.length}-Days Weather Forecast`}
                  </h3>

                  {/* Combined [Division] - [Station] Dropdown (Image 1 Header Dropdown) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={currentStation.id}
                      onChange={(e) => handleQuickJump(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#0f172a',
                        backgroundColor: '#f8fafc',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      {allStations.map(st => (
                        <option key={st.id} value={st.id}>
                          {isBn ? `${st.divisionNameBn} - ${st.nameBn}` : `${st.divisionName} - ${st.name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Forecast Cards Grid (Image 1 Teal Card Design) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                  gap: '16px'
                }}>
                  {currentStation.forecasts.map((fItem, idx) => (
                    <div
                      key={fItem.id || idx}
                      style={{
                        backgroundColor: '#21607a', // Exact dark teal color from Image 1
                        borderRadius: '14px',
                        padding: '18px 20px',
                        color: '#ffffff',
                        boxShadow: '0 4px 12px rgba(33, 96, 122, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '140px',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {/* Top Row: Date & Weather Icon */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                        <div>
                          {/* Date: e.g. 4-11-2026 */}
                          <div style={{ fontSize: '14px', color: '#e0f2fe', fontWeight: 600, letterSpacing: '0.02em' }}>
                            {isBn ? toBengaliNumeral(fItem.dateFormatted) : fItem.dateFormatted}
                          </div>
                          {/* Weekday: e.g. Wednesday */}
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                            {isBn ? fItem.weekdayBn : fItem.weekday}
                          </div>
                          {/* Condition text: Partly Cloudy */}
                          <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500, marginTop: '4px' }}>
                            {isBn ? fItem.weatherBn : fItem.weather}
                          </div>
                        </div>

                        {/* Weather Icon (From Image 1) */}
                        <div style={{
                          width: '48px',
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={fItem.weatherIcon}
                            alt={fItem.weather}
                            style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://server6.bmd.gov.bd/file/2016/08/17/png/1129.png';
                            }}
                          />
                        </div>
                      </div>

                      {/* Bottom Row: Max and Min Temperature */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '14px',
                        marginTop: '12px',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(255,255,255,0.15)'
                      }}>
                        {/* Max Temp */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <ArrowUp size={16} color="#ff9800" strokeWidth={3} />
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#ff9800' }}>
                            {isBn ? `${toBengaliNumeral(fItem.maxTemp)}°C` : `${fItem.maxTemp}°C`}
                          </span>
                        </div>

                        {/* Min Temp */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <ArrowDown size={16} color="#00e5ff" strokeWidth={3} />
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#00e5ff' }}>
                            {isBn ? `${toBengaliNumeral(fItem.minTemp)}°C` : `${fItem.minTemp}°C`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. ALL STATIONS DIRECTORY / COMPARISON TABLE VIEW */}
      {/* ============================================================== */}
      {viewMode === 'all' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          {/* Search & Division Filter Chips */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
            marginBottom: '18px'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder={isBn ? 'স্টেশন বা বিভাগ খুঁজুন...' : 'Search station or division...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>

            {/* Division Filter Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedDivisionId('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: selectedDivisionId === 'all' ? '#1d76a2' : '#cbd5e1',
                  backgroundColor: selectedDivisionId === 'all' ? '#e0f2fe' : '#ffffff',
                  color: selectedDivisionId === 'all' ? '#0369a1' : '#475569',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isBn ? 'সকল বিভাগ' : 'All Divisions'}
              </button>
              {divisions.map((div) => (
                <button
                  key={div.id}
                  onClick={() => setSelectedDivisionId(div.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: selectedDivisionId === div.id ? '#1d76a2' : '#cbd5e1',
                    backgroundColor: selectedDivisionId === div.id ? '#e0f2fe' : '#ffffff',
                    color: selectedDivisionId === div.id ? '#0369a1' : '#475569',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {isBn ? div.nameBn : div.name}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 700 }}>{isBn ? 'স্টেশন' : 'Station'}</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700 }}>{isBn ? 'বিভাগ' : 'Division'}</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700 }}>{isBn ? 'আজকের অবস্থা' : 'Condition'}</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700 }}>{isBn ? 'সর্বোচ্চ / সর্বনিম্ন' : 'Max / Min Temp'}</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700 }}>{isBn ? 'সকাল / সন্ধ্যা আর্দ্রতা' : 'Morning / Eve RH'}</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700 }}>{isBn ? 'বায়ু গতি' : 'Wind Speed'}</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700 }}>{isBn ? 'পরবর্তী দিনের পূর্বাভাস' : 'Next-Day Outlook'}</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>{isBn ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStations.map((st) => (
                  <tr
                    key={st.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.1s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onClick={() => {
                      setSelectedStationId(st.id);
                      setSelectedDivisionId(st.divisionId);
                      setViewMode('portal');
                    }}
                  >
                    {/* Station Name */}
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={st.today.weatherIcon}
                          alt={st.today.condition}
                          style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                          onError={(e) => {
                            e.currentTarget.src = 'https://server6.bmd.gov.bd/file/2016/08/17/png/1129.png';
                          }}
                        />
                        <span>{isBn ? st.nameBn : st.name}</span>
                      </div>
                    </td>

                    {/* Division */}
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      {isBn ? st.divisionNameBn : st.divisionName}
                    </td>

                    {/* Condition */}
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#334155' }}>
                      {isBn ? st.today.conditionBn : st.today.condition}
                    </td>

                    {/* Max / Min Temp */}
                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                      <span style={{ color: '#ea580c' }}>
                        {isBn ? `${toBengaliNumeral(st.today.maxTemp)}°` : `${st.today.maxTemp}°`}
                      </span>
                      <span style={{ color: '#94a3b8' }}> / </span>
                      <span style={{ color: '#0284c7' }}>
                        {isBn ? `${toBengaliNumeral(st.today.minTemp)}°C` : `${st.today.minTemp}°C`}
                      </span>
                    </td>

                    {/* Morning / Evening Humidity */}
                    <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>
                      {isBn
                        ? `${toBengaliNumeral(st.today.morningHumidity)}% / ${toBengaliNumeral(st.today.eveningHumidity)}%`
                        : `${st.today.morningHumidity}% / ${st.today.eveningHumidity}%`}
                    </td>

                    {/* Wind */}
                    <td style={{ padding: '12px 14px', color: '#475569' }}>
                      {isBn ? `${toBengaliNumeral(st.today.windSpeed)} কিমি/ঘণ্টা` : `${st.today.windSpeed} km/h`}
                    </td>

                    {/* Next Day Outlook */}
                    <td style={{ padding: '12px 14px' }}>
                      {st.forecasts[0] ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                          <span style={{ color: '#ea580c' }}>↑{st.forecasts[0].maxTemp}°</span>
                          <span style={{ color: '#0284c7' }}>↓{st.forecasts[0].minTemp}°</span>
                          <span style={{ color: '#64748b' }}>({isBn ? st.forecasts[0].weatherBn : st.forecasts[0].weather})</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>--</span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailModalStation(st);
                        }}
                        style={{
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#0369a1',
                          cursor: 'pointer'
                        }}
                      >
                        {isBn ? 'তথ্য' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. "VIEW DETAILS" INTERACTIVE TELEMETRY MODAL DRAWER */}
      {/* ============================================================== */}
      {detailModalStation && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setDetailModalStation(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
              border: '1px solid #e2e8f0',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {isBn ? detailModalStation.nameBn : detailModalStation.name}
                  </h3>
                  <span style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    Station ID: {detailModalStation.stCode}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                  {isBn
                    ? `${detailModalStation.divisionNameBn} বিভাগ • বাংলাদেশ আবহাওয়া অধিদপ্তর লাইভ স্টেশন`
                    : `${detailModalStation.divisionName} Division • Bangladesh Meteorological Department`}
                </p>
              </div>

              <button
                onClick={() => setDetailModalStation(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Telemetry Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{isBn ? 'সর্বোচ্চ তাপমাত্রা' : 'Maximum Temp'}</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                  {isBn ? `${toBengaliNumeral(detailModalStation.today.maxTemp)}°C` : `${detailModalStation.today.maxTemp}°C`}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{isBn ? 'সর্বনিম্ন তাপমাত্রা' : 'Minimum Temp'}</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                  {isBn ? `${toBengaliNumeral(detailModalStation.today.minTemp)}°C` : `${detailModalStation.today.minTemp}°C`}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{isBn ? 'বায়ুমণ্ডলীয় চাপ' : 'Surface Pressure'}</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {detailModalStation.today.surfacePressure} hPa
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{isBn ? 'বায়ু প্রবাহের গতি' : 'Wind Speed'}</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {detailModalStation.today.windSpeed} km/h
                </div>
              </div>
            </div>

            {/* Sunrise & Sunset */}
            <div style={{
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sunrise size={20} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{isBn ? 'সূর্যোদয়' : 'Sunrise'}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{detailModalStation.today.sunrise}</div>
                </div>
              </div>
              <div style={{ width: '1px', height: '30px', backgroundColor: '#cbd5e1' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sunset size={20} color="#ea580c" />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{isBn ? 'সূর্যাস্ত' : 'Sunset'}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{detailModalStation.today.sunset}</div>
                </div>
              </div>
            </div>

            {/* Modal Close Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDetailModalStation(null)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

