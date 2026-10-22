import { NextRequest, NextResponse } from 'next/server';
import { fetchWeatherForecast } from '@/lib/nlas-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const upazilaCode = searchParams.get('upazilaCode') || '302602';
    const forceReload = searchParams.get('reload') === 'true';

    const data = await fetchWeatherForecast(upazilaCode, forceReload);

    return NextResponse.json({
      success: true,
      data
    }, {
      headers: {
        'Cache-Control': forceReload ? 'no-store, no-cache' : 'public, max-age=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('API Error in /api/nlas/forecast:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch forecast data' 
      },
      { status: 500 }
    );
  }
}
