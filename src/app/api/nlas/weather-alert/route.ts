import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAlertCounts,
  fetchDistrictAlerts,
  fetchUpazilaAlerts,
  WeatherAlertParamId
} from '@/lib/weather-alert-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'counts' | 'districts' | 'upazilas' | 'all'
    const parameter = (Number(searchParams.get('parameter')) || 10) as WeatherAlertParamId;
    const fdate = searchParams.get('fdate') || undefined;
    const districtId = searchParams.get('districtId') || '';
    const forceReload = searchParams.get('reload') === 'true';

    if (type === 'counts') {
      const counts = await fetchAlertCounts(forceReload);
      return NextResponse.json({ success: true, data: counts });
    }

    if (type === 'upazilas' && districtId) {
      const upazilas = await fetchUpazilaAlerts(districtId, parameter, fdate, forceReload);
      return NextResponse.json({ success: true, data: upazilas });
    }

    if (type === 'districts') {
      const districts = await fetchDistrictAlerts(parameter, fdate, forceReload);
      return NextResponse.json({ success: true, data: districts });
    }

    // Default 'all': returns counts + district list for the parameter
    const [counts, districts] = await Promise.all([
      fetchAlertCounts(forceReload),
      fetchDistrictAlerts(parameter, fdate, forceReload)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        counts,
        districts,
        parameter,
        fdate
      }
    });
  } catch (error) {
    console.error('API Error in /api/nlas/weather-alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch weather alert telemetry' },
      { status: 500 }
    );
  }
}
