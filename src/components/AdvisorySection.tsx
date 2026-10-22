'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  REGIONAL_ZONES,
  RegionalZone,
  RegionalAdvisoryData
} from '@/lib/regional-advisory';
import {
  Calendar,
  Globe,
  MapPin,
  RefreshCw,
  Copy,
  Check,
  Printer,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
  Droplets,
  Thermometer,
  CloudRain,
  Feather,
  Info
} from 'lucide-react';

interface AdvisorySectionProps {
  districtName?: string;
  upazilaName?: string;
}

const MONTHS_LIST = [
  { num: 1, name: 'January', bn: 'জানুয়ারি', short: 'Jan' },
  { num: 2, name: 'February', bn: 'ফেব্রুয়ারি', short: 'Feb' },
  { num: 3, name: 'March', bn: 'মার্চ', short: 'Mar' },
  { num: 4, name: 'April', bn: 'এপ্রিল', short: 'Apr' },
  { num: 5, name: 'May', bn: 'মে', short: 'May' },
  { num: 6, name: 'June', bn: 'জুন', short: 'Jun' },
  { num: 7, name: 'July', bn: 'জুলাই', short: 'Jul' },
  { num: 8, name: 'August', bn: 'আগস্ট', short: 'Aug' },
  { num: 9, name: 'September', bn: 'সেপ্টেম্বর', short: 'Sep' },
  { num: 10, name: 'October', bn: 'অক্টোবর', short: 'Oct' },
  { num: 11, name: 'November', bn: 'নভেম্বর', short: 'Nov' },
  { num: 12, name: 'December', bn: 'ডিসেম্বর', short: 'Dec' }
];

