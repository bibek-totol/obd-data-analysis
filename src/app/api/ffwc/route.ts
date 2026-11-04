import { NextRequest, NextResponse } from 'next/server';
import { getFfwcCombinedData, getStation40DaysWaterlevel } from '@/lib/ffwc-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceReload = searchParams.get('reload') === 'true' || searchParams.get('reload') === '1';
    const type = searchParams.get('type') || 'combined';
    const stationId = parseInt(searchParams.get('stationId') || '0', 10);

    // If requesting 40-day historical water level readings for a station
    if (type === 'observed40' && stationId > 0) {
      const records = await getStation40DaysWaterlevel(stationId, forceReload);
      return NextResponse.json(records, {
        status: 200,
        headers: {
          'Cache-Control': forceReload
            ? 'no-store, no-cache, must-revalidate'
            : 'public, s-maxage=300, stale-while-revalidate=600'
        }
      });
    }

    // Default: return combined FFWC intelligence
    const data = await getFfwcCombinedData(forceReload);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': forceReload
          ? 'no-store, no-cache, must-revalidate'
          : 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('[API /api/ffwc] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FFWC data' },
      { status: 500 }
    );
  }
}

