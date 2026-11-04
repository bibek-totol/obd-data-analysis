'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BmdLiveOutlookData,
  SynopticDirective,
  DivisionRainfallForecast,
  fetchBmdLiveOutlookData,
  getFallbackBmdLiveOutlook,
  toBengaliNumeral
} from '@/lib/bmd-live-outlook-client';
import {
  CalendarDays,
  CloudRain,
  Wind,
  Flame,
  CloudFog,
  Snowflake,
  FileText,
  Download,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  MapPin,
  TrendingUp,
  Droplets,
  Activity,
  X
} from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';

// function getDirectiveIcon(iconName: string, size = 22, className = '') {
//   switch (iconName) {
//     case 'CloudRain':
//       return <CloudRain size={size} className={className} />;
//     case 'Wind':
//       return <Wind size={size} className={className} />;
//     case 'Flame':
//       return <Flame size={size} className={className} />;
//     case 'CloudFog':
//       return <CloudFog size={size} className={className} />;
//     case 'Snowflake':
//       return <Snowflake size={size} className={className} />;
//     default:
//       return <Activity size={size} className={className} />;
//   }
// }

export default function BmdLiveOutlookSection() {
  const { registerReload, setIsLoading: setGlobalLoading, setLastUpdated } = useDashboard();

  // Data state
  const [data, setData] = useState<BmdLiveOutlookData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // UI state
  const [lang, setLang] = useState<'en' | 'bn'>('bn');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [modalPdfLang, setModalPdfLang] = useState<'en' | 'bn'>('bn');

  const dataRef = useRef<BmdLiveOutlookData | null>(null);

  // Load data callback - on demand only
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = isManual ? `/api/bmd-live/outlook?reload=true&t=${Date.now()}` : '/api/bmd-live/outlook';
      let res = await fetch(url);
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 400));
        res = await fetch(url);
      }
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json: BmdLiveOutlookData = await res.json();
      dataRef.current = json;
      setData(json);

      const timeStr = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setLastSyncTime(timeStr);
      setLastUpdated(timeStr);
    } catch (err) {
      console.warn('Live outlook fetch failed, applying verified authentic dataset:', err);
      if (!dataRef.current) {
        const fallback = getFallbackBmdLiveOutlook();
        dataRef.current = fallback;
        setData(fallback);
      }
      setError(
        lang === 'bn'
          ? 'সার্ভারের সাথে সংযোগে সাময়িক বিলম্ব, সংরক্ষিত সর্বশেষ নির্ভরযোগ্য পূর্বাভাস প্রদর্শিত হচ্ছে।'
          : 'Live connection delayed, displaying verified reserve seasonal outlook.'
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setGlobalLoading(false);
    }
  }, [lang, setGlobalLoading, setLastUpdated]);

  // Initial load
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Register header reload button
  useEffect(() => {
    registerReload(() => {
      loadData(true);
    });
  }, [registerReload, loadData]);

  const synopticDirectives = useMemo(() => data?.synopticDirectives || [], [data]);
  const divisions = useMemo(() => data?.divisionsRainfall || [], [data]);
  const previousReview = useMemo(() => data?.previousMonthReview, [data]);

  // Filtered divisions
  const filteredDivisions = useMemo(() => {
    return divisions.filter((div) => {
      if (selectedDivision !== 'all' && div.divisionEn.toLowerCase() !== selectedDivision.toLowerCase()) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return div.divisionEn.toLowerCase().includes(q) || div.divisionBn.includes(q);
    });
  }, [divisions, selectedDivision, searchQuery]);

  const activePdfUrl = (modalPdfLang === 'bn' ? data?.bnPdf : data?.enPdf) || data?.bnPdf || data?.enPdf;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Top Sync & Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '0 4px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>
            {lang === 'bn' ? 'লাইভ সিঙ্ক:' : 'Live Synced:'}{' '}
            <strong style={{ color: '#0f172a' }}>{lastSyncTime || 'Just now'}</strong>
          </span>
          <span>•</span>
          <span>
            {lang === 'bn' ? 'উৎস: বিএমডি লাইভ (সার্ভার ৬)' : 'Source: BMD Live (server6.bmd.gov.bd)'}
          </span>

          {error && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                marginLeft: '6px'
              }}
            >
              <Info size={12} />
              {error}
            </span>
          )}
        </div>

        {/* Right: Language Switch & Reload Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Language Switch */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              padding: '2px',
              border: '1px solid #e2e8f0'
            }}
          >
            <button
              onClick={() => setLang('bn')}
              id="btn-outlook-lang-bn"
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: lang === 'bn' ? '#0284c7' : 'transparent',
                color: lang === 'bn' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLang('en')}
              id="btn-outlook-lang-en"
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: lang === 'en' ? '#0284c7' : 'transparent',
                color: lang === 'en' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              English
            </button>
          </div>

          {/* PDF Modal Trigger Button */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
            }}
          >
            <FileText size={14} />
            <span>{lang === 'bn' ? 'অফিসিয়াল সার্কুলার' : 'Official Circular'}</span>
          </button>

          {/* Reload button */}
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            id="btn-reload-outlook-section"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isRefreshing ? '#f1f5f9' : '#ffffff',
              color: isRefreshing ? '#94a3b8' : '#0284c7',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin-fast' : ''} />
            {isRefreshing
              ? lang === 'bn' ? 'আপডেট হচ্ছে...' : 'Refreshing...'
              : lang === 'bn' ? 'তাজা তথ্য আনুন' : 'Reload Outlook'}
          </button>
        </div>
      </div>

      {/* 2. Executive Metadata Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '22px 26px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                <CalendarDays size={13} />
                {lang === 'bn' ? data?.validityPeriodBn : data?.validityPeriodEn}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {lang === 'bn' ? 'স্মারক নং: ' : 'Ref No: '}
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{data?.refNo}</strong>
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 24px)', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1.25 }}>
              {lang === 'bn' ? data?.titleBn : data?.titleEn}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              {lang === 'bn' ? data?.authorityBn : data?.authorityEn} •{' '}
              <span style={{ color: '#0369a1', fontWeight: 600 }}>{lang === 'bn' ? data?.chairmanBn : data?.chairmanEn}</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#475569',
                fontWeight: 600
              }}
            >
              <Calendar size={14} style={{ color: '#0284c7' }} />
              <span>
                {lang === 'bn' ? 'প্রকাশ তারিখ: ' : 'Published: '}
                <strong style={{ color: '#0f172a' }}>
                  {lang === 'bn' ? toBengaliNumeral(data?.issuedDate || '01-11-2026') : data?.issuedDate || '01-11-2026'}
                </strong>
              </span>
            </span>

            <a
              href={data?.enUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open portal page on server6.bmd.gov.bd"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                color: '#0f172a',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <ExternalLink size={13} />
              <span>server6</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3. Five Major Synoptic Seasonal Hazard Cards */}
      <div>
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: '#0284c7' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {lang === 'bn' ? 'মৌসুমি আবহাওয়া ও প্রাকৃতিক দুর্যোগের মূল নির্দেশিকা' : 'Key Seasonal Weather & Synoptic Hazards'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
          {synopticDirectives.map((item) => {
            const isHigh = item.severity === 'high';
            const isMedium = item.severity === 'medium';
            const iconBg = isHigh ? '#fee2e2' : isMedium ? '#fef3c7' : '#e0f2fe';
            const iconColor = isHigh ? '#dc2626' : isMedium ? '#d97706' : '#0284c7';
            const badgeBg = isHigh ? '#fef2f2' : isMedium ? '#fffbeb' : '#f0f9ff';
            const badgeBorder = isHigh ? '#fca5a5' : isMedium ? '#fde68a' : '#bae6fd';

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: isHigh ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                  padding: '18px 20px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  {/* <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: iconBg,
                      color: iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {getDirectiveIcon(item.icon, 22)}
                  </div> */}

                  <span
                    style={{
                      backgroundColor: badgeBg,
                      color: iconColor,
                      border: `1px solid ${badgeBorder}`,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textAlign: 'right'
                    }}
                  >
                    {lang === 'bn' ? item.statusBn : item.statusEn}
                  </span>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    {lang === 'bn' ? item.nameBn : item.nameEn}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.55 }}>
                    {lang === 'bn' ? item.summaryBn : item.summaryEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Division-wise Climatological Rainfall Outlook Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplets size={18} style={{ color: '#0284c7' }} />
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {lang === 'bn' ? 'বিভাগভিত্তিক স্বাভাবিক ও সম্ভাব্য বৃষ্টিপাত (মিলিমিটার)' : 'Division-wise Normal & Forecast Rainfall (mm)'}
              </h2>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              {lang === 'bn'
                ? 'নভেম্বর ২০২৬ হতে জানুয়ারি ২০২৭ পর্যন্ত বিভাগভিত্তিক স্বাভাবিক বৃষ্টিপাত, পূর্বাভাসের ব্যাপ্তি এবং মৃত্তিকার আর্দ্রতা।'
                : 'Comparative 3-month quantitative rainfall projection against climatological normals across all 8 divisions.'}
            </p>
          </div>

          {/* Division Filter Dropdown & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '180px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'বিভাগ খুঁজুন...' : 'Search division...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">{lang === 'bn' ? 'সকল বিভাগ (৮)' : 'All Divisions (8)'}</option>
              {divisions.map((d) => (
                <option key={d.divisionEn} value={d.divisionEn}>
                  {lang === 'bn' ? d.divisionBn : d.divisionEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 16px' }}>{lang === 'bn' ? 'বিভাগের নাম' : 'Division'}</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }} colSpan={2}>
                  {lang === 'bn' ? 'নভেম্বর ২০২৬ (মিমি)' : 'November 2026 (mm)'}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }} colSpan={2}>
                  {lang === 'bn' ? 'ডিসেম্বর ২০২৬ (মিমি)' : 'December 2026 (mm)'}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }} colSpan={2}>
                  {lang === 'bn' ? 'জানুয়ারি ২০২৭ (মিমি)' : 'January 2027 (mm)'}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {lang === 'bn' ? 'নভেম্বর মাটির আর্দ্রতা' : 'Soil Moisture (Nov)'}
                </th>
              </tr>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
                <th style={{ padding: '6px 16px' }}></th>
                <th style={{ padding: '6px 12px', textAlign: 'center' }}>{lang === 'bn' ? 'স্বাভাবিক' : 'Normal'}</th>
                <th style={{ padding: '6px 12px', textAlign: 'center', color: '#0284c7' }}>{lang === 'bn' ? 'পূর্বাভাস' : 'Forecast'}</th>
                <th style={{ padding: '6px 12px', textAlign: 'center' }}>{lang === 'bn' ? 'স্বাভাবিক' : 'Normal'}</th>
                <th style={{ padding: '6px 12px', textAlign: 'center', color: '#0284c7' }}>{lang === 'bn' ? 'পূর্বাভাস' : 'Forecast'}</th>
                <th style={{ padding: '6px 12px', textAlign: 'center' }}>{lang === 'bn' ? 'স্বাভাবিক' : 'Normal'}</th>
                <th style={{ padding: '6px 12px', textAlign: 'center', color: '#0284c7' }}>{lang === 'bn' ? 'পূর্বাভাস' : 'Forecast'}</th>
                <th style={{ padding: '6px 12px', textAlign: 'center' }}>{lang === 'bn' ? 'শতকরা হার' : 'Percentage'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDivisions.map((row, idx) => (
                <tr
                  key={row.divisionEn}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} style={{ color: '#0284c7' }} />
                      <span>{lang === 'bn' ? row.divisionBn : row.divisionEn}</span>
                    </div>
                  </td>

                  {/* November */}
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                    {lang === 'bn' ? toBengaliNumeral(row.novNormal) : row.novNormal}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: '#0284c7', backgroundColor: '#f0f9ff' }}>
                    {lang === 'bn' ? toBengaliNumeral(row.novForecast) : row.novForecast}
                  </td>

                  {/* December */}
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                    {lang === 'bn' ? toBengaliNumeral(row.decNormal) : row.decNormal}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: '#0284c7', backgroundColor: '#f0f9ff' }}>
                    {lang === 'bn' ? toBengaliNumeral(row.decForecast) : row.decForecast}
                  </td>

                  {/* January */}
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                    {lang === 'bn' ? toBengaliNumeral(row.janNormal) : row.janNormal}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: '#0284c7', backgroundColor: '#f0f9ff' }}>
                    {lang === 'bn' ? toBengaliNumeral(row.janForecast) : row.janForecast}
                  </td>

                  {/* Soil Moisture */}
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#059669' }}>
                    {lang === 'bn' ? toBengaliNumeral(row.soilMoistureNov) : row.soilMoistureNov}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Previous Month Review Card (October 2026 Analysis) */}
      {previousReview && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '20px 24px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Layers size={18} style={{ color: '#0284c7' }} />
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {lang === 'bn'
                ? `পূর্ববর্তী মাসের আবহাওয়া পর্যালোচনা (${previousReview.monthBn})`
                : `Previous Month Climate Review (${previousReview.monthEn})`}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {/* Metric 1: Monsoon Withdrawal & Rain Deficit */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'মৌসুমি বায়ুর বিদায় ও বৃষ্টিপাতের ঘাটতি' : 'Monsoon Withdrawal & Deficit'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {lang === 'bn'
                  ? `বিদায়ের তারিখ: ০৯ অক্টোবর ২০২৬ • ঘাটতি: ${toBengaliNumeral(previousReview.rainfallDeficitPct)}`
                  : `Withdrawn: ${previousReview.monsoonWithdrawalDate} • Deficit: ${previousReview.rainfallDeficitPct}`}
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#475569' }}>
                {previousReview.cyclonicSystems}
              </p>
            </div>

            {/* Metric 2: Extremes Recorded */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'সর্বোচ্চ ও সর্বনিম্ন চরম মাত্রা' : 'Recorded Extremes'}
              </div>
              <div style={{ fontSize: '13px', color: '#0f172a', marginTop: '4px', lineHeight: 1.5 }}>
                <div>• {lang === 'bn' ? 'সর্বোচ্চ বৃষ্টিপাত: ' : 'Highest Daily Rain: '}<strong>{previousReview.highestDailyRainfall}</strong></div>
                <div>• {lang === 'bn' ? 'সর্বোচ্চ তাপমাত্রা: ' : 'Highest Max Temp: '}<strong>{previousReview.highestTemp}</strong></div>
                <div>• {lang === 'bn' ? 'সর্বনিম্ন তাপমাত্রা: ' : 'Lowest Min Temp: '}<strong>{previousReview.lowestTemp}</strong></div>
              </div>
            </div>

            {/* Metric 3: SOI & Climate Indices */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'এল নিনো / লা নিনা ও এসওআই (SOI) সূচক' : 'SOI & El Niño / La Niña Index'}
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#475569', fontFamily: 'monospace', lineHeight: 1.5 }}>
                {previousReview.soiIndices}
              </p>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                {lang === 'bn' ? 'উৎস: ব্যুরো অব মেটিওরোলজি (অস্ট্রেলিয়া) ও ডব্লিউএমও' : 'Source: Bureau of Meteorology (Australia) & WMO'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. In-App Official PDF Modal Viewer */}
      {isPdfModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsPdfModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '960px',
              height: '90vh',
              maxHeight: '900px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {lang === 'bn' ? 'তিন মাসের দীর্ঘমেয়াদী আবহাওয়া পূর্বাভাস সার্কুলার' : 'Three-Month Long Range Outlook Circular'}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {lang === 'bn' ? 'স্মারক নং: ' : 'Ref: '} {data?.refNo} • {lang === 'bn' ? data?.validityPeriodBn : data?.validityPeriodEn}
                  </div>
                </div>
              </div>

              {/* Language Switch & Close Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* PDF Language Switch */}
                <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
                  <button
                    onClick={() => setModalPdfLang('bn')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: modalPdfLang === 'bn' ? '#0284c7' : 'transparent',
                      color: modalPdfLang === 'bn' ? '#ffffff' : '#64748b'
                    }}
                  >
                    বাংলা PDF
                  </button>
                  <button
                    onClick={() => setModalPdfLang('en')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: modalPdfLang === 'en' ? '#0284c7' : 'transparent',
                      color: modalPdfLang === 'en' ? '#ffffff' : '#64748b'
                    }}
                  >
                    English PDF
                  </button>
                </div>

                {/* Direct External Link */}
                <a
                  href={activePdfUrl || data?.enUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in new window"
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  <ExternalLink size={16} />
                </a>

                {/* Close Button */}
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: PDF iframe viewer */}
            <div style={{ flex: 1, backgroundColor: '#334155', position: 'relative' }}>
              {activePdfUrl ? (
                <iframe
                  src={activePdfUrl}
                  title="BMD Three-Month Outlook Circular PDF"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ffffff', gap: '12px' }}>
                  <FileText size={48} style={{ opacity: 0.5 }} />
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    {lang === 'bn' ? 'পিডিএফ লোড করা সম্ভব হয়নি' : 'Failed to load PDF document'}
                  </div>
                  <a
                    href={data?.enUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#67e8f9', fontSize: '13px', textDecoration: 'underline' }}
                  >
                    {lang === 'bn' ? 'অফিসিয়াল পোর্টাল দেখুন' : 'Visit BMD Official Portal'}
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '10px 20px',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#64748b'
              }}
            >
              <span>
                {lang === 'bn'
                  ? 'উৎস: বাংলাদেশ আবহাওয়া অধিদপ্তর (সার্ভার ৬) • বিশেষজ্ঞ কমিটি'
                  : 'Source: Bangladesh Meteorological Department (server6.bmd.gov.bd) • Expert Committee'}
              </span>
              <a
                href={activePdfUrl || '#'}
                download
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#0284c7',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <Download size={14} />
                {lang === 'bn' ? 'পিডিএফ সার্কুলার ডাউনলোড করুন' : 'Download Circular PDF'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
