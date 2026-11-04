import { Metadata } from 'next';
import FfwcSection from '@/components/FfwcSection';

export const metadata: Metadata = {
  title: 'Forecast & Map Layers | FFWC Portal (BWDB) | ffwc.gov.bd',
  description: 'Interactive flood maps, station locations, 81-station rainfall telemetry, IDW rainfall distribution contours, inundation maps, and 10-day medium range forecasts.'
};

export default function FfwcMapsPage() {
  return <FfwcSection initialTab="maps" />;
}

