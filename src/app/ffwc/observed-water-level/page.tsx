import { Metadata } from 'next';
import FfwcSection from '@/components/FfwcSection';

export const metadata: Metadata = {
  title: 'Observed Water Level | FFWC Portal (BWDB) | ffwc.gov.bd',
  description: 'Real-time hydrological river water level observations across 153 stations in Bangladesh with 40-day time-series history and danger level trends.'
};

export default function FfwcObservedPage() {
  return <FfwcSection initialTab="observed" />;
}

