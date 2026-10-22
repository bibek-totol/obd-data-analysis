import { NextRequest, NextResponse } from 'next/server';
import { fetchUpazilas } from '@/lib/nlas-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const districtCode = searchParams.get('districtCode');

    if (!districtCode) {
      return NextResponse.json(
        { success: false, error: 'Missing districtCode query parameter' },
        { status: 400 }
      );
    }

    const upazilas = await fetchUpazilas(districtCode);
    return NextResponse.json({
      success: true,
      districtCode,
      upazilas
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('API Error in /api/nlas/upazilas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch upazilas' },
      { status: 500 }
    );
  }
}
