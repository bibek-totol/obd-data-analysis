'use client';

import React, { useState } from 'react';
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
  Sprout
} from 'lucide-react';

export type ActiveSection = 'forecast' | 'advisory' | 'bmd-forecast' | 'bamis-bulletin';

interface WebsiteItem {
  id: string;
  name: string;
  domain: string;
  active: boolean;
  themeColor: string;
  subsections: {
    id: ActiveSection;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }[];
}

interface SidebarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  activeSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
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
          label: 'Weather Forecast',
          icon: CloudSun,
          badge: 'Live'
        },
        {
          id: 'advisory',
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

  return (
    <aside style={{
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
    }}>
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
        {/* Section Label */}
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

        {/* Websites List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {websites.map(site => {
            const isExpanded = !!expandedSites[site.id];
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
                  onClick={() => !isCollapsed && toggleSite(site.id)}
                  title={site.name}
                  style={{
                    padding: isCollapsed ? '12px 6px' : '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    cursor: isCollapsed ? 'default' : 'pointer',
                    backgroundColor: site.active ? '#f0fdf4' : '#ffffff',
                    borderBottom: !isCollapsed && isExpanded ? '1px solid #e2e8f0' : 'none'
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
                      fontSize: '12px',
                      flexShrink: 0
                    }}>
                      <Globe size={18} />
                    </div>

                    {!isCollapsed && (
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}>
                          {site.name}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}>
                          {site.domain}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div style={{ color: '#64748b' }}>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  )}
                </div>

                {/* Subsections: Forecast & Advisory */}
                {(!isCollapsed && isExpanded) && (
                  <div style={{
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    backgroundColor: '#ffffff'
                  }}>
                    {site.subsections.map(sub => {
                      const Icon = sub.icon;
                      const isSelected = site.active && activeSection === sub.id;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            if (site.active) {
                              onSelectSection(sub.id);
                            }
                          }}
                          id={`nav-${site.id}-${sub.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            backgroundColor: isSelected ? site.themeColor : 'transparent',
                            color: isSelected ? '#ffffff' : '#334155',
                            fontWeight: isSelected ? 600 : 500,
                            fontSize: '13px',
                            transition: 'all 0.15s ease',
                            textAlign: 'left',
                            width: '100%',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = '#f1f5f9';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                            <Icon size={16} />
                            <span>{sub.label}</span>
                          </div>

                          {sub.badge && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '10px',
                              backgroundColor: isSelected
                                ? 'rgba(255,255,255,0.25)'
                                : sub.badge === 'Live'
                                ? '#dcfce7'
                                : '#f1f5f9',
                              color: isSelected
                                ? '#ffffff'
                                : sub.badge === 'Live'
                                ? '#15803d'
                                : '#64748b'
                            }}>
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div style={{
        padding: isCollapsed ? '16px 8px' : '16px',
        borderTop: '1px solid #f1f5f9',
        backgroundColor: '#fafafa'
      }}>
        {!isCollapsed ? (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px'
            }}>
              <ShieldCheck size={16} color="#006a4e" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
                DLS Verification Engine
              </span>
            </div>
            <p style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.4 }}>
              Autonomous meteorological & livestock advisory scraping sync active.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ShieldCheck size={18} color="#006a4e" />
          </div>
        )}
      </div>
    </aside>
  );
}
