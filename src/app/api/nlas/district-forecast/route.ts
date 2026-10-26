import { NextRequest, NextResponse } from 'next/server';
import { fetchDistrictWeatherForecast } from '@/lib/district-forecast';



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const districtCode = searchParams.get('districtCode') || '3026';
    const forceReload = searchParams.get('reload') === 'true';

    const data = await fetchDistrictWeatherForecast(districtCode, forceReload);

    return NextResponse.json({
      success: true,
      data
    }, {
      headers: {
        'Cache-Control': forceReload ? 'no-store, no-cache' : 'public, max-age=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('API Error in /api/nlas/district-forecast:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch district forecast data' 
      },
      { status: 500 }
    );
  }
}
