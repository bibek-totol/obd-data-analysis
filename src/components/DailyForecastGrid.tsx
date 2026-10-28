'use client';

import { Thermometer, CloudRain, Wind, Navigation, Droplets } from 'lucide-react';
import { DailyWeatherItem } from '@/lib/nlas-client';

interface DailyForecastGridProps {
  daily: DailyWeatherItem[];
}

export default function DailyForecastGrid({ daily }: DailyForecastGridProps) {
  if (!daily || daily.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <h2 style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#1e293b',
          letterSpacing: '-0.01em'
        }}>
          5-6 Day Forecast Overview
        </h2>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
          Daily aggregates from BMDWRF High Resolution Model
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
        gap: '12px'
      }}>
        {daily.map((item, index) => {
          return (
            <div
              key={item.dateRaw || index}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = '#93c5fd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              {/* Day Name */}
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '2px'
              }}>
                {item.week}
              </div>

              {/* Date */}
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748b',
                marginBottom: '14px'
              }}>
                {item.date}
              </div>

              {/* Weather Icon & Condition */}
              <div style={{
                marginBottom: '16px',
                minHeight: '74px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.cloud_condition.image}
                  alt={item.cloud_condition.name}
                  style={{
                    width: '46px',
                    height: '46px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div style={{
                  fontSize: '11px',
                  color: '#475569',
                  fontWeight: 600,
                  lineHeight: '1.2',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '140px'
                }} title={item.cloud_condition.name}>
                  {item.cloud_condition.name}
                </div>
              </div>

              {/* Metric 1: Temp Max / Min */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '10px'
              }}>
                <Thermometer size={16} color="#ef4444" />
                <span>{item.temp_max}° <span style={{ color: '#64748b', fontWeight: 500, fontSize: '12px' }}>/{item.temp_min}°C</span></span>
              </div>

              {/* Divider */}
              <div style={{ width: '80%', height: '1px', backgroundColor: '#f1f5f9', marginBottom: '10px' }} />

              {/* Metric 2: Rainfall */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '8px'
              }}>
                <CloudRain size={15} color="#0284c7" />
                <span>{item.rf}mm</span>
              </div>

              {/* Metric 3: Wind Gust (matches NLAS) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569',
                marginBottom: '8px'
              }}>
                <Navigation size={13} color="#059669" style={{ transform: 'rotate(45deg)' }} />
                <span>{item.windgust || item.windspd} km/h {item.dir_name}</span>
              </div>

              {/* Metric 4: Relative Humidity (matches NLAS 4th row) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0284c7'
              }}>
                <Droplets size={13} color="#0284c7" />
                <span>{item.rh}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
