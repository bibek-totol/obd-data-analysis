'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Sidebar, { ActiveSection } from '@/components/Sidebar';
import LocationSelector from '@/components/LocationSelector';
import HeroWeatherCard from '@/components/HeroWeatherCard';
import DailyForecastGrid from '@/components/DailyForecastGrid';
import HourlyForecastCharts from '@/components/HourlyForecastCharts';
import AdvisorySection from '@/components/AdvisorySection';
import BmdSection from '@/components/BmdSection';
import BamisSection from '@/components/BamisSection';
import DistrictAllUpazilasView from '@/components/DistrictAllUpazilasView';
import { DistrictForecastResponseData } from '@/lib/district-forecast';
import {
  DistrictItem,
  UpazilaItem,
  ForecastResponseData,
  DEFAULT_DISTRICTS,
  DEFAULT_UPAZILAS
} from '@/lib/nlas-client';
import { AlertCircle, RefreshCw, CheckCircle2, Printer, MapPin, LayoutGrid } from 'lucide-react';

export default function HomePage() {
  // Navigation State
  const [activeSection, setActiveSection] = useState<ActiveSection>('forecast');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // View Mode: 'all' displays all upazilas of selected district in one page; 'single' displays single upazila deep charts
  const [viewMode, setViewMode] = useState<'single' | 'all'>('all');

  // Location & Data States
  const [districts, setDistricts] = useState<DistrictItem[]>(DEFAULT_DISTRICTS);
  const [upazilas, setUpazilas] = useState<UpazilaItem[]>(DEFAULT_UPAZILAS['3026'] || []);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('3026'); // Dhaka
  const [selectedUpazila, setSelectedUpazila] = useState<string>('302602'); // Adabor

  // Single Upazila Forecast State
  const [forecastData, setForecastData] = useState<ForecastResponseData | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(true);
  const [isLoadingUpazilas, setIsLoadingUpazilas] = useState<boolean>(false);
  const [lastReloadTime, setLastReloadTime] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // District All-Upazilas Forecast State
  const [districtForecastData, setDistrictForecastData] = useState<DistrictForecastResponseData | null>(null);
  const [isLoadingDistrict, setIsLoadingDistrict] = useState<boolean>(true);
  const [districtReloadTime, setDistrictReloadTime] = useState<string>('');

  // Advisory Section Reload States
  const [isAdvisoryLoading, setIsAdvisoryLoading] = useState<boolean>(false);
  const [advisoryLastReloadTime, setAdvisoryLastReloadTime] = useState<string>('');
  const advisoryReloadRef = React.useRef<(() => void) | null>(null);

  // BMD USF Section Reload States
  const [isBmdLoading, setIsBmdLoading] = useState<boolean>(false);
  const [bmdLastReloadTime, setBmdLastReloadTime] = useState<string>('');
  const bmdReloadRef = React.useRef<(() => void) | null>(null);

  // BAMIS Portal Section Reload States
  const [isBamisLoading, setIsBamisLoading] = useState<boolean>(false);
  const [bamisLastReloadTime, setBamisLastReloadTime] = useState<string>('');
  const bamisReloadRef = React.useRef<(() => void) | null>(null);

  // Header Context-Aware Reload Handler
  const handleHeaderReload = () => {
    if (activeSection === 'forecast') {
      if (viewMode === 'all') {
        loadDistrictForecast(selectedDistrict, true);
      } else {
        handleManualReload();
      }
    } else if (activeSection === 'advisory') {
      if (advisoryReloadRef.current) {
        advisoryReloadRef.current();
      }
    } else if (activeSection === 'bmd-forecast') {
      if (bmdReloadRef.current) {
        bmdReloadRef.current();
      }
    } else if (activeSection === 'bamis-bulletin') {
      if (bamisReloadRef.current) {
        bamisReloadRef.current();
      }
    }
  };

  // Load Districts
  useEffect(() => {
    async function initDistricts() {
      try {
        const res = await fetch('/api/nlas/districts');
        const json = await res.json();
        if (json.success && json.districts?.length > 0) {
          setDistricts(json.districts);
        }
      } catch (err) {
        console.warn('Using default districts due to network:', err);
      }
    }
    initDistricts();
  }, []);

  // Client-side cache for instantaneous switching between upazilas
  const clientCacheRef = React.useRef<Record<string, ForecastResponseData>>({});

  const districtDataRef = React.useRef<DistrictForecastResponseData | null>(null);

  // Restore cached district forecast from sessionStorage immediately on mount for 0ms render
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(`nlas_district_${selectedDistrict}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.upazilas && parsed.upazilas.length > 0) {
          districtDataRef.current = parsed;
          setDistrictForecastData(parsed);
          setIsLoadingDistrict(false);
          const list = parsed.upazilas.map((u: any) => ({ label: u.upazilaName, value: u.upazilaCode }));
          setUpazilas(list);
        }
      }
    } catch {}
  }, [selectedDistrict]);

  // Initial upazilas lookup to ensure all stations are populated immediately (only for NLAS forecast section)
  useEffect(() => {
    if (activeSection !== 'forecast') return;
    async function initUpazilas() {
      try {
        const res = await fetch(`/api/nlas/upazilas?districtCode=${selectedDistrict}`);
        const json = await res.json();
        if (json.success && json.upazilas?.length > 0) {
          setUpazilas(json.upazilas);
        } else if (DEFAULT_UPAZILAS[selectedDistrict]) {
          setUpazilas(DEFAULT_UPAZILAS[selectedDistrict]);
        }
      } catch {
        if (DEFAULT_UPAZILAS[selectedDistrict]) {
          setUpazilas(DEFAULT_UPAZILAS[selectedDistrict]);
        }
      }
    }
    initUpazilas();
  }, [selectedDistrict, activeSection]);

  // Fetch District-Wide Weather Data for All Upazilas
  const loadDistrictForecast = useCallback(async (districtCode: string, isManualRefresh = false) => {
    // Only block screen if we don't already have data in memory
    setIsLoadingDistrict(!districtDataRef.current);
    try {
      const url = isManualRefresh
        ? `/api/nlas/district-forecast?districtCode=${districtCode}&reload=true&t=${Date.now()}`
        : `/api/nlas/district-forecast?districtCode=${districtCode}`;

      let res = await fetch(url);
      if (!res.ok) {
        await new Promise(r => setTimeout(r, 400));
        res = await fetch(url);
      }
      const json = await res.json();
      if (json.success && json.data) {
        districtDataRef.current = json.data;
        setDistrictForecastData(json.data);
        if (json.data.upazilas && json.data.upazilas.length > 0) {
          const list = json.data.upazilas.map((u: any) => ({ label: u.upazilaName, value: u.upazilaCode }));
          setUpazilas(list);
        }
        const now = new Date();
        setDistrictReloadTime(now.toLocaleTimeString());
        try {
          sessionStorage.setItem(`nlas_district_${districtCode}`, JSON.stringify(json.data));
        } catch {}
      }
    } catch (err) {
      console.error('District forecast fetch error:', err);
    } finally {
      setIsLoadingDistrict(false);
    }
  }, []);

  // Initial District Load - only runs when in forecast section and district changes
  useEffect(() => {
    if (activeSection === 'forecast') {
      loadDistrictForecast(selectedDistrict);
    }
  }, [loadDistrictForecast, selectedDistrict, activeSection]);

  // Fetch Single Upazila Forecast Data
  const loadForecast = useCallback(async (upazilaCode: string, isManualRefresh = false) => {
    // If not manual refresh and already in client cache or sessionStorage, paint immediately!
    if (!isManualRefresh) {
      if (clientCacheRef.current[upazilaCode]) {
        setForecastData(clientCacheRef.current[upazilaCode]);
        setIsLoadingForecast(false);
        return;
      }
      try {
        const cached = sessionStorage.getItem(`nlas_forecast_${upazilaCode}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.daily) {
            clientCacheRef.current[upazilaCode] = parsed;
            setForecastData(parsed);
            setIsLoadingForecast(false);
            return;
          }
        }
      } catch {}
    }

    setIsLoadingForecast(true);
    setErrorMessage(null);

    try {
      const url = isManualRefresh
        ? `/api/nlas/forecast?upazilaCode=${upazilaCode}&reload=true&t=${Date.now()}`
        : `/api/nlas/forecast?upazilaCode=${upazilaCode}`;

      let res = await fetch(url);
      if (!res.ok) {
        // Quick automatic retry in case of network hiccup
        await new Promise(r => setTimeout(r, 400));
        res = await fetch(url);
      }
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load weather forecast');
      }

      clientCacheRef.current[upazilaCode] = json.data;
      setForecastData(json.data);
      try {
        sessionStorage.setItem(`nlas_forecast_${upazilaCode}`, JSON.stringify(json.data));
      } catch {}
      const now = new Date();
      setLastReloadTime(now.toLocaleTimeString());
    } catch (err) {
      console.error('Forecast fetch error:', err);
      // Fallback to cached if available
      if (clientCacheRef.current[upazilaCode]) {
        setForecastData(clientCacheRef.current[upazilaCode]);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to connect to weather data provider'
        );
      }
    } finally {
      setIsLoadingForecast(false);
    }
  }, []);

  // Initial Forecast Load: only load if in single view
  useEffect(() => {
    if (viewMode === 'single') {
      loadForecast(selectedUpazila);
    }
  }, [loadForecast, selectedUpazila, viewMode]);

  // Handle District Change
  const handleDistrictChange = async (districtCode: string) => {
    setSelectedDistrict(districtCode);
    setIsLoadingUpazilas(true);
    // Immediately fetch all upazilas for this district
    loadDistrictForecast(districtCode);

    try {
      const res = await fetch(`/api/nlas/upazilas?districtCode=${districtCode}`);
      const json = await res.json();

      if (json.success && json.upazilas?.length > 0) {
        setUpazilas(json.upazilas);
        const firstUpazila = json.upazilas[0].value;
        setSelectedUpazila(firstUpazila);
        if (viewMode === 'single') {
          loadForecast(firstUpazila);
        }
      } else {
        const fallback = DEFAULT_UPAZILAS[districtCode] || [];
        setUpazilas(fallback);
        if (fallback.length > 0) {
          setSelectedUpazila(fallback[0].value);
          if (viewMode === 'single') {
            loadForecast(fallback[0].value);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching upazilas:', err);
      const fallback = DEFAULT_UPAZILAS[districtCode] || [];
      setUpazilas(fallback);
      if (fallback.length > 0) {
        setSelectedUpazila(fallback[0].value);
        if (viewMode === 'single') {
          loadForecast(fallback[0].value);
        }
      }
    } finally {
      setIsLoadingUpazilas(false);
    }
  };

  // Handle Upazila Change
  const handleUpazilaChange = (upazilaCode: string) => {
    setSelectedUpazila(upazilaCode);
    loadForecast(upazilaCode);
  };

  // Handle Manual Reload
  const handleManualReload = () => {
    loadForecast(selectedUpazila, true);
  };

  // Selected Upazila label
  const currentUpazilaObj = upazilas.find(u => u.value === selectedUpazila);
  const upazilaLabel = currentUpazilaObj?.label || forecastData?.location.upazila_name || 'Adabor';
  const districtLabel = districts.find(d => d.value === selectedDistrict)?.label || 'Dhaka';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Top Header */}
      <Header
        activeSection={activeSection}
        onReload={handleHeaderReload}
        isLoading={
          activeSection === 'forecast'
            ? (viewMode === 'all' ? isLoadingDistrict : isLoadingForecast)
            : activeSection === 'advisory'
              ? isAdvisoryLoading
              : activeSection === 'bamis-bulletin'
                ? isBamisLoading
                : isBmdLoading
        }
        lastUpdated={
          activeSection === 'forecast'
            ? (viewMode === 'all' ? districtReloadTime : lastReloadTime)
            : activeSection === 'advisory'
              ? advisoryLastReloadTime
              : activeSection === 'bamis-bulletin'
                ? bamisLastReloadTime
                : bmdLastReloadTime
        }
      />

      {/* Main Body with Sidebar & Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 65px)' }}>
        {/* Left Section: Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />

        {/* Right Section: Content */}
        <main style={{
          flex: 1,
          padding: '24px 32px',
          overflowY: 'auto',
          maxWidth: '1600px'
        }}>
          {/* Section Breadcrumb & Status Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {activeSection === 'bamis-bulletin' ? (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: 600
                }}>
                  <span>BAMIS Portal (DAE)</span>
                  <span>/</span>
                  <span style={{ color: '#0c713e', fontWeight: 700 }}>
                    District Agromet Bulletin
                  </span>
                </div>
                <h1 style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginTop: '4px'
                }}>
                  District Agromet Advisory Bulletin (bamis.gov.bd)
                </h1>
              </div>
            ) : activeSection === 'bmd-forecast' ? (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: 600
                }}>
                  <span>BMD Portal (USF)</span>
                  <span>/</span>
                  <span style={{ color: '#0369a1', fontWeight: 700 }}>
                    Upazila Weather Forecast
                  </span>
                </div>
                <h1 style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginTop: '4px'
                }}>
                  Upazila Weather Forecast (usf.bmd.gov.bd)
                </h1>
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: 600
                }}>
                  <span>NLS Portal (NLAS)</span>
                  <span>/</span>
                  <span style={{ color: '#006a4e', fontWeight: 700 }}>
                    {activeSection === 'forecast'
                      ? (viewMode === 'all' ? `All Upazilas Overview (${districtLabel})` : 'Weather Forecast Section')
                      : 'Region Wise Monthly Advisory'}
                  </span>
                </div>
                <h1 style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginTop: '4px'
                }}>
                  {activeSection === 'forecast'
                    ? (viewMode === 'all'
                        ? `District Weather Overview: All Upazilas in ${districtLabel}`
                        : `Weather Forecast: ${upazilaLabel}, ${districtLabel}`)
                    : `Region Wise Monthly Advisory`}
                </h1>
              </div>
            )}

            {/* Quick Actions & Status Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {activeSection === 'forecast' && (
                <button
                  onClick={() => window.print()}
                  id="btn-print-forecast"
                  title="Print or Save Weather Forecast as PDF"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
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
                  <Printer size={14} />
                  <span>Print Forecast</span>
                </button>
              )}

              {/* Synchronized status pill */}
              {(activeSection === 'forecast'
                ? (viewMode === 'all' ? districtReloadTime : lastReloadTime)
                : activeSection === 'advisory'
                  ? advisoryLastReloadTime
                  : activeSection === 'bamis-bulletin'
                    ? bamisLastReloadTime
                    : bmdLastReloadTime) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    color: '#475569',
                    fontWeight: 500,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}>
                    <CheckCircle2
                      size={14}
                      color={
                        activeSection === 'bmd-forecast'
                          ? '#0369a1'
                          : activeSection === 'bamis-bulletin'
                          ? '#0c713e'
                          : '#10b981'
                      }
                    />
                    <span>
                      Synchronized at: <strong>
                        {activeSection === 'forecast'
                          ? (viewMode === 'all' ? districtReloadTime : lastReloadTime)
                          : activeSection === 'advisory'
                            ? advisoryLastReloadTime
                            : activeSection === 'bamis-bulletin'
                              ? bamisLastReloadTime
                              : bmdLastReloadTime}
                      </strong>
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* Error Message Notice */}
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#991b1b',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} />
              <div style={{ flex: 1 }}>{errorMessage}</div>
              <button
                onClick={handleManualReload}
                style={{
                  backgroundColor: '#991b1b',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Conditional View: BAMIS Bulletin vs BMD USF vs Advisory vs NLAS Forecast */}
          {activeSection === 'bamis-bulletin' ? (
            <BamisSection
              onRegisterReload={(fn) => { bamisReloadRef.current = fn; }}
              onLoadingChange={setIsBamisLoading}
              onLastReloadTimeChange={setBamisLastReloadTime}
            />
          ) : activeSection === 'bmd-forecast' ? (
            <BmdSection
              onRegisterReload={(fn) => { bmdReloadRef.current = fn; }}
              onLoadingChange={setIsBmdLoading}
              onLastReloadTimeChange={setBmdLastReloadTime}
            />
          ) : activeSection === 'advisory' ? (
            <AdvisorySection
              districtName={districtLabel}
              upazilaName={upazilaLabel}
              onRegisterReload={(fn) => { advisoryReloadRef.current = fn; }}
              onLoadingChange={setIsAdvisoryLoading}
              onLastReloadTimeChange={setAdvisoryLastReloadTime}
            />
          ) : (
            <>
              {/* Forecast Section */}
              {viewMode === 'all' ? (
                <>
                  {/* District Selector & Mode Bar */}
                  <div style={{
                    background: 'linear-gradient(135deg, #0d2820 0%, #12392e 35%, #184c3e 70%, #0f3026 100%)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    color: '#ffffff',
                    boxShadow: '0 12px 30px -5px rgba(8, 38, 28, 0.35), 0 4px 10px rgba(0, 0, 0, 0.12)',
                    border: '1px solid rgba(52, 211, 153, 0.2)',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(52, 211, 153, 0.15)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#34d399'
                      }}>
                        <MapPin size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a7f3d0', fontWeight: 700 }}>
                          District Weather Monitoring
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                          {districtLabel} District
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginLeft: '10px' }}>
                            ({(viewMode === 'all' && districtForecastData?.totalUpazilas) ? districtForecastData.totalUpazilas : upazilas.length} Upazilas Monitored)
                          </span>
                        </div>
                      </div>
                    </div>

                    <LocationSelector
                      districts={districts}
                      upazilas={upazilas}
                      selectedDistrict={selectedDistrict}
                      selectedUpazila={selectedUpazila}
                      onDistrictChange={handleDistrictChange}
                      onUpazilaChange={(upazilaCode) => {
                        handleUpazilaChange(upazilaCode);
                        setViewMode('single');
                      }}
                      isLoadingUpazilas={isLoadingUpazilas}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                    />
                  </div>

                  {/* All Upazilas View */}
                  {districtForecastData ? (
                    <DistrictAllUpazilasView
                      districtData={districtForecastData}
                      isLoading={isLoadingDistrict}
                      onSelectUpazila={(upazilaCode) => {
                        setSelectedUpazila(upazilaCode);
                        setViewMode('single');
                        loadForecast(upazilaCode);
                      }}
                      onReloadDistrict={() => loadDistrictForecast(selectedDistrict, true)}
                    />
                  ) : (
                    <div style={{
                      padding: '70px 20px',
                      textAlign: 'center',
                      backgroundColor: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        backgroundColor: '#e8f5f0',
                        color: '#006a4e',
                        marginBottom: '16px'
                      }}>
                        <RefreshCw size={26} className="animate-spin-fast" />
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                        Loading All Upazilas Weather for {districtLabel}...
                      </h3>
                      <p style={{ fontSize: '13px', color: '#64748b' }}>
                        Gathering real-time forecasts, temperatures, and outlooks across all upazilas in this district.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Navigation Bar back to All Upazilas */}
                  <div style={{
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <button
                      onClick={() => setViewMode('all')}
                      id="btn-back-to-all-upazilas"
                      type="button"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#006a4e',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e8f5f0';
                        e.currentTarget.style.borderColor = '#006a4e';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                    >
                      <LayoutGrid size={15} />
                      <span>← View All {upazilas.length} Upazilas in {districtLabel}</span>
                    </button>

                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                      Viewing 3-Hourly spline graphs for <strong>{upazilaLabel}</strong>
                    </span>
                  </div>

                  {/* Single Upazila Forecast: Hero, Daily Grid, Hourly Charts */}
                  {isLoadingForecast && !forecastData ? (
                    <div style={{
                      padding: '60px 20px',
                      textAlign: 'center',
                      backgroundColor: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        backgroundColor: '#e8f5f0',
                        color: '#006a4e',
                        marginBottom: '16px'
                      }}>
                        <RefreshCw size={26} className="animate-spin-fast" />
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                        Fetching Real-Time Meteorological Feeds for {upazilaLabel}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#64748b' }}>
                        Scanning and pulling the latest 5-6 day weather data and 3-hourly forecast...
                      </p>
                    </div>
                  ) : forecastData ? (
                    <>
                      <HeroWeatherCard
                        data={forecastData}
                        locationSelectorSlot={
                          <LocationSelector
                            districts={districts}
                            upazilas={upazilas}
                            selectedDistrict={selectedDistrict}
                            selectedUpazila={selectedUpazila}
                            onDistrictChange={handleDistrictChange}
                            onUpazilaChange={handleUpazilaChange}
                            isLoadingUpazilas={isLoadingUpazilas}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                          />
                        }
                      />

                      <DailyForecastGrid daily={forecastData.daily} />

                      <HourlyForecastCharts
                        hourly={forecastData.hourly}
                        upazilaName={forecastData.location.upazila_name}
                      />
                    </>
                  ) : null}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
