'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BmdDistrictItem,
  BmdUpazilaItem,
  BmdForecastResponseData,
  BMD_DISTRICTS,
  DEFAULT_BMD_UPAZILAS,
  toBengaliNumber
} from '@/lib/bmd-client';
import BmdWeatherIcon from './BmdWeatherIcon';
import BmdHourlyCharts from './BmdHourlyCharts';
import BmdDistrictAllUpazilasView from './BmdDistrictAllUpazilasView';
import { BmdDistrictForecastResponseData } from '@/lib/bmd-district-forecast';
import {
  MapPin,
  Calendar,
  Droplets,
  Thermometer,
  Wind,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Navigation,
  ChevronDown,
  LayoutGrid,
  Compass
} from 'lucide-react';

interface BmdSectionProps {
  onRegisterReload?: (fn: () => void) => void;
  onLoadingChange?: (loading: boolean) => void;
  onLastReloadTimeChange?: (time: string) => void;
  initialUpazilaCode?: string;
  forceSingleView?: boolean;
}

export default function BmdSection({
  onRegisterReload,
  onLoadingChange,
  onLastReloadTimeChange,
  initialUpazilaCode,
  forceSingleView = false
}: BmdSectionProps) {
  const router = useRouter();

  // Language State: 'bn' (Default on BMD) or 'en'
  const [lang, setLang] = useState<'en' | 'bn'>('bn');

  // View Mode: 'all' displays all upazilas in selected district; 'single' displays single upazila charts
  const [viewMode, setViewMode] = useState<'single' | 'all'>(forceSingleView ? 'single' : 'all');

  // Location States
  const [districts] = useState<BmdDistrictItem[]>(BMD_DISTRICTS);
  const initDistrict = initialUpazilaCode ? initialUpazilaCode.substring(0, 4) : '3026';
  const [upazilas, setUpazilas] = useState<BmdUpazilaItem[]>(DEFAULT_BMD_UPAZILAS[initDistrict] || DEFAULT_BMD_UPAZILAS['3026'] || []);
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

  // Single Upazila Forecast States
  const [forecastData, setForecastData] = useState<BmdForecastResponseData | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(true);
  const [isLoadingUpazilas, setIsLoadingUpazilas] = useState<boolean>(false);
  const [lastReloadTime, setLastReloadTime] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // District All-Upazilas Forecast States
  const [districtForecastData, setDistrictForecastData] = useState<BmdDistrictForecastResponseData | null>(null);
  const bmdDistrictDataRef = useRef<BmdDistrictForecastResponseData | null>(null);
  const [isLoadingDistrict, setIsLoadingDistrict] = useState<boolean>(true);
  const [districtReloadTime, setDistrictReloadTime] = useState<string>('');

  // Client-side cache for instant switching
  const clientCacheRef = useRef<Record<string, BmdForecastResponseData>>({});

  // Restore cached district forecast from sessionStorage immediately on mount for 0ms render
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(`bmd_district_${selectedDistrict}_${lang}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.upazilas && parsed.upazilas.length > 0) {
          bmdDistrictDataRef.current = parsed;
          setDistrictForecastData(parsed);
          setIsLoadingDistrict(false);
        }
      }
    } catch { }
  }, [selectedDistrict, lang]);

  const selectedUpazilaRef = useRef(selectedUpazila);
  selectedUpazilaRef.current = selectedUpazila;

  // 1. Fetch Upazilas when District or Language Changes
  const loadUpazilas = useCallback(async (districtCode: string, currentLang: 'en' | 'bn') => {
    setIsLoadingUpazilas(true);
    try {
      const res = await fetch(`/api/bmd/upazilas?districtCode=${districtCode}&lang=${currentLang}`);
      const json = await res.json();
      if (json.success && json.upazilas?.length > 0) {
        setUpazilas(json.upazilas);
        // Default to first upazila if selected one doesn't exist in new district
        const exists = json.upazilas.some((u: BmdUpazilaItem) => u.id === selectedUpazilaRef.current);
        if (!exists) {
          setSelectedUpazila(json.upazilas[0].id);
        }
      } else if (DEFAULT_BMD_UPAZILAS[districtCode]) {
        setUpazilas(DEFAULT_BMD_UPAZILAS[districtCode]);
      }
    } catch (err) {
      console.warn('Using default upazilas due to network:', err);
      if (DEFAULT_BMD_UPAZILAS[districtCode]) {
        setUpazilas(DEFAULT_BMD_UPAZILAS[districtCode]);
      }
    } finally {
      setIsLoadingUpazilas(false);
    }
  }, []);

  useEffect(() => {
    loadUpazilas(selectedDistrict, lang);
  }, [selectedDistrict, lang, loadUpazilas]);

  // 2. Fetch Forecast Data for Selected Upazila
  const loadForecast = useCallback(async (upazilaCode: string, currentLang: 'en' | 'bn', isManualRefresh = false) => {
    const cacheKey = `${upazilaCode}_${currentLang}`;
    if (!isManualRefresh) {
      if (clientCacheRef.current[cacheKey]) {
        setForecastData(clientCacheRef.current[cacheKey]);
        setIsLoadingForecast(false);
        return;
      }
      try {
        const cached = sessionStorage.getItem(`bmd_forecast_${cacheKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.daily) {
            clientCacheRef.current[cacheKey] = parsed;
            setForecastData(parsed);
            setIsLoadingForecast(false);
            return;
          }
        }
      } catch { }
    }

    setIsLoadingForecast(true);
    onLoadingChange?.(true);
    setErrorMessage(null);

    try {
      const url = isManualRefresh
        ? `/api/bmd/forecast?upazilaCode=${upazilaCode}&lang=${currentLang}&reload=true&t=${Date.now()}`
        : `/api/bmd/forecast?upazilaCode=${upazilaCode}&lang=${currentLang}`;

      let res = await fetch(url);
      if (!res.ok) {
        await new Promise(r => setTimeout(r, 400));
        res = await fetch(url);
      }
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch BMD forecast data');
      }

      setForecastData(json.data);
      clientCacheRef.current[cacheKey] = json.data;
      try {
        sessionStorage.setItem(`bmd_forecast_${cacheKey}`, JSON.stringify(json.data));
      } catch { }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setLastReloadTime(timeStr);
      onLastReloadTimeChange?.(timeStr);
    } catch (err) {
      console.error('Error loading BMD forecast:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error fetching meteorological data');
    } finally {
      setIsLoadingForecast(false);
      onLoadingChange?.(false);
    }
  }, [onLoadingChange, onLastReloadTimeChange]);

  // Only run single upazila load if in single view
  useEffect(() => {
    if (viewMode === 'single') {
      loadForecast(selectedUpazila, lang, false);
    }
  }, [selectedUpazila, lang, viewMode, loadForecast]);

  // 3. Fetch District-Wide All-Upazilas Forecast Data
  const loadDistrictForecast = useCallback(async (districtCode: string, currentLang: 'en' | 'bn', isManualRefresh = false) => {
    setIsLoadingDistrict(!bmdDistrictDataRef.current);
    try {
      const url = isManualRefresh
        ? `/api/bmd/district-forecast?districtCode=${districtCode}&lang=${currentLang}&reload=true&t=${Date.now()}`
        : `/api/bmd/district-forecast?districtCode=${districtCode}&lang=${currentLang}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.success && json.data) {
        bmdDistrictDataRef.current = json.data;
        setDistrictForecastData(json.data);
        try {
          sessionStorage.setItem(`bmd_district_${districtCode}_${currentLang}`, JSON.stringify(json.data));
        } catch { }
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        setDistrictReloadTime(timeStr);
      }
    } catch (err) {
      console.error('Error fetching BMD district forecast:', err);
    } finally {
      setIsLoadingDistrict(false);
    }
  }, []);

  useEffect(() => {
    loadDistrictForecast(selectedDistrict, lang, false);
  }, [selectedDistrict, lang, loadDistrictForecast]);

  // Synchronize loading & timestamp changes with parent Header
  useEffect(() => {
    if (viewMode === 'all') {
      onLoadingChange?.(isLoadingDistrict);
      if (districtReloadTime) onLastReloadTimeChange?.(districtReloadTime);
    } else {
      onLoadingChange?.(isLoadingForecast);
      if (lastReloadTime) onLastReloadTimeChange?.(lastReloadTime);
    }
  }, [viewMode, isLoadingDistrict, isLoadingForecast, districtReloadTime, lastReloadTime, onLoadingChange, onLastReloadTimeChange]);

  // Register manual refresh handler
  useEffect(() => {
    if (onRegisterReload) {
      onRegisterReload(() => {
        if (viewMode === 'all') {
          loadDistrictForecast(selectedDistrict, lang, true);
        } else if (selectedUpazila) {
          loadForecast(selectedUpazila, lang, true);
        }
      });
    }
  }, [onRegisterReload, viewMode, selectedDistrict, selectedUpazila, lang, loadDistrictForecast, loadForecast]);

  const handleManualReload = () => {
    if (viewMode === 'all') {
      loadDistrictForecast(selectedDistrict, lang, true);
    } else if (selectedUpazila) {
      loadForecast(selectedUpazila, lang, true);

    }
  };

  // District & Upazila Handlers
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    setSelectedDistrict(newDistrict);
    loadDistrictForecast(newDistrict, lang, false);
    if (forceSingleView) {
      router.push('/bmd');
    }
  };

  const handleUpazilaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUpazila = e.target.value;
    if (newUpazila === 'all') {
      if (forceSingleView) {
        router.push('/bmd');
      } else {
        setViewMode('all');
      }
    } else {
      setSelectedUpazila(newUpazila);
      if (forceSingleView) {
        router.push(`/bmd/${newUpazila}`);
      } else {
        setViewMode('single');
        loadForecast(newUpazila, lang, false);
      }
    }
  };

  const currentDistrictObj = districts.find(d => d.id === selectedDistrict);
  const districtLabel = lang === 'bn' ? (currentDistrictObj?.nameBn || currentDistrictObj?.name) : currentDistrictObj?.name;
  const currentUpazilaObj = upazilas.find(u => u.id === selectedUpazila);
  const upazilaLabel = lang === 'bn' ? (currentUpazilaObj?.nameBn || currentUpazilaObj?.name) : currentUpazilaObj?.name;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* -------------------------------------------------------------
          TOP CONTROL BAR: Language Toggle, Location Pickers & Sync Status
         ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        {/* Left: Location Pickers (Jela & Upjila) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* District (Jela) Dropdown */}
          <div style={{ minWidth: '200px', flex: '1 1 200px', position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px'
            }}>
              {lang === 'bn' ? 'জেলা নির্বাচন করুন' : 'Select District '}
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="select-bmd-district"
                value={selectedDistrict}
                onChange={handleDistrictChange}
                style={{
                  width: '100%',
                  padding: '9px 34px 9px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
              >
                {districts.map(d => (
                  <option key={d.id} value={d.id}>
                    {lang === 'bn' ? `${d.nameBn} (${d.name})` : `${d.name} (${d.nameBn})`}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                color="#64748b"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>
          </div>

          {/* Upazila (Upjila) Dropdown */}
          <div style={{ minWidth: '200px', flex: '1 1 200px', position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px'
            }}>
              {lang === 'bn' ? 'উপজেলা নির্বাচন করুন' : 'Select Upazila '}
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="select-bmd-upazila"
                value={viewMode === 'all' ? 'all' : selectedUpazila}
                onChange={handleUpazilaChange}
                disabled={isLoadingUpazilas}
                style={{
                  width: '100%',
                  padding: '9px 34px 9px 12px',
                  backgroundColor: isLoadingUpazilas ? '#f1f5f9' : '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: isLoadingUpazilas ? 'wait' : 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <option value="all">
                  {lang === 'bn' ? `সব উপজেলা (${upazilas.length})` : `All Upazilas (${upazilas.length})`}
                </option>
                {upazilas.map(u => (
                  <option key={u.id} value={u.id}>
                    {lang === 'bn' ? u.nameBn : u.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                color="#64748b"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Right: View Mode Toggle, Language Switcher & Sync Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Segmented View Mode Toggle: All Upazilas vs Single Station */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              id="btn-bmd-view-all"
              onClick={() => {
                if (forceSingleView) {
                  router.push('/bmd');
                } else {
                  setViewMode('all');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: viewMode === 'all' ? '#0369a1' : 'transparent',
                color: viewMode === 'all' ? '#ffffff' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                boxShadow: viewMode === 'all' ? '0 1px 3px rgba(3,105,161,0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={13} />
              <span>{lang === 'bn' ? `সব উপজেলা (${upazilas.length})` : `All Upazilas (${upazilas.length})`}</span>
            </button>
            <button
              id="btn-bmd-view-single"
              onClick={() => {
                if (!forceSingleView) {
                  router.push(`/bmd/${selectedUpazila}`);
                } else {
                  setViewMode('single');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: viewMode === 'single' ? '#0369a1' : 'transparent',
                color: viewMode === 'single' ? '#ffffff' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                boxShadow: viewMode === 'single' ? '0 1px 3px rgba(3,105,161,0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Compass size={13} />
              <span>{lang === 'bn' ? 'একক উপজেলা' : 'Single Station'}</span>
            </button>
          </div>

          {/* Language Toggle */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setLang('en')}
              id="btn-bmd-lang-en"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: lang === 'en' ? '#0369a1' : 'transparent',
                color: lang === 'en' ? '#ffffff' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              English
            </button>
            <button
              onClick={() => setLang('bn')}
              id="btn-bmd-lang-bn"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: lang === 'bn' ? '#0369a1' : 'transparent',
                color: lang === 'bn' ? '#ffffff' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              বাংলা
            </button>
          </div>

          {/* Last Synchronized Status Badge */}

        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          color: '#991b1b',
          fontSize: '13px',
          fontWeight: 600
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
              fontSize: '12px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content: All Upazilas Overview vs Single Upazila Forecast */}
      {viewMode === 'all' ? (
        districtForecastData ? (
          <BmdDistrictAllUpazilasView
            districtData={districtForecastData}
            isLoading={isLoadingDistrict}
            lang={lang}
            onSelectUpazila={(upazilaCode) => {
              setSelectedUpazila(upazilaCode);
              router.push(`/bmd/${upazilaCode}`);
            }}
            onReloadDistrict={() => loadDistrictForecast(selectedDistrict, lang, true)}
          />
        ) : (
          <div style={{
            padding: '70px 20px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              marginBottom: '16px'
            }}>
              <RefreshCw size={26} className="animate-spin-fast" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              {lang === 'bn' ? `${districtLabel} জেলার সকল উপজেলার আবহাওয়া লোড হচ্ছে...` : `Loading All Upazilas in ${districtLabel}...`}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {lang === 'bn' ? 'বাংলাদেশ আবহাওয়া অধিদপ্তরের তথ্য সংগ্রহ হচ্ছে।' : 'Fetching real-time BMDWRF meteorological telemetry for all stations.'}
            </p>
          </div>
        )
      ) : (
        <>
          {/* Back to All Upazilas Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '12px 18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="#0369a1" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                {lang === 'bn'
                  ? `${districtLabel} জেলা / ${upazilaLabel} উপজেলা`
                  : `${upazilaLabel}, ${districtLabel} District`}
              </span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                fontWeight: 600
              }}>
                {selectedUpazila}
              </span>
            </div>

            <Link
              href="/bmd"
              onClick={() => setViewMode('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: '#f0f9ff',
                color: '#0369a1',
                border: '1px solid #bae6fd',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0369a1';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f9ff';
                e.currentTarget.style.color = '#0369a1';
              }}
            >
              <LayoutGrid size={14} />
              <span>
                {lang === 'bn'
                  ? `← ${districtLabel} জেলার সকল উপজেলা (${upazilas.length}) দেখুন`
                  : `← View All ${upazilas.length} Upazilas in ${districtLabel}`}
              </span>
            </Link>
          </div>

          {/* Single Upazila Weather Details */}
          {isLoadingForecast && !forecastData ? (
            <div style={{
              padding: '70px 20px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                marginBottom: '16px'
              }}>
                <RefreshCw size={26} className="animate-spin-fast" />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                {lang === 'bn' ? 'বাংলাদেশ আবহাওয়া অধিদপ্তরের তথ্য সংগ্রহ হচ্ছে...' : 'Fetching Bangladesh Meteorological Department Feeds...'}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                {lang === 'bn' ? 'উপজেলার সর্বশেষ আবহাওয়ার তথ্য ও ৩-ঘণ্টার পূর্বাভাস লোড করা হচ্ছে।' : 'Scanning BMDWRF model for current station feeds and 3-hourly steps.'}
              </p>
            </div>
          ) : forecastData ? (
            <>
              {/* -------------------------------------------------------------
              HERO WEATHER CARD: Deep Midnight Navy to Ocean Blue
             ------------------------------------------------------------- */}
              <div style={{
                background: forecastData.hero.isNight
                  ? 'linear-gradient(112deg, #04091e 0%, #081232 28%, #0f1e56 55%, #1a8ac6ff 55%, #32b2f7ff 55%, #32b2f7ff 55%)'
                  : 'linear-gradient(112deg, #060e2f 0%, #081a4a 28%, #0a336f 55%, #0a6291ff 76%, #32b2f7ff 92%, #32b2f7ff 100%)',
                color: '#ffffff',
                borderRadius: '26px',
                padding: '30px 36px 20px',
                boxShadow: '0 20px 45px -10px rgba(3, 105, 161, 0.4), 0 0 25px rgba(3, 105, 161, 0.15)',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.14)'
              }}>
                {/* Right-side radial ocean glow */}
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  width: '45%',
                  height: '100%',
                  background: 'radial-gradient(ellipse at 92% 45%, rgba(3, 105, 161, 0.35) 0%, rgba(10, 51, 111, 0.18) 42%, transparent 75%)',
                  pointerEvents: 'none'
                }} />

                {/* Hero Top: Date, Location & Condition Badge */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '20px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {/* Date & Location */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.92)' }}>
                      <Calendar size={18} color="rgba(255,255,255,0.85)" />
                      <span>{forecastData.hero.dateFormatted}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#ffffff', letterSpacing: '-0.01em' }}>
                      <MapPin size={24} color="#ffffff" strokeWidth={2.4} />
                      <span>{forecastData.hero.locationTitle}</span>
                    </div>
                  </div>

                  {/* Weather Icon & Condition Name in Frosted Glass Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    padding: '12px 24px',
                    borderRadius: '22px',
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                  }}>
                    <BmdWeatherIcon iconType={forecastData.hero.conditionIcon} size={48} />
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                        {forecastData.hero.conditionText}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginTop: '2px' }}>
                        {forecastData.hero.isNight ? (lang === 'bn' ? 'রাত্রিকালীন অবস্থা' : 'Night Time') : (lang === 'bn' ? 'দিবাকালীন অবস্থা' : 'Day Time')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider 1 */}
                <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.12)', margin: '24px 0 22px', position: 'relative', zIndex: 1 }} />

                {/* Hero Metrics: Humidity, Temperature & Real Feel, Wind */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '24px',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {/* 1. Relative Humidity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Droplets size={26} color="#38bdf8" strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: 500 }}>
                        {lang === 'bn' ? 'আপেক্ষিক আর্দ্রতা' : 'Relative Humidity'}
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, marginTop: '2px' }}>
                        {forecastData.hero.humidityFormatted}
                      </div>
                    </div>
                  </div>

                  {/* 2. Temperature & Real Feel */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Thermometer size={26} color="#fca5a5" strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: 500 }}>
                        {lang === 'bn' ? 'তাপমাত্রা' : 'Temperature'}
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, marginTop: '2px' }}>
                        {forecastData.hero.tempFormatted}
                      </div>
                      <div style={{ fontSize: '12px', color: '#fef08a', fontWeight: 600, marginTop: '3px' }}>
                        {forecastData.hero.realFeelFormatted}
                      </div>
                    </div>
                  </div>

                  {/* 3. Wind Speed & Direction */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Wind size={26} color="#5eead4" strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: 500 }}>
                        {lang === 'bn' ? 'বাতাসের গতিবেগ ও দিক' : 'Wind Speed & Direction'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '26px', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, marginTop: '2px' }}>
                        <span>{forecastData.hero.windSpeedFormatted}</span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#22d3ee' }}>
                          <Navigation
                            size={18}
                            style={{
                              transform: `rotate(${forecastData.hero.windDirectionDeg}deg)`,
                              transition: 'transform 0.3s ease'
                            }}
                          />
                          <span style={{ fontSize: '20px', fontWeight: 800 }}>{forecastData.hero.windDirectionText}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider 2 */}
                <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '22px 0 14px', position: 'relative', zIndex: 1 }} />

                {/* Source & Attribution Time Bar */}
                <div style={{
                  fontSize: '11.5px',
                  color: 'rgba(255, 255, 255, 0.65)',
                  textAlign: 'right',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <span>{forecastData.hero.dataSourceTime}</span>
                </div>
              </div>

              {/* -------------------------------------------------------------
              8-DAY DAILY FORECAST GRID: Weather Cards
             ------------------------------------------------------------- */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {lang === 'bn'
                      ? `আগামী ${toBengaliNumber(forecastData.daily.length)} দিনের দৈনিক আবহাওয়ার পূর্বাভাস`
                      : `${forecastData.daily.length}-Day Daily Weather Forecast`}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {lang === 'bn' ? 'বিএমডিডাব্লিউআরএফ আবহাওয়া মডেল অনুযায়ী' : 'According to BMDWRF Numerical Model'}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '12px'
                }}>
                  {forecastData.daily.map(day => (
                    <div
                      key={day.dayIndex}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '14px 10px',
                        textAlign: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 18px rgba(3, 105, 161, 0.12)';
                        e.currentTarget.style.borderColor = '#0369a1';
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      {/* Weekday & Date */}
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {day.dateWeek}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                        {day.dateFormatted.split(',')[0]}
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '6px 0' }} />

                      {/* Weather Icon with Night Mini Badge */}
                      <div style={{ position: 'relative', display: 'inline-block', margin: '6px 0' }}>
                        <BmdWeatherIcon iconType={day.conditionIcon} size={44} />
                        <div style={{
                          position: 'absolute',
                          right: '-6px',
                          bottom: '-4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid #ffffff'
                        }}>
                          <BmdWeatherIcon iconType={day.conditionNightIcon} size={14} />
                        </div>
                      </div>

                      <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#2563eb',
                        minHeight: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1.2
                      }}>
                        {day.conditionText}
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '6px 0' }} />

                      {/* Temperature Max / Min */}
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#dc2626' }}>
                        {day.tempFormatted}
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '6px 0' }} />

                      {/* Rain */}
                      <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
                        {day.rainFormatted}
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '6px 0' }} />

                      {/* Wind Direction & Speed */}
                      <div style={{
                        fontSize: '11px',
                        color: '#0f766e',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}>
                        <Navigation
                          size={11}
                          style={{ transform: `rotate(${day.windDirectionDeg}deg)` }}
                        />
                        <span>{day.windFormatted}</span>
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '6px 0' }} />

                      {/* Relative Humidity */}
                      <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                        {day.humidityFormatted}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* -------------------------------------------------------------
              3-HOURLY INTERACTIVE HIGH-PRECISION CHARTS
             ------------------------------------------------------------- */}
              <BmdHourlyCharts
                hourly={forecastData.hourly}
                upazilaName={upazilaLabel || forecastData.upazilaName}
                lang={lang}
              />

            </>
          ) : null}
        </>
      )}
    </div>
  );
}
