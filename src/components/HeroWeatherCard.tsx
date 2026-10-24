'use client';

import React from 'react';
import { Calendar, MapPin, Droplets, Wind, Moon, Sun, Thermometer } from 'lucide-react';
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
      background: 'linear-gradient(135deg, #0d2820 0%, #12392e 35%, #184c3e 70%, #0f3026 100%)',
      borderRadius: '16px',
      padding: '24px 28px',
      color: '#ffffff',
      boxShadow: '0 12px 30px -5px rgba(8, 38, 28, 0.4), 0 4px 10px rgba(0, 0, 0, 0.12)',
      border: '1px solid rgba(52, 211, 153, 0.2)',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '20px'
    }}>
      {/* Background Subtle Glow Accents */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '260px',
        height: '260px',
        background: 'radial-gradient(circle, rgba(52, 211, 153, 0.28) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-50px',
        left: '-30px',
        width: '220px',
        height: '220px',
        background: 'radial-gradient(circle, rgba(20, 184, 166, 0.14) 0%, transparent 65%)',
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
              backgroundColor: 'rgba(255, 255, 255, 0.09)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '8px 16px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
            }}>
              <Droplets size={18} color="#38bdf8" />
              <div>
                <div style={{ fontSize: '10px', color: '#a7f3d0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
              backgroundColor: 'rgba(255, 255, 255, 0.09)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '8px 16px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
            }}>
              <Thermometer size={18} color="#f87171" />
              <div>
                <div style={{ fontSize: '10px', color: '#a7f3d0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
              backgroundColor: 'rgba(255, 255, 255, 0.09)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '8px 16px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
            }}>
              <Wind size={18} color="#a7f3d0" />
              <div>
                <div style={{ fontSize: '10px', color: '#a7f3d0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
            color: 'rgba(203, 213, 225, 0.75)',
            fontFamily: "'Fira Code', monospace"
          }}>
            Data source: {data.source} | {data.updated_at}
          </div>
        </div>
      </div>
    </div>
  );
}
