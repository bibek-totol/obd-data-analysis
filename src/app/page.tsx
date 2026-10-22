'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Sidebar, { ActiveSection } from '@/components/Sidebar';
import LocationSelector from '@/components/LocationSelector';
import HeroWeatherCard from '@/components/HeroWeatherCard';
import DailyForecastGrid from '@/components/DailyForecastGrid';
import HourlyForecastCharts from '@/components/HourlyForecastCharts';
import AdvisorySection from '@/components/AdvisorySection';
import {
  DistrictItem,
  UpazilaItem,
  ForecastResponseData,
  DEFAULT_DISTRICTS,
  DEFAULT_UPAZILAS
} from '@/lib/nlas-client';
import { AlertCircle, RefreshCw, CheckCircle2, Info } from 'lucide-react';

export default function HomePage() {
  // Navigation State
  const [activeSection, setActiveSection] = useState<ActiveSection>('forecast');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentLang, setCurrentLang] = useState<'EN' | 'বাংলা'>('EN');

  // Location & Data States
  const [districts, setDistricts] = useState<DistrictItem[]>(DEFAULT_DISTRICTS);
  const [upazilas, setUpazilas] = useState<UpazilaItem[]>(DEFAULT_UPAZILAS['3026'] || []);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('3026'); // Dhaka
  const [selectedUpazila, setSelectedUpazila] = useState<string>('302602'); // Adabor

  const [forecastData, setForecastData] = useState<ForecastResponseData | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(true);
  const [isLoadingUpazilas, setIsLoadingUpazilas] = useState<boolean>(false);
  const [lastReloadTime, setLastReloadTime] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Fetch Forecast Data
  const loadForecast = useCallback(async (upazilaCode: string, isManualRefresh = false) => {
    // If not manual refresh and already in client cache, paint immediately!
    if (!isManualRefresh && clientCacheRef.current[upazilaCode]) {
      setForecastData(clientCacheRef.current[upazilaCode]);
      setIsLoadingForecast(false);
      return;
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


  // Initial Forecast Load
  useEffect(() => {
    loadForecast(selectedUpazila);
  }, [loadForecast, selectedUpazila]);

  // Handle District Change
  const handleDistrictChange = async (districtCode: string) => {
    setSelectedDistrict(districtCode);
    setIsLoadingUpazilas(true);

    try {
      const res = await fetch(`/api/nlas/upazilas?districtCode=${districtCode}`);
      const json = await res.json();

      if (json.success && json.upazilas?.length > 0) {
        setUpazilas(json.upazilas);
        const firstUpazila = json.upazilas[0].value;
        setSelectedUpazila(firstUpazila);
        loadForecast(firstUpazila);
      } else {
        const fallback = DEFAULT_UPAZILAS[districtCode] || [];
        setUpazilas(fallback);
        if (fallback.length > 0) {
          setSelectedUpazila(fallback[0].value);
          loadForecast(fallback[0].value);
        }
      }
    } catch (err) {
      console.error('Error fetching upazilas:', err);
      const fallback = DEFAULT_UPAZILAS[districtCode] || [];
      setUpazilas(fallback);
      if (fallback.length > 0) {
        setSelectedUpazila(fallback[0].value);
        loadForecast(fallback[0].value);
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
        onReload={handleManualReload}
        isLoading={isLoadingForecast}
        lastUpdated={lastReloadTime}
        source={forecastData?.source || 'BMDWRF'}
        currentLang={currentLang}
        onLangChange={setCurrentLang}
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
                  {activeSection === 'forecast' ? 'Weather Forecast Section' : 'Advisory Section'}
                </span>
              </div>
              <h1 style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#0f172a',
                marginTop: '4px'
              }}>
                {activeSection === 'forecast'
                  ? `Weather Forecast: ${upazilaLabel}, ${districtLabel}`
                  : `Livestock Advisory: ${upazilaLabel}, ${districtLabel}`}
              </h1>
            </div>

            {/* Quick Status Pill */}
            {lastReloadTime && (
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
                <span>Synchronized at: <strong>{lastReloadTime}</strong></span>
              </div>
            )}
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

          {/* Conditional View: Forecast vs Advisory */}
          {activeSection === 'advisory' ? (
            <AdvisorySection
              districtName={districtLabel}
              upazilaName={upazilaLabel}
            />
          ) : (
            <>
              {/* Forecast Section */}
              {isLoadingForecast && !forecastData ? (
                /* Loading Skeleton */
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
                    Fetching Real-Time Meteorological Feeds
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>
                    Scanning and pulling the latest 5-6 day weather data and 3-hourly forecast...
                  </p>
                </div>
              ) : forecastData ? (
                <>
                  {/* Hero Weather Card with Location Selector Slot */}
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
                      />
                    }
                  />

                  {/* 5-6 Days Weather Cards */}
                  <DailyForecastGrid daily={forecastData.daily} />

                  {/* 3-Hourly Forecast Charts */}
                  <HourlyForecastCharts
                    hourly={forecastData.hourly}
                    upazilaName={forecastData.location.upazila_name}
                  />
                </>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
