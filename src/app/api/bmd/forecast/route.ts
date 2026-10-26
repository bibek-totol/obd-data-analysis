import { NextRequest, NextResponse } from 'next/server';
import { fetchBmdForecastData } from '@/lib/bmd-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const upazilaCode = searchParams.get('upazilaCode') || '302602';
    const lang = (searchParams.get('lang') || 'bn') as 'en' | 'bn';
    const forceReload = searchParams.get('reload') === 'true';

    const data = await fetchBmdForecastData(upazilaCode, lang, forceReload);

    return NextResponse.json(
      {
        success: true,
        data
      },
      {
        headers: {
          'Cache-Control': forceReload ? 'no-store, no-cache' : 'public, max-age=300, stale-while-revalidate=600'
        }
      }
    );
  } catch (error) {
    console.error('API Error in /api/bmd/forecast:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch BMD forecast data'
      },
      { status: 500 }
    );
  }
}
