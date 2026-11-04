import { Metadata } from 'next';
import AisSection from '@/components/AisSection';

export const metadata: Metadata = {
  title: 'Monthly Agriculture Advisory | AIS Portal | ais.gov.bd',
  description: 'Monthly agromet directives, seasonal crop operations, pest management, and farmer advisories from Agriculture Information Service (AIS).'
};

export default function AisMonthlyAdvisoryPage() {
  return <AisSection initialTab="monthly" />;
}