export default function AdvisorySection({
  districtName = 'Dhaka',
  upazilaName = 'Adabor'
}: AdvisorySectionProps) {
  // Determine current calendar month in Asia/Dhaka
  const getCurrentMonth = () => {
    try {
      const dhakaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
      return new Date(dhakaTime).getMonth() + 1;
    } catch {
      return new Date().getMonth() + 1;
    }
  };

  // Find initial zone matching user's selected district
  const getInitialZoneCode = () => {
    if (!districtName) return 2; // Default to Mid-Eastern (Dhaka)
    const normalized = districtName.toLowerCase().trim();
    for (const zone of REGIONAL_ZONES) {
      if (zone.districts.some(d => d.toLowerCase().includes(normalized) || normalized.includes(d.toLowerCase()))) {
        return zone.code;
      }
    }
    return 2;
  };

  const [selectedZoneCode, setSelectedZoneCode] = useState<number>(getInitialZoneCode());
  const [selectedMonth, setSelectedMonth] = useState<number>(getCurrentMonth());
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [advisoryData, setAdvisoryData] = useState<RegionalAdvisoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [lastReloadedTime, setLastReloadedTime] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Client cache to make switching instantaneous
  const cacheRef = useRef<Record<string, RegionalAdvisoryData>>({});

  const currentZone = REGIONAL_ZONES.find(z => z.code === selectedZoneCode) || REGIONAL_ZONES[0];

  // Fetch Advisory Data
  useEffect(() => {
    let isCancelled = false;
    const cacheKey = `${selectedZoneCode}_${lang}_${selectedMonth}`;

    if (cacheRef.current[cacheKey]) {
      setAdvisoryData(cacheRef.current[cacheKey]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    async function loadData() {
      try {
        const res = await fetch(`/api/nlas/advisory-regional?regionCode=${selectedZoneCode}&lang=${lang}&month=${selectedMonth}`);
        const json = await res.json();

        if (!isCancelled) {
          if (json.success && json.data) {
            cacheRef.current[cacheKey] = json.data;
            setAdvisoryData(json.data);
            const now = new Date();
            setLastReloadedTime(now.toLocaleTimeString());
          } else {
            throw new Error(json.error || 'Failed to fetch advisory data');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Regional Advisory fetch error:', err);
          setErrorMsg(err instanceof Error ? err.message : 'Unable to load regional advisory');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [selectedZoneCode, lang, selectedMonth]);

  // Handle Manual Real-Time Reload
  const handleReloadAdvisory = async () => {
    setIsReloading(true);
    setErrorMsg(null);
    const cacheKey = `${selectedZoneCode}_${lang}_${selectedMonth}`;
    delete cacheRef.current[cacheKey]; // Invalidate cache for real-time dynamic pull

    try {
      const res = await fetch(`/api/nlas/advisory-regional?regionCode=${selectedZoneCode}&lang=${lang}&month=${selectedMonth}&reload=true&t=${Date.now()}`);
      const json = await res.json();

      if (json.success && json.data) {
        cacheRef.current[cacheKey] = json.data;
        setAdvisoryData(json.data);
        const now = new Date();
        setLastReloadedTime(now.toLocaleTimeString());
      } else {
        throw new Error(json.error || 'Failed to fetch real-time advisory data');
      }
    } catch (err) {
      console.error('Reload advisory error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reload advisory data');
    } finally {
      setIsReloading(false);
    }
  };

  // Handle Copy Directives
  const handleCopyDirectives = () => {
    if (!advisoryData) return;
    const zoneName = lang === 'bn' ? advisoryData.region_name_bn : advisoryData.region_name;
    const monthName = lang === 'bn' ? advisoryData.month_name_bn : advisoryData.month_name;
    
    let text = `==============================\n`;
    text += `NATIONAL LIVESTOCK ADVISORY SYSTEM (NLAS)\n`;
    text += `Regional Advisory - ${zoneName} (${monthName})\n`;
    text += `Covering: ${advisoryData.location_name}\n`;
    text += `==============================\n\n`;

    text += `[LIVESTOCK ADVISORY / গবাদিপশু পরামর্শ]:\n`;
    (advisoryData.livestock || []).forEach((item, idx) => {
      text += `${idx + 1}. ${item}\n`;
    });

    text += `\n[POULTRY ADVISORY / পোল্ট্রি পরামর্শ]:\n`;
    (advisoryData.poultry || []).forEach((item, idx) => {
      text += `${idx + 1}. ${item}\n`;
    });

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Climatology Chart Calculations
  const precipData = advisoryData?.a_precip || [8.68, 21.39, 45.57, 118.11, 279.31, 434, 480.81, 367.35, 324.26, 183.21, 25.11, 7.75];
  const maxTempData = advisoryData?.tempMax || [25.53, 29.49, 34.5, 35.65, 33.99, 33.01, 32.4, 32.33, 32.18, 31.93, 29.9, 26.34];
  const minTempData = advisoryData?.tempMin || [12.81, 14.98, 18.38, 20.43, 21.79, 22.47, 22.41, 22.44, 22.2, 21.11, 18.38, 14.61];
  const monthLabels = advisoryData?.climate_month || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const maxPrecipVal = Math.max(...precipData, 500);
  const chartHeight = 250;
  const chartWidth = 880;
  const paddingLeft = 52;
  const paddingRight = 48;
  const paddingTop = 26;
  const paddingBottom = 42;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Coordinate mappers
  const getX = (idx: number) => paddingLeft + (idx + 0.5) * (plotWidth / 12);
  const getPrecipY = (val: number) => paddingTop + plotHeight - (val / maxPrecipVal) * plotHeight;
  const getTempY = (val: number) => {
    // Map 0 to 45 °C
    const minScale = 0;
    const maxScale = 45;
    const clamped = Math.max(minScale, Math.min(maxScale, val));
    return paddingTop + plotHeight - ((clamped - minScale) / (maxScale - minScale)) * plotHeight;
  };

  // Create smooth bezier curve path for temperatures
  const createSplinePath = (data: number[]) => {
    return data.reduce((path, val, i) => {
      const x = getX(i);
      const y = getTempY(val);
      if (i === 0) return `M ${x} ${y}`;
      const prevX = getX(i - 1);
      const prevY = getTempY(data[i - 1]);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpX2 = prevX + (x - prevX) / 2;
      return `${path} C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
    }, '');
  };

  const isDistrictInCurrentZone = currentZone.districts.some(
    d => d.toLowerCase().includes(districtName.toLowerCase().trim()) || districtName.toLowerCase().trim().includes(d.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Banner & Control Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#e8f5f0',
            color: '#006a4e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 106, 78, 0.12)'
          }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Region Wise Monthly Advisory
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                color: '#166534'
              }}>
                7 Agro-Ecological Zones
              </span>
              {lastReloadedTime && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#059669',
                  backgroundColor: '#ecfdf5',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  border: '1px solid #a7f3d0'
                }}>
                  <CheckCircle2 size={12} color="#10b981" />
                  <span>Synced: {lastReloadedTime}</span>
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Meteorological Climatology & Tailored Veterinary Bulletins from the Department of Livestock Services (DLS)
            </p>
          </div>
        </div>

        {/* Global Controls: Month, Language, Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Reload Latest Advisory Button */}
          <button
            onClick={handleReloadAdvisory}
            disabled={isReloading || isLoading}
            id="btn-reload-latest-advisory"
            title="Fetch real-time dynamic advisory data directly from DLS government server"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isReloading ? '#e2e8f0' : '#006a4e',
              color: isReloading ? '#64748b' : '#ffffff',
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              cursor: isReloading ? 'not-allowed' : 'pointer',
              boxShadow: isReloading ? 'none' : '0 2px 8px rgba(0, 106, 78, 0.25)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isReloading) {
                e.currentTarget.style.backgroundColor = '#00523d';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isReloading) {
                e.currentTarget.style.backgroundColor = '#006a4e';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: isReloading ? 'spin 0.8s linear infinite' : 'none'
              }}
            />
            <span>{isReloading ? 'Updating Advisory...' : 'Reload Latest Advisory'}</span>
          </button>

          {/* Month Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#334155'
          }}>
            <Calendar size={15} color="#006a4e" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              aria-label="Select Advisory Month"
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                fontWeight: 600,
                fontSize: '13px',
                color: '#0f172a',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {MONTHS_LIST.map(m => (
                <option key={m.num} value={m.num}>
                  {m.name} {m.num === getCurrentMonth() ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Bilingual Language Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '2px'
          }}>
            <button
              onClick={() => setLang('en')}
              style={{
                padding: '5px 12px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: lang === 'en' ? '#006a4e' : 'transparent',
                color: lang === 'en' ? '#ffffff' : '#64748b',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              English
            </button>
            <button
              onClick={() => setLang('bn')}
              style={{
                padding: '5px 12px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: lang === 'bn' ? '#006a4e' : 'transparent',
                color: lang === 'bn' ? '#ffffff' : '#64748b',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'var(--font-bn)'
              }}
            >
              বাংলা
            </button>
          </div>

          {/* Copy Directives Button */}
          <button
            onClick={handleCopyDirectives}
            id="btn-copy-advisory"
            title="Copy advisory bulletin to clipboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              backgroundColor: isCopied ? '#ecfdf5' : '#ffffff',
              border: isCopied ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              color: isCopied ? '#059669' : '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {isCopied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
            <span>{isCopied ? 'Copied!' : 'Copy Bulletin'}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            id="btn-print-advisory"
            title="Print or Save as PDF"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 7 Agro-Ecological Zones Selector Cards */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          paddingLeft: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
              Select Agro-Ecological Zone
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>• Click any zone to load regional metrics</span>
          </div>
          {isDistrictInCurrentZone && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#006a4e',
              backgroundColor: '#e8f5f0',
              padding: '2px 10px',
              borderRadius: '12px'
            }}>
              <MapPin size={12} />
              <span>Current Location: {districtName} is in {currentZone.name}</span>
            </div>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px'
        }}>
          {REGIONAL_ZONES.map(zone => {
            const isSelected = zone.code === selectedZoneCode;
            const containsDistrict = zone.districts.some(
              d => d.toLowerCase().includes(districtName.toLowerCase().trim()) || districtName.toLowerCase().trim().includes(d.toLowerCase())
            );

            return (
              <button
                key={zone.code}
                onClick={() => setSelectedZoneCode(zone.code)}
                id={`btn-zone-${zone.code}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? '#ffffff' : '#f8fafc',
                  border: isSelected ? `2px solid ${zone.color}` : '1px solid #e2e8f0',
                  boxShadow: isSelected ? `0 4px 14px ${zone.color}25` : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {/* Active Indicator Top Stripe */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: zone.color
                  }} />
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: zone.color
                    }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                      Zone {zone.code}
                    </span>
                  </div>

                  {containsDistrict && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      backgroundColor: '#e8f5f0',
                      color: '#006a4e',
                      padding: '1px 6px',
                      borderRadius: '8px'
                    }}>
                      You
                    </span>
                  )}
                </div>

                <div style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: isSelected ? '#0f172a' : '#334155',
                  lineHeight: 1.2
                }}>
                  {zone.name}
                </div>

                <div style={{
                  fontSize: '11px',
                  color: '#64748b',
                  marginTop: '2px',
                  fontFamily: 'var(--font-bn)'
                }}>
                  {zone.nameBn}
                </div>

                <div style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  marginTop: '8px',
                  fontWeight: 600
                }}>
                  {zone.districts.length} Districts
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* FEATURED CLIMATOLOGY CARD WITH THE GRAPH CHART            */}
      {/* Directly places the graph chart below the districts list */}
      {/* ======================================================== */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Card Header & Zone Tag */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CloudRain size={20} color="#0284c7" />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Climatology for {currentZone.name}
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Long-term 12-month climate averages for rainfall and temperature dynamics
            </p>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '8px',
            backgroundColor: currentZone.accent,
            color: currentZone.color
          }}>
            {currentZone.tagline}
          </span>
        </div>

        {/* District Tags Row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '20px',
          padding: '10px 14px',
          backgroundColor: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #f1f5f9',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} color="#006a4e" /> Districts:
          </span>
          {currentZone.districts.map(d => {
            const isMatch = d.toLowerCase().includes(districtName.toLowerCase().trim()) || districtName.toLowerCase().trim().includes(d.toLowerCase());
            return (
              <span
                key={d}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: isMatch ? '#006a4e' : '#ffffff',
                  color: isMatch ? '#ffffff' : '#334155',
                  border: isMatch ? '1px solid #006a4e' : '1px solid #e2e8f0',
                  fontWeight: isMatch ? 700 : 500,
                  boxShadow: isMatch ? '0 1px 3px rgba(0, 106, 78, 0.2)' : 'none'
                }}
              >
                {d}
              </span>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* GRAPH CHART - Placed immediately in the blank space!    */}
        {/* ======================================================== */}
        <div style={{
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          paddingTop: '6px'
        }}>
          {/* Chart Legend (Matching Picture 2) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: 600,
            flexWrap: 'wrap'
          }}>
            {/* Precipitation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '16px',
                height: '14px',
                borderRadius: '4px',
                background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
                display: 'inline-block',
                boxShadow: '0 1px 3px rgba(2, 132, 199, 0.3)'
              }} />
              <span style={{ color: '#0369a1', fontWeight: 700 }}>Precipitation / Rainfall (mm)</span>
            </div>

            {/* Max Temp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '24px', position: 'relative' }}>
                <span style={{ width: '100%', height: '3px', backgroundColor: '#e11d48', borderRadius: '2px' }} />
                <span style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  border: '2px solid #e11d48'
                }} />
              </div>
              <span style={{ color: '#be123c', fontWeight: 700 }}>Max Temp (°C)</span>
            </div>

            {/* Min Temp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '24px', position: 'relative' }}>
                <span style={{ width: '100%', height: '2px', backgroundColor: '#0284c7', borderRadius: '2px', borderTop: '2px dashed #0284c7' }} />
                <span style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  border: '2px solid #0284c7'
                }} />
              </div>
              <span style={{ color: '#0369a1', fontWeight: 700 }}>Min Temp (°C)</span>
            </div>
          </div>

          {/* SVG Composite Chart Canvas */}
          <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', minWidth: '600px', overflow: 'visible' }}
            >
              <defs>
                {/* Bar Gradient */}
                <linearGradient id="precipGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.25" />
                </linearGradient>
                <linearGradient id="activePrecipGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="1" />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity="0.75" />
                </linearGradient>
              </defs>

              {/* Grid Lines for Precipitation (0 to 500 mm) */}
              {[0, 100, 200, 300, 400, 500].map(val => {
                const y = getPrecipY(val);
                return (
                  <g key={val}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeDasharray={val === 0 ? 'none' : '3 3'}
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94a3b8"
                      fontWeight="600"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Right Y-Axis for Temperature (10° to 40° C) */}
              {[10, 20, 30, 40].map(deg => {
                const y = getTempY(deg);
                return (
                  <text
                    key={deg}
                    x={chartWidth - paddingRight + 10}
                    y={y + 3}
                    textAnchor="start"
                    fontSize="10"
                    fill="#be123c"
                    fontWeight="700"
                  >
                    {deg}°
                  </text>
                );
              })}

              {/* Highlight Column for Selected Month */}
              {monthLabels.map((_, i) => {
                const isSelected = i + 1 === selectedMonth;
                const isHovered = i === hoveredMonthIdx;
                const x = paddingLeft + i * (plotWidth / 12);
                const colWidth = plotWidth / 12;

                if (!isSelected && !isHovered) return null;

                return (
                  <rect
                    key={`highlight-${i}`}
                    x={x + 2}
                    y={paddingTop}
                    width={colWidth - 4}
                    height={plotHeight}
                    fill={isSelected ? '#e0f2fe' : '#f8fafc'}
                    fillOpacity={isSelected ? 0.6 : 0.4}
                    rx="6"
                  />
                );
              })}

              {/* Rainfall Bars */}
              {precipData.map((rf, i) => {
                const barWidth = 28;
                const x = getX(i) - barWidth / 2;
                const y = getPrecipY(rf);
                const h = Math.max(3, paddingTop + plotHeight - y);
                const isSelected = i + 1 === selectedMonth;

                return (
                  <g key={`bar-${i}`}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={h}
                      rx="5"
                      fill={isSelected ? 'url(#activePrecipGradient)' : 'url(#precipGradient)'}
                      stroke={isSelected ? '#0284c7' : 'none'}
                      strokeWidth="2"
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onMouseEnter={() => setHoveredMonthIdx(i)}
                      onMouseLeave={() => setHoveredMonthIdx(null)}
                      onClick={() => setSelectedMonth(i + 1)}
                    />
                  </g>
                );
              })}

              {/* Max Temp Curve */}
              <path
                d={createSplinePath(maxTempData)}
                fill="none"
                stroke="#e11d48"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Min Temp Curve */}
              <path
                d={createSplinePath(minTempData)}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="5 3"
                strokeLinecap="round"
              />

              {/* Data Nodes & Month Labels */}
              {monthLabels.map((lbl, i) => {
                const x = getX(i);
                const maxY = getTempY(maxTempData[i]);
                const minY = getTempY(minTempData[i]);
                const isSelected = i + 1 === selectedMonth;

                return (
                  <g key={`node-${i}`}>
                    {/* Max Temp Dot */}
                    <circle
                      cx={x}
                      cy={maxY}
                      r={isSelected ? 5.5 : 4}
                      fill="#ffffff"
                      stroke="#e11d48"
                      strokeWidth={isSelected ? 2.5 : 2}
                    />

                    {/* Min Temp Dot */}
                    <circle
                      cx={x}
                      cy={minY}
                      r={isSelected ? 4.5 : 3.5}
                      fill="#ffffff"
                      stroke="#0284c7"
                      strokeWidth="2"
                    />

                    {/* X-Axis Month Label */}
                    <text
                      x={x}
                      y={chartHeight - 14}
                      textAnchor="middle"
                      fontSize={isSelected ? "12" : "11"}
                      fontWeight={isSelected ? "800" : "500"}
                      fill={isSelected ? "#0284c7" : "#64748b"}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => setSelectedMonth(i + 1)}
                    >
                      {lbl}
                    </text>
                  </g>
                );
              })}

              {/* Active / Hover Tooltip */}
              {hoveredMonthIdx !== null && (
                <g transform={`translate(${getX(hoveredMonthIdx)}, 16)`}>
                  <rect
                    x="-65"
                    y="0"
                    width="130"
                    height="70"
                    rx="8"
                    fill="#0f172a"
                    fillOpacity="0.95"
                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                  />
                  <text x="0" y="16" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">
                    {MONTHS_LIST[hoveredMonthIdx]?.name}
                  </text>
                  <text x="0" y="32" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
                    Rainfall: {precipData[hoveredMonthIdx]?.toFixed(1)} mm
                  </text>
                  <text x="0" y="48" textAnchor="middle" fill="#fb7185" fontSize="10" fontWeight="600">
                    Max Temp: {maxTempData[hoveredMonthIdx]?.toFixed(1)}°C
                  </text>
                  <text x="0" y="63" textAnchor="middle" fill="#a5f3fc" fontSize="10" fontWeight="600">
                    Min Temp: {minTempData[hoveredMonthIdx]?.toFixed(1)}°C
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MONTHLY LIVESTOCK & POULTRY ADVISORY DIRECTIVES           */}
      {/* 2 equal columns: Livestock (Left) & Poultry (Right)      */}
      {/* ======================================================== */}
      <div>
        {/* Section Header */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '18px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '3px 10px',
                borderRadius: '6px',
                backgroundColor: '#006a4e',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700
              }}>
                {lang === 'bn' ? advisoryData?.month_name_bn || 'মাসিক' : advisoryData?.month_name || 'Monthly'}
              </span>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {lang === 'bn'
                  ? `${advisoryData?.region_name_bn || currentZone.nameBn} অঞ্চলের গবাদিপশু ও পোল্ট্রি পরামর্শ`
                  : `Monthly Livestock & Poultry Advisory for ${advisoryData?.region_name || currentZone.name}`}
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
              {lang === 'bn' ? 'প্রাণিসম্পদ অধিদপ্তর (DLS) অনুমোদিত বিশেষ দিকনির্দেশনা ও পরিচর্যা' : 'Veterinary health guidelines, feed nutrition & bio-security management'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#006a4e', fontWeight: 700, backgroundColor: '#e8f5f0', padding: '4px 12px', borderRadius: '12px' }}>
              {isLoading ? 'Updating...' : `Total Directives: ${(advisoryData?.livestock?.length || 0) + (advisoryData?.poultry?.length || 0)}`}
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#991b1b',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2-Column Responsive Grid: Livestock Card & Poultry Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          {/* Livestock Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '20px'
                }}>
                  🐄
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    {lang === 'bn' ? 'গবাদিপশু সম্পর্কিত পরামর্শ (Livestock)' : 'Monthly Advisory for Livestock'}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Cattle, Buffalo, Goat & Sheep husbandry
                  </span>
                </div>
              </div>

              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '12px',
                backgroundColor: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0'
              }}>
                {advisoryData?.livestock?.length || 0} Directives
              </span>
            </div>

            {/* Directives List */}
            {isLoading ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                <RefreshCw size={22} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
                <span>Loading Livestock Advisory...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {(advisoryData?.livestock || []).map((bullet, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '11px 13px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: '#1e293b',
                      fontFamily: lang === 'bn' ? 'var(--font-bn)' : 'var(--font-sans)'
                    }}
                  >
                    <span style={{
                      color: '#006a4e',
                      fontWeight: 800,
                      fontSize: '14px',
                      flexShrink: 0,
                      marginTop: '1px'
                    }}>
                      ➤
                    </span>
                    <span style={{ flex: 1, fontWeight: 500 }}>
                      {bullet.replace(/^➤\s*/, '')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Poultry Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#fffbeb',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '20px'
                }}>
                  🐔
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    {lang === 'bn' ? 'পোল্ট্রি সম্পর্কিত পরামর্শ (Poultry)' : 'Monthly Advisory for Poultry'}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Broiler, Layer & Duck health & bio-security
                  </span>
                </div>
              </div>

              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '12px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a'
              }}>
                {advisoryData?.poultry?.length || 0} Directives
              </span>
            </div>

            {/* Directives List */}
            {isLoading ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                <RefreshCw size={22} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
                <span>Loading Poultry Advisory...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {(advisoryData?.poultry || []).map((bullet, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '11px 13px',
                      backgroundColor: '#fefce8',
                      borderRadius: '10px',
                      border: '1px solid #fef08a',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: '#1e293b',
                      fontFamily: lang === 'bn' ? 'var(--font-bn)' : 'var(--font-sans)'
                    }}
                  >
                    <span style={{
                      color: '#d97706',
                      fontWeight: 800,
                      fontSize: '14px',
                      flexShrink: 0,
                      marginTop: '1px'
                    }}>
                      ➤
                    </span>
                    <span style={{ flex: 1, fontWeight: 500 }}>
                      {bullet.replace(/^➤\s*/, '')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
