'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AisCombinedData,
  AisSpecialFile,
  AisMonthlySector
} from '@/lib/ais-client';
import {
  Sprout,
  Calendar,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  ExternalLink,
  Copy,
  Check,
  PhoneCall,
  MapPin,
  ChevronRight,
  ChevronDown,
  Info,
  ShieldCheck,
  Wheat,
  Trees,
  Carrot,
  Apple,
  Activity,
  Waves,
  X,
  BookOpen,
  Printer,
  Sparkles
} from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';

interface AisSectionProps {
  initialTab?: 'monthly' | 'special' | 'technology';
}

export default function AisSection({ initialTab = 'monthly' }: AisSectionProps) {
  const { registerReload, setIsLoading: setGlobalLoading, setLastUpdated } = useDashboard();

  // Active sub-section tab
  const [activeTab, setActiveTab] = useState<'monthly' | 'special' | 'technology'>(initialTab);

  // Data state
  const [data, setData] = useState<AisCombinedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // UI state
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tab 1 (Monthly) State
  const [monthlySearch, setMonthlySearch] = useState<string>('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');

  // Tab 2 (Special Files) State
  const [filesSearch, setFilesSearch] = useState<string>('');
  const [fileCategoryFilter, setFileCategoryFilter] = useState<string>('all');
  const [filesViewMode, setFilesViewMode] = useState<'grid' | 'table'>('grid');
  const [activeFileModal, setActiveFileModal] = useState<AisSpecialFile | null>(null);

  // Tab 3 (Technology) State
  const [activeTechGuide, setActiveTechGuide] = useState<'boro-seedbed' | 'dhan-kata' | 'vejal-sar'>('boro-seedbed');
  const [techSearch, setTechSearch] = useState<string>('');

  // Synchronize initialTab prop if router changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Load data callback
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = isManual ? `/api/ais?reload=true&t=${Date.now()}` : '/api/ais';
      let res = await fetch(url);
      if (!res.ok) {
        await new Promise(r => setTimeout(r, 400));
        res = await fetch(url);
      }
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json: AisCombinedData = await res.json();
      setData(json);
      const timeStr = json.fetchedAt || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      setLastSyncTime(timeStr);
      setLastUpdated(timeStr);
    } catch (err: any) {
      console.error('[AisSection] Failed to load AIS data:', err);
      setError(err?.message || 'Failed to load AIS data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setGlobalLoading(false);
    }
  }, [setGlobalLoading, setLastUpdated]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    registerReload(() => loadData(true));
  }, [registerReload, loadData]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Monthly Sectors
  const filteredSectors = useMemo(() => {
    if (!data?.monthlyAdvisory?.sectors) return [];
    return data.monthlyAdvisory.sectors.filter(sec => {
      if (selectedSectorFilter !== 'all' && sec.id !== selectedSectorFilter) return false;
      if (monthlySearch.trim()) {
        const q = monthlySearch.toLowerCase().trim();
        const mName = sec.nameBn.toLowerCase().includes(q) || sec.nameEn.toLowerCase().includes(q);
        const mDirectives = sec.directivesBn.some(d => d.toLowerCase().includes(q));
        if (!mName && !mDirectives) return false;
      }
      return true;
    });
  }, [data, selectedSectorFilter, monthlySearch]);

  // Filtered Special Files
  const filteredFiles = useMemo(() => {
    if (!data?.specialAdvisories?.files) return [];
    return data.specialAdvisories.files.filter(f => {
      if (fileCategoryFilter !== 'all' && f.category !== fileCategoryFilter && f.categoryBn !== fileCategoryFilter) {
        return false;
      }
      if (filesSearch.trim()) {
        const q = filesSearch.toLowerCase().trim();
        const mTitle = f.title.toLowerCase().includes(q) || f.titleEn.toLowerCase().includes(q);
        const mSummary = f.summaryBn.toLowerCase().includes(q) || f.summaryEn.toLowerCase().includes(q);
        if (!mTitle && !mSummary) return false;
      }
      return true;
    });
  }, [data, fileCategoryFilter, filesSearch]);

  // Unique categories for files
  const fileCategories = useMemo(() => {
    if (!data?.specialAdvisories?.files) return [];
    const cats = new Set<string>();
    data.specialAdvisories.files.forEach(f => {
      cats.add(lang === 'bn' ? f.categoryBn : f.category);
    });
    return Array.from(cats);
  }, [data, lang]);

  // Helper to render sector icon
  const getSectorIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wheat': return <Wheat size={18} color="#15803d" />;
      case 'Trees': return <Trees size={18} color="#16a34a" />;
      case 'Carrot': return <Carrot size={18} color="#ea580c" />;
      case 'Apple': return <Apple size={18} color="#dc2626" />;
      case 'Activity': return <Activity size={18} color="#0284c7" />;
      case 'Waves': return <Waves size={18} color="#0891b2" />;
      default: return <Sprout size={18} color="#15803d" />;
    }
  };

  return (
    <div style={{ padding: '16px 20px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'inherit' }}>
      {/* 1. Header & Live Telemetry KPI Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #bbf7d0',
        padding: '20px 24px',
        boxShadow: '0 2px 10px rgba(22, 163, 74, 0.05)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid #bbf7d0'
              }}>
                {lang === 'bn' ? 'কৃষি তথ্য সার্ভিস (এআইএস)' : 'Agriculture Information Service (AIS)'}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {lang === 'bn' ? 'উৎস: কৃষি মন্ত্রণালয় • গণপ্রজাতন্ত্রী বাংলাদেশ সরকার' : 'Source: Ministry of Agriculture • Govt. of Bangladesh'}
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
              {lang === 'bn' ? 'কৃষি তথ্য সার্ভিস (এআইএস) জাতীয় কৃষি জ্ঞান ও প্রযুক্তি হাব' : 'AIS National Agricultural Information & Technology Portal'}
            </h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              {lang === 'bn'
                ? `মাসভিত্তিক কৃষি কার্যক্রম, টেকনিক্যাল নির্দেশিকা ও আধুনিক ফসল উৎপাদন প্রযুক্তি • লাইভ সিঙ্ক: ${lastSyncTime || '04:30 PM'}`
                : `Monthly Agromet Advisories, Special Crop Directives & Technology Guides • Live Synced: ${lastSyncTime || '04:30 PM'}`}
            </p>
          </div>

          {/* Action buttons & Language toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'inline-flex',
              backgroundColor: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => setLang('bn')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: lang === 'bn' ? '#15803d' : 'transparent',
                  color: lang === 'bn' ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLang('en')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: lang === 'en' ? '#15803d' : 'transparent',
                  color: lang === 'en' ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                English
              </button>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                backgroundColor: isRefreshing ? '#e2e8f0' : '#f0fdf4',
                color: isRefreshing ? '#64748b' : '#15803d',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isRefreshing || loading ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin-fast' : ''} />
              <span>{isRefreshing ? (lang === 'bn' ? 'আপডেট হচ্ছে...' : 'Refreshing...') : (lang === 'bn' ? 'তাজা তথ্য আনুন' : 'Reload AIS Data')}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#15803d' }}>
                {lang === 'bn' ? 'চলতি মাসের কৃষি বার্তা' : 'Monthly Agricultural Calendar'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#166534', margin: '4px 0' }}>
                {lang === 'bn' ? data.monthlyAdvisory.monthBn : data.monthlyAdvisory.monthEn}
              </div>
              <div style={{ fontSize: '11px', color: '#15803d' }}>
                {lang === 'bn' ? `${data.monthlyAdvisory.sectors.length}টি প্রধান খাতে কার্যক্রম` : `${data.monthlyAdvisory.sectors.length} Core Sectors Monitored`}
              </div>
            </div>

            <div style={{ backgroundColor: '#eff6ff', padding: '14px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#1d4ed8' }}>
                {lang === 'bn' ? 'বিশেষ প্রকাশনা ও পরামর্শ ফাইল' : 'Special Advisory Bulletins'}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e40af', margin: '4px 0' }}>
                {data.specialAdvisories.files.length} {lang === 'bn' ? 'টি অফিসিয়াল ফাইল' : 'Official Files'}
              </div>
              <div style={{ fontSize: '11px', color: '#2563eb' }}>
                {lang === 'bn' ? 'সরাসরি প্রিভিউ ও ডাউনলোডযোগ্য' : 'PDF & Visual In-App Readers'}
              </div>
            </div>

            <div style={{ backgroundColor: '#fffbeb', padding: '14px', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#b45309' }}>
                {lang === 'bn' ? 'মূল প্রযুক্তি নির্দেশিকা' : 'Core Technology Guide'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#92400e', margin: '4px 0' }}>
                {lang === 'bn' ? data.cropTechnology.primaryTopic.titleBn : data.cropTechnology.primaryTopic.titleEn}
              </div>
              <div style={{ fontSize: '11px', color: '#b45309' }}>
                {lang === 'bn' ? '৫টি ধাপে বিস্তারিত জাত ও পরিচর্যা' : '5-Step Production Technology'}
              </div>
            </div>

            <div style={{ backgroundColor: '#faf5ff', padding: '14px', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#7e22ce' }}>
                {lang === 'bn' ? 'কৃষি কল সেন্টার হটলাইন' : 'Krishi Call Center Hotline'}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#6b21a8', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PhoneCall size={20} color="#7e22ce" />
                <span>{data.meta.callCenter}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#7e22ce' }}>
                {lang === 'bn' ? 'সকাল ৯টা - বিকাল ৫টা (টোল ফ্রি)' : 'Direct Farmer Help (Toll-Free)'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Section Switcher Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#ffffff',
        padding: '6px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('monthly')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'monthly' ? '#15803d' : 'transparent',
            color: activeTab === 'monthly' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Calendar size={16} />
          <span>{lang === 'bn' ? '১. এ মাসের কৃষি (Monthly Advisory)' : '1. Monthly Agromet Advisory'}</span>
        </button>

        <button
          onClick={() => setActiveTab('special')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'special' ? '#15803d' : 'transparent',
            color: activeTab === 'special' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <FileText size={16} />
          <span>{lang === 'bn' ? '২. বিশেষ কৃষি পরামর্শ ও ফাইল (Special Advisories)' : '2. Special Advisories & Files'}</span>
        </button>

        <button
          onClick={() => setActiveTab('technology')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'technology' ? '#15803d' : 'transparent',
            color: activeTab === 'technology' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Sprout size={16} />
          <span>{lang === 'bn' ? '৩. আধুনিক ফসল চাষাবাদ প্রযুক্তি (Crop Technology)' : '3. Crop Production Technology'}</span>
        </button>
      </div>

      {/* 3. TAB 1: MONTHLY AGRICULTURE ADVISORY */}
      {activeTab === 'monthly' && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Executive Editorial Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #bbf7d0',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <span style={{
                  backgroundColor: '#f0fdf4',
                  color: '#166534',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {lang === 'bn' ? data.monthlyAdvisory.periodBn : data.monthlyAdvisory.periodEn}
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '8px 0 4px' }}>
                  {lang === 'bn' ? data.monthlyAdvisory.titleBn : data.monthlyAdvisory.titleEn}
                </h2>
                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{lang === 'bn' ? data.monthlyAdvisory.authorBn : data.monthlyAdvisory.authorEn}</span>
                </div>
              </div>

              {/* AIS Portal External Link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '11px', color: '#64748b' }}>
                <a
                  href={data.monthlyAdvisory.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#f0fdf4',
                    color: '#15803d',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0',
                    textDecoration: 'none',
                    fontWeight: 700
                  }}
                >
                  <ExternalLink size={12} />
                  <span>{lang === 'bn' ? 'মূল AIS পাতায় দেখুন' : 'View on AIS Portal'}</span>
                </a>
              </div>
            </div>

            {/* Intro text */}
            <p style={{ fontSize: '13.5px', lineHeight: 1.7, color: '#334155', margin: 0 }}>
              {lang === 'bn' ? data.monthlyAdvisory.introBn : data.monthlyAdvisory.introEn}
            </p>
          </div>

          {/* Sector Filter Chips & Search Bar */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Filter pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedSectorFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: selectedSectorFilter === 'all' ? '#15803d' : '#f1f5f9',
                  color: selectedSectorFilter === 'all' ? '#ffffff' : '#475569'
                }}
              >
                {lang === 'bn' ? `সকল খাত (${data.monthlyAdvisory.sectors.length})` : `All Sectors (${data.monthlyAdvisory.sectors.length})`}
              </button>
              {data.monthlyAdvisory.sectors.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectorFilter(sec.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: selectedSectorFilter === sec.id ? '#15803d' : '#f1f5f9',
                    color: selectedSectorFilter === sec.id ? '#ffffff' : '#475569'
                  }}
                >
                  {lang === 'bn' ? sec.nameBn : sec.nameEn}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'পরামর্শ ও নির্দেশিকা খুঁজুন...' : 'Search directives...'}
                value={monthlySearch}
                onChange={(e) => setMonthlySearch(e.target.value)}
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
          </div>

          {/* Directives Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {filteredSectors.map((sec) => {
              const fullDirectiveText = `${sec.nameBn}\nপর্যায়: ${sec.stageBn}\n${sec.directivesBn.map((d, i) => `${i + 1}. ${d}`).join('\n')}`;

              return (
                <div
                  key={sec.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {getSectorIcon(sec.icon)}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {lang === 'bn' ? sec.nameBn : sec.nameEn}
                          </h3>
                          <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                            {lang === 'bn' ? sec.stageBn : sec.stageEn}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopy(fullDirectiveText, sec.id)}
                        title={lang === 'bn' ? 'পরামর্শ কপি করুন' : 'Copy directive'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          fontSize: '11px',
                          color: '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedId === sec.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                        <span>{copiedId === sec.id ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
                      </button>
                    </div>

                    {/* Directives List */}
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {sec.directivesBn.map((d, dIdx) => (
                        <li key={dIdx} style={{ fontSize: '12.5px', lineHeight: 1.6, color: '#334155' }}>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                    <span>AIS Expert Directives</span>
                    <span style={{ color: '#15803d', fontWeight: 700 }}>{data.monthlyAdvisory.monthBn}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 2: SPECIAL ADVISORIES & FILES */}
      {activeTab === 'special' && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Description Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #bfdbfe',
            padding: '20px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {lang === 'bn' ? 'অফিসিয়াল টেকনিক্যাল প্রকাশনা ও ডাউনলোড' : 'Official Technical Publications & Bulletins'}
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
                  {lang === 'bn' ? data.specialAdvisories.titleBn : data.specialAdvisories.titleEn}
                </h2>
                <p style={{ fontSize: '12.5px', color: '#475569', margin: '4px 0 0' }}>
                  {lang === 'bn' ? data.specialAdvisories.descriptionBn : data.specialAdvisories.descriptionEn}
                </p>
              </div>

              <a
                href={data.specialAdvisories.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <ExternalLink size={14} />
                <span>{lang === 'bn' ? 'AIS ফাইলস পেজ দেখুন' : 'View AIS Files Page'}</span>
              </a>
            </div>
          </div>

          {/* Search, Filter Pills & View Toggle */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setFileCategoryFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: fileCategoryFilter === 'all' ? '#15803d' : '#f1f5f9',
                  color: fileCategoryFilter === 'all' ? '#ffffff' : '#475569'
                }}
              >
                {lang === 'bn' ? `সকল ফাইল (${data.specialAdvisories.files.length})` : `All Files (${data.specialAdvisories.files.length})`}
              </button>
              {fileCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFileCategoryFilter(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: fileCategoryFilter === cat ? '#15803d' : '#f1f5f9',
                    color: fileCategoryFilter === cat ? '#ffffff' : '#475569'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'ফাইল/পরামর্শ খুঁজুন...' : 'Search files...'}
                  value={filesSearch}
                  onChange={(e) => setFilesSearch(e.target.value)}
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

              {/* View Switcher */}
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                <button
                  onClick={() => setFilesViewMode('grid')}
                  style={{
                    padding: '5px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: filesViewMode === 'grid' ? '#ffffff' : 'transparent',
                    color: filesViewMode === 'grid' ? '#15803d' : '#64748b'
                  }}
                >
                  {lang === 'bn' ? 'কার্ড' : 'Grid'}
                </button>
                <button
                  onClick={() => setFilesViewMode('table')}
                  style={{
                    padding: '5px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: filesViewMode === 'table' ? '#ffffff' : 'transparent',
                    color: filesViewMode === 'table' ? '#15803d' : '#64748b'
                  }}
                >
                  {lang === 'bn' ? 'টেবিল' : 'Table'}
                </button>
              </div>
            </div>
          </div>

          {/* Files Grid View */}
          {filesViewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        backgroundColor: file.format === 'PDF' ? '#fee2e2' : '#fef3c7',
                        color: file.format === 'PDF' ? '#b91c1c' : '#b45309'
                      }}>
                        {file.format} • {file.fileSize}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {lang === 'bn' ? file.categoryBn : file.category}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                      {file.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
                      {lang === 'bn' ? file.summaryBn : file.summaryEn}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      onClick={() => setActiveFileModal(file)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #bbf7d0',
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={14} />
                      <span>{lang === 'bn' ? 'প্রিভিউ দেখুন' : 'In-App Preview'}</span>
                    </button>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#334155',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <Download size={14} />
                      <span>{lang === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'প্রকাশনার নাম' : 'Publication Title'}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? 'ফরম্যাট' : 'Format'}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'সারসংক্ষেপ' : 'Summary'}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>{lang === 'bn' ? 'পদক্ষেপ' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((f, i) => (
                      <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{f.title}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{lang === 'bn' ? f.categoryBn : f.category}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: f.format === 'PDF' ? '#fee2e2' : '#fef3c7',
                            color: f.format === 'PDF' ? '#b91c1c' : '#b45309'
                          }}>
                            {f.format}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569', maxWidth: '380px' }}>
                          {lang === 'bn' ? f.summaryBn : f.summaryEn}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => setActiveFileModal(f)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #bbf7d0',
                                backgroundColor: '#f0fdf4',
                                color: '#15803d',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {lang === 'bn' ? 'প্রিভিউ' : 'View'}
                            </button>
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#334155',
                                fontSize: '11px',
                                fontWeight: 700,
                                textDecoration: 'none'
                              }}
                            >
                              {lang === 'bn' ? 'ডাউনলোড' : 'Download'}
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: CROP PRODUCTION TECHNOLOGY */}
      {activeTab === 'technology' && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sub-Guide Switcher Tabs */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTechGuide('boro-seedbed')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: activeTechGuide === 'boro-seedbed' ? '#15803d' : '#f1f5f9',
                  color: activeTechGuide === 'boro-seedbed' ? '#ffffff' : '#475569'
                }}
              >
                <Wheat size={14} />
                <span>{lang === 'bn' ? 'বোরো ধানের বীজতলা তৈরি' : 'Boro Rice Seedbed Preparation'}</span>
              </button>
              <button
                onClick={() => setActiveTechGuide('dhan-kata')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: activeTechGuide === 'dhan-kata' ? '#15803d' : '#f1f5f9',
                  color: activeTechGuide === 'dhan-kata' ? '#ffffff' : '#475569'
                }}
              >
                <Trees size={14} />
                <span>{lang === 'bn' ? 'ধান কাটা, মাড়াই ও সংরক্ষণ' : 'Harvesting & Storage'}</span>
              </button>
              <button
                onClick={() => setActiveTechGuide('vejal-sar')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: activeTechGuide === 'vejal-sar' ? '#15803d' : '#f1f5f9',
                  color: activeTechGuide === 'vejal-sar' ? '#ffffff' : '#475569'
                }}
              >
                <ShieldCheck size={14} />
                <span>{lang === 'bn' ? 'ভেজাল সার চেনার উপায়' : 'Detecting Adulterated Fertilizers'}</span>
              </button>
            </div>

            <a
              href={data.cropTechnology.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #bbf7d0',
                textDecoration: 'none',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <ExternalLink size={12} />
              <span>{lang === 'bn' ? 'AIS টেকনোলজি পাতা' : 'AIS Technology Page'}</span>
            </a>
          </div>

          {/* Active Guide Content */}
          {activeTechGuide === 'boro-seedbed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header Card */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #bbf7d0',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                <span style={{
                  backgroundColor: '#f0fdf4',
                  color: '#15803d',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {lang === 'bn' ? data.cropTechnology.primaryTopic.timingBn : data.cropTechnology.primaryTopic.timingEn}
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '8px 0 6px' }}>
                  {lang === 'bn' ? data.cropTechnology.primaryTopic.titleBn : data.cropTechnology.primaryTopic.titleEn}
                </h2>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  {lang === 'bn'
                    ? 'বোরো মৌসুমে সর্বোচ্চ ফলন নিশ্চিত করতে উন্নত জাত নির্বাচন, বৈজ্ঞানিক বীজ শোধন ও শৈত্যপ্রবাহ প্রতিরোধী বীজতলা ব্যবস্থাপনা অত্যন্ত গুরুত্বপূর্ণ।'
                    : 'Selecting ecology-matched varieties and applying climate-resilient seedbed practices ensures high germination and sturdy seedlings during winter.'}
                </p>
              </div>

              {/* Step by step technical cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.cropTechnology.primaryTopic.steps.map((st, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '18px 22px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#166534', margin: 0 }}>
                        {lang === 'bn' ? st.titleBn : st.titleEn}
                      </h3>
                      <button
                        onClick={() => handleCopy(`${st.titleBn}\n${st.descBn}`, `step-${sIdx}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          fontSize: '11px',
                          color: '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedId === `step-${sIdx}` ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                        <span>{copiedId === `step-${sIdx}` ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
                      </button>
                    </div>

                    <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-line', margin: 0 }}>
                      {lang === 'bn' ? st.descBn : st.descEn}
                    </p>
                  </div>
                ))}
              </div>

              {/* Ecology-matched Variety Quick Reference Table */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
                  {lang === 'bn' ? '🌾 অঞ্চল ও প্রতিবেশভিত্তিক বোরো ধানের উন্নত জাত ছক' : '🌾 Ecology-Specific Boro Rice Variety Matrix'}
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'অঞ্চল ও প্রাকৃতিক বৈশিষ্ট্য' : 'Ecology & Condition'}</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'প্রস্তাবিত উন্নত জাত' : 'Recommended Varieties'}</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>{lang === 'bn' ? 'মূল সুবিধা' : 'Key Advantage'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#c2410c' }}>{lang === 'bn' ? 'খরা ও সেচের পানির ঘাটতি এলাকা' : 'Drought & Water-Deficit Areas'}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>ব্রি ধান২৮, ব্রি ধান৪৫, ব্রি ধান৫৫</td>
                        <td style={{ padding: '10px 14px', color: '#475569' }}>{lang === 'bn' ? 'স্বল্পমেয়াদী ও কম সেচ প্রয়োজন' : 'Short duration & low water requirement'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#15803d' }}>{lang === 'bn' ? 'উর্বর জমি ও পর্যাপ্ত সেচ সুবিধা' : 'Fertile Land & Assured Irrigation'}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>ব্রি ধান২৯, ব্রি ধান৫০, ব্রি ধান৫৮, ৬০, ব্রি হাইব্রিড ১-৩</td>
                        <td style={{ padding: '10px 14px', color: '#475569' }}>{lang === 'bn' ? 'উচ্চ ফলনশীল ও সরু দানার ধান' : 'Ultra-high yield potential'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0284c7' }}>{lang === 'bn' ? 'উত্তরাঞ্চলের তীব্র ঠান্ডা এলাকা' : 'Northern Cold-Prone Belts'}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>ব্রি ধান৩৬</td>
                        <td style={{ padding: '10px 14px', color: '#475569' }}>{lang === 'bn' ? 'শৈত্যপ্রবাহ সহনশীল চারা' : 'Cold & chill tolerant'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#7c3aed' }}>{lang === 'bn' ? 'হাওড় ও জলাভূমি এলাকা' : 'Haor & Lowland Basins'}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>বিআর১৭, বিআর১৮, বিআর১৯</td>
                        <td style={{ padding: '10px 14px', color: '#475569' }}>{lang === 'bn' ? 'আগাম বন্যা আসার আগেই কাটা যায়' : 'Matures before early flash floods'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0891b2' }}>{lang === 'bn' ? 'উপকূলীয় লবণাক্ত এলাকা' : 'Coastal Saline Soils'}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>ব্রি ধান৪৭, ব্রি ধান৫৫, ব্রি ধান৬১</td>
                        <td style={{ padding: '10px 14px', color: '#475569' }}>{lang === 'bn' ? 'মাঝারি থেকে তীব্র লবণাক্ততা সহনশীল' : 'Moderate to high salinity tolerance'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTechGuide === 'dhan-kata' && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>
                {lang === 'bn' ? 'ধান কাটা, মাড়াই ও সংরক্ষণ প্রযুক্তি' : 'Rice Harvesting, Threshing & Storage Technology'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: 1.7, color: '#334155' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #15803d' }}>
                  <strong style={{ color: '#0f172a' }}>১. ধান কাটার সঠিক সময়:</strong> শিষের শতকরা ৮০ ভাগ ধান সোনালী বা খড়ের রং ধারণ করলে এবং নিচের ২০ ভাগ সামান্য হালকা সবুজ থাকতে ফসল কাটতে হবে। বেশি শুকালে ধান ঝরে পড়ে এবং চাল ভেঙে যায়।
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
                  <strong style={{ color: '#0f172a' }}>২. মাড়াই ও ঝাড়াই:</strong> আধুনিক কম্বাইন হারভেস্টার বা পাওয়ার থ্রেশার ব্যবহার করুন। ধান মাড়াইয়ের পর বাঁশের কুলা বা উইনোয়ার দিয়ে চিটা ও অপুষ্ট দানা আলাদা করুন।
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #d97706' }}>
                  <strong style={{ color: '#0f172a' }}>৩. শুকানো ও আর্দ্রতা নিয়ন্ত্রণ:</strong> কাটার পর ধান ৪-৫ দিন কড়া রোদে ভালোভাবে শুকাতে হবে। ধানের আর্দ্রতা শতকরা ১২ ভাগের নিচে নামলে দাতে চাপ দিলে ‘কট’ করে শব্দ হয়ে ভেঙে যাবে।
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #7c3aed' }}>
                  <strong style={{ color: '#0f172a' }}>৪. বায়ুরোধী সংরক্ষণ:</strong> প্লাস্টিকের ড্রাম, বিস্কুটের টিন বা জিরো-ফ্লাই মোড়ানো গোলায় সংরক্ষণ করুন। পাত্রের মুখ ভালোভাবে বন্ধ করে শুকনো মেঝে বা মাচার উপর রাখুন।
                </div>
              </div>
            </div>
          )}

          {activeTechGuide === 'vejal-sar' && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>
                {lang === 'bn' ? 'ভেজাল সার চেনার সহজ ও ব্যবহারিক উপায়' : 'Practical Methods for Detecting Adulterated Fertilizers'}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#166534', fontWeight: 800 }}>১. ইউরিয়া সার পরীক্ষা</h4>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.6, color: '#334155' }}>
                    এক চা চামচ ইউরিয়া সার আধা গ্লাস পানিতে দিন। খাঁটি ইউরিয়া মুহূর্তের মধ্যে সম্পূর্ণ গলে যাবে এবং পানি বরফের মতো ভীষণ ঠাণ্ডা হয়ে যাবে। কোনো তলানি থাকলে তা ভেজাল।
                  </p>
                </div>
                <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#1e40af', fontWeight: 800 }}>২. টিএসপি (TSP) সার পরীক্ষা</h4>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.6, color: '#334155' }}>
                    খাঁটি টিএসপি সারের দানা সমআকৃতির ও শক্ত হয়। পানিতে দিলে প্রায় পুরোটাই ধীরগতিতে গুলে যায়। আগুনে দিলে তা সহজে ফোলে না, কিন্তু ভেজাল সারের মাটি বা ইটগুঁড়া তলানি হিসেবে জমে থাকে।
                  </p>
                </div>
                <div style={{ backgroundColor: '#fff7ed', padding: '16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#9a3412', fontWeight: 800 }}>৩. এমওপি (MOP) পটাশ সার</h4>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.6, color: '#334155' }}>
                    খাঁটি পটাশ সার লালচে দানাদার ও লবণের মতো। এক চামচ সার পানিতে দিলে দ্রুত গুলে যাবে এবং পানির রং লালচে হয়ে যাবে। কোনো বালু বা কাদা মাটির তলানি অবশিষ্ট থাকবে না।
                  </p>
                </div>
                <div style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#6b21a8', fontWeight: 800 }}>৪. ডিএপি (DAP) সার পরীক্ষা</h4>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.6, color: '#334155' }}>
                    ডিএপি সার একটু চুন দিয়ে ঘষলে ঝাঁঝালো অ্যামোনিয়া গ্যাসের তীব্র গন্ধ বের হবে। আগুনে তাপে দিলে দানাগুলে গলে বুদবুদ সৃষ্টি করে।
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. MODAL: IN-APP DOCUMENT READER FOR SPECIAL FILES */}
      {activeFileModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {activeFileModal.title}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {lang === 'bn' ? activeFileModal.categoryBn : activeFileModal.category} • {activeFileModal.format} • {activeFileModal.fileSize}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={activeFileModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <Download size={13} />
                  <span>{lang === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
                </a>
                <button
                  onClick={() => setActiveFileModal(null)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} color="#475569" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded Viewer */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#f1f5f9' }}>
              {activeFileModal.format === 'JPG' || activeFileModal.url.toLowerCase().endsWith('.jpg') || activeFileModal.url.toLowerCase().endsWith('.png') ? (
                <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <img
                    src={activeFileModal.url}
                    alt={activeFileModal.title}
                    style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px' }}
                  />
                </div>
              ) : (
                <div style={{ height: '62vh', width: '100%', backgroundColor: '#ffffff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <iframe
                    src={activeFileModal.url}
                    title={activeFileModal.title}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              )}

              {/* Summary Box */}
              <div style={{ marginTop: '16px', backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: '12px', color: '#0f172a' }}>{lang === 'bn' ? 'সারসংক্ষেপ ও প্রয়োগ নির্দেশিকা:' : 'Executive Summary & Field Guide:'}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.6, color: '#475569' }}>
                  {lang === 'bn' ? activeFileModal.summaryBn : activeFileModal.summaryEn}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                কৃষি তথ্য সার্ভিস (এআইএস) • গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
              </span>
              <button
                onClick={() => setActiveFileModal(null)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

