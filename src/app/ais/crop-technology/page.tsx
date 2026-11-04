import { Metadata } from 'next';
import AisSection from '@/components/AisSection';

export const metadata: Metadata = {
  title: 'Crop Production Technology & Seedbed Guide | AIS Portal | ais.gov.bd',
  description: 'Step-by-step modern agronomic guides, Boro rice seedbed preparation, ecology-matched variety selection, harvesting technology, and pure fertilizer detection from AIS.'
};

export default function AisCropTechnologyPage() {
  return <AisSection initialTab="technology" />;
}

