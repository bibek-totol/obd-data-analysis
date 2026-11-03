import { NextRequest, NextResponse } from 'next/server';
import { fetchBmdLiveForecastData } from '@/lib/server6-bmd-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceReload = searchParams.get('reload') === 'true';

    const data = await fetchBmdLiveForecastData(forceReload);

    return NextResponse.json({
      success: true,
      data
    }, {
      headers: {
        'Cache-Control': forceReload ? 'no-store, no-cache' : 'public, max-age=180, stale-while-revalidate=360'
      }
    });
  } catch (error) {
    console.error('API Error in /api/bmd-live/forecast:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch BMD Live forecast data'
      },
      { status: 500 }
    );
  }
}

