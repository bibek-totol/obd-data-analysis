'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  ExternalLink,
  Layers,
  CloudRain,
  Radio,
  FileText,
  Waves,
  ShieldAlert,
  Sprout,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';

interface RouteItem {
  path: string;
  type: 'page' | 'dynamic' | 'redirect' | 'api';
  badge: string;
  badgeBg: string;
  badgeColor: string;
  title: string;
  description: string;
  component: string;
  cacheTTL: string;
}

interface PortalGroup {
  id: string;
  name: string;
  domain: string;
  color: string;
  routes: RouteItem[];
}

const PORTALS: PortalGroup[] = [
  {
    id: 'nlas',
    name: '1. NLS Portal (NLAS)',
    domain: 'nlas.dls.gov.bd',
    color: '#006a4e',
    routes: [
      {
        path: '/forecast',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'District All-Upazilas Weather Forecast',
        description: 'District all-upazilas grid with KPI banner, 5-way sorting, real-time search, cards grid with 5-day mini outlook strip, and comparison table.',
        component: 'src/app/forecast/page.tsx',
        cacheTTL: '15 Min SWR'
      },
      {
        path: '/forecast/[upazilaCode]',
        type: 'dynamic',
        badge: 'Dynamic Route',
        badgeBg: '#e0e7ff',
        badgeColor: '#4338ca',
        title: 'Single Upazila Deep Inspection & Spline Charts',
        description: 'Hero observation card with wind compass, 5–6 day outlook cards, and 3 high-precision SVG spline charts (Temp/Cloud, Rain/RH, Wind).',
        component: 'src/app/forecast/[upazilaCode]/page.tsx',
        cacheTTL: '15 Min SWR'
      },
      {
        path: '/advisory',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'Regional Livestock & Poultry Advisory',
        description: '7 Agro-ecological zones, 12-month dual-axis climatology graph, and bilingual cattle, sheep, goat, and poultry bulletins with copy & print.',
        component: 'src/app/advisory/page.tsx',
        cacheTTL: 'Real-Time'
      },
      {
        path: '/weather-alert',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'Weather Alert Counters & THI Discomfort',
        description: 'National counters and district/upazila warning grids for Rain, Wind, Heat Wave, Cold Wave, and THI Discomfort (Ruminants, Broilers, Layers).',
        component: 'src/app/weather-alert/page.tsx',
        cacheTTL: '15 Min SWR'
      },
      {
        path: '/flood-magnitude',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'Flood Magnitude & River Stage Safety',
        description: 'River water level intelligence from FFWC/BWDB across 150+ stations with Danger Level thresholds and safety advisories.',
        component: 'src/app/flood-magnitude/page.tsx',
        cacheTTL: '15 Min SWR'
      }
    ]
  },
  {
    id: 'bmd',
    name: '2. BMD USF Portal',
    domain: 'usf.bmd.gov.bd',
    color: '#0284c7',
    routes: [
      {
        path: '/bmd',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'BMD District All-Upazilas Weather Telemetry',
        description: 'Bilingual (en/bn) dashboard with in-card tab switcher between 5-8 Day Apple-style rows and 3-Hourly timeline with horizontal scroll track.',
        component: 'src/app/bmd/page.tsx',
        cacheTTL: '15 Min SWR'
      },
      {
        path: '/bmd/[upazilaCode]',
        type: 'dynamic',
        badge: 'Dynamic Route',
        badgeBg: '#e0e7ff',
        badgeColor: '#4338ca',
        title: 'BMD Single Station Deep Telemetry & Charts',
        description: 'Hero Card with Heat Index, 8-day forecast grid, 360° rotating compass, and 3 SVG spline charts for 24 steps (72 hours).',
        component: 'src/app/bmd/[upazilaCode]/page.tsx',
        cacheTTL: '15 Min SWR'
      }
    ]
  },
  {
    id: 'bamis',
    name: '3. BAMIS Agromet Portal',
    domain: 'bamis.gov.bd',
    color: '#059669',
    routes: [
      {
        path: '/bamis',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'All 64 Zillas Agromet Overview',
        description: 'National KPI telemetry cards, 8 division filter pills with count badges, 5-way sorting, and cards with rain outlook and crop advisories.',
        component: 'src/app/bamis/page.tsx',
        cacheTTL: '20 Min SWR'
      },
      {
        path: '/bamis/[districtId]',
        type: 'dynamic',
        badge: 'Dynamic Route',
        badgeBg: '#e0e7ff',
        badgeColor: '#4338ca',
        title: 'Single District Agromet Bulletin',
        description: 'Sub-tabs for Past 4 Days Observed and Next 5 Days Forecast tables, and 8 crop-specific advisory cards with copy & print.',
        component: 'src/app/bamis/[districtId]/page.tsx',
        cacheTTL: '15 Min SWR'
      },
      {
        path: '/bamis/national',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'National Agromet Bulletin (Executive)',
        description: 'Dekad validity, 5-day quantitative forecast for 8 parameters across all 64 districts, and 10 agricultural sector advisories.',
        component: 'src/app/bamis/national/page.tsx',
        cacheTTL: '15 Min SWR'
      }
    ]
  },
  {
    id: 'ffwc',
    name: '4. FFWC Flood Intelligence',
    domain: 'ffwc.gov.bd',
    color: '#0d9488',
    routes: [
      {
        path: '/ffwc',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'Flood Alert & Magnitude',
        description: 'Real-time flood status across 153 hydrological stations in 4 major river basins with severity badges and rising/falling trend arrows.',
        component: 'src/app/ffwc/page.tsx',
        cacheTTL: '15 Min SWR'
      },
      {
        path: '/ffwc/hydrograph',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'Hydrograph & River Stages',
        description: 'Station and river search, river filter, district filter, Short Range / Medium Range / Monsoon forecast selector.',
        component: 'src/app/ffwc/hydrograph/page.tsx',
        cacheTTL: '15 Min SWR'
      },
      {
        path: '/ffwc/observed-water-level',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'Observed River Water Level & 40-Day History',
        description: 'Danger level comparison vs current water level. Interactive modal popup displaying 40-day historical water level trends.',
        component: 'src/app/ffwc/observed-water-level/page.tsx',
        cacheTTL: '15 Min SWR'
      },
      {
        path: '/ffwc/forecast-maps',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'Forecast Trends & Hydrological Maps',
        description: '10-day medium range flood forecast, Rainfall Map, Rainfall Distribution Map, and Inundation Flood Map intelligence.',
        component: 'src/app/ffwc/forecast-maps/page.tsx',
        cacheTTL: '15 Min SWR'
      }
    ]
  },
  {
    id: 'server6',
    name: '5. BMD Live Portal',
    domain: 'server6.bmd.gov.bd',
    color: '#7c3aed',
    routes: [
      {
        path: '/bmd-live/warnings',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'Severe Weather Warnings (SWC)',
        description: '8 official warning categories from Storm Warning Centre: Marine, Inland Riverport, Heavy Rain, Lightning, Kalbaishakhi, Heatwave, Fog, and Special Bulletins.',
        component: 'src/app/bmd-live/warnings/page.tsx',
        cacheTTL: '15 Min SWR'
      },
      {
        path: '/bmd-live/outlook',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'Three-Month Seasonal Outlook',
        description: 'Comprehensive 3-month seasonal forecast. Division-wise precipitation and temperature anomalies with agricultural advisories.',
        component: 'src/app/bmd-live/outlook/page.tsx',
        cacheTTL: '15 Min SWR'
      }
    ]
  },
  {
    id: 'ais',
    name: '6. AIS Agriculture Portal',
    domain: 'ais.gov.bd',
    color: '#16a34a',
    routes: [
      {
        path: '/ais',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'Monthly Agriculture Advisory (এ মাসের কৃষি)',
        description: 'Current month directives across 7 crop sectors. Phenological stage badges, numbered actions, and one-click copy.',
        component: 'src/app/ais/page.tsx',
        cacheTTL: '15 Min SWR'
      },
      {
        path: '/ais/special-advisory',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'Special Advisories & Agricultural Files',
        description: '7 downloadable & readable agricultural publications. Category filter pills, Cards Grid vs Table views, and in-app document reader modal.',
        component: 'src/app/ais/special-advisory/page.tsx',
        cacheTTL: '15 Min SWR'
      },
      {
        path: '/ais/crop-technology',
        type: 'page',
        badge: 'Live View',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        title: 'Crop Production Technology & Boro Seedbed',
        description: 'Complete 5-step Boro seedbed preparation technology guide, seed treatment protocols, cold injury prevention, and variety matrix table.',
        component: 'src/app/ais/crop-technology/page.tsx',
        cacheTTL: '15 Min SWR'
      }
    ]
  }
];

