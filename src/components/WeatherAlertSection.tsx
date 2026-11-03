'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  CloudRain,
  Wind,
  Flame,
  Snowflake,
  Activity,
  Feather,
  Egg,
  Search,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  X,
  Calendar,
  CalendarDays,
  ChevronLeft
} from 'lucide-react';
import {
  AlertCountsSummary,
  DistrictAlertItem,
  UpazilaAlertItem,
  WEATHER_ALERT_PARAMS,
  WeatherAlertParamId
} from '@/lib/weather-alert-client';
import { useDashboard } from '@/context/DashboardContext';

interface WeatherAlertSectionProps {
  initialCounts?: AlertCountsSummary;
}

function getTodayDhaka(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
}

function formatHumanDate(dateStr: string, isBn = false): string {
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

function getHorizonWindow(dateStr: string, isBn = false): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const startObj = new Date(y, m, d);
  const endObj = new Date(startObj.getTime() + 5 * 24 * 3600 * 1000);

  const monthsShortEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsShortBn = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];

  if (isBn) {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const toBn = (num: number) => String(num).split('').map(c => bnDigits[parseInt(c, 10)] || c).join('');
    return `${toBn(startObj.getDate())} ${monthsShortBn[startObj.getMonth()]} – ${toBn(endObj.getDate())} ${monthsShortBn[endObj.getMonth()]}, ${toBn(endObj.getFullYear())}`;
  }
  return `${startObj.getDate()} ${monthsShortEn[startObj.getMonth()]} – ${endObj.getDate()} ${monthsShortEn[endObj.getMonth()]}, ${endObj.getFullYear()}`;
}

