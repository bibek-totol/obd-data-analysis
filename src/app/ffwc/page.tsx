import { Metadata } from 'next';
import FfwcSection from '@/components/FfwcSection';

export const metadata: Metadata = {
  title: 'Flood Alert & Magnitude | FFWC Portal (BWDB) | ffwc.gov.bd',
  description: 'Official flood alerts, 7-day alert matrix, district danger level warnings, and Farmer OBD status from Flood Forecasting & Warning Centre (FFWC / BWDB).'
};

export default function FfwcPage() {
  return <FfwcSection initialTab="alerts" />;
}

