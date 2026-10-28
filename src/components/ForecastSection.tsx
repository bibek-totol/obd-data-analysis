'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LocationSelector from '@/components/LocationSelector';
import HeroWeatherCard from '@/components/HeroWeatherCard';
import DailyForecastGrid from '@/components/DailyForecastGrid';
import HourlyForecastCharts from '@/components/HourlyForecastCharts';
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
import { useDashboard } from '@/context/DashboardContext';

interface ForecastSectionProps {
  initialUpazilaCode?: string;
  forceSingleView?: boolean;
}

export default function ForecastSection({
  initialUpazilaCode,
  forceSingleView = false
}: ForecastSectionProps = {}) {
  const router = useRouter();
  const { registerReload, setIsLoading, setLastUpdated } = useDashboard();

  // View Mode: 'all' displays all upazilas of selected district in one page; 'single' displays single upazila deep charts
  const [viewMode, setViewMode] = useState<'single' | 'all'>(forceSingleView ? 'single' : 'all');

  // Location & Data States
  const [districts, setDistricts] = useState<DistrictItem[]>(DEFAULT_DISTRICTS);
  const initDistrict = initialUpazilaCode ? initialUpazilaCode.substring(0, 4) : '3026';
  const [upazilas, setUpazilas] = useState<UpazilaItem[]>(DEFAULT_UPAZILAS[initDistrict] || DEFAULT_UPAZILAS['3026'] || []);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initDistrict);
  const [selectedUpazila, setSelectedUpazila] = useState<string>(initialUpazilaCode || '302602');

  // Sync state if initialUpazilaCode changes
  useEffect(() => {
    if (initialUpazilaCode && initialUpazilaCode !== selectedUpazila) {
      setSelectedUpazila(initialUpazilaCode);
      const dist = initialUpazilaCode.substring(0, 4);
      setSelectedDistrict(dist);
      if (forceSingleView) {
        setViewMode('single');
      }
    }
  }, [initialUpazilaCode, forceSingleView]);

  // Single Upazila Forecast State
  const [forecastData, setForecastData] = useState<ForecastResponseData | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(true);
  const [isLoadingUpazilas, setIsLoadingUpazilas] = useState<boolean>(false);
  const [lastReloadTime, setLastReloadTimeState] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // District All-Upazilas Forecast State
  const [districtForecastData, setDistrictForecastData] = useState<DistrictForecastResponseData | null>(null);
  const [isLoadingDistrict, setIsLoadingDistrict] = useState<boolean>(true);
  const [districtReloadTime, setDistrictReloadTime] = useState<string>('');

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
  const clientCacheRef = useRef<Record<string, ForecastResponseData>>({});
  const districtDataRef = useRef<DistrictForecastResponseData | null>(null);

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
    } catch { }
  }, [selectedDistrict]);

  // Initial upazilas lookup
  useEffect(() => {
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
  }, [selectedDistrict]);

  // Fetch District-Wide Weather Data for All Upazilas
  const loadDistrictForecast = useCallback(async (districtCode: string, isManualRefresh = false) => {
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
        const timeStr = now.toLocaleTimeString();
        setDistrictReloadTime(timeStr);
        setLastUpdated(timeStr);
        try {
          sessionStorage.setItem(`nlas_district_${districtCode}`, JSON.stringify(json.data));
        } catch { }
      }
    } catch (err) {
      console.error('District forecast fetch error:', err);
    } finally {
      setIsLoadingDistrict(false);
    }
  }, [setLastUpdated]);

  // Initial District Load
  useEffect(() => {
    loadDistrictForecast(selectedDistrict);
  }, [loadDistrictForecast, selectedDistrict]);

  // Fetch Single Upazila Forecast Data
  const loadForecast = useCallback(async (upazilaCode: string, isManualRefresh = false) => {
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
      } catch { }
    }

    setIsLoadingForecast(true);
    setErrorMessage(null);

    try {
      const url = isManualRefresh
        ? `/api/nlas/forecast?upazilaCode=${upazilaCode}&reload=true&t=${Date.now()}`
        : `/api/nlas/forecast?upazilaCode=${upazilaCode}`;

      let res = await fetch(url);
      if (!res.ok) {
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
      } catch { }
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      setLastReloadTimeState(timeStr);
      setLastUpdated(timeStr);
    } catch (err) {
      console.error('Forecast fetch error:', err);
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
  }, [setLastUpdated]);

  // Initial Forecast Load: only load if in single view
  useEffect(() => {
    if (viewMode === 'single') {
      loadForecast(selectedUpazila);
    }
  }, [loadForecast, selectedUpazila, viewMode]);

  // Sync loading state with parent DashboardContext
  useEffect(() => {
    setIsLoading(viewMode === 'all' ? isLoadingDistrict : isLoadingForecast);
  }, [viewMode, isLoadingDistrict, isLoadingForecast, setIsLoading]);

  // Handle District Change
  const handleDistrictChange = async (districtCode: string) => {
    setSelectedDistrict(districtCode);
    setIsLoadingUpazilas(true);
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

  const handleUpazilaChange = (upazilaCode: string) => {
    setSelectedUpazila(upazilaCode);
    loadForecast(upazilaCode);
  };

  const handleManualReload = useCallback(() => {
    if (viewMode === 'all') {
      loadDistrictForecast(selectedDistrict, true);
    } else {
      loadForecast(selectedUpazila, true);
    }
  }, [viewMode, selectedDistrict, selectedUpazila, loadDistrictForecast, loadForecast]);

  // Register reload function with DashboardContext
  useEffect(() => {
    registerReload(handleManualReload);
  }, [registerReload, handleManualReload]);

  const currentUpazilaObj = upazilas.find(u => u.value === selectedUpazila);
  const upazilaLabel = currentUpazilaObj?.label || forecastData?.location.upazila_name || 'Adabor';
  const districtLabel = districts.find(d => d.value === selectedDistrict)?.label || 'Dhaka';

  return (
    <div>
      {/* Section Breadcrumb & Status Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
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
              {viewMode === 'all' ? `All Upazilas Overview (${districtLabel})` : 'Weather Forecast Section'}
            </span>
          </div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#0f172a',
            marginTop: '4px'
          }}>
            {viewMode === 'all'
              ? `District Weather Overview: All Upazilas in ${districtLabel}`
              : `Weather Forecast: ${upazilaLabel}, ${districtLabel}`}
          </h1>
        </div>

        {/* Quick Actions: Print & Sync status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

          {(viewMode === 'all' ? districtReloadTime : lastReloadTime) && (
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
              <CheckCircle2 size={14} color="#10b981" />
              <span>
                Synchronized at: <strong>{viewMode === 'all' ? districtReloadTime : lastReloadTime}</strong>
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

      {/* Main Content: All Upazilas vs Single Upazila */}
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
                router.push(`/forecast/${upazilaCode}`);
              }}
              isLoadingUpazilas={isLoadingUpazilas}
              viewMode={viewMode}
              onViewModeChange={(mode) => {
                if (mode === 'all') {
                  setViewMode('all');
                } else {
                  router.push(`/forecast/${selectedUpazila}`);
                }
              }}
            />
          </div>

          {/* All Upazilas View */}
          {districtForecastData ? (
            <DistrictAllUpazilasView
              districtData={districtForecastData}
              isLoading={isLoadingDistrict}
              onSelectUpazila={(upazilaCode) => {
                setSelectedUpazila(upazilaCode);
                router.push(`/forecast/${upazilaCode}`);
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
            <Link
              href="/forecast"
              onClick={() => setViewMode('all')}
              id="btn-back-to-all-upazilas"
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
                textDecoration: 'none',
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
            </Link>


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
                    onDistrictChange={(dist) => {
                      handleDistrictChange(dist);
                      if (forceSingleView) {
                        router.push('/forecast');
                      }
                    }}
                    onUpazilaChange={(upCode) => {
                      handleUpazilaChange(upCode);
                      if (forceSingleView) {
                        router.push(`/forecast/${upCode}`);
                      }
                    }}
                    isLoadingUpazilas={isLoadingUpazilas}
                    viewMode={viewMode}
                    onViewModeChange={(mode) => {
                      if (mode === 'all') {
                        router.push('/forecast');
                      } else {
                        setViewMode('single');
                      }
                    }}
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
    </div>
  );
}