export default function VisualSitemapPage() {
  const [search, setSearch] = useState('');
  const [selectedPortal, setSelectedPortal] = useState<string>('all');

  const filteredPortals = PORTALS.filter(portal => {
    if (selectedPortal !== 'all' && portal.id !== selectedPortal) return false;
    if (!search) return true;
    const query = search.toLowerCase();
    const matchPortal = portal.name.toLowerCase().includes(query) || portal.domain.toLowerCase().includes(query);
    const matchRoutes = portal.routes.some(r =>
      r.path.toLowerCase().includes(query) ||
      r.title.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query)
    );
    return matchPortal || matchRoutes;
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px 60px' }}>
      {/* Header Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
            Active Architecture
          </span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>6 Integrated Portals • 45+ Page Routes</span>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
          NLAS Intelligence Platform — Visual Interactive Sitemap
        </h1>
        <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
          Interactive map of all routes, dynamic deep-inspection pages, components, and upstream data endpoints.
        </p>

        {/* Filter Controls */}
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '420px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search route (e.g. forecast, upazila, bmd, alert, hydrograph, bamis, ais)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#f8fafc'
              }}
            />
          </div>

          {/* Portal Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedPortal('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedPortal === 'all' ? '#0f172a' : '#f1f5f9',
                color: selectedPortal === 'all' ? '#ffffff' : '#475569'
              }}
            >
              All Portals (6)
            </button>
            {PORTALS.map(portal => (
              <button
                key={portal.id}
                onClick={() => setSelectedPortal(portal.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedPortal === portal.id ? portal.color : '#f1f5f9',
                  color: selectedPortal === portal.id ? '#ffffff' : '#475569'
                }}
              >
                {portal.name.split('.')[1]?.trim() || portal.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Root Entry Card */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '28px'
      }}>
        <div style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '14px',
          padding: '16px 28px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          maxWidth: '420px',
          width: '100%'
        }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 700 }}>
            Application Entry Root
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, margin: '4px 0' }}>
            / (Root URL)
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            Automatic Redirect ➔ <code style={{ backgroundColor: '#1e293b', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px' }}>/forecast</code>
          </div>
        </div>
      </div>

      {/* Portals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredPortals.map(portal => (
          <div
            key={portal.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              {/* Portal Header */}
              <div style={{
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: portal.color, margin: 0 }}>
                    {portal.name}
                  </h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{portal.domain}</span>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  color: '#475569'
                }}>
                  {portal.routes.length} Routes
                </span>
              </div>

              {/* Routes List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {portal.routes.map((route, rIdx) => {
                  const isDynamic = route.type === 'dynamic';
                  const targetHref = isDynamic
                    ? (route.path.includes('upazilaCode') ? route.path.replace('[upazilaCode]', '302602') : route.path.replace('[districtId]', '37'))
                    : route.path;

                  return (
                    <div
                      key={rIdx}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                        backgroundColor: '#f8fafc',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <code style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                          {route.path}
                        </code>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: route.badgeBg,
                          color: route.badgeColor,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {route.badge}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                        {route.title}
                      </div>

                      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px', lineHeight: '1.4' }}>
                        {route.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '11px' }}>
                        <span style={{ color: '#94a3b8' }}>
                          Cache: <strong style={{ color: '#475569' }}>{route.cacheTTL}</strong>
                        </span>

                        <Link
                          href={targetHref}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: portal.color,
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          <span>{isDynamic ? 'Inspect Sample' : 'Visit Route'}</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Component File Footnote */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f8fafc', fontSize: '11px', color: '#94a3b8' }}>
              Primary Client Library: <code style={{ color: '#64748b' }}>src/lib/{portal.id}-client.ts</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

