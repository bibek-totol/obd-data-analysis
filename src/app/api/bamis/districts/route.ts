import { NextResponse } from 'next/server';
import { BAMIS_DISTRICTS } from '@/lib/bamis-client';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    count: BAMIS_DISTRICTS.length,
    districts: BAMIS_DISTRICTS
  });
}
