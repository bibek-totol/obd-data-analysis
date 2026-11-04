import { Metadata } from 'next';
import BmdLiveOutlookSection from '@/components/BmdLiveOutlookSection';

export const metadata: Metadata = {
  title: 'BMD Live Three-Month Climate Outlook | server6.bmd.gov.bd',
  description: 'Long-range seasonal climate forecast, division-wise rainfall expectations, cyclone outlook, and winter cold wave advisories from Bangladesh Meteorological Department (server6.bmd.gov.bd).'
};

export default function BmdLiveOutlookPage() {
  return <BmdLiveOutlookSection />;
}

