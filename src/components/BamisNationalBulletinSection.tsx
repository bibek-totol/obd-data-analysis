'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Printer,
  Copy,
  Check,
  Calendar,
  MapPin,
  Sprout,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Droplets,
  CloudRain,
  Sun,
  ThermometerSnowflake,
  Activity,
  Wind,
  Cloud,
  Gauge,
  Wheat,
  Carrot,
  Apple,
  Flower2,
  Beef,
  Egg,
  Fish,
  Layers,
  ArrowUpDown,
  Filter,
  Info
} from 'lucide-react';
import {
  NationalBulletinData,
  NationalWeatherMap,
  NationalDistrictValue,
  NationalAdvisoryCrop,
  toBengaliNumerals
} from '@/lib/bamis-national-client';
import { useDashboard } from '@/context/DashboardContext';

interface BamisNationalSectionProps {
  onRegisterReload?: (fn: () => void) => void;
}

export default function BamisNationalBulletinSection({ onRegisterReload }: BamisNationalSectionProps) {
  const { registerReload, setIsLoading: setGlobalLoading, setLastUpdated: setGlobalLastUpdated } = useDashboard();

  const [data, setData] = useState<NationalBulletinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [activeMainTab, setActiveMainTab] = useState<'maps' | 'advisories'>('maps');
  const [activeParamId, setActiveParamId] = useState<string>('rainc/sum');

  // Table filters & sorting
  const [tableSearch, setTableSearch] = useState('');
  const [tableDivision, setTableDivision] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'value'>('value');
  const [sortAsc, setSortAsc] = useState(false);

  // Advisory filter & search
  const [advisorySearch, setAdvisorySearch] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch National Bulletin data on demand
  const loadData = useCallback(async (forceReload = false) => {
    try {
      setLoading(true);
      setGlobalLoading(true);
      const url = `/api/bamis/national${forceReload ? '?reload=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load data: ${res.status}`);
      }
      const json: NationalBulletinData = await res.json();
      setData(json);
      setGlobalLastUpdated(json.updatedAt);
    } catch (err) {
      console.error('[BAMIS National] Load error:', err);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  }, [setGlobalLoading, setGlobalLastUpdated]);

  // Initial load
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Register with Header reload button
  useEffect(() => {
    const handleReload = () => {
      loadData(true);
    };
    registerReload(handleReload);
    if (onRegisterReload) {
      onRegisterReload(handleReload);
    }
  }, [registerReload, onRegisterReload, loadData]);

  // Active weather map
  const activeWeatherMap = useMemo(() => {
    if (!data || !data.weatherMaps) return null;
    return data.weatherMaps.find(m => `${m.param}/${m.stat}` === activeParamId) || data.weatherMaps[0];
  }, [data, activeParamId]);

  // Filtered & sorted districts in table view
  const filteredDistricts = useMemo(() => {
    if (!activeWeatherMap) return [];
    let list = [...activeWeatherMap.parsedDistricts];

    if (tableDivision !== 'all') {
      list = list.filter(d => d.divisionEn.toLowerCase() === tableDivision.toLowerCase());
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(d =>
        d.districtNameEn.toLowerCase().includes(q) ||
        d.districtNameBn.includes(q) ||
        d.divisionEn.toLowerCase().includes(q) ||
        d.divisionBn.includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortField === 'value') {
        return sortAsc ? a.valueNum - b.valueNum : b.valueNum - a.valueNum;
      }
      const nameA = lang === 'bn' ? a.districtNameBn : a.districtNameEn;
      const nameB = lang === 'bn' ? b.districtNameBn : b.districtNameEn;
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    return list;
  }, [activeWeatherMap, tableDivision, tableSearch, sortField, sortAsc, lang]);

  // Filtered advisories
  const filteredAdvisories = useMemo(() => {
    if (!data || !data.advisories) return [];
    let list = [...data.advisories];

    if (selectedCropFilter !== 'all') {
      list = list.filter(a => a.id === selectedCropFilter || a.cropNameBn === selectedCropFilter || a.cropNameEn === selectedCropFilter);
    }

    if (advisorySearch.trim()) {
      const q = advisorySearch.toLowerCase().trim();
      list = list.filter(a =>
        a.cropNameEn.toLowerCase().includes(q) ||
        a.cropNameBn.includes(q) ||
        (a.stageEn && a.stageEn.toLowerCase().includes(q)) ||
        (a.stageBn && a.stageBn.includes(q)) ||
        a.itemsEn.some(item => item.toLowerCase().includes(q)) ||
        a.itemsBn.some(item => item.includes(q))
      );
    }

    return list;
  }, [data, selectedCropFilter, advisorySearch]);

  // Copy advisory handler
  const handleCopyAdvisory = (adv: NationalAdvisoryCrop) => {
    const title = lang === 'bn' ? adv.cropNameBn : adv.cropNameEn;
    const stage = lang === 'bn' ? (adv.stageBn || '') : (adv.stageEn || '');
    const items = lang === 'bn' ? adv.itemsBn : adv.itemsEn;
    const text = `${title} ${stage ? `(${stage})` : ''}\n` + items.map((it, idx) => `${idx + 1}. ${it}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedId(adv.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get crop icon component
  const renderCropIcon = (iconName: string, size = 18) => {
    switch (iconName) {
      case 'Wheat': return <Wheat size={size} />;
      case 'Sprout': return <Sprout size={size} />;
      case 'Seedling': return <Sprout size={size} />;
      case 'Carrot': return <Carrot size={size} />;
      case 'Apple': return <Apple size={size} />;
      case 'Flower2': return <Flower2 size={size} />;
      case 'Beef': return <Beef size={size} />;
      case 'Egg': return <Egg size={size} />;
      case 'Fish': return <Fish size={size} />;
      case 'Layers': return <Layers size={size} />;
      default: return <Sprout size={size} />;
    }
  };

  // Get param icon component
  const renderParamIcon = (paramId: string, size = 16) => {
    switch (paramId) {
      case 'rainc/sum': return <CloudRain size={size} />;
      case 't2/max': return <Sun size={size} />;
      case 't2/min': return <ThermometerSnowflake size={size} />;
      case 't2/diurnal': return <Activity size={size} />;
      case 'rh2/max': return <Droplets size={size} />;
      case 'rh2/min': return <Wind size={size} />;
      case 'clflo/avg': return <Cloud size={size} />;
      case 'ws10/avg': return <Gauge size={size} />;
      default: return <Activity size={size} />;
    }
  };

  const isBn = lang === 'bn';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Breadcrumb & Control Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#ffffff',
        padding: '14px 18px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Left: Breadcrumbs & Live Pulse */}
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
              {isBn ? 'জাতীয় কৃষি আবহাওয়া বুলেটিন' : 'National Agromet Bulletin'}
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '4px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0
            }}>
              {isBn ? 'জাতীয় কৃষি আবহাওয়া পরামর্শ সেবা বুলেটিন' : 'National Agromet Advisory Service Bulletin'}
            </h2>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              borderRadius: '20px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              fontSize: '11px',
              fontWeight: 700
            }}>

              {isBn ? 'লাইভ সিনক্রোনাইজড' : 'Live Synced'}
            </span>
          </div>
        </div>

        {/* Right: Controls (Bilingual Toggle, Print, Reload) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Bilingual Switcher */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1'
          }}>
            <button
              onClick={() => setLang('bn')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isBn ? '#0c713e' : 'transparent',
                color: isBn ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLang('en')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: !isBn ? '#0c713e' : 'transparent',
                color: !isBn ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              English
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            title={isBn ? 'বুলেটিন প্রিন্ট করুন বা পিডিএফ সংরক্ষণ করুন' : 'Print or Save PDF'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Printer size={14} />
            <span className="hide-on-mobile">{isBn ? 'প্রিন্ট' : 'Print'}</span>
          </button>

          {/* Dedicated Reload Button */}
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            title={isBn ? 'সর্বশেষ বুলেটিন তথ্য রিফ্রেশ করুন' : 'Reload Latest National Bulletin'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: loading ? '#e2e8f0' : '#0c713e',
              border: 'none',
              color: loading ? '#94a3b8' : '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(12, 113, 62, 0.2)'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin-fast' : ''} />
            <span>{loading ? (isBn ? 'রিফ্রেশ হচ্ছে...' : 'Refreshing...') : (isBn ? 'বুলেটিন রিফ্রেশ করুন' : 'Reload Bulletin')}</span>
          </button>
        </div>
      </div>

      {/* Official Executive Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #054c27 0%, #0c713e 50%, #15803d 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 4px 16px rgba(12, 113, 62, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background decorative seal */}
        <div style={{
          position: 'absolute',
          right: '-20px',
          bottom: '-30px',
          opacity: 0.08,
          pointerEvents: 'none'
        }}>
          <Sprout size={280} color="#ffffff" />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.03em',
              marginBottom: '10px',
              backdropFilter: 'blur(4px)'
            }}>
              <Sprout size={14} color="#bbf7d0" />
              <span>{isBn ? 'কৃষি সম্প্রসারণ অধিদপ্তর (ডিএই) • কৃষি মন্ত্রণালয়' : 'Department of Agricultural Extension (DAE) • Ministry of Agriculture'}</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(20px, 3.5vw, 26px)',
              fontWeight: 900,
              lineHeight: 1.25,
              margin: '0 0 10px 0',
              letterSpacing: '-0.01em',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {isBn ? (data?.titleBn || 'জাতীয় কৃষি আবহাওয়া পরামর্শ সেবা বুলেটিন') : (data?.titleEn || 'National Agromet Advisory Service Bulletin')}
            </h1>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '13px',
              color: '#dcfce7',
              fontWeight: 600
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="#86efac" />
                <span>
                  <strong>{isBn ? 'প্রকাশের তারিখ:' : 'Issue Date:'}</strong> {isBn ? (data?.dateTextBn || '২৮ অক্টোবর ২০২৬ (বুধবার)') : (data?.dateTextEn || '28 October 2026 (Wednesday)')}
                </span>
              </div>
              <div style={{ height: '14px', width: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={15} color="#86efac" />
                <span>
                  <strong>{isBn ? 'কার্যকরী সময়কাল:' : 'Validity Period:'}</strong> {isBn ? (data?.periodBn || '২৮.১০.২০২৬ - ০১.১১.২০২৬') : (data?.periodEn || '28.10.2026 - 01.11.2026')}
                </span>
              </div>
              <div style={{ height: '14px', width: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="#86efac" />
                <span>{isBn ? 'সারাদেশের ৬৪ জেলা আওতাভুক্ত' : 'Covering All 64 Districts Nationwide'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive KPI Telemetry Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        {/* KPI 1: Dekad Period */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              {isBn ? 'পূর্বাভাস মেয়ারকাল' : 'Forecast Dekad Window'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              {isBn ? '০৫ দিনের পূর্বাভাষ' : '5-Day Quantitative'}
            </div>
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
              {isBn ? (data?.periodBn || '২৮.১০.২০২৬ - ০১.১১.২০২৬') : (data?.periodEn || '28.10.2026 - 01.11.2026')}
            </div>
          </div>
        </div>

        {/* KPI 2: Districts Monitored */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MapPin size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              {isBn ? 'জাতীয় আওতাভুক্ত' : 'National Coverage'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              {isBn ? '৬৪টি জেলা' : '64 Zillas / Districts'}
            </div>
            <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>
              {isBn ? '৮টি বিভাগের সকল কৃষি অঞ্চল' : 'Across All 8 Divisions'}
            </div>
          </div>
        </div>

        {/* KPI 3: Key Advisories Monitored */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#fefce8',
            color: '#ca8a04',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sprout size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              {isBn ? 'কৃষি পরামর্শ খাত' : 'Monitored Sectors'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              {isBn ? `${data?.advisories.length || 10}টি প্রধান খাত` : `${data?.advisories.length || 10} Critical Sectors`}
            </div>
            <div style={{ fontSize: '11px', color: '#ca8a04', fontWeight: 600 }}>
              {isBn ? 'শস্য, উদ্যান, গবাদিপশু ও মৎস্য' : 'Crops, Horticulture & Animals'}
            </div>
          </div>
        </div>

        {/* KPI 4: Meteorological Parameters */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#faf5ff',
            color: '#9333ea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              {isBn ? 'পরিমাণগত পূর্বাভাস' : 'Quantitative Forecasts'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              {isBn ? '৮টি আবহাওয়া সূচক' : '8 Weather Parameters'}
            </div>
            <div style={{ fontSize: '11px', color: '#9333ea', fontWeight: 600 }}>
              {isBn ? 'বৃষ্টিপাত, তাপমাত্রা ও আর্দ্রতা' : 'Rain, Temp, Humidity & Wind'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Navigation Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '2px',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        <button
          onClick={() => setActiveMainTab('maps')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            color: activeMainTab === 'maps' ? '#0c713e' : '#64748b',
            borderBottom: activeMainTab === 'maps' ? '3px solid #0c713e' : '3px solid transparent',
            backgroundColor: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <CloudRain size={16} />
          <span>{isBn ? '০৫ দিনের জেলাওয়ারী পূর্বাভাস' : '5-Day District Quantitative Forecast'}</span>
        </button>

        <button
          onClick={() => setActiveMainTab('advisories')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            color: activeMainTab === 'advisories' ? '#0c713e' : '#64748b',
            borderBottom: activeMainTab === 'advisories' ? '3px solid #0c713e' : '3px solid transparent',
            backgroundColor: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Sprout size={16} />
          <span>{isBn ? 'মূখ্য কৃষি আবহাওয়া পরামর্শ' : 'Key Agromet Advisories'}</span>
          <span style={{
            fontSize: '11px',
            padding: '1px 6px',
            borderRadius: '10px',
            backgroundColor: activeMainTab === 'advisories' ? '#dcfce7' : '#f1f5f9',
            color: activeMainTab === 'advisories' ? '#15803d' : '#64748b'
          }}>
            {data?.advisories.length || 10}
          </span>
        </button>
      </div>

      {/* TAB 1: 5-Day Quantitative Weather Forecast across 64 Districts */}
      {activeMainTab === 'maps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Parameter Selection Pills Bar */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#64748b',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {isBn ? 'আবহাওয়া সূচক নির্বাচন করুন (৮টি প্যারামিটার):' : 'Select Meteorological Parameter (8 Quantitative Forecasts):'}
            </div>

            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '4px'
            }}>
              {data?.weatherMaps.map(m => {
                const key = `${m.param}/${m.stat}`;
                const isActive = activeParamId === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveParamId(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid #0c713e' : '1px solid #e2e8f0',
                      backgroundColor: isActive ? '#0c713e' : '#f8fafc',
                      color: isActive ? '#ffffff' : '#334155',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 2px 6px rgba(12, 113, 62, 0.25)' : 'none'
                    }}
                  >
                    {renderParamIcon(key, 15)}
                    <span>{isBn ? m.titleBn : m.titleEn}</span>
                    <span style={{
                      fontSize: '11px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                      color: isActive ? '#ffffff' : '#475569'
                    }}>
                      {isBn ? m.unitBn : m.unitEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Parameter Header & View Switcher */}
          {activeWeatherMap && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: '#f8fafc',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              {/* Left: Param summary & National Extrema */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#dcfce7',
                    color: '#0c713e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {renderParamIcon(activeParamId, 18)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {isBn ? activeWeatherMap.titleBn : activeWeatherMap.titleEn}
                    </h3>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {isBn ? 'আগামী ৫ দিনের জেলাওয়ারী পরিমাণগত মান' : '5-Day Quantitative Outlook across 64 Districts'}
                    </div>
                  </div>
                </div>

                <div style={{ height: '24px', width: '1px', backgroundColor: '#cbd5e1' }} />

                {/* Telemetry Metrics: Min, Avg, Max */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                  <span style={{ color: '#0369a1', fontWeight: 700 }}>
                    {isBn ? 'সর্বনিম্ন:' : 'Min:'}{' '}
                    <strong>{isBn ? toBengaliNumerals(activeWeatherMap.minVal) : activeWeatherMap.minVal} {isBn ? activeWeatherMap.unitBn : activeWeatherMap.unitEn}</strong>
                  </span>
                  <span style={{ color: '#0c713e', fontWeight: 700 }}>
                    {isBn ? 'গড়:' : 'Avg:'}{' '}
                    <strong>{isBn ? toBengaliNumerals(activeWeatherMap.avgVal) : activeWeatherMap.avgVal} {isBn ? activeWeatherMap.unitBn : activeWeatherMap.unitEn}</strong>
                  </span>
                  <span style={{ color: '#b91c1c', fontWeight: 700 }}>
                    {isBn ? 'সর্বোচ্চ:' : 'Max:'}{' '}
                    <strong>{isBn ? toBengaliNumerals(activeWeatherMap.maxVal) : activeWeatherMap.maxVal} {isBn ? activeWeatherMap.unitBn : activeWeatherMap.unitEn}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sortable & Searchable 64-District Comparison Table */}
          {activeWeatherMap && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px'
            }}>
              {/* Filter & Search Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                {/* Search Box */}
                <div style={{
                  position: 'relative',
                  width: '280px',
                  maxWidth: '100%'
                }}>
                  <Search size={16} style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }} />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder={isBn ? 'জেলা বা বিভাগ অনুসন্ধান...' : 'Search district or division...'}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  {tableSearch && (
                    <button
                      onClick={() => setTableSearch('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Division Filter Pills */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  paddingBottom: '2px'
                }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                    <Filter size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                    {isBn ? 'বিভাগ:' : 'Division:'}
                  </span>
                  {[
                    { key: 'all', en: 'All', bn: 'সব বিভাগ' },
                    { key: 'dhaka', en: 'Dhaka', bn: 'ঢাকা' },
                    { key: 'chattogram', en: 'Chattogram', bn: 'চট্টগ্রাম' },
                    { key: 'rajshahi', en: 'Rajshahi', bn: 'রাজশাহী' },
                    { key: 'khulna', en: 'Khulna', bn: 'খুলনা' },
                    { key: 'barishal', en: 'Barishal', bn: 'বরিশাল' },
                    { key: 'sylhet', en: 'Sylhet', bn: 'সিলেট' },
                    { key: 'rangpur', en: 'Rangpur', bn: 'রংপুর' },
                    { key: 'mymensingh', en: 'Mymensingh', bn: 'ময়মনসিংহ' }
                  ].map(div => {
                    const isSelected = tableDivision.toLowerCase() === div.key.toLowerCase();
                    return (
                      <button
                        key={div.key}
                        onClick={() => setTableDivision(div.key)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid #0c713e' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#0c713e' : '#f8fafc',
                          color: isSelected ? '#ffffff' : '#475569',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isBn ? div.bn : div.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Data Table */}
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '13px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 14px', width: '50px', color: '#64748b', fontWeight: 700 }}>#</th>
                      <th
                        onClick={() => {
                          if (sortField === 'name') setSortAsc(!sortAsc);
                          else { setSortField('name'); setSortAsc(true); }
                        }}
                        style={{ padding: '10px 14px', cursor: 'pointer', color: '#334155', fontWeight: 700 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{isBn ? 'জেলা' : 'District'}</span>
                          <ArrowUpDown size={13} color={sortField === 'name' ? '#0c713e' : '#94a3b8'} />
                        </div>
                      </th>
                      <th style={{ padding: '10px 14px', color: '#334155', fontWeight: 700 }}>
                        {isBn ? 'বিভাগ' : 'Division'}
                      </th>
                      <th
                        onClick={() => {
                          if (sortField === 'value') setSortAsc(!sortAsc);
                          else { setSortField('value'); setSortAsc(false); }
                        }}
                        style={{ padding: '10px 14px', cursor: 'pointer', color: '#334155', fontWeight: 700, textAlign: 'right' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          <span>{isBn ? activeWeatherMap.titleBn : activeWeatherMap.titleEn}</span>
                          <ArrowUpDown size={13} color={sortField === 'value' ? '#0c713e' : '#94a3b8'} />
                        </div>
                      </th>
                      <th style={{ padding: '10px 14px', width: '180px', color: '#64748b', fontWeight: 700 }}>
                        {isBn ? 'পরিসীমা অনুপাত' : 'Spectrum Ratio'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDistricts.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                          {isBn ? 'কোনো জেলার তথ্য পাওয়া যায়নি।' : 'No districts found matching your query.'}
                        </td>
                      </tr>
                    ) : (
                      filteredDistricts.map((row, index) => {
                        const rangeSpan = Math.max(0.01, activeWeatherMap.maxVal - activeWeatherMap.minVal);
                        const pct = Math.min(100, Math.max(5, ((row.valueNum - activeWeatherMap.minVal) / rangeSpan) * 100));

                        return (
                          <tr
                            key={row.districtKey}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                              transition: 'background-color 0.1s ease'
                            }}
                          >
                            <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>
                              {isBn ? toBengaliNumerals(index + 1) : index + 1}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                              {isBn ? row.districtNameBn : row.districtNameEn}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#475569' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#f1f5f9',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                {isBn ? row.divisionBn : row.divisionEn}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#0c713e' }}>
                              {isBn ? toBengaliNumerals(row.valueStrBn) : row.valueStrEn}
                              <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '4px', fontWeight: 500 }}>
                                {isBn ? activeWeatherMap.unitBn : activeWeatherMap.unitEn}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{
                                width: '100%',
                                height: '8px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  backgroundColor: activeParamId.includes('rain') ? '#0284c7' : activeParamId.includes('max') ? '#ea580c' : '#0c713e',
                                  borderRadius: '4px'
                                }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Key Agromet Advisories by Category */}
      {activeMainTab === 'advisories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls Bar: Search & Sector filter pills */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {isBn ? 'মূখ্য কৃষি আবহাওয়া পরামর্শ (মধ্য মেয়াদি পূর্বাভাস অনুযায়ী)' : 'Key Agromet Advisory Directives (Medium Range Outlook)'}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {isBn ? 'চলতি আবহাওয়া ও পূর্বাভাসিত জলবায়ু পরিস্থিতিতে করণীয় নির্দেশনাবলী' : 'Actionable seasonal guidelines for crops, livestock, poultry & aquaculture'}
                </div>
              </div>

              {/* Search Advisory Input */}
              <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
                <Search size={16} style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="text"
                  value={advisorySearch}
                  onChange={(e) => setAdvisorySearch(e.target.value)}
                  placeholder={isBn ? 'পরামর্শ বা ফসল অনুসন্ধান...' : 'Search advisory or crop...'}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
                {advisorySearch && (
                  <button
                    onClick={() => setAdvisorySearch('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Sector Filter Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              paddingBottom: '2px'
            }}>
              <button
                onClick={() => setSelectedCropFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: selectedCropFilter === 'all' ? '1px solid #0c713e' : '1px solid #e2e8f0',
                  backgroundColor: selectedCropFilter === 'all' ? '#0c713e' : '#f8fafc',
                  color: selectedCropFilter === 'all' ? '#ffffff' : '#475569',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {isBn ? 'সকল খাত (১০)' : 'All Sectors (10)'}
              </button>

              {data?.advisories.map(adv => {
                const isSelected = selectedCropFilter === adv.id;
                return (
                  <button
                    key={adv.id}
                    onClick={() => setSelectedCropFilter(adv.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #0c713e' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#0c713e' : '#f8fafc',
                      color: isSelected ? '#ffffff' : '#475569',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {renderCropIcon(adv.icon, 14)}
                    <span>{isBn ? adv.cropNameBn : adv.cropNameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categorized Advisory Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: '16px'
          }}>
            {filteredAdvisories.map(adv => {
              const cropTitle = isBn ? adv.cropNameBn : adv.cropNameEn;
              const cropStage = isBn ? (adv.stageBn || '') : (adv.stageEn || '');
              const items = isBn ? adv.itemsBn : adv.itemsEn;
              const isCopied = copiedId === adv.id;

              return (
                <div
                  key={adv.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease'
                  }}
                >
                  {/* Card Header */}
                  <div style={{
                    padding: '14px 18px',
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#dcfce7',
                        color: '#0c713e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {renderCropIcon(adv.icon, 18)}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {cropTitle}
                        </h4>
                        {cropStage && (
                          <span style={{
                            display: 'inline-block',
                            marginTop: '2px',
                            padding: '1px 8px',
                            borderRadius: '10px',
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {cropStage}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyAdvisory(adv)}
                      title={isBn ? 'পরামর্শ টেক্সট কপি করুন' : 'Copy Advisory Text'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: isCopied ? '#dcfce7' : '#ffffff',
                        border: isCopied ? '1px solid #86efac' : '1px solid #cbd5e1',
                        color: isCopied ? '#15803d' : '#64748b',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isCopied ? <Check size={13} color="#15803d" /> : <Copy size={13} />}
                      <span>{isCopied ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি' : 'Copy')}</span>
                    </button>
                  </div>

                  {/* Bulleted Advisories List */}
                  <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontSize: '13px',
                          lineHeight: 1.55,
                          color: '#334155'
                        }}
                      >
                        <span style={{
                          minWidth: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#ecfdf5',
                          color: '#0c713e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {isBn ? toBengaliNumerals(idx + 1) : idx + 1}
                        </span>
                        <div>{item}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Attribution Banner */}
      <div style={{
        marginTop: '12px',
        padding: '14px 20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sprout size={16} color="#0c713e" />
          <span>
            {isBn
              ? 'কৃষি সম্প্রসারণ অধিদপ্তর (ডিএই), কৃষি মন্ত্রণালয়, গণপ্রজাতন্ত্রী বাংলাদেশ সরকার।'
              : 'Department of Agricultural Extension (DAE), Ministry of Agriculture, Govt. of the People\'s Republic of Bangladesh.'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>
            {isBn ? 'তথ্যসূত্র: bamis.gov.bd/bulletin/nation/current/' : 'Source: bamis.gov.bd/bulletin/nation/current/'}
          </span>
        </div>
      </div>
    </div>
  );
}

