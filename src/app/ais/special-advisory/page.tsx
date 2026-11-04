import { Metadata } from 'next';
import AisSection from '@/components/AisSection';

export const metadata: Metadata = {
  title: 'Special Advisories & Technical Files | AIS Portal | ais.gov.bd',
  description: 'Special agricultural bulletins, balanced fertilizer guidelines, cold wave protection, flood recovery, and pest control publications from AIS.'
};

export default function AisSpecialAdvisoryPage() {
  return <AisSection initialTab="special" />;
}

