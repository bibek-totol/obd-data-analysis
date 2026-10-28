'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sprout,
  Calendar,
  Clock,
  Printer,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  Cloud,
  Search,
  Sparkles,
  Info,
  Compass,
  LayoutGrid,
  MapPin
} from 'lucide-react';
import { BAMIS_DISTRICTS, BamisBulletinData, BamisDistrict } from '@/lib/bamis-client';
import BamisAllDistrictsView from './BamisAllDistrictsView';
import { BamisAllDistrictsResponse } from '@/lib/bamis-all-districts';

interface BamisSectionProps {
  onRegisterReload?: (reloadFn: () => void) => void;
  onLoadingChange?: (loading: boolean) => void;
  onLastReloadTimeChange?: (time: string) => void;
  initialDistrictId?: string;
  forceSingleView?: boolean;
}

const MAJOR_DISTRICTS = [
  { id: '37', labelBn: 'ঢাকা', labelEn: 'Dhaka' },
  { id: '57', labelBn: 'চট্টগ্রাম', labelEn: 'Chattogram' },
  { id: '5', labelBn: 'রাজশাহী', labelEn: 'Rajshahi' },
  { id: '65', labelBn: 'খুলনা', labelEn: 'Khulna' },
  { id: '50', labelBn: 'সিলেট', labelEn: 'Sylhet' },
  { id: '22', labelBn: 'বরিশাল', labelEn: 'Barishal' },
  { id: '31', labelBn: 'রংপুর', labelEn: 'Rangpur' },
  { id: '34', labelBn: 'ময়মনসিংহ', labelEn: 'Mymensingh' },
  { id: '54', labelBn: 'কুমিল্লা', labelEn: 'Cumilla' },
  { id: '61', labelBn: 'কক্সবাজার', labelEn: "Cox's Bazar" }
];

