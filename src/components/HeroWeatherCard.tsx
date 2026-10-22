'use client';

import React from 'react';
import { Calendar, MapPin, Droplets, Wind, Moon, Sun, CloudRain } from 'lucide-react';
import { ForecastResponseData } from '@/lib/nlas-client';

interface HeroWeatherCardProps {
  data: ForecastResponseData;
  locationSelectorSlot?: React.ReactNode;
}

export default function HeroWeatherCard({
  data,
  locationSelectorSlot
}: HeroWeatherCardProps) {
  const current = data.current;
  const location = data.location;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #29384d 50%, #1a332d 100%)',
      borderRadius: '14px',
      padding: '24px 28px',
      color: '#ffffff',
      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '20px'
    }}>
      {/* Background Subtle Glow Accent */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '240px',
        height: '240px',
        background: 'radial-gradient(circle, rgba(32, 201, 151, 0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Top Row: Location Selectors */}
      {locationSelectorSlot && (
        <div style={{ marginBottom: '20px' }}>
          {locationSelectorSlot}
        </div>
      )}

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* Left: Date, Location & Humidity */}
        <div>
          {/* Date */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '18px',
            fontWeight: 700,
            color: '#f8fafc',
            marginBottom: '8px'
          }}>
            <Calendar size={20} color="#38bdf8" />
            <span>{current.date_formatted}</span>
          </div>

          {/* Location */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#cbd5e1',
            marginBottom: '24px'
          }}>
            <MapPin size={18} color="#34d399" />
            <span>
              {location.upazila_name}, {location.district_name}, {location.division_name} Division
            </span>
          </div>

          {/* Humidity Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '10px 18px'
          }}>
            <Droplets size={22} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Relative Humidity
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                {current.rh} %
              </div>
            </div>
          </div>
        </div>

        {/* Right: Condition, Wind Speed, Data Source */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          textAlign: 'right'
        }}>
          {/* Condition & Moon/Sun Icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {current.is_day ? (
                <Sun size={42} color="#fbbf24" />
              ) : (
                <Moon size={38} color="#e2e8f0" />
              )}
            </div>
            <div>
              <div style={{
                fontSize: '26px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#ffffff'
              }}>
                {current.condition_name}
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                {current.temperature}°C (High: {current.temp_max}° / Low: {current.temp_min}°)
              </div>
            </div>
          </div>

          {/* Wind Speed & Direction */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '8px 16px',
            marginBottom: '16px'
          }}>
            <Wind size={18} color="#a7f3d0" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
              Wind Speed: {current.wind_speed} km/h {current.wind_direction}
            </span>
          </div>

          {/* Data Source attribution */}
          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            fontFamily: 'monospace'
          }}>
            Data source: {data.source} | {data.updated_at}
          </div>
        </div>
      </div>
    </div>
  );
}
