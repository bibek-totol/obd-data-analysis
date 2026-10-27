import { NextRequest, NextResponse } from 'next/server';
import { fetchBamisBulletin } from '@/lib/bamis-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const districtId = searchParams.get('districtId') || '57';
  const lang = (searchParams.get('lang') === 'en' ? 'en' : 'bn') as 'bn' | 'en';
  const forceReload = searchParams.get('forceReload') === 'true' || searchParams.get('reload') === '1';

  try {
    const data = await fetchBamisBulletin(districtId, lang, forceReload);
    return NextResponse.json({
      status: 'success',
      data
    });
  } catch (error: any) {
    console.error(`Error in /api/bamis/bulletin for district ${districtId}:`, error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to fetch BAMIS agromet bulletin'
      },
      { status: 500 }
    );
  }
}
