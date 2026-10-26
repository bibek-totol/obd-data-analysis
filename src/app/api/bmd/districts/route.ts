import { NextResponse } from 'next/server';
import { BMD_DISTRICTS } from '@/lib/bmd-client';

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      districts: BMD_DISTRICTS
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400'
      }
    }
  );
}