export default function BamisSection({
  onRegisterReload,
  onLoadingChange,
  onLastReloadTimeChange,
  initialDistrictId,
  forceSingleView = false
}: BamisSectionProps) {
  const router = useRouter();

  // View Mode: 'all' displays all 64 zillas in one section (Default); 'single' displays single zilla deep bulletin
  const [viewMode, setViewMode] = useState<'all' | 'single'>(forceSingleView ? 'single' : 'all');

  // Location & Language States
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(initialDistrictId || '57');
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [weatherTab, setWeatherTab] = useState<'forecast' | 'past'>('forecast');

  // All 64 Districts Data State
  const [allDistrictsData, setAllDistrictsData] = useState<BamisAllDistrictsResponse | null>(null);
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(true);

  // Single District Data State
  const [bulletinData, setBulletinData] = useState<BamisBulletinData | null>(null);
  const [isLoadingSingle, setIsLoadingSingle] = useState<boolean>(false);

  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [copiedCategory, setCopiedCategory] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Sync state if initialDistrictId changes
  useEffect(() => {
    if (initialDistrictId && initialDistrictId !== selectedDistrictId) {
      setSelectedDistrictId(initialDistrictId);
    }
    if (forceSingleView) {
      setViewMode('single');
    }
  }, [initialDistrictId, forceSingleView]);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    try {
      if (!forceSingleView) {
        const savedMode = sessionStorage.getItem('bamis_view_mode') as 'all' | 'single' | null;
        if (savedMode) setViewMode(savedMode);
      } else {
        setViewMode('single');
      }

      const savedDistrict = initialDistrictId || sessionStorage.getItem('bamis_selected_district');
      const savedLang = sessionStorage.getItem('bamis_lang') as 'bn' | 'en' | null;
      if (savedDistrict) setSelectedDistrictId(savedDistrict);
      if (savedLang) setLang(savedLang);

      // Restore cached all districts data
      const cachedAll = sessionStorage.getItem(`bamis_all_districts_${savedLang || 'bn'}`);
      if (cachedAll) {
        const parsed = JSON.parse(cachedAll);
        if (parsed && parsed.districts && parsed.districts.length > 0) {
          setAllDistrictsData(parsed);
          setIsLoadingAll(false);
        }
      }

      // Restore cached single district data
      const currentTargetDistrict = initialDistrictId || savedDistrict || '57';
      const savedSingle = sessionStorage.getItem(`bamis_data_${currentTargetDistrict}_${savedLang || 'bn'}`);
      if (savedSingle) {
        const parsedSingle = JSON.parse(savedSingle);
        setBulletinData(parsedSingle);
      }
    } catch (e) {
      // Ignore sessionStorage errors
    }
  }, [forceSingleView, initialDistrictId]);

  // 1. Fetch All 64 Districts Data
  const loadAllDistricts = async (currentLang: 'bn' | 'en', forceReload: boolean = false) => {
    setIsLoadingAll(true);
    onLoadingChange?.(true);

    try {
      const url = `/api/bamis/all-districts?lang=${currentLang}${forceReload ? '&forceReload=true' : ''}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.status === 'success' && json.data) {
        setAllDistrictsData(json.data);
        const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        setLastUpdated(timeNow);
        onLastReloadTimeChange?.(timeNow);

        try {
          sessionStorage.setItem(`bamis_all_districts_${currentLang}`, JSON.stringify(json.data));
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error('Failed to load BAMIS all districts:', err);
    } finally {
      setIsLoadingAll(false);
      onLoadingChange?.(false);
    }
  };

  // 2. Fetch Single District Bulletin Data
  const loadBulletin = async (districtId: string, currentLang: 'bn' | 'en', forceReload: boolean = false) => {
    setIsLoadingSingle(true);
    onLoadingChange?.(true);

    try {
      const url = `/api/bamis/bulletin?districtId=${districtId}&lang=${currentLang}${forceReload ? '&forceReload=true' : ''}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.status === 'success' && json.data) {
        setBulletinData(json.data);
        const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        setLastUpdated(timeNow);
        onLastReloadTimeChange?.(timeNow);

        try {
          sessionStorage.setItem(`bamis_data_${districtId}_${currentLang}`, JSON.stringify(json.data));
          sessionStorage.setItem('bamis_selected_district', districtId);
          sessionStorage.setItem('bamis_lang', currentLang);
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error('Failed to load BAMIS bulletin:', err);
    } finally {
      setIsLoadingSingle(false);
      onLoadingChange?.(false);
    }
  };

  // Register parent reload callback
  useEffect(() => {
    if (onRegisterReload) {
      onRegisterReload(() => {
        if (viewMode === 'all') {
          loadAllDistricts(lang, true);
        } else {
          loadBulletin(selectedDistrictId, lang, true);
        }
      });
    }
  }, [viewMode, selectedDistrictId, lang, onRegisterReload]);

  // Load all districts when lang changes
  useEffect(() => {
    loadAllDistricts(lang, false);
  }, [lang]);

  // Load single district when selectedDistrictId or lang changes
  useEffect(() => {
    if (viewMode === 'single') {
      loadBulletin(selectedDistrictId, lang, false);
    }
  }, [selectedDistrictId, lang, viewMode]);

  const currentDistrict = BAMIS_DISTRICTS.find(d => d.id === selectedDistrictId) || BAMIS_DISTRICTS[9]; // default 57

  const copyToClipboard = (text: string, categoryKey?: string) => {
    navigator.clipboard.writeText(text);
    if (categoryKey) {
      setCopiedCategory(categoryKey);
      setTimeout(() => setCopiedCategory(null), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  // Extract key metrics from single bulletin forecast table
  const forecastRainRow = bulletinData?.forecastWeather.rows.find(r => r.parameter.includes('বৃষ্টিপাত'));
  const forecastMaxTempRow = bulletinData?.forecastWeather.rows.find(r => r.parameter.includes('সর্বোচ্চ তাপমাত্রা'));
  const forecastMinTempRow = bulletinData?.forecastWeather.rows.find(r => r.parameter.includes('সর্বনিমণ') || r.parameter.includes('সর্বনিম্ন'));
  const forecastHumidityRow = bulletinData?.forecastWeather.rows.find(r => r.parameter.includes('আর্দ্রতা'));

  const isCurrentLoading = viewMode === 'all' ? isLoadingAll : isLoadingSingle;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* -------------------------------------------------------------
          1. HEADER BANNER & DAE AGRO BRANDING
         ------------------------------------------------------------- */}
      <div style={{
        background: 'linear-gradient(135deg, #064e2e 0%, #0c713e 50%, #15803d 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(12, 113, 62, 0.3), 0 4px 10px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(74, 222, 128, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#bbf7d0',
            flexShrink: 0
          }}>
            <Sprout size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#bbf7d0',
                fontWeight: 800,
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                BAMIS • DAE BANGLADESH
              </span>
              <span style={{
                fontSize: '11px',
                color: '#dcfce7',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={12} />
                {lastUpdated ? `Live Synchronized: ${lastUpdated}` : 'Real-time Agromet Feed'}
              </span>
            </div>

            <h1 style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 4px 0',
              lineHeight: 1.2
            }}>
              {lang === 'bn' ? 'বাংলাদেশ কৃষি আবহাওয়া তথ্য সেবা (বামিস)' : 'Bangladesh Agro-Meteorological Information Service'}
            </h1>
            <p style={{
              fontSize: '12px',
              color: '#dcfce7',
              margin: 0,
              fontWeight: 500
            }}>
              {lang === 'bn'
                ? 'কৃষি সম্প্রসারণ অধিদপ্তর (ডিএই) • কৃষি মন্ত্রণালয়, গণপ্রজাতন্ত্রী বাংলাদেশ সরকার'
                : 'Department of Agricultural Extension (DAE) • Ministry of Agriculture, Govt of Bangladesh'}
            </p>
          </div>
        </div>

        {/* Right side controls: View Switcher, Bilingual Switcher, Reload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

          {/* View Mode Segmented Switcher */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            padding: '3px',
            borderRadius: '9px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <button
              onClick={() => {
                sessionStorage.setItem('bamis_view_mode', 'all');
                if (forceSingleView) {
                  router.push('/bamis');
                } else {
                  setViewMode('all');
                }
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'all' ? '#ffffff' : 'transparent',
                color: viewMode === 'all' ? '#0c713e' : '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={14} />
              <span>{lang === 'bn' ? 'সকল জেলা (৬৪)' : 'All 64 Zillas'}</span>
            </button>

            <button
              onClick={() => {
                sessionStorage.setItem('bamis_view_mode', 'single');
                if (!forceSingleView) {
                  router.push(`/bamis/${selectedDistrictId}`);
                } else {
                  setViewMode('single');
                  if (!bulletinData) {
                    loadBulletin(selectedDistrictId, lang, false);
                  }
                }
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'single' ? '#ffffff' : 'transparent',
                color: viewMode === 'single' ? '#0c713e' : '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <MapPin size={14} />
              <span>{lang === 'bn' ? 'একক জেলা' : 'Single Zilla'}</span>
            </button>
          </div>

          {/* Bilingual Switcher */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <button
              onClick={() => {
                setLang('en');
                sessionStorage.setItem('bamis_lang', 'en');
              }}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: lang === 'en' ? '#ffffff' : 'transparent',
                color: lang === 'en' ? '#0c713e' : '#ffffff',
                transition: 'all 0.15s ease'
              }}
            >
              English
            </button>
            <button
              onClick={() => {
                setLang('bn');
                sessionStorage.setItem('bamis_lang', 'bn');
              }}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: lang === 'bn' ? '#ffffff' : 'transparent',
                color: lang === 'bn' ? '#0c713e' : '#ffffff',
                transition: 'all 0.15s ease'
              }}
            >
              বাংলা
            </button>
          </div>

          {/* Reload Button */}
          <button
            onClick={() => {
              if (viewMode === 'all') {
                loadAllDistricts(lang, true);
              } else {
                loadBulletin(selectedDistrictId, lang, true);
              }
            }}
            disabled={isCurrentLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              color: '#0c713e',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isCurrentLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { if (!isCurrentLoading) e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
            onMouseLeave={(e) => { if (!isCurrentLoading) e.currentTarget.style.backgroundColor = '#ffffff'; }}
          >
            <RefreshCw size={14} className={isCurrentLoading ? 'animate-spin-fast' : ''} />
            <span>
              {isCurrentLoading
                ? (lang === 'bn' ? 'লোড হচ্ছে...' : 'Refreshing...')
                : (lang === 'bn' ? 'তাজা বুলেটিন' : 'Reload Bulletin')}
            </span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. VIEW MODE ROUTING: ALL ZILLAS VS SINGLE ZILLA
         ------------------------------------------------------------- */}
      {viewMode === 'all' ? (
        /* ALL 64 ZILLAS IN ONE SECTION */
        <BamisAllDistrictsView
          data={allDistrictsData!}
          isLoading={isLoadingAll && !allDistrictsData}
          lang={lang}
          onSelectDistrict={(distId) => {
            setSelectedDistrictId(distId);
            sessionStorage.setItem('bamis_selected_district', distId);
            sessionStorage.setItem('bamis_view_mode', 'single');
            router.push(`/bamis/${distId}`);
          }}
          onReload={() => loadAllDistricts(lang, true)}
        />
      ) : (
        /* SINGLE ZILLA DEEP BULLETIN VIEW */
        <>
          {/* Return to All Zillas Navigation Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '12px 18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <Link
              href="/bamis"
              onClick={() => {
                sessionStorage.setItem('bamis_view_mode', 'all');
                setViewMode('all');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#e8f5f0',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#0c713e',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dcfce7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e8f5f0'; }}
            >
              <LayoutGrid size={15} />
              <span>{lang === 'bn' ? '← সকল ৬৪ জেলার তথ্য ও তালিকায় ফিরে যান' : '← Back to All 64 Districts Overview'}</span>
            </Link>

            <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
              {lang === 'bn'
                ? <>বর্তমান নির্বাচিত জেলা: <strong style={{ color: '#0c713e' }}>{currentDistrict.nameBn}</strong></>
                : <>Currently Viewing: <strong style={{ color: '#0c713e' }}>{currentDistrict.nameEn}</strong> District</>}
            </span>
          </div>

          {/* District Selection & Quick Jump Toolbar */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}>
              {/* Main District Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  {lang === 'bn' ? 'অন্য জেলা নির্বাচন করুন:' : 'Change District:'}
                </span>
                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <select
                    id="select-bamis-district"
                    value={selectedDistrictId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedDistrictId(newId);
                      sessionStorage.setItem('bamis_selected_district', newId);
                      if (forceSingleView) {
                        router.push(`/bamis/${newId}`);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 36px 9px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer',
                      appearance: 'none',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                  >
                    {BAMIS_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameEn} ({d.nameBn})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#64748b'
                    }}
                  />
                </div>

                <span style={{
                  fontSize: '12px',
                  backgroundColor: '#e8f5f0',
                  color: '#0c713e',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: 700
                }}>
                  {lang === 'bn' ? currentDistrict.nameBn : currentDistrict.nameEn} জেলা
                </span>
              </div>

              {/* Actions: Print */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  title="Print official agromet bulletin"
                  style={{
                    display: 'inline-flex',
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
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#0c713e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  <Printer size={14} />
                  <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
                </button>
              </div>
            </div>

            {/* Quick District Jump Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '10px'
            }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                {lang === 'bn' ? 'প্রধান জেলাসমূহ:' : 'Major Districts:'}
              </span>
              {MAJOR_DISTRICTS.map((d) => {
                const isActive = d.id === selectedDistrictId;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDistrictId(d.id);
                      sessionStorage.setItem('bamis_selected_district', d.id);
                      if (forceSingleView) {
                        router.push(`/bamis/${d.id}`);
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: isActive ? 700 : 500,
                      border: isActive ? '1px solid #0c713e' : '1px solid #e2e8f0',
                      backgroundColor: isActive ? '#e8f5f0' : '#ffffff',
                      color: isActive ? '#0c713e' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lang === 'bn' ? d.labelBn : d.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading Spinner for Single District */}
          {isLoadingSingle && !bulletinData ? (
            <div style={{
              padding: '80px 20px',
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
                backgroundColor: '#e8f5f0',
                color: '#0c713e',
                marginBottom: '16px'
              }}>
                <RefreshCw size={28} className="animate-spin-fast" />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                {lang === 'bn' ? `${currentDistrict.nameBn} জেলার কৃষি আবহাওয়া বুলেটিন আনা হচ্ছে...` : `Fetching Agromet Bulletin for ${currentDistrict.nameEn}...`}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                {lang === 'bn'
                  ? 'কৃষি সম্প্রসারণ অধিদপ্তর (বামিস) হতে সর্বশেষ আবহাওয়া পরিস্থিতি এবং ফসলভিত্তিক পরামর্শ সংগ্রহ করা হচ্ছে।'
                  : 'Connecting to DAE BAMIS servers for real-time agromet observations and crop advisories.'}
              </p>
            </div>
          ) : bulletinData ? (
            <>
              {/* Single District KPI Telemetry Banner */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '16px'
              }}>
                {/* Card 1: Bulletin Meta */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>

                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                      {lang === 'bn' ? 'বুলেটিন নং ও তারিখ' : 'Bulletin No & Date'}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {lang === 'bn' ? `বুলেটিন নং ${bulletinData.bulletinNo}` : `Bulletin No ${bulletinData.bulletinNo}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                      {bulletinData.bulletinDate}
                    </div>
                  </div>
                </div>

                {/* Card 2: Validity Window */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>

                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                      {lang === 'bn' ? 'কার্যকর মেয়াদকাল' : 'Validity Window'}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {bulletinData.forecastWeather.dates.length > 0
                        ? `${bulletinData.forecastWeather.dates[0]} — ${bulletinData.forecastWeather.dates[bulletinData.forecastWeather.dates.length - 1]}`
                        : '৫ দিনের পূর্বাভাস'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
                      {lang === 'bn' ? 'আগামী ৫ দিনের পূর্বাভাস' : '5-Day Outlook'}
                    </div>
                  </div>
                </div>

                {/* Card 3: Rain Outlook */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>

                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                      {lang === 'bn' ? 'বৃষ্টিপাত পূর্বাভাস' : 'Rainfall Outlook'}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {forecastRainRow ? forecastRainRow.range : '০.০ মি.মি'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {lang === 'bn' ? 'পরবর্তী ৫ দিনের মোট' : 'Next 5-day span'}
                    </div>
                  </div>
                </div>

                {/* Card 4: Temperature Range */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>

                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                      {lang === 'bn' ? 'তাপমাত্রা পরিসীমা' : 'Temperature Span'}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      Max: {forecastMaxTempRow?.range || '২৮.৪-৩৩.৪°C'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Min: {forecastMinTempRow?.range || '২১.৬-২৪.৮°C'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Data Tables Section */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                {/* Weather Sub-Tab Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '20px',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '16px'
                }}>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                      {weatherTab === 'forecast' ? bulletinData.forecastWeather.heading : bulletinData.pastWeather.heading}
                    </h2>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                      {weatherTab === 'forecast'
                        ? (lang === 'bn' ? 'বাংলাদেশ আবহাওয়া অধিদপ্তর (বিএমডি) হতে প্রাপ্ত আগামী ৫ দিনের পূর্বাভাস' : 'BMD-derived 5-day predictive meteorological telemetry')
                        : (lang === 'bn' ? 'বিগত ৪ দিনের প্রত্যক্ষ কৃষি পর্যবেক্ষণ উপাত্ত' : 'Past 4 days ground observed agromet telemetry')}
                    </p>
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    backgroundColor: '#f8fafc',
                    padding: '3px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <button
                      onClick={() => setWeatherTab('forecast')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: weatherTab === 'forecast' ? '#0c713e' : 'transparent',
                        color: weatherTab === 'forecast' ? '#ffffff' : '#64748b',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {lang === 'bn' ? 'আগামী ৫ দিনের পূর্বাভাস' : 'Next 5 Days Forecast'}
                    </button>
                    <button
                      onClick={() => setWeatherTab('past')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: weatherTab === 'past' ? '#0c713e' : 'transparent',
                        color: weatherTab === 'past' ? '#ffffff' : '#64748b',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {lang === 'bn' ? 'বিগত ৪ দিনের উপাত্ত' : 'Past 4 Days Observed'}
                    </button>
                  </div>
                </div>

                {/* Modern Weather Table */}
                {(() => {
                  const activeTable = weatherTab === 'forecast' ? bulletinData.forecastWeather : bulletinData.pastWeather;
                  return (
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'separate',
                        borderSpacing: '0',
                        fontSize: '13px',
                        textAlign: 'left'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc' }}>
                            <th style={{
                              padding: '12px 16px',
                              borderBottom: '2px solid #e2e8f0',
                              borderTopLeftRadius: '8px',
                              fontWeight: 700,
                              color: '#334155',
                              minWidth: '220px'
                            }}>
                              {lang === 'bn' ? 'আবহাওয়ার স্থিতিমাপ (প্যারামিটার)' : 'Meteorological Parameter'}
                            </th>
                            {activeTable.dates.map((date, idx) => (
                              <th
                                key={idx}
                                style={{
                                  padding: '12px 14px',
                                  borderBottom: '2px solid #e2e8f0',
                                  fontWeight: 700,
                                  color: '#0f172a',
                                  textAlign: 'center',
                                  minWidth: '110px'
                                }}
                              >
                                {date}
                              </th>
                            ))}
                            <th style={{
                              padding: '12px 16px',
                              borderBottom: '2px solid #e2e8f0',
                              borderTopRightRadius: '8px',
                              fontWeight: 700,
                              color: '#0c713e',
                              textAlign: 'center',
                              minWidth: '130px',
                              backgroundColor: '#e8f5f0'
                            }}>
                              {lang === 'bn' ? 'পরিসীমা (সীমা)' : 'Range / Total'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeTable.rows.map((row, rIdx) => {
                            const isRain = row.parameter.includes('বৃষ্টিপাত');
                            const isMaxTemp = row.parameter.includes('সর্বোচ্চ তাপমাত্রা');
                            const isMinTemp = row.parameter.includes('সর্বনিমণ') || row.parameter.includes('সর্বনিম্ন');
                            const isHumidity = row.parameter.includes('আর্দ্রতা');
                            const isWind = row.parameter.includes('গতিবেগ');

                            return (
                              <tr
                                key={rIdx}
                                style={{
                                  backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#fcfdfd',
                                  transition: 'background-color 0.1s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f8f5'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = rIdx % 2 === 0 ? '#ffffff' : '#fcfdfd'; }}
                              >
                                <td style={{
                                  padding: '12px 16px',
                                  borderBottom: '1px solid #f1f5f9',
                                  fontWeight: 600,
                                  color: '#1e293b'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {isRain ? <CloudRain size={16} color="#0284c7" /> :
                                      isMaxTemp ? <Thermometer size={16} color="#ea580c" /> :
                                        isMinTemp ? <Thermometer size={16} color="#0284c7" /> :
                                          isHumidity ? <Droplets size={16} color="#0891b2" /> :
                                            isWind ? <Wind size={16} color="#475569" /> :
                                              <Cloud size={16} color="#64748b" />}
                                    <span>{row.parameter}</span>
                                  </div>
                                </td>

                                {row.values.map((val, vIdx) => (
                                  <td
                                    key={vIdx}
                                    style={{
                                      padding: '12px 14px',
                                      borderBottom: '1px solid #f1f5f9',
                                      textAlign: 'center',
                                      color: isRain && val !== '০.০' && val !== '0.0' ? '#0284c7' : '#334155',
                                      fontWeight: isRain && val !== '০.০' && val !== '0.0' ? 700 : 500
                                    }}
                                  >
                                    {val}
                                  </td>
                                ))}

                                <td style={{
                                  padding: '12px 16px',
                                  borderBottom: '1px solid #f1f5f9',
                                  textAlign: 'center',
                                  fontWeight: 700,
                                  color: '#0c713e',
                                  backgroundColor: '#f6fbf8'
                                }}>
                                  {row.range}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Agricultural Advisories Section */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '20px',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: '#e8f5f0',
                      color: '#0c713e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Sprout size={22} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {lang === 'bn' ? 'ফসল ও কৃষি আবহাওয়া বিষয়ক পরামর্শমালা' : 'Crop & Agro-Meteorological Advisories'}
                      </h2>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                        {lang === 'bn'
                          ? `কৃষি সম্প্রসারণ অধিদপ্তর (DAE) ও গবেষণা প্রতিষ্ঠানের বিশেষজ্ঞদের সুপারিশকৃত নির্দেশনা (${currentDistrict.nameBn} জেলা)`
                          : `Specialized agro-meteorological directives for ${currentDistrict.nameEn} district`}
                      </p>
                    </div>
                  </div>

                  {/* Copy All Advisories Button */}
                  <button
                    onClick={() => {
                      const allText = bulletinData.advisories.map(a => `【${a.category}】\n` + a.items.map(i => `• ${i}`).join('\n')).join('\n\n');
                      copyToClipboard(allText);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {copiedAll ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                    <span>{copiedAll ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied!') : (lang === 'bn' ? 'সকল পরামর্শ কপি করুন' : 'Copy All')}</span>
                  </button>
                </div>

                {/* Grid of Advisory Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '16px'
                }}>
                  {bulletinData.advisories.map((advisory, idx) => {
                    const isRice = advisory.category.includes('ধান');
                    const isVeg = advisory.category.includes('সবজি');
                    const isFruit = advisory.category.includes('উদ্যান');
                    const isCattle = advisory.category.includes('পশু');
                    const isPoultry = advisory.category.includes('হাঁসমুরগী');
                    const isFish = advisory.category.includes('মৎস্য');

                    const badgeColor = isRice
                      ? '#0c713e'
                      : isVeg
                        ? '#d97706'
                        : isFruit
                          ? '#ea580c'
                          : isCattle
                            ? '#0d9488'
                            : isPoultry
                              ? '#ca8a04'
                              : isFish
                                ? '#0284c7'
                                : '#7c3aed';

                    const bgLight = isRice
                      ? '#f0fdf4'
                      : isVeg
                        ? '#fffbeb'
                        : isFruit
                          ? '#fff7ed'
                          : isCattle
                            ? '#f0fdfa'
                            : isPoultry
                              ? '#fefce8'
                              : isFish
                                ? '#f0f9ff'
                                : '#faf5ff';

                    const categoryKey = `cat_${idx}`;
                    const isThisCopied = copiedCategory === categoryKey;

                    return (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          padding: '18px 20px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '14px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = badgeColor;
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                        }}
                      >
                        <div>
                          {/* Card Header */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px'
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: bgLight,
                              color: badgeColor,
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: 800,
                              border: `1px solid ${badgeColor}30`
                            }}>
                              <Sprout size={14} />
                              <span>{advisory.category}</span>
                            </span>

                            <button
                              onClick={() => {
                                const text = `【${advisory.category}】\n` + advisory.items.map(i => `• ${i}`).join('\n');
                                copyToClipboard(text, categoryKey);
                              }}
                              title="Copy this section"
                              style={{
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = badgeColor; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                            >
                              {isThisCopied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                            </button>
                          </div>

                          {/* Bullet Items */}
                          <ul style={{
                            margin: 0,
                            paddingLeft: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}>
                            {advisory.items.map((item, iIdx) => (
                              <li
                                key={iIdx}
                                style={{
                                  fontSize: '13px',
                                  lineHeight: 1.6,
                                  color: '#334155'
                                }}
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
