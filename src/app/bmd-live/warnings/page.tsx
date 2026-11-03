import { Metadata } from 'next';
import BmdLiveWarningsSection from '@/components/BmdLiveWarningsSection';

export const metadata: Metadata = {
  title: 'BMD Live Severe Weather Warnings | server6.bmd.gov.bd',
  description: 'Real-time severe weather warnings, marine storm signals, inland riverport advisories, heavy rainfall, and cyclone bulletins from Storm Warning Center (server6.bmd.gov.bd).'
};

export default function BmdLiveWarningsPage() {
  return <BmdLiveWarningsSection />;
}

