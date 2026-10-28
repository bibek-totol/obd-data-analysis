'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe,
  CloudSun,
  FileText,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Compass,
  Sprout,
  X
} from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';

export type ActiveSection = 'forecast' | 'advisory' | 'bmd-forecast' | 'bamis-bulletin';

interface WebsiteItem {
  id: string;
  name: string;
  domain: string;
  active: boolean;
  themeColor: string;
  subsections: {
    id: ActiveSection;
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }[];
}

interface SidebarProps {
  activeSection?: ActiveSection;
  onSelectSection?: (section: ActiveSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  activeSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const pathname = usePathname() || '/';
  const { isMobileDrawerOpen, closeMobileDrawer } = useDashboard();

  // Automatically determine active section from route
  let effectiveActiveSection: ActiveSection = activeSection || 'forecast';
  if (pathname.startsWith('/advisory')) {
    effectiveActiveSection = 'advisory';
  } else if (pathname.startsWith('/bmd')) {
    effectiveActiveSection = 'bmd-forecast';
  } else if (pathname.startsWith('/bamis')) {
    effectiveActiveSection = 'bamis-bulletin';
  } else if (pathname.startsWith('/forecast')) {
    effectiveActiveSection = 'forecast';
  }

  const [websites] = useState<WebsiteItem[]>([
    {
      id: 'nlas',
      name: 'NLS Portal (NLAS)',
      domain: 'nlas.dls.gov.bd',
      active: true,
      themeColor: '#006a4e',
      subsections: [
        {
          id: 'forecast',
          href: '/forecast',
          label: 'Weather Forecast',
          icon: CloudSun,
          badge: 'Live'
        },
        {
          id: 'advisory',
          href: '/advisory',
          label: 'Advisory Section',
          icon: FileText,
          badge: 'Live'
        }
      ]
    },
    {
      id: 'bmd',
      name: 'BMD Portal (USF)',
      domain: 'usf.bmd.gov.bd',
      active: true,
      themeColor: '#0369a1',
      subsections: [
        {
          id: 'bmd-forecast',
          href: '/bmd',
          label: 'Upazila Weather Forecast',
          icon: Compass,
          badge: 'Live'
        }
      ]
    },
    {
      id: 'bamis',
      name: 'BAMIS Portal (DAE)',
      domain: 'bamis.gov.bd',
      active: true,
      themeColor: '#0c713e',
      subsections: [
        {
          id: 'bamis-bulletin',
          href: '/bamis',
          label: 'District Agromet Bulletin',
          icon: Sprout,
          badge: 'Live'
        }
      ]
    }
  ]);

  const [expandedSites, setExpandedSites] = useState<Record<string, boolean>>({
    nlas: true,
    bmd: true,
    bamis: true
  });

  const toggleSite = (siteId: string) => {
    setExpandedSites(prev => ({ ...prev, [siteId]: !prev[siteId] }));
  };

  // Helper to render navigation items list
  const renderWebsiteItems = (isDrawer = false) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {websites.map(site => {
          const isExpanded = isDrawer ? true : !!expandedSites[site.id];
          return (
            <div
              key={site.id}
              style={{
                backgroundColor: site.active ? '#f8fafc' : '#ffffff',
                border: site.active ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Website Header */}
              <div
                onClick={() => (!isCollapsed || isDrawer) && toggleSite(site.id)}
                title={site.name}
                style={{
                  padding: (!isDrawer && isCollapsed) ? '12px 6px' : '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: (!isDrawer && isCollapsed) ? 'center' : 'space-between',
                  cursor: (!isDrawer && isCollapsed) ? 'default' : 'pointer',
                  backgroundColor: site.active ? '#f0fdf4' : '#ffffff',
                  borderBottom: (isDrawer || !isCollapsed) && isExpanded ? '1px solid #e2e8f0' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: site.active ? site.themeColor : '#64748b',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '11px',
                    flexShrink: 0
                  }}>
                    {site.id.toUpperCase()}
                  </div>
                  {(isDrawer || !isCollapsed) && (
                    <div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#0f172a',
                        lineHeight: 1.2
                      }}>
                        {site.name}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: '#64748b',
                        fontWeight: 500
                      }}>
                        {site.domain}
                      </div>
                    </div>
                  )}
                </div>

                {(isDrawer || !isCollapsed) && (
                  <div style={{ color: '#94a3b8' }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                )}
              </div>

              {/* Subsections List */}
              {(isDrawer || (!isCollapsed && isExpanded)) && (
                <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {site.subsections.map(sub => {
                    const isSelected = effectiveActiveSection === sub.id;
                    const Icon = sub.icon;

                    return (
                      <Link
                        key={sub.id}
                        href={sub.href}
                        onClick={() => {
                          if (isDrawer) {
                            closeMobileDrawer();
                          }
                          if (onSelectSection) {
                            onSelectSection(sub.id);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#ffffff' : 'transparent',
                          border: isSelected ? '1px solid #86efac' : '1px solid transparent',
                          boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                          color: isSelected ? '#006a4e' : '#475569',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '12.5px',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Icon size={16} className={isSelected ? 'text-primary' : ''} />
                          <span>{sub.label}</span>
                        </div>
                        {sub.badge && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '10px',
                            backgroundColor: isSelected ? '#dcfce7' : '#f1f5f9',
                            color: isSelected ? '#15803d' : '#64748b'
                          }}>
                            {sub.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* ========================================================
          1. DESKTOP / LAPTOP SIDEBAR (>= 1024px)
          Inline, collapsible between 280px and 68px
         ======================================================== */}
      <aside
        className="desktop-sidebar-wrapper"
        style={{
          width: isCollapsed ? '68px' : '280px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          minHeight: 'calc(100vh - 65px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          zIndex: 30,
          flexShrink: 0
        }}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          id="btn-sidebar-toggle"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            position: 'absolute',
            right: '-14px',
            top: '20px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#475569',
            zIndex: 40,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#006a4e';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#006a4e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#475569';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
        >
          {isCollapsed ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
        </button>

        {/* Top Section: Navigation & Website List */}
        <div style={{ padding: isCollapsed ? '16px 8px' : '20px 16px' }}>
          {!isCollapsed ? (
            <div style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#94a3b8',
              fontWeight: 700,
              marginBottom: '14px',
              paddingLeft: '6px'
            }}>
              Integrated Websites
            </div>
          ) : (
            <div style={{ height: '14px' }} />
          )}

          {renderWebsiteItems(false)}
        </div>

        {/* Bottom Footer Info */}
        <div style={{
          padding: isCollapsed ? '16px 8px' : '16px',
          borderTop: '1px solid #f1f5f9',
          backgroundColor: '#fafafa'
        }}>
          {!isCollapsed ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                  NLS & Multi-Portal Live Hub
                </span>
              </div>
              <div style={{
                fontSize: '10px',
                color: '#64748b',
                lineHeight: 1.4,
                backgroundColor: '#f1f5f9',
                padding: '8px',
                borderRadius: '6px'
              }}>
                Integrated telemetry feed from DLS, BMD & DAE Bangladesh.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981'
              }} />
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================
          2. MOBILE & TABLET SLIDING DRAWER (< 1024px)
          Overlay with Backdrop, Header & Touch Navigation
         ======================================================== */}
      {/* Backdrop */}
      <div
        className="mobile-drawer-backdrop"
        onClick={closeMobileDrawer}
        style={{
          opacity: isMobileDrawerOpen ? 1 : 0,
          pointerEvents: isMobileDrawerOpen ? 'auto' : 'none'
        }}
      />

      {/* Drawer Panel */}
      <div
        className="mobile-drawer-panel"
        style={{
          transform: isMobileDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          pointerEvents: isMobileDrawerOpen ? 'auto' : 'none'
        }}
      >
        {/* Drawer Header with Title & Close Button */}
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #006a4e 0%, #004d37 100%)',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '13px'
            }}>
              BD
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                National Portals
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                Govt. of Bangladesh
              </div>
            </div>
          </div>

          <button
            onClick={closeMobileDrawer}
            aria-label="Close navigation drawer"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{
          padding: '16px 14px',
          flex: 1,
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#94a3b8',
            fontWeight: 700,
            marginBottom: '12px',
            paddingLeft: '4px'
          }}>
            Integrated Portals
          </div>
          {renderWebsiteItems(true)}
        </div>

        {/* Drawer Footer */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#fafafa',
          fontSize: '11px',
          color: '#64748b'
        }}>
          DLS • BMD • DAE Meteorological Intelligence
        </div>
      </div>
    </>
  );
}
