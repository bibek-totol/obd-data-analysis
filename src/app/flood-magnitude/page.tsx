import React from 'react';
import FloodMagnitudeSection from '@/components/FloodMagnitudeSection';

export const metadata = {
  title: 'River Flood Magnitude & Water Level Intelligence | NLAS & FFWC Bangladesh',
  description: 'National river water levels, danger level thresholds, and flood magnitude intelligence from FFWC and DLS Bangladesh.'
};

export default function FloodMagnitudePage() {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      <FloodMagnitudeSection />
    </div>
  );
}

