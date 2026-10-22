import { NextResponse } from 'next/server';
import { fetchDistricts } from '@/lib/nlas-client';

export async function GET() {
  try {
    const districts = await fetchDistricts();
    return NextResponse.json({
      success: true,
      districts
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('API Error in /api/nlas/districts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch districts' },
      { status: 500 }
    );
  }
}
