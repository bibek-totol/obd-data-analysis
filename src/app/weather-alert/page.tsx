import React from 'react';
import WeatherAlertSection from '@/components/WeatherAlertSection';

export const metadata = {
  title: 'Weather Alert & Stress Intelligence | NLAS Bangladesh',
  description: 'National Livestock Advisory System (NLAS) weather alert and livestock stress intelligence portal.'
};

export default function WeatherAlertPage() {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      <WeatherAlertSection />
    </div>
  );
}

