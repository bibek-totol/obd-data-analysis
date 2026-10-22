'use client';

import React from 'react';
import { Calendar, MapPin, Droplets, Wind, Moon, Sun, CloudRain, Thermometer } from 'lucide-react';
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

          {/* Stats Badges: Humidity, Temperature, Wind Speed */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap'
          }}>
            {/* Relative Humidity */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '8px 16px'
            }}>
              <Droplets size={18} color="#38bdf8" />
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Relative Humidity
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                  {current.rh} %
                </div>
              </div>
            </div>

            {/* Temperature */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '8px 16px'
            }}>
              <Thermometer size={18} color="#f87171" />
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Temperature
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                  {Math.round(current.temperature)} °C
                </div>
              </div>
            </div>

            {/* Wind Speed */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '8px 16px'
            }}>
              <Wind size={18} color="#a7f3d0" />
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Wind Speed
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                  {current.wind_speed} km/h {current.wind_direction}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Condition & Data Source */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          textAlign: 'right'
        }}>
          {/* Condition & Sun/Cloud Icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {current.condition_image ? (
                <img src={current.condition_image} alt={current.condition_name} style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
              ) : current.is_day ? (
                <Sun size={48} color="#fbbf24" />
              ) : (
                <Moon size={42} color="#e2e8f0" />
              )}
            </div>
            <div>
              <div style={{
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#ffffff'
              }}>
                {current.condition_name}
              </div>
            </div>
          </div>

          {/* Data Source attribution */}
          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            fontFamily: "'Fira Code', monospace"
          }}>
            Data source: {data.source} | {data.updated_at}
          </div>
        </div>
      </div>
    </div>
  );
}
