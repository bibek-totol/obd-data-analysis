import { NextRequest, NextResponse } from 'next/server';
import { fetchAllBamisDistricts } from '@/lib/bamis-all-districts';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lang = (searchParams.get('lang') === 'en' ? 'en' : 'bn') as 'bn' | 'en';
  const forceReload = searchParams.get('forceReload') === 'true' || searchParams.get('reload') === '1';

  try {
    const data = await fetchAllBamisDistricts(lang, forceReload);
    return NextResponse.json({
      status: 'success',
      data
    });
  } catch (error: any) {
    console.error('Error in /api/bamis/all-districts:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to fetch BAMIS all districts data'
      },
      { status: 500 }
    );
  }
}
