import { Metadata } from 'next';
import BmdLiveSection from '@/components/BmdLiveSection';

export const metadata: Metadata = {
  title: 'BMD Live Weather Forecast | server6.bmd.gov.bd',
  description: 'Real-time daily weather conditions, sunrise/sunset, diurnal humidity, and next-day forecast intelligence from Bangladesh Meteorological Department (server6.bmd.gov.bd).'
};

export default function BmdLivePage() {
  return <BmdLiveSection />;
}

