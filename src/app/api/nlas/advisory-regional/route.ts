import { NextRequest, NextResponse } from 'next/server';
import { fetchRegionalAdvisory } from '@/lib/regional-advisory';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const regionCode = parseInt(searchParams.get('regionCode') || '1', 10);
  const lang = (searchParams.get('lang') === 'bn' ? 'bn' : 'en') as 'en' | 'bn';
  const monthParam = searchParams.get('month');
  const month = monthParam ? parseInt(monthParam, 10) : undefined;
  const forceReload = searchParams.get('reload') === 'true';

  try {
    const data = await fetchRegionalAdvisory(regionCode, lang, month, forceReload);
    return NextResponse.json({
      success: true,
      data
    }, {
      headers: {
        'Cache-Control': forceReload ? 'no-store, no-cache' : 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('API Error in /api/nlas/advisory-regional:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
