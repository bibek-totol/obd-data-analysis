import { NextRequest, NextResponse } from 'next/server';
import { getAisCombinedData } from '@/lib/ais-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceReload = searchParams.get('reload') === 'true' || searchParams.get('reload') === '1';
    const type = searchParams.get('type') || 'all';

    const data = await getAisCombinedData(forceReload);

    if (type === 'monthly') {
      return NextResponse.json(data.monthlyAdvisory, {
        status: 200,
        headers: {
          'Cache-Control': forceReload
            ? 'no-store, no-cache, must-revalidate'
            : 'public, s-maxage=300, stale-while-revalidate=600'
        }
      });
    }

    if (type === 'special') {
      return NextResponse.json(data.specialAdvisories, {
        status: 200,
        headers: {
          'Cache-Control': forceReload
            ? 'no-store, no-cache, must-revalidate'
            : 'public, s-maxage=300, stale-while-revalidate=600'
        }
      });
    }

    if (type === 'technology') {
      return NextResponse.json(data.cropTechnology, {
        status: 200,
        headers: {
          'Cache-Control': forceReload
            ? 'no-store, no-cache, must-revalidate'
            : 'public, s-maxage=300, stale-while-revalidate=600'
        }
      });
    }

    // Default: return all combined AIS intelligence
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': forceReload
          ? 'no-store, no-cache, must-revalidate'
          : 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('[API /api/ais] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AIS data' },
      { status: 500 }
    );
  }
}

