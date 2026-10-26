import { NextRequest, NextResponse } from 'next/server';
import { fetchBmdUpazilas } from '@/lib/bmd-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const districtCode = searchParams.get('districtCode') || '3026';
    const lang = (searchParams.get('lang') || 'bn') as 'en' | 'bn';

    const upazilas = await fetchBmdUpazilas(districtCode, lang);

    return NextResponse.json(
      {
        success: true,
        districtCode,
        lang,
        upazilas
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
      }
    );
  } catch (error) {
    console.error('API Error in /api/bmd/upazilas:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch upazilas'
      },
      { status: 500 }
    );
  }
}