export default function WeatherAlertSection({ initialCounts }: WeatherAlertSectionProps) {
  const { registerReload, setLastUpdated } = useDashboard();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDhaka);
  const [activeParam, setActiveParam] = useState<WeatherAlertParamId>(10);
  const [counts, setCounts] = useState<AlertCountsSummary | null>(initialCounts || null);
  const [districts, setDistricts] = useState<DistrictAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'alert_only'>('all');
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Upazila detail modal state
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictAlertItem | null>(null);
  const [upazilas, setUpazilas] = useState<UpazilaAlertItem[]>([]);
  const [isLoadingUpazilas, setIsLoadingUpazilas] = useState(false);

  // Fetch counts & district alerts
  const loadAlertData = useCallback(async (paramId: WeatherAlertParamId, fdate: string, forceReload = false) => {
    setIsLoading(true);
    if (forceReload) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/nlas/weather-alert?type=all&parameter=${paramId}&fdate=${fdate}${forceReload ? '&reload=true' : ''}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setCounts(json.data.counts);
          setDistricts(json.data.districts || []);
          const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSyncTime(timeStr);
          setLastUpdated(`Alerts synced at ${timeStr}`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch weather alert data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setLastUpdated]);

  useEffect(() => {
    loadAlertData(activeParam, selectedDate);
  }, [activeParam, selectedDate, loadAlertData]);

  // Register reload button in dashboard shell
  useEffect(() => {
    registerReload(() => {
      loadAlertData(activeParam, selectedDate, true);
    });
  }, [registerReload, activeParam, selectedDate, loadAlertData]);

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

  // Fetch upazila alerts when a district is selected
  const handleOpenUpazilas = async (district: DistrictAlertItem) => {
    setSelectedDistrict(district);
    setIsLoadingUpazilas(true);
    setUpazilas([]);
    try {
      const res = await fetch(`/api/nlas/weather-alert?type=upazilas&districtId=${district.district_id}&parameter=${activeParam}&fdate=${selectedDate}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setUpazilas(json.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to load upazila alerts:', err);
    } finally {
      setIsLoadingUpazilas(false);
    }
  };

  const paramMeta = WEATHER_ALERT_PARAMS[activeParam];

  // Filter districts by search & severity
  const filteredDistricts = useMemo(() => {
    return districts.filter(d => {
      const matchesSearch = !searchTerm.trim() || d.district_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || d.alert > 1;
      return matchesSearch && matchesSeverity;
    });
  }, [districts, searchTerm, severityFilter]);

  // Total alert districts for active parameter
  const activeAlertCount = useMemo(() => {
    return districts.filter(d => d.alert > 1).length;
  }, [districts]);

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
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                <ShieldAlert size={13} />
                Live Meteorological Warning System
              </span>
              <span style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                fontSize: '11px',
                fontWeight: 600
              }}>
                NLAS • DLS Bangladesh
              </span>
            </div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              {lang === 'en' ? 'Livestock Weather Alert & Stress Intelligence' : 'গবাদিপশু ও পোল্ট্রির আবহাওয়া সতর্কতা ও পীড়ন সূচক'}
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              {lang === 'en'
                ? 'High-resolution district and upazila alerts for Heat Wave, Cold Wave, Rainfall, Wind, and THI Discomfort.'
                : 'তাপপ্রবাহ, শৈত্যপ্রবাহ, অতিবৃষ্টি, ঝড়ো বাতাস ও টিএইচআই অস্বস্তি সূচকের জেলা ও উপজেলাভিত্তিক সতর্কতা।'}
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
              onClick={() => loadAlertData(activeParam, selectedDate, true)}
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
              {isRefreshing ? 'Syncing...' : 'Reload Latest Alerts'}
            </button>
          </div>
        </div>

        {/* PROMINENT FORECAST DATE & HORIZON BAR */}
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
          {/* Active Forecast Date Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#006a4e',
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
                {lang === 'en' ? 'Forecast Date' : 'পূর্বাভাস তারিখ'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                {formatHumanDate(selectedDate, lang === 'bn')}
              </div>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#e8f5f0',
              color: '#006a4e',
              fontSize: '11px',
              fontWeight: 700,
              marginLeft: '8px'
            }}>
              <CalendarDays size={13} />
              {lang === 'en' ? `5-Day Window: ${getHorizonWindow(selectedDate, false)}` : `৫-দিনের মেয়াদ: ${getHorizonWindow(selectedDate, true)}`}
            </div>
          </div>

          {/* Date Picker & Shift Controls */}
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
              id="alertDateInput"
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
                backgroundColor: selectedDate === getTodayDhaka() ? '#006a4e' : '#ffffff',
                color: selectedDate === getTodayDhaka() ? '#ffffff' : '#0f172a',
                cursor: 'pointer'
              }}
            >
              {lang === 'en' ? 'Today' : 'আজ'}
            </button>
          </div>
        </div>

        {/* 2. NATIONAL ALERT SUMMARY KPI CHIPS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: '10px'
        }}>
          {[
            { id: 10, label: 'THI Ruminants', count: counts?.alert_thi_ruminent ?? 544, icon: Activity, color: '#ea580c', bg: '#ffedd5' },
            { id: 12, label: 'THI Broilers', count: counts?.alert_thi_boiler ?? 541, icon: Feather, color: '#ca8a04', bg: '#fef9c3' },
            { id: 13, label: 'THI Layers', count: counts?.alert_thi_layer ?? 369, icon: Egg, color: '#eab308', bg: '#fef08a' },
            { id: 1, label: 'Rain Alert', count: counts?.alert_rain ?? 0, icon: CloudRain, color: '#0284c7', bg: '#e0f2fe' },
            { id: 2, label: 'Wind Alert', count: counts?.alert_wind ?? 0, icon: Wind, color: '#059669', bg: '#d1fae5' },
            { id: 3, label: 'Heat Wave', count: counts?.alert_heat ?? 0, icon: Flame, color: '#dc2626', bg: '#fee2e2' },
            { id: 4, label: 'Cold Wave', count: counts?.alert_cold ?? 0, icon: Snowflake, color: '#2563eb', bg: '#dbeafe' }
          ].map(item => {
            const isSelected = activeParam === item.id;
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveParam(item.id as WeatherAlertParamId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? item.bg : '#ffffff',
                  border: isSelected ? `2px solid ${item.color}` : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: item.bg,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComp size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    {item.count}
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, marginLeft: '3px' }}>alerts</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE PARAMETER DETAILS & STRESS SPECTRUM */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '18px 22px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>
              {lang === 'en' ? paramMeta.nameEn : paramMeta.nameBn}
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              {lang === 'en' ? paramMeta.descriptionEn : paramMeta.descriptionBn}
            </p>
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '9999px',
            backgroundColor: activeAlertCount > 0 ? '#ffedd5' : '#dcfce7',
            color: activeAlertCount > 0 ? '#ea580c' : '#16a34a'
          }}>
            {activeAlertCount} Districts Under Advisory Level
          </div>
        </div>

        {/* Stress Spectrum Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${paramMeta.stressLevels.length}, 1fr)`,
          gap: '6px',
          marginTop: '10px'
        }}>
          {paramMeta.stressLevels.map((lvl, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: lvl.bg,
                border: `1px solid ${lvl.color}30`,
                borderRadius: '8px',
                padding: '8px 10px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: lvl.color }}>
                {lang === 'en' ? lvl.labelEn : lvl.labelBn}
              </div>
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                {lvl.min} – {lvl.max === 999 ? '+' : lvl.max} {paramMeta.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. CONTROLS: SEARCH, FILTER, VIEW SWITCHER */}
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
              placeholder={lang === 'en' ? 'Search district name...' : 'জেলা অনুসন্ধান করুন...'}
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

          {/* Severity toggle */}
          <div style={{ display: 'inline-flex', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <button
              onClick={() => setSeverityFilter('all')}
              style={{
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: severityFilter === 'all' ? '#006a4e' : '#ffffff',
                color: severityFilter === 'all' ? '#ffffff' : '#475569',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              All Districts ({districts.length})
            </button>
            <button
              onClick={() => setSeverityFilter('alert_only')}
              style={{
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: severityFilter === 'alert_only' ? '#006a4e' : '#ffffff',
                color: severityFilter === 'alert_only' ? '#ffffff' : '#475569',
                border: 'none',
                borderLeft: '1px solid #cbd5e1',
                cursor: 'pointer'
              }}
            >
              Alerts Only ({activeAlertCount})
            </button>
          </div>
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

      {/* 5. DISTRICT LIST / CARDS */}
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
            Loading Meteorological Alert Telemetry for {formatHumanDate(selectedDate, lang === 'bn')}...
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Aggregating alert thresholds from BMDWRF and DLS livestock monitoring models.
          </p>
        </div>
      ) : filteredDistricts.length === 0 ? (
        <div style={{
          padding: '50px 20px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            No Active Alerts for {formatHumanDate(selectedDate, lang === 'bn')}
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            All monitored districts are currently within normal baseline thresholds for {paramMeta.nameEn}.
          </p>
        </div>
      ) : viewType === 'grid' ? (
        /* GRID CARDS VIEW */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '14px'
        }}>
          {filteredDistricts.map(district => {
            const hasAlert = district.alert > 1;
            const badgeBg = hasAlert ? '#fee2e2' : '#dcfce7';
            const badgeColor = hasAlert ? '#dc2626' : '#16a34a';
            const badgeLabel = district.alert >= 3 ? 'Warning' : district.alert === 2 ? 'Advisory' : 'Normal';

            return (
              <div
                key={district.district_id}
                style={{
                  backgroundColor: '#ffffff',
                  border: hasAlert ? '1px solid #fecaca' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* District Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {district.district_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Code: {district.district_id}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>•</span>
                      <span style={{ fontSize: '11px', color: '#006a4e', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={11} /> {selectedDate}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {hasAlert && <AlertTriangle size={11} />}
                    {badgeLabel}
                  </span>
                </div>

                {/* Values Matrix */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  backgroundColor: '#f8fafc',
                  padding: '10px',
                  borderRadius: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>AVERAGE</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      {district.val_avg} <span style={{ fontSize: '10px', fontWeight: 500 }}>{paramMeta.unit}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>MAX</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#dc2626' }}>
                      {district.val_max} <span style={{ fontSize: '10px', fontWeight: 500 }}>{paramMeta.unit}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>MIN</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284c7' }}>
                      {district.val_min} <span style={{ fontSize: '10px', fontWeight: 500 }}>{paramMeta.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Inspect Button */}
                <button
                  onClick={() => handleOpenUpazilas(district)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#006a4e',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <span>View Upazila Breakdown</span>
                  <ChevronRight size={14} />
                </button>
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
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>District Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Forecast Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Average ({paramMeta.unit})</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Max ({paramMeta.unit})</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Min ({paramMeta.unit})</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDistricts.map(district => {
                  const hasAlert = district.alert > 1;
                  const badgeBg = hasAlert ? '#fee2e2' : '#dcfce7';
                  const badgeColor = hasAlert ? '#dc2626' : '#16a34a';
                  const badgeLabel = district.alert >= 3 ? 'Warning' : district.alert === 2 ? 'Advisory' : 'Normal';

                  return (
                    <tr key={district.district_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {district.district_name}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                        {selectedDate}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: badgeBg,
                          color: badgeColor
                        }}>
                          {badgeLabel}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {district.val_avg}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#dc2626' }}>
                        {district.val_max}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0284c7' }}>
                        {district.val_min}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenUpazilas(district)}
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
                          Upazilas
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

      {/* 6. UPAZILA DETAIL MODAL */}
      {selectedDistrict && (
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
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {selectedDistrict.district_name} – Upazila Alert Breakdown
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Parameter: {paramMeta.nameEn} ({paramMeta.unit})
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>•</span>
                  <span style={{ fontSize: '12px', color: '#006a4e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> Forecast Date: {formatHumanDate(selectedDate, lang === 'bn')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDistrict(null)}
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
            <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
              {isLoadingUpazilas ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <RefreshCw size={24} className="animate-spin-fast" color="#006a4e" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Fetching upazila alert statistics for {selectedDistrict.district_name}...
                  </p>
                </div>
              ) : upazilas.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No individual upazila records available for this district on {selectedDate}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {upazilas.map(u => {
                    const hasAlert = u.alert > 1;
                    return (
                      <div
                        key={u.upazila_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          backgroundColor: hasAlert ? '#fff1f2' : '#f8fafc',
                          border: hasAlert ? '1px solid #fecdd3' : '1px solid #e2e8f0'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                            {u.upazila_name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            PCODE: {u.upazila_id}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                              {u.val_avg} {paramMeta.unit}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                              Range: {u.val_min} – {u.val_max}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: hasAlert ? '#fee2e2' : '#dcfce7',
                            color: hasAlert ? '#dc2626' : '#16a34a'
                          }}>
                            {u.alert >= 3 ? 'Warning' : u.alert === 2 ? 'Advisory' : 'Normal'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                onClick={() => setSelectedDistrict(null)}
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
