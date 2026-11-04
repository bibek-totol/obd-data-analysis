import { Metadata } from 'next';
import FfwcSection from '@/components/FfwcSection';

export const metadata: Metadata = {
  title: 'Hydrograph & River Stages | FFWC Portal (BWDB) | ffwc.gov.bd',
  description: 'Interactive river hydrographs, Danger Level (DL) vs Recorded Highest Water Level (RHWL), short-range (5-day), medium-range (10-day), and monsoon river forecasts across Bangladesh.'
};

export default function FfwcHydrographPage() {
  return <FfwcSection initialTab="hydrograph" />;
}

