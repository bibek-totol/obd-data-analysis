import { NextRequest, NextResponse } from 'next/server';
import { fetchFloodMagnitudeData } from '@/lib/flood-magnitude-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceReload = searchParams.get('reload') === 'true';

    const data = await fetchFloodMagnitudeData(forceReload);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('API Error in /api/nlas/flood-magnitude:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flood magnitude telemetry' },
      { status: 500 }
    );
  }
}
