import { NextRequest, NextResponse } from 'next/server';
import { fetchBmdLiveWarningsData } from '@/lib/bmd-live-warnings-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceReload = searchParams.get('reload') === 'true' || searchParams.get('reload') === '1';

    const data = await fetchBmdLiveWarningsData(forceReload);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': forceReload
          ? 'no-store, no-cache, must-revalidate'
          : 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('[API /api/bmd-live/warnings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BMD Live Warnings data' },
      { status: 500 }
    );
  }
}

